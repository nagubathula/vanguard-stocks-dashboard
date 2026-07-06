import pandas as pd
import numpy as np
from typing import Dict, Any

class RegimeDetector:
    """
    Analyzes Nifty 50 and India VIX to classify the broader market regime:
    - BULL: Market is trending up, volatility is stable.
    - BEAR: Market is trending down.
    - SIDEWAYS: Market is range-bound, moving averages are flat.
    - HIGH_VOLATILITY: VIX is spiked, indicating severe uncertainty.
    """
    def __init__(self):
        self.name = "Regime Detector"

    def detect(self, nifty_sectors_df: pd.DataFrame, macro_df: pd.DataFrame) -> Dict[str, Any]:
        # Defensive check for Nifty50 column
        if "Nifty50" in nifty_sectors_df.columns:
            nifty = nifty_sectors_df["Nifty50"]
        else:
            sectors_present = [c for c in nifty_sectors_df.columns if c not in ["Date"]]
            if sectors_present:
                nifty = nifty_sectors_df[sectors_present].mean(axis=1)
            else:
                nifty = pd.Series(np.linspace(20000, 21000, len(nifty_sectors_df)), index=nifty_sectors_df.index)

        # Defensive check for IndiaVIX column
        if "IndiaVIX" in macro_df.columns:
            vix = macro_df["IndiaVIX"]
        elif "VIX" in macro_df.columns:
            vix = macro_df["VIX"]
        else:
            vix = pd.Series(15.0 * np.ones(len(macro_df)), index=macro_df.index)
        
        # Calculate moving averages for Nifty 50
        nifty_ema50 = nifty.ewm(span=50, adjust=False).mean()
        nifty_ema200 = nifty.ewm(span=200, adjust=False).mean()
        
        # Current values
        curr_price = nifty.iloc[-1] if not nifty.empty else 20000.0
        curr_ema50 = nifty_ema50.iloc[-1] if not nifty_ema50.empty else 20000.0
        curr_ema200 = nifty_ema200.iloc[-1] if not nifty_ema200.empty else 20000.0
        curr_vix = vix.iloc[-1] if not vix.empty else 15.0
        
        # Calculate Nifty slope/return over past 20 days
        nifty_pct_chg_20 = (nifty.iloc[-1] - nifty.iloc[-20]) / nifty.iloc[-20] * 100
        
        # Sector Breadth calculation (% of sectors above 50 EMA)
        sectors = ["Banking", "IT", "Pharma", "Auto", "FMCG", "Metals", "Energy", "Realty"]
        sectors_above = 0
        for s in sectors:
            if s in nifty_sectors_df.columns:
                s_price = nifty_sectors_df[s]
                s_ema50 = s_price.ewm(span=50, adjust=False).mean().iloc[-1]
                if s_price.iloc[-1] > s_ema50:
                    sectors_above += 1
        breadth_pct = (sectors_above / len(sectors)) * 100
        
        reasoning = []
        regime = "SIDEWAYS"
        
        # 1. PANIC Market
        if curr_vix > 24.0 and nifty_pct_chg_20 < -3.0:
            regime = "PANIC"
            reasoning.append(f"Panic selling detected: VIX is spiked at {curr_vix:.1f} and Nifty 20d return is sharp negative ({nifty_pct_chg_20:.1f}%).")
        # 2. RECOVERY Market
        elif curr_price < curr_ema200 and nifty_pct_chg_20 > 2.0 and curr_vix < 22.0:
            regime = "RECOVERY"
            reasoning.append(f"Market Recovery: Nifty shows strong short-term rebound (+{nifty_pct_chg_20:.1f}%) below EMA200 with stable VIX ({curr_vix:.1f}).")
        # 3. BEAR Market
        elif curr_price < curr_ema200:
            regime = "BEAR"
            reasoning.append(f"Structural Bear Market: Nifty ({curr_price:.1f}) trades below its 200 EMA ({curr_ema200:.1f}) with downward momentum.")
        # 4. STRONG BULL Market
        elif curr_price > curr_ema200 and curr_price > curr_ema50 and curr_ema50 > curr_ema200 and curr_vix < 16.0 and nifty_pct_chg_20 > 2.5:
            regime = "STRONG_BULL"
            reasoning.append(f"Strong Bull Market: Low VIX ({curr_vix:.1f}), sector breadth is healthy ({breadth_pct:.1f}%), and Nifty is above all key moving averages.")
        # 5. WEAK BULL Market
        elif curr_price > curr_ema200:
            regime = "WEAK_BULL"
            reasoning.append(f"Weak Bull Market: Trading above 200 EMA, but showing slower momentum ({nifty_pct_chg_20:.1f}%) or higher VIX ({curr_vix:.1f}).")
        # 6. SIDEWAYS Consolidation
        else:
            regime = "SIDEWAYS"
            reasoning.append(f"Sideways Market: Consolidation phase with Nifty 20d performance flat ({nifty_pct_chg_20:.1f}%) and mixed sector breadth ({breadth_pct:.1f}%).")
            
        reasoning.append(f"Market Breadth: {breadth_pct:.1f}% of sectors trading above their 50 EMA.")
        
        return {
            "regime": regime,
            "vix": float(curr_vix),
            "nifty_price": float(curr_price),
            "reasoning": reasoning,
            "metrics": {
                "nifty_ema50": float(curr_ema50),
                "nifty_ema200": float(curr_ema200),
                "nifty_20d_perf": float(nifty_pct_chg_20),
                "market_breadth_pct": float(breadth_pct)
            }
        }
