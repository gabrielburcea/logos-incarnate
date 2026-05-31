import { useState, useEffect, useCallback, useRef } from 'react';
import { bibleAPI, BibleVersion, Book, Chapter, BIBLE_VERSIONS } from '../services/bible-api';

export interface LoadedChapter {
  id: string;
  bookId: string;
  bookName: string;
  chapterNumber: string;
  content: string;
  reference: string;
}

export function useContinuousBible() {
  const [bibles, setBibles] = useState<BibleVersion[]>([]);
  const [selectedBibleId, setSelectedBibleId] = useState<string>(BIBLE_VERSIONS.KJV);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('GEN');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [loadedChapters, setLoadedChapters] = useState<LoadedChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrevious, setHasMorePrevious] = useState(false);
  const [pendingScrollTo, setPendingScrollTo] = useState<string | null>(null);

  // Forward/backward iteration cursors: (book index in `books`, chapter index in that book's filtered chapter list).
  // `head` = index of the FIRST loaded chapter; `tail` = index of the LAST loaded chapter.
  const headRef = useRef<{ bookIdx: number; chapterIdx: number }>({ bookIdx: 0, chapterIdx: 0 });
  const tailRef = useRef<{ bookIdx: number; chapterIdx: number }>({ bookIdx: 0, chapterIdx: 0 });
  const chaptersCacheRef = useRef<Map<string, Chapter[]>>(new Map());
  const inFlightRef = useRef(false);
  const initializedRef = useRef(false);
  const booksRef = useRef<Book[]>([]);
  booksRef.current = books;

  // ----- Initial load: bibles -----
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await bibleAPI.getBibles();
        const wanted = new Set<string>([
          BIBLE_VERSIONS.KJV,
          BIBLE_VERSIONS.NIV,
          BIBLE_VERSIONS.ESV,
        ]);
        const order = [BIBLE_VERSIONS.ESV, BIBLE_VERSIONS.KJV, BIBLE_VERSIONS.NIV];
        const selectedBibles = data
          .filter((b) => wanted.has(b.id))
          .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
        setBibles(selectedBibles);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load bibles');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ----- Load books whenever bible changes -----
  useEffect(() => {
    if (!selectedBibleId) return;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        chaptersCacheRef.current.clear();
        const data = await bibleAPI.getBooks(selectedBibleId);
        setBooks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load books');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedBibleId]);

  // ----- Helpers -----
  const getCachedChapters = useCallback(
    async (bibleId: string, bookId: string): Promise<Chapter[]> => {
      const key = `${bibleId}:${bookId}`;
      const cached = chaptersCacheRef.current.get(key);
      if (cached) return cached;
      const data = await bibleAPI.getChapters(bibleId, bookId);
      const filtered = data.filter((ch) => ch.number !== 'intro');
      chaptersCacheRef.current.set(key, filtered);
      return filtered;
    },
    []
  );

  const fetchChapter = useCallback(
    async (bibleId: string, book: Book, chapter: Chapter): Promise<LoadedChapter> => {
      const content = await bibleAPI.getChapter(bibleId, chapter.id);
      let finalContent = content.content;
      // Prepend the book intro to chapter 1 (if it exists).
      if (chapter.number === '1') {
        try {
          const intro = await bibleAPI.getChapter(bibleId, `${book.id}.intro`);
          finalContent = intro.content + content.content;
        } catch {
          // No intro available — fine.
        }
      }
      return {
        id: chapter.id,
        bookId: book.id,
        bookName: book.name.endsWith('.') ? book.nameLong : book.name,
        chapterNumber: chapter.number,
        content: finalContent,
        reference: chapter.reference,
      };
    },
    []
  );

  // ----- Load chapters AFTER the current tail -----
  const loadNextChapters = useCallback(
    async (count: number = 1) => {
      const currentBooks = booksRef.current;
      if (!selectedBibleId || currentBooks.length === 0) return;
      if (inFlightRef.current || !hasMoreNext) return;

      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const newChapters: LoadedChapter[] = [];
        let { bookIdx, chapterIdx } = tailRef.current;
        let reachedEnd = false;

        for (let i = 0; i < count; i++) {
          let nextBook = bookIdx;
          let nextChapter = chapterIdx + 1;
          let chapList = await getCachedChapters(selectedBibleId, currentBooks[nextBook].id);

          // Roll over into the next book(s) if needed.
          while (nextChapter >= chapList.length) {
            nextBook++;
            nextChapter = 0;
            if (nextBook >= currentBooks.length) {
              reachedEnd = true;
              break;
            }
            chapList = await getCachedChapters(selectedBibleId, currentBooks[nextBook].id);
          }
          if (reachedEnd) break;

          const book = currentBooks[nextBook];
          const chapter = chapList[nextChapter];
          const loaded = await fetchChapter(selectedBibleId, book, chapter);
          newChapters.push(loaded);
          bookIdx = nextBook;
          chapterIdx = nextChapter;
        }

        tailRef.current = { bookIdx, chapterIdx };
        if (newChapters.length > 0) {
          setLoadedChapters((prev) => [...prev, ...newChapters]);
        }
        if (reachedEnd) setHasMoreNext(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapters');
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [selectedBibleId, hasMoreNext, getCachedChapters, fetchChapter]
  );

  // ----- Load chapters BEFORE the current head -----
  const loadPreviousChapters = useCallback(
    async (count: number = 1) => {
      const currentBooks = booksRef.current;
      if (!selectedBibleId || currentBooks.length === 0) return;
      if (inFlightRef.current || !hasMorePrevious) return;

      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const newChapters: LoadedChapter[] = [];
        let { bookIdx, chapterIdx } = headRef.current;
        let reachedStart = false;

        for (let i = 0; i < count; i++) {
          let prevBook = bookIdx;
          let prevChapter = chapterIdx - 1;

          while (prevChapter < 0) {
            prevBook--;
            if (prevBook < 0) {
              reachedStart = true;
              break;
            }
            const chapList = await getCachedChapters(selectedBibleId, currentBooks[prevBook].id);
            prevChapter = chapList.length - 1;
          }
          if (reachedStart) break;

          const book = currentBooks[prevBook];
          const chapList = await getCachedChapters(selectedBibleId, book.id);
          const chapter = chapList[prevChapter];
          const loaded = await fetchChapter(selectedBibleId, book, chapter);
          newChapters.unshift(loaded);
          bookIdx = prevBook;
          chapterIdx = prevChapter;
        }

        headRef.current = { bookIdx, chapterIdx };
        if (newChapters.length > 0) {
          setLoadedChapters((prev) => [...newChapters, ...prev]);
        }
        if (reachedStart || (bookIdx === 0 && chapterIdx === 0)) {
          setHasMorePrevious(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapters');
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [selectedBibleId, hasMorePrevious, getCachedChapters, fetchChapter]
  );

  // ----- Jump directly to a specific chapter (replaces the loaded buffer) -----
  const jumpToChapter = useCallback(
    async (bookId: string, chapterId: string) => {
      const currentBooks = booksRef.current;
      if (!selectedBibleId || currentBooks.length === 0) return;
      const bookIdx = currentBooks.findIndex((b) => b.id === bookId);
      if (bookIdx < 0) return;
      if (inFlightRef.current) return;

      inFlightRef.current = true;
      setLoading(true);
      setError(null);

      try {
        const book = currentBooks[bookIdx];
        const chapList = await getCachedChapters(selectedBibleId, bookId);
        const chapterIdx = chapList.findIndex((c) => c.id === chapterId);
        if (chapterIdx < 0) return;
        const chapter = chapList[chapterIdx];
        const loaded = await fetchChapter(selectedBibleId, book, chapter);

        setLoadedChapters([loaded]);
        setChapters(chapList);
        setSelectedBookId(bookId);
        setSelectedChapterId(chapterId);
        headRef.current = { bookIdx, chapterIdx };
        tailRef.current = { bookIdx, chapterIdx };

        const isLastBook = bookIdx === currentBooks.length - 1;
        const isLastChapter = chapterIdx === chapList.length - 1;
        setHasMoreNext(!(isLastBook && isLastChapter));
        setHasMorePrevious(!(bookIdx === 0 && chapterIdx === 0));
        setPendingScrollTo(chapter.id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chapter');
      } finally {
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [selectedBibleId, getCachedChapters, fetchChapter]
  );

  // ----- Initial position: Genesis 1 once books are ready -----
  useEffect(() => {
    if (!selectedBibleId || books.length === 0) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      const gen = books.find((b) => b.id === 'GEN') || books[0];
      try {
        const chapList = await getCachedChapters(selectedBibleId, gen.id);
        if (chapList.length === 0) return;
        await jumpToChapter(gen.id, chapList[0].id);
        // Preload the next couple of chapters so the user has runway to scroll.
        await loadNextChapters(2);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      }
    })();
  }, [selectedBibleId, books, jumpToChapter, loadNextChapters, getCachedChapters]);

  // ----- Keep the dropdown `chapters` list in sync with the selected book -----
  useEffect(() => {
    if (!selectedBibleId || !selectedBookId || books.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await getCachedChapters(selectedBibleId, selectedBookId);
        if (!cancelled) setChapters(list);
      } catch {
        /* handled elsewhere */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedBibleId, selectedBookId, books.length, getCachedChapters]);

  // ----- Public selector actions -----
  const selectBible = useCallback((bibleId: string) => {
    initializedRef.current = false;
    setSelectedBibleId(bibleId);
    setLoadedChapters([]);
    setChapters([]);
    setSelectedChapterId('');
    setHasMoreNext(true);
    setHasMorePrevious(false);
    headRef.current = { bookIdx: 0, chapterIdx: 0 };
    tailRef.current = { bookIdx: 0, chapterIdx: 0 };
  }, []);

  const selectBook = useCallback(
    async (bookId: string) => {
      if (!selectedBibleId) return;
      try {
        const list = await getCachedChapters(selectedBibleId, bookId);
        if (list.length === 0) return;
        await jumpToChapter(bookId, list[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load book');
      }
    },
    [selectedBibleId, getCachedChapters, jumpToChapter]
  );

  const selectChapter = useCallback(
    async (chapterId: string) => {
      await jumpToChapter(selectedBookId, chapterId);
    },
    [selectedBookId, jumpToChapter]
  );

  // ----- Silent sync from scroll observer (no reload, just updates selector state) -----
  const setVisibleChapter = useCallback(
    (bookId: string, chapterId: string) => {
      setSelectedBookId((prev) => {
        if (prev !== bookId && selectedBibleId) {
          // Refresh the chapters list for the dropdown (uses cache).
          getCachedChapters(selectedBibleId, bookId)
            .then((list) => setChapters(list))
            .catch(() => {});
        }
        return bookId;
      });
      setSelectedChapterId(chapterId);
    },
    [selectedBibleId, getCachedChapters]
  );

  const clearPendingScroll = useCallback(() => setPendingScrollTo(null), []);

  return {
    bibles,
    selectedBibleId,
    books,
    selectedBookId,
    chapters,
    selectedChapterId,
    loadedChapters,
    loading,
    error,
    hasMore: hasMoreNext, // backward-compat alias
    hasMoreNext,
    hasMorePrevious,
    pendingScrollTo,
    selectBible,
    selectBook,
    selectChapter,
    jumpToChapter,
    loadNextChapters,
    loadPreviousChapters,
    setVisibleChapter,
    clearPendingScroll,
  };
}
