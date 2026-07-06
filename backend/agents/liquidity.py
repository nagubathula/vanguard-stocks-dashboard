"""
Feature 18: Liquidity Intelligence
Reads DailyTradedValue, BidAskSpread, MarketDepth, OrderBookImbalance columns
already present in stock_daily CSVs.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_liquidity(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    latest = stock_df.iloc[-1]
    tail20 = stock_df.tail(20)

    # Daily Traded Value (Cr)
    dtv_today = float(latest.get("DailyTradedValue", 0.0))
    dtv_20d_avg = float(tail20["DailyTradedValue"].mean()) if "DailyTradedValue" in stock_df.columns else dtv_today

    # Bid-Ask Spread
    spread = float(latest.get("BidAskSpread", 0.05))
    spread_20d_avg = float(tail20["BidAskSpread"].mean()) if "BidAskSpread" in stock_df.columns else spread

    # Market Depth (ratio >1 = more bids than asks)
    depth = float(latest.get("MarketDepth", 1.0))

    # Order Book Imbalance (-100 to 100; positive = more buy pressure)
    obi = float(latest.get("OrderBookImbalance", 0.0))

    # Liquidity Score (0-100)
    # High traded value → higher score; tight spread → higher score; balanced depth → neutral
    score = 50.0
    if dtv_20d_avg > 100.0:
        score += 20.0
    elif dtv_20d_avg > 50.0:
        score += 10.0
    elif dtv_20d_avg < 5.0:
        score -= 15.0

    if spread < 0.02:
        score += 15.0
    elif spread > 0.08:
        score -= 15.0

    if abs(obi) < 10.0:
        score += 5.0
    elif abs(obi) > 40.0:
        score -= 5.0

    score = float(np.clip(score, 0.0, 100.0))

    # Category
    if score >= 70:
        liq_category = "HIGH"
    elif score >= 40:
        liq_category = "MEDIUM"
    else:
        liq_category = "LOW"

    return {
        "liq_dtv_today_cr":    round(dtv_today, 2),
        "liq_dtv_20d_avg_cr":  round(dtv_20d_avg, 2),
        "liq_bid_ask_spread":  round(spread, 4),
        "liq_spread_20d_avg":  round(spread_20d_avg, 4),
        "liq_market_depth":    round(depth, 3),
        "liq_order_book_imbalance": round(obi, 2),
        "liq_score":           round(score, 1),
        "liq_category":        liq_category,
    }
