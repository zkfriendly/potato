import { useEffect, useState } from "react";
import {
  getAllUserBasketsInfo,
  getExistingNickname,
  getWalletAddress,
  type BasketInfo,
} from "./pimlico";

type ProfileProps = {
  onLogout?: () => void;
};

// Supported baskets (same as landing page)
const SUPPORTED_BASKETS = [
  {
    name: "Balanced Blue",
    description: "Balanced crypto exposure with stable backing",
    ratios: [
      { asset: "BTC", pct: 40 },
      { asset: "ETH", pct: 40 },
      { asset: "PYUSD", pct: 20 },
    ],
    improvement: 4.65,
    featured: true,
  },
  {
    name: "Cushioned Core",
    description: "Equal split between leading cryptos",
    ratios: [
      { asset: "ETH", pct: 50 },
      { asset: "BTC", pct: 50 },
    ],
    improvement: 3.5,
  },
];

// Asset colors for visual consistency
const ASSET_COLORS: Record<string, string> = {
  ETH: "#8ec5ff",
  BTC: "#f4b154",
  PYUSD: "#61d3a5",
  USDC: "#2775ca",
  DAI: "#f5ac37",
};

// Helper function to determine basket type based on token configuration
function getBasketType(tokens: BasketInfo["tokens"]): string {
  // Sort tokens by percentage to normalize comparison
  const config = tokens
    .map((t) => ({
      symbol: t.symbol.toUpperCase(),
      pct: t.percentage,
    }))
    .sort((a, b) => b.pct - a.pct);

  // Check for Balanced Blue: 40% BTC, 40% ETH, 20% PYUSD
  if (config.length === 3) {
    const hasBTC40 = config.some(
      (c) => c.symbol.includes("BTC") && c.pct === 40
    );
    const hasETH40 = config.some(
      (c) => c.symbol.includes("ETH") && c.pct === 40
    );
    const hasPYUSD20 = config.some(
      (c) => c.symbol.includes("PYUSD") && c.pct === 20
    );
    if (hasBTC40 && hasETH40 && hasPYUSD20) {
      return "Balanced Blue";
    }
  }

  // Check for Cushioned Core: 50% ETH, 50% BTC (or any 2-token basket)
  // Default to Cushioned Core for 2-token baskets
  if (config.length === 2) {
    return "Cushioned Core";
  }

  // Default to Cushioned Core if unknown
  return "Cushioned Core";
}

function AssetIcon({ asset }: { asset: string }) {
  const ink = "#2d1733";
  if (asset === "BTC" || asset.includes("BTC")) {
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
  if (asset === "ETH" || asset.includes("ETH")) {
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
  // PYUSD or generic
  return (
    <svg className="asset-icon" viewBox="0 0 20 20" aria-label={asset}>
      <circle
        cx="10"
        cy="10"
        r="9"
        fill={ASSET_COLORS[asset] || "#61d3a5"}
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
        {asset[0]}
      </text>
    </svg>
  );
}

export default function Profile({ onLogout }: ProfileProps) {
  const [nickname, setNickname] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [userBaskets, setUserBaskets] = useState<BasketInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfileData() {
      try {
        setIsLoading(true);
        setError(null);

        // Get wallet address and nickname
        const address = await getWalletAddress();
        setWalletAddress(address);

        const nick = await getExistingNickname(address);
        setNickname(nick || "");

        // Get all user baskets
        const baskets = await getAllUserBasketsInfo(address);
        setUserBaskets(baskets);
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError("Failed to load profile data");
      } finally {
        setIsLoading(false);
      }
    }

    loadProfileData();
  }, []);

  if (isLoading) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1>Loading profile...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-header">
          <h1>Error</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = () => {
    if (confirm("Are you sure you want to logout?")) {
      // Clear authentication data
      localStorage.removeItem("potato:pk");
      localStorage.removeItem("potato:cred");
      // Call parent logout handler
      if (onLogout) {
        onLogout();
      }
    }
  };

  return (
    <div className="profile-page">
      {/* Profile Header */}
      <div className="profile-header">
        <button className="logout-btn" onClick={handleLogout} title="Logout">
          🚪 Logout
        </button>
        <div className="profile-info">
          <div className="greeting">
            {getGreeting()},{" "}
            <span className="nickname-highlight">{nickname}</span>! 🥔
          </div>
          <p className="welcome-text">
            Welcome to your Potato Finance dashboard
          </p>
          <p className="wallet-address">
            Wallet: {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
          </p>
        </div>
      </div>

      {/* Deposit Instructions */}
      <section className="deposit-instructions">
        <div className="instruction-card">
          <h3>💰 How to Deposit</h3>
          <p className="instruction-text">
            Send any supported token directly to your basket endpoint below.
            Your basket will automatically rebalance to maintain your target
            allocations.
          </p>
          <div className="pyusd-highlight">
            <strong>💙 PayPal Users:</strong> You can easily send PYUSD directly
            from your PayPal app! Just copy the ENS address from your basket and
            use it as the recipient address.
          </div>
        </div>
      </section>

      {/* User Baskets Section */}
      <section className="profile-section">
        <h2>Your Baskets</h2>
        {userBaskets.length === 0 ? (
          <div className="empty-state">
            <p>
              You don't have any baskets yet. Send funds to your endpoints to
              get started!
            </p>
          </div>
        ) : (
          <div className="user-baskets-grid">
            {userBaskets.map((basket) => {
              // Determine basket type and get corresponding data
              const basketType = getBasketType(basket.tokens);
              const basketData = SUPPORTED_BASKETS.find(
                (b) => b.name === basketType
              );

              // Determine endpoint subdomain
              const getEndpoint = () => {
                if (!nickname) return null;
                if (basketType === "Cushioned Core") {
                  return `${nickname.toLowerCase()}.cc.pyusd.eth`;
                } else if (basketType === "Balanced Blue") {
                  return `${nickname.toLowerCase()}.bb.pyusd.eth`;
                }
                return null;
              };
              const endpoint = getEndpoint();

              return (
                <article key={basket.address} className="user-basket-card">
                  <div className="card-head">
                    <div className="basket-header-info">
                      <h3>{basketType}</h3>
                      {endpoint && (
                        <div className="basket-endpoint-container">
                          <span className="endpoint-label">Send to:</span>
                          <div className="basket-endpoint">{endpoint}</div>
                          <button
                            className="copy-btn"
                            onClick={() => {
                              navigator.clipboard.writeText(endpoint);
                              alert("ENS address copied!");
                            }}
                            title="Copy address"
                          >
                            📋 Copy
                          </button>
                        </div>
                      )}
                      <p className="basket-address">
                        Contract: {basket.address.slice(0, 6)}...
                        {basket.address.slice(-4)}
                      </p>
                    </div>
                    {basketData && (
                      <div className="metrics">
                        <span className="chip-positive">
                          <span className="value">
                            +{basketData.improvement.toFixed(2)}%
                          </span>{" "}
                          vs HODL
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="basket-tokens">
                    {basket.tokens.map((token) => (
                      <div key={token.address} className="token-item">
                        <div className="token-info">
                          <AssetIcon asset={token.symbol} />
                          <div className="token-details">
                            <div className="token-name">
                              {token.symbol}
                              <span className="token-percentage">
                                {token.percentage}%
                              </span>
                            </div>
                            <div className="token-full-name">{token.name}</div>
                          </div>
                        </div>
                        <div className="token-balance">
                          <div className="balance-value">
                            {token.formattedBalance}
                          </div>
                          <div className="balance-symbol">{token.symbol}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="card-actions">
                    <button className="btn primary">Deposit</button>
                    <button className="btn ghost">Rebalance</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
