"use client";

import { useEffect, useState } from "react";
import {
  getLexiconEntry,
  resolveForm,
  type LexiconEntry,
  type ResolvedForm,
} from "@/lib/services/meaning-api";

interface MeaningPopoverProps {
  /** The Strong's number for the word being explored, e.g. "G5055". */
  strongs: string;
  /** The English word that was touched, e.g. "finished". */
  englishWord: string;
  /** The verse the word sits in, e.g. "JHN.19.30". */
  verseRef: string;
  /** The DOM element the popover is anchored to (used for positioning). */
  anchorEl: HTMLElement | null;
  /** Called when the user dismisses the popover. */
  onClose: () => void;
}

const USFM_TO_NAME: Record<string, string> = {
  GEN: "Genesis", EXO: "Exodus", LEV: "Leviticus", NUM: "Numbers", DEU: "Deuteronomy",
  JOS: "Joshua", JDG: "Judges", RUT: "Ruth", "1SA": "1 Samuel", "2SA": "2 Samuel",
  "1KI": "1 Kings", "2KI": "2 Kings", "1CH": "1 Chronicles", "2CH": "2 Chronicles",
  EZR: "Ezra", NEH: "Nehemiah", EST: "Esther", JOB: "Job", PSA: "Psalm", PRO: "Proverbs",
  ECC: "Ecclesiastes", SNG: "Song of Solomon", ISA: "Isaiah", JER: "Jeremiah",
  LAM: "Lamentations", EZK: "Ezekiel", DAN: "Daniel", HOS: "Hosea", JOL: "Joel",
  AMO: "Amos", OBA: "Obadiah", JON: "Jonah", MIC: "Micah", NAM: "Nahum",
  HAB: "Habakkuk", ZEP: "Zephaniah", HAG: "Haggai", ZEC: "Zechariah", MAL: "Malachi",
  MAT: "Matthew", MRK: "Mark", LUK: "Luke", JHN: "John", ACT: "Acts",
  ROM: "Romans", "1CO": "1 Corinthians", "2CO": "2 Corinthians", GAL: "Galatians",
  EPH: "Ephesians", PHP: "Philippians", COL: "Colossians",
  "1TH": "1 Thessalonians", "2TH": "2 Thessalonians", "1TI": "1 Timothy", "2TI": "2 Timothy",
  TIT: "Titus", PHM: "Philemon", HEB: "Hebrews", JAS: "James",
  "1PE": "1 Peter", "2PE": "2 Peter", "1JN": "1 John", "2JN": "2 John", "3JN": "3 John",
  JUD: "Jude", REV: "Revelation",
};

function formatRef(ref: string): string {
  // ref: "GEN.2.18" → "Genesis 2:18"
  const [book, ch, vs] = ref.split(".");
  const name = USFM_TO_NAME[book] ?? book;
  return `${name} ${ch}:${vs}`;
}

/** Compute popover position: above the anchor when there's room, else below. */
function computePosition(anchor: HTMLElement, popoverHeight: number) {
  const rect = anchor.getBoundingClientRect();
  const viewportW = window.innerWidth;
  const margin = 12;

  // Prefer above the anchor; flip below if not enough room.
  const wantedTop = rect.top - popoverHeight - margin;
  const placeBelow = wantedTop < 8;
  const top = placeBelow
    ? rect.bottom + margin + window.scrollY
    : wantedTop + window.scrollY;

  // Center horizontally on the anchor, clamp to viewport.
  const popoverWidth = 320;
  let left = rect.left + rect.width / 2 - popoverWidth / 2;
  left = Math.max(8, Math.min(left, viewportW - popoverWidth - 8));
  left += window.scrollX;

  return { top, left, placeBelow };
}

export function MeaningPopover({
  strongs,
  englishWord,
  verseRef,
  anchorEl,
  onClose,
}: MeaningPopoverProps) {
  const [entry, setEntry] = useState<LexiconEntry | null>(null);
  const [form, setForm] = useState<ResolvedForm | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  const isHebrew = strongs[0]?.toUpperCase() === "H";
  const scriptDir = isHebrew ? "rtl" : "ltr";

  // Load lexicon entry + the exact form used in THIS verse, in parallel.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setEntry(null);
    setForm(null);
    Promise.all([getLexiconEntry(strongs), resolveForm(strongs, verseRef)])
      .then(([e, f]) => {
        if (cancelled) return;
        setEntry(e);
        setForm(f);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [strongs, verseRef]);

  // Position the popover after the content is laid out.
  useEffect(() => {
    if (!anchorEl) return;
    // Defer one tick so we can measure our own rendered height.
    const timer = window.setTimeout(() => {
      const popover = document.querySelector<HTMLDivElement>("[data-meaning-popover]");
      const height = popover?.offsetHeight ?? 240;
      setPosition(computePosition(anchorEl, height));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [anchorEl, entry, form, loading]);

  // Escape closes the popover. Outside-click dismissal is owned by the
  // parent `ContinuousReadingExperience`, which also handles hover-close
  // and tap-on-popover-to-close \u2014 we keep this component listener-light.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!anchorEl) return null;

  // Other verses sharing this exact form (exclude the one we're reading).
  const otherForm = form ? form.refs.filter((r) => r !== verseRef) : [];

  return (
    <div
      data-meaning-popover
      className="meaning-popover"
      style={{
        position: "absolute",
        top: position?.top ?? -9999,
        left: position?.left ?? -9999,
        opacity: position ? 1 : 0,
      }}
      role="dialog"
      aria-label={`Meaning of ${englishWord}`}
    >
      <button
        type="button"
        className="meaning-popover__close"
        onClick={onClose}
        aria-label="Close"
      >
        ×
      </button>

      {loading && <div className="meaning-popover__loading">…</div>}

      {!loading && !entry && (
        <div className="meaning-popover__loading">
          No meaning data for &ldquo;{englishWord}&rdquo;.
        </div>
      )}

      {!loading && entry && (
        <>
          <header className="meaning-popover__header">
            <div
              className="meaning-popover__lemma"
              dir={scriptDir}
              style={{ direction: scriptDir }}
            >
              {entry.lemma}
            </div>
            <div className="meaning-popover__translit">
              {entry.translit}
              <span className="meaning-popover__strongs"> · {strongs}</span>
            </div>
          </header>

          <p className="meaning-popover__definition">{entry.definition}</p>

          {entry.kjvDef && (
            <p className="meaning-popover__range">
              <span className="meaning-popover__range-label">Rendered as </span>
              {entry.kjvDef}
            </p>
          )}

          {/* The form-specific section — the heart of the τετέλεσται idea. */}
          {form && (
            <div className="meaning-popover__form">
              <div className="meaning-popover__form-head">As written here</div>
              <div
                className="meaning-popover__form-word"
                dir={scriptDir}
                style={{ direction: scriptDir }}
              >
                {form.form}
                {form.translit && (
                  <span className="meaning-popover__form-translit">
                    {" "}· {form.translit}
                  </span>
                )}
              </div>
              {form.note && (
                <div className="meaning-popover__form-note">{form.note}</div>
              )}

              {otherForm.length > 0 ? (
                <div className="meaning-popover__form-occ">
                  <span className="meaning-popover__form-occ-label">
                    This exact form also appears in{" "}
                  </span>
                  {otherForm.map((ref, i) => (
                    <span key={ref}>
                      {i > 0 ? " · " : ""}
                      {formatRef(ref)}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="meaning-popover__form-occ meaning-popover__form-occ--solo">
                  This exact form appears only here.
                </div>
              )}
            </div>
          )}

          {typeof entry.count === "number" && entry.count > 1 && (
            <p className="meaning-popover__lemma-count">
              The word{" "}
              <span dir={scriptDir} style={{ direction: scriptDir }}>
                {entry.lemma}
              </span>{" "}
              appears in {entry.count} places across Scripture.
            </p>
          )}

          <footer className="meaning-popover__source">Source: Strong&rsquo;s</footer>
        </>
      )}
    </div>
  );
}
