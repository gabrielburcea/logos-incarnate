"use client";

import React, { useEffect, useLayoutEffect, useRef, useState, useMemo } from "react";
import Link from "next/link";
import { useContinuousBible } from "@/lib/hooks/use-continuous-bible";
import { bibleAPI, Book, Chapter } from "@/lib/services/bible-api";

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
  const chapterRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadingNextRef = useRef(false);
  const loadingPrevRef = useRef(false);
  const prevScrollHeightRef = useRef<number | null>(null);
  // While locked, the IntersectionObserver won't overwrite the explicitly-selected chapter.
  // This is what prevents the "jumps to chapter 2" bug after a manual selection.
  const scrollLockedRef = useRef(false);

  // -------- Infinite scroll (window is the scroller) --------
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const distFromBottom = docH - (scrollTop + viewportH);

      if (distFromBottom < viewportH * 1.0 && hasMoreNext && !loadingNextRef.current) {
        loadingNextRef.current = true;
        loadNextChapters(2).finally(() => {
          loadingNextRef.current = false;
        });
      }

      if (scrollTop < viewportH * 0.5 && hasMorePrevious && !loadingPrevRef.current) {
        loadingPrevRef.current = true;
        prevScrollHeightRef.current = document.documentElement.scrollHeight;
        loadPreviousChapters(2).finally(() => {
          loadingPrevRef.current = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMoreNext, hasMorePrevious, loadNextChapters, loadPreviousChapters]);

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

    // Lock the observer so it can't overwrite our explicit selection during the scroll animation.
    scrollLockedRef.current = true;
    const rect = target.getBoundingClientRect();
    const top = rect.top + window.scrollY - 70;
    window.scrollTo({ top, behavior: "auto" });
    clearPendingScroll();

    const timer = window.setTimeout(() => {
      scrollLockedRef.current = false;
    }, 600);
    return () => window.clearTimeout(timer);
  }, [pendingScrollTo, loadedChapters, clearPendingScroll]);

  // -------- Observe currently visible chapter (sync selector with scroll) --------
  useEffect(() => {
    if (loadedChapters.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (scrollLockedRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const el = visible.target as HTMLElement;
        const bookId = el.dataset.bookId;
        const chapterId = el.dataset.chapterId;
        if (bookId && chapterId) setVisibleChapter(bookId, chapterId);
      },
      {
        root: null,
        rootMargin: "-70px 0px -70% 0px",
        threshold: 0,
      }
    );

    chapterRefs.current.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [loadedChapters, setVisibleChapter]);

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

  const handlePickChapter = (bookId: string, chapterId: string) => {
    setPickerOpen(false);
    jumpToChapter(bookId, chapterId);
  };

  return (
    <main className="experience-shell experience-shell--reading">
      {/* FROZEN HEADER ROW */}
      <div className="frozen-header-bar">
        <Link className="header-back-link" href="/" title="Back to home">
          ←
        </Link>

        {/* Single picker trigger: "KJV · Exodus 8 ▾" */}
        <div className="header-bible-selector">
          <button
            type="button"
            className="bible-picker-trigger"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            aria-expanded={pickerOpen}
            disabled={books.length === 0}
          >
            <span className="picker-trigger-trans">{currentTranslationAbbr || "…"}</span>
            <span className="picker-trigger-sep">·</span>
            <span className="picker-trigger-ref">
              {currentBookName ? `${currentBookName} ${currentChapterNumber}` : "Loading…"}
            </span>
            <span className="picker-trigger-caret" aria-hidden="true">
              {pickerOpen ? "▴" : "▾"}
            </span>
          </button>
        </div>

        <nav className="header-mode-switcher" aria-label="Switch reading mode">
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
            <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
              Loading chapters...
            </div>
          )}

          {error && loadedChapters.length === 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#ff2d55" }}>
              Error loading content: {error}
            </div>
          )}

          {loading && hasMorePrevious && loadedChapters.length > 0 && (
            <div style={{ padding: "1rem", textAlign: "center", color: "#666" }}>
              Loading previous chapters...
            </div>
          )}

          {loadedChapters.map((chapter) => (
            <div
              key={chapter.id}
              ref={registerChapterRef(chapter.id)}
              data-book-id={chapter.bookId}
              data-chapter-id={chapter.id}
              className="continuous-chapter"
            >
              <div className="chapter-title-embedded">
                <h1 className="chapter-heading">
                  {chapter.bookName} {chapter.chapterNumber}
                </h1>
              </div>
              <div className="reading-mode-content">
                <div
                  className="chapter-html-content"
                  dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
              </div>
            </div>
          ))}

          {loading && hasMoreNext && loadedChapters.length > 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
              Loading more chapters...
            </div>
          )}

          {!hasMoreNext && loadedChapters.length > 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#999", fontStyle: "italic" }}>
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
