"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useContinuousBible } from "@/lib/hooks/use-continuous-bible";

export function ContinuousReadingExperience() {
  const {
    bibles,
    selectedBibleId,
    loadedChapters,
    loading,
    error,
    hasMore,
    selectBible,
    loadNextChapters,
  } = useContinuousBible();

  const [showTranslationDropdown, setShowTranslationDropdown] = React.useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTranslationDropdown(false);
      }
    };

    if (showTranslationDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTranslationDropdown]);

  // Infinite scroll handler
  useEffect(() => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

      // Load more when user scrolls to 80% of content
      if (scrollPercentage > 0.8 && hasMore && !loading && !loadingRef.current) {
        loadingRef.current = true;
        loadNextChapters(2).finally(() => {
          loadingRef.current = false;
        });
      }
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    return () => scrollContainer.removeEventListener('scroll', handleScroll);
  }, [hasMore, loading, loadNextChapters]);

  return (
    <main className="experience-shell experience-shell--reading">
      {/* FROZEN HEADER ROW */}
      <div className="frozen-header-bar">
        {/* Left: Back arrow */}
        <Link className="header-back-link" href="/" title="Back to home">
          ← 
        </Link>

        {/* Center: Translation selector only */}
        <div className="header-bible-selector" ref={dropdownRef}>
          <div className="selector-group">
            <button
              type="button"
              className="selector-btn translation-selector"
              onClick={() => setShowTranslationDropdown(!showTranslationDropdown)}
              aria-expanded={showTranslationDropdown}
              aria-haspopup="true"
              aria-label="Select translation"
              disabled={loading}
            >
              {bibles.find(b => b.id === selectedBibleId)?.abbreviation || 'Loading...'}
            </button>
          </div>
          
          {showTranslationDropdown && (
            <div className="step-translation-dropdown">
              {loading ? (
                <div className="step-translation-item">Loading translations...</div>
              ) : error ? (
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
        </div>
        
        {/* Center: Reading Mode / Study Mode toggle */}
        <nav className="header-mode-switcher" aria-label="Switch reading mode">
          <Link 
            href="/read" 
            className="mode-btn active"
            title="Reading Mode"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 3h10M3 8h10M3 13h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            </svg>
          </Link>
          <Link 
            href="/study" 
            className="mode-btn"
            title="Study Manuscript Mode"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M11 2L5 14M9 2L6 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
            </svg>
          </Link>
        </nav>
      </div>

      {/* SCROLLABLE CONTENT ROW */}
      <div className="scrollable-content-area" ref={scrollContainerRef}>
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
          
          {loadedChapters.map((chapter) => (
            <div key={chapter.id} className="continuous-chapter">
              {/* Chapter heading */}
              <div className="chapter-title-embedded">
                <h1 className="chapter-heading">
                  {chapter.bookName} {chapter.chapterNumber}
                </h1>
              </div>
              
              {/* Chapter content */}
              <div className="reading-mode-content">
                <div 
                  className="chapter-html-content"
                  dangerouslySetInnerHTML={{ __html: chapter.content }}
                />
              </div>
            </div>
          ))}
          
          {loading && loadedChapters.length > 0 && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
              Loading more chapters...
            </div>
          )}
          
          {!hasMore && loadedChapters.length > 0 && (
            <div style={{ padding: "3rem", textAlign: "center", color: "#999", fontStyle: "italic" }}>
              You've reached the end of the Bible
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
