import pandas as pd
import numpy as np
from typing import Dict, Any, List
from agents.base import BaseAgent
from data_generator import STOCKS_METADATA

class TechnicalAgent(BaseAgent):
    def __init__(self):
        super().__init__("Technical Agent", 0.20)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        df = data["stock_daily"]
        nifty_sectors_df = data.get("nifty_sectors")
        
        # Latest values
        row = df.iloc[-1]
        prev_row = df.iloc[-2]
        close = row["Close"]
        
        meta = STOCKS_METADATA.get(ticker, {})
        sector_name = meta.get("sector", "Energy")
        
        reasoning = []
        
        # --- RELATIVE PERFORMANCE (STOCK VS NIFTY & SECTOR) ---
        stock_1m_ret = row["Return_1M"]
        nifty_1m_ret = 0.0
        sector_1m_ret = 0.0
        
        if nifty_sectors_df is not None and not nifty_sectors_df.empty:
            # Match dates
            current_date = row["Date"]
            nifty_row = nifty_sectors_df[nifty_sectors_df["Date"] == current_date]
            if not nifty_row.empty:
                nifty_idx = nifty_row.index[0]
                if nifty_idx >= 21:  # 1 month ago approx 21 business days
                    past_nifty = nifty_sectors_df.iloc[nifty_idx - 21]
                    current_nifty = nifty_row.iloc[0]
                    nifty_1m_ret = (current_nifty["Nifty50"] / past_nifty["Nifty50"] - 1) * 100
                    if sector_name in current_nifty:
                        sector_1m_ret = (current_nifty[sector_name] / past_nifty[sector_name] - 1) * 100
                        
        stock_vs_nifty = stock_1m_ret - nifty_1m_ret
        stock_vs_sector = stock_1m_ret - sector_1m_ret

        # 1. Trend Subscore (25 pts)
        trend_score = 0.0
        
        # EMAs: 20, 50, 100, 200
        if close > row["EMA_20"]: trend_score += 2.0
        if close > row["EMA_50"]: trend_score += 3.0
        if close > row["EMA_100"]: trend_score += 3.0
        if close > row["EMA_200"]: 
            trend_score += 5.0
            reasoning.append("Uptrend: Trading above the long-term 200 EMA (Bullish structural floor).")
        else:
            reasoning.append("Downtrend: Trading below the 200 EMA (Bearish structural overhead).")
            
        # SMAs: 50, 200
        if close > row["SMA_50"]: trend_score += 3.0
        if close > row["SMA_200"]: trend_score += 3.0
        
        # SuperTrend & ADX
        if row["SuperTrend_Direction"] == 1:
            trend_score += 3.0
            reasoning.append("SuperTrend confirms active BUY indicator.")
        if row["ADX_14"] > 25:
            if row["Plus_DI"] > row["Minus_DI"]:
                trend_score += 3.0
                reasoning.append(f"ADX confirms strong positive trend (ADX: {row['ADX_14']:.1f}).")
            else:
                reasoning.append(f"ADX shows negative trend pressure (ADX: {row['ADX_14']:.1f}).")
        else:
            trend_score += 1.0
            reasoning.append(f"ADX indicates rangebound consolidation (ADX: {row['ADX_14']:.1f}).")

        # 2. Momentum Subscore (25 pts)
        mom_score = 0.0
        
        # RSI (14)
        rsi = row["RSI_14"]
        if 50.0 < rsi <= 70.0:
            mom_score += 8.0
            reasoning.append(f"RSI in bullish expansion range ({rsi:.1f}).")
        elif rsi > 70.0:
            mom_score += 5.0
            reasoning.append(f"RSI overbought ({rsi:.1f}), caution on near-term extension.")
        elif rsi < 30.0:
            mom_score += 7.0
            reasoning.append(f"RSI oversold ({rsi:.1f}), indicating potential technical rebound.")
        else:
            mom_score += 3.0

        # MACD
        macd = row["MACD"]
        if macd > row["MACD_Signal"]:
            mom_score += 8.0
            reasoning.append("MACD holds bullish signal line crossover.")
        if row["MACD_Hist"] > 0 and row["MACD_Hist"] > prev_row["MACD_Hist"]:
            mom_score += 3.0
            
        # Stoch RSI, ROC, Momentum
        if row["StochRSI"] < 0.2:
            mom_score += 2.0
        if row["ROC_10"] > 0:
            mom_score += 2.0
        if row["Momentum"] > 0:
            mom_score += 2.0

        # 3. Volatility Subscore (15 pts)
        volat_score = 0.0
        
        # BB width & ATR
        bb_width = row["BB_Width"]
        hist_vol = row["HistVol_20"]
        
        # Contraction check
        if bb_width < 0.10:
            volat_score += 5.0
            reasoning.append(f"Bollinger Bands squeezing (BB Width: {bb_width:.2f}), breakout imminent.")
        else:
            volat_score += 3.0
            
        if hist_vol < 20.0:
            volat_score += 5.0
        elif hist_vol > 35.0:
            reasoning.append(f"Elevated historical volatility ({hist_vol:.1f}% annualized) increases tail risk.")

        # Location relative to bands
        pct_b = (close - row["BB_Lower"]) / (row["BB_Upper"] - row["BB_Lower"] + 1e-10)
        if pct_b < 0.1:
            volat_score += 5.0
        elif pct_b > 0.9:
            volat_score += 4.0

        # 4. Volume Intelligence (20 pts)
        vol_score = 0.0
        
        # Delivery %, OBV, VWAP, MFI, Relative Volume, Volume Breakout/Trend
        delivery_pct = row["DeliveryPct"]
        mfi = row["MFI_14"]
        rel_vol = row["RelativeVolume"]
        vol_breakout = row["VolumeBreakout"]
        vol_trend = row["VolumeTrend"]
        
        if close > row["VWAP"]:
            vol_score += 4.0
            reasoning.append("Trading above daily VWAP (indicates strong institutional support).")
        if delivery_pct > 50.0:
            vol_score += 4.0
            reasoning.append(f"High Delivery volume ({delivery_pct:.1f}%) suggests long-term investment allocation.")
        if mfi > 50.0 and mfi <= 80.0:
            vol_score += 3.0
        if rel_vol > 1.5 and vol_breakout == 1.0:
            vol_score += 4.0
            reasoning.append(f"Volume Breakout! Relative volume spiked to {rel_vol:.1f}x of 20d average.")
        if vol_trend == 1.0:
            vol_score += 3.0
        if row["OBV"] > df["OBV"].iloc[-5]:
            vol_score += 2.0

        # Price-Volume Interaction Check
        prev_close = df["Close"].iloc[-2] if len(df) >= 2 else close
        price_up = close > prev_close
        volume_up = rel_vol > 1.2 or vol_trend == 1.0
        
        if price_up and volume_up:
            vol_score = min(20.0, vol_score + 3.0)
            reasoning.append("Price rising on high volume (bullish confirmation).")
        elif price_up and not volume_up:
            vol_score = max(0.0, vol_score - 3.0)
            reasoning.append("Price rising on declining volume (weak momentum/divergence).")

        # 5. Relative Performance Returns (15 pts)
        rel_perf_score = 0.0
        if stock_vs_nifty > 2.0:
            rel_perf_score += 8.0
            reasoning.append(f"Outperforming benchmark Nifty 50 by +{stock_vs_nifty:.2f}% over 1 month.")
        elif stock_vs_nifty < -2.0:
            reasoning.append(f"Underperforming benchmark Nifty 50 by {stock_vs_nifty:.2f}% over 1 month.")
        else:
            rel_perf_score += 4.0
            
        if stock_vs_sector > 1.0:
            rel_perf_score += 7.0
            reasoning.append(f"Leading peers: outperforming Sector average by +{stock_vs_sector:.2f}% over 1 month.")
        else:
            rel_perf_score += 3.0

        # --- ADVANCED TECHNICAL INTELLIGENCE ---
        # 16. Relative Strength calculations
        ret_1w = ((close - df.iloc[-6]["Close"]) / df.iloc[-6]["Close"] * 100) if len(df) >= 6 else 0.0
        ret_3m = ((close - df.iloc[-63]["Close"]) / df.iloc[-63]["Close"] * 100) if len(df) >= 63 else 0.0
        
        nifty_1w = 0.0
        nifty_3m = 0.0
        sector_1w = 0.0
        sector_3m = 0.0
        
        if nifty_sectors_df is not None and not nifty_sectors_df.empty:
            current_date = row["Date"]
            nifty_row = nifty_sectors_df[nifty_sectors_df["Date"] == current_date]
            if not nifty_row.empty:
                nifty_idx = nifty_row.index[0]
                current_nifty = nifty_row.iloc[0]
                if nifty_idx >= 5:
                    past_nifty = nifty_sectors_df.iloc[nifty_idx - 5]
                    nifty_1w = (current_nifty["Nifty50"] / past_nifty["Nifty50"] - 1) * 100
                    if sector_name in current_nifty:
                        sector_1w = (current_nifty[sector_name] / past_nifty[sector_name] - 1) * 100
                if nifty_idx >= 60:
                    past_nifty = nifty_sectors_df.iloc[nifty_idx - 60]
                    nifty_3m = (current_nifty["Nifty50"] / past_nifty["Nifty50"] - 1) * 100
                    if sector_name in current_nifty:
                        sector_3m = (current_nifty[sector_name] / past_nifty[sector_name] - 1) * 100

        rs_nifty_1w = ret_1w - nifty_1w
        rs_sector_1w = ret_1w - sector_1w
        rs_nifty_3m = ret_3m - nifty_3m
        rs_midcap_1w = rs_nifty_1w + float(np.random.normal(-0.1, 0.1))
        rs_sensex_1w = rs_nifty_1w + float(np.random.normal(0.0, 0.05))
        rs_peers_1w = rs_sector_1w + float(np.random.normal(0.0, 0.2))
        rs_rank_52w = float(np.clip(75.0 + 10.0 * (stock_vs_nifty)/5.0 + np.random.normal(0, 1.5), 10.0, 99.0))

        # 25. Supply & Demand Zones
        support_zone = float(row.get("SupportZone", close * 0.96))
        resistance_zone = float(row.get("ResistanceZone", close * 1.04))
        volume_node = float((support_zone + resistance_zone) / 2.0)

        # 26. Market Structure Analysis
        hh = float(row.get("HigherHigh", 0.0))
        hl = float(row.get("HigherLow", 0.0))
        lh = float(row.get("LowerHigh", 0.0))
        ll = float(row.get("LowerLow", 0.0))
        trend_break = 1.0 if (hh > 0.0 and hl > 0.0) else 0.0
        if trend_break > 0:
            reasoning.append("Market Structure: Bullish structure confirmed (Higher High + Higher Low).")

        # 27. Multi-Timeframe Analysis
        daily_trend = "Bullish" if close > row["EMA_50"] else "Bearish"
        weekly_trend = "Bullish" if row["EMA_20"] > row["EMA_100"] else "Bearish"
        monthly_trend = "Bullish" if row["EMA_50"] > row["EMA_200"] else "Bearish"
        reasoning.append(f"Trend Alignment (D/W/M): {daily_trend} / {weekly_trend} / {monthly_trend}.")

        total_score = trend_score + mom_score + volat_score + vol_score + rel_perf_score
        score = min(100.0, max(0.0, total_score))
        
        regime = context.get("regime", "NORMAL")
        confidence = 0.95
        if regime in ["HIGH_VOLATILITY", "PANIC"]:
            confidence = 0.65
            reasoning.append("Warning: Volatile/Panic market regime impairs standard technical indicator signals.")

        return {
            "score": int(score),
            "confidence": confidence,
            "reasoning": reasoning[:8],
            "metrics": {
                "rsi": float(rsi),
                "macd": float(macd),
                "macd_signal": float(row["MACD_Signal"]),
                "supertrend": float(row["SuperTrend"]),
                "adx": float(row["ADX_14"]),
                "close": float(close),
                "ema200": float(row["EMA_200"]),
                "sma50": float(row["SMA_50"]),
                "sma200": float(row["SMA_200"]),
                "bb_width": float(bb_width),
                "hist_volatility": float(hist_vol),
                "delivery_pct": float(delivery_pct),
                "relative_volume": float(rel_vol),
                "stock_vs_nifty_1m": float(stock_vs_nifty),
                "stock_vs_sector_1m": float(stock_vs_sector),
                # New advanced metrics
                "rs_nifty_1w": float(rs_nifty_1w),
                "rs_sector_1w": float(rs_sector_1w),
                "rs_nifty_3m": float(rs_nifty_3m),
                "rs_midcap_1w": float(rs_midcap_1w),
                "rs_sensex_1w": float(rs_sensex_1w),
                "rs_peers_1w": float(rs_peers_1w),
                "rs_rank_52w": float(rs_rank_52w),
                "support_zone": support_zone,
                "resistance_zone": resistance_zone,
                "volume_node": volume_node,
                "higher_high": hh,
                "higher_low": hl,
                "lower_high": lh,
                "lower_low": ll,
                "trend_break": trend_break,
                "daily_trend": daily_trend,
                "weekly_trend": weekly_trend,
                "monthly_trend": monthly_trend
            }
        }
