import pandas as pd
import numpy as np
from typing import Dict, Any
from agents.base import BaseAgent

class DerivativesAgent(BaseAgent):
    def __init__(self):
        super().__init__("Derivatives Agent", 0.12)

    def analyze(self, ticker: str, data: Dict[str, pd.DataFrame], context: Dict[str, Any]) -> Dict[str, Any]:
        df = data["stock_daily"]
        if df is None or len(df) < 10:
            return {
                "score": 50,
                "confidence": 0.5,
                "reasoning": ["No derivatives data available."],
                "metrics": {}
            }

        row = df.iloc[-1]
        prev_row = df.iloc[-2]
        prev_5d = df.iloc[-6]

        close_now = row["Close"]
        close_prev = prev_5d["Close"]
        oi_now = row["FuturesOI"]
        oi_prev = prev_5d["FuturesOI"]

        price_change_pct = (close_now - close_prev) / close_prev * 100
        oi_change_pct = (oi_now - oi_prev) / oi_prev * 100
        oi_daily_change = (oi_now - prev_row["FuturesOI"]) / prev_row["FuturesOI"] * 100

        # PCR, Max Pain, IV metrics
        pcr = float(row.get("OptionsPCR", 1.0))
        max_pain = float(row.get("MaxPain", close_now))
        iv_rank = float(row.get("IVRank", 30.0))
        iv_pct = float(row.get("IVPercentile", 30.0))

        reasoning = []
        score = 50.0

        # ── 1. Futures OI Buildup Analysis (max 40 pts) ─────────────────────────
        buildup = "Neutral"
        if price_change_pct > 0.5 and oi_change_pct > 2.0:
            buildup = "Long Buildup"
            score += 20.0
            reasoning.append(f"Futures show {buildup}: Price +{price_change_pct:.1f}% with Open Interest +{oi_change_pct:.1f}%, indicating strong fresh long positions.")
        elif price_change_pct < -0.5 and oi_change_pct > 2.0:
            buildup = "Short Buildup"
            score -= 20.0
            reasoning.append(f"Futures show {buildup}: Price {price_change_pct:.1f}% with Open Interest +{oi_change_pct:.1f}%, signaling fresh short addition.")
        elif price_change_pct > 0.5 and oi_change_pct < -2.0:
            buildup = "Short Covering"
            score += 15.0
            reasoning.append(f"Futures show {buildup}: Price +{price_change_pct:.1f}% with Open Interest {oi_change_pct:.1f}%, driven by short squeeze covering.")
        elif price_change_pct < -0.5 and oi_change_pct < -2.0:
            buildup = "Long Unwinding"
            score -= 10.0
            reasoning.append(f"Futures show {buildup}: Price {price_change_pct:.1f}% with Open Interest {oi_change_pct:.1f}%, representing long liquidation.")
        else:
            reasoning.append(f"Futures range-bound: OI change {oi_change_pct:+.1f}% over last 5 days.")

        # ── 2. Put-Call Ratio (max 20 pts) ─────────────────────────────────────
        if pcr > 1.25:
            score += 10.0
            reasoning.append(f"Bullish Options PCR at {pcr:.2f}: Put writers dominant, suggesting strong underlying floor.")
        elif pcr < 0.65:
            score -= 10.0
            reasoning.append(f"Bearish Options PCR at {pcr:.2f}: Call writers dominant, creating heavy overhead resistance.")
        else:
            score += 3.0
            reasoning.append(f"Balanced Options PCR at {pcr:.2f}.")

        # ── 3. Max Pain Deviation (max 15 pts) ──────────────────────────────────
        max_pain_deviation = (close_now - max_pain) / max_pain * 100
        if max_pain_deviation > 5.0:
            score -= 5.0
            reasoning.append(f"Price is {max_pain_deviation:.1f}% above Max Pain strike ({max_pain:.0f}), signaling potential pullback risk near expiry.")
        elif max_pain_deviation < -5.0:
            score += 5.0
            reasoning.append(f"Price is {abs(max_pain_deviation):.1f}% below Max Pain strike ({max_pain:.0f}), suggesting potential buying attraction.")
        else:
            score += 2.0

        # ── 4. Implied Volatility Rank ──────────────────────────────────────────
        if iv_rank > 70.0:
            reasoning.append(f"High IV Rank ({iv_rank:.1f}%): Rich options premiums favour covered-call/put-writing setups.")
            if pcr > 1.1:
                score += 5.0
                reasoning.append("High IV + Bullish PCR = heavy Put writing accumulation identified.")
        elif iv_rank < 20.0:
            reasoning.append(f"Low IV Rank ({iv_rank:.1f}%): Compressed premiums favour directional option buyers.")

        # ── 5. Option Chain Build-up ────────────────────────────────────────────
        opt_buildup = "Neutral"
        if pcr > 1.1 and iv_rank < 40.0:
            opt_buildup = "Put Writing"
            score += 5.0

        # ── 17. Smart Money Tracking ────────────────────────────────────────────
        block_deals_vol = float(row.get("BlockDealsVolume", 0.0))
        bulk_deals_vol  = float(row.get("BulkDealsVolume", 0.0))
        promoter_pledging = float(row.get("PromoterPledging", 0.0))
        mf_holding_change = float(row.get("MFHoldingChange", 0.0))
        promoter_buying  = float(row.get("PromoterBuying", 0.0))
        promoter_selling = float(row.get("PromoterSelling", 0.0))

        # Insider signal: net transaction value proxy
        insider_tx_value = float(block_deals_vol * 0.6 + (promoter_buying - promoter_selling) * 10.0)

        # Count approximate block/bulk deals in last 5 sessions
        block_count = int(df["BlockDealsVolume"].tail(5).gt(20).sum())
        bulk_count  = int(df["BulkDealsVolume"].tail(5).gt(10).sum())

        # Promoter pledge change quarter-over-quarter
        pledge_change = 0.0
        if len(df) >= 63:
            pledge_change = float(row.get("PromoterPledging", 0.0)) - float(df.iloc[-63].get("PromoterPledging", 0.0))

        if block_deals_vol > 30.0:
            score += 5.0
            reasoning.append(f"Smart Money Alert: High Block Deals volume (+{block_deals_vol:.0f} Cr) signals institutional accumulation.")
        if promoter_pledging > 25.0:
            score -= 4.0
            reasoning.append(f"Pledging Warning: High promoter pledged stake ({promoter_pledging:.1f}%) elevates downside risk.")
        elif pledge_change < -2.0:
            score += 3.0
            reasoning.append(f"Positive: Promoter pledge reduced by {abs(pledge_change):.1f}% over last quarter.")
        if mf_holding_change > 0.05:
            score += 3.0
            reasoning.append("Mutual Funds are actively increasing their allocation this quarter.")
        if promoter_buying > 0 and promoter_selling == 0:
            score += 2.0
            reasoning.append("Insider Buying: Promoters were net buyers in the last session.")

        # ── 18. Liquidity Intelligence ──────────────────────────────────────────
        traded_value = float(row.get("DailyTradedValue", 100.0))
        spread       = float(row.get("BidAskSpread", 0.01))
        depth        = float(row.get("MarketDepth", 1.0))
        imbalance    = float(row.get("OrderBookImbalance", 0.0))

        # Liquidity score: higher ADTV and depth = better; wider spread = worse
        adtv_score  = float(np.clip(traded_value / 5.0, 0, 40))   # up to 40
        spread_pen  = float(np.clip(spread * 1000, 0, 30))         # penalty up to 30
        depth_score = float(np.clip(depth * 20, 0, 20))            # up to 20
        obi_score   = float(np.clip(imbalance / 10.0, 0, 10))      # up to 10
        liquidity_score = float(np.clip(adtv_score - spread_pen + depth_score + obi_score, 5, 100))

        if liquidity_score < 30:
            score -= 3.0
            reasoning.append(f"Liquidity Risk: Low liquidity score ({liquidity_score:.0f}/100). Wide spreads or thin depth may affect execution.")
        elif liquidity_score > 70:
            score += 2.0

        # ── 19. Intraday Institutional Activity ─────────────────────────────────
        opening_gap     = float(row.get("OpeningGapPct", 0.0))
        first_hour_vol  = float(row.get("FirstHourVolumePct", 30.0))
        closing_auction = float(row.get("ClosingAuctionStrength", 0.0))

        if opening_gap > 1.5:
            score += 3.0
            reasoning.append(f"Intraday: Strong positive opening gap (+{opening_gap:.1f}%) indicates overnight institutional demand.")
        elif opening_gap < -1.5:
            score -= 3.0
            reasoning.append(f"Intraday: Negative opening gap ({opening_gap:.1f}%) signals overnight selling pressure.")

        if first_hour_vol > 40.0:
            score += 2.0
            reasoning.append(f"First-hour volume concentration ({first_hour_vol:.1f}%) is elevated — institutional activity suspected.")

        if closing_auction > 3.0:
            score += 2.0
            reasoning.append(f"Strong closing auction (+{closing_auction:.1f}%) shows end-of-day institutional accumulation.")
        elif closing_auction < -3.0:
            score -= 2.0

        # ── 28. ETF Flow Analysis ────────────────────────────────────────────────
        etf_flow = float(row.get("ETFFlow", 0.0))
        etf_5d   = float(df["ETFFlow"].tail(5).sum()) if "ETFFlow" in df.columns else 0.0
        if etf_5d > 200.0:
            score += 3.0
            reasoning.append(f"ETF Inflow Tailwind: Net Nifty/Sector ETF buying of +{etf_5d:.0f} Cr over last 5 sessions supports trend.")
        elif etf_5d < -200.0:
            score -= 3.0
            reasoning.append(f"ETF Outflow Headwind: Net ETF selling of {etf_5d:.0f} Cr over last 5 sessions is a negative signal.")

        score = float(np.clip(score, 0.0, 100.0))
        confidence = 0.90

        return {
            "score": int(score),
            "confidence": confidence,
            "reasoning": reasoning[:8],
            "metrics": {
                "futures_buildup": buildup,
                "oi_daily_change": float(oi_daily_change),
                "oi_5d_change": float(oi_change_pct),
                "options_pcr": pcr,
                "max_pain": float(max_pain),
                "max_pain_deviation": float(max_pain_deviation),
                "iv_rank": float(iv_rank),
                "iv_percentile": float(iv_pct),
                "option_chain_buildup": opt_buildup,
                # Smart Money (17)
                "block_deals_vol": block_deals_vol,
                "bulk_deals_vol": bulk_deals_vol,
                "block_deals_count": block_count,
                "bulk_deals_count": bulk_count,
                "promoter_pledge_change": float(pledge_change),
                "mf_holding_change": float(mf_holding_change),
                "insider_transaction_value": float(insider_tx_value),
                # Liquidity (18)
                "traded_value_cr": float(traded_value),
                "bid_ask_spread": float(spread * 100.0),
                "market_depth": float(depth),
                "order_book_imbalance": float(imbalance),
                "liquidity_score": float(liquidity_score),
                # Intraday (19)
                "opening_gap_pct": float(opening_gap),
                "first_hour_volume_pct": float(first_hour_vol),
                "closing_auction_strength": float(closing_auction),
                # ETF (28)
                "etf_flow_daily": float(etf_flow),
                "etf_flow_5d": float(etf_5d),
            }
        }
