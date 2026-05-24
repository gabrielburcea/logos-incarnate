/**
 * Parse HTML content from API.Bible into structured verses
 */

export interface ParsedVerse {
  number: number;
  text: string;
  verse: string;
}

export function parseHTMLToVerses(htmlContent: string): ParsedVerse[] {
  if (!htmlContent) return [];
  
  // Create a temporary DOM parser (server-safe)
  if (typeof window === 'undefined') {
    // Server-side: use a simple regex approach
    return parseHTMLWithRegex(htmlContent);
  }
  
  // Client-side: use DOMParser
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const verses: ParsedVerse[] = [];
  const verseElements = doc.querySelectorAll('.verse');
  
  verseElements.forEach((verseEl, index) => {
    const verseNumber = verseEl.querySelector('.v')?.textContent?.trim() || `${index + 1}`;
    const verseText = verseEl.textContent?.replace(/^\d+\s*/, '').trim() || '';
    
    verses.push({
      number: parseInt(verseNumber) || index + 1,
      text: verseText,
      verse: verseNumber,
    });
  });
  
  return verses;
}

function parseHTMLWithRegex(htmlContent: string): ParsedVerse[] {
  const verses: ParsedVerse[] = [];
  
  // Match verse numbers and content
  // API.Bible format: <span class="v">1</span>verse text here
  const versePattern = /<span[^>]*class="v"[^>]*>(\d+)<\/span>([^<]*(?:<[^>]*>[^<]*<\/[^>]*>)*[^<]*)/gi;
  
  let match;
  while ((match = versePattern.exec(htmlContent)) !== null) {
    const verseNumber = parseInt(match[1]) || verses.length + 1;
    const verseText = match[2]
      .replace(/<[^>]*>/g, ' ') // Remove HTML tags
      .replace(/\s+/g, ' ')      // Normalize whitespace
      .trim();
    
    verses.push({
      number: verseNumber,
      text: verseText,
      verse: match[1],
    });
  }
  
  return verses;
}
