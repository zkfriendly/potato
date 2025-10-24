import React from "react";

type Basket = {
  name: string;
  ratios: { asset: string; pct: number }[];
  improvement: number; // % better than HODL
  featured?: boolean;
};

const baskets: Basket[] = [
  {
    name: "Cushioned Core",
    ratios: [
      { asset: "BTC", pct: 40 },
      { asset: "ETH", pct: 40 },
      { asset: "PYUSD", pct: 20 },
    ],
    improvement: 4.65,
    featured: true,
  },
  {
    name: "Balanced Blue",
    ratios: [
      { asset: "ETH", pct: 50 },
      { asset: "BTC", pct: 50 },
    ],
    improvement: 3.5,
  },
];

function RatioBar({ ratios }: { ratios: Basket["ratios"] }) {
  const colors: Record<string, string> = {
    ETH: "#8ec5ff",
    BTC: "#f4b154",
    PYUSD: "#61d3a5",
  };
  let x = 0;
  return (
    <svg
      className="ratio-bar"
      viewBox="0 0 100 12"
      width="100%"
      height="12"
      aria-hidden="true"
    >
      <rect
        x={0}
        y={1}
        width={100}
        height={10}
        rx={5}
        fill="#ffffff66"
        stroke="#2d1733"
        strokeWidth={0.8}
      />
      {ratios.map((r, i) => {
        const w = (r.pct / 100) * 100; // percent of width
        const rect = (
          <rect
            key={i}
            x={x}
            y={1.5}
            width={w}
            height={9}
            rx={4}
            fill={colors[r.asset] || "#ccc"}
          />
        );
        x += w;
        return rect;
      })}
    </svg>
  );
}

export default function TopBaskets() {
  return (
    <section className="top-baskets" id="top-baskets">
      <h2>Top performing baskets</h2>
      <div className="baskets-grid">
        {baskets.map((b) => (
          <article
            key={b.name}
            className={`basket-card${b.featured ? " featured" : ""}`}
          >
            <div className="card-head">
              <h3>
                {b.featured && (
                  <span className="badge-featured">👑 Top pick</span>
                )}
                {b.name}
              </h3>
              <span className="chip-positive">
                <span className="value">+{b.improvement.toFixed(2)}%</span> vs
                HODL
              </span>
            </div>
            <RatioBar ratios={b.ratios} />
            <ul className="ratio-list">
              {b.ratios.map((r) => (
                <li key={r.asset}>
                  <span className={`dot dot-${r.asset.toLowerCase()}`}></span>
                  {r.asset} • {r.pct}%
                </li>
              ))}
            </ul>
            <div className="card-actions">
              <a className="btn primary" href="#try">
                Try basket
              </a>
              <a className="btn ghost" href="#learn">
                Details
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
