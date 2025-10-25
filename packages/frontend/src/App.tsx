import "./App.css";
import { useState } from "react";
import PotatoDancer from "./components/PotatoDancer";
import InvestingBars from "./components/InvestingBars";
import TopBaskets from "./components/TopBaskets";
import CreateProfile from "./CreateProfile";
// Pimlico helpers are used in the profile flow; no direct import here

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

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
              onClick={() => setIsModalOpen(true)}
            >
              Setup
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

      {/* Create Profile Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ×
            </button>
            <CreateProfile onComplete={() => setIsModalOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
