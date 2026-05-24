/**
 * Bible API Service
 * 
 * This service provides a unified interface to fetch Bible content from multiple sources.
 * It's designed to be scalable for multiple translations (KJV, ESV, NIV, etc.)
 * 
 * Current implementation uses API.Bible (https://scripture.api.bible/)
 * which provides free access to multiple Bible translations.
 */

export type BibleTranslation = {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  description: string;
};

export type BibleBook = {
  id: string;
  name: string;
  abbreviation: string;
  chapters: number[];
};

export type BibleVerse = {
  id: string;
  number: number;
  text: string;
  reference: string;
};

export type BibleChapter = {
  id: string;
  book: string;
  chapter: number;
  translation: string;
  verses: BibleVerse[];
};

// API.Bible Translation IDs
export const BIBLE_TRANSLATIONS: Record<string, BibleTranslation> = {
  KJV: {
    id: 'de4e12af7f28f599-02', // King James Version
    name: 'King James Version',
    abbreviation: 'KJV',
    language: 'English',
    description: 'The classic 1611 translation'
  },
  WEB: {
    id: 'c315fa9f71d4af3a-01', // World English Bible (free, similar to ESV)
    name: 'World English Bible',
    abbreviation: 'WEB',
    language: 'English',
    description: 'Modern English translation, public domain'
  },
  // Note: ESV and NIV require paid API access
  // For now, we'll use KJV and WEB which are freely available
};

const API_BASE = 'https://api.scripture.api.bible/v1';
const API_KEY = process.env.NEXT_PUBLIC_BIBLE_API_KEY || '';

/**
 * Fetch available Bible translations
 */
export async function getBibleTranslations(): Promise<BibleTranslation[]> {
  if (!API_KEY) {
    // Return cached translations if no API key
    return Object.values(BIBLE_TRANSLATIONS);
  }

  try {
    const response = await fetch(`${API_BASE}/bibles`, {
      headers: {
        'api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch translations');
    }

    const data = await response.json();
    return data.data.map((bible: any) => ({
      id: bible.id,
      name: bible.name,
      abbreviation: bible.abbreviationLocal || bible.abbreviation,
      language: bible.language.name,
      description: bible.description,
    }));
  } catch (error) {
    console.error('Error fetching translations:', error);
    return Object.values(BIBLE_TRANSLATIONS);
  }
}

/**
 * Fetch books available in a translation
 */
export async function getBibleBooks(translationId: string): Promise<BibleBook[]> {
  if (!API_KEY) {
    // Return cached books for offline/demo mode
    return getCachedBooks();
  }

  try {
    const response = await fetch(`${API_BASE}/bibles/${translationId}/books`, {
      headers: {
        'api-key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }

    const data = await response.json();
    return data.data.map((book: any) => ({
      id: book.id,
      name: book.name,
      abbreviation: book.abbreviation,
      chapters: Array.from({ length: book.chapters?.length || 0 }, (_, i) => i + 1),
    }));
  } catch (error) {
    console.error('Error fetching books:', error);
    return getCachedBooks();
  }
}

/**
 * Fetch a specific chapter
 */
export async function getBibleChapter(
  translationId: string,
  bookId: string,
  chapterNumber: number
): Promise<BibleChapter> {
  if (!API_KEY) {
    // Return cached chapter for offline/demo mode
    return getCachedChapter(translationId, bookId, chapterNumber);
  }

  try {
    const chapterId = `${bookId}.${chapterNumber}`;
    const response = await fetch(
      `${API_BASE}/bibles/${translationId}/chapters/${chapterId}?content-type=text&include-notes=false&include-titles=false&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
      {
        headers: {
          'api-key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch chapter');
    }

    const data = await response.json();
    const verses = parseVerses(data.data.content);

    return {
      id: chapterId,
      book: bookId,
      chapter: chapterNumber,
      translation: translationId,
      verses,
    };
  } catch (error) {
    console.error('Error fetching chapter:', error);
    return getCachedChapter(translationId, bookId, chapterNumber);
  }
}

/**
 * Parse verse text from API response
 */
function parseVerses(content: string): BibleVerse[] {
  // Simple parser for verse numbers and text
  // Format: [1] verse text [2] verse text ...
  const versePattern = /\[(\d+)\]\s*([^\[]+)/g;
  const verses: BibleVerse[] = [];
  let match;

  while ((match = versePattern.exec(content)) !== null) {
    const number = parseInt(match[1]);
    const text = match[2].trim();
    verses.push({
      id: `v${number}`,
      number,
      text,
      reference: `v${number}`,
    });
  }

  return verses;
}

/**
 * Cached Bible books for offline/demo mode
 */
function getCachedBooks(): BibleBook[] {
  return [
    {
      id: 'GEN',
      name: 'Genesis',
      abbreviation: 'Gen',
      chapters: Array.from({ length: 50 }, (_, i) => i + 1),
    },
    {
      id: 'EXO',
      name: 'Exodus',
      abbreviation: 'Exo',
      chapters: Array.from({ length: 40 }, (_, i) => i + 1),
    },
    // Add more books as needed
  ];
}

/**
 * Cached chapter data for offline/demo mode
 */
function getCachedChapter(
  translationId: string,
  bookId: string,
  chapterNumber: number
): BibleChapter {
  // Return Genesis 2 from our fixtures as fallback
  if (bookId === 'GEN' && chapterNumber === 2) {
    return {
      id: `${bookId}.${chapterNumber}`,
      book: bookId,
      chapter: chapterNumber,
      translation: translationId,
      verses: [
        { id: 'v1', number: 1, text: 'Thus the heavens and the earth were finished, and all the host of them.', reference: 'v1' },
        { id: 'v2', number: 2, text: 'And on the seventh day God ended his work which he had made; and he rested on the seventh day from all his work which he had made.', reference: 'v2' },
        // ... add more verses
      ],
    };
  }

  return {
    id: `${bookId}.${chapterNumber}`,
    book: bookId,
    chapter: chapterNumber,
    translation: translationId,
    verses: [],
  };
}
