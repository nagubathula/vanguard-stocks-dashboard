import React from "react";

interface RadarChartProps {
  data: {
    label: string;
    value: number;
  }[];
  size?: number;
}

export default function RadarChart({ data, size = 300 }: RadarChartProps) {
  const center = size / 2;
  const maxRadius = (size / 2) * 0.72;
  const numAxes = data.length;

  // Compute angles for each axis (first axis points straight up)
  const angles = Array.from({ length: numAxes }, (_, i) => {
    return (i * 2 * Math.PI) / numAxes - Math.PI / 2;
  });

  // Helper to get coordinates
  const getCoordinates = (index: number, value: number) => {
    const angle = angles[index];
    const r = (value / 100) * maxRadius;
    const x = center + r * Math.cos(angle);
    const y = center + r * Math.sin(angle);
    return { x, y };
  };

  // Generate grid lines (polygons) at 20%, 40%, 60%, 80%, 100%
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPolygons = gridLevels.map((level) => {
    return angles.map((angle) => {
      const r = (level / 100) * maxRadius;
      const x = center + r * Math.cos(angle);
      const y = center + r * Math.sin(angle);
      return `${x},${y}`;
    }).join(" ");
  });

  // Calculate points for the active data shape
  const dataPoints = data.map((d, i) => {
    const { x, y } = getCoordinates(i, d.value);
    return `${x},${y}`;
  }).join(" ");

  // Labels positioning
  const getLabelCoords = (index: number) => {
    const angle = angles[index];
    const labelRadius = maxRadius + 15; // offset labels outside chart
    const x = center + labelRadius * Math.cos(angle);
    const y = center + labelRadius * Math.sin(angle);
    
    // Adjust alignment based on position
    let textAnchor: "start" | "end" | "middle" = "middle";
    if (Math.cos(angle) > 0.15) textAnchor = "start";
    else if (Math.cos(angle) < -0.15) textAnchor = "end";

    let dy = "0.35em";
    if (Math.sin(angle) < -0.9) dy = "-0.3em"; // straight up
    else if (Math.sin(angle) > 0.9) dy = "0.9em";  // straight down

    return { x, y, textAnchor, dy };
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", padding: "10px 0" }}>
      <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ overflow: "visible", maxWidth: `${size}px` }}>
        <defs>
          <radialGradient id="radar-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--accent-ml)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--accent-tech)" stopOpacity="0.05" />
          </radialGradient>
          <linearGradient id="radar-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--accent-ml)" />
            <stop offset="100%" stopColor="var(--accent-tech)" />
          </linearGradient>
        </defs>

        {/* Concentric grid lines */}
        {gridPolygons.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            stroke="var(--border-subtle)"
            strokeWidth="0.8"
            strokeDasharray={i === gridPolygons.length - 1 ? "none" : "2,3"}
          />
        ))}

        {/* Level indicator labels along the top axis */}
        {gridLevels.map((level, i) => {
          const { x, y } = getCoordinates(0, level);
          return (
            <text
              key={i}
              x={x + 4}
              y={y + 3}
              fontSize="8px"
              fill="var(--color-text-muted)"
              fontWeight="600"
            >
              {level}
            </text>
          );
        })}

        {/* Spokes */}
        {angles.map((angle, i) => {
          const x = center + maxRadius * Math.cos(angle);
          const y = center + maxRadius * Math.sin(angle);
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={x}
              y2={y}
              stroke="var(--border-subtle)"
              strokeWidth="0.8"
            />
          );
        })}

        {/* Filled polygon for data */}
        <polygon
          points={dataPoints}
          fill="url(#radar-glow)"
          stroke="url(#radar-stroke)"
          strokeWidth="2.5"
          filter="drop-shadow(0px 4px 8px rgba(124, 77, 255, 0.2))"
          style={{ transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />

        {/* Data points */}
        {data.map((d, i) => {
          const { x, y } = getCoordinates(i, d.value);
          return (
            <g key={i}>
              <circle
                cx={x}
                cy={y}
                r="3.5"
                fill="var(--accent-ml)"
                stroke="#fff"
                strokeWidth="1.5"
                style={{ transition: "all 0.4s ease" }}
              />
            </g>
          );
        })}

        {/* Labels at vertices */}
        {data.map((d, i) => {
          const { x, y, textAnchor, dy } = getLabelCoords(i);
          return (
            <g key={i}>
              <text
                x={x}
                y={y}
                dy={dy}
                textAnchor={textAnchor}
                fontSize="10px"
                fontWeight="700"
                fill="var(--color-text-primary)"
              >
                {d.label}
              </text>
              <text
                x={x}
                y={y + 11}
                dy={dy}
                textAnchor={textAnchor}
                fontSize="9px"
                fontWeight="600"
                fill="var(--accent-ml)"
              >
                {d.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
