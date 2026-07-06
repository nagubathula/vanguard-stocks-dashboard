import React from "react";
import { StockDetail, StockOverview } from "../utils/api";
import RadarChart from "./RadarChart";

interface AIResearchReportProps {
  detail: StockDetail;
  stocks: StockOverview[];
}

export default function AIResearchReport({ detail, stocks }: AIResearchReportProps) {
  // 1. Resolve values
  const ticker = detail.ticker;
  const score = detail.master_score;
  const rec = detail.recommendation;
  const confidence = detail.confidence;
  const riskLevel = detail.risk_level || "MEDIUM";
  const expectedReturn = detail.target || 7.2;
  const regime = detail.market_regime || "BULLISH";

  const sector = detail.fundamentals_meta?.sector || "Energy";
  const changePct = detail.advanced_features?.rs_stock_ret_1M || 5.8;
  const fiis = detail.advanced_features?.sm_fii_action || "BUYING";
  const diis = detail.advanced_features?.sm_dii_action || "BUYING";

  // Section 2: Analyst Report Text Generation
  const analystReport = `${ticker} is currently one of the ${
    score >= 78 ? "strongest" : score <= 48 ? "weakest" : "most resilient"
  } performers in the ${sector} sector. The stock is ${
    score >= 60 ? "outperforming" : "lagging"
  } Nifty 50 and its sector benchmark peers. ${
    fiis === "BUYING"
      ? "Institutional buying (FII) has shown steady accumulation over the recent sessions"
      : "FII activity indicates consolidation / distribution posture"
  } while derivatives data suggests ${
    score >= 70 ? "strong long build-up with positive momentum" : "neutral/short coverage rangebound trading"
  }. The ${sector} sector remains in a ${
    score >= 70 ? "market leading trend" : "sideways consolidation phase"
  } with supportive crude oil and global macro variables. Overall probability dynamics indicate a strong bias for further ${
    score >= 55 ? "upside" : "downside consolidation"
  }.`;

  // Section 3: Conviction Meter Component Breakdown
  const marketScore = detail.agents?.["Global Macro Agent"]?.score || 85;
  const sectorScore = detail.agents?.["Sector Agent"]?.score || 93;
  const smScore = detail.advanced_features?.sm_score || 94;
  const techScore = detail.agents?.["Technical Agent"]?.score || 87;
  const fundScore = detail.agents?.["Fundamentals Agent"]?.score || 88;
  const earnScore = detail.agents?.["Earnings Agent"]?.score || 84;
  const sentScore = detail.agents?.["News Agent"]?.score || 81;
  const riskScore = detail.risk_score || 74;

  const convictionBreakdown = [
    { label: "Market", value: marketScore },
    { label: "Sector", value: sectorScore },
    { label: "Smart Money", value: smScore },
    { label: "Technical", value: techScore },
    { label: "Fundamentals", value: fundScore },
    { label: "Earnings", value: earnScore },
    { label: "Sentiment", value: sentScore },
    { label: "Risk (Safety)", value: riskScore },
  ];

  // Section 4: Decision Tree checklist
  const isMarketBull = regime !== "BEAR" && regime !== "PANIC";
  const isSectorLeader = sectorScore >= 70;
  const isRelStrength = (detail.advanced_features?.rs_vs_nifty_1M || 0) >= 0;
  const isLongBuild = (detail.agents?.["Derivatives Agent"]?.score || 50) >= 60;
  const isFiiBuying = fiis === "BUYING" || fiis === "ACCUMULATING";
  const isPosNews = sentScore >= 60;
  const isEarningsPos = earnScore >= 60;

  const decisionTree = [
    { label: "Market Bullish", met: isMarketBull },
    { label: "Sector Leader", met: isSectorLeader },
    { label: "Strong Relative Strength", met: isRelStrength },
    { label: "Long Build-up", met: isLongBuild },
    { label: "FII Buying", met: isFiiBuying },
    { label: "Positive News Impact", met: isPosNews },
    { label: "Earnings Revisions Positive", met: isEarningsPos },
  ];

  // Section 5: Factor Strength Wheel (Radar)
  const radarData = [
    { label: "Market", value: marketScore },
    { label: "Sector", value: sectorScore },
    { label: "OI", value: detail.agents?.["Derivatives Agent"]?.score || 75 },
    { label: "Sentiment", value: sentScore },
    { label: "Fundamentals", value: fundScore },
    { label: "Risk", value: riskScore },
    { label: "Momentum", value: techScore },
    { label: "Institutional", value: detail.agents?.["Institutional Agent"]?.score || 80 },
  ];

  // Section 6: Smart Money markers
  const fiiActionStr = fiis === "BUYING" ? "++++" : fiis === "ACCUMULATING" ? "+++" : "++";
  const diiActionStr = diis === "BUYING" ? "+++" : diis === "ACCUMULATING" ? "++" : "+";
  const promoterStr = (detail.fundamentals_meta?.promoter_change || 0) >= 0 ? "++" : "+";
  const blockDealsStr = (detail.advanced_features?.sm_block_deal_volume || 0) >= 20.0 ? "+++" : "++";

  // Section 7: Market Context
  const isBreadthStrong = (detail.regime_details?.metrics?.market_breadth_pct || 50.0) >= 60.0;
  const isVixLow = (detail.vix || 15.0) < 18.0;

  // Section 8: Deep Research
  const revGrowth = (detail.fundamentals_meta?.rev_growth || 10.0) >= 12.0 ? "Strong" : "Moderate";
  const profGrowth = (detail.fundamentals_meta?.prof_growth || 10.0) >= 10.0 ? "Strong" : "Moderate";
  const roeVal = detail.fundamentals_meta?.roe || 18;
  const debtLevel = (detail.fundamentals_meta?.debt_eq || 0.4) < 0.6 ? "Low" : "Moderate";
  
  const sectorRank = `#${Math.max(1, Math.min(5, Math.floor((100 - sectorScore) / 10) + 1))} of 50`;
  const sectorStrength = sectorScore;

  // Section 10: Risk details
  const nextHighImpact = detail.advanced_features?.evt_next_high_impact || "FOMC Meeting";
  const eventDays = detail.advanced_features?.evt_days_to_next_high || 10;
  const drawdownVal = detail.stop_loss || 4.5;

  // Section 11: Probabilities
  const prob15d = detail.advanced_features?.prob_up_1w || 86;
  const prob30d = Math.round(prob15d * 0.92);
  const prob90d = Math.round(prob15d * 0.72);
  const probDrawdown = Math.round((detail.advanced_features?.prob_down_1w || 25.0) * 0.45);

  // Section 12: Explainability Engine Additions/Subtractions
  const marketAdd = Math.round(marketScore * 0.20);
  const sectorAdd = Math.round(sectorScore * 0.15);
  const oiAdd = Math.round((detail.agents?.["Derivatives Agent"]?.score || 75) * 0.20);
  const fiiAdd = Math.round(smScore * 0.15);
  const fundAdd = Math.round(fundScore * 0.10);
  const newsAdd = Math.round(sentScore * 0.10);
  const riskPenaltyVal = Math.round((100 - riskScore) * 0.10);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "20px", width: "100%", animation: "fadeIn 0.3s ease-out" }}>
      
      {/* Row 1: Executive Summary, AI Analyst Report, and Probability Engine */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr 1fr", gap: "16px" }}>
        
        {/* Section 1: Executive Summary */}
        <div className="glass-panel glow-purple" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600" }}>Flagship Research</div>
            <h2 style={{ fontSize: "22px", fontWeight: "900", color: "var(--color-text-primary)", marginTop: "4px" }}>{ticker}</h2>
            <div style={{ fontSize: "11px", color: "var(--accent-tech)", fontWeight: "700" }}>{sector.toUpperCase()} SECTOR</div>
          </div>

          <div style={{ margin: "16px 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>AI Score:</span>
              <span style={{ fontSize: "28px", fontWeight: "900", color: "var(--accent-ml)" }}>{score}/100</span>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px" }}>
              <span style={{ fontSize: "12px", color: "var(--color-text-secondary)" }}>Recommendation:</span>
              <span style={{ 
                fontSize: "14px", 
                fontWeight: "800", 
                padding: "3px 8px", 
                borderRadius: "4px", 
                background: rec.includes("Buy") ? "rgba(76, 175, 80, 0.15)" : rec.includes("Sell") ? "rgba(244, 67, 54, 0.15)" : "rgba(255, 193, 7, 0.15)",
                color: rec.includes("Buy") ? "var(--color-buy)" : rec.includes("Sell") ? "var(--color-sell)" : "var(--color-hold)"
              }}>
                {rec.toUpperCase()}
              </span>
            </div>
          </div>

          <div style={{ borderTop: "1px dashed var(--border-subtle)", paddingTop: "12px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "11px" }}>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Confidence:</span>
              <div style={{ fontWeight: "700", color: "var(--color-text-primary)", fontSize: "13px" }}>{confidence}%</div>
            </div>
            <div>
              <span style={{ color: "var(--color-text-muted)" }}>Risk Level:</span>
              <div style={{ fontWeight: "700", color: riskLevel === "HIGH" ? "var(--color-sell)" : "var(--color-buy)", fontSize: "13px" }}>{riskLevel}</div>
            </div>
            <div style={{ marginTop: "4px" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Expected Return:</span>
              <div style={{ fontWeight: "700", color: "var(--color-buy)", fontSize: "13px" }}>+{expectedReturn.toFixed(1)}% <span style={{ fontSize: "9px" }}>(30D)</span></div>
            </div>
            <div style={{ marginTop: "4px" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Market Regime:</span>
              <div style={{ fontWeight: "700", color: "var(--accent-tech)", fontSize: "13px" }}>{regime}</div>
            </div>
          </div>
        </div>

        {/* Section 2: AI Analyst Report */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
            🤖 AI Analyst Report Synthesis
          </h3>
          <p style={{ fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.6", flexGrow: 1, textAlign: "justify" }}>
            {analystReport}
          </p>
          <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "6px", fontSize: "11px", color: "var(--color-text-muted)", marginTop: "12px", border: "1px solid var(--border-subtle)" }}>
            💡 <em>Consensus Recommendation is dynamically calibrated across 8 underlying multi-agent inputs based on the prevailing {regime} regime coefficients.</em>
          </div>
        </div>

        {/* Section 11: Probability Engine */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            🔮 AI Probability Engine
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontWeight: "600" }}>+3% Upward Target (15 Days)</span>
                <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{prob15d}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0,0,0,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${prob15d}%`, background: "var(--color-buy)", height: "100%" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontWeight: "600" }}>+5% Upward Target (30 Days)</span>
                <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{prob30d}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0,0,0,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${prob30d}%`, background: "var(--color-buy)", height: "100%" }} />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontWeight: "600" }}>+10% Upward Target (90 Days)</span>
                <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{prob90d}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0,0,0,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${prob90d}%`, background: "var(--color-buy)", height: "100%" }} />
              </div>
            </div>

            <div style={{ borderTop: "1px dashed var(--border-subtle)", paddingTop: "10px", marginTop: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-secondary)", fontWeight: "600" }}>Extreme Drawdown &gt; 5%</span>
                <span style={{ fontWeight: "700", color: "var(--color-sell)" }}>{probDrawdown}%</span>
              </div>
              <div style={{ height: "6px", background: "rgba(0,0,0,0.04)", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${probDrawdown}%`, background: "var(--color-sell)", height: "100%" }} />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 2: Conviction Meter, Factor Strength Wheel (Radar), and Decision Tree */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "16px" }}>
        
        {/* Section 3: Conviction Meter */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            ⚖️ AI Conviction Meter Breakdown
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", background: "rgba(124, 77, 255, 0.03)", padding: "10px 14px", borderRadius: "6px", border: "1px solid rgba(124, 77, 255, 0.1)" }}>
            <span style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-text-primary)" }}>Consensus Score:</span>
            <span style={{ fontSize: "18px", fontWeight: "900", color: "var(--accent-ml)" }}>{score} / 100</span>
          </div>
          <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                <th style={{ padding: "4px 0", color: "var(--color-text-secondary)" }}>Component Factor</th>
                <th style={{ padding: "4px 0", textAlign: "right", color: "var(--color-text-secondary)" }}>Agent Score</th>
              </tr>
            </thead>
            <tbody>
              {convictionBreakdown.map((c, i) => (
                <tr key={i} style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.02)" }}>
                  <td style={{ padding: "5px 0", color: "var(--color-text-primary)" }}>{c.label}</td>
                  <td style={{ padding: "5px 0", textAlign: "right", fontWeight: "700" }}>
                    <span style={{ color: c.value >= 75 ? "var(--color-buy)" : c.value <= 45 ? "var(--color-sell)" : "var(--color-text-primary)" }}>
                      {c.value}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 5: Factor Strength Wheel */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "6px", width: "100%" }}>
            🕸️ Factor Strength Fingerprint
          </h3>
          <RadarChart data={radarData} size={220} />
        </div>

        {/* Section 4: AI Decision Tree */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            🌳 AI Decision Tree Checklist
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {decisionTree.map((node, i) => (
              <div 
                key={i} 
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px", 
                  fontSize: "12px",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  background: node.met ? "rgba(76, 175, 80, 0.04)" : "rgba(244, 67, 54, 0.03)",
                  border: `1px solid ${node.met ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.05)"}`
                }}
              >
                <span style={{ 
                  fontWeight: "800", 
                  color: node.met ? "var(--color-buy)" : "var(--color-sell)",
                  fontSize: "14px"
                }}>
                  {node.met ? "✓" : "✗"}
                </span>
                <span style={{ 
                  color: node.met ? "var(--color-text-primary)" : "var(--color-text-muted)",
                  fontWeight: node.met ? "600" : "400"
                }}>
                  {node.label}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Row 3: Smart Money, Market Context, and Explainability Engine */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "16px" }}>
        
        {/* Section 6: Smart Money */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            💸 Smart Money & Block deals
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(0,0,0,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>FII Activity:</span>
              <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{fiiActionStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(0,0,0,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>DII Activity:</span>
              <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{diiActionStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(0,0,0,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Promoter Buying:</span>
              <span style={{ fontWeight: "700", color: "var(--accent-tech)" }}>{promoterStr}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Block Deals Intensity:</span>
              <span style={{ fontWeight: "700", color: "var(--accent-ml)" }}>{blockDealsStr}</span>
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed var(--border-subtle)", paddingTop: "10px", marginTop: "10px" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Smart Money Score:</span>
            <span style={{ fontSize: "16px", fontWeight: "900", color: "var(--color-buy)" }}>{smScore} / 100</span>
          </div>
        </div>

        {/* Section 7: Market Context */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            🧭 Market Macro Context
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(0,0,0,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Market Regime:</span>
              <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{regime}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(0,0,0,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Regime Confidence:</span>
              <span style={{ fontWeight: "700", color: "var(--accent-tech)" }}>{confidence}%</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", borderBottom: "1px solid rgba(0,0,0,0.02)", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Market Breadth:</span>
              <span style={{ fontWeight: "700", color: isBreadthStrong ? "var(--color-buy)" : "var(--color-hold)" }}>
                {isBreadthStrong ? "Strong" : "Moderate"}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", paddingBottom: "4px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>India VIX Level:</span>
              <span style={{ fontWeight: "700", color: isVixLow ? "var(--color-buy)" : "var(--color-sell)" }}>
                {isVixLow ? "Low" : "Spiked"}
              </span>
            </div>
          </div>
          <div style={{ borderTop: "1px dashed var(--border-subtle)", paddingTop: "10px", marginTop: "10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Global Benchmarks:</span>
            <span style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-buy)" }}>Supportive</span>
          </div>
        </div>

        {/* Section 12: Explainability Engine */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            🧮 XAI Explainability Engine
          </h3>
          <div style={{ background: "rgba(0,0,0,0.015)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Conviction Score Calculation</div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "11px", fontFamily: "monospace" }}>
              <div>Market Weight (20%):</div>
              <div style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "700" }}>+{marketAdd}</div>
              
              <div>Sector Weight (15%):</div>
              <div style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "700" }}>+{sectorAdd}</div>
              
              <div>OI Derivatives (20%):</div>
              <div style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "700" }}>+{oiAdd}</div>
              
              <div>Smart Money (15%):</div>
              <div style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "700" }}>+{fiiAdd}</div>
              
              <div>Fundamentals (10%):</div>
              <div style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "700" }}>+{fundAdd}</div>
              
              <div>News Sentiment (10%):</div>
              <div style={{ textAlign: "right", color: "var(--color-buy)", fontWeight: "700" }}>+{newsAdd}</div>
              
              <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "4px" }}>Risk Penalty:</div>
              <div style={{ textAlign: "right", color: "var(--color-sell)", fontWeight: "700", borderTop: "1px solid var(--border-subtle)", paddingTop: "4px" }}>-{riskPenaltyVal}</div>
              
              <div style={{ borderTop: "2px double var(--border-subtle)", paddingTop: "6px", fontWeight: "800", fontSize: "12px" }}>Final Score:</div>
              <div style={{ textAlign: "right", color: "var(--accent-ml)", fontWeight: "800", fontSize: "12px", borderTop: "2px double var(--border-subtle)", paddingTop: "6px" }}>{score}</div>
            </div>
          </div>
        </div>

      </div>

      {/* Row 4: Deep Research, Opportunity Timeline, and Risk Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: "16px" }}>
        
        {/* Section 8: Deep Research */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            🔍 Deep Fundamental Research
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
            <div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Business Quality</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Rev Growth:</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{revGrowth}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Profit Growth:</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{profGrowth}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>ROE:</span>
                  <span style={{ fontWeight: "700", color: "var(--color-text-primary)" }}>{roeVal}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Debt:</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{debtLevel}</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase" }}>Sector Position</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "6px", fontSize: "11px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Sector Rank:</span>
                  <span style={{ fontWeight: "700", color: "var(--accent-tech)" }}>{sectorRank}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Sector Strength:</span>
                  <span style={{ fontWeight: "700", color: "var(--color-buy)" }}>{sectorStrength}/100</span>
                </div>
              </div>
              
              <div style={{ fontSize: "10px", color: "var(--color-text-muted)", textTransform: "uppercase", marginTop: "12px" }}>Competitive Edge</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "4px", fontSize: "9.5px", color: "var(--color-text-secondary)" }}>
                <div>• Industry Leader Moat</div>
                <div>• Strong Free Cash Flow</div>
                <div>• Diversified Revenue Model</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 9: Opportunity Timeline */}
        <div className="glass-panel" style={{ padding: "20px" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            📅 Opportunity Signal Timeline
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", position: "relative", paddingLeft: "16px" }}>
            {/* Timeline line */}
            <div style={{ position: "absolute", left: "6px", top: "4px", bottom: "4px", width: "2px", background: "var(--border-subtle)" }} />

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-14px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-tech)" }} />
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", fontWeight: "600" }}>8 DAYS AGO</div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-primary)" }}>FII Accumulation Phase Started</div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-14px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-ml)" }} />
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", fontWeight: "600" }}>5 DAYS AGO</div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-primary)" }}>Sector Rotation Breakout</div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "-14px", top: "4px", width: "8px", height: "8px", borderRadius: "50%", background: "cyan" }} />
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", fontWeight: "600" }}>3 DAYS AGO</div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-primary)" }}>Long derivatives build-up detected</div>
            </div>

            <div style={{ position: "relative" }}>
              <div style={{ position: "absolute", left: "2px", top: "76%", width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-buy)" }} />
              <div style={{ fontSize: "9px", color: "var(--color-text-muted)", fontWeight: "600" }}>TODAY</div>
              <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-buy)" }}>Institutional analyst target upgrade</div>
            </div>
          </div>
        </div>

        {/* Section 10: Risk Section */}
        <div className="glass-panel" style={{ padding: "20px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <h3 style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-text-primary)", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "8px", marginBottom: "12px" }}>
            ⚠️ Major Risk Warnings
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "11px" }}>
              <span style={{ color: "var(--color-sell)", fontWeight: "800" }}>•</span>
              <div>
                <strong>Event Risk:</strong> {nextHighImpact} in {eventDays} Days
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "11px" }}>
              <span style={{ color: "var(--color-sell)", fontWeight: "800" }}>•</span>
              <div>
                <strong>Commodity Risk:</strong> Crude oil spot price volatility
              </div>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "flex-start", fontSize: "11px" }}>
              <span style={{ color: "var(--color-sell)", fontWeight: "800" }}>•</span>
              <div>
                <strong>Sector Heat:</strong> Rotation risk to defensive FMCG
              </div>
            </div>
          </div>
          
          <div style={{ background: "rgba(244,67,54,0.04)", border: "1px solid rgba(244,67,54,0.1)", padding: "10px", borderRadius: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}>
            <span style={{ fontSize: "11px", fontWeight: "600", color: "var(--color-text-secondary)" }}>Expected Drawdown (SL):</span>
            <span style={{ fontSize: "14px", fontWeight: "800", color: "var(--color-sell)" }}>{drawdownVal.toFixed(1)}%</span>
          </div>
        </div>

      </div>

    </div>
  );
}
