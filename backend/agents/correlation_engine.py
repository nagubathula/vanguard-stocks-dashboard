"""
Feature 21: Correlation Engine
Computes rolling correlations between the stock and macro assets
(Crude Oil, Nasdaq, USD/INR, Copper, US10Y) using macro_indices data.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def _rolling_corr(s1: pd.Series, s2: pd.Series, window: int = 63) -> float:
    """Trailing N-day Pearson correlation of daily returns."""
    if len(s1) < window or len(s2) < window:
        return 0.0
    r1 = s1.pct_change().tail(window).dropna()
    r2 = s2.pct_change().tail(window).dropna()
    min_len = min(len(r1), len(r2))
    if min_len < 10:
        return 0.0
    return float(r1.iloc[-min_len:].corr(r2.iloc[-min_len:]))


def compute_correlation_engine(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    macro_df = data.get("macro_indices")

    if stock_df is None or stock_df.empty or macro_df is None or macro_df.empty:
        return {}

    stock_close = stock_df["Close"]

    # Align lengths (macro might have different rows)
    min_rows = min(len(stock_close), len(macro_df))
    stock_aligned = stock_close.iloc[-min_rows:].reset_index(drop=True)

    def get_macro(col):
        if col in macro_df.columns:
            return macro_df[col].iloc[-min_rows:].reset_index(drop=True)
        return None

    corr_map = {
        "crude_oil":   get_macro("CrudeOil"),
        "nasdaq":      get_macro("NASDAQ"),
        "usd_inr":     get_macro("USDINR"),
        "copper":      get_macro("Copper"),
        "us10y":       get_macro("US10Y"),
        "gold":        get_macro("Gold"),
        "india_vix":   get_macro("IndiaVIX"),
    }

    result: Dict[str, Any] = {}
    dominant_asset = None
    dominant_corr  = 0.0

    for label, series in corr_map.items():
        if series is not None and not series.empty:
            corr_63d = round(_rolling_corr(stock_aligned, series, 63), 3)
            corr_20d = round(_rolling_corr(stock_aligned, series, 20), 3)
            result[f"corr_{label}_63d"] = corr_63d
            result[f"corr_{label}_20d"] = corr_20d
            if abs(corr_63d) > abs(dominant_corr):
                dominant_corr  = corr_63d
                dominant_asset = label

    result["corr_dominant_asset"]    = dominant_asset
    result["corr_dominant_strength"] = round(dominant_corr, 3)

    if dominant_asset:
        direction = "POSITIVE" if dominant_corr > 0 else "NEGATIVE"
        result["corr_signal"] = f"{ticker} has strong {direction} correlation with {dominant_asset.upper()} ({dominant_corr:+.2f})"

    return result
