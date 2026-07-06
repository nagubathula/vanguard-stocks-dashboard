from typing import Dict, Any, List
import pandas as pd
import numpy as np
from .base import BaseAgent

class InstitutionalAgent(BaseAgent):
    def __init__(self, weight: float = 0.12):
        super().__init__("Institutional Agent", weight)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes Institutional Flows (FII/DII/MF) and Corporate Shareholding Patterns.
        """
        stock_df = data.get("stock_daily")
        if stock_df is None or stock_df.empty:
            return {
                "score": 50,
                "confidence": 0.5,
                "reasoning": ["No stock daily data available for institutional analysis."],
                "metrics": {}
            }

        # Get the latest row
        latest = stock_df.iloc[-1]
        
        # Calculate trailing flows
        fii_daily = latest.get("FII_Flow", 0.0)
        dii_daily = latest.get("DII_Flow", 0.0)
        mf_daily = latest.get("MF_Flow", 0.0)
        sip_flow = latest.get("SIP_Flow", 0.0)
        
        fii_5d = stock_df["FII_Flow"].tail(5).sum()
        fii_20d = stock_df["FII_Flow"].tail(20).sum()
        dii_5d = stock_df["DII_Flow"].tail(5).sum()
        dii_20d = stock_df["DII_Flow"].tail(20).sum()
        mf_5d = stock_df["MF_Flow"].tail(5).mean()
        
        # Calculate weekly and monthly trends
        fii_5d_prev = stock_df["FII_Flow"].iloc[-10:-5].sum() if len(stock_df) >= 10 else fii_5d
        fii_weekly_trend = "Accumulation" if fii_5d > fii_5d_prev else "Distribution"
        fii_20d_prev = stock_df["FII_Flow"].iloc[-40:-20].sum() if len(stock_df) >= 40 else fii_20d
        fii_monthly_trend = "Accumulation" if fii_20d > fii_20d_prev else "Distribution"
        
        dii_5d_prev = stock_df["DII_Flow"].iloc[-10:-5].sum() if len(stock_df) >= 10 else dii_5d
        dii_weekly_trend = "Accumulation" if dii_5d > dii_5d_prev else "Distribution"
        dii_20d_prev = stock_df["DII_Flow"].iloc[-40:-20].sum() if len(stock_df) >= 40 else dii_20d
        dii_monthly_trend = "Accumulation" if dii_20d > dii_20d_prev else "Distribution"
        
        # Shareholding values
        promoter_pct = latest.get("PromoterPct", 50.0)
        fii_pct = latest.get("FiiPct", 20.0)
        dii_pct = latest.get("DiiPct", 15.0)
        public_pct = latest.get("PublicPct", 15.0)
        
        # Shareholding changes over 60 days
        promoter_change = 0.0
        fii_change = 0.0
        dii_change = 0.0
        if len(stock_df) >= 60:
            past_row = stock_df.iloc[-60]
            promoter_change = promoter_pct - past_row.get("PromoterPct", promoter_pct)
            fii_change = fii_pct - past_row.get("FiiPct", fii_pct)
            dii_change = dii_pct - past_row.get("DiiPct", dii_pct)

        reasoning = []
        score_components = []

        # 1. Evaluate Trailing FII Flow (max 30 pts)
        fii_score = 15
        if fii_20d > 500:
            fii_score = 30
            reasoning.append(f"Strong FII accumulation observed: +{fii_20d:.1f} Cr net buying over last 20 days.")
        elif fii_20d > 0:
            fii_score = 22
            reasoning.append(f"Moderate FII inflows: +{fii_20d:.1f} Cr net buying over last 20 days.")
        elif fii_20d < -500:
            fii_score = 0
            reasoning.append(f"Significant FII distribution: {fii_20d:.1f} Cr net selling over last 20 days.")
        else:
            fii_score = 8
            reasoning.append(f"Mild FII selling: {fii_20d:.1f} Cr net selling over last 20 days.")
        score_components.append(fii_score)

        # 2. Evaluate Trailing DII Flow (max 20 pts)
        dii_score = 10
        if dii_20d > 300:
            dii_score = 20
            reasoning.append(f"Strong DII support: +{dii_20d:.1f} Cr net buying over last 20 days.")
        elif dii_20d > 0:
            dii_score = 15
            reasoning.append(f"Moderate DII support: +{dii_20d:.1f} Cr net buying over last 20 days.")
        elif dii_20d < -300:
            dii_score = 0
            reasoning.append(f"DII outflows: {dii_20d:.1f} Cr net selling over last 20 days.")
        else:
            dii_score = 6
            reasoning.append(f"Mild DII selling: {dii_20d:.1f} Cr net selling over last 20 days.")
        score_components.append(dii_score)

        # 3. Evaluate Mutual Fund Net Inflows & SIP Flows (max 20 pts)
        mf_score = 10
        if mf_5d > 50:
            mf_score = 20
            reasoning.append(f"Elevated Mutual Fund purchasing: +{mf_5d:.1f} Cr daily average over last 5 days.")
        elif mf_5d > 0:
            mf_score = 15
            reasoning.append(f"Moderate Mutual Fund buying: +{mf_5d:.1f} Cr daily average.")
        elif mf_5d < -50:
            mf_score = 0
            reasoning.append(f"Mutual Funds net selling: {mf_5d:.1f} Cr daily average.")
        else:
            mf_score = 6
            reasoning.append(f"Flat Mutual Fund flows.")
        score_components.append(mf_score)

        # 4. Evaluate Shareholding Quality (max 30 pts)
        holding_score = 15
        
        # High promoter holding is positive (unless it is zero due to professional management, which we handle)
        if promoter_pct > 50.0:
            holding_score += 5
            reasoning.append(f"High Promoter ownership ({promoter_pct:.1f}%) provides a strong fundamental floor.")
        elif promoter_pct == 0.0 and (fii_pct + dii_pct > 60.0):
            holding_score += 5
            reasoning.append("Professionally managed company with heavy institutional backing (>60%).")
            
        # Promoter buying / Promoter ↑ signal
        if promoter_change > 0.1:
            holding_score += 5
            reasoning.append(f"Promoter shareholding increased by +{promoter_change:.2f}% (Promoter ↑ bullish signal).")
        elif promoter_change < -0.1:
            holding_score -= 5
            reasoning.append(f"Promoter shareholding decreased by {promoter_change:.2f}% over the last quarter.")

        # Institutional shares increasing
        if fii_change > 0.5:
            holding_score += 5
            reasoning.append(f"FII shareholding increased by +{fii_change:.2f}% over the last quarter.")
        elif fii_change < -0.5:
            holding_score -= 5
            reasoning.append(f"FII shareholding decreased by {fii_change:.2f}% over the last quarter.")
            
        if dii_change > 0.5:
            holding_score += 5
            reasoning.append(f"DII shareholding increased by +{dii_change:.2f}% over the last quarter.")
        elif dii_change < -0.5:
            holding_score -= 5
            reasoning.append(f"DII shareholding decreased by {dii_change:.2f}% over the last quarter.")

        # Declining retail shareholding is positive (consolidation in strong hands)
        if public_pct < 20.0:
            holding_score += 5
            reasoning.append(f"Low public float ({public_pct:.1f}%) limits market supply volatility.")
            
        holding_score = np.clip(holding_score, 0, 30)
        score_components.append(holding_score)

        final_score = int(sum(score_components))
        
        # Determine confidence based on availability of data
        confidence = 0.90 if len(stock_df) >= 60 else 0.70

        return {
            "score": final_score,
            "confidence": confidence,
            "reasoning": reasoning,
            "metrics": {
                "fii_daily": fii_daily,
                "dii_daily": dii_daily,
                "mf_daily": mf_daily,
                "fii_5d": fii_5d,
                "fii_20d": fii_20d,
                "dii_5d": dii_5d,
                "dii_20d": dii_20d,
                "mf_5d": mf_5d,
                "sip_flow": sip_flow,
                "fii_weekly_trend": fii_weekly_trend,
                "fii_monthly_trend": fii_monthly_trend,
                "dii_weekly_trend": dii_weekly_trend,
                "dii_monthly_trend": dii_monthly_trend,
                "promoter_pct": promoter_pct,
                "fii_pct": fii_pct,
                "dii_pct": dii_pct,
                "public_pct": public_pct,
                "promoter_change_3m": promoter_change,
                "fii_change_3m": fii_change,
                "dii_change_3m": dii_change
            }
        }
