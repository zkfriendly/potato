import React from "react";

type PotatoDancerProps = {
  size?: number;
};

export default function PotatoDancer({ size = 360 }: PotatoDancerProps) {
  const view = 360;
  return (
    <svg
      className="potato"
      width={size}
      height={size}
      viewBox={`0 0 ${view} ${view}`}
      aria-label="dancing potato"
      role="img"
    >
      {/* shadow */}
      <ellipse
        cx="180"
        cy="330"
        rx="110"
        ry="22"
        fill="#2d1733"
        opacity="0.25"
      />

      {/* body */}
      <g className="dance">
        <g className="body">
          <ellipse
            cx="180"
            cy="170"
            rx="90"
            ry="120"
            fill="#f4b154"
            stroke="#2d1733"
            strokeWidth="6"
          />
          {/* dimples */}
          <g fill="#e39d3e">
            <circle cx="145" cy="110" r="8" />
            <circle cx="210" cy="120" r="7" />
            <circle cx="165" cy="150" r="6" />
            <circle cx="200" cy="175" r="5" />
            <circle cx="150" cy="190" r="6" />
            <circle cx="205" cy="210" r="7" />
          </g>

          {/* face */}
          <g>
            <circle cx="155" cy="135" r="14" fill="#2d1733" />
            <circle cx="205" cy="135" r="14" fill="#2d1733" />
            <path
              d="M150 165 q30 25 60 0"
              fill="none"
              stroke="#2d1733"
              strokeWidth="8"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* left arm */}
        <g
          className="arm-left"
          stroke="#2d1733"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M115 165 q-40 -35 -55 -15" />
          <circle cx="55" cy="145" r="10" fill="#ffffff" stroke="#2d1733" />
          <circle cx="45" cy="160" r="10" fill="#ffffff" stroke="#2d1733" />
          <circle cx="65" cy="160" r="10" fill="#ffffff" stroke="#2d1733" />
        </g>

        {/* right arm */}
        <g
          className="arm-right"
          stroke="#2d1733"
          strokeWidth="8"
          strokeLinecap="round"
          fill="none"
        >
          <path d="M245 165 q40 -35 55 -15" />
          <circle cx="305" cy="145" r="10" fill="#ffffff" stroke="#2d1733" />
          <circle cx="315" cy="160" r="10" fill="#ffffff" stroke="#2d1733" />
          <circle cx="295" cy="160" r="10" fill="#ffffff" stroke="#2d1733" />
        </g>

        {/* legs */}
        <g
          className="leg-left"
          stroke="#2d1733"
          strokeWidth="8"
          strokeLinecap="round"
          fill="#ffffff"
        >
          <path d="M165 260 q-15 40 -35 65" fill="none" />
          <path d="M125 325 h-45 q-8 0 -10 8 v8 h72 q12 0 12 -12 v-8 q0 -8 -8 -8 z" />
        </g>
        <g
          className="leg-right"
          stroke="#2d1733"
          strokeWidth="8"
          strokeLinecap="round"
          fill="#ffffff"
        >
          <path d="M195 260 q15 40 35 65" fill="none" />
          <path d="M235 325 h45 q8 0 10 8 v8 h-72 q-12 0 -12 -12 v-8 q0 -8 8 -8 z" />
        </g>
      </g>

      {/* sparkles */}
      <g
        className="sparkles"
        stroke="#2d1733"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path d="M20 210 l10 -10 m-10 0 l10 10" />
        <path d="M330 210 l10 -10 m-10 0 l10 10" />
        <path d="M60 70 l10 -10 m-10 0 l10 10" />
        <path d="M300 70 l10 -10 m-10 0 l10 10" />
      </g>
    </svg>
  );
}
