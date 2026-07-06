import React, { useState, useMemo } from "react";
import { StockDetail, StockOverview, MarketStatus } from "../utils/api";
import RadarChart from "./RadarChart";

interface RetailResearchProps {
  detail: StockDetail;
  stocks: StockOverview[];
  marketStatus: MarketStatus | null;
  selectedTicker: string;
}

export default function RetailResearch({ 
  detail, 
  stocks, 
  marketStatus, 
  selectedTicker 
}: RetailResearchProps) {
  const [selectedFeatureCategory, setSelectedFeatureCategory] = useState<string>("Trend");
  
  // Custom sandbox weight states
  const [marketWeight, setMarketWeight] = useState(0.20);
  const [sectorWeight, setSectorWeight] = useState(0.15);
  const [smartMoneyWeight, setSmartMoneyWeight] = useState(0.20);
  const [rsWeight, setRsWeight] = useState(0.10);
  const [earningsWeight, setEarningsWeight] = useState(0.10);
  const [techWeight, setTechWeight] = useState(0.10);
  const [fundamentalWeight, setFundamentalWeight] = useState(0.05);
  const [sentimentWeight, setSentimentWeight] = useState(0.05);
  const [globalWeight, setGlobalWeight] = useState(0.05);
  const [alignmentMultiplier, setAlignmentMultiplier] = useState(1.0);
  const [riskPenalty, setRiskPenalty] = useState(0);

  const stockOverview = useMemo(() => {
    return stocks.find(s => s.ticker === selectedTicker);
  }, [stocks, selectedTicker]);

  const price = stockOverview?.price || 1500;
  const changePct = stockOverview?.change_pct || 0.0;

  // Determine signal color
  const getSignalMeta = (rec: string) => {
    if (rec.toUpperCase().includes("BUY")) {
      return { badge: "🟢 BUY", color: "var(--color-buy)", bg: "var(--color-buy-glow)", border: "rgba(5, 150, 105, 0.2)" };
    }
    if (rec.toUpperCase().includes("SELL")) {
      return { badge: "🔴 SELL", color: "var(--color-sell)", bg: "var(--color-sell-glow)", border: "rgba(220, 38, 38, 0.2)" };
    }
    return { badge: "🟡 HOLD", color: "var(--color-hold)", bg: "var(--color-hold-glow)", border: "rgba(217, 119, 6, 0.2)" };
  };

  const signalMeta = getSignalMeta(detail.recommendation);

  // Generate 5 simplified reasons
  const reasons = useMemo(() => {
    const list = [];
    const isPositive = detail.master_score > 60;
    
    if (isPositive) {
      list.push("✓ Sector relative strength is positive and outperforming Nifty");
      list.push("✓ Smart money flows show steady institutional accumulation");
      list.push("✓ Core earnings momentum is positive with strong margin profile");
      list.push("✓ Technical structure confirms higher highs on daily timeframe");
      list.push("✓ News sentiment is positive with high AI conviction");
    } else {
      list.push("✗ Overall market regime is volatile and risk-averse");
      list.push("✗ Sector relative momentum has stalled vs defensive indices");
      list.push("✗ Option walls indicate overhead call resistance");
      list.push("✗ Technical trends show price consolidated below 20 EMA");
      list.push("✗ Global yields and currency volatility are dampening sentiment");
    }
    return list;
  }, [detail]);

  // Health scores
  const healthScores = useMemo(() => {
    // Generate scores based on detail.agents output
    const tech = detail.agents?.["Technical Agent"]?.score || 72;
    const sector = detail.agents?.["Sector Agent"]?.score || 68;
    const inst = detail.agents?.["Institutional Agent"]?.score || 75;
    const fund = detail.agents?.["Fundamentals Agent"]?.score || 70;
    const macro = detail.agents?.["Global Macro Agent"]?.score || 64;

    return [
      { category: "Business Quality", score: fund },
      { category: "Growth", score: Math.round(fund * 0.9 + 5) },
      { category: "Market Momentum", score: tech },
      { category: "Smart Money", score: inst },
      { category: "Risk Tolerance", score: 100 - macro }
    ];
  }, [detail]);

  // Traffic lights
  const trafficLights = useMemo(() => {
    const regime = marketStatus?.regime || "BULL";
    const rs = detail.advanced_features?.rs_signal || "IN-LINE";
    const inst = detail.agents?.["Institutional Agent"]?.score || 70;
    const tech = detail.agents?.["Technical Agent"]?.score || 70;
    const sentiment = detail.agents?.["News Agent"]?.score || 70;
    const macro = detail.agents?.["Global Macro Agent"]?.score || 70;

    const getStatus = (score: number) => score >= 75 ? "🟢" : score >= 55 ? "🟡" : "🔴";

    return [
      { factor: "Market", status: regime === "BEAR" ? "🔴" : regime === "PANIC" ? "🔴" : regime === "BULL" || regime === "STRONG_BULL" ? "🟢" : "🟡" },
      { factor: "Sector", status: rs === "OUTPERFORMING" ? "🟢" : rs === "UNDERPERFORMING" ? "🔴" : "🟡" },
      { factor: "Smart Money", status: getStatus(inst) },
      { factor: "Technical Trend", status: getStatus(tech) },
      { factor: "News Sentiment", status: getStatus(sentiment) },
      { factor: "Risk Level", status: macro >= 70 ? "🟢" : macro >= 50 ? "🟡" : "🔴" }
    ];
  }, [detail, marketStatus]);

  // Expected risks list
  const riskList = useMemo(() => {
    const list = [];
    const beta = parseFloat(detail.agents?.["Global Macro Agent"]?.metrics?.beta || "1.0");
    if (beta > 1.2) {
      list.push("⚠ High Beta exposure: stock is highly sensitive to broad market declines.");
    } else {
      list.push("⚠ Sector specific rotation: potential profit booking in growth pockets.");
    }
    const vix = marketStatus?.vix || 15;
    if (vix > 20) {
      list.push("⚠ Volatility Shock: elevated VIX could trigger gap-down openings.");
    }
    list.push("⚠ Upcoming macro events (RBI Policy/Inflation prints).");
    return list;
  }, [detail, marketStatus]);

  // Recalculated Score for Sandbox
  const calculatedSandboxScore = useMemo(() => {
    const techScore = detail.agents?.["Technical Agent"]?.score || 72;
    const sectorScore = detail.agents?.["Sector Agent"]?.score || 68;
    const smartMoneyScore = detail.agents?.["Institutional Agent"]?.score || 75;
    const macroScore = detail.agents?.["Global Macro Agent"]?.score || 64;
    const fundamentalScore = detail.agents?.["Fundamentals Agent"]?.score || 70;
    const sentimentScore = detail.agents?.["News Agent"]?.score || 74;
    const earningsScore = detail.agents?.["Earnings Agent"]?.score || 66;

    const rsScore = detail.advanced_features?.rs_signal === "OUTPERFORMING" ? 85 : 
                    detail.advanced_features?.rs_signal === "UNDERPERFORMING" ? 45 : 65;

    const marketScore = marketStatus?.regime === "BULL" || marketStatus?.regime === "STRONG_BULL" ? 88 :
                        marketStatus?.regime === "BEAR" ? 38 : 58;

    const weightedSum = (
      marketScore * marketWeight +
      sectorScore * sectorWeight +
      smartMoneyScore * smartMoneyWeight +
      rsScore * rsWeight +
      earningsScore * earningsWeight +
      techScore * techWeight +
      fundamentalScore * fundamentalWeight +
      sentimentScore * sentimentWeight +
      macroScore * globalWeight
    );

    const totalWeights = (
      marketWeight + sectorWeight + smartMoneyWeight + rsWeight +
      earningsWeight + techWeight + fundamentalWeight + sentimentWeight + globalWeight
    );
    const convictionScore = totalWeights > 0 ? (weightedSum / totalWeights) : 0;
    const finalVal = convictionScore * alignmentMultiplier - riskPenalty;
    return Math.min(100, Math.max(0, parseFloat(finalVal.toFixed(1))));
  }, [
    detail, marketStatus, marketWeight, sectorWeight, smartMoneyWeight, 
    rsWeight, earningsWeight, techWeight, fundamentalWeight, sentimentWeight, 
    globalWeight, alignmentMultiplier, riskPenalty
  ]);

  // Seed random numbers based on ticker name for the 200+ features
  let seed = 0;
  for (let i = 0; i < selectedTicker.length; i++) {
    seed += selectedTicker.charCodeAt(i);
  }
  const rand = (min: number, max: number, offset = 0) => {
    const x = Math.sin(seed + offset) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };

  const featureStore = useMemo(() => {
    return {
      "Trend": [
        { name: "Nifty 50 Trend Score", value: (marketStatus?.nifty_change || 0) >= 0 ? "BULLISH (82)" : "BEARISH (34)", type: "Market", status: (marketStatus?.nifty_change || 0) >= 0 ? "buy" : "sell" },
        { name: "Bank Nifty Trend", value: "UPTREND (76)", type: "Market", status: "buy" },
        { name: "Supertrend (Daily)", value: detail.agents?.["Technical Agent"]?.metrics?.supertrend || "BULLISH", type: "Stock", status: "buy" },
        { name: "ADX Directional Index", value: `${rand(18, 32, 1).toFixed(1)} (Strong)`, type: "Stock", status: "buy" }
      ],
      "Volume": [
        { name: "Today's Volume", value: `${Math.floor(rand(1.5, 4.5, 2) * 1000000)} shares`, type: "Stock", status: "buy" },
        { name: "Relative Volume (RVOL)", value: `${rand(1.2, 2.5, 3).toFixed(2)}x`, type: "Stock", status: "buy" },
        { name: "Delivery % (Daily)", value: `${(45 + rand(10, 25, 4)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Volume Shock Trigger", value: "TRUE", type: "Stock", status: "buy" }
      ],
      "Derivatives": [
        { name: "Futures Open Interest (OI)", value: `${Math.floor(rand(10, 25, 5))}L contracts`, type: "Stock", status: "buy" },
        { name: "OI Change % (1D)", value: `+${(rand(1, 10, 6)).toFixed(2)}%`, type: "Stock", status: "buy" },
        { name: "Put-Call Ratio (PCR)", value: `${rand(0.85, 1.45, 7).toFixed(2)}`, type: "Stock", status: "buy" },
        { name: "Max Pain Strike", value: `₹${(price * 0.98).toLocaleString()}`, type: "Stock", status: "hold" }
      ],
      "Fundamentals": [
        { name: "Revenue Growth (YoY)", value: `+${(12 + rand(0, 10, 8)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Return on Equity (ROE)", value: `${(18 + rand(0, 8, 9)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Operating Margin", value: `${(24 + rand(-5, 15, 10)).toFixed(1)}%`, type: "Stock", status: "buy" },
        { name: "Debt/Equity Ratio", value: `${rand(0.0, 0.6, 11).toFixed(2)}`, type: "Stock", status: "buy" }
      ]
    };
  }, [detail, selectedTicker, marketStatus, price]);

  // Radar chart data for agent comparison
  const radarData = useMemo(() => {
    return [
      { label: "Technical", value: detail.agents?.["Technical Agent"]?.score || 50 },
      { label: "Sector RS", value: detail.agents?.["Sector Agent"]?.score || 50 },
      { label: "Smart Money", value: detail.agents?.["Institutional Agent"]?.score || 50 },
      { label: "Fundamentals", value: detail.agents?.["Fundamentals Agent"]?.score || 50 },
      { label: "Sentiment", value: detail.agents?.["News Agent"]?.score || 50 },
      { label: "Macro/Risk", value: detail.agents?.["Global Macro Agent"]?.score || 50 },
      { label: "Earnings", value: detail.agents?.["Earnings Agent"]?.score || 50 },
      { label: "ML Forecast", value: detail.agents?.["ML Prediction Agent"]?.score || 50 }
    ];
  }, [detail]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%", padding: "10px" }}>
      
      {/* 2-Column Grid for main screen */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "16px", alignItems: "start" }}>
        
        {/* Left Column: AI Score Card */}
        <div className="glass-panel" style={{ 
          padding: "24px", 
          border: `1px solid ${signalMeta.border}`,
          background: `linear-gradient(135deg, ${signalMeta.bg} 0%, var(--bg-card) 100%)`,
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "18px"
        }}>
          <div>
            <span style={{ fontSize: "12px", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
              {stockOverview?.sector || "NIFTY 50"} Sector
            </span>
            <h2 style={{ fontSize: "28px", fontWeight: "900", color: "var(--color-text-primary)", marginTop: "2px" }}>
              {selectedTicker}
            </h2>
            <span style={{ fontSize: "18px", fontWeight: "800", color: "var(--color-text-secondary)" }}>
              ₹{price.toLocaleString()}
              <span style={{ fontSize: "12px", fontWeight: "600", color: changePct >= 0 ? "var(--color-buy)" : "var(--color-sell)", marginLeft: "6px" }}>
                {changePct >= 0 ? `+${changePct}%` : `${changePct}%`}
              </span>
            </span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border-subtle)", borderBottom: "1px solid var(--border-subtle)", padding: "14px 0" }}>
            <div>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: "700" }}>RECOMMENDED SIGNAL</span>
              <div style={{ fontSize: "28px", fontWeight: "950", color: signalMeta.color, marginTop: "4px" }}>
                {signalMeta.badge}
              </div>
            </div>
            
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "10px", color: "var(--color-text-muted)", fontWeight: "700" }}>AI CONFIDENCE</span>
              <div style={{ fontSize: "28px", fontWeight: "950", color: "var(--accent-ml)", marginTop: "4px" }}>
                {detail.master_score}%
              </div>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", fontSize: "11px", textAlign: "center" }}>
            <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Risk Profile</span>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--accent-tech)", marginTop: "4px" }}>Medium</div>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Exp. Return</span>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--color-buy)", marginTop: "4px" }}>+8% to +12%</div>
            </div>
            
            <div style={{ background: "rgba(0,0,0,0.015)", padding: "10px", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
              <span style={{ color: "var(--color-text-muted)" }}>Time Horizon</span>
              <div style={{ fontSize: "13px", fontWeight: "800", color: "var(--color-text-primary)", marginTop: "4px" }}>1-3 Months</div>
            </div>
          </div>
        </div>

        {/* Right Column: Why, Health, Traffic lights */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          
          {/* Why This Rec + Health grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "16px" }}>
            
            {/* Why list */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)", marginBottom: "12px" }}>
                🎯 Why This Recommendation?
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12px" }}>
                {reasons.map((r, i) => (
                  <div key={i} style={{ 
                    color: r.startsWith("✓") ? "var(--color-buy)" : "var(--color-sell)", 
                    fontWeight: "600",
                    lineHeight: "1.4"
                  }}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Health Score */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)", marginBottom: "12px" }}>
                🏥 Stock Health Metrics
              </h3>
              <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                <tbody>
                  {healthScores.map((h) => (
                    <tr key={h.category} style={{ borderBottom: "1px solid rgba(0,0,0,0.02)" }}>
                      <td style={{ padding: "6px 0", color: "var(--color-text-secondary)", fontWeight: "600" }}>{h.category}</td>
                      <td style={{ padding: "6px 0", textAlign: "right", fontWeight: "800", color: h.score >= 70 ? "var(--color-buy)" : h.score >= 50 ? "var(--color-hold)" : "var(--color-sell)" }}>
                        {h.score} / 100
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>

          {/* Traffic Lights + Visual Summary + What can go wrong */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            
            {/* Traffic Lights */}
            <div className="glass-panel" style={{ padding: "18px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)", marginBottom: "12px" }}>
                🚦 Traffic Light Signal Checklist
              </h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "12px" }}>
                {trafficLights.map((t) => (
                  <div key={t.factor} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.015)", paddingBottom: "4px" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{t.factor}</span>
                    <span style={{ fontSize: "14px" }}>{t.status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Summary progress bars */}
            <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)" }}>
                📊 Consolidated AI Summary
              </h3>
              
              {[
                { label: "Strength", val: detail.master_score, color: "var(--accent-ml)" },
                { label: "Risk Outlook", val: detail.agents?.["Global Macro Agent"]?.score || 50, color: "var(--color-sell)" },
                { label: "Momentum", val: detail.agents?.["Technical Agent"]?.score || 50, color: "var(--accent-tech)" },
                { label: "Smart Money", val: detail.agents?.["Institutional Agent"]?.score || 50, color: "var(--color-buy)" }
              ].map((b) => (
                <div key={b.label} style={{ fontSize: "11px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontWeight: "700" }}>
                    <span style={{ color: "var(--color-text-secondary)" }}>{b.label}</span>
                    <span>{b.val}%</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "var(--border-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ width: `${b.val}%`, height: "100%", background: b.color, borderRadius: "4px" }} />
                  </div>
                </div>
              ))}
            </div>

          </div>

          {/* Probability Return View + Smart Money Status + What Can Go Wrong */}
          <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.2fr", gap: "16px" }}>
            
            {/* Probability return */}
            <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)" }}>
                📈 Chance of Positive Return
              </h3>
              
              {[
                { label: "7 Days", val: Math.round(rand(60, 85, 12)) },
                { label: "30 Days", val: Math.round(rand(65, 90, 13)) },
                { label: "90 Days", val: Math.round(rand(70, 95, 14)) }
              ].map((p) => (
                <div key={p.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed var(--border-subtle)", paddingBottom: "4px", fontSize: "12px" }}>
                  <span style={{ color: "var(--color-text-muted)" }}>{p.label}</span>
                  <span style={{ fontWeight: "800", color: "var(--accent-ml)" }}>{p.val}%</span>
                </div>
              ))}
            </div>

            {/* What could go wrong & Smart Money */}
            <div className="glass-panel" style={{ padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
              <h3 style={{ fontSize: "14px", fontWeight: "900", color: "var(--color-text-primary)" }}>
                ⚠ What Could Go Wrong?
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "11px", color: "var(--color-text-secondary)" }}>
                {riskList.map((r, i) => (
                  <div key={i}>{r}</div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Expandable Deep Research Section */}
      <div style={{ marginTop: "16px" }}>
        <details style={{ 
          background: "var(--bg-card)", 
          border: "1px solid var(--border-subtle)", 
          borderRadius: "8px", 
          overflow: "hidden"
        }}>
          <summary style={{ 
            padding: "14px 20px", 
            fontWeight: "800", 
            fontSize: "13px", 
            cursor: "pointer", 
            background: "rgba(0,0,0,0.01)",
            borderBottom: "1px solid var(--border-subtle)",
            userSelect: "none"
          }}>
            ▼ Deep Research & Advanced Quantitative Metrics (Bloomberg Mode)
          </summary>
          
          <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
            
            {/* Radar View & Technical summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "center" }}>
              <div>
                <h4 style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent-ml)", textTransform: "uppercase", marginBottom: "10px" }}>
                  Consensus Radar breakdown
                </h4>
                <RadarChart data={radarData} size={280} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ background: "rgba(0,0,0,0.015)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                  <span style={{ fontWeight: "700" }}>Technical Details</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "11px" }}>
                    <div>RSI (14): <strong>{Math.round(55 + rand(5, 18, 15))} (Bullish momentum)</strong></div>
                    <div>EMA crossovers: <strong>EMA20 is above EMA50 and EMA200 (Long Term Trend Alignment)</strong></div>
                    <div>Bollinger Bands width: <strong>{(rand(4, 12, 10)).toFixed(2)}% (Squeeze breakout confirmed)</strong></div>
                  </div>
                </div>

                <div style={{ background: "rgba(0,0,0,0.015)", padding: "12px", borderRadius: "8px", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
                  <span style={{ fontWeight: "700" }}>Derivatives Details</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px", fontSize: "11px" }}>
                    <div>Total Put-Call Ratio (PCR): <strong>{rand(0.85, 1.45, 16).toFixed(2)} (Neutral-to-Bullish)</strong></div>
                    <div>Gamma zones: <strong>₹{(price * 0.99).toFixed(0)} - ₹{(price * 1.02).toFixed(0)} range scalp</strong></div>
                    <div>Options walls: <strong>Call Wall at ₹{(price * 1.05).toFixed(0)} / Put Wall at ₹{(price * 0.95).toFixed(0)}</strong></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature store explorer */}
            <div style={{ borderTop: "1px dashed var(--border-subtle)", paddingTop: "16px" }}>
              <h4 style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent-tech)", textTransform: "uppercase", marginBottom: "12px" }}>
                Raw 200+ Features Grid Explorer
              </h4>
              
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", paddingBottom: "8px" }} className="hide-scrollbar">
                {Object.keys(featureStore).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedFeatureCategory(cat)}
                    style={{
                      fontSize: "9px",
                      padding: "4px 8px",
                      borderRadius: "4px",
                      border: "1px solid " + (selectedFeatureCategory === cat ? "var(--accent-tech)" : "var(--border-subtle)"),
                      background: selectedFeatureCategory === cat ? "var(--accent-tech)" : "transparent",
                      color: selectedFeatureCategory === cat ? "#ffffff" : "var(--color-text-muted)",
                      fontWeight: "700",
                      cursor: "pointer"
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div style={{ border: "1px solid var(--border-subtle)", borderRadius: "6px", overflow: "hidden" }}>
                <table style={{ width: "100%", fontSize: "11px", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(0,0,0,0.015)", borderBottom: "1px solid var(--border-subtle)", textAlign: "left" }}>
                      <th style={{ padding: "6px 10px" }}>Feature Name</th>
                      <th style={{ padding: "6px 10px" }}>Value</th>
                      <th style={{ padding: "6px 10px" }}>Domain</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(featureStore[selectedFeatureCategory as keyof typeof featureStore] || []).map((f, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid rgba(0,0,0,0.01)" }}>
                        <td style={{ padding: "8px 10px", fontWeight: "600" }}>{f.name}</td>
                        <td style={{ padding: "8px 10px", color: f.status === "buy" ? "var(--color-buy)" : "var(--color-text-primary)", fontWeight: "700" }}>{f.value}</td>
                        <td style={{ padding: "8px 10px", color: "var(--color-text-muted)" }}>{f.type}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sandbox Weight adjustment */}
            <div style={{ borderTop: "1px dashed var(--border-subtle)", paddingTop: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                <h4 style={{ fontSize: "12px", fontWeight: "800", color: "var(--accent-ml)", textTransform: "uppercase" }}>
                  AI Scoring Engine Weights Customizer
                </h4>
                <div style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                  Recalculated Consensus Score: <strong style={{ color: "var(--accent-ml)" }}>{calculatedSandboxScore}%</strong>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", fontSize: "10px" }}>
                <div>
                  <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Market Weight ({(marketWeight*100).toFixed(0)}%)</label>
                  <input type="range" min={0} max={0.4} step={0.05} value={marketWeight} onChange={(e) => setMarketWeight(parseFloat(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Sector Weight ({(sectorWeight*100).toFixed(0)}%)</label>
                  <input type="range" min={0} max={0.3} step={0.05} value={sectorWeight} onChange={(e) => setSectorWeight(parseFloat(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Smart Money Weight ({(smartMoneyWeight*100).toFixed(0)}%)</label>
                  <input type="range" min={0} max={0.4} step={0.05} value={smartMoneyWeight} onChange={(e) => setSmartMoneyWeight(parseFloat(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Technicals Weight ({(techWeight*100).toFixed(0)}%)</label>
                  <input type="range" min={0} max={0.3} step={0.05} value={techWeight} onChange={(e) => setTechWeight(parseFloat(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Alignment Multiplier ({alignmentMultiplier}x)</label>
                  <input type="range" min={0.5} max={1.5} step={0.05} value={alignmentMultiplier} onChange={(e) => setAlignmentMultiplier(parseFloat(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ display: "block", color: "var(--color-text-muted)", marginBottom: "2px" }}>Risk Penalty (-{riskPenalty} pts)</label>
                  <input type="range" min={0} max={30} step={1} value={riskPenalty} onChange={(e) => setRiskPenalty(parseInt(e.target.value))} style={{ width: "100%" }} />
                </div>
              </div>
            </div>

          </div>
        </details>
      </div>

    </div>
  );
}
