"use client";

import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import {
  genesis2Chapter,
  meaningTargetMap,
  type MeaningTargetId,
} from "@/lib/genesis2-fixtures";
import { MeaningExplorer } from "@/components/meaning-explorer";

type SurfaceMode = "reading" | "study";
type ToolMode = "pen" | "marker";

type ColoredPhraseRange = {
  start: number;
  end: number;
  color: string;
  tool?: ToolMode;
};

type VerseAnnotation = {
  underlinedWordIndexes?: number[];
  underlinedWordColors?: Record<number, string>;
  underlinedWordTools?: Record<number, ToolMode>;
  underlinedPhraseRanges?: ColoredPhraseRange[];
  note?: string;
  noteColor?: string;
};

type AnnotationState = Record<number, VerseAnnotation>;

const STORAGE_KEY = "logos-incarnate:genesis-2:annotations";
const DEFAULT_NOTE_COLOR = "#6f4e37";
const DEFAULT_UNDERLINE_COLOR = "#ff2d55";
const DEFAULT_TOOL_MODE: ToolMode = "pen";
const NOTE_COLORS = ["#6f4e37", "#7a3b2e", "#3f5f7f", "#4f6a47", "#5f3f74", "#ff2d55", "#00c2ff", "#ffd400"];
const UNDERLINE_COLORS = [
  "#ff2d55",
  "#ff7a00",
  "#ffd400",
  "#39ff14",
  "#00c2ff",
  "#2f6fed",
  "#b026ff",
  "#ff1493",
  "#111111",
  "#6f4e37",
];

function toSafeToolMode(raw: unknown): ToolMode {
  return raw === "marker" ? "marker" : "pen";
}

function toSafePhraseRange(raw: unknown): ColoredPhraseRange | null {
  if (!raw || typeof raw !== "object") {
    return null;
  }

  const start = "start" in raw ? raw.start : null;
  const end = "end" in raw ? raw.end : null;
  const color = "color" in raw && typeof raw.color === "string" ? raw.color : DEFAULT_UNDERLINE_COLOR;
  const tool = toSafeToolMode("tool" in raw ? raw.tool : null);

  if (
    typeof start !== "number" ||
    typeof end !== "number" ||
    !Number.isInteger(start) ||
    !Number.isInteger(end) ||
    start < 0 ||
    end < start
  ) {
    return null;
  }

  return { start, end, color, tool };
}

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

      const underlinedWordColors =
        value.underlinedWordColors && typeof value.underlinedWordColors === "object"
          ? Object.fromEntries(
              Object.entries(value.underlinedWordColors).filter(
                ([wordIndex, color]) => !Number.isNaN(Number(wordIndex)) && typeof color === "string",
              ),
            )
          : {};

      const underlinedWordTools =
        value.underlinedWordTools && typeof value.underlinedWordTools === "object"
          ? Object.fromEntries(
              Object.entries(value.underlinedWordTools).filter(
                ([wordIndex, tool]) => !Number.isNaN(Number(wordIndex)) && (tool === "pen" || tool === "marker"),
              ),
            )
          : {};

      const underlinedPhraseRanges = Array.isArray(value.underlinedPhraseRanges)
        ? value.underlinedPhraseRanges
            .map(toSafePhraseRange)
            .filter((range): range is ColoredPhraseRange => Boolean(range))
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
          underlinedWordColors,
          underlinedWordTools,
          underlinedPhraseRanges,
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

export function GenesisExperience({ surface }: { surface: SurfaceMode }) {
  const isStudy = surface === "study";
  const [selectedVerse, setSelectedVerse] = useState<number>(18);
  const [selectedMeaning, setSelectedMeaning] = useState<MeaningTargetId>("helper");
  const [annotations, setAnnotations] = useState<AnnotationState>({});
  const [hasLoadedAnnotations, setHasLoadedAnnotations] = useState(false);
  const [noteDrafts, setNoteDrafts] = useState<Record<number, string>>({});
  const [noteColorDrafts, setNoteColorDrafts] = useState<Record<number, string>>({});
  const [isPenMode, setIsPenMode] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>(DEFAULT_TOOL_MODE);
  const [underlineColor, setUnderlineColor] = useState<string>(DEFAULT_UNDERLINE_COLOR);
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

  function updateVerseAnnotation(verseNumber: number, next: VerseAnnotation) {
    setAnnotations((current) => ({
      ...current,
      [verseNumber]: {
        ...current[verseNumber],
        ...next,
      },
    }));
  }

  function toggleWordUnderline(verseNumber: number, wordIndex: number) {
    setAnnotations((current) => {
      const currentIndexes = current[verseNumber]?.underlinedWordIndexes ?? [];
      const currentColors = current[verseNumber]?.underlinedWordColors ?? {};
      const currentTools = current[verseNumber]?.underlinedWordTools ?? {};
      const exists = currentIndexes.includes(wordIndex);

      const nextIndexes = exists
        ? currentIndexes.filter((index) => index !== wordIndex)
        : [...currentIndexes, wordIndex].sort((left, right) => left - right);

      const nextColors = { ...currentColors };
      const nextTools = { ...currentTools };

      if (exists) {
        delete nextColors[wordIndex];
        delete nextTools[wordIndex];
      } else {
        nextColors[wordIndex] = underlineColor;
        nextTools[wordIndex] = toolMode;
      }

      return {
        ...current,
        [verseNumber]: {
          ...current[verseNumber],
          underlinedWordIndexes: nextIndexes,
          underlinedWordColors: nextColors,
          underlinedWordTools: nextTools,
        },
      };
    });
  }

  function selectVerse(verseNumber: number) {
    setSelectedVerse(verseNumber);
    const verse = genesis2Chapter.verses.find((item) => item.number === verseNumber);
    if (verse?.focusTargetIds?.length && !verse.focusTargetIds.includes(selectedMeaning)) {
      setSelectedMeaning(verse.focusTargetIds[0]);
    }
  }

  function handleWordInteraction(verseNumber: number, wordIndex: number) {
    selectVerse(verseNumber);

    if (!isPenMode) {
      return;
    }

    toggleWordUnderline(verseNumber, wordIndex);
  }

  function saveMarginNote() {
    updateVerseAnnotation(selectedVerse, {
      note: noteDraft.trim(),
      noteColor: noteColorDraft,
    });
  }

  function clearMarginNote() {
    setNoteDrafts((current) => ({
      ...current,
      [selectedVerse]: "",
    }));
    updateVerseAnnotation(selectedVerse, {
      note: "",
      noteColor: noteColorDraft,
    });
  }

  function getUnderlineColor(annotation: VerseAnnotation, index: number) {
    const wordColor = annotation.underlinedWordColors?.[index];
    if (wordColor) {
      return wordColor;
    }

    const phraseRange = annotation.underlinedPhraseRanges?.find(
      (range) => index >= range.start && index <= range.end,
    );

    return phraseRange?.color ?? DEFAULT_UNDERLINE_COLOR;
  }

  function getWordTool(annotation: VerseAnnotation, index: number): ToolMode {
    const wordTool = annotation.underlinedWordTools?.[index];
    if (wordTool) {
      return wordTool;
    }

    const phraseRange = annotation.underlinedPhraseRanges?.find(
      (range) => index >= range.start && index <= range.end,
    );

    return phraseRange?.tool ?? DEFAULT_TOOL_MODE;
  }

  function renderVerseText(verseNumber: number, verseText: string, annotation: VerseAnnotation, isSelected: boolean) {
    const words = verseText.split(" ");
    const underlined = new Set(annotation.underlinedWordIndexes ?? []);
    const phraseRanges = annotation.underlinedPhraseRanges ?? [];
    const canUnderlineWords = isStudy;

    return (
      <span className="verse-text">
        {words.map((word, index) => {
          const isUnderlined =
            underlined.has(index) || phraseRanges.some((range) => index >= range.start && index <= range.end);
          const trailingSpace = index < words.length - 1 ? " " : "";
          const underlineColorValue = getUnderlineColor(annotation, index);
          const appliedTool = getWordTool(annotation, index);

          const wordClassName = [
            "verse-word",
            isUnderlined && appliedTool === "pen" ? "is-underlined" : "",
            isUnderlined && appliedTool === "marker" ? "is-marker-underlined" : "",
          ]
            .filter(Boolean)
            .join(" ");

          if (!canUnderlineWords) {
            return (
              <Fragment key={`${verseNumber}-word-${index}`}>
                <span
                  className={wordClassName}
                  style={isUnderlined ? { ["--underline-color" as string]: underlineColorValue } : undefined}
                >
                  {word}
                </span>
                {trailingSpace}
              </Fragment>
            );
          }

          return (
            <Fragment key={`${verseNumber}-word-${index}`}>
              <button
                type="button"
                className={[wordClassName, "is-word-button", isPenMode ? "is-pen-active" : ""]
                  .filter(Boolean)
                  .join(" ")}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleWordInteraction(verseNumber, index);
                }}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                }}
                aria-pressed={isUnderlined}
                style={isUnderlined ? { ["--underline-color" as string]: underlineColorValue } : undefined}
              >
                {word}
              </button>
              {trailingSpace}
            </Fragment>
          );
        })}
      </span>
    );
  }

  return (
    <main className={`experience-shell ${isStudy ? "experience-shell--study" : "experience-shell--reading"}`}>
      <header className="experience-header">
        <div>
          <Link className="back-link" href="/">
            ← Back home
          </Link>
          <h1>{genesis2Chapter.title}</h1>
        </div>
      </header>

      <nav className={`mode-links ${isStudy ? "is-study" : ""}`} aria-label="Switch Genesis 2 surface">
        <div className="segmented-control">
          <Link href="/genesis-2/reading" className={!isStudy ? "is-active" : ""}>
            Reading mode
          </Link>
          <Link href="/genesis-2/study" className={isStudy ? "is-active" : ""}>
            Study manuscript mode
          </Link>
        </div>
      </nav>

      <div className={`experience-layout ${isStudy ? "study-layout" : "reading-layout is-reading-only"}`}>
        <section className="reading-column" aria-label="Chapter text">
          <div className={`verse-list ${surface}`}>
            {genesis2Chapter.verses.map((verse) => {
              const annotation = annotations[verse.number] ?? {};
              const isSelected = selectedVerse === verse.number;

              return (
                <article
                  key={verse.number}
                  className={[
                    "verse-card",
                    isSelected ? "is-selected" : "",
                    annotation.underlinedWordIndexes?.length || annotation.underlinedPhraseRanges?.length
                      ? "has-underlines"
                      : "",
                    annotation.note ? "has-note" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {isStudy ? (
                    <div className="verse-button">
                      <button
                        type="button"
                        className="verse-select"
                        onClick={() => selectVerse(verse.number)}
                        aria-pressed={isSelected}
                      >
                        <span className="verse-number">{verse.number}</span>
                        {renderVerseText(verse.number, verse.text, annotation, isSelected)}
                      </button>
                    </div>
                  ) : (
                    <div className="verse-static">
                      <span className="verse-number">{verse.number}</span>
                      {renderVerseText(verse.number, verse.text, annotation, false)}
                    </div>
                  )}

                  {isStudy ? (
                    <div className="verse-notes-panel">
                      {annotation.note ? (
                        <aside
                          className="margin-note"
                          aria-label={`Note for verse ${verse.number}`}
                          style={{ color: annotation.noteColor ?? DEFAULT_NOTE_COLOR }}
                        >
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
                                selectVerse(verse.number);
                                setSelectedMeaning(targetId);
                              }}
                            >
                              {meaningTargetMap[targetId].label}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>

        {isStudy ? (
          <aside className="inspector-column">
            <section className="annotation-panel">
              <div className="annotation-toolbar">
                <button
                  type="button"
                  className={isPenMode && toolMode === "pen" ? "pen-tool is-active" : "pen-tool"}
                  onClick={() => {
                    setToolMode("pen");
                    setIsPenMode(true);
                  }}
                  aria-pressed={isPenMode && toolMode === "pen"}
                >
                  ✒️ Stilo
                </button>
                <button
                  type="button"
                  className={isPenMode && toolMode === "marker" ? "pen-tool is-active" : "pen-tool"}
                  onClick={() => {
                    setToolMode("marker");
                    setIsPenMode(true);
                  }}
                  aria-pressed={isPenMode && toolMode === "marker"}
                >
                  🖍️ Marker
                </button>
              </div>

              <div className="color-picker" role="group" aria-label="Choose annotation color">
                <span>Color</span>
                <div className="color-picker__swatches color-picker__swatches--bright">
                  {UNDERLINE_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className={underlineColor === color ? "is-active" : ""}
                      onClick={() => setUnderlineColor(color)}
                      style={{ backgroundColor: color }}
                      aria-label={`Use ${color}`}
                    />
                  ))}
                </div>
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
                <div className="color-picker__swatches color-picker__swatches--bright">
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
                <button type="button" onClick={() => setIsPenMode((current) => !current)}>
                  {isPenMode ? "Tool off" : "Tool on"}
                </button>
                <button type="button" onClick={clearMarginNote}>
                  Clear note
                </button>
              </div>
            </section>

            <MeaningExplorer target={meaningTargetMap[selectedMeaning]} />
          </aside>
        ) : null}
      </div>
    </main>
  );
}
