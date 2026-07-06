import pandas as pd
import numpy as np
from typing import Dict, Any, List
from agents.base import BaseAgent
from data_generator import STOCKS_METADATA

class NewsAgent(BaseAgent):
    def __init__(self):
        super().__init__("News Agent", 0.10)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        news_df = data["news_feed"]
        meta = STOCKS_METADATA.get(ticker, {"sector": "Banking"})
        sector = meta["sector"]
        
        # Convert date column and filter for the last 14 days
        news_df["Date"] = pd.to_datetime(news_df["Date"])
        latest_date = news_df["Date"].max()
        cutoff_date = latest_date - pd.Timedelta(days=14)
        recent_news = news_df[news_df["Date"] >= cutoff_date]
        
        # 1. Company news
        company_news = recent_news[recent_news["Ticker"] == ticker]
        
        # 2. Sector news (all news related to stocks in this sector)
        sector_tickers = [t for t, m in STOCKS_METADATA.items() if m["sector"] == sector]
        sector_news = recent_news[recent_news["Ticker"].isin(sector_tickers)]
        
        # 3. Macro news (global macro and economic events)
        macro_news = recent_news[recent_news["Ticker"] == "MACRO"]
        
        reasoning = []
        recent_headlines = []
        
        company_sentiment = 0.0
        sector_sentiment = 0.0
        macro_sentiment = 0.0
        
        # Compute company sentiment
        if not company_news.empty:
            company_sentiment = float(company_news["SentimentScore"].mean())
            # Collect headlines
            for _, r in company_news.sort_values("Date", ascending=False).head(5).iterrows():
                recent_headlines.append({
                    "date": r["Date"].strftime("%Y-%m-%d"),
                    "headline": r["Headline"],
                    "sentiment": float(r["SentimentScore"]),
                    "url": r.get("URL", r.get("url", ""))
                })
            reasoning.append(f"Analyzed {len(company_news)} news items for {ticker} over the last 14 days.")
        else:
            company_sentiment = 0.0 # Neutral
            reasoning.append(f"No company-specific news found for {ticker} in the last 14 days. Defaulting to neutral sentiment.")
            
        # Compute sector sentiment
        if not sector_news.empty:
            sector_sentiment = float(sector_news["SentimentScore"].mean())
            if not company_news.empty:
                reasoning.append(f"Sector '{sector}' sentiment is averaging {sector_sentiment:+.2f}, relative to stock sentiment of {company_sentiment:+.2f}.")
            else:
                reasoning.append(f"Sector '{sector}' sentiment is averaging {sector_sentiment:+.2f}.")
        else:
            sector_sentiment = 0.0
            
        # Compute macro sentiment
        if not macro_news.empty:
            macro_sentiment = float(macro_news["SentimentScore"].mean())
            reasoning.append(f"Global macro/policy sentiment is averaging {macro_sentiment:+.2f} across {len(macro_news)} items.")
            # Collect some macro headlines
            for _, r in macro_news.sort_values("Date", ascending=False).head(3).iterrows():
                recent_headlines.append({
                    "date": r["Date"].strftime("%Y-%m-%d"),
                    "headline": r["Headline"],
                    "sentiment": float(r["SentimentScore"]),
                    "url": r.get("URL", r.get("url", ""))
                })
        else:
            macro_sentiment = 0.0
            
        # Blend sentiment: 50% company specific, 25% broader sector, 25% macro economic
        blended_sentiment = 0.5 * company_sentiment + 0.25 * sector_sentiment + 0.25 * macro_sentiment
        
        # Convert blended sentiment (-1.0 to 1.0) to Score (0 - 100)
        # 0.0 maps to 50
        # Positive sentiment climbs to 100, negative drops to 0
        score = 50.0 + blended_sentiment * 50.0
        
        if blended_sentiment > 0.4:
            reasoning.append("Media coverage is highly positive, driven by strong growth outlook and positive catalysts.")
        elif blended_sentiment > 0.15:
            reasoning.append("Sentiment is moderately optimistic, supported by favorable industry conditions.")
        elif blended_sentiment < -0.4:
            reasoning.append("Urgent Warning: Media coverage is highly bearish. Negative headwinds or audit triggers identified.")
        elif blended_sentiment < -0.15:
            reasoning.append("Sentiment is cautious. Profit booking or regulatory warnings drag stock outlook.")

        # Alternative Data (29)
        df = data["stock_daily"]
        row = df.iloc[-1]
        app_growth     = float(row.get("AppDownloadsGrowth", 20.0))
        web_traffic    = float(row.get("WebTrafficGrowth", 15.0))
        search_trends  = float(row.get("SearchTrends", 8.0))
        social_mentions = float(row.get("SocialMentions", 12.0))
        job_postings   = float(row.get("JobPostingsGrowth", 5.0))

        alt_data_score = float(np.clip(50.0 + (app_growth + web_traffic + search_trends + job_postings) / 4.0, 10.0, 100.0))
        score = 0.8 * score + 0.2 * alt_data_score

        reasoning.append(f"Alternative Data: App growth {app_growth:+.1f}%, Web traffic {web_traffic:+.1f}% → solid user engagement signals.")

        # AI News Categorization (30)
        pos_count = neg_count = neut_count = 0
        for hl_item in recent_headlines:
            sent = hl_item["sentiment"]
            if sent > 0.15:
                pos_count += 1
            elif sent < -0.15:
                neg_count += 1
            else:
                neut_count += 1

        tot_hl = len(recent_headlines)
        pos_pct  = (pos_count  / tot_hl * 100) if tot_hl > 0 else 0.0
        neg_pct  = (neg_count  / tot_hl * 100) if tot_hl > 0 else 0.0
        neut_pct = (neut_count / tot_hl * 100) if tot_hl > 0 else 0.0

        # ── 29/30. Source-Split Sentiment Breakdown ─────────────────────────────
        # We use alternative data proxies to construct per-source buckets.
        # news_sentiment   → blended company + macro news score
        # social_sentiment → normalised social mentions proxy
        # blog_sentiment   → normalised search trends proxy (organic interest)
        # pr_sentiment     → company press / corporate action sentiment

        news_sentiment   = float(np.clip(blended_sentiment, -1.0, 1.0))
        social_sentiment = float(np.clip((social_mentions - 12.0) / 80.0 + company_sentiment * 0.4, -1.0, 1.0))
        blog_sentiment   = float(np.clip((search_trends - 8.0) / 25.0 + sector_sentiment * 0.3, -1.0, 1.0))
        pr_sentiment     = float(np.clip(company_sentiment * 0.6 + macro_sentiment * 0.4 + np.random.normal(0, 0.05), -1.0, 1.0))

        if social_mentions > 50.0:
            reasoning.append(f"High Social Mentions (+{social_mentions:.0f}%) indicates retail buzz; aligns with sentiment {social_sentiment:+.2f}.")
        if job_postings > 20.0:
            reasoning.append(f"Job Postings Growth at {job_postings:+.1f}% signals active business expansion.")

        score = float(np.clip(score, 0.0, 100.0))
        confidence = 1.0
        if len(company_news) <= 1:
            confidence = 0.75

        recent_headlines = sorted(recent_headlines, key=lambda x: x["date"], reverse=True)

        return {
            "score": score,
            "confidence": confidence,
            "reasoning": reasoning[:8],
            "metrics": {
                "company_sentiment": float(company_sentiment),
                "sector_sentiment": float(sector_sentiment),
                "macro_sentiment": float(macro_sentiment),
                "blended_sentiment": float(blended_sentiment),
                "news_count_14d": len(company_news),
                "macro_news_count_14d": len(macro_news),
                "recent_headlines": recent_headlines,
                # Source-split (29/30)
                "news_sentiment": news_sentiment,
                "social_sentiment": social_sentiment,
                "blog_sentiment": blog_sentiment,
                "pr_sentiment": pr_sentiment,
                # Alternative data
                "app_downloads_growth_yoy": float(app_growth),
                "web_traffic_growth_yoy": float(web_traffic),
                "search_trends_pct": float(search_trends),
                "social_mentions_pct": float(social_mentions),
                "job_postings_growth_yoy": float(job_postings),
                "alt_data_score": float(alt_data_score),
                "news_positive_pct": float(pos_pct),
                "news_negative_pct": float(neg_pct),
                "news_neutral_pct": float(neut_pct)
            }
        }
