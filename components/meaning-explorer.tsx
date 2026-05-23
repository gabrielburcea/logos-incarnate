import { GraphPreview } from "@/components/graph-preview";
import type { MeaningTarget } from "@/lib/genesis2-fixtures";

export function MeaningExplorer({ target }: { target: MeaningTarget }) {
  return (
    <section className="meaning-card" aria-labelledby="meaning-explorer-heading">
      <div className="meaning-card__header">
        <span className="eyebrow">Meaning explorer</span>
        <h2 id="meaning-explorer-heading">{target.label}</h2>
        <p>
          {target.verseRange} · meaning first, context after, graph last.
        </p>
      </div>

      <div className="meaning-card__section">
        <h3>Concise meaning</h3>
        <p>{target.summary}</p>
      </div>

      <div className="meaning-card__section">
        <h3>Why it matters here</h3>
        <p>{target.whyItMatters}</p>
      </div>

      <div className="meaning-card__section">
        <h3>Contextual analysis</h3>
        <p>{target.context}</p>
      </div>

      <div className="meaning-card__section">
        <h3>Related passages</h3>
        <ul>
          {target.relatedPassages.map((passage) => (
            <li key={passage}>{passage}</li>
          ))}
        </ul>
      </div>

      <GraphPreview target={target} />
    </section>
  );
}
