import React from "react";

type InvestingBarsProps = {
  width?: number;
  height?: number;
};

// Minimal animated bars to imply investing growth and rebalancing
export default function InvestingBars({
  width = 360,
  height = 160,
}: InvestingBarsProps) {
  const bars = [
    { x: 20, color: "#2d1733" },
    { x: 70, color: "#f4b154" },
    { x: 120, color: "#61d3a5" },
    { x: 170, color: "#ff88cc" },
    { x: 220, color: "#8ec5ff" },
  ];

  // Compute a horizontal translation so bars are perfectly centered
  const contentLeft = bars[0].x;
  const contentRight = bars[bars.length - 1].x + 28; // last bar width
  const contentMid = (contentLeft + contentRight) / 2;
  const dx = width / 2 - contentMid;

  return (
    <svg
      className="invest-bars"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      <g transform={`translate(${dx}, 0)`}>
        {bars.map((b, i) => (
          <g key={i} transform={`translate(${b.x}, 0)`}>
            <rect
              x={0}
              y={20}
              width={28}
              height={height - 40}
              rx={8}
              fill="#ffffff55"
              stroke="#2d1733"
              strokeWidth={2}
            />
            <rect
              x={0}
              y={height - 40}
              width={28}
              height={0}
              rx={8}
              fill={b.color}
            >
              <animate
                attributeName="y"
                values={`${height - 40}; ${40 + i * 14}; ${height - 40}`}
                dur={`${4 + i * 0.4}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="height"
                values={`0; ${height - 80 - i * 14}; 0`}
                dur={`${4 + i * 0.4}s`}
                repeatCount="indefinite"
              />
            </rect>
          </g>
        ))}
        {/* rebalance indicator */}
        <g>
          <path
            d={`M${bars[0].x} 18 H ${bars[bars.length - 1].x + 28}`}
            stroke="#2d1733"
            strokeWidth={3}
            strokeLinecap="round"
          />
          <circle r={5} fill="#2d1733">
            <animateMotion
              dur="6s"
              repeatCount="indefinite"
              path={`M${bars[0].x} 18 H ${bars[bars.length - 1].x + 28}`}
            />
          </circle>
        </g>
      </g>
    </svg>
  );
}
