import "./App.css";
import { useState, useEffect } from "react";
import PotatoDancer from "./components/PotatoDancer";
import InvestingBars from "./components/InvestingBars";
import TopBaskets from "./components/TopBaskets";
import CreateProfile from "./CreateProfile";
import Profile from "./Profile";
import {
  getPimlicoClients,
  checkPasskeyAvailability,
  getExistingNickname,
} from "./pimlico";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [walletReady, setWalletReady] = useState(false);
  const [showPasskeyChoice, setShowPasskeyChoice] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [showNicknameFirst, setShowNicknameFirst] = useState(false);
  const [pendingNickname, setPendingNickname] = useState<string>("");
  const [setupStatus, setSetupStatus] = useState<string>("");

  // Check if user is already authenticated on mount
  useEffect(() => {
    async function checkExistingAuth() {
      try {
        const hasPrivateKey = localStorage.getItem("potato:pk");
        if (hasPrivateKey) {
          // User has a key, check if they have a nickname
          const { account } = await getPimlicoClients();
          const nickname = await getExistingNickname(account.address);
          if (nickname) {
            // User is fully set up, show profile
            setShowProfile(true);
          } else {
            // User has key but no nickname - clear everything so they can start fresh
            console.log("No nickname found, clearing stored credentials");
            localStorage.removeItem("potato:pk");
            localStorage.removeItem("potato:cred");
          }
        }
      } catch (error) {
        console.error("Error checking existing auth:", error);
        // On error, also clear credentials to allow fresh start
        localStorage.removeItem("potato:pk");
        localStorage.removeItem("potato:cred");
      } finally {
        setIsCheckingAuth(false);
      }
    }
    checkExistingAuth();
  }, []);

  const handleSetupClick = async () => {
    const hasExistingKey = localStorage.getItem("potato:pk");
    const hasPasskeys = await checkPasskeyAvailability();

    // Always show passkey choice first if passkeys are available
    if (hasPasskeys) {
      setShowPasskeyChoice(true);
    } else if (hasExistingKey) {
      // Has key but no passkey support
      await authenticateWithPasskey(false);
    } else {
      // No key, no passkey support - ask for nickname and create
      setShowNicknameFirst(true);
    }
  };

  const handlePasskeyChoice = async (useExisting: boolean) => {
    if (useExisting) {
      // Use existing passkey - authenticate and check nickname
      await authenticateWithPasskey(false);
    } else {
      // Create new passkey - ask for nickname first
      setShowPasskeyChoice(false);
      setShowNicknameFirst(true);
    }
  };

  const handleNicknameSubmit = async (nickname: string) => {
    setPendingNickname(nickname);
    setShowNicknameFirst(false);

    // Now create the passkey with the nickname
    await authenticateWithPasskey(true);
  };

  const authenticateWithPasskey = async (forceNew: boolean) => {
    setIsAuthenticating(true);
    setShowPasskeyChoice(false);
    try {
      // Initialize passkey and wallet - pass nickname for new users
      setSetupStatus("Creating your wallet...");
      const nicknameToUse =
        forceNew && pendingNickname ? pendingNickname : undefined;
      await getPimlicoClients(forceNew, nicknameToUse);

      // If we just created a new passkey with a nickname, send setup transaction automatically
      if (forceNew && pendingNickname) {
        setSetupStatus("Sending setup transaction...");
        const { sendSetupTransaction } = await import("./pimlico");
        const hash = await sendSetupTransaction(pendingNickname);
        console.log("Setup transaction sent:", hash);
        setSetupStatus("Setup complete! Redirecting...");
        setPendingNickname(""); // Clear pending nickname
        // Navigate to profile after successful setup
        setTimeout(() => {
          setShowProfile(true);
          setSetupStatus("");
        }, 1000);
      } else {
        // Existing passkey - check if nickname already exists
        setSetupStatus("Checking your profile...");
        const existingNickname = await getExistingNickname();

        if (existingNickname) {
          // Has nickname - go directly to profile
          setSetupStatus("Welcome back! Redirecting...");
          setTimeout(() => {
            setShowProfile(true);
            setSetupStatus("");
          }, 500);
        } else {
          // No nickname - show modal to set one
          setWalletReady(true);
          setIsModalOpen(true);
          setSetupStatus("");
        }
      }
    } catch (error) {
      console.log("Passkey authentication cancelled or failed:", error);
      setSetupStatus("");
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

  // Show loading while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="landing">
        <div className="profile-header">
          <h1>Loading... 🥔</h1>
        </div>
      </div>
    );
  }

  // Show profile page if setup is complete
  if (showProfile) {
    return <Profile onLogout={() => setShowProfile(false)} />;
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

      {/* Setup Status Modal */}
      {setupStatus && (
        <div className="modal-overlay">
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <section className="create-profile">
              <h2>Setting up your account 🥔</h2>
              <p className="hint" style={{ fontSize: "18px", fontWeight: 600 }}>
                {setupStatus}
              </p>
            </section>
          </div>
        </div>
      )}

      {/* Nickname First Modal */}
      {showNicknameFirst && !setupStatus && (
        <div
          className="modal-overlay"
          onClick={() => setShowNicknameFirst(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setShowNicknameFirst(false)}
            >
              ×
            </button>
            <section className="create-profile">
              <h2>Choose your nickname 🥔</h2>
              <p className="hint">
                Pick a nickname for your Potato profile. This will be saved with
                your passkey.
              </p>
              <label>
                <input
                  type="text"
                  placeholder="e.g. zkfriendly"
                  value={pendingNickname}
                  onChange={(e) =>
                    setPendingNickname(
                      e.target.value.replace(/[^a-zA-Z0-9-_]/g, "")
                    )
                  }
                />
              </label>
              <div className="card-actions">
                <button
                  className="btn primary"
                  disabled={!pendingNickname.trim()}
                  onClick={() => handleNicknameSubmit(pendingNickname)}
                >
                  Continue
                </button>
                <button
                  className="btn ghost"
                  onClick={() => setShowNicknameFirst(false)}
                >
                  Cancel
                </button>
              </div>
            </section>
          </div>
        </div>
      )}

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
                  onClick={() => handlePasskeyChoice(true)}
                  disabled={isAuthenticating}
                >
                  Use existing passkey
                </button>
                <button
                  className="btn ghost"
                  onClick={() => handlePasskeyChoice(false)}
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
              initialNickname={pendingNickname}
              onComplete={(hash) => {
                setIsModalOpen(false);
                setWalletReady(false);
                setPendingNickname(""); // Clear pending nickname
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
