import "./App.css";
import { useState } from "react";
import PotatoDancer from "./components/PotatoDancer";
import InvestingBars from "./components/InvestingBars";
import TopBaskets from "./components/TopBaskets";
import CreateProfile from "./CreateProfile";
import Profile from "./Profile";
import { getPimlicoClients, checkPasskeyAvailability } from "./pimlico";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [walletReady, setWalletReady] = useState(false);
  const [showPasskeyChoice, setShowPasskeyChoice] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const handleSetupClick = async () => {
    const hasExistingKey = localStorage.getItem("potato:pk");
    const hasPasskeys = await checkPasskeyAvailability();

    // If no existing key and passkeys are available, show choice
    if (!hasExistingKey && hasPasskeys) {
      setShowPasskeyChoice(true);
    } else {
      // Direct authenticate with existing or create new
      await authenticateWithPasskey(false);
    }
  };

  const authenticateWithPasskey = async (forceNew: boolean) => {
    setIsAuthenticating(true);
    setShowPasskeyChoice(false);
    try {
      // Initialize passkey and wallet
      await getPimlicoClients(forceNew);
      setWalletReady(true);
      setIsModalOpen(true);
    } catch (error) {
      console.log("Passkey authentication cancelled or failed:", error);
      // Only show alert for non-cancellation/timeout errors
      const isCancellation =
        error instanceof Error &&
        (error.message.includes("cancelled") ||
          error.message.includes("timed out") ||
          error.message.includes("not allowed") ||
          error.name === "NotAllowedError" ||
          error.name === "AbortError");
      if (!isCancellation && error instanceof Error) {
        alert(error.message);
      }
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Show profile page if setup is complete
  if (showProfile) {
    return <Profile />;
  }

  return (
    <div className="landing">
      {/* Passkey wallet embeds/initializes from the profile flow; no standalone sign-in here */}
      <div className="banner">
        🥔 Set it, spud it: effortless crypto basket rebalancing
      </div>

      <header className="hero">
        <div className="hero-copy">
          <h1>
            <span className="scribble">SMART, SILLY,</span>
            <br />
            <span className="blob">POTATO FINANCE</span>
          </h1>
          <p className="tagline">
            Build a basket, choose your weights, and let Potato keep your ratios
            on target—hourly checks, friendly nudges, zero stress.
          </p>
          <div className="cta-row">
            <button
              className="btn primary"
              onClick={handleSetupClick}
              disabled={isAuthenticating}
            >
              {isAuthenticating ? "Authenticating..." : "Setup"}
            </button>
          </div>
          <ul className="chips">
            <li>Auto‑rebalance</li>
            <li>Non‑custodial</li>
            <li>Gas‑friendly</li>
          </ul>
        </div>
        <div className="hero-visual">
          <PotatoDancer />
          <InvestingBars />
        </div>
      </header>

      <div className="scroll-bar">
        <a
          className="scroll-prompt"
          href="#top-baskets"
          aria-label="Scroll to top baskets"
        >
          <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M6 9l6 6 6-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        </a>
      </div>

      {/* wavy separator */}
      <div className="wave" aria-hidden="true">
        <svg
          viewBox="0 0 1440 80"
          width="100%"
          height="80"
          preserveAspectRatio="none"
        >
          <path
            d="M0,48 C240,96 480,0 720,32 C960,64 1200,96 1440,48 L1440,80 L0,80 Z"
            fill="#fff4fb"
          />
        </svg>
      </div>

      <TopBaskets />

      <section className="features" id="learn">
        <div className="feature-card">
          <h3>Pick your basket</h3>
          <p>Example: 40% ETH · 40% BTC · 10% USDC · 10% fun.</p>
        </div>
        <div className="feature-card">
          <h3>Set gentle rules</h3>
          <p>Every hour, if ratios drift {">"} 5%, we nudge them back.</p>
        </div>
        <div className="feature-card">
          <h3>Sleep like a spud</h3>
          <p>We handle the rebalancing dances automatically.</p>
        </div>
      </section>

      <footer className="footer">
        <span>© {new Date().getFullYear()} Potato finance</span>
      </footer>

      {/* Passkey Choice Modal */}
      {showPasskeyChoice && (
        <div
          className="modal-overlay"
          onClick={() => setShowPasskeyChoice(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowPasskeyChoice(false)}
            >
              ×
            </button>
            <section className="create-profile">
              <h2>Choose authentication method 🔐</h2>
              <p className="hint">
                Do you want to use an existing passkey or create a new one?
              </p>
              <div
                className="card-actions"
                style={{ flexDirection: "column", gap: "12px" }}
              >
                <button
                  className="btn primary"
                  onClick={() => authenticateWithPasskey(false)}
                  disabled={isAuthenticating}
                >
                  Use existing passkey
                </button>
                <button
                  className="btn ghost"
                  onClick={() => authenticateWithPasskey(true)}
                  disabled={isAuthenticating}
                >
                  Create new passkey
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

      {/* Create Profile Modal */}
      {isModalOpen && walletReady && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <CreateProfile
              onComplete={(hash) => {
                setIsModalOpen(false);
                setWalletReady(false);
                // Navigate to profile page after setup
                if (hash && hash !== "existing") {
                  // Small delay to show completion before navigating
                  setTimeout(() => setShowProfile(true), 500);
                } else if (hash === "existing") {
                  // If already set up, navigate immediately
                  setShowProfile(true);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
