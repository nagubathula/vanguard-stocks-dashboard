"""
Feature 24: Peer Comparison Engine
Ranks the stock against its sector peers on PE, growth, profitability
and momentum using STOCKS_METADATA + stock_daily returns.
"""
import os
import numpy as np
import pandas as pd
from typing import Dict, Any, List

_PEER_MOMENTUM_CACHE = {}

def compute_peer_comparison(ticker: str, data: Dict[str, pd.DataFrame]) -> Dict[str, Any]:
    from data_generator import STOCKS_METADATA

    meta = STOCKS_METADATA.get(ticker.upper())
    if meta is None:
        return {}

    sector = meta["sector"]

    # Find all peers in the same sector
    peers = {t: m for t, m in STOCKS_METADATA.items() if m["sector"] == sector}
    if len(peers) <= 1:
        return {}

    # Build a comparison DataFrame from metadata
    records = []
    for t, m in peers.items():
        records.append({
            "ticker":           t,
            "pe":               m.get("pe", 0.0),
            "roe":              m.get("roe", 0.0),
            "rev_growth":       m.get("rev_growth", 0.0),
            "net_margin":       m.get("net_margin", 0.0),
            "operating_margin": m.get("operating_margin", 0.0),
            "eps_growth":       m.get("eps_growth", 0.0),
        })

    comp_df = pd.DataFrame(records).set_index("ticker")

    # Add momentum (1-month return) from stock_daily for each peer
    for t in peers:
        peer_file = f"data/{t}_daily.csv"
        try:
            if os.path.exists(peer_file):
                mtime = os.path.getmtime(peer_file)
                cached = _PEER_MOMENTUM_CACHE.get(t)
                if cached and cached[0] == mtime:
                    comp_df.loc[t, "momentum_1m"] = cached[1]
                    continue
                
                pdf = pd.read_csv(peer_file, usecols=["Close"])
                if len(pdf) >= 22:
                    ret = (pdf["Close"].iloc[-1] - pdf["Close"].iloc[-22]) / pdf["Close"].iloc[-22] * 100
                    val = round(float(ret), 2)
                else:
                    val = 0.0
                _PEER_MOMENTUM_CACHE[t] = (mtime, val)
                comp_df.loc[t, "momentum_1m"] = val
            else:
                comp_df.loc[t, "momentum_1m"] = 0.0
        except Exception:
            comp_df.loc[t, "momentum_1m"] = 0.0

    # Rank each metric (1 = best, ascending for PE; descending for others)
    n = len(comp_df)

    def rank_col(col, ascending=False):
        ranked = comp_df[col].rank(ascending=ascending, method="min")
        pct = ((n - ranked) / (n - 1) * 100).round(1) if n > 1 else pd.Series([50.0] * n, index=comp_df.index)
        return pct

    comp_df["pe_rank"]          = rank_col("pe", ascending=True)   # lower PE = better rank
    comp_df["growth_rank"]      = rank_col("eps_growth")
    comp_df["profitability_rank"] = rank_col("roe")
    comp_df["momentum_rank"]    = rank_col("momentum_1m")

    ticker_row = comp_df.loc[ticker.upper()] if ticker.upper() in comp_df.index else None

    if ticker_row is None:
        return {}

    return {
        "peer_sector":              sector,
        "peer_count":               n,
        "peer_pe_rank":             float(ticker_row["pe_rank"]),
        "peer_growth_rank":         float(ticker_row["growth_rank"]),
        "peer_profitability_rank":  float(ticker_row["profitability_rank"]),
        "peer_momentum_rank":       float(ticker_row["momentum_rank"]),
        "peer_pe":                  float(meta.get("pe", 0.0)),
        "peer_roe":                 float(meta.get("roe", 0.0)),
        "peer_rev_growth":          float(meta.get("rev_growth", 0.0)),
        "peer_momentum_1m":         float(ticker_row.get("momentum_1m", 0.0)),
        "peer_comparisons":         comp_df[["pe", "roe", "eps_growth", "momentum_1m",
                                             "pe_rank", "growth_rank", "profitability_rank", "momentum_rank"]]
                                    .reset_index()
                                    .rename(columns={"index": "ticker"})
                                    .to_dict(orient="records"),
    }
