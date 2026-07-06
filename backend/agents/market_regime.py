"""
Feature 20: Market Regime Detection (extended)
Augments the existing RegimeDetector with VIX level, breadth %,
trend strength (ADX proxy), and index momentum — all from loaded data.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_market_regime(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    nifty_df = data.get("nifty_sectors")
    macro_df = data.get("macro_indices")

    if nifty_df is None or nifty_df.empty:
        return {}
    if macro_df is None or macro_df.empty:
        return {}

    nifty_close = nifty_df["Nifty50"]
    vix_series  = macro_df["IndiaVIX"] if "IndiaVIX" in macro_df.columns else pd.Series([15.0])

    # VIX
    vix_now = float(vix_series.iloc[-1])
    vix_20d_avg = float(vix_series.tail(20).mean())

    # Market Breadth: % sectors above 50-day EMA
    sectors = ["Banking", "IT", "Pharma", "Auto", "FMCG", "Metals", "Energy", "Realty"]
    above_count = 0
    for s in sectors:
        if s in nifty_df.columns:
            s_close  = nifty_df[s]
            s_ema50  = s_close.ewm(span=50, adjust=False).mean().iloc[-1]
            if s_close.iloc[-1] > s_ema50:
                above_count += 1
    breadth_pct = round(above_count / len(sectors) * 100.0, 1)

    # Trend Strength: 20-day Nifty return as momentum proxy
    n20_ret = 0.0
    if len(nifty_close) >= 21:
        n20_ret = float((nifty_close.iloc[-1] - nifty_close.iloc[-21]) / nifty_close.iloc[-21] * 100)

    # Index Momentum: EMA50 vs EMA200
    ema50  = float(nifty_close.ewm(span=50, adjust=False).mean().iloc[-1])
    ema200 = float(nifty_close.ewm(span=200, adjust=False).mean().iloc[-1])
    curr   = float(nifty_close.iloc[-1])
    trend_structure = "UPTREND" if (curr > ema50 > ema200) else ("DOWNTREND" if curr < ema200 else "MIXED")

    # Regime label (mirrors existing RegimeDetector logic)
    if vix_now > 24.0 and n20_ret < -3.0:
        regime_ext = "PANIC"
    elif curr < ema200 and n20_ret > 2.0 and vix_now < 22.0:
        regime_ext = "RECOVERY"
    elif curr < ema200:
        regime_ext = "BEAR"
    elif curr > ema200 and curr > ema50 and ema50 > ema200 and vix_now < 16.0 and n20_ret > 2.5:
        regime_ext = "STRONG_BULL"
    elif curr > ema200:
        regime_ext = "WEAK_BULL"
    else:
        regime_ext = "SIDEWAYS"

    # VIX regime category
    if vix_now > 25.0:
        vix_regime = "FEAR"
    elif vix_now > 18.0:
        vix_regime = "CAUTIOUS"
    elif vix_now < 13.0:
        vix_regime = "COMPLACENT"
    else:
        vix_regime = "NORMAL"

    return {
        "regime_ext_label":     regime_ext,
        "regime_vix":           round(vix_now, 2),
        "regime_vix_20d_avg":   round(vix_20d_avg, 2),
        "regime_vix_category":  vix_regime,
        "regime_market_breadth_pct": breadth_pct,
        "regime_nifty_20d_ret": round(n20_ret, 2),
        "regime_trend_structure": trend_structure,
        "regime_nifty_ema50":   round(ema50, 2),
        "regime_nifty_ema200":  round(ema200, 2),
    }
