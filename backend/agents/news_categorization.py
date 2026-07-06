"""
Feature 30: AI News Categorization
Reads the news_feed CSV, categorizes each headline for the requested ticker
into Positive / Negative / Neutral, and generates a weighted impact score.
"""
import pandas as pd
import numpy as np
from typing import Dict, Any, List


POSITIVE_KEYWORDS = [
    "beat", "beats", "contract", "upgrade", "expansion", "growth", "wins", "record",
    "surge", "profit", "outperform", "buy", "increase", "gain", "rally", "positive",
    "strong", "capacity", "invest", "dividend", "buyback", "bonus"
]
NEGATIVE_KEYWORDS = [
    "miss", "misses", "downgrade", "decline", "risk", "loss", "regulatory", "probe",
    "investigation", "resign", "debt", "cut", "slump", "sell", "negative", "concern",
    "penalty", "notice", "fraud", "dispute", "drop", "fall", "warning"
]

CATEGORY_WEIGHTS = {
    "POSITIVE": {
        "Earnings Beat": 0.9,
        "New Contracts": 0.8,
        "Capacity Expansion": 0.7,
        "Analyst Upgrade": 0.85,
        "Other Positive": 0.6,
    },
    "NEGATIVE": {
        "Regulatory Issues": -0.85,
        "Management Changes": -0.65,
        "Debt Concerns": -0.75,
        "Analyst Downgrade": -0.8,
        "Other Negative": -0.55,
    },
    "NEUTRAL": {"Neutral": 0.0},
}


def _categorize_headline(headline: str, sentiment_score: float) -> str:
    h = headline.lower()
    if sentiment_score > 0.5:
        for kw in ["earnings", "eps", "profit", "beat"]:
            if kw in h: return "Earnings Beat"
        for kw in ["contract", "deal", "wins", "order"]:
            if kw in h: return "New Contracts"
        for kw in ["expansion", "capacity", "plant", "facility"]:
            if kw in h: return "Capacity Expansion"
        for kw in ["upgrade", "buy", "target"]:
            if kw in h: return "Analyst Upgrade"
        return "Other Positive"
    elif sentiment_score < -0.3:
        for kw in ["regulatory", "sebi", "notice", "probe", "investigation"]:
            if kw in h: return "Regulatory Issues"
        for kw in ["ceo", "director", "resign", "management"]:
            if kw in h: return "Management Changes"
        for kw in ["debt", "loan", "default", "rating"]:
            if kw in h: return "Debt Concerns"
        for kw in ["downgrade", "sell", "cut"]:
            if kw in h: return "Analyst Downgrade"
        return "Other Negative"
    return "Neutral"


def compute_news_categorization(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    news_df = data.get("news_feed")
    if news_df is None or news_df.empty:
        return {}

    # Filter relevant rows
    relevant = news_df[
        (news_df["Ticker"].str.upper() == ticker.upper()) |
        (news_df["Ticker"].str.upper() == "MACRO")
    ].tail(30)

    if relevant.empty:
        return {
            "news_cat_positive_count": 0,
            "news_cat_negative_count": 0,
            "news_cat_neutral_count":  0,
            "news_cat_impact_score":   0.0,
            "news_cat_top_positive":   [],
            "news_cat_top_negative":   [],
            "news_cat_signal":         "NO_NEWS",
        }

    categorized = []
    for _, row in relevant.iterrows():
        headline = str(row.get("Headline", ""))
        score    = float(row.get("SentimentScore", 0.0))
        cat      = _categorize_headline(headline, score)
        sentiment_class = "POSITIVE" if score > 0.15 else ("NEGATIVE" if score < -0.15 else "NEUTRAL")
        categorized.append({
            "headline":        headline,
            "sentiment_score": round(score, 3),
            "category":        cat,
            "class":           sentiment_class,
        })

    pos = [c for c in categorized if c["class"] == "POSITIVE"]
    neg = [c for c in categorized if c["class"] == "NEGATIVE"]
    neu = [c for c in categorized if c["class"] == "NEUTRAL"]

    # Weighted impact score
    impact_score = 0.0
    for c in categorized:
        weight = abs(c["sentiment_score"]) * (1.0 if c["class"] == "POSITIVE" else -1.0 if c["class"] == "NEGATIVE" else 0.0)
        impact_score += weight
    impact_score = round(float(np.clip(impact_score / max(len(categorized), 1), -1.0, 1.0)), 3)

    if impact_score > 0.3:
        news_signal = "BULLISH_NEWS"
    elif impact_score < -0.3:
        news_signal = "BEARISH_NEWS"
    else:
        news_signal = "MIXED_NEWS"

    return {
        "news_cat_positive_count": len(pos),
        "news_cat_negative_count": len(neg),
        "news_cat_neutral_count":  len(neu),
        "news_cat_impact_score":   impact_score,
        "news_cat_top_positive":   [c["headline"] for c in pos[:3]],
        "news_cat_top_negative":   [c["headline"] for c in neg[:3]],
        "news_cat_signal":         news_signal,
        "news_cat_detail":         categorized[:10],  # last 10 with categories
    }
