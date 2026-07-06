"""
Feature 31: Analyst Consensus Layer
Reads AnalystBuy, AnalystHold, AnalystSell, TargetPriceRevision,
EstimateRevision columns already present in stock_daily CSVs.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_analyst_consensus(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    latest = stock_df.iloc[-1]
    tail20 = stock_df.tail(20)
    tail5  = stock_df.tail(5)

    buy  = float(latest.get("AnalystBuy", 0.0))
    hold = float(latest.get("AnalystHold", 0.0))
    sell = float(latest.get("AnalystSell", 0.0))
    total = buy + hold + sell + 1e-10

    buy_pct  = round(buy / total * 100, 1)
    hold_pct = round(hold / total * 100, 1)
    sell_pct = round(sell / total * 100, 1)

    # Recent revisions (5d vs 20d average)
    tp_rev_now   = float(tail5["TargetPriceRevision"].mean()) if "TargetPriceRevision" in stock_df.columns else 0.0
    tp_rev_20d   = float(tail20["TargetPriceRevision"].mean()) if "TargetPriceRevision" in stock_df.columns else 0.0
    est_rev_now  = float(tail5["EstimateRevision"].mean())  if "EstimateRevision" in stock_df.columns else 0.0
    est_rev_20d  = float(tail20["EstimateRevision"].mean()) if "EstimateRevision" in stock_df.columns else 0.0

    tp_revision_trend  = "RISING"   if tp_rev_now  > tp_rev_20d  else "FALLING"
    est_revision_trend = "RISING"   if est_rev_now > est_rev_20d else "FALLING"

    # Consensus label
    if buy_pct > 60.0:
        consensus = "BULLISH"
    elif sell_pct > 40.0:
        consensus = "BEARISH"
    else:
        consensus = "NEUTRAL"

    # Score (0-100)
    score = buy_pct * 0.6 + hold_pct * 0.3 + (100 - sell_pct) * 0.1
    score += min(10.0, tp_rev_now * 2.0)
    score += min(10.0, est_rev_now * 2.0)
    score = float(np.clip(score, 0.0, 100.0))

    return {
        "analyst_buy_count":           int(buy),
        "analyst_hold_count":          int(hold),
        "analyst_sell_count":          int(sell),
        "analyst_buy_pct":             buy_pct,
        "analyst_hold_pct":            hold_pct,
        "analyst_sell_pct":            sell_pct,
        "analyst_tp_revision_5d":      round(tp_rev_now, 3),
        "analyst_tp_revision_trend":   tp_revision_trend,
        "analyst_est_revision_5d":     round(est_rev_now, 3),
        "analyst_est_revision_trend":  est_revision_trend,
        "analyst_consensus":           consensus,
        "analyst_score":               round(score, 1),
        "analyst_signal": (
            f"{buy_pct:.0f}% BUY / {hold_pct:.0f}% HOLD / {sell_pct:.0f}% SELL. "
            f"TP revisions {tp_revision_trend}, Estimate revisions {est_revision_trend}."
        ),
    }
