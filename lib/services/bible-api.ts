const API_KEY = '78a9f6124f344018-01';
const BASE_URL = 'https://api.scripture.api.bible/v1';

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  language: {
    id: string;
    name: string;
  };
}

export interface Book {
  id: string;
  bibleId: string;
  abbreviation: string;
  name: string;
  nameLong: string;
}

export interface Chapter {
  id: string;
  bibleId: string;
  bookId: string;
  number: string;
  reference: string;
}

export interface Verse {
  id: string;
  orgId: string;
  bibleId: string;
  bookId: string;
  chapterId: string;
  reference: string;
  text: string;
}

export interface ChapterContent {
  id: string;
  bibleId: string;
  number: string;
  bookId: string;
  reference: string;
  content: string;
  copyright: string;
  verseCount: number;
  next?: {
    id: string;
    number: string;
  };
  previous?: {
    id: string;
    number: string;
  };
}

class BibleAPIService {
  private headers: HeadersInit;

  constructor() {
    this.headers = {
      'api-key': API_KEY,
      'Accept': 'application/json',
    };
  }

  async getBibles(): Promise<BibleVersion[]> {
    try {
      const response = await fetch(`${BASE_URL}/bibles`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bibles: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching bibles:', error);
      throw error;
    }
  }

  async getBooks(bibleId: string): Promise<Book[]> {
    try {
      const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch books: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching books:', error);
      throw error;
    }
  }

  async getChapters(bibleId: string, bookId: string): Promise<Chapter[]> {
    try {
      const response = await fetch(`${BASE_URL}/bibles/${bibleId}/books/${bookId}/chapters`, {
        headers: this.headers,
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chapters: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  }

  async getChapter(bibleId: string, chapterId: string): Promise<ChapterContent> {
    try {
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
        {
          headers: this.headers,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch chapter: ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Error fetching chapter:', error);
      throw error;
    }
  }

  async getVerses(bibleId: string, chapterId: string): Promise<Verse[]> {
    try {
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}/verses`,
        {
          headers: this.headers,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch verses: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching verses:', error);
      throw error;
    }
  }

  async searchBible(bibleId: string, query: string): Promise<any> {
    try {
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/search?query=${encodeURIComponent(query)}`,
        {
          headers: this.headers,
        }
      );
      
      if (!response.ok) {
        throw new Error(`Failed to search: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error searching bible:', error);
      throw error;
    }
  }
}

export const bibleAPI = new BibleAPIService();

// Popular Bible version IDs for quick access
export const BIBLE_VERSIONS = {
  KJV: 'de4e12af7f28f599-02', // King James Version
  ASV: '06125adad2d5898a-01', // American Standard Version
  WEB: '9879dbb7cfe39e4d-01', // World English Bible
  // Add ESV and NIV IDs once available
};
