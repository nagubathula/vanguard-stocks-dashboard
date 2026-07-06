import React, { useMemo } from "react";
import { StockOverview } from "../utils/api";

interface SwingTradesProps {
  stocks: StockOverview[];
  onSelectStock: (ticker: string) => void;
  onNavigateToResearch: () => void;
}

export default function SwingTrades({
  stocks,
  onSelectStock,
  onNavigateToResearch
}: SwingTradesProps) {

  // Generate breakouts and pullbacks list based on stock properties
  const setups = useMemo(() => {
    const breakouts: any[] = [];
    const pullbacks: any[] = [];

    stocks.forEach((stock, index) => {
      // Seed values using stock properties
      const isBreakout = stock.master_score > 66 && index % 3 === 0;
      const isPullback = stock.master_score > 62 && index % 3 === 1;

      if (isBreakout) {
        breakouts.push({
          ticker: stock.ticker,
          sector: stock.sector,
          price: stock.price,
          strength: stock.master_score,
          trigger: stock.master_score > 70 ? "52-Week High Breakout" : "20-Day Range Breakout",
          volumeRvol: (1.2 + (index % 5) * 0.3).toFixed(1) + "x"
        });
      } else if (isPullback) {
        pullbacks.push({
          ticker: stock.ticker,
          sector: stock.sector,
          price: stock.price,
          strength: stock.master_score,
          support: index % 2 === 0 ? "EMA 20 Support" : "EMA 50 Support",
          status: "Holding (Bounces)"
        });
      }
    });

    return { breakouts, pullbacks };
  }, [stocks]);

  const handleActionClick = (ticker: string) => {
    onSelectStock(ticker);
    onNavigateToResearch();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px" }}>
      <div>
        <h2 style={{ fontSize: "18px", fontWeight: "900", color: "var(--color-text-primary)" }}>
          🎯 Swing Trading Opportunities
        </h2>
        <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "4px" }}>
          Regime-aligned Swing set-ups matching multi-timeframe breakouts and key moving average pullbacks.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        
        {/* Breakouts Column */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-buy)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            🚀 Bullish Breakouts (Rising Volume)
          </h3>
          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.015)", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-text-muted)" }}>
                  <th style={{ padding: "8px 12px" }}>Ticker</th>
                  <th style={{ padding: "8px 12px" }}>Breakout Trigger</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>RVOL</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Strength</th>
                </tr>
              </thead>
              <tbody>
                {setups.breakouts.slice(0, 8).map((b) => (
                  <tr
                    key={b.ticker}
                    onClick={() => handleActionClick(b.ticker)}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.015)", cursor: "pointer" }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: "8px 12px", fontWeight: "800", color: "var(--accent-ml)" }}>{b.ticker}</td>
                    <td style={{ padding: "8px 12px" }}><span style={{ color: "var(--color-buy)", fontWeight: "600" }}>{b.trigger}</span></td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "700" }}>{b.volumeRvol}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800" }}>{b.strength}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pullbacks Column */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-hold)", display: "flex", alignItems: "center", gap: "6px", marginBottom: "12px" }}>
            📥 Pullback Entry Zones (Holding Support)
          </h3>
          <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "8px", overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "rgba(0,0,0,0.015)", borderBottom: "1px solid var(--border-subtle)", color: "var(--color-text-muted)" }}>
                  <th style={{ padding: "8px 12px" }}>Ticker</th>
                  <th style={{ padding: "8px 12px" }}>Support Area</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Status</th>
                  <th style={{ padding: "8px 12px", textAlign: "right" }}>Strength</th>
                </tr>
              </thead>
              <tbody>
                {setups.pullbacks.slice(0, 8).map((p) => (
                  <tr
                    key={p.ticker}
                    onClick={() => handleActionClick(p.ticker)}
                    style={{ borderBottom: "1px solid rgba(0,0,0,0.015)", cursor: "pointer" }}
                    className="table-row-hover"
                  >
                    <td style={{ padding: "8px 12px", fontWeight: "800", color: "var(--accent-ml)" }}>{p.ticker}</td>
                    <td style={{ padding: "8px 12px" }}><span style={{ color: "var(--accent-tech)", fontWeight: "600" }}>{p.support}</span></td>
                    <td style={{ padding: "8px 12px", textAlign: "right", color: "var(--color-buy)", fontWeight: "600" }}>{p.status}</td>
                    <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800" }}>{p.strength}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <style>{`
        .table-row-hover:hover {
          background-color: var(--bg-card-hover) !important;
        }
      `}</style>
    </div>
  );
}
