"use client";

import { useEffect, useState } from "react";
import {
  getLexiconEntry,
  getOccurrences,
  type LexiconEntry,
} from "@/lib/services/meaning-api";

interface MeaningPopoverProps {
  /** The Strong's number for the word being explored, e.g. "H5828". */
  strongs: string;
  /** The English word that was clicked, shown as the card heading. */
  englishWord: string;
  /** The DOM element the popover is anchored to (used for positioning). */
  anchorEl: HTMLElement | null;
  /** Called when the user dismisses the popover (× button or outside click). */
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
  const viewportH = window.innerHeight;
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
  anchorEl,
  onClose,
}: MeaningPopoverProps) {
  const [entry, setEntry] = useState<LexiconEntry | null>(null);
  const [occurrences, setOccurrences] = useState<string[] | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number; placeBelow: boolean } | null>(null);
  const [loading, setLoading] = useState(true);

  // Load lexicon entry + occurrences in parallel.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getLexiconEntry(strongs), getOccurrences(strongs)])
      .then(([e, occ]) => {
        if (cancelled) return;
        setEntry(e);
        setOccurrences(occ);
        setLoading(false);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [strongs]);

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
  }, [anchorEl, entry, loading]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest("[data-meaning-popover]")) return;
      if (target.closest(".meaning-anchor")) return; // clicking another ⓘ handled elsewhere
      onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  if (!anchorEl) return null;

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

      {loading && (
        <div className="meaning-popover__loading">Loading…</div>
      )}

      {!loading && !entry && (
        <div className="meaning-popover__loading">
          No meaning data found for &ldquo;{englishWord}&rdquo;.
        </div>
      )}

      {!loading && entry && (
        <>
          <header className="meaning-popover__header">
            <div className="meaning-popover__lemma" lang="he">
              {entry.lemma}
            </div>
            <div className="meaning-popover__translit">{entry.translit}</div>
          </header>

          <p className="meaning-popover__definition">{entry.definition}</p>

          {occurrences && occurrences.length > 0 && (
            <div className="meaning-popover__occurrences">
              <div className="meaning-popover__occurrences-label">
                Also appears in {occurrences.length}{" "}
                {occurrences.length === 1 ? "verse" : "verses"}
              </div>
              <ul className="meaning-popover__occurrences-list">
                {occurrences.slice(0, 12).map((ref) => (
                  <li key={ref}>{formatRef(ref)}</li>
                ))}
                {occurrences.length > 12 && (
                  <li className="meaning-popover__more">
                    +{occurrences.length - 12} more
                  </li>
                )}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}
