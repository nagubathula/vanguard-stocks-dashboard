"""
Feature 17: Smart Money Tracking
Reads BlockDealsVolume, BulkDealsVolume, PromoterBuying, PromoterSelling,
PromoterPledging, MFHoldingChange columns that are already in stock_daily CSVs.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_smart_money(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    latest = stock_df.iloc[-1]
    tail5  = stock_df.tail(5)
    tail20 = stock_df.tail(20)

    # Block & Bulk Deals
    block_vol       = float(latest.get("BlockDealsVolume", 0.0))
    bulk_vol        = float(latest.get("BulkDealsVolume", 0.0))
    block_5d_avg    = float(tail5["BlockDealsVolume"].mean()) if "BlockDealsVolume" in stock_df.columns else 0.0
    bulk_5d_avg     = float(tail5["BulkDealsVolume"].mean()) if "BulkDealsVolume" in stock_df.columns else 0.0

    # Insider / Promoter activity
    promoter_buying  = int(tail20["PromoterBuying"].sum()) if "PromoterBuying" in stock_df.columns else 0
    promoter_selling = int(tail20["PromoterSelling"].sum()) if "PromoterSelling" in stock_df.columns else 0
    insider_net      = promoter_buying - promoter_selling

    # Promoter pledging
    pledging_now  = float(latest.get("PromoterPledging", 0.0))
    pledging_prev = float(stock_df["PromoterPledging"].iloc[-20]) if "PromoterPledging" in stock_df.columns and len(stock_df) >= 20 else pledging_now
    pledging_change = round(pledging_now - pledging_prev, 2)

    # MF Holding changes
    mf_change_1m = float(tail20["MFHoldingChange"].sum()) if "MFHoldingChange" in stock_df.columns else 0.0

    # Signals
    signals = []
    if block_5d_avg > 20.0:
        signals.append("Large block deal activity detected")
    if insider_net > 2:
        signals.append(f"Insider net buying: +{insider_net} events in last 20 sessions")
    elif insider_net < -2:
        signals.append(f"Insider net selling: {insider_net} events in last 20 sessions")
    if pledging_change > 2.0:
        signals.append(f"Promoter pledging increased by {pledging_change:.1f}% — caution flag")
    elif pledging_change < -2.0:
        signals.append(f"Promoter pledging reduced by {abs(pledging_change):.1f}% — positive signal")
    if mf_change_1m > 0.5:
        signals.append(f"Mutual fund accumulation: +{mf_change_1m:.2f}% net holding increase")

    # Smart money score (0-100)
    score = 50.0
    score += min(20.0, block_5d_avg * 0.4)
    score += insider_net * 5.0
    score -= pledging_change * 2.0
    score += mf_change_1m * 10.0
    score = float(np.clip(score, 0.0, 100.0))

    return {
        "sm_block_deal_volume":   round(block_vol, 2),
        "sm_bulk_deal_volume":    round(bulk_vol, 2),
        "sm_block_5d_avg":        round(block_5d_avg, 2),
        "sm_insider_net_events":  insider_net,
        "sm_promoter_buying_20d": promoter_buying,
        "sm_promoter_selling_20d": promoter_selling,
        "sm_pledging_pct":        round(pledging_now, 2),
        "sm_pledging_change_1m":  pledging_change,
        "sm_mf_holding_change_1m": round(mf_change_1m, 4),
        "sm_signals":             signals,
        "sm_score":               round(score, 1),
    }
