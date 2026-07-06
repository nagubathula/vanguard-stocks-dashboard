"""
Feature 28: ETF Flow Analysis
Reads the ETFFlow column already generated in stock_daily CSVs
and supplements with Nifty-level flows from the sector data.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_etf_flow(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    nifty_df = data.get("nifty_sectors")

    if stock_df is None or stock_df.empty:
        return {}

    # Per-stock ETF flows
    etf_today = 0.0
    etf_5d_sum = 0.0
    etf_20d_sum = 0.0
    etf_20d_avg = 0.0

    if "ETFFlow" in stock_df.columns:
        etf_today   = float(stock_df["ETFFlow"].iloc[-1])
        etf_5d_sum  = float(stock_df["ETFFlow"].tail(5).sum())
        etf_20d_sum = float(stock_df["ETFFlow"].tail(20).sum())
        etf_20d_avg = float(stock_df["ETFFlow"].tail(20).mean())

    # Nifty-level proxy: use SIP_Flow as a proxy for broad market ETF inflows
    sip_20d_avg = 0.0
    if "SIP_Flow" in stock_df.columns:
        sip_20d_avg = float(stock_df["SIP_Flow"].tail(20).mean())

    # Signal
    if etf_20d_sum > 500:
        etf_signal = "STRONG_INFLOW"
    elif etf_20d_sum > 0:
        etf_signal = "MODERATE_INFLOW"
    elif etf_20d_sum < -500:
        etf_signal = "STRONG_OUTFLOW"
    elif etf_20d_sum < 0:
        etf_signal = "MODERATE_OUTFLOW"
    else:
        etf_signal = "NEUTRAL"

    # Score: positive inflows → higher score
    score = 50.0 + min(30.0, etf_20d_avg * 0.3)
    score = float(np.clip(score, 0.0, 100.0))

    return {
        "etf_flow_today":     round(etf_today, 2),
        "etf_flow_5d":        round(etf_5d_sum, 2),
        "etf_flow_20d":       round(etf_20d_sum, 2),
        "etf_flow_20d_avg":   round(etf_20d_avg, 2),
        "etf_sip_flow_20d_avg": round(sip_20d_avg, 2),
        "etf_signal":         etf_signal,
        "etf_score":          round(score, 1),
    }
