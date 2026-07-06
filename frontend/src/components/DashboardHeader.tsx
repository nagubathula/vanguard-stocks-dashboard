import React, { useState } from "react";
import { MarketStatus, applyOverride, resetOverride } from "../utils/api";

interface DashboardHeaderProps {
  status: MarketStatus | null;
  onRefresh: () => void;
}

export default function DashboardHeader({ status, onRefresh }: DashboardHeaderProps) {
  const [loading, setLoading] = useState(false);

  if (!status) {
    return (
      <header className="glass-panel" style={{ padding: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "24px", color: "var(--color-text-primary)", fontWeight: "800" }}>Personalised Recommendations</h1>
        <div style={{ color: "var(--color-text-muted)" }}>Loading market feed...</div>
      </header>
    );
  }

  const handleSimulate = async (regimeType: string) => {
    setLoading(true);
    try {
      if (regimeType === "BEAR") {
        await applyOverride(24.5, -0.05); // high VIX, Nasdaq crash
      } else if (regimeType === "HIGH_VOLATILITY") {
        await applyOverride(28.0, 0.005);  // extreme VIX, flat Nasdaq
      } else {
        await resetOverride();
      }
      onRefresh();
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Regime styling
  let regimeClass = "glow-hold";
  let regimeColor = "var(--color-hold)";
  if (status.regime === "BULL") {
    regimeClass = "glow-buy";
    regimeColor = "var(--color-buy)";
  } else if (status.regime === "BEAR") {
    regimeClass = "glow-sell";
    regimeColor = "var(--color-sell)";
  } else if (status.regime === "HIGH_VOLATILITY") {
    regimeClass = "glow-sell";
    regimeColor = "var(--color-sell)";
  }

  return (
    <header className="glass-panel" style={{ padding: "18px 24px", marginBottom: "20px", display: "grid", gridTemplateColumns: "auto 1fr auto", gap: "20px", alignItems: "center" }}>
      {/* Brand logo */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "var(--accent-ml)", boxShadow: "0 0 10px var(--accent-ml)" }}></div>
          <h1 style={{ fontSize: "22px", letterSpacing: "1px", fontFamily: "var(--font-display)", fontWeight: "800", background: "linear-gradient(90deg, var(--color-text-primary), var(--accent-ml))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Personalised Recommendations</h1>
        </div>
        <div style={{ fontSize: "11px", color: "var(--color-text-muted)", marginTop: "2px", textTransform: "uppercase", letterSpacing: "2px" }}>Hedge-Fund Scoring Consensus</div>
      </div>

      {/* Ticker stream */}
      <div style={{ display: "flex", gap: "24px", overflowX: "auto", padding: "4px 0", fontSize: "13px", borderLeft: "1px solid var(--border-subtle)", paddingLeft: "24px" }} className="hide-scrollbar">
        <div>
          <span style={{ color: "var(--color-text-secondary)" }}>NIFTY 50: </span>
          <span style={{ fontWeight: "600" }}>{status.nifty_close.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
          <span style={{ color: status.nifty_change >= 0 ? "var(--color-buy)" : "var(--color-sell)", marginLeft: "6px", fontWeight: "500" }}>
            {status.nifty_change >= 0 ? "+" : ""}{status.nifty_change.toFixed(2)}%
          </span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-secondary)" }}>INDIA VIX: </span>
          <span style={{ color: status.vix > 20 ? "var(--color-sell)" : "var(--color-buy)", fontWeight: "600" }}>{status.vix.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-secondary)" }}>NASDAQ: </span>
          <span>{status.nasdaq.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-secondary)" }}>DXY: </span>
          <span>{status.dxy.toFixed(2)}</span>
        </div>
        <div>
          <span style={{ color: "var(--color-text-secondary)" }}>US 10Y: </span>
          <span>{status.us10y.toFixed(2)}%</span>
        </div>
      </div>

      {/* Regime Status and Simulation Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        {/* Regime indicator badge */}
        <div className={`glass-panel ${regimeClass}`} style={{ padding: "6px 12px", border: "1px solid transparent", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
          <div style={{ fontSize: "9px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", fontWeight: "600" }}>Market Regime</div>
          <div style={{ fontSize: "14px", fontWeight: "800", color: regimeColor }}>{status.regime}</div>
        </div>

        {/* Override controls */}
        <div style={{ display: "flex", gap: "8px" }}>
          <select 
            onChange={(e) => handleSimulate(e.target.value)}
            disabled={loading}
            defaultValue=""
            style={{ 
              fontSize: "12px", 
              padding: "6px 10px", 
              background: "var(--bg-card)", 
              color: "var(--color-text-primary)",
              border: "1px solid var(--border-subtle)", 
              borderRadius: "6px",
              cursor: "pointer",
              outline: "none"
            }}
          >
            <option value="" disabled style={{ color: "var(--color-text-muted)" }}>🔧 Select Regime Simulation</option>
            <option value="NORMAL" style={{ color: "var(--color-text-primary)" }}>🟢 Standard Sideways/Bull</option>
            <option value="BEAR" style={{ color: "var(--color-text-primary)" }}>🔴 Bear Market Crash (High VIX / NASDAQ drop)</option>
            <option value="HIGH_VOLATILITY" style={{ color: "var(--color-text-primary)" }}>⚠️ High Volatility Spike (VIX &gt; 28)</option>
          </select>
        </div>
      </div>
    </header>
  );
}
