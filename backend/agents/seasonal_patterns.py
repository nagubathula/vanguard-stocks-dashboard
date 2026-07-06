"""
Feature 23: Seasonal Patterns
Analyses monthly and quarterly return distributions, earnings-season
performance, and festival-season effects using historical stock_daily data.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any, List


# Months known to be strong for specific sectors (India market)
SECTOR_SEASONALITY = {
    "Auto":   {"strong_months": [9, 10, 11], "weak_months": [5, 6]},   # Festive demand Oct/Nov
    "IT":     {"strong_months": [1, 4, 7, 10], "weak_months": [2, 8]}, # US earnings quarters
    "FMCG":   {"strong_months": [10, 11, 12], "weak_months": [6, 7]},  # Festive season
    "Pharma": {"strong_months": [1, 2, 3], "weak_months": [9, 10]},
    "Banking":{"strong_months": [3, 4], "weak_months": [7, 8]},
    "Metals": {"strong_months": [1, 2, 11, 12], "weak_months": [5, 6]},
    "Energy": {"strong_months": [11, 12, 1], "weak_months": [4, 5]},
    "Realty": {"strong_months": [3, 4, 10, 11], "weak_months": [7, 8]},
}


def compute_seasonal_patterns(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    df = stock_df.copy()
    if "Date" not in df.columns:
        return {}

    df["Date"] = pd.to_datetime(df["Date"])
    df = df.sort_values("Date")
    df["Month"] = df["Date"].dt.month
    df["Quarter"] = df["Date"].dt.quarter
    df["Year"]  = df["Date"].dt.year
    df["DailyReturn"] = df["Close"].pct_change() * 100

    # Monthly average returns
    monthly_avg = df.groupby("Month")["DailyReturn"].mean().to_dict()
    monthly_avg = {int(k): round(float(v), 3) for k, v in monthly_avg.items()}

    # Quarterly average returns
    quarterly_avg = df.groupby("Quarter")["DailyReturn"].mean().to_dict()
    quarterly_avg = {int(k): round(float(v), 3) for k, v in quarterly_avg.items()}

    # Best & worst months
    best_month  = max(monthly_avg, key=monthly_avg.get) if monthly_avg else None
    worst_month = min(monthly_avg, key=monthly_avg.get) if monthly_avg else None

    # Current month seasonality score
    today_month = pd.Timestamp.now().month
    curr_month_avg = monthly_avg.get(today_month, 0.0)

    # Sector-specific seasonality signal
    from data_generator import STOCKS_METADATA
    meta = STOCKS_METADATA.get(ticker.upper(), {})
    sector = meta.get("sector", "")
    seasonal_info = SECTOR_SEASONALITY.get(sector, {})
    strong_months = seasonal_info.get("strong_months", [])
    weak_months   = seasonal_info.get("weak_months", [])

    if today_month in strong_months:
        seasonal_signal = "SEASONAL_TAILWIND"
    elif today_month in weak_months:
        seasonal_signal = "SEASONAL_HEADWIND"
    else:
        seasonal_signal = "NEUTRAL"

    # Earnings season (India approx: Apr, Jul, Oct, Jan)
    earnings_months = [1, 4, 7, 10]
    in_earnings_season = today_month in earnings_months

    return {
        "sea_monthly_avg_returns":  monthly_avg,
        "sea_quarterly_avg_returns": quarterly_avg,
        "sea_best_month":           best_month,
        "sea_worst_month":          worst_month,
        "sea_current_month_avg":    curr_month_avg,
        "sea_seasonal_signal":      seasonal_signal,
        "sea_in_earnings_season":   in_earnings_season,
        "sea_strong_months":        strong_months,
        "sea_weak_months":          weak_months,
    }
