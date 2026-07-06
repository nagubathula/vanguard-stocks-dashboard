"""
Feature 26: Market Structure Analysis
Tracks Higher Highs, Higher Lows, Lower Highs, Lower Lows, trend breaks,
and structure shifts — reading the pre-computed columns from stock_daily.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_market_structure(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    tail20  = stock_df.tail(20)
    latest  = stock_df.iloc[-1]

    # Read pre-computed columns if available
    def col_sum(col):
        return int(tail20[col].sum()) if col in tail20.columns else 0

    hh = col_sum("HigherHigh")
    hl = col_sum("HigherLow")
    lh = col_sum("LowerHigh")
    ll = col_sum("LowerLow")

    # Determine structure
    if hh >= 3 and hl >= 3:
        structure = "UPTREND"
        structure_signal = "Strong bullish market structure with consecutive Higher Highs & Higher Lows"
    elif lh >= 3 and ll >= 3:
        structure = "DOWNTREND"
        structure_signal = "Bearish market structure with consecutive Lower Highs & Lower Lows"
    elif (hh >= 2 and ll >= 1) or (lh >= 2 and hl >= 1):
        structure = "TRANSITION"
        structure_signal = "Mixed structure — possible trend break or rotation in progress"
    else:
        structure = "RANGING"
        structure_signal = "Ranging/sideways structure — no clear directional bias"

    # Trend break detection: compare last 5 vs prior 15 sessions
    close = stock_df["Close"]
    ret_last5  = float((close.iloc[-1] - close.iloc[-6]) / close.iloc[-6] * 100) if len(close) >= 6 else 0.0
    ret_prior15 = float((close.iloc[-6] - close.iloc[-21]) / close.iloc[-21] * 100) if len(close) >= 21 else 0.0

    trend_break = False
    if ret_prior15 > 3.0 and ret_last5 < -2.0:
        trend_break = True
        structure_signal += " | BEARISH TREND BREAK detected"
    elif ret_prior15 < -3.0 and ret_last5 > 2.0:
        trend_break = True
        structure_signal += " | BULLISH TREND BREAK detected"

    # Structure shift: use SuperTrend_Direction if available
    structure_shift = False
    if "SuperTrend_Direction" in stock_df.columns:
        st_dir = stock_df["SuperTrend_Direction"]
        if len(st_dir) >= 2 and st_dir.iloc[-1] != st_dir.iloc[-2]:
            structure_shift = True
            dir_label = "BULLISH" if st_dir.iloc[-1] == 1 else "BEARISH"
            structure_signal += f" | SuperTrend {dir_label} structure shift"

    return {
        "mst_higher_highs_20d":    hh,
        "mst_higher_lows_20d":     hl,
        "mst_lower_highs_20d":     lh,
        "mst_lower_lows_20d":      ll,
        "mst_structure":           structure,
        "mst_trend_break":         trend_break,
        "mst_structure_shift":     structure_shift,
        "mst_signal":              structure_signal,
        "mst_ret_last_5d":         round(ret_last5, 2),
        "mst_ret_prior_15d":       round(ret_prior15, 2),
    }
