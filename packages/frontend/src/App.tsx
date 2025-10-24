import "./App.css";
import PotatoDancer from "./components/PotatoDancer";
import InvestingBars from "./components/InvestingBars";
import TopBaskets from "./components/TopBaskets";

function App() {
  return (
    <div className="landing">
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
            <a className="btn primary" href="#try">
              Try now
            </a>
            <a className="btn ghost" href="#learn">
              Learn more
            </a>
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

      {/* wavy separator for a unique section break */}
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
    </div>
  );
}

export default App;
