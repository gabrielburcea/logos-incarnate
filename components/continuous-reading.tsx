"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useContinuousBible } from "@/lib/hooks/use-continuous-bible";
import { bibleAPI, Book, Chapter } from "@/lib/services/bible-api";
import {
  getAlignment,
  getHebrewLexicon,
  getGreekLexicon,
  type VerseAlignment,
} from "@/lib/services/meaning-api";
import { wrapMeaningWords } from "@/lib/services/wrap-meaning-words";
import { MeaningPopover } from "@/components/meaning-popover";

export function ContinuousReadingExperience() {
  const {
    bibles,
    selectedBibleId,
    books,
    selectedBookId,
    chapters,
    selectedChapterId,
    loadedChapters,
    loading,
    error,
    hasMoreNext,
    hasMorePrevious,
    pendingScrollTo,
    selectBible,
    selectChapter,
    jumpToChapter,
    loadNextChapters,
    loadPreviousChapters,
    setVisibleChapter,
    clearPendingScroll,
  } = useContinuousBible();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [transDropdownOpen, setTransDropdownOpen] = useState(false);
  const [theme, setTheme] = useState<"light" | "dark">("light");
  // The chapter currently in view (drives the sticky banner). Initialized from the
  // selected chapter but only updated by the IntersectionObserver as the user scrolls.
  const [visibleChapterId, setVisibleChapterId] = useState<string>("");

  const chapterRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const transDropdownRef = useRef<HTMLDivElement>(null);
  const loadingNextRef = useRef(false);
  const loadingPrevRef = useRef(false);
  const prevScrollHeightRef = useRef<number | null>(null);
  // Tracks the most-recently-reported visible chapter id, used to avoid spamming
  // setState on every scroll frame.
  const lastVisibleRef = useRef<string>("");
  // While locked, scroll-driven chapter detection won't overwrite the explicitly-selected chapter.
  // This is what prevents the "jumps to chapter 2" bug after a manual selection.
  const scrollLockedRef = useRef(false);

  // -------- Theme persistence --------
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("read-theme")) as
      | "light"
      | "dark"
      | null;
    if (saved === "light" || saved === "dark") setTheme(saved);
  }, []);
  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("read-theme", theme);
  }, [theme]);

  // -------- Close translation dropdown on outside click --------
  useEffect(() => {
    if (!transDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (transDropdownRef.current && !transDropdownRef.current.contains(e.target as Node)) {
        setTransDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [transDropdownOpen]);

  // -------- Scroll handler: infinite scroll + current-chapter detection --------
  // We do BOTH in the same listener so we don't fight an IntersectionObserver.
  // The "current chapter" is the last chapter whose top edge has scrolled past
  // the header offset; this is rock-solid across viewport sizes / chapter lengths.
  useEffect(() => {
    const HEADER_OFFSET = 64; // sticky header only (banner removed)

    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const distFromBottom = docH - (scrollTop + viewportH);

      // Infinite scroll — forward
      if (distFromBottom < viewportH * 1.0 && hasMoreNext && !loadingNextRef.current) {
        loadingNextRef.current = true;
        loadNextChapters(2).finally(() => {
          loadingNextRef.current = false;
        });
      }

      // Infinite scroll — backward
      if (scrollTop < viewportH * 0.5 && hasMorePrevious && !loadingPrevRef.current) {
        loadingPrevRef.current = true;
        prevScrollHeightRef.current = document.documentElement.scrollHeight;
        loadPreviousChapters(2).finally(() => {
          loadingPrevRef.current = false;
        });
      }

      // Current chapter detection (skipped while a programmatic scroll is settling)
      if (!scrollLockedRef.current && chapterRefs.current.size > 0) {
        let currentId = "";
        let currentBookId = "";
        // Map preserves insertion order = DOM order of loadedChapters.
        for (const [id, el] of chapterRefs.current) {
          const top = el.getBoundingClientRect().top;
          if (top <= HEADER_OFFSET) {
            currentId = id;
            currentBookId = el.dataset.bookId || "";
          } else {
            // Subsequent chapters are below; stop scanning.
            break;
          }
        }
        // If nothing is above the offset yet (very top of doc), use the first chapter.
        if (!currentId) {
          const firstEntry = chapterRefs.current.entries().next().value as
            | [string, HTMLDivElement]
            | undefined;
          if (firstEntry) {
            currentId = firstEntry[0];
            currentBookId = firstEntry[1].dataset.bookId || "";
          }
        }
        if (currentId && currentId !== lastVisibleRef.current) {
          lastVisibleRef.current = currentId;
          setVisibleChapter(currentBookId, currentId);
          setVisibleChapterId(currentId);
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMoreNext, hasMorePrevious, loadNextChapters, loadPreviousChapters, setVisibleChapter]);

  // -------- Preserve scroll position when prepending previous chapters --------
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current == null) return;
    const delta = document.documentElement.scrollHeight - prevScrollHeightRef.current;
    if (delta > 0) window.scrollBy(0, delta);
    prevScrollHeightRef.current = null;
  }, [loadedChapters]);

  // -------- Scroll to the requested chapter after a manual jump --------
  useLayoutEffect(() => {
    if (!pendingScrollTo) return;
    const target = chapterRefs.current.get(pendingScrollTo);
    if (!target) return;

    // Lock the scroll-detection so it can't overwrite our explicit selection during the scroll animation.
    scrollLockedRef.current = true;
    lastVisibleRef.current = pendingScrollTo;
    setVisibleChapterId(pendingScrollTo);
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - 70;
    window.scrollTo({ top, behavior: "auto" });
    clearPendingScroll();

    const timer = window.setTimeout(() => {
      scrollLockedRef.current = false;
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pendingScrollTo, loadedChapters, clearPendingScroll]);

  // Seed the visible-chapter id after a manual jump so the banner shows immediately.
  useEffect(() => {
    if (selectedChapterId && !visibleChapterId) setVisibleChapterId(selectedChapterId);
  }, [selectedChapterId, visibleChapterId]);

  // -------- Meaning data: lexicons + alignment --------
  // Loaded once per session. The alignment file (~9 MB) is fetched on first
  // chapter render, then stays in cache for the life of the page.
  const [alignment, setAlignment] = useState<Record<string, VerseAlignment> | null>(null);
  useEffect(() => {
    let cancelled = false;
    Promise.all([getAlignment("KJV"), getHebrewLexicon(), getGreekLexicon()])
      .then(([align]) => {
        if (cancelled) return;
        setAlignment(align);
      })
      .catch((err) => {
        // Non-fatal: ⓘ icons just won't appear if meaning data fails to load.
        console.warn("Meaning data failed to load:", err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Wrap meaning-tagged words after each chapter renders.
  //
  // We DO NOT cache by chapter id — React occasionally re-applies
  // dangerouslySetInnerHTML and wipes our wraps. Instead, the DOM itself
  // is the cache: if `.meaning-anchor` already exists in the chapter HTML,
  // skip; otherwise wrap. This auto-heals across re-renders.
  useEffect(() => {
    if (!alignment) return;
    for (const chapter of loadedChapters) {
      const el = chapterRefs.current.get(chapter.id);
      if (!el) continue;
      const htmlEl = el.querySelector<HTMLDivElement>(".chapter-html-content");
      if (!htmlEl) continue;
      // DOM-presence check (self-healing cache).
      if (htmlEl.querySelector(".meaning-anchor")) continue;
      try {
        wrapMeaningWords({
          container: htmlEl,
          bookId: chapter.bookId,
          chapterNumber: chapter.chapterNumber,
          alignment,
        });
      } catch (err) {
        console.warn("Failed to wrap meaning words for", chapter.id, err);
      }
    }
  }, [loadedChapters, alignment, selectedBibleId]);

  // -------- Meaning popover state --------
  const [popover, setPopover] = useState<{
    strongs: string;
    word: string;
    anchor: HTMLElement;
  } | null>(null);

  // Mirror state into a ref so the (stable) document listeners can read the
  // current popover without re-binding on every state change.
  const popoverRef = useRef(popover);
  useEffect(() => {
    popoverRef.current = popover;
  }, [popover]);

  // Combined hover + tap handler model:
  //
  //   Desktop / mouse:
  //     - cursor over a tagged word for 250 ms        → open
  //     - cursor leaves word AND popover for 350 ms   → close
  //     - cursor moves between word and popover       → stays open
  //     - cursor moves to a different tagged word     → instant switch
  //
  //   Touch / Apple Pencil / explicit click:
  //     - tap a word                                  → instant open
  //     - tap the popover surface                     → close
  //     - tap outside both                            → close
  //     - tap the same word again                     → close (toggle)
  //
  //   Keyboard:
  //     - Escape                                      → close (handled in popover)
  useEffect(() => {
    const HOVER_OPEN_MS = 250;
    const HOVER_CLOSE_MS = 350;
    let openTimer: ReturnType<typeof setTimeout> | null = null;
    let closeTimer: ReturnType<typeof setTimeout> | null = null;

    const cancelOpen = () => {
      if (openTimer) {
        clearTimeout(openTimer);
        openTimer = null;
      }
    };
    const cancelClose = () => {
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }
    };

    const onPointerOver = (e: PointerEvent) => {
      // Touch is handled by the click listener (taps fire click, not hover).
      if (e.pointerType === "touch") return;
      const target = e.target as HTMLElement;
      const anchor = target.closest<HTMLElement>(".meaning-anchor");
      const inPopover = target.closest("[data-meaning-popover]");

      if (anchor) {
        cancelClose();
        // Already showing for this word? Just keep it.
        if (popoverRef.current?.anchor === anchor) {
          cancelOpen();
          return;
        }
        cancelOpen();
        openTimer = setTimeout(() => {
          openTimer = null;
          const strongs = anchor.dataset.strongs;
          const word = anchor.dataset.word;
          if (strongs && word) setPopover({ strongs, word, anchor });
        }, HOVER_OPEN_MS);
        return;
      }

      // Cursor entered the popover — keep it open.
      if (inPopover) {
        cancelClose();
        return;
      }
    };

    const onPointerOut = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      const target = e.target as HTMLElement;
      const related = e.relatedTarget as HTMLElement | null;
      const leftAnchor = target.closest(".meaning-anchor");
      const leftPopover = target.closest("[data-meaning-popover]");
      if (!leftAnchor && !leftPopover) return;

      // If we moved INTO another anchor or the popover, don't close.
      const movedTo = related?.closest(
        ".meaning-anchor, [data-meaning-popover]",
      );
      if (movedTo) return;

      cancelOpen();
      if (closeTimer) return;
      closeTimer = setTimeout(() => {
        closeTimer = null;
        setPopover(null);
      }, HOVER_CLOSE_MS);
    };

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const inPopover = target.closest("[data-meaning-popover]");

      // Tap anywhere on the popover surface (including its × button) → close.
      if (inPopover) {
        cancelOpen();
        cancelClose();
        setPopover(null);
        return;
      }

      const anchor = target.closest<HTMLElement>(".meaning-anchor");
      if (anchor) {
        e.preventDefault();
        e.stopPropagation();
        cancelOpen();
        cancelClose();
        const strongs = anchor.dataset.strongs;
        const word = anchor.dataset.word;
        if (!strongs || !word) return;
        // Toggle behaviour: tap the same word twice → close.
        setPopover((cur) =>
          cur && cur.anchor === anchor ? null : { strongs, word, anchor },
        );
        return;
      }

      // Tap outside both the popover and any anchor → close.
      if (popoverRef.current) {
        cancelOpen();
        cancelClose();
        setPopover(null);
      }
    };

    document.addEventListener("pointerover", onPointerOver);
    document.addEventListener("pointerout", onPointerOut);
    document.addEventListener("click", onClick);
    return () => {
      cancelOpen();
      cancelClose();
      document.removeEventListener("pointerover", onPointerOver);
      document.removeEventListener("pointerout", onPointerOut);
      document.removeEventListener("click", onClick);
    };
  }, []);

  const registerChapterRef = (id: string) => (el: HTMLDivElement | null) => {
    if (el) chapterRefs.current.set(id, el);
    else chapterRefs.current.delete(id);
  };

  const currentBook = books.find((b) => b.id === selectedBookId);
  const currentBookName = currentBook
    ? currentBook.name.endsWith(".")
      ? currentBook.nameLong
      : currentBook.name
    : "";
  const currentChapterNumber =
    chapters.find((c) => c.id === selectedChapterId)?.number || "";
  const currentTranslationAbbr =
    bibles.find((b) => b.id === selectedBibleId)?.abbreviation || "";

  // The chapter currently in view (drives both the sticky banner AND the header
  // reference button) — derived from loadedChapters so it stays in sync as the
  // user scrolls across book boundaries (no dependency on the `chapters` list).
  const inViewChapter =
    loadedChapters.find((c) => c.id === visibleChapterId) ||
    loadedChapters.find((c) => c.id === selectedChapterId) ||
    loadedChapters[0];
  const inViewBookName = inViewChapter?.bookName || "";
  const inViewChapterNumber = inViewChapter?.chapterNumber || "";
  const bannerLabel = inViewChapter
    ? `${inViewBookName} ${inViewChapterNumber}`
    : "";

  // Fall back to selected* when nothing is loaded yet (initial state).
  const headerBookName = inViewBookName || currentBookName;
  const headerChapterNumber =
    inViewChapterNumber ||
    chapters.find((c) => c.id === selectedChapterId)?.number ||
    "";

  const handlePickChapter = (bookId: string, chapterId: string) => {
    setPickerOpen(false);
    jumpToChapter(bookId, chapterId);
  };

  const handlePickTranslation = (id: string) => {
    setTransDropdownOpen(false);
    selectBible(id);
  };

  const toggleTheme = () => setTheme((t) => (t === "light" ? "dark" : "light"));

  return (
    <main className={`experience-shell experience-shell--reading theme-${theme}`}>
      {/* FROZEN HEADER ROW */}
      <div className="frozen-header-bar">
        <Link className="header-back-link" href="/" title="Back to home">
          ←
        </Link>

        <div className="header-bible-selector">
          {/* Translation dropdown */}
          <div className="trans-dropdown-wrap" ref={transDropdownRef}>
            <button
              type="button"
              className="trans-dropdown-trigger"
              onClick={() => setTransDropdownOpen((v) => !v)}
              aria-haspopup="listbox"
              aria-expanded={transDropdownOpen}
              disabled={bibles.length === 0}
              title="Change translation"
            >
              <span>{currentTranslationAbbr || "…"}</span>
              <span className="picker-trigger-caret" aria-hidden="true">
                {transDropdownOpen ? "▴" : "▾"}
              </span>
            </button>
            {transDropdownOpen && (
              <div className="trans-dropdown-menu" role="listbox">
                {bibles.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    role="option"
                    aria-selected={selectedBibleId === b.id}
                    className={`trans-dropdown-item ${selectedBibleId === b.id ? "is-active" : ""}`}
                    onClick={() => handlePickTranslation(b.id)}
                  >
                    <span className="trans-dropdown-abbr">{b.abbreviation}</span>
                    <span className="trans-dropdown-name">{b.name}</span>
                  </button>
                ))}
                {bibles.length === 0 && (
                  <div className="trans-dropdown-item">Loading…</div>
                )}
              </div>
            )}
          </div>

          <span className="picker-trigger-sep">·</span>

          {/* Reference button (opens the full picker) */}
          <button
            type="button"
            className="bible-picker-trigger ref-only"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            disabled={books.length === 0}
          >
            <span className="picker-trigger-ref">
              {headerBookName ? `${headerBookName} ${headerChapterNumber}` : "Loading…"}
            </span>
            <span className="picker-trigger-caret" aria-hidden="true">
              {pickerOpen ? "▴" : "▾"}
            </span>
          </button>
        </div>

        <nav className="header-mode-switcher" aria-label="Switch reading mode">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title={theme === "light" ? "Switch to dark theme" : "Switch to light theme"}
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path
                  d="M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a.5.5 0 0 0-.7-.6A6.5 6.5 0 1 0 14.1 10.2a.5.5 0 0 0-.6-.7z"
                  fill="currentColor"
                />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" fill="currentColor" />
                <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
                  <line x1="8" y1="1.5" x2="8" y2="3" />
                  <line x1="8" y1="13" x2="8" y2="14.5" />
                  <line x1="1.5" y1="8" x2="3" y2="8" />
                  <line x1="13" y1="8" x2="14.5" y2="8" />
                  <line x1="3.3" y1="3.3" x2="4.4" y2="4.4" />
                  <line x1="11.6" y1="11.6" x2="12.7" y2="12.7" />
                  <line x1="3.3" y1="12.7" x2="4.4" y2="11.6" />
                  <line x1="11.6" y1="4.4" x2="12.7" y2="3.3" />
                </g>
              </svg>
            )}
          </button>
          <Link href="/read" className="mode-btn active" title="Reading Mode">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3h10M3 8h10M3 13h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </Link>
          <Link href="/study" className="mode-btn" title="Study Manuscript Mode">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11 2L5 14M9 2L6 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" />
            </svg>
          </Link>
        </nav>
      </div>

      {/* SCROLLABLE CONTENT (window is the scroller) */}
      <div className="scrollable-content-area">
        <section className="reading-column" aria-label="Bible text">
          {loadedChapters.length === 0 && loading && (
            <div className="reading-status">Loading chapters…</div>
          )}

          {error && loadedChapters.length === 0 && (
            <div className="reading-status reading-status--error">
              Error loading content: {error}
            </div>
          )}

          {loading && hasMorePrevious && loadedChapters.length > 0 && (
            <div className="reading-status">Loading previous chapters…</div>
          )}

          {loadedChapters.map((chapter) => (
            <div
              key={chapter.id}
              ref={registerChapterRef(chapter.id)}
              data-book-id={chapter.bookId}
              data-chapter-id={chapter.id}
              className="continuous-chapter"
            >
              {/* Always-in-DOM heading for screen readers. Visible drop-cap
                  chapter number below provides the in-prose boundary. */}
              <h2 className="chapter-anchor-label">
                {chapter.bookName} {chapter.chapterNumber}
              </h2>
              <div className="reading-mode-content">
                <span className="chapter-dropcap" aria-hidden="true">
                  {chapter.chapterNumber}
                </span>
                <div
                  className="chapter-html-content"
                  dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
              </div>
            </div>
          ))}

          {loading && hasMoreNext && loadedChapters.length > 0 && (
            <div className="reading-status">Loading more chapters…</div>
          )}

          {!hasMoreNext && loadedChapters.length > 0 && (
            <div className="reading-status reading-status--end">
              You&apos;ve reached the end of the Bible
            </div>
          )}
        </section>
      </div>

      {pickerOpen && (
        <BiblePicker
          bibles={bibles}
          selectedBibleId={selectedBibleId}
          onSelectBible={selectBible}
          books={books}
          selectedBookId={selectedBookId}
          selectedChapterId={selectedChapterId}
          onClose={() => setPickerOpen(false)}
          onPickChapter={handlePickChapter}
        />
      )}

      {popover && (
        <MeaningPopover
          strongs={popover.strongs}
          englishWord={popover.word}
          anchorEl={popover.anchor}
          onClose={() => setPopover(null)}
        />
      )}
    </main>
  );
}

// ------------------------------------------------------------------
// BiblePicker — full-screen overlay with translation, OT/NT tabs,
// book list, and chapter grid per expanded book.
// ------------------------------------------------------------------
interface BiblePickerProps {
  bibles: { id: string; name: string; abbreviation: string }[];
  selectedBibleId: string;
  onSelectBible: (id: string) => void;
  books: Book[];
  selectedBookId: string;
  selectedChapterId: string;
  onClose: () => void;
  onPickChapter: (bookId: string, chapterId: string) => void;
}

function BiblePicker({
  bibles,
  selectedBibleId,
  onSelectBible,
  books,
  selectedBookId,
  selectedChapterId,
  onClose,
  onPickChapter,
}: BiblePickerProps) {
  const [testament, setTestament] = useState<"OT" | "NT">("OT");
  const [expandedBookId, setExpandedBookId] = useState<string>(selectedBookId);
  const [chaptersByBook, setChaptersByBook] = useState<Record<string, Chapter[]>>({});
  const [loadingBookId, setLoadingBookId] = useState<string | null>(null);

  // Split books into OT (Genesis..Malachi) / NT (Matthew..Revelation). API returns canonical order.
  const { otBooks, ntBooks } = useMemo(() => {
    const ntStart = books.findIndex((b) => b.id === "MAT");
    if (ntStart < 0) return { otBooks: books, ntBooks: [] as Book[] };
    return { otBooks: books.slice(0, ntStart), ntBooks: books.slice(ntStart) };
  }, [books]);

  // Default to the testament containing the current book.
  useEffect(() => {
    const inNT = ntBooks.some((b) => b.id === selectedBookId);
    setTestament(inNT ? "NT" : "OT");
    setExpandedBookId(selectedBookId);
  }, [selectedBookId, ntBooks]);

  // Lazy-load chapters when a book is expanded.
  useEffect(() => {
    if (!expandedBookId || !selectedBibleId) return;
    if (chaptersByBook[expandedBookId]) return;
    let cancelled = false;
    setLoadingBookId(expandedBookId);
    bibleAPI
      .getChapters(selectedBibleId, expandedBookId)
      .then((data) => {
        if (cancelled) return;
        const filtered = data.filter((c) => c.number !== "intro");
        setChaptersByBook((prev) => ({ ...prev, [expandedBookId]: filtered }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingBookId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [expandedBookId, selectedBibleId, chaptersByBook]);

  // Reset cached chapter lists when the translation changes.
  useEffect(() => {
    setChaptersByBook({});
  }, [selectedBibleId]);

  // Close on Escape.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const visibleBooks = testament === "OT" ? otBooks : ntBooks;
  const displayName = (b: Book) => (b.name.endsWith(".") ? b.nameLong : b.name);

  return (
    <div className="bible-picker-overlay" role="dialog" aria-modal="true" aria-label="Bible navigator">
      <div className="bible-picker-panel">
        {/* Header: current reference + close */}
        <div className="bible-picker-header">
          <button
            type="button"
            className="bible-picker-current"
            onClick={onClose}
            aria-label="Close navigator"
          >
            <span>
              {books.find((b) => b.id === selectedBookId)
                ? displayName(books.find((b) => b.id === selectedBookId)!)
                : ""}{" "}
              {chaptersByBook[selectedBookId]?.find((c) => c.id === selectedChapterId)?.number ||
                ""}
            </span>
            <span className="picker-trigger-caret" aria-hidden="true">▴</span>
          </button>
        </div>

        {/* Translation pills */}
        {bibles.length > 1 && (
          <div className="bible-picker-translations">
            {bibles.map((b) => (
              <button
                key={b.id}
                type="button"
                className={`trans-pill ${selectedBibleId === b.id ? "is-active" : ""}`}
                onClick={() => onSelectBible(b.id)}
              >
                {b.abbreviation}
              </button>
            ))}
          </div>
        )}

        {/* OT / NT tabs */}
        <div className="bible-picker-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={testament === "OT"}
            className={`picker-tab ${testament === "OT" ? "is-active" : ""}`}
            onClick={() => setTestament("OT")}
          >
            Old Testament
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={testament === "NT"}
            className={`picker-tab ${testament === "NT" ? "is-active" : ""}`}
            onClick={() => setTestament("NT")}
          >
            New Testament
          </button>
        </div>

        {/* Book list with inline chapter grid for the expanded book */}
        <div className="bible-picker-books">
          {visibleBooks.map((book) => {
            const isExpanded = book.id === expandedBookId;
            const chapList = chaptersByBook[book.id];
            return (
              <div key={book.id} className={`picker-book ${isExpanded ? "is-expanded" : ""}`}>
                <button
                  type="button"
                  className="picker-book-name"
                  onClick={() => setExpandedBookId(isExpanded ? "" : book.id)}
                  aria-expanded={isExpanded}
                >
                  {displayName(book)}
                </button>
                {isExpanded && (
                  <div className="picker-chapter-grid">
                    {loadingBookId === book.id && !chapList ? (
                      <span className="picker-loading">Loading…</span>
                    ) : (
                      (chapList || []).map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          className={`picker-chapter-num ${
                            ch.id === selectedChapterId ? "is-active" : ""
                          }`}
                          onClick={() => onPickChapter(book.id, ch.id)}
                        >
                          {ch.number}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Click-outside backdrop */}
      <button
        type="button"
        className="bible-picker-backdrop"
        aria-label="Close navigator"
        onClick={onClose}
      />
    </div>
  );
}
