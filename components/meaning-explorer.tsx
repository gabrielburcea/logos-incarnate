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

export function MeaningExplorer({ target }: { target: MeaningTarget }) {
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
    <section className="meaning-card" aria-labelledby="meaning-explorer-heading">
      <div className="meaning-card__header">
        <span className="eyebrow">Meaning explorer</span>
        <h2 id="meaning-explorer-heading">
          {target.label} ({target.originalWord})
        </h2>
        {target.originalScript ? <p className="original-script">{target.originalScript}</p> : null}
        <p>
          {target.verseRange} · meaning first, context after, graph last.
        </p>
      </div>

      <div className="meaning-card__section">
        <h3>Core meaning</h3>
        <p>{target.summary}</p>
      </div>

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

      <GraphPreview target={target} />
    </section>
  );
}
