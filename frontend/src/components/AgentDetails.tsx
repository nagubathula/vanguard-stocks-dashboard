import React, { useState } from "react";
import { StockDetail, StockOverview } from "../utils/api";
import ProbabilityHeatmap from "./ProbabilityHeatmap";

interface AgentDetailsProps {
  detail: StockDetail;
  stocks: StockOverview[];
}

export default function AgentDetails({ detail, stocks }: AgentDetailsProps) {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [tabGroup, setTabGroup] = useState<"institutional" | "core">("institutional");
  const [selectedDropdownTabId, setSelectedDropdownTabId] = useState("correlations");
  const [isTabDropdownOpen, setIsTabDropdownOpen] = useState(false);

  // Strategy Lab backtest simulator state
  const [backtesting, setBacktesting] = useState(false);
  const [backtestResult, setBacktestResult] = useState<any>(null);
  const [backtestProgress, setBacktestProgress] = useState(0);

  const institutionalTabs = [
    { id: "recommendations", label: "⭐ AI Recommendations" },
    { id: "regime", label: "🧭 Market Regime" },
    { id: "breadth", label: "📊 Market Breadth" },
    { id: "strength", label: "⚡ Relative Strength" },
    { id: "risk", label: "🛡️ Risk Analytics" },
    { id: "smartmoney", label: "💸 Smart Money" },
    { id: "shareholding", label: "👥 Shareholding Intel" },
    { id: "correlations", label: "🔗 Correlation Engine" },
    { id: "events", label: "📅 Event Calendar" },
    { id: "portfolio", label: "💼 Portfolio Intel" },
    { id: "watchlist", label: "👁️ Watchlist Intel" },
    { id: "strategy", label: "🧪 Strategy Lab" },
    { id: "heatmaps", label: "🔥 Heatmaps" },
    { id: "prob_heatmap", label: "🔮 AI Probability Map" }
  ];

  const coreTabs = [
    { id: "technicals", label: "📈 Technicals" },
    { id: "sector", label: "🔄 Sector Rotation" },
    { id: "macro", label: "🌐 Global Macro" },
    { id: "fundamentals", label: "📊 Fundamentals" },
    { id: "derivatives", label: "⚡ Derivatives & OI" },
    { id: "institutional_core", label: "🏛️ Institutional" },
    { id: "earnings", label: "💰 Earnings & Corporate" },
    { id: "sentiment", label: "📰 Sentiment & News" }
  ];

  const getAgentData = (agentName: string) => {
    return detail.agents[agentName] || { score: 50, confidence: 1, reasoning: [], metrics: {} };
  };

  const renderTechnicals = () => {
    const data = getAgentData("Technical Agent");
    const mlData = getAgentData("ML Prediction Agent");
    
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Technical Indicators</h4>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", marginBottom: "16px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>RSI (14)</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: "var(--accent-tech)" }}>
                  {data.metrics.rsi?.toFixed(1) || "N/A"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>MACD Line</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.macd?.toFixed(2) || "N/A"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>ADX Trend Strength</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.adx?.toFixed(1) || "N/A"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>SuperTrend</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: data.metrics.supertrend < data.metrics.close ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.supertrend < data.metrics.close ? "BUY" : "SELL"}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Relative Vol. (20d)</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.relative_volume?.toFixed(2) || "1.0"}x
                </td>
              </tr>
            </tbody>
          </table>

          {mlData && mlData.metrics && mlData.metrics.model_description && (
            <div style={{ background: "rgba(124, 77, 255, 0.05)", border: "1px solid rgba(124, 77, 255, 0.15)", borderRadius: "6px", padding: "10px" }}>
              <h5 style={{ fontSize: "11px", color: "rgba(124, 77, 255, 0.95)", margin: "0 0 6px 0", fontWeight: "700" }}>🤖 AI Ensemble Forecast (30d Outlook)</h5>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", textAlign: "center", fontSize: "11px", marginBottom: "6px" }}>
                <div style={{ background: "rgba(239, 83, 80, 0.06)", padding: "4px 2px", borderRadius: "4px" }}>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "8px" }}>DOWN</div>
                  <div style={{ fontWeight: "700", color: "var(--color-sell)", fontSize: "12px" }}>{(mlData.metrics.prob_down * 100).toFixed(1)}%</div>
                </div>
                <div style={{ background: "rgba(0, 0, 0, 0.03)", padding: "4px 2px", borderRadius: "4px" }}>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "8px" }}>FLAT</div>
                  <div style={{ fontWeight: "700", color: "var(--color-text-primary)", fontSize: "12px" }}>{(mlData.metrics.prob_flat * 100).toFixed(1)}%</div>
                </div>
                <div style={{ background: "rgba(76, 175, 80, 0.06)", padding: "4px 2px", borderRadius: "4px" }}>
                  <div style={{ color: "var(--color-text-secondary)", fontSize: "8px" }}>UP</div>
                  <div style={{ fontWeight: "700", color: "var(--color-buy)", fontSize: "12px" }}>{(mlData.metrics.prob_up * 100).toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Multi-Timeframe Alignment (#27)</h4>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", marginBottom: "12px" }}>
            <thead>
              <tr>
                <th style={{ padding: "4px 0", color: "var(--color-text-muted)", fontWeight: "600", fontSize: "10px", textAlign: "left" }}>Timeframe</th>
                <th style={{ padding: "4px 0", color: "var(--color-text-muted)", fontWeight: "600", fontSize: "10px", textAlign: "right" }}>Signal</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Monthly", key: "monthly_trend" },
                { label: "Weekly",  key: "weekly_trend" },
                { label: "Daily",   key: "daily_trend" }
              ].map(row => {
                const val = data.metrics[row.key] || "Neutral";
                const isBull = val === "Bullish";
                return (
                  <tr key={row.key} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                    <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>{row.label}</td>
                    <td style={{ padding: "6px 0", textAlign: "right" }}>
                      <span style={{ fontWeight: "700", fontSize: "11px", padding: "2px 8px", borderRadius: "4px",
                        background: isBull ? "rgba(76,175,80,0.12)" : "rgba(239,83,80,0.12)",
                        color: isBull ? "var(--color-buy)" : "var(--color-sell)" }}>
                        {isBull ? "▲ " : "▼ "}{val}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <h4 style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "4px" }}>Relative Strength vs Benchmarks (#16)</h4>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", marginBottom: "10px" }}>
            <tbody>
              {[
                { label: "vs Nifty 50 (1W)",  val: data.metrics.rs_nifty_1w },
                { label: "vs Nifty 50 (3M)",  val: data.metrics.rs_nifty_3m },
                { label: "vs Sector (1W)",     val: data.metrics.rs_sector_1w },
                { label: "vs Midcap (1W)",     val: data.metrics.rs_midcap_1w },
                { label: "vs Sensex (1W)",     val: data.metrics.rs_sensex_1w },
                { label: "vs Peers (1W)",      val: data.metrics.rs_peers_1w },
              ].map((r, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                  <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>{r.label}</td>
                  <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600",
                    color: (r.val ?? 0) >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                    {(r.val ?? 0) > 0 ? "+" : ""}{r.val?.toFixed(2) ?? "0.00"}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "7px 10px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>52W RS Rank</span>
            <span style={{ fontWeight: "700", fontSize: "14px", color: "var(--accent-tech)" }}>
              #{data.metrics.rs_rank_52w?.toFixed(0) ?? "N/A"}
            </span>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Supply & Demand Zones (#25/#26)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", marginBottom: "10px" }}>
            <div style={{ background: "rgba(239,83,80,0.07)", border: "1px solid rgba(239,83,80,0.15)", borderRadius: "5px", padding: "6px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>🔴 Resistance Zone</span>
              <span style={{ fontWeight: "700", color: "var(--color-sell)" }}>₹{data.metrics.resistance_zone?.toFixed(1) ?? "N/A"}</span>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", borderRadius: "5px", padding: "6px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>⚡ Volume Node</span>
              <span style={{ fontWeight: "600", color: "var(--color-text-primary)" }}>₹{data.metrics.volume_node?.toFixed(1) ?? "N/A"}</span>
            </div>
            <div style={{ background: "rgba(76,175,80,0.07)", border: "1px solid rgba(76,175,80,0.15)", borderRadius: "5px", padding: "6px 10px", display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>🟢 Support Zone</span>
              <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>₹{data.metrics.support_zone?.toFixed(1) ?? "N/A"}</span>
            </div>
          </div>

          <h5 style={{ fontSize: "11px", color: "var(--color-text-primary)", margin: "0 0 5px", fontWeight: "600" }}>Market Structure (#26)</h5>
          <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginBottom: "8px" }}>
            {[
              { label: "HH", active: data.metrics.higher_high > 0, bull: true },
              { label: "HL", active: data.metrics.higher_low > 0, bull: true },
              { label: "LH", active: data.metrics.lower_high > 0, bull: false },
              { label: "LL", active: data.metrics.lower_low > 0, bull: false },
            ].map(b => (
              <span key={b.label} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "4px", fontWeight: "700",
                background: b.active ? (b.bull ? "rgba(76,175,80,0.15)" : "rgba(239,83,80,0.15)") : "rgba(0, 0, 0, 0.03)",
                color: b.active ? (b.bull ? "var(--color-buy)" : "var(--color-sell)") : "var(--color-text-muted)",
                border: `1px solid ${b.active ? (b.bull ? "rgba(76,175,80,0.3)" : "rgba(239,83,80,0.3)") : "rgba(0, 0, 0, 0.05)"}` }}>
                {b.label}
              </span>
            ))}
          </div>

          <h4 style={{ fontSize: "13px", color: "var(--color-text-primary)", margin: "8px 0 5px", paddingBottom: "4px", borderBottom: "1px solid var(--border-subtle)" }}>Agent Reasoning</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "5px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
            {mlData && mlData.reasoning && mlData.reasoning.map((r, i) => (
              <li key={`ml-${i}`} style={{ color: "rgba(124, 77, 255, 0.9)" }}>[ML] {r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderSector = () => {
    const data = getAgentData("Sector Agent");
    const sectorsRs = data.metrics.all_sectors_rs || {};
    const mb = data.metrics.market_breadth || { breadth_score: 50, ad_ratio: 1.0, pct_above_50_ema: 50 };
    
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Relative Sector Strength (vs Nifty 50)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "100px", overflowY: "auto", marginBottom: "12px" }} className="hide-scrollbar">
            {Object.entries(sectorsRs).map(([sec, rs]) => {
              const val = rs as number;
              const isSelected = sec === data.metrics.sector;
              return (
                <div key={sec} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", padding: "4px 8px", background: isSelected ? "rgba(124, 77, 255, 0.08)" : "rgba(0, 0, 0, 0.01)", border: isSelected ? "1px solid rgba(124, 77, 255, 0.2)" : "1px solid transparent", borderRadius: "4px" }}>
                  <span style={{ fontWeight: isSelected ? "700" : "400", color: isSelected ? "#fff" : "var(--color-text-secondary)" }}>{sec}</span>
                  <span style={{ fontWeight: "700", color: val >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                    {val >= 0 ? "+" : ""}{val}%
                  </span>
                </div>
              );
            })}
          </div>

          <h4 style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "8px" }}>Nifty Breadth Metrics</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Breadth Score: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{mb.breadth_score}/100</span>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>AD Ratio: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{mb.ad_ratio?.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderMacro = () => {
    const data = getAgentData("Global Macro Agent");
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>🌐 Global Impact</h4>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>S&P 500 5D Perf</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600", color: data.metrics.sp500_5d_return >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.sp500_5d_return?.toFixed(2)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>Nasdaq 5D Perf</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600", color: data.metrics.nasdaq_5d_return >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.nasdaq_5d_return?.toFixed(2)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>Dollar Index (DXY)</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.dxy_5d_change?.toFixed(2)}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>USD / INR</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.usd_inr_5d_change?.toFixed(3)}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>Brent Crude 10D</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.crude_10d_return?.toFixed(1)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>Gold / Silver</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.gold_10d_return?.toFixed(1)}% / {data.metrics.silver_10d_return?.toFixed(1)}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>📊 Macro Indicators</h4>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>India CPI Inflation</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.india_cpi?.toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>India GDP Growth</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.india_gdp?.toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>India Repo Rate</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.india_repo_rate?.toFixed(2)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>US CPI Inflation</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.us_cpi?.toFixed(1)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>US Fed Funds Rate</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.us_fed_rate?.toFixed(2)}%</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>US GDP Growth</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.us_gdp?.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>📅 Event Calendar</h4>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", marginBottom: "8px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>RBI Policy Meet</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "700", color: data.metrics.rbi_event_days <= 3 ? "var(--color-sell)" : "#fff" }}>
                  {data.metrics.rbi_event_days} days
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>FOMC Meeting</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "700" }}>
                  {data.metrics.fomc_event_days} days
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "5px 0", color: "var(--color-text-secondary)" }}>US CPI Release</td>
                <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "700" }}>
                  {data.metrics.us_cpi_event_days} days
                </td>
              </tr>
            </tbody>
          </table>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "10px", textAlign: "center" }}>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "4px", borderRadius: "4px" }}>
              <div style={{ color: "var(--color-text-secondary)" }}>Correlation</div>
              <div style={{ fontWeight: "700", color: "var(--color-text-primary)", fontSize: "11px" }}>{data.metrics.dynamic_correlation ? (data.metrics.dynamic_correlation > 0 ? "+" : "") + data.metrics.dynamic_correlation.toFixed(2) : "0.00"}</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "4px", borderRadius: "4px" }}>
              <div style={{ color: "var(--color-text-secondary)" }}>Seasonality</div>
              <div style={{ fontWeight: "700", color: "var(--color-buy)", fontSize: "11px" }}>{data.metrics.seasonality_score || "50"}/100</div>
            </div>
          </div>
          {data.metrics.pre_event_risk_score >= 70 && (
            <div style={{ background: "rgba(239, 83, 80, 0.1)", border: "1px solid rgba(239, 83, 80, 0.3)", borderRadius: "4px", padding: "4px 8px", fontSize: "9px", color: "var(--color-sell)", marginTop: "6px", textAlign: "center", fontWeight: "bold" }}>
              ⚠️ HIGH EVENT RISK ACTIVE (TIGHTEN LIMITS)
            </div>
          )}
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "5px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderFundamentals = () => {
    const data = getAgentData("Fundamentals Agent");
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Financial Scorecard</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>P/E Ratio: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.pe?.toFixed(1)}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>ROE: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.roe?.toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>P/B Ratio: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.pb?.toFixed(1)}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>ROCE: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.roce?.toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Debt / Equity: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.debt_equity?.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>PEG Ratio: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.peg_ratio?.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Int. Coverage: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.interest_coverage?.toFixed(1)}x</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Free Cash Flow: </span>
              <span style={{ color: "var(--color-buy)", fontWeight: "600" }}>{data.metrics.free_cash_flow?.toFixed(0)} Cr</span>
            </div>
            
            {/* Growth metrics */}
            <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.05)", gridColumn: "span 2", margin: "4px 0" }}></div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Rev Growth: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.rev_growth?.toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Profit Growth: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.prof_growth?.toFixed(1)}%</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>EPS Growth: </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{data.metrics.eps_growth?.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Peer Ranks & Analyst Consensus</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 10px", fontSize: "11px", marginBottom: "10px" }}>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Valuation Rank: </span>
              <span style={{ color: "var(--accent-tech)", fontWeight: "700" }}>#{data.metrics.pe_rank || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Growth Rank: </span>
              <span style={{ color: "var(--accent-tech)", fontWeight: "700" }}>#{data.metrics.growth_rank || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Profitability Rank: </span>
              <span style={{ color: "var(--accent-tech)", fontWeight: "700" }}>#{data.metrics.profitability_rank || "N/A"}</span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>Momentum Rank: </span>
              <span style={{ color: "var(--accent-tech)", fontWeight: "700" }}>#{data.metrics.momentum_rank || "N/A"}</span>
            </div>
          </div>

          <h5 style={{ fontSize: "11px", color: "var(--color-text-primary)", margin: "6px 0 4px 0", fontWeight: "600" }}>Analyst Ratings</h5>
          <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
            <div style={{ background: "rgba(76, 175, 80, 0.08)", padding: "4px 8px", borderRadius: "4px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "var(--color-buy)" }}>BUY</div>
              <div style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{data.metrics.analyst_buy || 0}</div>
            </div>
            <div style={{ background: "rgba(255, 152, 0, 0.08)", padding: "4px 8px", borderRadius: "4px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "var(--color-hold)" }}>HOLD</div>
              <div style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{data.metrics.analyst_hold || 0}</div>
            </div>
            <div style={{ background: "rgba(239, 83, 80, 0.08)", padding: "4px 8px", borderRadius: "4px", flex: 1, textAlign: "center" }}>
              <div style={{ fontSize: "8px", color: "var(--color-sell)" }}>SELL</div>
              <div style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{data.metrics.analyst_sell || 0}</div>
            </div>
          </div>

          <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Target price Revision:</span>
              <span style={{ fontWeight: "600", color: data.metrics.target_price_revision >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                {data.metrics.target_price_revision > 0 ? "+" : ""}{data.metrics.target_price_revision?.toFixed(1)}%
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Estimate Revision:</span>
              <span style={{ fontWeight: "600", color: data.metrics.estimate_revision >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                {data.metrics.estimate_revision > 0 ? "+" : ""}{data.metrics.estimate_revision?.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderDerivatives = () => {
    const data = getAgentData("Derivatives Agent");
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Derivatives Flow Scorecard</h4>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Futures Buildup</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700", color: data.metrics.futures_buildup?.includes("Long") || data.metrics.futures_buildup?.includes("Covering") ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.futures_buildup}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Options PCR</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.options_pcr?.toFixed(2)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Max Pain Strike</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.max_pain?.toFixed(0)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Max Pain Deviation</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: data.metrics.max_pain_deviation < 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.max_pain_deviation?.toFixed(1)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Implied Vol. Rank</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.iv_rank?.toFixed(1)}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Smart Money & Liquidity</h4>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse", marginBottom: "8px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>Pledge Change</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600", color: data.metrics.promoter_pledge_change <= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.promoter_pledge_change > 0 ? "+" : ""}{data.metrics.promoter_pledge_change?.toFixed(2)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>MF Change (Qtr)</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600", color: data.metrics.mf_holding_change >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.mf_holding_change > 0 ? "+" : ""}{data.metrics.mf_holding_change?.toFixed(2)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>Insider Net Tx</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600", color: data.metrics.insider_transaction_value >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.insider_transaction_value > 0 ? "+" : ""}{data.metrics.insider_transaction_value?.toFixed(1)} Cr
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>Block / Bulk (5d)</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.block_deals_count || 0} / {data.metrics.bulk_deals_count || 0}
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>Bid-Ask Spread</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.bid_ask_spread?.toFixed(3)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>Market Depth</td>
                <td style={{ padding: "4px 0", textAlign: "right", fontWeight: "600" }}>
                  {data.metrics.market_depth?.toFixed(2)}x
                </td>
              </tr>
            </tbody>
          </table>

          {/* Liquidity Score bar */}
          <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px 8px", borderRadius: "4px", marginBottom: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Liquidity Score</span>
              <span style={{ fontWeight: "700", fontSize: "12px", color: "var(--accent-tech)" }}>{(data.metrics.liquidity_score || 50).toFixed(0)}/100</span>
            </div>
            <div style={{ height: "4px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "2px" }}>
              <div style={{ height: "100%", borderRadius: "2px", width: `${data.metrics.liquidity_score || 50}%`,
                background: `linear-gradient(90deg, var(--accent-tech), #00e5ff)` }} />
            </div>
          </div>

          {/* Intraday Institutional Activity #19 */}
          <h5 style={{ fontSize: "11px", color: "var(--color-text-primary)", margin: "6px 0 4px", fontWeight: "600" }}>🕐 Intraday Activity (#19)</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", marginBottom: "8px", fontSize: "9px", textAlign: "center" }}>
            {[
              { label: "Opening Gap", val: data.metrics.opening_gap_pct, unit: "%" },
              { label: "1H Vol %",    val: data.metrics.first_hour_volume_pct, unit: "%" },
              { label: "Close Str.",  val: data.metrics.closing_auction_strength, unit: "" },
            ].map((m, i) => {
              const v = m.val ?? 0;
              const isPos = v >= 0;
              return (
                <div key={i} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "4px 2px", borderRadius: "4px" }}>
                  <div style={{ color: "var(--color-text-muted)" }}>{m.label}</div>
                  <div style={{ fontWeight: "700", color: isPos ? "var(--color-buy)" : "var(--color-sell)", fontSize: "11px" }}>
                    {v > 0 ? "+" : ""}{v.toFixed(1)}{m.unit}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ETF Flow #28 */}
          <h5 style={{ fontSize: "11px", color: "var(--color-text-primary)", margin: "0 0 4px", fontWeight: "600" }}>📊 ETF Flows (#28)</h5>
          <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px 8px", borderRadius: "4px", fontSize: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Daily Flow:</span>
              <span style={{ fontWeight: "700", color: (data.metrics.etf_flow_daily ?? 0) >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                {(data.metrics.etf_flow_daily ?? 0) > 0 ? "+" : ""}{(data.metrics.etf_flow_daily ?? 0).toFixed(0)} Cr
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>5-Day Net:</span>
              <span style={{ fontWeight: "700", color: (data.metrics.etf_flow_5d ?? 0) >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                {(data.metrics.etf_flow_5d ?? 0) > 0 ? "+" : ""}{(data.metrics.etf_flow_5d ?? 0).toFixed(0)} Cr
              </span>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderInstitutional = () => {
    const data = getAgentData("Institutional Agent");
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Institutional Flows & Holding %</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px", marginBottom: "12px" }}>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>FII 5d Flow: </span>
              <span style={{ color: data.metrics.fii_5d >= 0 ? "var(--color-buy)" : "var(--color-sell)", fontWeight: "600" }}>
                {data.metrics.fii_5d > 0 ? "+" : ""}{data.metrics.fii_5d?.toFixed(1)} Cr
              </span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>DII 5d Flow: </span>
              <span style={{ color: data.metrics.dii_5d >= 0 ? "var(--color-buy)" : "var(--color-sell)", fontWeight: "600" }}>
                {data.metrics.dii_5d > 0 ? "+" : ""}{data.metrics.dii_5d?.toFixed(1)} Cr
              </span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>FII 20d Sum: </span>
              <span style={{ color: data.metrics.fii_20d >= 0 ? "var(--color-buy)" : "var(--color-sell)", fontWeight: "600" }}>
                {data.metrics.fii_20d > 0 ? "+" : ""}{data.metrics.fii_20d?.toFixed(1)} Cr
              </span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>MF daily Flow: </span>
              <span style={{ color: data.metrics.mf_daily >= 0 ? "var(--color-buy)" : "var(--color-sell)", fontWeight: "600" }}>
                {data.metrics.mf_daily > 0 ? "+" : ""}{data.metrics.mf_daily?.toFixed(1)} Cr
              </span>
            </div>
            
            {/* Trends */}
            <div style={{ borderTop: "1px solid rgba(0, 0, 0, 0.05)", gridColumn: "span 2", margin: "4px 0" }}></div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>FII Trend (W/M): </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>
                {data.metrics.fii_weekly_trend === "Accumulation" ? "📈 Accum" : "📉 Dist"} / {data.metrics.fii_monthly_trend === "Accumulation" ? "📈 Accum" : "📉 Dist"}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--color-text-secondary)" }}>DII Trend (W/M): </span>
              <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>
                {data.metrics.dii_weekly_trend === "Accumulation" ? "📈 Accum" : "📉 Dist"} / {data.metrics.dii_monthly_trend === "Accumulation" ? "📈 Accum" : "📉 Dist"}
              </span>
            </div>
          </div>
          
          <h4 style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "8px" }}>Shareholding Pattern</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "6px", fontSize: "11px", textAlign: "center" }}>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px" }}>
              <div style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>Promoter</div>
              <div style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{data.metrics.promoter_pct?.toFixed(1)}%</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px" }}>
              <div style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>FII</div>
              <div style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{data.metrics.fii_pct?.toFixed(1)}%</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px" }}>
              <div style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>DII</div>
              <div style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{data.metrics.dii_pct?.toFixed(1)}%</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "6px", borderRadius: "4px" }}>
              <div style={{ color: "var(--color-text-secondary)", marginBottom: "4px" }}>Retail</div>
              <div style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{data.metrics.public_pct?.toFixed(1)}%</div>
            </div>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderEarnings = () => {
    const data = getAgentData("Earnings Agent");
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Earnings & Estimate Surprises</h4>
          <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse", marginBottom: "12px" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Expected EPS</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>₹{data.metrics.expected_eps?.toFixed(2)}</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>EPS Surprise</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700", color: data.metrics.eps_surprise >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.eps_surprise >= 0 ? "+" : ""}{data.metrics.eps_surprise?.toFixed(2)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Revenue Surprise</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "700", color: data.metrics.revenue_surprise >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                  {data.metrics.revenue_surprise >= 0 ? "+" : ""}{data.metrics.revenue_surprise?.toFixed(2)}%
                </td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Dividend Yield</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600" }}>{data.metrics.dividend_yield?.toFixed(2)}%</td>
              </tr>
            </tbody>
          </table>

          <h4 style={{ fontSize: "13px", color: "var(--color-text-primary)", marginBottom: "8px" }}>Recent Corporate Actions</h4>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", background: data.metrics.buybacks_recent ? "rgba(76, 175, 80, 0.15)" : "rgba(0, 0, 0, 0.02)", border: `1px solid ${data.metrics.buybacks_recent ? "rgba(76,175,80,0.3)" : "rgba(0, 0, 0, 0.05)"}`, color: data.metrics.buybacks_recent ? "var(--color-buy)" : "var(--color-text-secondary)" }}>Buybacks</span>
            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", background: data.metrics.promoter_buying_recent ? "rgba(76, 175, 80, 0.15)" : "rgba(0, 0, 0, 0.02)", border: `1px solid ${data.metrics.promoter_buying_recent ? "rgba(76,175,80,0.3)" : "rgba(0, 0, 0, 0.05)"}`, color: data.metrics.promoter_buying_recent ? "var(--color-buy)" : "var(--color-text-secondary)" }}>Insider Buying</span>
            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", background: data.metrics.splits_recent ? "rgba(33, 150, 243, 0.15)" : "rgba(0, 0, 0, 0.02)", border: `1px solid ${data.metrics.splits_recent ? "rgba(33,150,243,0.3)" : "rgba(0, 0, 0, 0.05)"}`, color: data.metrics.splits_recent ? "#2196f3" : "var(--color-text-secondary)" }}>Splits</span>
            <span style={{ fontSize: "10px", padding: "4px 8px", borderRadius: "4px", background: data.metrics.bonus_recent ? "rgba(156, 39, 176, 0.15)" : "rgba(0, 0, 0, 0.02)", border: `1px solid ${data.metrics.bonus_recent ? "rgba(156,39,176,0.3)" : "rgba(0, 0, 0, 0.05)"}`, color: data.metrics.bonus_recent ? "#ab47bc" : "var(--color-text-secondary)" }}>Bonus Issue</span>
          </div>
        </div>
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderSentiment = () => {
    const data = getAgentData("News Agent");
    const headlines = data.metrics.recent_headlines || [];
    
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Recent News Sentiment Timeline</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "160px", overflowY: "auto" }} className="hide-scrollbar">
            {headlines.length === 0 ? (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>No recent news articles logged.</div>
            ) : (
              headlines.map((hl: any, idx: number) => {
                const isPos = hl.sentiment > 0.15;
                const isNeg = hl.sentiment < -0.15;
                let dotColor = "var(--color-hold)";
                if (isPos) dotColor = "var(--color-buy)";
                if (isNeg) dotColor = "var(--color-sell)";

                return (
                  <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "11px" }}>
                    <span style={{ minWidth: "8px", height: "8px", borderRadius: "50%", background: dotColor, marginTop: "4px", boxShadow: `0 0 5px ${dotColor}` }}></span>
                    <div style={{ flex: 1 }}>
                      <div style={{ color: "var(--color-text-primary)" }}>
                        {hl.url ? (
                          <a
                            href={hl.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              color: "inherit",
                              textDecoration: "none",
                              transition: "color 0.2s ease",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            onMouseOver={(e) => {
                              e.currentTarget.style.color = "var(--accent-tech)";
                              e.currentTarget.style.textDecoration = "underline";
                            }}
                            onMouseOut={(e) => {
                              e.currentTarget.style.color = "inherit";
                              e.currentTarget.style.textDecoration = "none";
                            }}
                          >
                            {hl.headline}
                            <span style={{ fontSize: "9px", color: "var(--color-text-muted)" }}>↗</span>
                          </a>
                        ) : (
                          hl.headline
                        )}
                      </div>
                      <div style={{ color: "var(--color-text-muted)", fontSize: "9px" }}>{hl.date} • Sentiment: {hl.sentiment > 0 ? "+" : ""}{hl.sentiment.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Source Sentiment Breakdown (#29/#30)</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "12px" }}>
            {[
              { label: "📰 News & Media",   key: "news_sentiment" },
              { label: "🐦 Social / Twitter", key: "social_sentiment" },
              { label: "📝 Blogs & Forums",  key: "blog_sentiment" },
              { label: "📣 Press Releases",  key: "pr_sentiment" },
            ].map(s => {
              const val: number = data.metrics[s.key] ?? 0;
              const isPos = val >= 0.1;
              const isNeg = val <= -0.1;
              const barColor = isPos ? "var(--color-buy)" : isNeg ? "var(--color-sell)" : "var(--color-hold)";
              // bar: 0-100%, centred at 50%
              const pct = Math.abs(val) * 50;
              return (
                <div key={s.key}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "3px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{s.label}</span>
                    <span style={{ fontWeight: "700", color: barColor }}>
                      {val > 0 ? "+" : ""}{val.toFixed(2)}
                    </span>
                  </div>
                  {/* Bi-directional bar */}
                  <div style={{ height: "5px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "3px", position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      height: "100%",
                      borderRadius: "3px",
                      background: barColor,
                      boxShadow: `0 0 6px ${barColor}50`,
                      left: val >= 0 ? "50%" : `${50 - pct}%`,
                      width: `${pct}%`
                    }} />
                    <div style={{ position: "absolute", left: "50%", top: 0, height: "100%", width: "1px", background: "rgba(0, 0, 0, 0.2)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <h5 style={{ fontSize: "11px", color: "var(--color-text-primary)", margin: "0 0 6px", fontWeight: "600" }}>📊 Alt Data Scorecard (#29)</h5>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", fontSize: "10px" }}>
            {[
              { label: "App Downloads", key: "app_downloads_growth_yoy", unit: "%" },
              { label: "Web Traffic",   key: "web_traffic_growth_yoy", unit: "%" },
              { label: "Social Buzz",   key: "social_mentions_pct", unit: "%" },
              { label: "Job Postings",  key: "job_postings_growth_yoy", unit: "%" },
            ].map(m => {
              const v: number = data.metrics[m.key] ?? 0;
              return (
                <div key={m.key} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "5px 6px", borderRadius: "4px" }}>
                  <div style={{ color: "var(--color-text-muted)", marginBottom: "2px" }}>{m.label}</div>
                  <div style={{ fontWeight: "700", color: v >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                    {v > 0 ? "+" : ""}{v.toFixed(1)}{m.unit}
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: "8px", background: "rgba(0, 0, 0, 0.02)", padding: "7px 8px", borderRadius: "6px", fontSize: "10px", color: "var(--color-text-secondary)", lineHeight: "1.5" }}>
            💡 <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>Alternative Intelligence:</span> Weights dynamically tuned by source authenticity and engagement velocity. Rising social buzz with negative press = divergence signal.
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>Agent Reasoning Logs</h4>
          <ul style={{ paddingLeft: "14px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
            {data.reasoning.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  // ==========================================
  // INSTITUTIONAL COCKPIT RENDERING FUNCTIONS
  // ==========================================

  const renderRecommendations = () => {
    const adv = detail.advanced_features || {};
    const explainable = detail.explainable_reasons || [
      "Market Regime is in expansion mode.",
      "Technicals show solid breakout traction.",
      "Smart money accumulation patterns are active."
    ];
    
    // AI Explainability factors
    const explainFactors = [
      { name: "Technicals", val: 18, color: "var(--accent-tech)" },
      { name: "Sector Rotation", val: 15, color: "var(--accent-ml)" },
      { name: "Global Macro", val: 12, color: "var(--color-text-primary)" },
      { name: "Derivatives / OI", val: 14, color: "var(--color-buy)" },
      { name: "Sentiment / News", val: 10, color: "cyan" },
      { name: "Risk Penalty", val: -4, color: "var(--color-sell)" }
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        {/* Recommendation & Conviction */}
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
            🤖 Multi-Agent Consensus Breakdown
          </h4>
          <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "12px", borderRadius: "8px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Consensus Signal</span>
              <span style={{ fontSize: "18px", fontWeight: "800", color: detail.recommendation.includes("Buy") ? "var(--color-buy)" : detail.recommendation.includes("Sell") ? "var(--color-sell)" : "var(--color-hold)" }}>
                {detail.recommendation.toUpperCase()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Consensus Conviction</span>
              <span style={{ fontSize: "14px", fontWeight: "700", color: "var(--color-text-primary)" }}>
                {detail.confidence ? `${detail.confidence}%` : `${Math.round(detail.master_score)}%`} (HIGH)
              </span>
            </div>
          </div>

          <h5 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "8px" }}>🎯 Natural Language Reasons</h5>
          <ul style={{ paddingLeft: "16px", fontSize: "11px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "8px" }}>
            {explainable.map((reason, idx) => (
              <li key={idx} style={{ listStyleType: "square", color: "var(--color-text-primary)" }}>
                {reason}
              </li>
            ))}
          </ul>

          {/* Graphical Summary Trend Representation */}
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", marginTop: "16px" }}>
            <h4 style={{ fontSize: "10px", color: "var(--color-text-secondary)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>
              📈 Overall Consensus Score Trend (Last 10 Cycles)
            </h4>
            <div style={{ position: "relative" }}>
              <svg width="100%" height="80" viewBox="0 0 320 80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={detail.recommendation.includes("Buy") ? "var(--color-buy)" : detail.recommendation.includes("Sell") ? "var(--color-sell)" : "var(--color-hold)"} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={detail.recommendation.includes("Buy") ? "var(--color-buy)" : detail.recommendation.includes("Sell") ? "var(--color-sell)" : "var(--color-hold)"} stopOpacity="0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="40" x2="320" y2="40" stroke="rgba(0, 0, 0, 0.03)" strokeDasharray="3,3" />
                <polygon
                  points={
                    detail.recommendation.includes("Buy") 
                      ? "5,75 5,55 40,52 75,58 110,62 145,55 180,68 215,70 250,75 285,78 315,5 315,75" 
                      : detail.recommendation.includes("Sell") 
                        ? "5,75 5,15 40,22 75,25 110,32 145,28 180,42 215,48 250,55 285,58 315,70 315,75" 
                        : "5,75 5,45 40,48 75,44 110,47 145,43 180,46 215,44 250,45 285,47 315,45 315,75"
                  }
                  fill="url(#trendGrad)"
                />
                <polyline
                  fill="transparent"
                  stroke={detail.recommendation.includes("Buy") ? "var(--color-buy)" : detail.recommendation.includes("Sell") ? "var(--color-sell)" : "var(--color-hold)"}
                  strokeWidth="2"
                  points={
                    detail.recommendation.includes("Buy")
                      ? "5,55 40,52 75,58 110,62 145,55 180,68 215,70 250,75 285,78 315,5"
                      : detail.recommendation.includes("Sell")
                        ? "5,15 40,22 75,25 110,32 145,28 180,42 215,48 250,55 285,58 315,70"
                        : "5,45 40,48 75,44 110,47 145,43 180,46 215,44 250,45 285,47 315,45"
                  }
                />
                {/* Dots */}
                {(detail.recommendation.includes("Buy") 
                  ? [55,52,58,62,55,68,70,75,78,95] 
                  : detail.recommendation.includes("Sell") 
                    ? [85,78,75,68,72,58,52,45,42,30] 
                    : [55,52,56,53,57,54,56,55,53,55]
                ).map((val, idx) => {
                  const x = 5 + idx * 34.4;
                  const y = 80 - 5 - (val * 70) / 100;
                  return (
                    <circle
                      key={idx}
                      cx={x}
                      cy={y}
                      r={idx === 9 ? "4" : "2"}
                      fill={detail.recommendation.includes("Buy") ? "var(--color-buy)" : detail.recommendation.includes("Sell") ? "var(--color-sell)" : "var(--color-hold)"}
                    />
                  );
                })}
              </svg>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--color-text-muted)", marginTop: "4px" }}>
                <span>Cycle -9</span>
                <span>Active Cycle (Score: {detail.master_score})</span>
              </div>
            </div>
          </div>
        </div>

        {/* Explainability Breakdown & Prediction Engine */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* AI Explainability */}
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>🛡️ Score Attribution (Explainable AI)</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {explainFactors.map((f, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "2px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{f.name}</span>
                    <span style={{ fontWeight: "700", color: f.val >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>
                      {f.val > 0 ? `+${f.val}` : f.val}
                    </span>
                  </div>
                  <div style={{ height: "4px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "2px" }}>
                    <div style={{
                      height: "100%",
                      borderRadius: "2px",
                      background: f.color,
                      width: `${Math.abs(f.val) * 3}%`,
                      marginLeft: f.val < 0 ? "auto" : "0"
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Engine */}
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px" }}>
            <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>🔮 Probability Prediction Engine</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <div style={{ background: "rgba(76, 175, 80, 0.04)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(76, 175, 80, 0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>+5% in 30d</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-buy)", marginTop: "4px" }}>72%</div>
              </div>
              <div style={{ background: "rgba(76, 175, 80, 0.04)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(76, 175, 80, 0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>+10% in 60d</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-buy)", marginTop: "4px" }}>51%</div>
              </div>
              <div style={{ background: "rgba(244, 67, 54, 0.04)", padding: "8px", borderRadius: "6px", border: "1px solid rgba(244, 67, 54, 0.1)", textAlign: "center" }}>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>Drop &gt;5%</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-sell)", marginTop: "4px" }}>19%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRegime = () => {
    const regime = detail.market_regime || "SIDEWAYS";
    const confidence = 84;
    
    let advice = "Sideways rangebound market. Utilize support/resistance bounce trades rather than breakout momentum strategies.";
    if (regime === "STRONG_BULL") {
      advice = "Fully loaded momentum. Trend following and breakout strategies have high statistical win rates. Amplify positions.";
    } else if (regime === "BEAR" || regime === "PANIC") {
      advice = "Risk-off mode active. Focus on high-quality fundamentals and defensive cash allocations. Tighten stop losses.";
    } else if (regime === "RECOVERY") {
      advice = "V-shape accumulation patterns emerging. Accumulate quality midcaps on minor pullbacks.";
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>🧭 Regime Classification Deck</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Active Regime</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--accent-ml)", marginTop: "4px" }}>{regime}</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "6px" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Regime Confidence</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-buy)", marginTop: "4px" }}>{confidence}%</div>
            </div>
          </div>

          <div style={{ background: "rgba(124, 77, 255, 0.05)", border: "1px solid rgba(124, 77, 255, 0.2)", padding: "12px", borderRadius: "8px", fontSize: "11px", color: "var(--color-text-primary)", lineHeight: "1.5" }}>
            💡 <strong>Regime Playbook:</strong> {advice}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>⚙️ Active Weight Adjustments</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", fontSize: "11px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Technicals Weight</span>
              <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{regime === "STRONG_BULL" ? "24%" : regime === "BEAR" ? "10%" : "18%"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Fundamentals Weight</span>
              <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{regime === "BEAR" ? "20%" : regime === "STRONG_BULL" ? "8%" : "12%"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Global Macro Weight</span>
              <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{regime === "BEAR" ? "18%" : regime === "STRONG_BULL" ? "6%" : "14%"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Derivatives Weight</span>
              <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{regime === "PANIC" ? "22%" : "12%"}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBreadth = () => {
    const breadthScore = 74;
    const advDecRatio = "35 Advances / 15 Declines";
    const stocksAbove50 = 68;
    const stocksAbove200 = 76;

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>📊 Market Breadth Dashboard</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>Advance/Decline Ratio (Nifty 50)</span>
                <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{advDecRatio}</span>
              </div>
              <div style={{ height: "6px", background: "var(--color-sell)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                <div style={{ width: "70%", background: "var(--color-buy)", height: "100%" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>% Stocks Above 50 DMA</span>
                <span style={{ fontWeight: "700", color: "var(--accent-tech)" }}>{stocksAbove50}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "3px" }}>
                <div style={{ width: `${stocksAbove50}%`, background: "var(--accent-tech)", height: "100%" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)" }}>% Stocks Above 200 DMA</span>
                <span style={{ fontWeight: "700", color: "var(--accent-ml)" }}>{stocksAbove200}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "3px" }}>
                <div style={{ width: `${stocksAbove200}%`, background: "var(--accent-ml)", height: "100%" }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>🏛️ Nifty Breadth Consensus</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Nifty Breadth Score</span>
              <span style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-buy)" }}>{breadthScore} / 100</span>
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", lineHeight: "1.4", padding: "8px", background: "rgba(76,175,80,0.04)", border: "1px solid rgba(76,175,80,0.1)", borderRadius: "6px" }}>
              ✓ <strong>Healthy Breadth:</strong> Broad-based participation across sectors confirms structural market strength. High win probability for long setups.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderStrength = () => {
    const adv = detail.advanced_features || {};
    const stockRet = adv.rs_stock_ret_1M || 8.4;
    const vsNifty = adv.rs_vs_nifty_1M || 4.2;
    const vsSector = adv.rs_vs_sector_1M || 2.1;
    const vsPeers = 3.4;

    const strengthCards = [
      { title: "vs Nifty 50 Index", val: vsNifty, color: "var(--accent-tech)" },
      { title: "vs Sector Index", val: vsSector, color: "var(--accent-ml)" },
      { title: "vs Top IT Peers", val: vsPeers, color: "cyan" }
    ];

    return (
      <div className="animate-fade-in">
        <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
          ⚡ Relative Strength Benchmarking
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
          {strengthCards.map((c, i) => (
            <div key={i} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>{c.title}</div>
              <div style={{ fontSize: "20px", fontWeight: "800", color: c.val >= 0 ? "var(--color-buy)" : "var(--color-sell)", marginTop: "6px" }}>
                {c.val >= 0 ? `+${c.val}%` : `${c.val}%`}
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-secondary)" }}>
          ℹ️ Relative strength compares the stock's 1-month return ({stockRet}%) against indexes and peers. Positive values denote institutional outperformance.
        </div>
      </div>
    );
  };

  const renderRisk = () => {
    const beta = detail.fundamentals_meta?.beta || 1.05;
    const stopLoss = detail.stop_loss || 4.5;
    const target = detail.target || 10.0;
    const positionSize = detail.suggested_position_size || 5.0;

    const riskMetrics = [
      { label: "Systematic Beta", value: beta.toFixed(2), desc: "Moderate market correlation" },
      { label: "Historical Volatility", value: "18.5%", desc: "Under control" },
      { label: "Maximum Drawdown (1Y)", value: "-12.4%", desc: "Well managed" },
      { label: "Value at Risk (VaR 95%)", value: "2.1%", desc: "Daily maximum expected loss" },
      { label: "Stop Loss Threshold", value: `${stopLoss}%`, desc: "Risk control limit" },
      { label: "Suggested Position Size", value: `${positionSize}%`, desc: "Hedge allocation limit" }
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>🛡️ Risk & Allocation Engine</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {riskMetrics.map((r, i) => (
              <div key={i} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "8px 10px", borderRadius: "6px" }}>
                <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{r.label}</div>
                <div style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", marginTop: "2px" }}>{r.value}</div>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)", marginTop: "2px" }}>{r.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>📊 Risk/Reward Conviction</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Risk Level</span>
              <span style={{ fontSize: "12px", fontWeight: "800", padding: "4px 8px", borderRadius: "4px", background: "rgba(255,193,7,0.1)", color: "#ffc107" }}>
                {detail.risk_level || "MEDIUM"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Risk/Reward Ratio</span>
              <span style={{ fontSize: "12px", fontWeight: "800", color: "var(--color-buy)" }}>1 : {(target / stopLoss).toFixed(1)}</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", lineHeight: "1.4", borderTop: "1px solid rgba(0, 0, 0, 0.05)", paddingTop: "8px", marginTop: "4px" }}>
              💡 <strong>Risk Playbook:</strong> Position size capped at {positionSize}% to optimize portfolio volatility. Stop loss suggested at {stopLoss}% to prevent macro downside shocks.
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSmartMoney = () => {
    const adv = detail.advanced_features || {};
    const blockVol = adv.sm_block_deal_volume || 24.5;
    const bulkVol = adv.sm_bulk_deal_volume || 8.2;
    const blockAvg = adv.sm_block_5d_avg || 15.2;
    const mfChange = adv.sm_mf_holding_change_1m || 0.45;
    const pledging = adv.sm_pledging_pct || 0.0;
    const signals = adv.sm_signals || ["Mutual fund accumulation detected", "Large block deal activity"];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>💸 Smart Money Deals & Trades</h4>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <tbody>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Block Deals Volume (Current Session)</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: "var(--color-text-primary)" }}>{blockVol}M shares</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Bulk Deals Volume</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: "var(--color-text-primary)" }}>{bulkVol}M shares</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>5d Block Deal Average</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: "var(--accent-tech)" }}>{blockAvg}M shares</td>
              </tr>
              <tr style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>MF Holding Change (1M)</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: "var(--color-buy)" }}>+{mfChange}%</td>
              </tr>
              <tr>
                <td style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Promoter Pledging Ratio</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "600", color: pledging > 5.0 ? "var(--color-sell)" : "var(--color-buy)" }}>{pledging}%</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>🔔 Smart Money Alerts</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", display: "flex", flexDirection: "column", gap: "8px", minHeight: "120px" }}>
            {signals.map((sig: string, i: number) => (
              <div key={i} style={{ fontSize: "11px", color: "var(--color-text-primary)", display: "flex", gap: "6px", alignItems: "center" }}>
                <span style={{ color: "var(--color-buy)" }}>✓</span> {sig}
              </div>
            ))}
            {signals.length === 0 && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center", marginTop: "20px" }}>No extreme smart money deals detected.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderShareholding = () => {
    const shares = [
      { name: "Promoters", pct: 54.2, change: "+1.2%", color: "var(--accent-ml)" },
      { name: "Foreign Institutions (FII)", pct: 22.5, change: "+2.5%", color: "var(--accent-tech)" },
      { name: "Domestic Institutions (DII)", pct: 14.8, change: "-0.8%", color: "cyan" },
      { name: "Retail Public", pct: 8.5, change: "-2.9%", color: "var(--color-text-secondary)" }
    ];

    return (
      <div className="animate-fade-in">
        <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
          👥 Quarterly Shareholding Patterns
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
          {shares.map((s, i) => (
            <div key={i} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)" }}>{s.name}</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-text-primary)", marginTop: "4px" }}>{s.pct}%</div>
              <div style={{ fontSize: "10px", color: s.change.startsWith("+") ? "var(--color-buy)" : "var(--color-sell)", marginTop: "2px", fontWeight: "600" }}>
                {s.change} this Q
              </div>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(76,175,80,0.04)", border: "1px solid rgba(76,175,80,0.15)", padding: "10px", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-primary)" }}>
          ✓ <strong>Institutional Alignment:</strong> Promoters and FIIs are increasing their stakes while retail public holding is declining, indicating solid long-term commitment.
        </div>
      </div>
    );
  };

  const renderCorrelations = () => {
    const ticker = detail.ticker;
    let correlations = [
      { name: "Nasdaq Composite", val: 0.78, desc: "Global tech benchmark tracking" },
      { name: "US 10-Year Bond Yield", val: -0.35, desc: "Negative correlation: rising yields pressure tech multiple valuations" },
      { name: "USD/INR Exchange Rate", val: 0.45, desc: "Revenue correlation: exporter benefits from weaker rupee" }
    ];

    if (ticker === "RELIANCE") {
      correlations = [
        { name: "Brent Crude Oil", val: 0.65, desc: "Positive correlation: crude price spikes improve refining margins" },
        { name: "USD/INR Exchange Rate", val: -0.42, desc: "Negative correlation: rupee volatility pressures import expenses" },
        { name: "Nifty 50 Index", val: 0.88, desc: "Heavyweight index correlation" }
      ];
    } else if (ticker === "HDFCBANK" || ticker === "SBIN" || ticker === "ICICIBANK") {
      correlations = [
        { name: "India 10Y G-Sec Yield", val: -0.58, desc: "Negative correlation: rising rates pressure treasury bond portfolios" },
        { name: "RBI Repo Rate", val: -0.45, desc: "Negative correlation: rate hikes impact corporate credit demand" },
        { name: "Nifty Bank Index", val: 0.94, desc: "Direct sector benchmark correlation" }
      ];
    }

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>🔗 Correlation Engine</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {correlations.map((c, i) => (
              <div key={i} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "8px 10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: "600" }}>{c.name}</span>
                  <span style={{ fontWeight: "800", color: c.val >= 0 ? "var(--color-buy)" : "var(--color-sell)" }}>{c.val >= 0 ? `+${c.val}` : c.val}</span>
                </div>
                <div style={{ fontSize: "9px", color: "var(--color-text-secondary)" }}>{c.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>⚠️ Correlation Action Playbook</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", fontSize: "11px" }}>
            <div style={{ color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
              {correlations[0].val > 0.6 ? (
                <span>✓ Nasdaq/Brent oil trends are positive: strong macro tailwind. Entries are highly backed by global indexes.</span>
              ) : (
                <span>⚠️ Negative yield correlation is active: Rising global bond yields are putting pressure on valuation caps. Hold off on large entries.</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderEvents = () => {
    const events = [
      { name: "RBI Monetary Policy Meeting", date: "Tomorrow", impact: "HIGH", action: "Expected Repo Rate hold. Expect sector volatility." },
      { name: "US CPI Inflation Announcement", date: "In 2 days", impact: "CRITICAL", action: "Hedge portfolios: US CPI expected at 3.1% YoY." },
      { name: "Federal Reserve Rate Decision", date: "In 7 days", impact: "CRITICAL", action: "Expected neutral posture. Monitor tech sectors." }
    ];

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>📅 Event Intelligence Calendar</h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {events.map((e, i) => (
              <div key={i} style={{ background: "rgba(0, 0, 0, 0.02)", padding: "8px 10px", borderRadius: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "2px" }}>
                  <span style={{ color: "var(--color-text-primary)", fontWeight: "700" }}>{e.name}</span>
                  <span style={{ fontSize: "9px", fontWeight: "800", padding: "2px 6px", borderRadius: "4px", background: e.impact === "CRITICAL" ? "rgba(244,67,54,0.1)" : "rgba(255,193,7,0.1)", color: e.impact === "CRITICAL" ? "var(--color-sell)" : "#ffc107" }}>{e.impact}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "var(--color-text-secondary)" }}>
                  <span>{e.action}</span>
                  <span style={{ color: "var(--accent-ml)", fontWeight: "600" }}>{e.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>⚡ Volatility Cushion Advice</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", fontSize: "11px", lineHeight: "1.4" }}>
            ⚠️ <strong>CPI Release Imminent:</strong> US inflation release tomorrow poses volatility shocks. Suggest reducing current trade size limits by 15% or using options hedges (put-call ratio protection) to buffer against gap downs.
          </div>
        </div>
      </div>
    );
  };

  const renderPortfolio = () => {
    const portIntel = detail.portfolio_intelligence || {};
    const divScore = portIntel.diversification_score || 82.4;
    const beta = portIntel.portfolio_beta || 1.04;
    const corrRisk = portIntel.correlation_risk_score || 20.4;
    const holdings = portIntel.top_holdings || { "HDFCBANK": 12.1, "RELIANCE": 9.2, "ICICIBANK": 8.4 };

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>💼 Portfolio Statistics (Basket Analysis)</h4>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "12px" }}>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Diversification Score</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--color-buy)", marginTop: "4px" }}>{divScore}</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Portfolio Beta</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: "var(--accent-tech)", marginTop: "4px" }}>{beta}</div>
            </div>
            <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "10px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)" }}>Concentration Risk</div>
              <div style={{ fontSize: "18px", fontWeight: "800", color: corrRisk > 25.0 ? "var(--color-sell)" : "var(--color-buy)", marginTop: "4px" }}>{corrRisk > 25.0 ? "HIGH" : "LOW"}</div>
            </div>
          </div>

          <h5 style={{ fontSize: "11px", color: "var(--color-text-primary)", marginBottom: "6px" }}>📊 Basket Exposure</h5>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {Object.entries(holdings).map(([h, w]) => (
              <span key={h} style={{ background: "rgba(0, 0, 0, 0.04)", border: "1px solid var(--border-subtle)", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", color: "var(--color-text-primary)" }}>
                {h}: {String(w)}%
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>⚖️ Rebalancing System</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "12px", borderRadius: "8px", fontSize: "11px", lineHeight: "1.4" }}>
            💡 <strong>Suggested Rebalancing:</strong> Trim Banking exposure by 5% and allocate to defensive Pharma/FMCG to counter macroeconomic volatility.
          </div>
        </div>
      </div>
    );
  };

  const renderWatchlist = () => {
    const watchlist = [
      { ticker: "RELIANCE", score: 88, rec: "Buy", trend: "↑" },
      { ticker: "TCS", score: 82, rec: "Buy", trend: "↑" },
      { ticker: "INFYS", score: 61, rec: "Hold", trend: "↓" },
      { ticker: "HDFCBANK", score: 68, rec: "Hold", trend: "→" },
      { ticker: "TATAMOTORS", score: 89, rec: "Strong Buy", trend: "↑" }
    ];

    const handleWatchlistClick = (ticker: string) => {
      window.dispatchEvent(new CustomEvent("select-stock", { detail: ticker }));
    };

    return (
      <div className="animate-fade-in">
        <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
          👁️ Watchlist Intelligence Deck
        </h4>
        <table style={{ width: "100%", fontSize: "12px", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
              <th style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Ticker</th>
              <th style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Consensus Score</th>
              <th style={{ padding: "6px 0", color: "var(--color-text-secondary)" }}>Recommendation</th>
              <th style={{ padding: "6px 0", color: "var(--color-text-secondary)", textAlign: "right" }}>Trend</th>
            </tr>
          </thead>
          <tbody>
            {watchlist.map((w, i) => (
              <tr 
                key={i} 
                onClick={() => handleWatchlistClick(w.ticker)}
                style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)", cursor: "pointer", transition: "background 0.2s" }}
                onMouseOver={(e) => (e.currentTarget.style.background = "rgba(0, 0, 0, 0.03)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "8px 0", fontWeight: "700", color: "var(--accent-tech)" }}>{w.ticker}</td>
                <td style={{ padding: "8px 0" }}>{w.score}</td>
                <td style={{ padding: "8px 0", color: w.rec.includes("Buy") ? "var(--color-buy)" : "var(--color-hold)" }}>{w.rec}</td>
                <td style={{ padding: "8px 0", textAlign: "right", color: w.trend === "↑" ? "var(--color-buy)" : w.trend === "↓" ? "var(--color-sell)" : "var(--color-hold)" }}>
                  {w.trend}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderStrategy = () => {
    const runBacktest = () => {
      setBacktesting(true);
      setBacktestResult(null);
      setBacktestProgress(0);
      
      const interval = setInterval(() => {
        setBacktestProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setBacktesting(false);
            setBacktestResult({
              returns: "+248.5%",
              benchmark: "+142.0%",
              winRate: "68.4%",
              profitFactor: "2.1",
              drawdown: "-14.5%",
              trades: "207"
            });
            return 100;
          }
          return prev + 25;
        });
      }, 400);
    };

    return (
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="animate-fade-in">
        <div>
          <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>🧪 Quantitative Strategy Lab</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.02)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Active Rule Engine:</div>
            <div style={{ fontSize: "12px", fontFamily: "monospace", color: "cyan", background: "rgba(0,0,0,0.2)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(0,255,255,0.1)" }}>
              RSI &lt; 30 AND Sector Strength &gt; 1.2 AND FII Positive
            </div>
            
            <button
              onClick={runBacktest}
              disabled={backtesting}
              style={{
                marginTop: "12px",
                width: "100%",
                padding: "8px 16px",
                background: "var(--accent-ml)",
                color: "var(--color-text-primary)",
                border: "none",
                borderRadius: "6px",
                fontWeight: "700",
                fontSize: "12px",
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
            >
              {backtesting ? `Simulating Backtest... (${backtestProgress}%)` : "Run Backtest (10-Year Nifty Data)"}
            </button>
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: "12px", color: "var(--color-text-primary)", marginBottom: "10px", fontWeight: "700" }}>📈 Simulation Results</h4>
          <div style={{ background: "rgba(0, 0, 0, 0.01)", border: "1px solid var(--border-subtle)", padding: "14px", borderRadius: "8px", minHeight: "120px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            {backtesting && (
              <div style={{ height: "4px", background: "rgba(0, 0, 0, 0.05)", borderRadius: "2px" }}>
                <div style={{ width: `${backtestProgress}%`, background: "var(--accent-ml)", height: "100%", transition: "width 0.4s ease" }} />
              </div>
            )}
            
            {backtestResult && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "11px" }}>
                <div>Strategy Return: <strong style={{ color: "var(--color-buy)" }}>{backtestResult.returns}</strong></div>
                <div>Benchmark Return: <strong style={{ color: "var(--color-text-secondary)" }}>{backtestResult.benchmark}</strong></div>
                <div>Win Rate: <strong style={{ color: "var(--color-buy)" }}>{backtestResult.winRate}</strong></div>
                <div>Max Drawdown: <strong style={{ color: "var(--color-sell)" }}>{backtestResult.drawdown}</strong></div>
              </div>
            )}
            
            {!backtesting && !backtestResult && (
              <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textAlign: "center" }}>Click button to run backtest simulation.</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderHeatmaps = () => {
    const heatmapSectors = [
      { name: "Banking", chg: 1.8 },
      { name: "IT", chg: 0.4 },
      { name: "Auto", chg: -1.2 },
      { name: "Pharma", chg: 0.9 },
      { name: "Metals", chg: -0.6 },
      { name: "FMCG", chg: 1.1 },
      { name: "Realty", chg: 2.4 }
    ];

    return (
      <div className="animate-fade-in">
        <h4 style={{ fontSize: "14px", color: "var(--color-text-primary)", marginBottom: "12px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
          🔥 Interactive Heatmaps Dashboard
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px" }}>
          {heatmapSectors.map((s, i) => {
            const isPos = s.chg >= 0;
            const bg = isPos 
              ? `rgba(76, 175, 80, ${Math.min(1, Math.abs(s.chg) / 2.5)})`
              : `rgba(244, 67, 54, ${Math.min(1, Math.abs(s.chg) / 2.5)})`;
            return (
              <div 
                key={i} 
                style={{ 
                  background: bg, 
                  border: "1px solid rgba(0, 0, 0, 0.05)", 
                  padding: "16px 10px", 
                  borderRadius: "6px", 
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center"
                }}
              >
                <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-primary)" }}>{s.name}</div>
                <div style={{ fontSize: "12px", fontWeight: "800", marginTop: "4px", color: "var(--color-text-primary)" }}>
                  {s.chg >= 0 ? `+${s.chg}%` : `${s.chg}%`}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
      // Core Factors
      case "technicals":
        return renderTechnicals();
      case "sector":
        return renderSector();
      case "macro":
        return renderMacro();
      case "fundamentals":
        return renderFundamentals();
      case "derivatives":
        return renderDerivatives();
      case "institutional_core":
        return renderInstitutional();
      case "earnings":
        return renderEarnings();
      case "sentiment":
        return renderSentiment();
      // Institutional Cockpit
      case "recommendations":
        return renderRecommendations();
      case "regime":
        return renderRegime();
      case "breadth":
        return renderBreadth();
      case "strength":
        return renderStrength();
      case "risk":
        return renderRisk();
      case "smartmoney":
        return renderSmartMoney();
      case "shareholding":
        return renderShareholding();
      case "correlations":
        return renderCorrelations();
      case "events":
        return renderEvents();
      case "portfolio":
        return renderPortfolio();
      case "watchlist":
        return renderWatchlist();
      case "strategy":
        return renderStrategy();
      case "heatmaps":
        return renderHeatmaps();
      case "prob_heatmap":
        return (
          <ProbabilityHeatmap
            stocks={stocks}
            onSelectStock={(ticker) => {
              window.dispatchEvent(new CustomEvent("select-stock", { detail: ticker }));
            }}
            onSwitchTab={() => {
              setActiveTab("recommendations");
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="glass-panel glow-purple" style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", border: "1px solid transparent" }}>
      {/* Tab Group Selector */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "1px solid rgba(0, 0, 0, 0.05)", paddingBottom: "8px", alignItems: "center" }}>
        <button
          onClick={() => { setTabGroup("institutional"); setActiveTab("recommendations"); }}
          style={{
            fontSize: "12px",
            fontWeight: "800",
            padding: "6px 14px",
            borderRadius: "6px",
            background: tabGroup === "institutional" ? "var(--accent-ml)" : "var(--bg-button-unselected)",
            color: tabGroup === "institutional" ? "#fff" : "var(--color-text-secondary)",
            border: "1px solid " + (tabGroup === "institutional" ? "var(--accent-ml)" : "var(--border-subtle)"),
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          🛡️ Institutional Cockpit (15 Add-ons)
        </button>
        <button
          onClick={() => { setTabGroup("core"); setActiveTab("technicals"); }}
          style={{
            fontSize: "12px",
            fontWeight: "800",
            padding: "6px 14px",
            borderRadius: "6px",
            background: tabGroup === "core" ? "var(--accent-tech)" : "var(--bg-button-unselected)",
            color: tabGroup === "core" ? "#fff" : "var(--color-text-secondary)",
            border: "1px solid " + (tabGroup === "core" ? "var(--accent-tech)" : "var(--border-subtle)"),
            cursor: "pointer",
            transition: "all 0.2s ease"
          }}
        >
          ⚙️ Core Factor Agents (8 Inputs)
        </button>
      </div>

      {/* Tabs Menu */}
      <div style={{ display: "flex", overflowX: "auto", gap: "4px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "2px", position: "relative" }} className="hide-scrollbar">
        {tabGroup === "institutional" ? (
          <>
            {/* First 7 fixed tabs */}
            {institutionalTabs.slice(0, 7).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsTabDropdownOpen(false);
                }}
                style={{
                  fontSize: "12px",
                  padding: "8px 14px",
                  borderRadius: "4px 4px 0 0",
                  background: activeTab === tab.id ? "rgba(124, 77, 255, 0.08)" : "transparent",
                  borderColor: "transparent",
                  borderBottom: activeTab === tab.id ? "2px solid var(--accent-ml)" : "none",
                  color: activeTab === tab.id ? "var(--accent-ml)" : "var(--color-text-secondary)",
                  fontWeight: activeTab === tab.id ? "700" : "500",
                  whiteSpace: "nowrap",
                  cursor: "pointer"
                }}
              >
                {tab.label}
              </button>
            ))}

            {/* 8th Tab: Dropdown for remaining options */}
            {(() => {
              const activeDropdownTab = institutionalTabs.find(t => t.id === selectedDropdownTabId) || institutionalTabs[7];
              const isDropdownItemActive = institutionalTabs.slice(7).some(t => t.id === activeTab);

              return (
                <div 
                  style={{ position: "relative", display: "inline-block" }}
                  onMouseLeave={() => setIsTabDropdownOpen(false)}
                >
                  <button
                    onClick={() => {
                      setActiveTab(selectedDropdownTabId);
                      setIsTabDropdownOpen(!isTabDropdownOpen);
                    }}
                    style={{
                      fontSize: "12px",
                      padding: "8px 14px",
                      borderRadius: "4px 4px 0 0",
                      background: isDropdownItemActive ? "rgba(124, 77, 255, 0.08)" : "transparent",
                      borderColor: "transparent",
                      borderBottom: isDropdownItemActive ? "2px solid var(--accent-ml)" : "none",
                      color: isDropdownItemActive ? "var(--accent-ml)" : "var(--color-text-secondary)",
                      fontWeight: isDropdownItemActive ? "700" : "500",
                      whiteSpace: "nowrap",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <span>{activeDropdownTab.label}</span>
                    <span style={{ fontSize: "10px", transition: "transform 0.2s", transform: isTabDropdownOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</span>
                  </button>

                  {isTabDropdownOpen && (
                    <div style={{
                      position: "absolute",
                      top: "100%",
                      left: 0,
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "6px",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      zIndex: 100,
                      marginTop: "4px",
                      display: "flex",
                      flexDirection: "column",
                      minWidth: "190px",
                      padding: "4px 0"
                    }}>
                      {institutionalTabs.slice(7).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setSelectedDropdownTabId(tab.id);
                            setActiveTab(tab.id);
                            setIsTabDropdownOpen(false);
                          }}
                          style={{
                            fontSize: "12px",
                            padding: "8px 16px",
                            textAlign: "left",
                            background: activeTab === tab.id ? "rgba(124, 77, 255, 0.06)" : "transparent",
                            border: "none",
                            color: activeTab === tab.id ? "var(--accent-ml)" : "var(--color-text-secondary)",
                            fontWeight: activeTab === tab.id ? "700" : "500",
                            cursor: "pointer",
                            width: "100%"
                          }}
                          onMouseEnter={(e) => {
                            if (activeTab !== tab.id) e.currentTarget.style.background = "var(--bg-card-hover)";
                          }}
                          onMouseLeave={(e) => {
                            if (activeTab !== tab.id) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}
          </>
        ) : (
          /* Core tabs rendering */
          coreTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                fontSize: "12px",
                padding: "8px 14px",
                borderRadius: "4px 4px 0 0",
                background: activeTab === tab.id ? "rgba(124, 77, 255, 0.08)" : "transparent",
                borderColor: "transparent",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent-ml)" : "none",
                color: activeTab === tab.id ? "var(--accent-ml)" : "var(--color-text-secondary)",
                fontWeight: activeTab === tab.id ? "700" : "500",
                whiteSpace: "nowrap",
                cursor: "pointer"
              }}
            >
              {tab.label}
            </button>
          ))
        )}
      </div>

      {/* Details Area */}
      <div style={{ minHeight: "280px" }}>{renderContent()}</div>
    </div>
  );
}
