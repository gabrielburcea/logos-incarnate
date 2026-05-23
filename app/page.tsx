import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-card">
        <p className="eyebrow">Reading-first · manuscript-centered · meaning-layered</p>
        <h1>Logos Incarnate</h1>
        <p className="hero-copy">
          A Phase 1 proof of concept for a Bible study app that begins with quiet reading,
          opens into a living manuscript, and introduces meaning before data overload.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/genesis-2">
            Enter the Genesis 2 experience
          </Link>
          <a className="secondary-link" href="#phase-one-focus">
            See what this POC includes
          </a>
        </div>
      </section>

      <section id="phase-one-focus" className="feature-grid">
        <article>
          <span className="feature-number">01</span>
          <h2>Quiet reader</h2>
          <p>Responsive chapter reading with strong typography, visible verse numbers, and minimal chrome.</p>
        </article>
        <article>
          <span className="feature-number">02</span>
          <h2>Study manuscript mode</h2>
          <p>Roomier spacing, margin-aware notes, and persistent visual study traces for Genesis 2.</p>
        </article>
        <article>
          <span className="feature-number">03</span>
          <h2>Meaning explorer</h2>
          <p>Curated targets like helper, woman, man, one flesh, side/rib, and naked / not ashamed.</p>
        </article>
        <article>
          <span className="feature-number">04</span>
          <h2>Restrained graph preview</h2>
          <p>Small relationship previews that stay subordinate to clarity and can expand later.</p>
        </article>
      </section>
    </main>
  );
}
