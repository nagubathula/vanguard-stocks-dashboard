import React, { useState } from "react";

interface SectorStrengthProps {
  currentSector: string;
  sectorsRs: Record<string, number>;
  sectorsRs5d?: Record<string, number>;
}

export default function SectorStrength({ currentSector, sectorsRs, sectorsRs5d = {} }: SectorStrengthProps) {
  const [term, setTerm] = useState<"5d" | "20d">("20d");

  // Determine active dataset
  const activeSectorsData = term === "5d" ? sectorsRs5d : sectorsRs;

  // Sort sectors by RS alpha descending
  const sortedSectors = Object.entries(activeSectorsData).sort((a, b) => b[1] - a[1]);

  return (
    <div className="glass-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px", minHeight: "310px" }}>
      {/* Header and Toggle Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: "12px", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "1.5px", fontWeight: "700" }}>
          Sector Rotation
        </h3>
        
        {/* Toggle Controls */}
        <div style={{ display: "flex", gap: "2px", background: "var(--bg-button-unselected)", padding: "2px", borderRadius: "4px" }}>
          <button
            onClick={() => setTerm("5d")}
            style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "3px",
              background: term === "5d" ? "var(--accent-ml)" : "transparent",
              color: term === "5d" ? "#fff" : "var(--color-text-muted)",
              border: "none",
              cursor: "pointer"
            }}
          >
            5D (Short)
          </button>
          <button
            onClick={() => setTerm("20d")}
            style={{
              fontSize: "9px",
              padding: "2px 6px",
              borderRadius: "3px",
              background: term === "20d" ? "var(--accent-ml)" : "transparent",
              color: term === "20d" ? "#fff" : "var(--color-text-muted)",
              border: "none",
              cursor: "pointer"
            }}
          >
            20D (Med)
          </button>
        </div>
      </div>

      <div style={{ fontSize: "10px", color: "var(--color-text-muted)", marginTop: "-6px" }}>
        Relative Strength Alpha vs Nifty 50 ({term === "5d" ? "5-Day Short-Term Rotation" : "20-Day Medium-Term Alpha"})
      </div>

      {/* Leaderboard Lists */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, justifyContent: "center" }}>
        {sortedSectors.length === 0 ? (
          <div style={{ textAlign: "center", fontSize: "11px", color: "var(--color-text-muted)", padding: "20px 0" }}>
            No sector data loaded. Select a stock to view.
          </div>
        ) : (
          sortedSectors.map(([sector, rs]) => {
            const isSelected = sector === currentSector;
            const isPositive = rs >= 0;
            
            // Max bar width percentage (cap at 100 for display scaling)
            const absVal = Math.min(100, Math.abs(rs) * 12); // scale up for visual representation
            
            return (
              <div key={sector} style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px" }}>
                   <span style={{ 
                    fontWeight: isSelected ? "700" : "500", 
                    color: isSelected ? "var(--accent-ml)" : "var(--color-text-secondary)"
                  }}>
                    {sector} {isSelected && "🎯"}
                  </span>
                  <span style={{ 
                    fontWeight: "700", 
                    color: isPositive ? "var(--color-buy)" : "var(--color-sell)"
                  }}>
                    {isPositive ? "+" : ""}{rs.toFixed(2)}%
                  </span>
                </div>
                
                {/* Bar track */}
                <div style={{ width: "100%", height: "6px", background: "rgba(0, 0, 0, 0.04)", borderRadius: "3px", overflow: "hidden", display: "flex" }}>
                  {/* Left (Negative) Bar */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "flex-end" }}>
                    {!isPositive && (
                      <div style={{ 
                        width: `${absVal}%`, 
                        height: "100%", 
                        background: "linear-gradient(90deg, var(--color-sell) 0%, rgba(255, 23, 68, 0.3) 100%)",
                        borderRadius: "3px 0 0 3px"
                      }}></div>
                    )}
                  </div>
                  {/* Right (Positive) Bar */}
                  <div style={{ flex: 1, display: "flex", justifyContent: "flex-start" }}>
                    {isPositive && (
                      <div style={{ 
                        width: `${absVal}%`, 
                        height: "100%", 
                        background: "linear-gradient(90deg, rgba(0, 230, 118, 0.3) 0%, var(--color-buy) 100%)",
                        borderRadius: "0 3px 3px 0"
                      }}></div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
