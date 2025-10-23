import "./App.css";
import PotatoDancer from "./components/PotatoDancer";

function App() {
  return (
    <div className="landing">
      <div className="banner">
        🥔 We're buttery-smooth global money for everyone
      </div>

      <header className="hero">
        <div className="hero-copy">
          <h1>
            <span className="scribble">BUTTERY-SMOOTH</span>
            <br />
            <span className="blob">GLOBAL MONEY</span>
          </h1>
          <p className="tagline">
            Potato finance automatically rebalances your crypto basket so you
            don't have to. Friendly, funny, and a little bit wiggly.
          </p>
          <div className="cta-row">
            <a className="btn primary" href="#try">
              Try now
            </a>
            <a className="btn ghost" href="#learn">
              Learn more
            </a>
          </div>
        </div>
        <div className="hero-visual">
          <PotatoDancer />
        </div>
      </header>

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
