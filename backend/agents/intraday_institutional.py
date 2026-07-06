"""
Feature 19: Intraday Institutional Activity
Reads OpeningGapPct, FirstHourVolumePct, VWAP, ClosingAuctionStrength
columns already present in stock_daily CSVs.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_intraday_institutional(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    latest = stock_df.iloc[-1]
    tail5  = stock_df.tail(5)

    # Opening Gap
    gap_pct     = float(latest.get("OpeningGapPct", 0.0))
    gap_5d_avg  = float(tail5["OpeningGapPct"].mean()) if "OpeningGapPct" in stock_df.columns else 0.0

    # First-hour volume %
    fh_vol_pct  = float(latest.get("FirstHourVolumePct", 30.0))
    fh_5d_avg   = float(tail5["FirstHourVolumePct"].mean()) if "FirstHourVolumePct" in stock_df.columns else 30.0

    # VWAP position (close vs VWAP)
    close_price = float(latest.get("Close", 0.0))
    vwap        = float(latest.get("VWAP", close_price))
    vwap_pos_pct = round((close_price - vwap) / (vwap + 1e-10) * 100, 2) if vwap else 0.0

    # Closing Auction Strength
    close_strength = float(latest.get("ClosingAuctionStrength", 0.0))
    close_5d_avg   = float(tail5["ClosingAuctionStrength"].mean()) if "ClosingAuctionStrength" in stock_df.columns else 0.0

    # Institutional buying zones: close > VWAP + first-hour vol high = institutional buying
    inst_buying = (close_price > vwap) and (fh_vol_pct > 35.0)
    inst_signal = "INSTITUTIONAL_BUYING" if inst_buying else ("INSTITUTIONAL_SELLING" if close_price < vwap else "NEUTRAL")

    # Score 0-100
    score = 50.0
    score += gap_pct * 3.0          # positive gap = bullish open
    if fh_vol_pct > 35.0:
        score += 10.0                # strong first-hour volume
    score += vwap_pos_pct * 2.0     # close above VWAP = bullish
    score += close_strength * 0.5   # positive closing auction = buying interest
    score = float(np.clip(score, 0.0, 100.0))

    return {
        "intra_opening_gap_pct":       round(gap_pct, 2),
        "intra_gap_5d_avg":            round(gap_5d_avg, 2),
        "intra_first_hour_vol_pct":    round(fh_vol_pct, 2),
        "intra_first_hour_5d_avg":     round(fh_5d_avg, 2),
        "intra_vwap":                  round(vwap, 2),
        "intra_close_vs_vwap_pct":     vwap_pos_pct,
        "intra_closing_auction_strength": round(close_strength, 2),
        "intra_close_auction_5d_avg":  round(close_5d_avg, 2),
        "intra_institutional_signal":  inst_signal,
        "intra_score":                 round(score, 1),
    }
