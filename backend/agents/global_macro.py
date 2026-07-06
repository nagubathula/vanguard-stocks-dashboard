from typing import Dict, Any, List
import pandas as pd
import numpy as np
from .base import BaseAgent
from data_generator import STOCKS_METADATA

class GlobalMacroAgent(BaseAgent):
    def __init__(self, weight: float = 0.15):
        super().__init__("Global Macro Agent", weight)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyzes Global Macro factors, Economic data, Risk metrics, and AI interaction features.
        """
        stock_df = data.get("stock_daily")
        macro_df = data.get("macro_indices")
        
        if stock_df is None or stock_df.empty or macro_df is None or macro_df.empty:
            return {
                "score": 50,
                "confidence": 0.5,
                "reasoning": ["Insufficient data for global macro and risk analysis."],
                "metrics": {}
            }

        latest_stock = stock_df.iloc[-1]
        latest_macro = macro_df.iloc[-1]
        meta = STOCKS_METADATA.get(ticker, {})

        # Trailing returns for global factors
        nasdaq_5d_ret = (macro_df["NASDAQ"].iloc[-1] / macro_df["NASDAQ"].iloc[-5] - 1) * 100 if len(macro_df) >= 5 else 0.0
        sp_5d_ret = (macro_df["SP500"].iloc[-1] / macro_df["SP500"].iloc[-5] - 1) * 100 if len(macro_df) >= 5 else 0.0
        dji_5d_ret = (macro_df["DJI"].iloc[-1] / macro_df["DJI"].iloc[-5] - 1) * 100 if len(macro_df) >= 5 else 0.0
        dxy_5d_chg = macro_df["DXY"].iloc[-1] - macro_df["DXY"].iloc[-5] if len(macro_df) >= 5 else 0.0
        usdinr_5d_chg = macro_df["USDINR"].iloc[-1] - macro_df["USDINR"].iloc[-5] if len(macro_df) >= 5 else 0.0
        
        crude_10d_ret = (macro_df["CrudeOil"].iloc[-1] / macro_df["CrudeOil"].iloc[-10] - 1) * 100 if len(macro_df) >= 10 else 0.0
        wti_10d_ret = (macro_df["WTICrude"].iloc[-1] / macro_df["WTICrude"].iloc[-10] - 1) * 100 if len(macro_df) >= 10 else 0.0
        gold_10d_ret = (macro_df["Gold"].iloc[-1] / macro_df["Gold"].iloc[-10] - 1) * 100 if len(macro_df) >= 10 else 0.0
        silver_10d_ret = (macro_df["Silver"].iloc[-1] / macro_df["Silver"].iloc[-10] - 1) * 100 if len(macro_df) >= 10 else 0.0
        copper_10d_ret = (macro_df["Copper"].iloc[-1] / macro_df["Copper"].iloc[-10] - 1) * 100 if len(macro_df) >= 10 else 0.0
        
        us10y_5d_chg = macro_df["US10Y"].iloc[-1] - macro_df["US10Y"].iloc[-5] if len(macro_df) >= 5 else 0.0
        india10y_5d_chg = macro_df["India10Y"].iloc[-1] - macro_df["India10Y"].iloc[-5] if len(macro_df) >= 5 else 0.0

        vix = latest_macro.get("VIX", 15.0)
        india_vix = latest_macro.get("IndiaVIX", 16.0)

        # Economic metrics
        in_cpi = latest_macro.get("IndiaCPI", 5.0)
        in_wpi = latest_macro.get("IndiaWPI", 3.0)
        in_gdp = latest_macro.get("IndiaGDP", 6.8)
        in_iip = latest_macro.get("IndiaIIP", 4.0)
        in_pmi = latest_macro.get("IndiaPMI", 55.0)
        in_repo = latest_macro.get("IndiaRepoRate", 6.25)
        
        us_cpi = latest_macro.get("USCPI", 2.5)
        us_jobs = latest_macro.get("USJobs", 200.0)
        us_fed = latest_macro.get("USFedRate", 5.25)
        us_gdp = latest_macro.get("USGDP", 2.1)

        # Risk Engine calculations
        vol_score = latest_stock.get("HistVol_20", 15.0)
        beta = meta.get("beta", 1.0)
        
        # Max Drawdown over 63 days (quarter)
        close_63 = stock_df["Close"].tail(63)
        max_drawdown = 0.0
        if len(close_63) > 1:
            cum_max = close_63.cummax()
            drawdown = (close_63 - cum_max) / cum_max * 100
            max_drawdown = float(drawdown.min())

        # suggested Stop Loss (using 2 * ATR as percentage of Close)
        atr = latest_stock.get("ATR_14", latest_stock["Close"] * 0.02)
        stop_loss_pct = round((2.0 * atr / latest_stock["Close"]) * 100, 1)
        stop_loss_pct = np.clip(stop_loss_pct, 1.5, 12.0)
        
        risk_reward = 2.5  # standard target
        target_pct = round(stop_loss_pct * risk_reward, 1)
        
        # Suggested Position Size (Volatility Risk Parity)
        position_size = round(10.0 / (beta * (vol_score / 15.0)), 1)
        position_size = np.clip(position_size, 2.0, 15.0)

        reasoning = []
        score_components = []

        # 1. Global Market & Volatility (max 30 pts)
        global_score = 15
        if sp_5d_ret > 1.5 and nasdaq_5d_ret > 2.0:
            global_score += 8
            reasoning.append(f"Bullish global macro tailwinds: Nasdaq (+{nasdaq_5d_ret:.2f}%) and S&P 500 (+{sp_5d_ret:.2f}%) rising.")
        elif sp_5d_ret < -1.5:
            global_score -= 8
            reasoning.append(f"Global equity weakness: S&P 500 corrected by {sp_5d_ret:.2f}% recently.")
            
        if dji_5d_ret > 1.5:
            global_score = min(30, global_score + 2)
            reasoning.append(f"US Dow Jones index is strong (+{dji_5d_ret:.2f}% over 5 days).")
        elif dji_5d_ret < -1.5:
            global_score = max(0, global_score - 2)
            reasoning.append(f"US Dow Jones index is weak ({dji_5d_ret:.2f}% over 5 days).")

        if dxy_5d_chg > 1.0:
            global_score -= 3
            reasoning.append("Strengthening USD Index (DXY) poses emerging market capital outflow risks.")
        elif dxy_5d_chg < -1.0:
            global_score += 3
            reasoning.append("Weakening USD Index (DXY) is supportive of emerging market equities.")

        if us10y_5d_chg > 0.2:
            global_score = max(0, global_score - 2)
            reasoning.append(f"US 10Y Yield spiked +{us10y_5d_chg:.2f}% recently, creating global asset valuation pressures.")

        if india_vix < 15.0:
            global_score += 4
            reasoning.append(f"Low market volatility regime (India VIX at {india_vix:.1f}) favors risk-on assets.")
        elif india_vix > 22.0:
            global_score -= 6
            reasoning.append(f"High volatility warning: India VIX at {india_vix:.1f} indicates severe risk-off conditions.")
            
        global_score = np.clip(global_score, 0, 30)
        score_components.append(global_score)

        # 2. Economic Indicators (max 20 pts)
        economic_score = 10
        if in_pmi > 55.0:
            economic_score += 3
            reasoning.append(f"Expansionary manufacturing/services activity (India PMI at {in_pmi:.1f}).")
        if in_cpi < 5.0:
            economic_score += 3
            reasoning.append(f"Moderate inflation pressures: India CPI is stable at {in_cpi:.1f}%.")
        elif in_cpi > 6.5:
            economic_score -= 3
            reasoning.append(f"Inflation warning: India CPI elevated at {in_cpi:.1f}%, raising interest rate hike risk.")
            
        if in_gdp > 6.5 and in_iip > 3.5:
            economic_score = min(20, economic_score + 2)
            reasoning.append(f"Robust domestic growth: India GDP at {in_gdp:.1f}% and IIP expansion at {in_iip:.1f}%.")
        
        if us_gdp > 2.0 and us_jobs > 150.0:
            economic_score = min(20, economic_score + 2)
            reasoning.append("Solid US macro data support global consumer demand stability.")

        economic_score = np.clip(economic_score, 0, 20)
        score_components.append(economic_score)

        # 3. Risk Engine Scoring (max 30 pts)
        risk_score = 15
        if vol_score < 18.0:
            risk_score += 8
            reasoning.append(f"Low idiosyncratic volatility ({vol_score:.1f}% annualized) indicates stable trading behavior.")
        elif vol_score > 35.0:
            risk_score -= 10
            reasoning.append(f"Extreme volatility alert ({vol_score:.1f}% annualized) requires wide stop loss thresholds.")

        if abs(max_drawdown) < 8.0:
            risk_score += 7
            reasoning.append(f"Minimal quarterly peak-to-trough drawdown ({max_drawdown:.1f}%), highlighting high relative strength.")
        elif abs(max_drawdown) > 20.0:
            risk_score -= 5
            reasoning.append(f"Severe drawdown profile ({max_drawdown:.1f}%) indicates ongoing distribution.")

        risk_score = np.clip(risk_score, 0, 30)
        score_components.append(risk_score)

        # 4. AI Interaction & Blended Multi-Factor Features (max 20 pts)
        ai_score = 10
        
        # Interaction 1: RSI x Volume Reversal
        rsi_14 = latest_stock.get("RSI_14", 50.0)
        rel_vol = latest_stock.get("RelativeVolume", 1.0)
        if rsi_14 < 35.0 and rel_vol > 1.8:
            ai_score += 5
            reasoning.append("AI Interaction [RSI x Volume]: High volume capitulation identified, signaling high probability trend exhaustion.")
            
        # Interaction 2: MACD x Sector Strength
        sector_score = context.get("sector_score", 50.0)
        macd_hist = latest_stock.get("MACD_Hist", 0.0)
        if macd_hist > 0 and sector_score > 70:
            ai_score += 3
            reasoning.append("AI Interaction [MACD x Sector Strength]: Bullish momentum aligned with leading sector rotation strength.")

        # Interaction 3: Nasdaq x IT Sector Strength
        sector = meta.get("sector")
        if sector == "IT" and nasdaq_5d_ret > 1.5:
            ai_score += 3
            reasoning.append("AI Interaction [Nasdaq x IT Sector]: Bullish Nasdaq momentum provides immediate global sector tailwinds.")
        # Interaction 4: Crude x Reliance Energy
        elif ticker == "RELIANCE" and crude_10d_ret > 5.0:
            ai_score += 3
            reasoning.append("AI Interaction [Crude x Reliance]: Rising Brent crude values expand refining margins, acting as a direct catalyst.")

        # Interaction 5: FII Trend x Price Trend
        fii_20d = stock_df["FII_Flow"].tail(20).sum()
        stock_20d_ret = (latest_stock["Close"] / stock_df["Close"].iloc[-20] - 1.0) * 100 if len(stock_df) >= 20 else 0.0
        if fii_20d > 500 and stock_20d_ret > 3.0:
            ai_score += 3
            reasoning.append("AI Interaction [FII Flow x Price Trend]: FII aggressive accumulation matches stock price breakout.")
        elif fii_20d < -500 and stock_20d_ret < -3.0:
            ai_score -= 3
            reasoning.append("AI Warning [FII Flow x Price Trend]: Massive FII distribution matches price breakdown trend.")

        ai_score = np.clip(ai_score, 0, 20)
        score_components.append(ai_score)

        # 21. Correlation Engine
        corr_val = 0.0
        merged = pd.merge(stock_df[["Date", "Close"]], macro_df, on="Date", how="inner").tail(20)
        if len(merged) >= 10:
            if ticker == "RELIANCE":
                corr_val = float(merged["Close"].corr(merged["CrudeOil"]))
            elif sector == "IT":
                corr_val = float(merged["Close"].corr(merged["NASDAQ"]))
            elif sector == "Metals":
                corr_val = float(merged["Close"].corr(merged["Copper"]))
            elif sector == "Banking":
                corr_val = float(merged["Close"].corr(merged["India10Y"]))
            elif sector == "Pharma":
                corr_val = float(merged["Close"].corr(merged["USDINR"]))
        if abs(corr_val) > 0.4:
            reasoning.append(f"Correlation Alert: Significant link ({corr_val:+.2f}) to primary global driver.")

        # 22. Event Calendar Engine
        rbi_days = int(latest_stock.get("EventRiskDays", 12))
        fomc_days = int((rbi_days + 3) % 25)
        us_cpi_days = int((rbi_days + 8) % 25)
        nearest_event_days = min(rbi_days, fomc_days, us_cpi_days)
        if nearest_event_days <= 3:
            pre_event_risk = 75.0
            reasoning.append(f"Event Risk High: Major macro announcement in {nearest_event_days} days. Tighten limits.")
        else:
            pre_event_risk = 25.0

        # 23. Seasonal Patterns
        current_month = pd.to_datetime(latest_stock["Date"]).month
        seasonality_score = 50.0
        if sector == "Auto" and current_month in [10, 11]:
            seasonality_score = 80.0
            reasoning.append("Seasonality: Auto sector enters peak festive sales cycle (Bullish catalyst).")
        elif sector == "FMCG" and current_month in [10, 11]:
            seasonality_score = 75.0
            reasoning.append("Seasonality: Festive demand spikes retail consumption metrics.")
        elif current_month in [4, 5]:
            seasonality_score = 65.0

        final_score = int(sum(score_components))
        confidence = 0.92

        return {
            "score": final_score,
            "confidence": confidence,
            "reasoning": reasoning[:8],
            "metrics": {
                "nasdaq_5d_return": nasdaq_5d_ret,
                "sp500_5d_return": sp_5d_ret,
                "dji_5d_return": dji_5d_ret,
                "dxy_5d_change": dxy_5d_chg,
                "usd_inr_5d_change": usdinr_5d_chg,
                "crude_10d_return": crude_10d_ret,
                "wti_10d_return": wti_10d_ret,
                "gold_10d_return": gold_10d_ret,
                "silver_10d_return": silver_10d_ret,
                "copper_10d_return": copper_10d_ret,
                "us10y_5d_change": us10y_5d_chg,
                "india10y_5d_change": india10y_5d_chg,
                "india_vix": india_vix,
                "vix": vix,
                "india_cpi": in_cpi,
                "india_wpi": in_wpi,
                "india_gdp": in_gdp,
                "india_iip": in_iip,
                "india_pmi": in_pmi,
                "india_repo_rate": in_repo,
                "us_cpi": us_cpi,
                "us_jobs": us_jobs,
                "us_fed_rate": us_fed,
                "us_gdp": us_gdp,
                "volatility_score": vol_score,
                "beta": beta,
                "max_drawdown": max_drawdown,
                "stop_loss_pct": stop_loss_pct,
                "target_pct": target_pct,
                "risk_reward": risk_reward,
                "suggested_position_size": position_size,
                # New metrics
                "dynamic_correlation": corr_val,
                "rbi_event_days": rbi_days,
                "fomc_event_days": fomc_days,
                "us_cpi_event_days": us_cpi_days,
                "pre_event_risk_score": pre_event_risk,
                "seasonality_score": seasonality_score
            }
        }
