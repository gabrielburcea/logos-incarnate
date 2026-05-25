"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { useContinuousBible } from "@/lib/hooks/use-continuous-bible";

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
    selectBook,
    selectChapter,
    loadNextChapters,
    loadPreviousChapters,
    setVisibleChapter,
    clearPendingScroll,
  } = useContinuousBible();

  const [showTranslationDropdown, setShowTranslationDropdown] = React.useState(false);
  const [showBookDropdown, setShowBookDropdown] = React.useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = React.useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const chapterRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const loadingNextRef = useRef(false);
  const loadingPrevRef = useRef(false);
  const prevScrollHeightRef = useRef<number | null>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTranslationDropdown(false);
        setShowBookDropdown(false);
        setShowChapterDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Infinite scroll — load next when near the bottom, previous when near the top.
  // The actual scroller in this layout is the window (`.experience-shell` uses `min-height: 100vh`).
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
        // Save the document height so we can preserve scroll position after prepending.
        prevScrollHeightRef.current = document.documentElement.scrollHeight;
        loadPreviousChapters(2).finally(() => {
          loadingPrevRef.current = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Trigger once on mount in case the initial content is shorter than the viewport.
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasMoreNext, hasMorePrevious, loadNextChapters, loadPreviousChapters]);

  // Preserve scroll position after prepending chapters at the top
  useLayoutEffect(() => {
    if (prevScrollHeightRef.current == null) return;
    const delta = document.documentElement.scrollHeight - prevScrollHeightRef.current;
    if (delta > 0) window.scrollBy(0, delta);
    prevScrollHeightRef.current = null;
  }, [loadedChapters]);

  // Scroll to the requested chapter after a manual jump
  useLayoutEffect(() => {
    if (!pendingScrollTo) return;
    const target = chapterRefs.current.get(pendingScrollTo);
    if (target) {
      // Manual offset so the chapter heading clears the sticky header.
      const rect = target.getBoundingClientRect();
      const top = rect.top + window.scrollY - 70;
      window.scrollTo({ top, behavior: "auto" });
      clearPendingScroll();
    }
  }, [pendingScrollTo, loadedChapters, clearPendingScroll]);

  // Observe the currently visible chapter to keep selectors in sync with scrolling.
  // Uses the viewport (`root: null`) since the window is the scroller in this layout.
  useEffect(() => {
    if (loadedChapters.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Pick the visible entry closest to the top of the viewport.
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
        // Top edge inset accounts for the sticky header (~70px); bottom edge inset makes
        // the "active" zone roughly the top quarter of the viewport.
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
  const currentChapter = chapters.find((c) => c.id === selectedChapterId);

  return (
    <main className="experience-shell experience-shell--reading">
      {/* FROZEN HEADER ROW */}
      <div className="frozen-header-bar">
        {/* Left: Back arrow */}
        <Link className="header-back-link" href="/" title="Back to home">
          ←
        </Link>

        {/* Center-left: Translation | Book | Chapter selectors */}
        <div className="header-bible-selector" ref={dropdownRef}>
          <div className="selector-group">
            <button
              type="button"
              className="selector-btn translation-selector"
              onClick={() => {
                setShowTranslationDropdown((v) => !v);
                setShowBookDropdown(false);
                setShowChapterDropdown(false);
              }}
              aria-expanded={showTranslationDropdown}
              aria-haspopup="true"
              aria-label="Select translation"
              disabled={bibles.length === 0}
            >
              {bibles.find((b) => b.id === selectedBibleId)?.abbreviation || "Loading..."}
            </button>
            <span className="selector-divider">|</span>
            <button
              type="button"
              className="selector-btn book-selector"
              onClick={() => {
                setShowBookDropdown((v) => !v);
                setShowTranslationDropdown(false);
                setShowChapterDropdown(false);
              }}
              aria-expanded={showBookDropdown}
              aria-haspopup="true"
              aria-label="Select book"
              disabled={books.length === 0}
            >
              {currentBook
                ? currentBook.name.endsWith(".")
                  ? currentBook.nameLong
                  : currentBook.name
                : "Loading..."}
            </button>
            <span className="selector-divider">|</span>
            <button
              type="button"
              className="selector-btn chapter-selector"
              onClick={() => {
                setShowChapterDropdown((v) => !v);
                setShowTranslationDropdown(false);
                setShowBookDropdown(false);
              }}
              aria-expanded={showChapterDropdown}
              aria-haspopup="true"
              aria-label="Select chapter"
              disabled={chapters.length === 0}
            >
              {currentChapter?.number || "…"}
            </button>
          </div>

          {showTranslationDropdown && (
            <div className="step-translation-dropdown">
              {bibles.length === 0 ? (
                <div className="step-translation-item">Loading translations...</div>
              ) : error && bibles.length === 0 ? (
                <div className="step-translation-item error">{error}</div>
              ) : (
                bibles.map((bible) => (
                  <button
                    key={bible.id}
                    type="button"
                    className={`step-translation-item ${selectedBibleId === bible.id ? "is-active" : ""}`}
                    onClick={() => {
                      selectBible(bible.id);
                      setShowTranslationDropdown(false);
                    }}
                  >
                    <span className="trans-abbr">{bible.abbreviation}</span>
                    <span className="trans-full">{bible.name}</span>
                  </button>
                ))
              )}
            </div>
          )}

          {showBookDropdown && (
            <div className="step-translation-dropdown">
              {books.length === 0 ? (
                <div className="step-translation-item">Loading books...</div>
              ) : (
                books.map((book) => (
                  <button
                    key={book.id}
                    type="button"
                    className={`step-translation-item ${selectedBookId === book.id ? "is-active" : ""}`}
                    onClick={() => {
                      selectBook(book.id);
                      setShowBookDropdown(false);
                    }}
                  >
                    {book.name.endsWith(".") ? book.nameLong : book.name}
                  </button>
                ))
              )}
            </div>
          )}

          {showChapterDropdown && (
            <div className="step-translation-dropdown">
              {chapters.length === 0 ? (
                <div className="step-translation-item">Loading chapters...</div>
              ) : (
                chapters.map((chapter) => (
                  <button
                    key={chapter.id}
                    type="button"
                    className={`step-translation-item ${selectedChapterId === chapter.id ? "is-active" : ""}`}
                    onClick={() => {
                      selectChapter(chapter.id);
                      setShowChapterDropdown(false);
                    }}
                  >
                    {chapter.number}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Reading Mode / Study Mode toggle */}
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
    </main>
  );
}
