const API_KEY = process.env.NEXT_PUBLIC_BIBLE_API_KEY || '';
const BASE_URL = 'https://rest.api.bible/v1';

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  description: string;
  language: {
    id: string;
    name: string;
  }
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
  private localBookCache = new Map<string, Promise<LocalBook>>();
  private localManifestCache = new Map<string, Promise<LocalManifest>>();

  constructor() {
    this.headers = {
      'api-key': API_KEY || '',
      'Accept': 'application/json',
    };
  }

  // ---- Local-bible helpers ---------------------------------------------------
  // A bibleId of `local:KJV` means: read pre-bundled JSON from /bibles/KJV/.
  // The files are populated by `npm run download:bibles`.

  private isLocal(bibleId: string): boolean {
    return bibleId.startsWith('local:');
  }

  private localAbbr(bibleId: string): string {
    return bibleId.slice('local:'.length);
  }

  private async loadLocalManifest(bibleId: string): Promise<LocalManifest> {
    const abbr = this.localAbbr(bibleId);
    if (!this.localManifestCache.has(abbr)) {
      this.localManifestCache.set(
        abbr,
        fetch(`/bibles/${abbr}/manifest.json`).then((r) => {
          if (!r.ok) throw new Error(`Missing local bible: ${abbr}`);
          return r.json();
        })
      );
    }
    return this.localManifestCache.get(abbr)!;
  }

  private async loadLocalBook(bibleId: string, bookId: string): Promise<LocalBook> {
    const abbr = this.localAbbr(bibleId);
    const key = `${abbr}:${bookId}`;
    if (!this.localBookCache.has(key)) {
      this.localBookCache.set(
        key,
        fetch(`/bibles/${abbr}/${bookId}.json`).then((r) => {
          if (!r.ok) throw new Error(`Missing local book: ${abbr}/${bookId}`);
          return r.json();
        })
      );
    }
    return this.localBookCache.get(key)!;
  }

  // ---- Public API ------------------------------------------------------------

  async getBibles(): Promise<BibleVersion[]> {
    // Discover local bundled translations first.
    const localResults = await Promise.all(
      LOCAL_BIBLE_ABBRS.map(async (abbr) => {
        try {
          const r = await fetch(`/bibles/${abbr}/manifest.json`);
          if (!r.ok) return null;
          const m = (await r.json()) as LocalManifest;
          return {
            id: m.id,
            name: m.name,
            abbreviation: m.abbreviation,
            description: m.description || `${m.name} (bundled)`,
            language: m.language || { id: 'eng', name: 'English' },
          } as BibleVersion;
        } catch {
          return null;
        }
      })
    );
    const local = localResults.filter((b): b is BibleVersion => b !== null);

    // Then the remote ones from API.Bible.
    let remote: BibleVersion[] = [];
    try {
      const response = await fetch(`${BASE_URL}/bibles`, { headers: this.headers });
      if (response.ok) {
        const data = await response.json();
        remote = data.data || [];
      }
    } catch (error) {
      console.error('Error fetching remote bibles:', error);
    }

    return [...local, ...remote];
  }

  async getBooks(bibleId: string): Promise<Book[]> {
    if (this.isLocal(bibleId)) {
      const manifest = await this.loadLocalManifest(bibleId);
      return manifest.books.map((b) => ({
        id: b.id,
        bibleId,
        abbreviation: b.abbreviation,
        name: b.name,
        nameLong: b.nameLong,
      }));
    }

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
    if (this.isLocal(bibleId)) {
      const book = await this.loadLocalBook(bibleId, bookId);
      return book.chapters.map((c) => ({
        id: c.id,
        bibleId,
        bookId,
        number: c.number,
        reference: c.reference,
      }));
    }

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
    if (this.isLocal(bibleId)) {
      const [bookId] = chapterId.split('.');
      const book = await this.loadLocalBook(bibleId, bookId);
      const ch = book.chapters.find((c) => c.id === chapterId);
      if (!ch) throw new Error(`Local chapter not found: ${chapterId}`);
      return {
        id: ch.id,
        bibleId,
        number: ch.number,
        bookId,
        reference: ch.reference,
        content: ch.content,
        copyright: book.copyright || '',
        verseCount: ch.verseCount || 0,
      };
    }

    try {
      const response = await fetch(
        `${BASE_URL}/bibles/${bibleId}/chapters/${chapterId}?content-type=html&include-notes=false&include-titles=true&include-chapter-numbers=false&include-verse-numbers=true&include-verse-spans=false`,
        { headers: this.headers }
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
}

export const bibleAPI = new BibleAPIService();

// ---- Local-bundle types & registry -----------------------------------------

interface LocalManifest {
  id: string; // e.g. "local:KJV"
  name: string;
  abbreviation: string;
  description?: string;
  language?: { id: string; name: string };
  copyright?: string;
  books: Array<{
    id: string;
    name: string;
    nameLong: string;
    abbreviation: string;
  }>;
}

interface LocalBook {
  id: string;
  name: string;
  nameLong: string;
  copyright?: string;
  chapters: Array<{
    id: string;
    number: string;
    reference: string;
    content: string;
    verseCount?: number;
  }>;
}

// Which translations are expected to be bundled under `public/bibles/{abbr}/`.
// Add an entry here AND run `npm run download:bibles` to ship a new local copy.
export const LOCAL_BIBLE_ABBRS = ['KJV', 'WEB', 'BSB'] as const;

// Popular Bible version IDs for quick access
export const BIBLE_VERSIONS = {
  // Local bundles (preferred when present — instant load, no rate limit).
  KJV_LOCAL: 'local:KJV',
  WEB_LOCAL: 'local:WEB',
  BSB_LOCAL: 'local:BSB',
  // API.Bible IDs (kept for licensed translations).
  KJV: 'de4e12af7f28f599-02',
  NIV: '78a9f6124f344018-01',
  ESV: 'f421fe261da7624f-01',
  ASV: '06125adad2d5898a-01',
  WEB: '9879dbb7cfe39e4d-01',
};
