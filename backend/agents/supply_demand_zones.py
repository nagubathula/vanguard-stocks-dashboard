"""
Feature 25: Supply & Demand Zones
Identifies key support/resistance levels and volume nodes
using the last 252 days of stock_daily OHLCV data.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List


def _find_local_extrema(series: pd.Series, window: int = 5) -> (List[float], List[float]):
    highs, lows = [], []
    vals = series.values
    for i in range(window, len(vals) - window):
        if vals[i] == max(vals[i-window:i+window+1]):
            highs.append(float(vals[i]))
        if vals[i] == min(vals[i-window:i+window+1]):
            lows.append(float(vals[i]))
    return sorted(set(round(h, 2) for h in highs), reverse=True), \
           sorted(set(round(l, 2) for l in lows))


def compute_supply_demand_zones(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    df = stock_df.tail(252).copy()
    close  = df["Close"]
    high   = df["High"]
    low    = df["Low"]
    volume = df["Volume"]
    curr_price = float(close.iloc[-1])

    # Support: pre-computed column if available, else calculate
    if "SupportZone" in df.columns:
        support_zone = float(df["SupportZone"].iloc[-1])
    else:
        support_zone = float(low.rolling(20).min().iloc[-1])

    if "ResistanceZone" in df.columns:
        resistance_zone = float(df["ResistanceZone"].iloc[-1])
    else:
        resistance_zone = float(high.rolling(20).max().iloc[-1])

    # Local swing highs/lows for demand & supply zones
    swing_highs, swing_lows = _find_local_extrema(close, window=5)

    # Nearest supply zone (resistance above current price)
    supply_zones  = [h for h in swing_highs if h > curr_price][:3]
    demand_zones  = [l for l in swing_lows  if l < curr_price][:3]

    # Volume Node: price level with highest cumulative volume (simplified)
    price_bins = pd.cut(close, bins=20)
    vol_by_price = df.groupby(price_bins, observed=True)["Volume"].sum()
    high_vol_node_idx = vol_by_price.idxmax()
    volume_node = None
    if high_vol_node_idx is not None:
        volume_node = round(float(high_vol_node_idx.mid), 2)

    # Price position relative to zones
    pct_from_support    = round((curr_price - support_zone) / (support_zone + 1e-10) * 100, 2)
    pct_from_resistance = round((resistance_zone - curr_price) / (curr_price + 1e-10) * 100, 2)

    # Signal
    if pct_from_support < 2.0:
        zone_signal = "NEAR_DEMAND_ZONE"
    elif pct_from_resistance < 2.0:
        zone_signal = "NEAR_SUPPLY_ZONE"
    else:
        zone_signal = "MID_RANGE"

    return {
        "sdz_current_price":       round(curr_price, 2),
        "sdz_support_zone":        round(support_zone, 2),
        "sdz_resistance_zone":     round(resistance_zone, 2),
        "sdz_demand_zones":        demand_zones,
        "sdz_supply_zones":        supply_zones,
        "sdz_volume_node":         volume_node,
        "sdz_pct_from_support":    pct_from_support,
        "sdz_pct_from_resistance": pct_from_resistance,
        "sdz_zone_signal":         zone_signal,
    }
