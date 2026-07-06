"""
Feature 29: Alternative Data
Reads AppDownloadsGrowth, WebTrafficGrowth, SearchTrends,
SocialMentions, JobPostingsGrowth from stock_daily CSVs.
"""
import numpy as np
import pandas as pd
from typing import Dict, Any


def compute_alternative_data(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    stock_df = data.get("stock_daily")
    if stock_df is None or stock_df.empty:
        return {}

    latest = stock_df.iloc[-1]
    tail20 = stock_df.tail(20)

    def get(col, default=0.0):
        return float(latest.get(col, default))

    def avg20(col, default=0.0):
        return float(tail20[col].mean()) if col in stock_df.columns else default

    app_dl      = get("AppDownloadsGrowth")
    web_traffic = get("WebTrafficGrowth")
    search      = get("SearchTrends")
    social      = get("SocialMentions")
    jobs        = get("JobPostingsGrowth")

    # Trends vs 20-day average
    def trend(val, avg, label):
        if avg == 0.0:
            return "NEUTRAL"
        chg = (val - avg) / abs(avg) * 100
        if chg > 10.0:
            return f"RISING ({chg:+.1f}%)"
        elif chg < -10.0:
            return f"FALLING ({chg:+.1f}%)"
        else:
            return "STABLE"

    app_dl_trend = trend(app_dl, avg20("AppDownloadsGrowth"), "app_downloads")
    web_trend    = trend(web_traffic, avg20("WebTrafficGrowth"), "web_traffic")
    social_trend = trend(social, avg20("SocialMentions"), "social")
    job_trend    = trend(jobs, avg20("JobPostingsGrowth"), "jobs")

    # Composite alt-data score (0-100)
    score = 50.0
    score += min(20.0, app_dl * 0.3)
    score += min(15.0, web_traffic * 0.25)
    score += min(10.0, social * 0.1)
    score += min(10.0, jobs * 0.4)
    score = float(np.clip(score, 0.0, 100.0))

    signals = []
    if jobs > 10.0:
        signals.append(f"Strong job postings growth ({jobs:.1f}%) indicates business expansion")
    if app_dl > 20.0:
        signals.append(f"App downloads accelerating ({app_dl:.1f}%) — rising consumer adoption")
    if social > 30.0:
        signals.append(f"High social media buzz ({social:.1f}) — retail investor interest elevated")

    return {
        "alt_app_downloads_growth":  round(app_dl, 2),
        "alt_web_traffic_growth":    round(web_traffic, 2),
        "alt_search_trends":         round(search, 2),
        "alt_social_mentions":       round(social, 2),
        "alt_job_postings_growth":   round(jobs, 2),
        "alt_app_dl_trend":          app_dl_trend,
        "alt_web_trend":             web_trend,
        "alt_social_trend":          social_trend,
        "alt_job_trend":             job_trend,
        "alt_score":                 round(score, 1),
        "alt_signals":               signals,
    }
