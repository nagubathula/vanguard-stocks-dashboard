from typing import Dict, Any, List
import pandas as pd
import numpy as np
from .base import BaseAgent
from data_generator import STOCKS_METADATA

class EarningsAgent(BaseAgent):
    def __init__(self, weight: float = 0.10):
        super().__init__("Earnings Agent", weight)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes Earnings Intelligence (EPS/Rev Estimates & Surprises) and Corporate Actions (Splits, buybacks, promoter transactions).
        """
        stock_df = data.get("stock_daily")
        if stock_df is None or stock_df.empty:
            return {
                "score": 50,
                "confidence": 0.5,
                "reasoning": ["No stock daily data available for earnings analysis."],
                "metrics": {}
            }

        # Load stock metadata
        meta = STOCKS_METADATA.get(ticker, {})
        
        # Get metadata parameters
        eps_surprise = meta.get("eps_surprise", 0.0)
        rev_surprise = meta.get("revenue_surprise", 0.0)
        guidance_change = meta.get("guidance_change", 0.0)
        expected_eps = meta.get("expected_eps", 0.0)
        revenue_estimate = meta.get("revenue_estimate", 0.0)
        eps_growth = meta.get("eps_growth", 0.0)
        rev_growth = meta.get("rev_growth", 0.0)
        prof_growth = meta.get("prof_growth", 0.0)
        
        # Get daily corporate actions
        latest = stock_df.iloc[-1]
        div_yield = latest.get("DividendYield", 1.0)
        
        # Lookback for recent corporate actions (last 20 days)
        bonus_recent = stock_df["BonusIssues"].tail(20).sum() > 0
        splits_recent = stock_df["StockSplits"].tail(20).sum() > 0
        buybacks_recent = stock_df["Buybacks"].tail(20).sum() > 0
        promoter_buying_recent = stock_df["PromoterBuying"].tail(10).sum() > 0
        promoter_selling_recent = stock_df["PromoterSelling"].tail(10).sum() > 0

        reasoning = []
        score_components = []

        # 1. Earnings Surprise (max 40 pts)
        surprise_score = 20
        if eps_surprise > 3.0 and rev_surprise > 1.5:
            surprise_score = 40
            reasoning.append(f"Outstanding Q1 earnings: EPS beat by +{eps_surprise}% and Revenue beat by +{rev_surprise}%.")
        elif eps_surprise > 0 or rev_surprise > 0:
            surprise_score = 30
            reasoning.append(f"Positive earnings performance: EPS beat by +{eps_surprise}%.")
        elif eps_surprise < -3.0 or rev_surprise < -2.0:
            surprise_score = 5
            reasoning.append(f"Disappointing earnings: EPS missed by {eps_surprise}% and Revenue missed by {rev_surprise}%.")
        else:
            surprise_score = 15
            reasoning.append(f"Earnings met consensus expectations.")
            
        if guidance_change > 1.0:
            surprise_score += 5
            reasoning.append(f"Management raised full-year growth guidance by +{guidance_change}%.")
        elif guidance_change < -1.0:
            surprise_score -= 10
            reasoning.append(f"Management lowered full-year guidance by {guidance_change}%.")
            
        surprise_score = np.clip(surprise_score, 0, 40)
        score_components.append(surprise_score)

        # 2. Corporate Actions & Insiders (max 30 pts)
        corp_score = 15
        
        if div_yield > 2.5:
            corp_score += 5
            reasoning.append(f"Attractive dividend profile with a yield of {div_yield:.2f}%.")
            
        if buybacks_recent:
            corp_score += 10
            reasoning.append("Bullish indicator: Company announced a share buyback program recently.")
            
        if splits_recent or bonus_recent:
            corp_score += 5
            reasoning.append("Corporate action: Stock split or bonus issue announced to improve retail liquidity.")
            
        if promoter_buying_recent:
            corp_score += 10
            reasoning.append("Insider Buying: Promoters acquired additional shares from the open market.")
        elif promoter_selling_recent:
            corp_score -= 10
            reasoning.append("Insider Selling: Promoters offloaded shares, indicating potential near-term overhead.")
            
        corp_score = np.clip(corp_score, 0, 30)
        score_components.append(corp_score)

        # 3. Trailing EPS and Revenue Growth (max 30 pts)
        growth_score = 10
        if eps_growth > 15.0:
            growth_score += 10
            reasoning.append(f"Premium bottom-line momentum: Trailing EPS growth of +{eps_growth:.1f}%.")
        elif eps_growth > 5.0:
            growth_score += 5
            reasoning.append(f"Stable bottom-line momentum: Trailing EPS growth of +{eps_growth:.1f}%.")
            
        if rev_growth > 12.0:
            growth_score += 10
            reasoning.append(f"Strong top-line expansion: Revenue growth of +{rev_growth:.1f}%.")
        elif rev_growth > 5.0:
            growth_score += 5
            
        if prof_growth > 15.0:
            growth_score += 5
            
        growth_score = np.clip(growth_score, 0, 30)
        score_components.append(growth_score)

        final_score = int(sum(score_components))
        
        # High confidence since these are official corporate filings
        confidence = 0.95

        return {
            "score": final_score,
            "confidence": confidence,
            "reasoning": reasoning,
            "metrics": {
                "expected_eps": expected_eps,
                "revenue_estimate": revenue_estimate,
                "eps_surprise": eps_surprise,
                "revenue_surprise": rev_surprise,
                "guidance_change": guidance_change,
                "eps_growth": eps_growth,
                "rev_growth": rev_growth,
                "profit_growth": prof_growth,
                "dividend_yield": div_yield,
                "bonus_recent": bonus_recent,
                "splits_recent": splits_recent,
                "buybacks_recent": buybacks_recent,
                "promoter_buying_recent": promoter_buying_recent,
                "promoter_selling_recent": promoter_selling_recent
            }
        }
