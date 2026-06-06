/**
 * Walks rendered USFM Bible HTML and tags each English word with the
 * Strong's number for its underlying Hebrew/Greek lemma.
 *
 * Strategy
 * --------
 * The Bible HTML uses USFM markup like:
 *
 *   <p class="p">
 *     <span class="v" data-number="18" data-sid="GEN 2:18">18</span>
 *     And the LORD God said, It is not good that the man should be alone…
 *   </p>
 *
 * For every verse marker we know which `BOOK.CH.VS` it represents (from
 * `data-sid`). We walk text nodes that follow that marker until the next
 * verse and split them on word boundaries. For each word we look up the
 * Strong's via the alignment data (KJV exact match, fuzzy lemma-bridge for
 * other translations).
 *
 * Each tagged word becomes:
 *
 *   <span class="meaning-anchor"
 *         data-strongs="H5828"
 *         data-word="helper"
 *         data-verse="GEN.2.18">helper<sup class="meaning-info-icon">i</sup></span>
 *
 * One delegated click listener on the chapter container handles all icons.
 */

import type { VerseAlignment } from "@/lib/services/meaning-api";

interface WrapMeaningWordsArgs {
  /** The chapter container. We walk verse spans inside it. */
  container: HTMLElement;
  /** USFM book id, e.g. "GEN". */
  bookId: string;
  /** Numeric chapter, e.g. "2". */
  chapterNumber: string;
  /** KJV alignment data for the entire Bible (or at least this book). */
  alignment: Record<string, VerseAlignment>;
}

/**
 * Words we NEVER wrap, regardless of whether they have a Strong's number
 * in the alignment data. The KJV alignment marks function words like
 * "the", "of", "is", etc. with Strong's codes (often H853 / H1961 / etc.)
 * — but tagging every one of those would drown the reader in noise.
 *
 * Strategy: filter aggressively to function words. Content words pass
 * through. Result: roughly 3–5 anchors per verse instead of 30.
 */
const SKIP_WORDS: Set<string> = new Set([
  // Articles
  "a", "an", "the",
  // Copulas + archaic forms (KJV uses "art / wast / wert")
  "am", "is", "are", "was", "were", "be", "been", "being",
  "art", "wast", "wert",
  // Auxiliaries / modals + archaic forms
  "have", "has", "had", "do", "does", "did", "doing", "done",
  "hast", "hath", "doth", "didst",
  "shall", "will", "would", "should", "could", "may", "might",
  "can", "must", "ought",
  "shalt", "wilt", "shouldst", "wouldst", "couldst",
  "mayst", "mightst", "canst",
  // Pronouns (subject + object + possessive + reflexive)
  "i", "you", "he", "she", "it", "we", "they",
  "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their",
  "mine", "yours", "hers", "ours", "theirs",
  "myself", "yourself", "himself", "herself", "itself",
  "ourselves", "yourselves", "themselves",
  // Demonstratives + interrogatives
  "this", "that", "these", "those",
  "who", "whom", "whose", "which", "what",
  // Archaic pronouns (KJV)
  "thou", "thee", "thy", "thine", "ye", "thyself",
  // Prepositions
  "of", "in", "on", "at", "by", "to", "from", "for", "with",
  "into", "onto", "upon", "unto", "out", "off",
  "through", "throughout", "over", "under",
  "above", "below", "before", "after",
  "between", "among", "amongst", "against",
  "without", "within", "about", "around", "across", "behind",
  "beside", "beyond", "during",
  // Conjunctions
  "and", "or", "but", "so", "yet", "nor",
  "if", "as", "because", "when", "while", "whilst",
  "then", "than", "though", "although",
  "since", "until", "till", "unless",
  "where", "wherein", "whereby", "whence", "whither",
  // Negation
  "no", "not", "none", "nay", "never",
  // Quantifiers / determiners
  "all", "any", "some", "many", "much", "more", "most",
  "few", "less", "least",
  "every", "each", "both", "either", "neither",
  "one", "two", "three",
  // Misc fillers / interjections / KJV particles
  "there", "here",
  "also", "only", "just", "even", "very", "ever",
  "again", "always", "now", "often", "sometimes",
  "yea", "behold", "lo", "oh", "oft",
]);

/** Returns true if the node belongs to a footnote / cross-reference / chapter num. */
function isInsideNonProse(node: Node): boolean {
  let el: HTMLElement | null = (node.nodeType === Node.ELEMENT_NODE
    ? (node as HTMLElement)
    : node.parentElement) as HTMLElement | null;
  while (el) {
    if (el.classList) {
      // Verse marker, footnote, cross-reference, chapter number, section heading
      if (
        el.classList.contains("v") ||
        el.classList.contains("f") ||
        el.classList.contains("x") ||
        el.classList.contains("c") ||
        el.classList.contains("cl") ||
        el.classList.contains("cp") ||
        el.classList.contains("s") ||
        el.classList.contains("s1") ||
        el.classList.contains("s2") ||
        el.classList.contains("ms") ||
        el.classList.contains("ms1") ||
        el.classList.contains("d") ||
        el.classList.contains("r") ||
        el.classList.contains("mt1") ||
        el.classList.contains("mt2") ||
        el.classList.contains("meaning-anchor") // already-tagged
      ) {
        return true;
      }
    }
    el = el.parentElement;
  }
  return false;
}

/**
 * Find every text node inside `root`, in document order, but only the ones
 * that should be word-tagged (skip footnotes, headings, etc.).
 */
function collectTextNodes(root: HTMLElement): Text[] {
  const result: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent || !node.textContent.trim()) {
        return NodeFilter.FILTER_REJECT;
      }
      if (isInsideNonProse(node)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    },
  });
  let n: Node | null;
  while ((n = walker.nextNode())) {
    result.push(n as Text);
  }
  return result;
}

/**
 * Get the verse reference (e.g. "GEN.2.18") for a given text node, by
 * walking previous siblings/ancestors until we hit a `<span class="v">`.
 */
function findVerseRefForNode(
  node: Text,
  bookId: string,
  chapterNumber: string,
): string | null {
  // Walk backwards through the document to find the most recent .v marker.
  let cursor: Node | null = node;
  while (cursor) {
    let prev: Node | null = cursor.previousSibling;
    // Walk backwards through siblings.
    while (prev) {
      if (
        prev.nodeType === Node.ELEMENT_NODE &&
        (prev as HTMLElement).classList?.contains("v")
      ) {
        const sid = (prev as HTMLElement).getAttribute("data-sid");
        if (sid) {
          // sid is "GEN 2:18" — convert to "GEN.2.18".
          return sid.replace(" ", ".").replace(":", ".");
        }
        const num = (prev as HTMLElement).getAttribute("data-number");
        if (num) return `${bookId}.${chapterNumber}.${num}`;
      }
      // Recurse into the last child of this previous element to find verses
      // that may be inside it.
      if (prev.nodeType === Node.ELEMENT_NODE) {
        const inside = (prev as HTMLElement).querySelectorAll(".v");
        if (inside.length > 0) {
          const last = inside[inside.length - 1];
          const sid = last.getAttribute("data-sid");
          if (sid) return sid.replace(" ", ".").replace(":", ".");
          const num = last.getAttribute("data-number");
          if (num) return `${bookId}.${chapterNumber}.${num}`;
        }
      }
      prev = prev.previousSibling;
    }
    // Move up to parent and continue the backwards walk.
    cursor = cursor.parentNode;
  }
  return null;
}

/**
 * Replace a Text node with a sequence of word spans + raw text whitespace.
 * For each word, look up its Strong's via the alignment; if found, wrap it
 * in `<span class="meaning-anchor">` with an info icon.
 */
function tagTextNode(
  textNode: Text,
  verseRef: string,
  alignment: Record<string, VerseAlignment>,
): void {
  const text = textNode.textContent ?? "";
  if (!text.trim()) return;

  const verseAlignment = alignment[verseRef];
  if (!verseAlignment) return;

  // Split on word boundaries while preserving the original whitespace and
  // punctuation between words.
  const parts = text.split(/(\b[A-Za-z'’]+\b)/);
  const fragment = document.createDocumentFragment();
  let didTag = false;

  for (const part of parts) {
    if (!part) continue;
    if (/^[A-Za-z'’]+$/.test(part)) {
      const lower = part.toLowerCase();
      if (SKIP_WORDS.has(lower)) {
        fragment.appendChild(document.createTextNode(part));
        continue;
      }
      const codes = verseAlignment[lower];
      if (codes && codes.length > 0) {
        // Wrap the word in an INVISIBLE anchor span. No icon, no underline,
        // no color shift — visually indistinguishable from surrounding text.
        // The popover is triggered by hover (cursor pause) or tap.
        const wrap = document.createElement("span");
        wrap.className = "meaning-anchor";
        wrap.dataset.strongs = codes[0];
        wrap.dataset.word = part;
        wrap.dataset.verse = verseRef;
        wrap.textContent = part;
        fragment.appendChild(wrap);
        didTag = true;
      } else {
        fragment.appendChild(document.createTextNode(part));
      }
    } else {
      // Whitespace, punctuation, etc. — leave as-is.
      fragment.appendChild(document.createTextNode(part));
    }
  }

  if (didTag) {
    textNode.replaceWith(fragment);
  }
}

/**
 * Main entry. Mutates `container` so every translatable English word is
 * wrapped in a `.meaning-anchor` span with the right data attributes.
 *
 * Idempotent — already-tagged content is skipped (see isInsideNonProse).
 */
export function wrapMeaningWords({
  container,
  bookId,
  chapterNumber,
  alignment,
}: WrapMeaningWordsArgs): void {
  const textNodes = collectTextNodes(container);
  for (const node of textNodes) {
    const ref = findVerseRefForNode(node, bookId, chapterNumber);
    if (!ref) continue;
    tagTextNode(node, ref, alignment);
  }
}
