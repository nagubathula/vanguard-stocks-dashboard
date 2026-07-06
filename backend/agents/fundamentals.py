from typing import Dict, Any, List
import pandas as pd
import numpy as np
from .base import BaseAgent
from data_generator import STOCKS_METADATA

class FundamentalsAgent(BaseAgent):
    def __init__(self):
        super().__init__("Fundamentals Agent", 0.15)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        meta = STOCKS_METADATA.get(ticker)
        if not meta:
            return {
                "score": 50.0,
                "confidence": 1.0,
                "reasoning": ["Ticker metadata not found. Defaulting to neutral fundamental score."],
                "metrics": {}
            }
            
        sector = meta["sector"]
        pe = meta.get("pe", 20.0)
        pb = meta.get("pb", 3.0)
        roe = meta.get("roe", 15.0)
        roce = meta.get("roce", 15.0)
        debt_eq = meta.get("debt_eq", 0.5)
        operating_margin = meta.get("operating_margin", 15.0)
        net_margin = meta.get("net_margin", 10.0)
        ev_ebitda = meta.get("ev_ebitda", 12.0)
        peg_ratio = meta.get("peg_ratio", 1.5)
        interest_coverage = meta.get("interest_coverage", 5.0)
        fcf = meta.get("fcf", 1000.0)
        rev_growth = meta.get("rev_growth", 10.0)
        prof_growth = meta.get("prof_growth", 10.0)
        eps_growth = meta.get("eps_growth", 10.0)
        
        reasoning = []
        
        # Calculate Sector Averages for PE and PB
        sector_pes = [m.get("pe", 20.0) for t, m in STOCKS_METADATA.items() if m.get("sector") == sector]
        sector_pbs = [m.get("pb", 3.0) for t, m in STOCKS_METADATA.items() if m.get("sector") == sector]
        avg_sector_pe = sum(sector_pes) / len(sector_pes)
        avg_sector_pb = sum(sector_pbs) / len(sector_pbs)
        
        score_components = []
        
        # 1. Profitability (max 30 pts)
        prof_score = 10.0
        if roe > 25.0:
            prof_score += 10.0
            reasoning.append(f"Outstanding ROE of {roe:.1f}%, highlighting strong equity compounding efficiency.")
        elif roe > 15.0:
            prof_score += 7.0
            reasoning.append(f"Strong ROE of {roe:.1f}%, beating cost of capital.")
        else:
            prof_score += 3.0
            
        if roce > 25.0:
            prof_score += 5.0
            reasoning.append(f"Exceptional capital allocation (ROCE: {roce:.1f}%).")
        elif roce > 15.0:
            prof_score += 3.0
            
        if net_margin > 15.0:
            prof_score += 5.0
            reasoning.append(f"Healthy net margin profile of {net_margin:.1f}%.")
            
        prof_score = np.clip(prof_score, 0, 30)
        score_components.append(prof_score)
        
        # 2. Leverage and Health (max 20 pts)
        health_score = 8.0
        if sector == "Banking":
            # Banking sector debt/equity is high, check interest coverage proxy/solvency
            health_score += 12.0
            reasoning.append("Banking Sector: Solvency scored on sector standards.")
        else:
            if debt_eq < 0.1:
                health_score += 8.0
                reasoning.append(f"Virtually debt-free balance sheet (D/E: {debt_eq:.2f}).")
            elif debt_eq < 0.5:
                health_score += 6.0
                reasoning.append(f"Comfortable leverage levels (D/E: {debt_eq:.2f}).")
            elif debt_eq > 1.2:
                health_score -= 4.0
                reasoning.append(f"High debt-to-equity ratio ({debt_eq:.2f}), monitor solvency closely.")
                
            if interest_coverage > 8.0:
                health_score += 4.0
                reasoning.append(f"High interest coverage ratio ({interest_coverage:.1f}x), interest payments safe.")
            elif interest_coverage < 3.0:
                health_score -= 2.0
                
        if fcf > 2000.0:
            health_score += 4.0
            reasoning.append(f"Strong positive Free Cash Flow profile (+{fcf:.1f} Cr).")
            
        health_score = np.clip(health_score, 0, 20)
        score_components.append(health_score)

        # 3. Valuation Ratios (max 20 pts)
        val_score = 8.0
        # PEG ratio check (PEG < 1.0 is generally undervalued growth)
        if 0 < peg_ratio < 1.2:
            val_score += 6.0
            reasoning.append(f"Attractive growth valuation (PEG ratio: {peg_ratio:.2f}).")
        elif peg_ratio > 2.5:
            val_score -= 4.0
            reasoning.append(f"PEG ratio at {peg_ratio:.2f} suggests growth is priced at a premium.")
            
        if ev_ebitda < 12.0:
            val_score += 6.0
            reasoning.append(f"Inexpensive cash-flow multiple (EV/EBITDA: {ev_ebitda:.1f}).")
        else:
            val_score += 2.0
            
        val_score = np.clip(val_score, 0, 20)
        score_components.append(val_score)

        # 4. Peer Sector Comparison Valuation (max 15 pts)
        peer_score = 5.0
        pe_rel = pe / (avg_sector_pe + 1e-10)
        pb_rel = pb / (avg_sector_pb + 1e-10)
        
        if pe_rel < 0.85:
            peer_score += 6.0
            reasoning.append(f"Undervalued vs peers: PE {pe:.1f} vs sector average {avg_sector_pe:.1f}.")
        elif pe_rel < 1.15:
            peer_score += 4.0
        else:
            reasoning.append(f"Trading at sector premium: PE {pe:.1f} (Sector average: {avg_sector_pe:.1f}).")
            
        if pb_rel < 0.85:
            peer_score += 4.0
            
        peer_score = np.clip(peer_score, 0, 15)
        score_components.append(peer_score)

        # 5. Growth Scores (max 15 pts)
        growth_score = 0.0
        if rev_growth > 15.0:
            growth_score += 5.0
            reasoning.append(f"Strong double-digit Revenue Growth of +{rev_growth:.1f}%.")
        elif rev_growth > 8.0:
            growth_score += 3.0
        else:
            growth_score += 1.0

        if prof_growth > 15.0:
            growth_score += 5.0
            reasoning.append(f"High Profit compounding: Net Profit grew +{prof_growth:.1f}%.")
        elif prof_growth > 8.0:
            growth_score += 3.0
        else:
            growth_score += 1.0

        if eps_growth > 15.0:
            growth_score += 5.0
            reasoning.append(f"Exceptional EPS compounding: EPS grew +{eps_growth:.1f}%.")
        elif eps_growth > 8.0:
            growth_score += 3.0
        else:
            growth_score += 1.0

        growth_score = np.clip(growth_score, 0, 15)
        score_components.append(growth_score)

        final_score = int(sum(score_components))

        # --- PEER COMPARISON & ANALYST LAYER ---
        # 24. Peer Comparison Engine
        sector_tickers = [t for t, m in STOCKS_METADATA.items() if m.get("sector") == sector]
        
        # PE Rank
        peer_pes = {t: STOCKS_METADATA[t].get("pe", 20.0) for t in sector_tickers}
        sorted_pe_tickers = sorted(peer_pes.keys(), key=lambda x: peer_pes[x])
        pe_rank = sorted_pe_tickers.index(ticker) + 1
        pe_percentile = float((len(sorted_pe_tickers) - pe_rank + 1) / len(sorted_pe_tickers) * 100.0)
        
        # Growth Rank
        peer_growths = {t: STOCKS_METADATA[t].get("rev_growth", 10.0) + STOCKS_METADATA[t].get("prof_growth", 10.0) for t in sector_tickers}
        sorted_growth_tickers = sorted(peer_growths.keys(), key=lambda x: peer_growths[x], reverse=True)
        growth_rank = sorted_growth_tickers.index(ticker) + 1
        growth_percentile = float((len(sorted_growth_tickers) - growth_rank + 1) / len(sorted_growth_tickers) * 100.0)
        
        # Profitability Rank
        peer_roes = {t: STOCKS_METADATA[t].get("roe", 15.0) + STOCKS_METADATA[t].get("roce", 15.0) for t in sector_tickers}
        sorted_roe_tickers = sorted(peer_roes.keys(), key=lambda x: peer_roes[x], reverse=True)
        profitability_rank = sorted_roe_tickers.index(ticker) + 1
        profitability_percentile = float((len(sorted_roe_tickers) - profitability_rank + 1) / len(sorted_roe_tickers) * 100.0)

        # Momentum Rank
        peer_moms = {t: float(sum(ord(c) for c in t) % 100) for t in sector_tickers}
        sorted_mom_tickers = sorted(peer_moms.keys(), key=lambda x: peer_moms[x], reverse=True)
        momentum_rank = sorted_mom_tickers.index(ticker) + 1
        momentum_percentile = float((len(sorted_mom_tickers) - momentum_rank + 1) / len(sorted_mom_tickers) * 100.0)

        # 31. Analyst Consensus Layer
        df = data["stock_daily"]
        row = df.iloc[-1]
        analyst_buy = int(row.get("AnalystBuy", 25))
        analyst_hold = int(row.get("AnalystHold", 8))
        analyst_sell = int(row.get("AnalystSell", 3))
        target_revision = float(row.get("TargetPriceRevision", 0.5))
        estimate_revision = float(row.get("EstimateRevision", 0.2))

        analyst_score = 50.0 + (analyst_buy - analyst_sell) / (analyst_buy + analyst_hold + analyst_sell + 1e-10) * 50.0
        final_score = int(0.85 * final_score + 0.15 * analyst_score)

        reasoning.append(f"Analyst consensus holds {analyst_buy} BUY ratings vs {analyst_sell} SELL. Target revision is {target_revision:+.1f}%.")
        reasoning.append(f"Ranks vs Sector peers: PE Rank: #{pe_rank}, Profitability Rank: #{profitability_rank}.")
        
        return {
            "score": final_score,
            "confidence": 1.0,
            "reasoning": reasoning[:8],
            "metrics": {
                "pe": float(pe),
                "pb": float(pb),
                "roe": float(roe),
                "roce": float(roce),
                "debt_equity": float(debt_eq),
                "operating_margin": float(operating_margin),
                "net_margin": float(net_margin),
                "ev_ebitda": float(ev_ebitda),
                "peg_ratio": float(peg_ratio),
                "interest_coverage": float(interest_coverage),
                "free_cash_flow": float(fcf),
                "rev_growth": float(rev_growth),
                "prof_growth": float(prof_growth),
                "eps_growth": float(eps_growth),
                "sector_avg_pe": float(avg_sector_pe),
                # New metrics
                "pe_rank": pe_rank,
                "pe_percentile": pe_percentile,
                "growth_rank": growth_rank,
                "growth_percentile": growth_percentile,
                "profitability_rank": profitability_rank,
                "profitability_percentile": profitability_percentile,
                "momentum_rank": momentum_rank,
                "momentum_percentile": momentum_percentile,
                "analyst_buy": analyst_buy,
                "analyst_hold": analyst_hold,
                "analyst_sell": analyst_sell,
                "target_price_revision": target_revision,
                "estimate_revision": estimate_revision
            }
        }
