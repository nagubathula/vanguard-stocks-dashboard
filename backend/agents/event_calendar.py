"""
Feature 22: Event Calendar Engine
Generates upcoming key events (RBI, FOMC, CPI, Budget, etc.) with
pre-event risk scoring that reduces false signals near event dates.
"""
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, Any, List


# Static event calendar — in a production system these would come from an API
def _build_event_calendar() -> List[Dict]:
    today = datetime.now().date()
    events = []

    # Indian events (approximate 2026 schedule)
    india_events = [
        ("RBI Policy Meeting",        "INDIA_MACRO", "HIGH"),
        ("Union Budget",              "INDIA_MACRO", "VERY_HIGH"),
        ("Q1 Earnings Season Start",  "EARNINGS",    "MEDIUM"),
        ("Q2 Earnings Season Start",  "EARNINGS",    "MEDIUM"),
        ("Q3 Earnings Season Start",  "EARNINGS",    "MEDIUM"),
        ("Q4 Earnings Season Start",  "EARNINGS",    "MEDIUM"),
    ]

    # FOMC / Global events (approximate)
    global_events = [
        ("FOMC Meeting",   "GLOBAL_MACRO", "HIGH"),
        ("US CPI Release", "GLOBAL_MACRO", "MEDIUM"),
        ("US Non-Farm Payrolls", "GLOBAL_MACRO", "MEDIUM"),
        ("ECB Rate Decision",    "GLOBAL_MACRO", "MEDIUM"),
        ("BOJ Policy Meeting",   "GLOBAL_MACRO", "LOW"),
    ]

    # Spread events across next 180 days
    india_offsets = [18, 40, 75, 105, 165, 200]
    for (name, category, risk), offset in zip(india_events, india_offsets):
        event_date = today + timedelta(days=offset)
        events.append({
            "name": name,
            "date": str(event_date),
            "days_away": offset,
            "category": category,
            "risk_level": risk,
        })

    global_offsets = [10, 25, 55, 85, 115]
    for (name, category, risk), offset in zip(global_events, global_offsets):
        event_date = today + timedelta(days=offset)
        events.append({
            "name": name,
            "date": str(event_date),
            "days_away": offset,
            "category": category,
            "risk_level": risk,
        })

    return sorted(events, key=lambda x: x["days_away"])


def compute_event_calendar(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    events = _build_event_calendar()

    # EventRiskDays column: proxy for how close we are to a risk event
    stock_df = data.get("stock_daily")
    event_risk_flag = 0
    if stock_df is not None and "EventRiskDays" in stock_df.columns:
        event_risk_val = int(stock_df["EventRiskDays"].iloc[-1])
        # EventRiskDays cycles 0-24 (from data_generator); 0 = event day
        event_risk_flag = 1 if event_risk_val < 3 else 0

    # Find next high-impact event
    next_high_event = next((e for e in events if e["risk_level"] in ("HIGH", "VERY_HIGH")), None)
    days_to_next_high = next_high_event["days_away"] if next_high_event else 999

    # Pre-event risk score: discount signals if within 3 days of high-impact event
    pre_event_risk_discount = 0.0
    if days_to_next_high <= 3:
        pre_event_risk_discount = 0.85   # 15% confidence reduction
    elif days_to_next_high <= 7:
        pre_event_risk_discount = 0.95   # 5% confidence reduction
    else:
        pre_event_risk_discount = 1.0    # no reduction

    return {
        "evt_upcoming_events":         events[:5],   # next 5 events
        "evt_next_high_impact":        next_high_event["name"] if next_high_event else "None",
        "evt_days_to_next_high":       days_to_next_high,
        "evt_pre_event_risk_discount": pre_event_risk_discount,
        "evt_risk_window_active":      event_risk_flag == 1,
    }
