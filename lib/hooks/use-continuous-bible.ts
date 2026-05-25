import { useState, useEffect, useCallback } from 'react';
import { bibleAPI, BibleVersion, Book, ChapterContent, BIBLE_VERSIONS } from '../services/bible-api';

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
  const [loadedChapters, setLoadedChapters] = useState<LoadedChapter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentBookIndex, setCurrentBookIndex] = useState(0);
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);

  useEffect(() => {
    loadBibles();
  }, []);

  useEffect(() => {
    if (selectedBibleId) {
      loadBooks(selectedBibleId);
    }
  }, [selectedBibleId]);

  useEffect(() => {
    if (selectedBibleId && books.length > 0) {
      // Start loading from Genesis
      setLoadedChapters([]);
      setCurrentBookIndex(0);
      setCurrentChapterIndex(0);
      setHasMore(true);
      loadNextChapters(3); // Load first 3 chapters
    }
  }, [selectedBibleId, books]);

  const loadBibles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bibleAPI.getBibles();
      const selectedBibles = data.filter(bible => 
        bible.id === BIBLE_VERSIONS.KJV || bible.id === BIBLE_VERSIONS.NIV
      );
      setBibles(selectedBibles);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bibles');
    } finally {
      setLoading(false);
    }
  };

  const loadBooks = async (bibleId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bibleAPI.getBooks(bibleId);
      setBooks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load books');
    } finally {
      setLoading(false);
    }
  };

  const loadNextChapters = useCallback(async (count: number = 1) => {
    if (!selectedBibleId || books.length === 0 || loading || !hasMore) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chaptersToLoad: LoadedChapter[] = [];
      let bookIdx = currentBookIndex;
      let chapterIdx = currentChapterIndex;

      for (let i = 0; i < count; i++) {
        if (bookIdx >= books.length) {
          setHasMore(false);
          break;
        }

        const book = books[bookIdx];
        
        // Get chapters for this book
        const chapters = await bibleAPI.getChapters(selectedBibleId, book.id);
        const filteredChapters = chapters.filter(ch => ch.number !== 'intro');

        if (chapterIdx >= filteredChapters.length) {
          // Move to next book
          bookIdx++;
          chapterIdx = 0;
          continue;
        }

        const chapter = filteredChapters[chapterIdx];
        
        // Load chapter content
        const content = await bibleAPI.getChapter(selectedBibleId, chapter.id);
        
        // For first chapter of each book, try to load intro
        let finalContent = content.content;
        if (chapterIdx === 0) {
          try {
            const introChapterId = `${book.id}.intro`;
            const intro = await bibleAPI.getChapter(selectedBibleId, introChapterId);
            finalContent = intro.content + content.content;
          } catch {
            // No intro, that's fine
          }
        }

        chaptersToLoad.push({
          id: chapter.id,
          bookId: book.id,
          bookName: book.name.endsWith('.') ? book.nameLong : book.name,
          chapterNumber: chapter.number,
          content: finalContent,
          reference: chapter.reference,
        });

        // Move to next chapter
        chapterIdx++;
        if (chapterIdx >= filteredChapters.length) {
          bookIdx++;
          chapterIdx = 0;
        }
      }

      setLoadedChapters(prev => [...prev, ...chaptersToLoad]);
      setCurrentBookIndex(bookIdx);
      setCurrentChapterIndex(chapterIdx);

      if (bookIdx >= books.length) {
        setHasMore(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  }, [selectedBibleId, books, currentBookIndex, currentChapterIndex, loading, hasMore]);

  const selectBible = (bibleId: string) => {
    setSelectedBibleId(bibleId);
    setLoadedChapters([]);
    setCurrentBookIndex(0);
    setCurrentChapterIndex(0);
    setHasMore(true);
  };

  return {
    bibles,
    selectedBibleId,
    books,
    loadedChapters,
    loading,
    error,
    hasMore,
    selectBible,
    loadNextChapters,
  };
}
