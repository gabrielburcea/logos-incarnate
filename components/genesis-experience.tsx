"use client";

import { useEffect, useMemo, useState } from "react";
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
  underlinedWordIndexes?: number[];
  note?: string;
  noteColor?: string;
};

type AnnotationState = Record<number, VerseAnnotation>;

const STORAGE_KEY = "logos-incarnate:genesis-2:annotations";
const DEFAULT_NOTE_COLOR = "#6f4e37";
const NOTE_COLORS = ["#6f4e37", "#7a3b2e", "#3f5f7f", "#4f6a47", "#5f3f74"];

function toSafeAnnotationState(raw: unknown): AnnotationState {
  if (!raw || typeof raw !== "object") {
    return {};
  }

  const safeEntries = Object.entries(raw as Record<string, VerseAnnotation>)
    .map(([key, value]) => {
      const verseNumber = Number.parseInt(key, 10);
      if (!Number.isInteger(verseNumber) || verseNumber < 1 || !value || typeof value !== "object") {
        return null;
      }

      const underlinedWordIndexes = Array.isArray(value.underlinedWordIndexes)
        ? value.underlinedWordIndexes.filter(
            (index): index is number => typeof index === "number" && Number.isInteger(index) && index >= 0,
          )
        : [];
      const note = typeof value.note === "string" ? value.note : "";
      const noteColor =
        typeof value.noteColor === "string" && NOTE_COLORS.includes(value.noteColor)
          ? value.noteColor
          : DEFAULT_NOTE_COLOR;

      return [
        verseNumber,
        {
          underlinedWordIndexes,
          note,
          noteColor,
        },
      ] as const;
    })
    .filter(Boolean) as Array<readonly [number, VerseAnnotation]>;

  return Object.fromEntries(safeEntries);
}

function readStoredAnnotations(): AnnotationState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? toSafeAnnotationState(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function GenesisExperience() {
  const [mode, setMode] = useState<Mode>("reading");
  const [selectedVerse, setSelectedVerse] = useState<number>(18);
  const [selectedMeaning, setSelectedMeaning] = useState<MeaningTargetId>("helper");
  const [annotations, setAnnotations] = useState<AnnotationState>({});
  const [hasLoadedAnnotations, setHasLoadedAnnotations] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [noteColorDrafts, setNoteColorDrafts] = useState<Record<number, string>>({});
  const activeAnnotation = annotations[selectedVerse] ?? {};
  const noteDraft = noteDrafts[selectedVerse] ?? (activeAnnotation.note ?? "");
  const noteColorDraft = noteColorDrafts[selectedVerse] ?? (activeAnnotation.noteColor ?? DEFAULT_NOTE_COLOR);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setAnnotations(readStoredAnnotations());
      setHasLoadedAnnotations(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!hasLoadedAnnotations) {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(annotations));
  }, [annotations, hasLoadedAnnotations]);

  const totalAnnotations = useMemo(
    () =>
      Object.values(annotations).filter((annotation) => {
        const hasUnderline = Boolean(annotation.underlinedWordIndexes?.length);
        const hasNote = Boolean(annotation.note?.trim());
        return hasUnderline || hasNote;
      }).length,
    [annotations],
  );

  function updateAnnotation(next: VerseAnnotation) {
    setAnnotations((current) => ({
      ...current,
      [selectedVerse]: {
        ...current[selectedVerse],
        ...next,
      },
    }));
  }

  function toggleWordUnderline(verseNumber: number, wordIndex: number) {
    setAnnotations((current) => {
      const currentIndexes = current[verseNumber]?.underlinedWordIndexes ?? [];
      const nextIndexes = currentIndexes.includes(wordIndex)
        ? currentIndexes.filter((index) => index !== wordIndex)
        : [...currentIndexes, wordIndex].sort((left, right) => left - right);
      return {
        ...current,
        [verseNumber]: {
          ...current[verseNumber],
          underlinedWordIndexes: nextIndexes,
        },
      };
    });
  }

  function saveMarginNote() {
    updateAnnotation({
      note: noteDraft.trim(),
      noteColor: noteColorDraft,
    });
  }

  function clearMarginNote() {
    setNoteDrafts((current) => ({
      ...current,
      [selectedVerse]: "",
    }));
    updateAnnotation({
      note: "",
      noteColor: noteColorDraft,
    });
  }

  function renderVerseText(verseNumber: number, verseText: string, annotation: VerseAnnotation, isSelected: boolean) {
    const words = verseText.split(" ");
    const underlined = new Set(annotation.underlinedWordIndexes ?? []);
    const canUnderlineWords = mode === "study" && isSelected;

    return (
      <span className="verse-text">
        {words.map((word, index) => {
          const isUnderlined = underlined.has(index);

          if (!canUnderlineWords) {
            return (
              <span
                key={`${verseNumber}-word-${index}`}
                className={isUnderlined ? "verse-word is-underlined" : "verse-word"}
              >
                {word}
                {index < words.length - 1 ? " " : ""}
              </span>
            );
          }

          return (
            <button
              key={`${verseNumber}-word-${index}`}
              type="button"
              className={isUnderlined ? "verse-word is-underlined is-word-button" : "verse-word is-word-button"}
              onClick={() => toggleWordUnderline(verseNumber, index)}
              aria-pressed={isUnderlined}
            >
              {word}
              {index < words.length - 1 ? " " : ""}
            </button>
          );
        })}
      </span>
    );
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
            ? "Quiet text-only presentation: just Scripture and verse numbers."
            : "Expanded spacing, margin rails, and visible study traces for verse-by-verse work."}
        </p>
      </section>

      <div className={`experience-layout ${mode === "study" ? "study-layout" : "reading-layout"} ${mode === "reading" ? "is-reading-only" : ""}`}>
        <section className="reading-column" aria-labelledby="chapter-text-heading">
          <div className="reading-column__header">
            <h2 id="chapter-text-heading">Chapter text</h2>
            <p>
              {mode === "reading"
                ? "Read Genesis 2 in a calm, uncluttered manuscript view."
                : "Select a verse to underline individual words, write a margin note, and open meaning cards."}
            </p>
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
                    annotation.underlinedWordIndexes?.length ? "has-underlines" : "",
                    annotation.note ? "has-note" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {mode === "study" ? (
                    <div
                      className="verse-button verse-button--interactive"
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedVerse(verse.number)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedVerse(verse.number);
                        }
                      }}
                    >
                      <span className="verse-number">{verse.number}</span>
                      {renderVerseText(verse.number, verse.text, annotation, isSelected)}
                    </div>
                  ) : (
                    <div className="verse-static">
                      <span className="verse-number">{verse.number}</span>
                      {renderVerseText(verse.number, verse.text, annotation, false)}
                    </div>
                  )}

                  {mode === "study" && annotation.note ? (
                    <aside
                      className="margin-note"
                      aria-label={`Note for verse ${verse.number}`}
                      style={{ color: annotation.noteColor ?? DEFAULT_NOTE_COLOR }}
                    >
                      <span className="margin-note__label">Note</span>
                      <p>{annotation.note}</p>
                    </aside>
                  ) : null}

                  {mode === "study" && verse.focusTargetIds?.length ? (
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

        {mode === "study" ? (
          <aside className="inspector-column">
            <section className="annotation-panel" aria-labelledby="annotation-panel-heading">
              <div>
                <p className="eyebrow">Study manuscript tools</p>
                <h2 id="annotation-panel-heading">Verse {selectedVerse}</h2>
                <p>Underline only selected words in the verse and save handwritten margin notes.</p>
              </div>

              <div className="annotation-actions annotation-actions--helper">
                <span>Tap words in the selected verse to underline them.</span>
              </div>

              <label className="note-field">
                <span>Margin note</span>
                <textarea
                  rows={4}
                  value={noteDraft}
                  onChange={(event) =>
                    setNoteDrafts((current) => ({
                      ...current,
                      [selectedVerse]: event.target.value,
                    }))
                  }
                  placeholder="Write a handwritten-style note for this verse."
                />
              </label>

              <div className="color-picker" role="group" aria-label="Choose note color">
                <span>Note color</span>
                <div className="color-picker__swatches">
                  {NOTE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={noteColorDraft === color ? "is-active" : ""}
                      onClick={() =>
                        setNoteColorDrafts((current) => ({
                          ...current,
                          [selectedVerse]: color,
                        }))
                      }
                      style={{ backgroundColor: color }}
                      aria-label={`Use ${color} for saved notes`}
                    />
                  ))}
                </div>
              </div>

              <div className="annotation-actions">
                <button type="button" className="is-active" onClick={saveMarginNote}>
                  Save note
                </button>
                <button type="button" onClick={clearMarginNote}>
                  Clear note
                </button>
              </div>
            </section>

            <MeaningExplorer target={meaningTargetMap[selectedMeaning]} />

            <section className="target-picker" aria-labelledby="target-picker-heading">
              <div>
                <p className="eyebrow">Curated focus targets</p>
                <h2 id="target-picker-heading">Switch focus card</h2>
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
          </aside>
        ) : null}
      </div>
    </main>
  );
}
