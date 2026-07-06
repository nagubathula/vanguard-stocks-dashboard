"""
Feature 27: Multi-Timeframe Analysis
Evaluates Daily, Weekly, and Monthly trend signals using resampled
stock_daily OHLCV data — no extra data source needed.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def _trend_label(close: pd.Series, fast: int = 20, slow: int = 50) -> str:
    if len(close) < slow:
        return "NEUTRAL"
    ema_fast = close.ewm(span=fast, adjust=False).mean().iloc[-1]
    ema_slow = close.ewm(span=slow, adjust=False).mean().iloc[-1]
    curr = close.iloc[-1]
    if curr > ema_fast > ema_slow:
        return "BULLISH"
    elif curr < ema_fast < ema_slow:
        return "BEARISH"
    else:
        return "NEUTRAL"


def compute_multitimeframe(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    df = stock_df.copy()
    df["Date"] = pd.to_datetime(df["Date"])
    df = df.set_index("Date").sort_index()

    # Daily: use raw daily data
    daily_close = df["Close"]
    daily_trend = _trend_label(daily_close, fast=20, slow=50)
    daily_rsi   = float(df["RSI_14"].iloc[-1]) if "RSI_14" in df.columns else 50.0

    # Weekly: resample to weekly
    weekly_df = df["Close"].resample("W").last().dropna()
    weekly_trend = _trend_label(weekly_df, fast=10, slow=26)

    # Monthly: resample to monthly
    monthly_df = df["Close"].resample("ME").last().dropna()
    monthly_trend = _trend_label(monthly_df, fast=5, slow=12)

    # Alignment score
    labels = [daily_trend, weekly_trend, monthly_trend]
    bullish_count = labels.count("BULLISH")
    bearish_count = labels.count("BEARISH")

    if bullish_count == 3:
        alignment = "FULL_BULLISH"
        confidence_boost = 0.12
    elif bearish_count == 3:
        alignment = "FULL_BEARISH"
        confidence_boost = 0.12
    elif bullish_count == 2:
        alignment = "MOSTLY_BULLISH"
        confidence_boost = 0.06
    elif bearish_count == 2:
        alignment = "MOSTLY_BEARISH"
        confidence_boost = 0.06
    else:
        alignment = "MIXED"
        confidence_boost = 0.0

    return {
        "mtf_daily_trend":        daily_trend,
        "mtf_weekly_trend":       weekly_trend,
        "mtf_monthly_trend":      monthly_trend,
        "mtf_daily_rsi":          round(daily_rsi, 1),
        "mtf_alignment":          alignment,
        "mtf_confidence_boost":   confidence_boost,
        "mtf_signal": (
            f"Daily={daily_trend} | Weekly={weekly_trend} | Monthly={monthly_trend} → {alignment}"
        ),
    }
