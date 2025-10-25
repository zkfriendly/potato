type Basket = {
  name: string;
  ratios: { asset: string; pct: number }[];
  improvement: number; // % better than HODL
  totalReturn?: number;
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
    totalReturn: 48.05,
    featured: true,
  },
  {
    name: "Balanced Blue",
    ratios: [
      { asset: "ETH", pct: 50 },
      { asset: "BTC", pct: 50 },
    ],
    improvement: 3.5,
    totalReturn: 83.21,
  },
];

function RatioBar({ ratios }: { ratios: Basket["ratios"] }) {
  const colors: Record<string, string> = {
    ETH: "#8ec5ff",
    BTC: "#f4b154",
    PYUSD: "#61d3a5",
  };
  // use a simple, safe id for clipPath (no colons)
  const clipId = `barclip-${Math.random().toString(36).slice(2, 8)}`;
  let x = 0;
  return (
    <svg
      className="ratio-bar"
      viewBox="0 0 100 28"
      width="100%"
      height="28"
      aria-hidden="true"
    >
      <defs>
        <clipPath id={clipId}>
          <rect x={0.5} y={2.5} width={99} height={23} rx={11.5} />
        </clipPath>
      </defs>
      <g>
        <rect
          x={0.5}
          y={2.5}
          width={99}
          height={23}
          rx={11.5}
          fill="#ffffffd9"
          stroke="#2d1733"
          strokeWidth={1.5}
        />
        <g clipPath={`url(#${clipId})`}>
          {ratios.map((r, i) => {
            let w = (r.pct / 100) * 99; // match inner width
            if (i === ratios.length - 1) w = 99 - x; // snap last to inner edge
            const node = (
              <rect
                key={i}
                x={x}
                y={2.5}
                width={w}
                height={23}
                rx={11.5}
                fill={colors[r.asset] || "#ccc"}
              />
            );
            x += w;
            return node;
          })}
          <rect
            x={0.5}
            y={2.5}
            width={99}
            height={11}
            rx={11.5}
            fill="#ffffff33"
          />
        </g>
        <rect
          x={0.5}
          y={2.5}
          width={99}
          height={23}
          rx={11.5}
          fill="none"
          stroke="#2d1733"
          strokeWidth={1.5}
          pointerEvents="none"
        />
      </g>
    </svg>
  );
}

function AssetIcon({ asset }: { asset: string }) {
  const ink = "#2d1733";
  if (asset === "BTC") {
    return (
      <svg className="asset-icon" viewBox="0 0 20 20" aria-label="BTC">
        <circle
          cx="10"
          cy="10"
          r="9"
          fill="#f4b154"
          stroke={ink}
          strokeWidth="2"
        />
        <text
          x="10"
          y="12"
          textAnchor="middle"
          fontWeight={900}
          fontSize="9"
          fill={ink}
        >
          ₿
        </text>
      </svg>
    );
  }
  if (asset === "ETH") {
    return (
      <svg className="asset-icon" viewBox="0 0 20 20" aria-label="ETH">
        <polygon
          points="10,2 15,10 10,12 5,10"
          fill="#8ec5ff"
          stroke={ink}
          strokeWidth="2"
        />
        <polygon
          points="10,18 15,10 10,12 5,10"
          fill="#b8dcff"
          stroke={ink}
          strokeWidth="2"
        />
      </svg>
    );
  }
  // PYUSD
  return (
    <svg className="asset-icon" viewBox="0 0 20 20" aria-label="PYUSD">
      <circle
        cx="10"
        cy="10"
        r="9"
        fill="#61d3a5"
        stroke={ink}
        strokeWidth="2"
      />
      <text
        x="10"
        y="12"
        textAnchor="middle"
        fontWeight={900}
        fontSize="9"
        fill={ink}
      >
        P
      </text>
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
              <div className="metrics">
                <span className="chip-positive">
                  <span className="value">+{b.improvement.toFixed(2)}%</span> vs
                  HODL
                </span>
                {b.totalReturn !== undefined && (
                  <div className="return-strong">
                    {b.totalReturn.toFixed(2)}% vs USD
                  </div>
                )}
              </div>
            </div>
            {/* ratio bars removed per request */}
            <ul className="ratio-list">
              {b.ratios.map((r) => (
                <li key={r.asset}>
                  <AssetIcon asset={r.asset} /> {r.asset} • {r.pct}%
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
