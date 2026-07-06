import pandas as pd
from typing import Dict, Any, List
import numpy as np

from agents.regime import RegimeDetector
from agents.technical import TechnicalAgent
from agents.sector import SectorAgent
from agents.global_macro import GlobalMacroAgent
from agents.news import NewsAgent
from agents.fundamentals import FundamentalsAgent
from agents.derivatives import DerivativesAgent
from agents.institutional import InstitutionalAgent
from agents.earnings import EarningsAgent
from agents.ml import MLAgent
# New advanced feature modules
from agents.relative_strength import compute_relative_strength
from agents.smart_money import compute_smart_money
from agents.liquidity import compute_liquidity
from agents.intraday_institutional import compute_intraday_institutional
from agents.market_regime import compute_market_regime
from agents.correlation_engine import compute_correlation_engine
from agents.event_calendar import compute_event_calendar
from agents.seasonal_patterns import compute_seasonal_patterns
from agents.peer_comparison import compute_peer_comparison
from agents.supply_demand_zones import compute_supply_demand_zones
from agents.market_structure import compute_market_structure
from agents.multitimeframe import compute_multitimeframe
from agents.etf_flow import compute_etf_flow
from agents.alternative_data import compute_alternative_data
from agents.news_categorization import compute_news_categorization
from agents.analyst_consensus import compute_analyst_consensus
from agents.portfolio_intelligence import compute_portfolio_intelligence

def sanitize_numpy(obj):
    """
    Recursively converts NumPy and Pandas data types to standard Python equivalents.
    """
    if isinstance(obj, dict):
        return {k: sanitize_numpy(v) for k, v in obj.items()}
    elif isinstance(obj, (list, tuple)):
        return [sanitize_numpy(x) for x in obj]
    elif isinstance(obj, (np.integer, np.int64, np.int32, np.int16, np.int8)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32, np.float16)):
        if np.isnan(obj) or np.isinf(obj):
            return 0.0
        return float(obj)
    elif isinstance(obj, np.bool_):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return sanitize_numpy(obj.tolist())
    elif isinstance(obj, pd.Series):
        return sanitize_numpy(obj.to_dict())
    else:
        return obj

class MasterScoringEngine:
    def __init__(self):
        self.regime_detector = RegimeDetector()
        self.agents = {
            "technicals": TechnicalAgent(),
            "sector": SectorAgent(),
            "macro": GlobalMacroAgent(),
            "fundamentals": FundamentalsAgent(),
            "sentiment": NewsAgent(),
            "derivatives": DerivativesAgent(),
            "institutional": InstitutionalAgent(),
            "earnings": EarningsAgent(),
            "ml": MLAgent()
        }
        
    def get_recommendation_label(self, score: float, regime: str) -> str:
        # Standard limits
        # 85–100 -> Strong Buy
        # 70–84 -> Buy
        # 55–69 -> Hold
        # 40–54 -> Sell
        # Below 40 -> Strong Sell
        strong_buy_threshold = 85.0
        buy_threshold = 70.0
        hold_threshold = 55.0
        sell_threshold = 40.0
        
        if regime == "HIGH_VOLATILITY":
            strong_buy_threshold = 90.0
            buy_threshold = 75.0
        elif regime == "BEAR":
            strong_buy_threshold = 88.0
            buy_threshold = 73.0

        if score >= strong_buy_threshold:
            return "Strong Buy"
        elif score >= buy_threshold:
            return "Buy"
        elif score >= hold_threshold:
            return "Hold"
        elif score >= sell_threshold:
            return "Sell"
        else:
            return "Strong Sell"

    def analyze_stock(self, ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
        # 1. Detect market regime
        regime_result = self.regime_detector.detect(data["nifty_sectors"], data["macro_indices"])
        regime = regime_result["regime"]
        
        # 2. Setup context
        context = {
            "regime": regime,
            "vix": regime_result["vix"],
            "nifty_price": regime_result["nifty_price"],
            "sector_score": 50.0  # fallback
        }
        
        # 3. Dynamic Weight Adjustment based on Regime for 8 Agents
        weights = {
            "technicals": 0.18,
            "derivatives": 0.12,
            "sector": 0.12,
            "institutional": 0.12,
            "fundamentals": 0.12,
            "earnings": 0.10,
            "sentiment": 0.10,
            "macro": 0.14
        }
        
        regime_modifications = []
        
        if regime == "BEAR":
            weights["fundamentals"] = 0.20
            weights["macro"] = 0.18
            weights["institutional"] = 0.16
            weights["technicals"] = 0.10
            weights["derivatives"] = 0.08
            weights["earnings"] = 0.10
            weights["sentiment"] = 0.08
            weights["sector"] = 0.10
            regime_modifications.append("Bear Market Regime: Prioritized fundamentals, global macro stability, and corporate holding defensive metrics.")
        elif regime == "PANIC":
            weights["derivatives"] = 0.22
            weights["macro"] = 0.20
            weights["sentiment"] = 0.18
            weights["institutional"] = 0.10
            weights["technicals"] = 0.08
            weights["fundamentals"] = 0.08
            weights["earnings"] = 0.07
            weights["sector"] = 0.07
            regime_modifications.append("Panic Regime: Max weight placed on risk-hedging options indicators, news sentiment, and macro risk engines.")
        elif regime == "RECOVERY":
            weights["technicals"] = 0.22
            weights["institutional"] = 0.18
            weights["derivatives"] = 0.14
            weights["fundamentals"] = 0.14
            weights["sector"] = 0.12
            weights["macro"] = 0.10
            weights["sentiment"] = 0.05
            weights["earnings"] = 0.05
            regime_modifications.append("Recovery Regime: Focused on smart money institutional accumulation and technical turnaround indicators.")
        elif regime == "STRONG_BULL":
            weights["technicals"] = 0.24
            weights["sector"] = 0.18
            weights["derivatives"] = 0.14
            weights["institutional"] = 0.14
            weights["sentiment"] = 0.10
            weights["fundamentals"] = 0.08
            weights["earnings"] = 0.06
            weights["macro"] = 0.06
            regime_modifications.append("Strong Bull Regime: Fully loaded momentum, sector rotation, and option chain buildup metrics.")
        elif regime == "WEAK_BULL":
            weights["fundamentals"] = 0.16
            weights["technicals"] = 0.16
            weights["sector"] = 0.14
            weights["institutional"] = 0.14
            weights["macro"] = 0.12
            weights["derivatives"] = 0.10
            weights["earnings"] = 0.09
            weights["sentiment"] = 0.09
            regime_modifications.append("Weak Bull Regime: Balanced weighting between quality fundamentals and technical breakouts.")
        elif regime == "SIDEWAYS":
            weights["technicals"] = 0.30
            weights["sector"] = 0.16
            weights["derivatives"] = 0.14
            weights["macro"] = 0.10
            weights["institutional"] = 0.10
            weights["fundamentals"] = 0.10
            weights["earnings"] = 0.05
            weights["sentiment"] = 0.05
            regime_modifications.append("Sideways Regime: Boosted rangebound technical oscillators and relative sector strength.")
        else:
            regime_modifications.append("Normal market regime. Multi-factor weighting system active.")

        # 4. Execute sector agent first so it can share its score in context for other agents
        agent_outputs = {}
        agent_outputs["sector"] = self.agents["sector"].analyze(ticker, data, context)
        context["sector_score"] = agent_outputs["sector"]["score"]

        # Execute remaining agents
        for key in self.agents.keys():
            if key == "sector":
                continue
            agent_outputs[key] = self.agents[key].analyze(ticker, data, context)
            
        # Compute advanced feature layer results
        advanced_features = {}
        try:
            advanced_features.update(compute_relative_strength(ticker, data))
        except Exception as e:
            print(f"Relative Strength error: {e}")
        try:
            advanced_features.update(compute_smart_money(ticker, data))
        except Exception as e:
            print(f"Smart Money error: {e}")
        try:
            advanced_features.update(compute_liquidity(ticker, data))
        except Exception as e:
            print(f"Liquidity error: {e}")
        try:
            advanced_features.update(compute_intraday_institutional(ticker, data))
        except Exception as e:
            print(f"Intraday Institutional error: {e}")
        try:
            advanced_features.update(compute_market_regime(ticker, data))
        except Exception as e:
            print(f"Market Regime error: {e}")
        try:
            advanced_features.update(compute_correlation_engine(ticker, data))
        except Exception as e:
            print(f"Correlation Engine error: {e}")
        try:
            advanced_features.update(compute_event_calendar(ticker, data))
        except Exception as e:
            print(f"Event Calendar error: {e}")
        try:
            advanced_features.update(compute_seasonal_patterns(ticker, data))
        except Exception as e:
            print(f"Seasonal Patterns error: {e}")
        try:
            advanced_features.update(compute_peer_comparison(ticker, data))
        except Exception as e:
            print(f"Peer Comparison error: {e}")
        try:
            advanced_features.update(compute_supply_demand_zones(ticker, data))
        except Exception as e:
            print(f"Supply & Demand Zones error: {e}")
        try:
            advanced_features.update(compute_market_structure(ticker, data))
        except Exception as e:
            print(f"Market Structure error: {e}")
        try:
            advanced_features.update(compute_multitimeframe(ticker, data))
        except Exception as e:
            print(f"Multi‑Timeframe error: {e}")
        try:
            advanced_features.update(compute_etf_flow(ticker, data))
        except Exception as e:
            print(f"ETF Flow error: {e}")
        try:
            advanced_features.update(compute_alternative_data(ticker, data))
        except Exception as e:
            print(f"Alternative Data error: {e}")
        try:
            advanced_features.update(compute_news_categorization(ticker, data))
        except Exception as e:
            print(f"News Categorization error: {e}")
        try:
            advanced_features.update(compute_analyst_consensus(ticker, data))
        except Exception as e:
            print(f"Analyst Consensus error: {e}")
        try:
            advanced_features.update(compute_portfolio_intelligence(ticker, data))
        except Exception as e:
            print(f"Portfolio Intelligence error: {e}")
        # 5. Compute master weighted score & confidence
        weighted_score = 0.0
        weighted_confidence = 0.0
        agent_reasonings = {}
        
        for key, w in weights.items():
            out = agent_outputs[key]
            agent_score = out["score"] * out["confidence"]
            weighted_score += agent_score * w
            weighted_confidence += out["confidence"] * w
            
            agent_reasonings[self.agents[key].name] = {
                "score": round(out["score"], 1),
                "confidence": round(out["confidence"], 2),
                "reasoning": out["reasoning"],
                "metrics": out["metrics"]
            }

        # Also run and add ML Prediction Agent
        if "ml" in agent_outputs:
            ml_out = agent_outputs["ml"]
            agent_reasonings[self.agents["ml"].name] = {
                "score": round(ml_out["score"], 1),
                "confidence": round(ml_out["confidence"], 2),
                "reasoning": ml_out["reasoning"],
                "metrics": ml_out["metrics"]
            }

        # Apply regime dampener if bear/panic market
        if regime in ["BEAR", "PANIC"]:
            weighted_score *= 0.88
            
        final_score = round(min(100.0, max(0.0, weighted_score)), 1)
        rec = self.get_recommendation_label(final_score, regime)
        
        # Get stop loss, target, and position size from Global Macro Agent (Risk Engine)
        macro_metrics = agent_outputs["macro"]["metrics"]
        stop_loss_pct = macro_metrics.get("stop_loss_pct", 4.0)
        target_pct = macro_metrics.get("target_pct", 10.0)
        suggested_pos = macro_metrics.get("suggested_position_size", 5.0)

        # Risk Score Calculation (100 - risk penalty based on beta, vol, and drawdown)
        vol_score = macro_metrics.get("volatility_score", 15.0)
        beta = macro_metrics.get("beta", 1.0)
        max_dd = abs(macro_metrics.get("max_drawdown", 10.0))
        risk_score = round(100 - (beta * 15 + vol_score * 0.8 + max_dd * 0.5))
        risk_score = int(np.clip(risk_score, 10, 95))

        # Dynamic Risk Level Determination (34)
        vix_val = float(context["vix"])
        if vix_val > 22.0 or vol_score > 30.0 or regime == "PANIC":
            risk_level = "HIGH"
        elif vix_val < 15.0 and vol_score < 20.0 and regime == "STRONG_BULL":
            risk_level = "LOW"
        else:
            risk_level = "MEDIUM"

        # Signal mapping (34)
        if final_score >= 70:
            signal = "BUY"
        elif final_score <= 45:
            signal = "SELL"
        else:
            signal = "HOLD"

        # Explainable AI structured reasons list (33)
        explainable_reasons = []
        explainable_reasons.append(f"Market Regime is classified as {regime} with Breadth at {regime_result['metrics'].get('market_breadth_pct', 50.0):.1f}%.")
        if agent_outputs["technicals"]["reasoning"]:
            explainable_reasons.append(f"Technical: {agent_outputs['technicals']['reasoning'][0]}")
        if agent_outputs["fundamentals"]["reasoning"]:
            explainable_reasons.append(f"Fundamental: {agent_outputs['fundamentals']['reasoning'][0]}")
        if agent_outputs["derivatives"]["reasoning"]:
            explainable_reasons.append(f"F&O / Smart Money: {agent_outputs['derivatives']['reasoning'][0]}")

        # Compile Master AI explanation summary
        summary = []
        summary.extend(regime_modifications)
        summary.append(f"Final score of {final_score} translates to a '{rec.upper()}' recommendation under the current {regime} regime.")
        
        if final_score >= 70:
            summary.append(f"Bullish conviction driven by strong {self.agents['technicals'].name} setups and {self.agents['fundamentals'].name} backing.")
        elif final_score <= 45:
            summary.append(f"Bearish signal triggered by active distribution patterns and weak institutional interest.")
        else:
            summary.append(f"Neutral posture due to sideways/weak bull trend consolidation.")

        # Portfolio-Level Intelligence (32) — Nifty 50 representative basket
        # Approximate Nifty 50 sector allocation weights (as of 2024)
        nifty50_sector_allocation = {
            "Banking":   30.5,
            "IT":        16.2,
            "Energy":    12.8,
            "FMCG":       9.1,
            "Auto":       8.4,
            "Pharma":     5.8,
            "Metals":     4.7,
            "Realty":     3.2,
            "Others":     9.3
        }

        # Per-ticker representative weight in Nifty 50
        nifty50_weights = {
            "RELIANCE": 9.2, "TCS": 5.8, "HDFCBANK": 12.1, "INFYS": 4.8,
            "ICICIBANK": 8.4, "SBIN": 2.9, "ITC": 3.2, "HINDUNILVR": 2.8,
            "TATAMOTORS": 2.1, "MARUTI": 2.5, "DRREDDY": 1.8, "SUNPHARMA": 2.4,
            "WIPRO": 1.8, "HCLTECH": 2.5, "TITAN": 1.5, "TATASTEEL": 1.6,
            "BAJFINANCE": 3.2, "AXISBANK": 3.1, "KOTAKBANK": 4.1, "BHARTIARTL": 2.8
        }

        # HHI-based diversification
        hhi = sum(w**2 for w in nifty50_weights.values())
        max_hhi = 10000.0  # 1 stock = 100%
        min_hhi = 10000.0 / len(nifty50_weights)
        diversification_score = float(np.clip(
            100.0 * (1.0 - (hhi - min_hhi) / (max_hhi - min_hhi)), 10.0, 95.0
        ))

        # Portfolio beta as asset-weight-avg of individual betas
        from data_generator import STOCKS_METADATA as SM
        total_w = sum(nifty50_weights.values())
        portfolio_beta = float(sum(
            SM.get(t, {}).get("beta", 1.0) * w / total_w
            for t, w in nifty50_weights.items()
        ))

        # Correlation risk: avg pairwise corr proxy based on sector concentration
        sector_hhi = sum(w**2 for w in nifty50_sector_allocation.values())
        correlation_risk = float(np.clip(sector_hhi / 100.0, 5.0, 80.0))

        portfolio_intel = {
            "diversification_score": round(diversification_score, 1),
            "portfolio_beta": round(portfolio_beta, 2),
            "correlation_risk_score": round(correlation_risk, 1),
            "sector_allocation": nifty50_sector_allocation,
            "top_holdings": dict(sorted(nifty50_weights.items(), key=lambda x: x[1], reverse=True)[:5])
        }

        # 35. Feature Store logging
        latest_date = data["stock_daily"]["Date"].iloc[-1]
        try:
            import os, csv
            fs_path = "data/feature_store.csv"
            os.makedirs("data", exist_ok=True)
            file_exists = os.path.exists(fs_path)
            with open(fs_path, "a", newline="") as f:
                writer = csv.writer(f)
                if not file_exists:
                    writer.writerow(["Date", "Ticker", "FinalScore", "TechnicalScore", "FundamentalScore", "SentimentScore", "MacroScore", "DerivativesScore", "Regime"])
                writer.writerow([
                    latest_date,
                    ticker,
                    final_score,
                    agent_outputs["technicals"].get("score", 50),
                    agent_outputs["fundamentals"].get("score", 50),
                    agent_outputs["sentiment"].get("score", 50),
                    agent_outputs["macro"].get("score", 50),
                    agent_outputs["derivatives"].get("score", 50),
                    regime
                ])
        except Exception as e:
            print(f"Error logging to Feature Store: {e}")

        # Target JSON output payload integrated alongside standard dashboard parameters
        payload = {
            # Standard dashboard structure
            "ticker": ticker,
            "master_score": final_score,
            "recommendation": rec,
            "market_regime": regime,
            "vix": context["vix"],
            "regime_details": regime_result,
            "weights_applied": {k: round(v, 2) for k, v in weights.items()},
            "consensus_summary": summary,
            "agents": agent_reasonings,
            
            # Advanced feature layer results
            "advanced_features": advanced_features,
            
            # Exact JSON output keys requested by the user
            "stock": ticker,
            "signal": signal,
            "confidence": int(round(weighted_confidence * 100)),
            "technical_score": int(round(agent_outputs["technicals"]["score"])),
            "sector_score": int(round(agent_outputs["sector"]["score"])),
            "fundamental_score": int(round(agent_outputs["fundamentals"]["score"])),
            "sentiment_score": int(round(agent_outputs["sentiment"]["score"])),
            "global_score": int(round(agent_outputs["macro"]["score"])),
            "risk_score": risk_score,
            "target": float(target_pct),
            "stop_loss": float(stop_loss_pct),
            "suggested_position_size": float(suggested_pos),
            # New keys
            "risk_level": risk_level,
            "explainable_reasons": explainable_reasons,
            "portfolio_intelligence": portfolio_intel
        }
        
        return sanitize_numpy(payload)
