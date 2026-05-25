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
  const verseSpans = doc.querySelectorAll('span.v[data-number]');
  
  verseSpans.forEach((verseSpan) => {
    const verseNumber = verseSpan.getAttribute('data-number') || verseSpan.textContent?.trim() || '1';
    const num = parseInt(verseNumber) || 1;
    
    // Get text after this verse marker until next verse marker
    let verseText = '';
    let currentNode = verseSpan.nextSibling;
    
    while (currentNode) {
      // Stop at next verse marker
      if (currentNode.nodeType === Node.ELEMENT_NODE && 
          (currentNode as Element).classList.contains('v')) {
        break;
      }
      
      // Collect text
      if (currentNode.nodeType === Node.TEXT_NODE) {
        verseText += currentNode.textContent;
      } else if (currentNode.nodeType === Node.ELEMENT_NODE) {
        verseText += (currentNode as Element).textContent;
      }
      
      currentNode = currentNode.nextSibling;
    }
    
    verses.push({
      number: num,
      text: verseText.trim(),
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
