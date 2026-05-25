"use client";

import React, { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { SVGDrawingLayer } from "@/components/svg-drawing-layer";
import { useBible } from "@/lib/hooks/use-bible";
import { parseHTMLToVerses } from "@/lib/services/verse-parser";

type SurfaceMode = "reading" | "study";
type ToolMode = "pen" | "marker" | "eraser";

type Position = {
  x: number;
  y: number;
};

type VerseAnnotation = {
  underlinedWordIndexes?: number[];
  underlinedWordColors?: Record<number, string>;
  underlinedWordTools?: Record<number, ToolMode>;
};

type AnnotationState = Record<number, VerseAnnotation>;

type SVGStroke = {
  id: string;
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
  opacity: number;
  tool: "pen" | "marker";
};

const DEFAULT_UNDERLINE_COLOR = "#ff2d55";
const DEFAULT_TOOL_MODE: ToolMode = "pen";

const MAIN_COLORS = [
  "#ff2d55",
  "#ff7a00",
  "#ffd400",
  "#00c2ff",
  "#2f6fed",
];

function getStorageKey(bibleId: string, bookId: string, chapterId: string, type: 'annotations' | 'svg') {
  return `logos-incarnate:${bibleId}:${bookId}:${chapterId}:${type}`;
}

function toSafeToolMode(raw: unknown): ToolMode {
  if (raw === "marker") return "marker";
  if (raw === "eraser") return "eraser";
  return "pen";
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

      return [
        verseNumber,
        {
          underlinedWordIndexes,
          underlinedWordColors,
          underlinedWordTools,
        },
      ] as const;
    })
    .filter(Boolean) as Array<readonly [number, VerseAnnotation]>;

  return Object.fromEntries(safeEntries);
}

function readStoredAnnotations(storageKey: string): AnnotationState {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    return raw ? toSafeAnnotationState(JSON.parse(raw)) : {};
  } catch {
    return {};
  }
}

export function BibleExperience({ surface }: { surface: SurfaceMode }) {
  const isStudy = surface === "study";
  
  // Bible API integration
  const {
    bibles,
    selectedBibleId,
    books,
    selectedBookId,
    chapters,
    selectedChapterId,
    chapterContent,
    loading,
    error,
    selectBible,
    selectBook,
    selectChapter,
  } = useBible();

  const verses = React.useMemo(() => {
  if (!chapterContent?.content) return [];
  
  // Parse HTML from API into verse array
  const parsedVerses = parseHTMLToVerses(chapterContent.content);
  
  return parsedVerses.map(parsed => ({
    id: `verse-${parsed.number}`,
    number: parsed.number,
    text: parsed.text,
  }));
}, [chapterContent]);
  
  const [selectedVerse, setSelectedVerse] = useState<number>(1);
  const [annotations, setAnnotations] = useState<AnnotationState>({});
  const [hasLoadedAnnotations, setHasLoadedAnnotations] = useState(false);
  const [toolMode, setToolMode] = useState<ToolMode>(DEFAULT_TOOL_MODE);
  const [underlineColor, setUnderlineColor] = useState<string>(DEFAULT_UNDERLINE_COLOR);
  const [isAnnotating, setIsAnnotating] = useState(false);
  const [annotatingVerse, setAnnotatingVerse] = useState<number | null>(null);
  const [svgStrokes, setSvgStrokes] = useState<SVGStroke[]>([]);
  const [hasLoadedSvg, setHasLoadedSvg] = useState(false);
  const readingColumnRef = useRef<HTMLDivElement>(null);
  const [showTranslationDropdown, setShowTranslationDropdown] = useState(false);
  const [showBookDropdown, setShowBookDropdown] = useState(false);
  const [showChapterDropdown, setShowChapterDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Use refs to always have current tool state (avoid stale closures)
  const toolModeRef = useRef<ToolMode>(DEFAULT_TOOL_MODE);
  const underlineColorRef = useRef<string>(DEFAULT_UNDERLINE_COLOR);
  
  // Keep refs in sync with state
  useEffect(() => {
    toolModeRef.current = toolMode;
  }, [toolMode]);
  
  useEffect(() => {
    underlineColorRef.current = underlineColor;
  }, [underlineColor]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTranslationDropdown(false);
        setShowBookDropdown(false);
        setShowChapterDropdown(false);
      }
    };

    if (showTranslationDropdown || showBookDropdown || showChapterDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showTranslationDropdown, showBookDropdown, showChapterDropdown]);

  // Load annotations when chapter changes
  useEffect(() => {
    if (!selectedBibleId || !selectedBookId || !selectedChapterId) return;
    
    const storageKey = getStorageKey(selectedBibleId, selectedBookId, selectedChapterId, 'annotations');
    const timer = window.setTimeout(() => {
      setAnnotations(readStoredAnnotations(storageKey));
      setHasLoadedAnnotations(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [selectedBibleId, selectedBookId, selectedChapterId]);

  // Load SVG strokes when chapter changes
  useEffect(() => {
    if (!selectedBibleId || !selectedBookId || !selectedChapterId) return;
    
    const storageKey = getStorageKey(selectedBibleId, selectedBookId, selectedChapterId, 'svg');
    const timer = window.setTimeout(() => {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        try {
          setSvgStrokes(JSON.parse(raw));
        } catch {
          setSvgStrokes([]);
        }
      } else {
        setSvgStrokes([]);
      }
      setHasLoadedSvg(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedBibleId, selectedBookId, selectedChapterId]);

  // Save annotations when they change
  useEffect(() => {
    if (!hasLoadedAnnotations || !selectedBibleId || !selectedBookId || !selectedChapterId) {
      return;
    }

    const storageKey = getStorageKey(selectedBibleId, selectedBookId, selectedChapterId, 'annotations');
    window.localStorage.setItem(storageKey, JSON.stringify(annotations));
  }, [annotations, hasLoadedAnnotations, selectedBibleId, selectedBookId, selectedChapterId]);

  // Save SVG strokes when they change
  useEffect(() => {
    if (!hasLoadedSvg || !selectedBibleId || !selectedBookId || !selectedChapterId) {
      return;
    }

    const storageKey = getStorageKey(selectedBibleId, selectedBookId, selectedChapterId, 'svg');
    window.localStorage.setItem(storageKey, JSON.stringify(svgStrokes));
  }, [svgStrokes, hasLoadedSvg, selectedBibleId, selectedBookId, selectedChapterId]);

  function selectVerse(verseNumber: number) {
    setSelectedVerse(verseNumber);
  }

  function toggleWordAnnotation(verseNumber: number, wordIndex: number) {
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
          underlinedWordIndexes: nextIndexes,
          underlinedWordColors: nextColors,
          underlinedWordTools: nextTools,
        },
      };
    });
  }

  function addWordAnnotation(verseNumber: number, wordIndex: number) {
    setAnnotations((current) => {
      const currentIndexes = current[verseNumber]?.underlinedWordIndexes ?? [];
      const currentColors = current[verseNumber]?.underlinedWordColors ?? {};
      const currentTools = current[verseNumber]?.underlinedWordTools ?? {};
      
      if (currentIndexes.includes(wordIndex)) {
        return current;
      }

      const nextIndexes = [...currentIndexes, wordIndex].sort((left, right) => left - right);
      // Use ref values to avoid stale state
      const nextColors = { ...currentColors, [wordIndex]: underlineColorRef.current };
      const nextTools = { ...currentTools, [wordIndex]: toolModeRef.current };

      return {
        ...current,
        [verseNumber]: {
          underlinedWordIndexes: nextIndexes,
          underlinedWordColors: nextColors,
          underlinedWordTools: nextTools,
        },
      };
    });
  }

  function handleWordClick(verseNumber: number, wordIndex: number) {
    // Word click currently does nothing - meaning explorer disabled
    // Future: could open context menu or meaning lookup
    selectVerse(verseNumber);
  }

  function handleWordMouseDown(verseNumber: number, wordIndex: number) {
    setIsAnnotating(true);
    setAnnotatingVerse(verseNumber);
    
    // Eraser removes annotation, others add
    if (toolModeRef.current === "eraser") {
      toggleWordAnnotation(verseNumber, wordIndex);
    } else {
      addWordAnnotation(verseNumber, wordIndex);
    }
  }

  function handleWordMouseEnter(verseNumber: number, wordIndex: number) {
    if (isAnnotating && annotatingVerse === verseNumber) {
      if (toolModeRef.current === "eraser") {
        // Eraser removes on hover during drag
        const currentIndexes = annotations[verseNumber]?.underlinedWordIndexes ?? [];
        if (currentIndexes.includes(wordIndex)) {
          toggleWordAnnotation(verseNumber, wordIndex);
        }
      } else {
        addWordAnnotation(verseNumber, wordIndex);
      }
    }
  }

  function handleWordMouseUp() {
    setIsAnnotating(false);
    setAnnotatingVerse(null);
  }

  useEffect(() => {
    if (isAnnotating) {
      const handleGlobalMouseUp = () => {
        setIsAnnotating(false);
        setAnnotatingVerse(null);
      };
      document.addEventListener('mouseup', handleGlobalMouseUp);
      return () => document.removeEventListener('mouseup', handleGlobalMouseUp);
    }
  }, [isAnnotating]);

  function getWordColor(annotation: VerseAnnotation, index: number) {
    return annotation.underlinedWordColors?.[index] ?? DEFAULT_UNDERLINE_COLOR;
  }

  function getWordTool(annotation: VerseAnnotation, index: number): ToolMode {
    return annotation.underlinedWordTools?.[index] ?? DEFAULT_TOOL_MODE;
  }

  function renderVerseText(verseNumber: number, verseText: string, annotation: VerseAnnotation) {
    const words = verseText.split(" ");
    const annotated = new Set(annotation.underlinedWordIndexes ?? []);

    return (
      <span className="verse-text">
        {words.map((word, index) => {
          const isAnnotated = annotated.has(index);
          const trailingSpace = index < words.length - 1 ? " " : "";
          const colorValue = getWordColor(annotation, index);
          const appliedTool = getWordTool(annotation, index);

          const wordClassName = [
            "verse-word",
            isAnnotated && appliedTool === "pen" ? "is-underlined" : "",
            isAnnotated && appliedTool === "marker" ? "is-marker-underlined" : "",
          ]
            .filter(Boolean)
            .join(" ");

          if (!isStudy) {
            return (
              <Fragment key={`${verseNumber}-word-${index}`}>
                <span
                  className={wordClassName}
                  style={isAnnotated ? { ["--underline-color" as string]: colorValue } : undefined}
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
                className={[wordClassName, "is-word-button"].filter(Boolean).join(" ")}
                onMouseDown={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  handleWordMouseDown(verseNumber, index);
                }}
                onMouseEnter={() => {
                  handleWordMouseEnter(verseNumber, index);
                }}
                onMouseUp={() => {
                  handleWordMouseUp();
                }}
                onClick={(event) => {
                  if (!isAnnotating) {
                    event.preventDefault();
                    event.stopPropagation();
                    handleWordClick(verseNumber, index);
                  }
                }}
                aria-pressed={isAnnotated}
                style={isAnnotated ? { ["--underline-color" as string]: colorValue } : undefined}
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
      {/* Back link - top left corner */}
      <Link className="back-link-minimal" href="/" title="Back to home">
        ← 
      </Link>

      {/* Step Bible style selector - compact horizontal layout: Translation | Book | Chapter */}
      <div className="step-bible-selector" ref={dropdownRef}>
        <div className="selector-group">
          <button
            type="button"
            className="selector-btn translation-selector"
            onClick={() => {
              setShowTranslationDropdown(!showTranslationDropdown);
              setShowBookDropdown(false);
              setShowChapterDropdown(false);
            }}
            aria-expanded={showTranslationDropdown}
            aria-haspopup="true"
            aria-label="Select translation"
            disabled={loading}
          >
            {bibles.find(b => b.id === selectedBibleId)?.abbreviation || 'Loading...'}
          </button>
          <span className="selector-divider">|</span>
          <button 
            type="button" 
            className="selector-btn book-selector"
            onClick={() => {
              setShowBookDropdown(!showBookDropdown);
              setShowTranslationDropdown(false);
              setShowChapterDropdown(false);
            }}
            aria-expanded={showBookDropdown}
            aria-haspopup="true"
            aria-label="Select book"
            disabled={loading}
          >
            {books.find(b => b.id === selectedBookId)?.name || 'Loading...'}
          </button>
          <span className="selector-divider">|</span>
          <button 
            type="button" 
            className="selector-btn chapter-selector"
            onClick={() => {
              setShowChapterDropdown(!showChapterDropdown);
              setShowTranslationDropdown(false);
              setShowBookDropdown(false);
            }}
            aria-expanded={showChapterDropdown}
            aria-haspopup="true"
            aria-label="Select chapter"
            disabled={loading}
          >
            {chapters.find(c => c.id === selectedChapterId)?.number || 'Loading...'}
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
        
        {showBookDropdown && (
          <div className="step-translation-dropdown">
            {loading ? (
              <div className="step-translation-item">Loading books...</div>
            ) : error ? (
              <div className="step-translation-item error">{error}</div>
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
                  <span className="trans-abbr">{book.abbreviation}</span>
                  <span className="trans-full">{book.name}</span>
                </button>
              ))
            )}
          </div>
        )}
        
        {showChapterDropdown && (
          <div className="step-translation-dropdown">
            {loading ? (
              <div className="step-translation-item">Loading chapters...</div>
            ) : error ? (
              <div className="step-translation-item error">{error}</div>
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
                  {chapter.reference}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className={`experience-layout ${isStudy ? "study-layout" : "reading-layout is-reading-only"}`}>
        <section className="reading-column" aria-label="Chapter text" ref={readingColumnRef}>
          {/* Chapter title embedded naturally in the text */}
          <div className="chapter-title-embedded">
            <h1 className="chapter-heading">
              {books.find(b => b.id === selectedBookId)?.name || 'Loading...'}{' '}
              {chapters.find(c => c.id === selectedChapterId)?.number || ''}
            </h1>
          </div>

          {/* Floating mode switcher - appears on top of text, minimal and intuitive */}
          <nav className="mode-switcher-floating" aria-label="Switch reading mode">
            <Link 
              href="/read" 
              className={`mode-btn ${!isStudy ? "active" : ""}`}
              title="Reading Mode"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 3h10M3 8h10M3 13h7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
            </Link>
            <Link 
              href="/study" 
              className={`mode-btn ${isStudy ? "active" : ""}`}
              title="Study Manuscript Mode"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M11 2L5 14M9 2L6 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </Link>
          </nav>
          
          <div className={`verse-list ${surface} ${isAnnotating ? 'is-annotating' : ''}`} style={{ position: "relative" }}>
            {isStudy && (
              <SVGDrawingLayer
                isActive={isStudy}
                currentTool={toolMode}
                currentColor={underlineColor}
                onStrokesChange={setSvgStrokes}
                initialStrokes={svgStrokes}
              />
            )}
            
            {loading && (
              <div style={{ padding: "2rem", textAlign: "center", color: "#666" }}>
                Loading chapter...
              </div>
            )}
            
            {error && (
              <div style={{ padding: "2rem", textAlign: "center", color: "#ff2d55" }}>
                Error loading chapter: {error}
              </div>
            )}
            
            {!loading && !error && verses.length > 0 && verses.map((verse) => {
              const annotation = annotations[verse.number] ?? {};
              const isSelected = selectedVerse === verse.number;

              return (
                <article
                  key={verse.id}
                  className={[
                    "verse-card",
                    isSelected ? "is-selected" : "",
                    annotation.underlinedWordIndexes?.length ? "has-underlines" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <div className={isStudy ? "verse-button" : "verse-static"}>
                    <button
                      type="button"
                      className={`verse-number-button ${isSelected ? "is-selected" : ""}`}
                      onClick={() => selectVerse(verse.number)}
                      aria-pressed={isSelected}
                    >
                      <span className="verse-number">{verse.number}</span>
                    </button>

                    <div className="verse-text-wrap">{renderVerseText(verse.number, verse.text, annotation)}</div>
                  </div>

                  {/* Meaning explorer temporarily disabled - was Genesis 2 specific */}
                </article>
              );
            })}
          </div>
        </section>

        {isStudy ? (
          <>
            {/* Excalibur-style minimalist annotation toolbar - top right corner, fixed */}
            <div className="annotation-toolbar-excalibur">
              {/* Tool icons */}
              <button
                type="button"
                className={`tool-btn ${toolMode === "pen" ? "active" : ""}`}
                onClick={() => setToolMode("pen")}
                aria-label="Pen"
                title="Pen"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M13 2L5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </button>
              
              <button
                type="button"
                className={`tool-btn ${toolMode === "marker" ? "active" : ""}`}
                onClick={() => setToolMode("marker")}
                aria-label="Marker"
                title="Marker"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <rect x="2" y="8" width="14" height="3" rx="0.5" fill="currentColor" opacity="0.4"/>
                </svg>
              </button>
              
              <button
                type="button"
                className={`tool-btn ${toolMode === "eraser" ? "active" : ""}`}
                onClick={() => setToolMode("eraser")}
                aria-label="Eraser"
                title="Eraser"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M7 16H16M2 10L7 15L16 6L11 1L2 10Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="divider"></div>
              
              {/* Color dots - main 5 colors */}
              {toolMode !== "eraser" && MAIN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`color-dot ${underlineColor === color ? "active" : ""}`}
                  onClick={() => setUnderlineColor(color)}
                  style={{ backgroundColor: color }}
                  aria-label={`Color ${color}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </main>
  );
}
