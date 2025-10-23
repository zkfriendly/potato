import React from "react";

type PotatoSlideProps = {
  width?: number;
  height?: number;
  count?: number;
};

// Animated mini potatoes sliding upward along paths (fries investing vibe)
export default function PotatoSlide({
  width = 360,
  height = 260,
  count = 5,
}: PotatoSlideProps) {
  const ids = Array.from({ length: count }, (_, i) => i);
  return (
    <svg
      className="potato-slide"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-hidden="true"
    >
      {/* rails */}
      <defs>
        <linearGradient id="railGrad" x1="0" x2="1">
          <stop offset="0%" stopColor="#2d1733" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#2d1733" stopOpacity="0.05" />
        </linearGradient>
      </defs>
      <path
        id="p1"
        d={`M20 ${height - 20} C ${width * 0.25} ${height - 80}, ${
          width * 0.45
        } ${height - 160}, ${width * 0.55} ${height - 220}`}
        fill="none"
        stroke="url(#railGrad)"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <path
        id="p2"
        d={`M60 ${height - 20} C ${width * 0.35} ${height - 60}, ${
          width * 0.6
        } ${height - 140}, ${width * 0.8} ${height - 220}`}
        fill="none"
        stroke="url(#railGrad)"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* coins/potatoes */}
      {ids.map((i) => (
        <g key={i}>
          <ellipse
            rx="9"
            ry="12"
            fill="#f4b154"
            stroke="#2d1733"
            strokeWidth="3"
          />
          <animateMotion
            dur={`${6 + i}s`}
            repeatCount="indefinite"
            keyPoints="0;1"
            keyTimes="0;1"
            path={i % 2 === 0 ? undefined : undefined}
          >
            <mpath href={i % 2 === 0 ? "#p1" : "#p2"} />
          </animateMotion>
        </g>
      ))}

      {/* arrow hint */}
      <g transform={`translate(${width - 28}, 24)`}>
        <path
          d="M0 16 l12 -12 l12 12"
          fill="none"
          stroke="#2d1733"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
