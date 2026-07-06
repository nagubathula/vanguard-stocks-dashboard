import React from "react";

interface ScoreGaugeProps {
  score: number;
  recommendation: string;
  summary: string[];
  target?: number;
  stop_loss?: number;
  suggested_position_size?: number;
}

export default function ScoreGauge({ score, recommendation, summary, target, stop_loss, suggested_position_size }: ScoreGaugeProps) {
  // SVG Ring Calculations
  const radius = 70;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  let color = "var(--color-hold)";
  let glowClass = "glow-hold";
  if (recommendation === "Strong Buy" || recommendation === "Buy") {
    color = "var(--color-buy)";
    glowClass = "glow-buy";
  } else if (recommendation === "Strong Sell" || recommendation === "Sell") {
    color = "var(--color-sell)";
    glowClass = "glow-sell";
  }

  return (
    <div className={`glass-panel ${glowClass}`} style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px", border: "1px solid transparent", minHeight: "280px", justifyContent: "center" }}>
      <h3 style={{ fontSize: "14px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "600", marginBottom: "4px" }}>Master AI Recommendation</h3>

      {/* Radial SVG Dial */}
      <div style={{ position: "relative", width: "160px", height: "160px", display: "flex", justifyContent: "center", alignItems: "center" }}>
        <svg width="160" height="160" style={{ transform: "rotate(-90deg)" }}>
          {/* Background circle */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.03)"
            strokeWidth={strokeWidth}
          />
          {/* Active progress arc */}
          <circle
            cx="80"
            cy="80"
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 0.6s ease-in-out" }}
          />
        </svg>
        {/* Core text overlay */}
        <div style={{ position: "absolute", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "40px", fontWeight: "800", fontFamily: "var(--font-display)", color: "var(--color-text-primary)", lineHeight: "1" }}>{score}</span>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginTop: "4px", fontWeight: "600" }}>Score</span>
        </div>
      </div>

      {/* Signal text */}
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "20px", fontWeight: "800", color, textTransform: "uppercase", letterSpacing: "1px" }}>
          {recommendation}
        </div>
      </div>

      {/* Target & Stop Loss Panel */}
      {target !== undefined && stop_loss !== undefined && (
        <div style={{ width: "100%", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(76, 175, 80, 0.06)", border: "1px solid rgba(76, 175, 80, 0.15)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "4px", fontWeight: "600" }}>Target</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-buy)" }}>+{target}%</div>
            </div>
            <div style={{ background: "rgba(244, 67, 54, 0.06)", border: "1px solid rgba(244, 67, 54, 0.15)", padding: "8px", borderRadius: "6px", textAlign: "center" }}>
              <div style={{ fontSize: "10px", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "4px", fontWeight: "600" }}>Stop Loss</div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: "var(--color-sell)" }}>-{stop_loss}%</div>
            </div>
          </div>
          {suggested_position_size !== undefined && (
            <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", textAlign: "center", marginTop: "8px", background: "rgba(0,0,0,0.02)", padding: "5px", borderRadius: "4px" }}>
              Suggested Allocation: <strong style={{ color: "var(--color-text-primary)" }}>{suggested_position_size}%</strong>
            </div>
          )}
        </div>
      )}

      {/* Consensus list */}
      <div style={{ width: "100%", borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
        <div style={{ fontSize: "11px", color: "var(--color-text-secondary)", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>Consensus Verdict:</div>
        <ul style={{ paddingLeft: "14px", fontSize: "12px", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "6px" }}>
          {summary.map((line, idx) => (
            <li key={idx} style={{ listStyleType: "square", color: "var(--color-text-secondary)" }}>
              <span style={{ color: "var(--color-text-primary)" }}>{line}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
