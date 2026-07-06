import pandas as pd
import numpy as np
from typing import Dict, Any
from agents.base import BaseAgent
from data_generator import STOCKS_METADATA

class MacroAgent(BaseAgent):
    def __init__(self):
        super().__init__("Macro Agent", 0.15)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        macro_df = data["macro_indices"]
        meta = STOCKS_METADATA.get(ticker, {"sector": "Banking"})
        sector = meta["sector"]
        
        # Latest macro values
        row = macro_df.iloc[-1]
        prev_5d = macro_df.iloc[-6]  # 5 business days ago
        prev_10d = macro_df.iloc[-11] # 10 business days ago
        
        # Calculate returns
        nasdaq_ret_5d = (row["NASDAQ"] - prev_5d["NASDAQ"]) / prev_5d["NASDAQ"]
        sp500_ret_5d = (row["SP500"] - prev_5d["SP500"]) / prev_5d["SP500"]
        dxy_chg_5d = row["DXY"] - prev_5d["DXY"]
        yield_chg_10d = row["US10Y"] - prev_10d["US10Y"]
        crude_ret_10d = (row["CrudeOil"] - prev_10d["CrudeOil"]) / prev_10d["CrudeOil"]
        vix = row["VIX"]
        
        score = 70.0 # Base macro score (neutral)
        reasoning = []
        
        # 1. Global Equity Sentiment
        if nasdaq_ret_5d < -0.03:
            score -= 15.0
            reasoning.append(f"Global Tech Sell-off: NASDAQ fell {nasdaq_ret_5d*100:.2f}% over the last 5 days.")
            if sector == "IT":
                score -= 10.0
                reasoning.append("IT Sector Penalty: High correlation to NASDAQ correction increases risk.")
        elif nasdaq_ret_5d > 0.02:
            score += 10.0
            reasoning.append(f"Global equity tailwinds: NASDAQ rose +{nasdaq_ret_5d*100:.2f}% over 5 days.")
            if sector == "IT":
                score += 5.0

        # 2. Dollar Index (DXY) Impact
        if dxy_chg_5d > 1.0:
            reasoning.append(f"Dollar Index (DXY) strengthened (+{dxy_chg_5d:.2f}), creating emerging market capital outflow pressures.")
            if sector == "Banking":
                score -= 5.0
        elif dxy_chg_5d < -1.0:
            reasoning.append(f"DXY weakened (-{abs(dxy_chg_5d):.2f}), supportive for emerging market equities.")
            score += 5.0

        # 3. Bond Yields Impact (Interest Rate Sensitive)
        if yield_chg_10d > 0.15:
            reasoning.append(f"US 10-Year Bond Yield spiked +{yield_chg_10d:.2f}% in 10 days, raising discount rates.")
            if sector in ["Banking", "Realty"]:
                score -= 15.0
                reasoning.append(f"Rate-Sensitive Penalty: Rising yields pressuring cost of capital for {sector}.")
        elif yield_chg_10d < -0.15:
            reasoning.append(f"US 10-Year Yield declined -{abs(yield_chg_10d):.2f}%, lowering rate pressures.")
            if sector in ["Banking", "Realty"]:
                score += 10.0

        # 4. Commodity Impact
        if crude_ret_10d > 0.08:
            reasoning.append(f"Crude Oil surged +{crude_ret_10d*100:.2f}% in 10 days.")
            if sector == "FMCG":
                score -= 10.0
                reasoning.append("Input Cost Pressure: High oil prices raise packaging/distribution costs for FMCG.")
            elif sector == "Energy" and ticker == "RELIANCE":
                score += 15.0
                reasoning.append("Upstream Advantage: High crude prices boost refining margins for Reliance.")
        elif crude_ret_10d < -0.08:
            reasoning.append(f"Crude Oil declined -{abs(crude_ret_10d*100):.2f}%, reducing domestic inflation.")
            if sector == "FMCG":
                score += 10.0

        # VIX Volatility impact
        if vix > 20.0:
            score -= 10.0
            if sector in ["FMCG", "Pharma"]:
                score += 15.0  # Defensive premium
                reasoning.append(f"Global VIX spiked to {vix:.2f}. Premium applied to defensive stock (Sector: {sector}).")
            else:
                reasoning.append(f"Global VIX spiked to {vix:.2f}. Risk-off penalty applied to cyclical stock.")
        else:
            reasoning.append(f"Global VIX is calm at {vix:.2f}, favoring risk assets.")

        score = min(100.0, max(0.0, score))
        confidence = 1.0
        # Reduce confidence in high global VIX
        if vix > 22.0:
            confidence = 0.75

        return {
            "score": score,
            "confidence": confidence,
            "reasoning": reasoning[:8],
            "metrics": {
                "nasdaq_5d_return": float(nasdaq_ret_5d) * 100,
                "dxy_5d_change": float(dxy_chg_5d),
                "us10y_10d_change": float(yield_chg_10d),
                "crude_10d_return": float(crude_ret_10d) * 100,
                "vix": float(vix)
            }
        }
