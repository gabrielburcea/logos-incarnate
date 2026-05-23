"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  genesis2Chapter,
  meaningTargetMap,
  meaningTargets,
  type MeaningTargetId,
} from "@/lib/genesis2-fixtures";
import { MeaningExplorer } from "@/components/meaning-explorer";

type Mode = "reading" | "study";

type VerseAnnotation = {
  highlight?: boolean;
  underline?: boolean;
  note?: string;
};

type AnnotationState = Record<number, VerseAnnotation>;

const STORAGE_KEY = "logos-incarnate:genesis-2:annotations";
const STORAGE_EVENT = "logos-incarnate:annotations-updated";

function readStoredAnnotations(): AnnotationState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AnnotationState) : {};
  } catch {
    return {};
  }
}

function subscribeToAnnotations(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleStorageChange = () => onStoreChange();

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener(STORAGE_EVENT, handleStorageChange);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener(STORAGE_EVENT, handleStorageChange);
  };
}

function saveStoredAnnotations(next: AnnotationState) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function GenesisExperience() {
  const [mode, setMode] = useState<Mode>("reading");
  const [selectedVerse, setSelectedVerse] = useState<number>(18);
  const [selectedMeaning, setSelectedMeaning] = useState<MeaningTargetId>("helper");
  const annotations = useSyncExternalStore<AnnotationState>(
    subscribeToAnnotations,
    readStoredAnnotations,
    () => ({}),
  );
  const activeAnnotation = annotations[selectedVerse] ?? {};

  const totalAnnotations = useMemo(
    () =>
      Object.values(annotations).filter(
        (annotation) => annotation.highlight || annotation.underline || annotation.note,
      ).length,
    [annotations],
  );

  function updateAnnotation(next: VerseAnnotation) {
    saveStoredAnnotations({
      ...annotations,
      [selectedVerse]: {
        ...annotations[selectedVerse],
        ...next,
      },
    });
  }

  return (
    <main className="experience-shell">
      <header className="experience-header">
        <div>
          <Link className="back-link" href="/">
            ← Back home
          </Link>
          <p className="eyebrow">Phase 1 vertical slice</p>
          <h1>{genesis2Chapter.title}</h1>
          <p className="lede">{genesis2Chapter.summary}</p>
        </div>
        <div className="chapter-meta">
          <span>{genesis2Chapter.translation}</span>
          <span>{genesis2Chapter.verses.length} verses</span>
          <span>{totalAnnotations} marked verses</span>
        </div>
      </header>

      <section className="mode-bar" aria-label="Reading and study mode switcher">
        <div className="segmented-control">
          <button
            type="button"
            className={mode === "reading" ? "is-active" : ""}
            onClick={() => setMode("reading")}
          >
            Reading mode
          </button>
          <button
            type="button"
            className={mode === "study" ? "is-active" : ""}
            onClick={() => setMode("study")}
          >
            Study manuscript mode
          </button>
        </div>
        <p>
          {mode === "reading"
            ? "Quiet text-first presentation with subdued study signals."
            : "Expanded spacing, margin rails, and visible study traces for verse-by-verse work."}
        </p>
      </section>

      <div className={`experience-layout ${mode === "study" ? "study-layout" : "reading-layout"}`}>
        <section className="reading-column" aria-labelledby="chapter-text-heading">
          <div className="reading-column__header">
            <h2 id="chapter-text-heading">Chapter text</h2>
            <p>Select a verse to highlight, underline, add a note, or open a related meaning card.</p>
          </div>

          <div className={`verse-list ${mode}`}>
            {genesis2Chapter.verses.map((verse) => {
              const annotation = annotations[verse.number] ?? {};
              const isSelected = selectedVerse === verse.number;

              return (
                <article
                  key={verse.number}
                  className={[
                    "verse-card",
                    isSelected ? "is-selected" : "",
                    annotation.highlight ? "is-highlighted" : "",
                    annotation.underline ? "is-underlined" : "",
                    annotation.note ? "has-note" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <button
                    type="button"
                    className="verse-button"
                    onClick={() => setSelectedVerse(verse.number)}
                  >
                    <span className="verse-number">{verse.number}</span>
                    <span className="verse-text">{verse.text}</span>
                  </button>

                  {mode === "study" && annotation.note ? (
                    <aside className="margin-note" aria-label={`Note for verse ${verse.number}`}>
                      <span className="margin-note__label">Note</span>
                      <p>{annotation.note}</p>
                    </aside>
                  ) : null}

                  {verse.focusTargetIds?.length ? (
                    <div className="focus-targets" aria-label={`Meaning targets for verse ${verse.number}`}>
                      {verse.focusTargetIds.map((targetId) => (
                        <button
                          key={targetId}
                          type="button"
                          className={selectedMeaning === targetId ? "is-active" : ""}
                          onClick={() => {
                            setSelectedVerse(verse.number);
                            setSelectedMeaning(targetId);
                          }}
                        >
                          {meaningTargetMap[targetId].label}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        <aside className="inspector-column">
          <section className="annotation-panel" aria-labelledby="annotation-panel-heading">
            <div>
              <p className="eyebrow">Annotation scaffold</p>
              <h2 id="annotation-panel-heading">Verse {selectedVerse}</h2>
              <p>Local-first study traces keep the manuscript feeling personal without introducing backend complexity yet.</p>
            </div>

            <div className="annotation-actions">
              <button
                type="button"
                className={activeAnnotation.highlight ? "is-active" : ""}
                onClick={() => updateAnnotation({ highlight: !activeAnnotation.highlight })}
              >
                Highlight
              </button>
              <button
                type="button"
                className={activeAnnotation.underline ? "is-active" : ""}
                onClick={() => updateAnnotation({ underline: !activeAnnotation.underline })}
              >
                Underline
              </button>
            </div>

            <label className="note-field">
              <span>Margin note</span>
              <textarea
                rows={5}
                value={activeAnnotation.note ?? ""}
                onChange={(event) => updateAnnotation({ note: event.target.value })}
                placeholder="Capture a reflection, question, or connection for this verse."
              />
            </label>
          </section>

          <section className="target-picker" aria-labelledby="target-picker-heading">
            <div>
              <p className="eyebrow">Curated focus targets</p>
              <h2 id="target-picker-heading">Meaning-first exploration</h2>
            </div>
            <div className="target-picker__buttons">
              {meaningTargets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  className={selectedMeaning === target.id ? "is-active" : ""}
                  onClick={() => setSelectedMeaning(target.id)}
                >
                  <strong>{target.label}</strong>
                  <span>{target.verseRange}</span>
                </button>
              ))}
            </div>
          </section>

          <MeaningExplorer target={meaningTargetMap[selectedMeaning]} />
        </aside>
      </div>
    </main>
  );
}
