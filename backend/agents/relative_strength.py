"""
Feature 16: Relative Strength Intelligence
Computes return-based relative strength of a stock vs Nifty 50,
Sensex proxy, sector index, midcap proxy, and up to 5 peers —
all using data already loaded from the existing CSV files.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def _pct_change(series: pd.Series, periods: int) -> float:
    """Return % change over last `periods` rows, 0 if not enough data."""
    series = series.dropna()
    if len(series) < periods + 1:
        return 0.0
    val = float((series.iloc[-1] - series.iloc[-periods]) / (abs(series.iloc[-periods]) + 1e-10) * 100.0)
    return round(val, 2)


# Nifty 50 sector → sector-index column in nifty_sectors.csv
SECTOR_COLUMN_MAP = {
    "Energy":   "Energy",
    "IT":       "IT",
    "Banking":  "Banking",
    "FMCG":     "FMCG",
    "Auto":     "Auto",
    "Pharma":   "Pharma",
    "Metals":   "Metals",
    "Realty":   "Realty",
}

# Simple peer mapping (same data files available in data_generator)
PEER_SECTORS = {
    "RELIANCE":   ["TCS", "ITC"],
    "TCS":        ["INFYS", "WIPRO", "HCLTECH"],
    "HDFCBANK":   ["ICICIBANK", "SBIN", "AXISBANK", "KOTAKBANK"],
    "ICICIBANK":  ["HDFCBANK", "SBIN", "AXISBANK"],
    "SBIN":       ["HDFCBANK", "ICICIBANK", "AXISBANK"],
    "ITC":        ["HINDUNILVR"],
    "HINDUNILVR": ["ITC"],
    "TATAMOTORS": ["MARUTI"],
    "MARUTI":     ["TATAMOTORS"],
    "SUNPHARMA":  ["CIPLA"],
    "CIPLA":      ["SUNPHARMA"],
    "TATASTEEL":  ["JSWSTEEL"],
    "JSWSTEEL":   ["TATASTEEL"],
    "INFYS":      ["TCS", "HCLTECH"],
    "LT":         ["RELIANCE"],
}


def compute_relative_strength(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df  = data.get("stock_daily")
    nifty_df  = data.get("nifty_sectors")
    macro_df  = data.get("macro_indices")

    if stock_df is None or stock_df.empty:
        return {}
    if nifty_df is None or nifty_df.empty:
        return {}

    stock_close = stock_df["Close"]
    nifty_close = nifty_df["Nifty50"] if "Nifty50" in nifty_df.columns else None

    # Determine sector column for this ticker
    from data_generator import STOCKS_METADATA
    meta = STOCKS_METADATA.get(ticker.upper(), {})
    sector = meta.get("sector", "")
    sector_col = SECTOR_COLUMN_MAP.get(sector)
    sector_close = nifty_df[sector_col] if (sector_col and sector_col in nifty_df.columns) else None

    # Sensex proxy — use SP500 column from macro as a cross-market proxy, or Nifty if unavailable
    sensex_close = macro_df["SP500"] if (macro_df is not None and "SP500" in macro_df.columns) else nifty_close

    periods = {"1W": 5, "1M": 21, "3M": 63, "52W": 252}
    result: Dict[str, Any] = {}

    for label, p in periods.items():
        stock_ret = _pct_change(stock_close, p)
        result[f"rs_stock_ret_{label}"] = stock_ret

        if nifty_close is not None:
            result[f"rs_vs_nifty_{label}"] = round(stock_ret - _pct_change(nifty_close, p), 2)

        if sector_close is not None:
            result[f"rs_vs_sector_{label}"] = round(stock_ret - _pct_change(sector_close, p), 2)

        if sensex_close is not None:
            result[f"rs_vs_sensex_{label}"] = round(stock_ret - _pct_change(sensex_close, p), 2)

    # 52-Week rank (percentile of 1Y return among stock's own rolling windows)
    if len(stock_close) >= 252:
        # Vectorized calculation matching _pct_change(series, 252)
        rets = ((stock_close - stock_close.shift(251)) / (stock_close.shift(251).abs() + 1e-10) * 100.0)
        rolling_1y_rets = rets.iloc[252::10].tolist()
        current_1y = rets.iloc[-1]
        if rolling_1y_rets:
            rank = float(np.mean([current_1y > r for r in rolling_1y_rets]) * 100)
            result["rs_52w_rank_pct"] = round(rank, 1)
        else:
            result["rs_52w_rank_pct"] = None
    else:
        result["rs_52w_rank_pct"] = None

    # Summary signal
    rs_1m = result.get("rs_vs_nifty_1M", 0.0)
    if rs_1m > 3.0:
        result["rs_signal"] = "OUTPERFORMING"
    elif rs_1m < -3.0:
        result["rs_signal"] = "UNDERPERFORMING"
    else:
        result["rs_signal"] = "IN-LINE"

    return result
