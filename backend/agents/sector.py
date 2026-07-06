import os
import pandas as pd
import numpy as np
from typing import Dict, Any
from agents.base import BaseAgent
from data_generator import STOCKS_METADATA

class SectorAgent(BaseAgent):
    def __init__(self):
        super().__init__("Sector Agent", 0.15)
        self._breadth_cache = {}

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        nifty_sectors = data["nifty_sectors"]
        
        # Determine stock's sector
        meta = STOCKS_METADATA.get(ticker, {"sector": "Banking"})
        sector_name = meta["sector"]
        
        # 20-day return calculation
        lookback = 20
        nifty_now = nifty_sectors["Nifty50"].iloc[-1]
        nifty_prev = nifty_sectors["Nifty50"].iloc[-lookback - 1]
        nifty_ret = (nifty_now - nifty_prev) / nifty_prev
        
        sec_now = nifty_sectors[sector_name].iloc[-1]
        sec_prev = nifty_sectors[sector_name].iloc[-lookback - 1]
        sec_ret = (sec_now - sec_prev) / sec_prev
        
        # Sector Strength = Sector Return / Nifty Return (or Sector Return - Nifty Return as Alpha)
        rs_alpha = sec_ret - nifty_ret
        sector_strength_ratio = sec_ret / (nifty_ret + 1e-10) if nifty_ret != 0 else 1.0
        
        reasoning = []
        
        # Calculate Sector Score (0 - 100)
        # We classify sectors relative to Nifty
        if rs_alpha > 0.05:
            score = 90.0
            reasoning.append(f"Sector Leadership: '{sector_name}' is leading the market (Alpha: +{rs_alpha*100:.1f}% vs Nifty50). Boosted rating.")
        elif rs_alpha > 0:
            score = 75.0
            reasoning.append(f"Sector Strength: '{sector_name}' exhibits positive momentum (Alpha: +{rs_alpha*100:.1f}% vs Nifty50).")
        elif rs_alpha > -0.05:
            score = 45.0
            reasoning.append(f"Sector Drag: '{sector_name}' is lagging behind the benchmark index (Alpha: {rs_alpha*100:.1f}%).")
        else:
            score = 20.0
            reasoning.append(f"Sector Cap: Avoid sector '{sector_name}' due to severe relative underperformance (Alpha: {rs_alpha*100:.1f}%).")

        # --- DYNAMIC MARKET BREADTH CALCULATION (CACHED) ---
        last_date = str(nifty_sectors["Date"].iloc[-1]) if "Date" in nifty_sectors.columns else ""
        cached = self._breadth_cache.get(last_date)
        if cached:
            breadth_score = cached["breadth_score"]
            ad_ratio = cached["ad_ratio"]
            new_highs = cached["new_highs"]
            new_lows = cached["new_lows"]
            pct_above_50 = cached["pct_above_50"]
            pct_above_200 = cached["pct_above_200"]
            advances = cached["advances"]
            declines = cached["declines"]
            above_50 = cached["above_50"]
            above_200 = cached["above_200"]
        else:
            tickers = list(STOCKS_METADATA.keys())
            advances = 0
            declines = 0
            new_highs = 0
            new_lows = 0
            above_50 = 0
            above_200 = 0
            
            for t in tickers:
                try:
                    t_df = pd.read_csv(f"data/{t}_daily.csv")
                    if len(t_df) < 200:
                        continue
                    t_row = t_df.iloc[-1]
                    t_prev = t_df.iloc[-2]
                    
                    t_ret = (t_row["Close"] - t_prev["Close"]) / t_prev["Close"]
                    if t_ret > 0:
                        advances += 1
                    else:
                        declines += 1
                        
                    t_close_series = t_df["Close"]
                    t_ema_50 = t_close_series.ewm(span=50, adjust=False).mean().iloc[-1]
                    t_ema_200 = t_close_series.ewm(span=200, adjust=False).mean().iloc[-1]
                    t_high_20 = t_close_series.tail(20).max()
                    t_low_20 = t_close_series.tail(20).min()
                    
                    t_close = t_row["Close"]
                    if t_close > t_ema_50:
                        above_50 += 1
                    if t_close > t_ema_200:
                        above_200 += 1
                    if t_close >= t_high_20 * 0.995:
                        new_highs += 1
                    if t_close <= t_low_20 * 1.005:
                        new_lows += 1
                except Exception as e:
                    pass
                    
            total_tracked = advances + declines
            ad_ratio = advances / (declines + 1e-10) if declines != 0 else advances
            pct_above_50 = (above_50 / total_tracked * 100) if total_tracked > 0 else 50.0
            pct_above_200 = (above_200 / total_tracked * 100) if total_tracked > 0 else 50.0
            
            # Nifty Breadth Score (0 to 100 based on AD, % above EMAs, new highs/lows)
            breadth_score = (pct_above_50 * 0.4) + (pct_above_200 * 0.4) + (ad_ratio / (ad_ratio + 1) * 20.0)
            breadth_score = int(np.clip(breadth_score, 0, 100))
            
            self._breadth_cache[last_date] = {
                "breadth_score": breadth_score,
                "ad_ratio": ad_ratio,
                "new_highs": new_highs,
                "new_lows": new_lows,
                "pct_above_50": pct_above_50,
                "pct_above_200": pct_above_200,
                "advances": advances,
                "declines": declines,
                "above_50": above_50,
                "above_200": above_200
            }
        
        reasoning.append(f"Market Breadth: Nifty breadth score is {breadth_score}/100. AD Ratio: {ad_ratio:.2f}, {pct_above_50:.0f}% stocks above 50 EMA.")

        # Calculate all sector RS values for the dashboard (20-day and 5-day)
        all_sector_rs = {}
        all_sector_rs_5d = {}
        
        lookback_5 = 5
        nifty_prev_5 = nifty_sectors["Nifty50"].iloc[-lookback_5 - 1]
        nifty_ret_5 = (nifty_now - nifty_prev_5) / nifty_prev_5
        
        for s in nifty_sectors.columns:
            if s == "Date" or s == "Nifty50":
                continue
            s_now = nifty_sectors[s].iloc[-1]
            
            # 20d medium term
            s_prev_20 = nifty_sectors[s].iloc[-lookback - 1]
            s_ret_20 = (s_now - s_prev_20) / s_prev_20
            all_sector_rs[s] = round(float(s_ret_20 - nifty_ret) * 100, 2)
            
            # 5d short term
            s_prev_5 = nifty_sectors[s].iloc[-lookback_5 - 1]
            s_ret_5 = (s_now - s_prev_5) / s_prev_5
            all_sector_rs_5d[s] = round(float(s_ret_5 - nifty_ret_5) * 100, 2)

        # Sector alignment check:
        # Check stock's own 20-day return vs sector 20-day return
        stock_daily = data["stock_daily"]
        stock_now = stock_daily["Close"].iloc[-1]
        stock_prev = stock_daily["Close"].iloc[-lookback - 1]
        stock_ret = (stock_now - stock_prev) / stock_prev
        
        confidence = 1.0
        if stock_ret > 0.05 and rs_alpha < -0.02:
            confidence = 0.7
            reasoning.append(f"Divergence Warning: '{ticker}' is showing price strength (+{stock_ret*100:.1f}%) despite Sector '{sector_name}' weakness.")
        elif stock_ret < -0.05 and rs_alpha > 0.02:
            confidence = 0.8
            reasoning.append(f"Lag Alert: '{ticker}' is lagging while Sector '{sector_name}' shows tailwinds.")

        # Boost score if sector is leading (in top 3 sectors)
        sorted_sectors = sorted(all_sector_rs.items(), key=lambda x: x[1], reverse=True)
        top_sectors = [x[0] for x in sorted_sectors[:3]]
        if sector_name in top_sectors:
            score = min(100.0, score + 10.0)
            reasoning.append(f"Sector Boost: '{sector_name}' is currently in the top 3 leading market sectors.")

        # Share sector_score in context for other agents (like Macro/AI features)
        context["sector_score"] = score

        return {
            "score": int(score),
            "confidence": confidence,
            "reasoning": reasoning[:8],
            "metrics": {
                "sector": sector_name,
                "sector_return_20d": float(sec_ret) * 100,
                "nifty_return_20d": float(nifty_ret) * 100,
                "rs_alpha": float(rs_alpha) * 100,
                "sector_strength_ratio": float(sector_strength_ratio),
                "all_sectors_rs": all_sector_rs,
                "all_sectors_rs_5d": all_sector_rs_5d,
                "market_breadth": {
                    "breadth_score": breadth_score,
                    "ad_ratio": float(ad_ratio),
                    "new_highs": new_highs,
                    "new_lows": new_lows,
                    "pct_above_50_ema": float(pct_above_50),
                    "pct_above_200_ema": float(pct_above_200)
                }
            }
        }
