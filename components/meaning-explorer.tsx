"use client";

import { useState } from "react";
import { GraphPreview } from "@/components/graph-preview";
import type { MeaningTarget } from "@/lib/genesis2-fixtures";

const CONTEXT_STORAGE_KEY = "logos-incarnate:genesis-2:contextual-analysis";

function readStoredContextualNotes() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(CONTEXT_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Record<string, string>) : {};
  } catch {
    return {};
  }
}

export function MeaningExplorer({ target, headingId }: { target: MeaningTarget; headingId?: string }) {
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>(readStoredContextualNotes);
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({});
  const draft = draftNotes[target.id] ?? (savedNotes[target.id] ?? "");

  function saveContextualAnalysis() {
    const draftValue = draft.trim();
    const next = {
      ...savedNotes,
      [target.id]: draftValue,
    };
    setSavedNotes(next);
    window.localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify(next));
    setDraftNotes((current) => ({
      ...current,
      [target.id]: draftValue,
    }));
  }

  const contextualAnalysis = savedNotes[target.id]?.trim() ?? "";

  return (
    <section className="meaning-card" aria-labelledby={headingId ?? "meaning-explorer-heading"}>
      <div className="meaning-card__header">
        <span className="eyebrow">Focus card</span>
        <h2 id={headingId ?? "meaning-explorer-heading"}>
          {target.label}
        </h2>
        <p>
          {target.verseRange}
        </p>
      </div>

      <div className="meaning-card__section">
        <h3>Original word and Hebrew definition</h3>
        <p className="lexical-line">
          <strong>{target.originalWord}</strong>
          {target.transliteration ? <span> · {target.transliteration}</span> : null}
          {target.originalScript ? <span> · {target.originalScript}</span> : null}
        </p>
        <p>{target.hebrewDefinition}</p>
        {target.literalSense ? <p className="literal-sense">Literal sense: {target.literalSense}</p> : null}
      </div>

      <details className="meaning-detail" open>
        <summary>Contextual analysis</summary>
        <div className="meaning-card__section">
          {contextualAnalysis ? (
            <p className="saved-context-note">{contextualAnalysis}</p>
          ) : (
            <p>No contextual analysis yet. Add your own note below.</p>
          )}
          <label className="note-field">
            <span>Your contextual note</span>
            <textarea
              rows={4}
              value={draft}
              onChange={(event) =>
                setDraftNotes((current) => ({
                  ...current,
                  [target.id]: event.target.value,
                }))
              }
              placeholder={`Write your contextual analysis for ${target.label.toLowerCase()}...`}
            />
          </label>
          <button type="button" className="context-save-button" onClick={saveContextualAnalysis}>
            Save contextual analysis
          </button>
        </div>
      </details>

      <details className="meaning-detail">
        <summary>Core meaning</summary>
        <div className="meaning-card__section">
          <p>{target.summary}</p>
        </div>
      </details>

      <details className="meaning-detail">
        <summary>Why it matters here</summary>
        <div className="meaning-card__section">
          <p>{target.whyItMatters}</p>
        </div>
      </details>

      <details className="meaning-detail" open>
        <summary>Related passages: same original word</summary>
        <div className="meaning-card__section meaning-card__passages">
          {target.relatedOriginalWordPassages.map((passage) => (
            <details key={passage.reference} className="passage-detail">
              <summary>
                {target.label.toLowerCase()} ({target.originalWord}) · {passage.reference}
              </summary>
              <p>{passage.verseText}</p>
            </details>
          ))}
        </div>
      </details>

      <details className="meaning-detail">
        <summary>Same English rendering, different original word</summary>
        <div className="meaning-card__section meaning-card__passages">
          {target.relatedEnglishDifferentWordPassages.map((passage) => (
            <details key={passage.reference} className="passage-detail">
              <summary>
                {target.label.toLowerCase()} ({passage.originalWord}) · {passage.reference}
              </summary>
              <p>{passage.verseText}</p>
              <p className="passage-difference">{passage.differenceNote}</p>
            </details>
          ))}
        </div>
      </details>

      <details className="meaning-detail">
        <summary>Graph preview (supporting layer)</summary>
        <div className="meaning-card__section">
          <GraphPreview target={target} />
        </div>
      </details>
    </section>
  );
}
