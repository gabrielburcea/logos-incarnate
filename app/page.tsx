import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <section className="hero-card">
        <p className="eyebrow">Reading-first · manuscript-centered · meaning-layered</p>
        <h1>Logos Incarnate</h1>
        <p className="hero-copy">
          A Bible study app that begins with quiet reading,
          opens into a living manuscript, and provides meaning exploration.
        </p>
        <div className="hero-actions">
          <Link className="primary-link" href="/read">
            Start Reading
          </Link>
          <a className="secondary-link" href="#phase-one-focus">
            See what this includes
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
          <p>Roomier spacing, margin-aware annotations, and persistent visual study traces.</p>
        </article>
        <article>
          <span className="feature-number">03</span>
          <h2>Multi-translation support</h2>
          <p>Switch between translations and navigate books and chapters seamlessly.</p>
        </article>
        <article>
          <span className="feature-number">04</span>
          <h2>Annotation tools</h2>
          <p>Pen, marker, and eraser tools for underlining words and freehand drawing on the manuscript.</p>
        </article>
      </section>
    </main>
  );
}
