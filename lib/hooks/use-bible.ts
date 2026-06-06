import { useState, useEffect } from 'react';
import { bibleAPI, BibleVersion, Book, Chapter, ChapterContent, BIBLE_VERSIONS } from '../services/bible-api';

export function useBible() {
  const [bibles, setBibles] = useState<BibleVersion[]>([]);
  const [selectedBibleId, setSelectedBibleId] = useState<string>(BIBLE_VERSIONS.KJV_LOCAL);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>('GEN');
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapterId, setSelectedChapterId] = useState<string>('');
  const [chapterContent, setChapterContent] = useState<ChapterContent | null>(null);
  const [introContent, setIntroContent] = useState<ChapterContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBibles();
  }, []);

  useEffect(() => {
    if (selectedBibleId) {
      loadBooks(selectedBibleId);
    }
  }, [selectedBibleId]);

  useEffect(() => {
    if (selectedBibleId && selectedBookId) {
      loadChapters(selectedBibleId, selectedBookId);
    }
  }, [selectedBibleId, selectedBookId]);

  useEffect(() => {
    if (selectedBibleId && selectedChapterId) {
      loadChapterContent(selectedBibleId, selectedChapterId);
    }
  }, [selectedBibleId, selectedChapterId]);

  const loadBibles = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await bibleAPI.getBibles();
      // Local bundles only — KJV and WEB ship as static assets in
      // public/bibles/, so they load instantly and work offline.
      const order = [BIBLE_VERSIONS.KJV_LOCAL, BIBLE_VERSIONS.WEB_LOCAL];
      const wanted = new Set<string>(order);
      const selectedBibles = data
        .filter((bible) => wanted.has(bible.id))
        .sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
      setBibles(selectedBibles);

      // Fall back to whichever local bundle did load if KJV isn't on disk.
      if (
        selectedBibles.length > 0 &&
        !selectedBibles.find((b) => b.id === BIBLE_VERSIONS.KJV_LOCAL)
      ) {
        setSelectedBibleId(selectedBibles[0].id);
      }
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

  const loadChapters = async (bibleId: string, bookId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bibleAPI.getChapters(bibleId, bookId);
      // Filter out intro chapters from the list
      const filteredChapters = data.filter(chapter => chapter.number !== 'intro');
      setChapters(filteredChapters);
      
      if (filteredChapters.length > 0 && !selectedChapterId) {
        setSelectedChapterId(filteredChapters[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapters');
    } finally {
      setLoading(false);
    }
  };

  const loadChapterContent = async (bibleId: string, chapterId: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await bibleAPI.getChapter(bibleId, chapterId);
      setChapterContent(data);
      
      // If this is chapter 1, also fetch the intro
      const chapterNumber = data.number;
      if (chapterNumber === '1') {
        try {
          const introChapterId = `${data.bookId}.intro`;
          const intro = await bibleAPI.getChapter(bibleId, introChapterId);
          setIntroContent(intro);
        } catch (introErr) {
          // Intro doesn't exist for this book, that's okay
          setIntroContent(null);
        }
      } else {
        setIntroContent(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chapter');
    } finally {
      setLoading(false);
    }
  };

  const selectBible = (bibleId: string) => {
    setSelectedBibleId(bibleId);
    setSelectedBookId('GEN');
    setSelectedChapterId('');
    setChapterContent(null);
  };

  const selectBook = (bookId: string) => {
    setSelectedBookId(bookId);
    setSelectedChapterId('');
    setChapterContent(null);
    setIntroContent(null);
  };

  const selectChapter = (chapterId: string) => {
    setSelectedChapterId(chapterId);
  };

  const goToNextChapter = () => {
    if (chapterContent?.next) {
      setSelectedChapterId(chapterContent.next.id);
    }
  };

  const goToPreviousChapter = () => {
    if (chapterContent?.previous) {
      setSelectedChapterId(chapterContent.previous.id);
    }
  };

  return {
    bibles,
    selectedBibleId,
    books,
    selectedBookId,
    chapters,
    selectedChapterId,
    chapterContent,
    introContent,
    loading,
    error,
    selectBible,
    selectBook,
    selectChapter,
    goToNextChapter,
    goToPreviousChapter,
  };
}
