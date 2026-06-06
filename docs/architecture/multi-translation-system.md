# Multi-Translation Bible Version System

## Overview

Logos Incarnate supports multiple Bible translations and languages, allowing users to read and study Scripture in their preferred version while maintaining consistent meaning exploration grounded in original Hebrew/Greek.

## Core Principle

**Original language remains the anchor.** 

All translations are variations of the same underlying Hebrew/Greek text. The meaning explorer, word studies, and graph connections are based on the original languages, ensuring consistency across all translations.

## Architecture

### Data Structure

```typescript
interface BibleTranslation {
  id: string;              // e.g., "esv", "niv", "kjv", "nlt"
  name: string;            // e.g., "English Standard Version"
  abbreviation: string;    // e.g., "ESV"
  language: string;        // e.g., "English", "Spanish", "Chinese"
  languageCode: string;    // e.g., "en", "es", "zh"
  copyright: string;       // Copyright/license info
  isPublicDomain: boolean;
  year: number;            // Publication year
}

interface Chapter {
  book: string;
  chapter: number;
  title: string;
  translations: {
    [translationId: string]: {
      verses: Verse[];
      copyright?: string;
    };
  };
}

interface Verse {
  number: number;
  text: string;
  originalWords?: {        // Links to Hebrew/Greek
    [wordIndex: number]: {
      strong: string;      // Strong's number
      lemma: string;       // Hebrew/Greek lemma
      transliteration: string;
    };
  };
  focusTargetIds?: MeaningTargetId[];
}
```

## Translation Selection UI

### Location Options

**Option A: Header Navigation (Recommended)**
```
┌─────────────────────────────────────────┐
│  ← Back  |  Genesis 2  |  [ESV ▼]      │
└─────────────────────────────────────────┘
```

**Option B: Reading/Study Mode Toggle Area**
```
┌─────────────────────────────────────────┐
│  [Reading] [Study]         [ESV ▼]      │
└─────────────────────────────────────────┘
```

**Option C: Floating Settings Panel**
- Appears on demand
- Doesn't clutter reading experience
- Shows full translation list with descriptions

### Dropdown Contents

```
Current: ESV - English Standard Version

Popular English:
  ☑ ESV - English Standard Version
  ○ NIV - New International Version
  ○ NKJV - New King James Version
  ○ NLT - New Living Translation
  ○ KJV - King James Version (current)
  ○ NASB - New American Standard Bible

Spanish:
  ○ RVR1960 - Reina-Valera 1960
  ○ NVI - Nueva Versión Internacional

[Add more translations...]
```

## How Translation Switching Works

### User Experience

1. User reads Genesis 2 in ESV
2. User adds annotations (SVG drawings, word highlights)
3. User clicks translation dropdown
4. User selects "NIV"
5. Text instantly switches to NIV
6. **Annotations remain in place** (position-based)
7. **Meaning Explorer still shows Hebrew "ezer"** (original language anchor)
8. Graph connections unchanged (based on Hebrew/Greek)

### Technical Flow

```typescript
// User state
const [selectedTranslation, setSelectedTranslation] = useState<string>("esv");

// Fetch chapter data with translation
const chapterData = getChapter("genesis", 2, selectedTranslation);

// Annotations are translation-independent
interface Annotation {
  verseNumber: number;
  wordIndex?: number;      // Position in verse, not translation-specific
  svgPath?: string;        // Coordinate-based drawing
  color: string;
  toolType: "pen" | "marker";
}
```

## Translation Support

### Included Translations (Public Domain)
- **KJV** - King James Version (1611, public domain)
- **ASV** - American Standard Version (1901, public domain)
- **WEB** - World English Bible (public domain)

### Future Additions (Require Licensing)
- ESV - English Standard Version
- NIV - New International Version
- NLT - New Living Translation
- NKJV - New King James Version
- NASB - New American Standard Bible
- CSB - Christian Standard Bible

## Translation Storage

### Static JSON Files
```
/lib/translations/
  ├── genesis-2-kjv.json
  ├── genesis-2-esv.json
  ├── genesis-2-niv.json
  └── genesis-2-rvr1960.json
```

### Future: Database
```sql
CREATE TABLE translations (
  id VARCHAR PRIMARY KEY,
  name VARCHAR,
  abbreviation VARCHAR,
  language VARCHAR,
  copyright TEXT,
  is_public_domain BOOLEAN
);

CREATE TABLE verses (
  book VARCHAR,
  chapter INT,
  verse INT,
  translation_id VARCHAR,
  text TEXT,
  PRIMARY KEY (book, chapter, verse, translation_id)
);

CREATE TABLE original_words (
  id VARCHAR PRIMARY KEY,
  book VARCHAR,
  chapter INT,
  verse INT,
  word_index INT,
  strong_number VARCHAR,
  lemma VARCHAR,
  transliteration VARCHAR,
  definition TEXT
);
```

## Original Language Linking

**Key Concept:** All translations point back to the same Hebrew/Greek words.

### Example: Genesis 2:18 "helper"

```typescript
{
  translations: {
    esv: "I will make him a helper fit for him",
    niv: "I will make a helper suitable for him",
    kjv: "I will make him an help meet for him",
    nlt: "I will make a helper who is just right for him",
    spanish_rvr1960: "le haré ayuda idónea para él"
  },
  
  originalWords: {
    helper: {
      strong: "H5828",
      lemma: "עֵזֶר (ezer)",
      transliteration: "ezer",
      definition: "help, helper, aid",
      occurrences: 21,
      meaning: "One who provides necessary support..."
    }
  }
}
```

### Meaning Explorer Behavior

Regardless of translation selected:
- Shows same Hebrew word "ezer" (עֵזֶר)
- Same Strong's number H5828
- Same occurrence count (21 times)
- Same related passages (based on Hebrew, not English)
- **English rendering varies by translation**, but core meaning stays grounded

## Annotation Persistence Across Translations

### Challenge
Text length varies between translations:
- KJV: "an help meet for him" (5 words)
- ESV: "a helper fit for him" (5 words)  
- NLT: "a helper who is just right for him" (8 words)

### Solution: Dual Anchoring System

**1. Word-based annotations** (highlights/underlines)
```typescript
{
  type: "word-highlight",
  verseNumber: 18,
  originalWordId: "H5828",  // Links to Hebrew "ezer"
  translationWordIndex: {
    esv: 6,    // "helper" position in ESV
    kjv: 6,    // "help" position in KJV
    niv: 6,    // "helper" position in NIV
  }
}
```

**2. Freehand SVG annotations** (drawings)
```typescript
{
  type: "svg-drawing",
  verseNumber: 18,
  svgPath: "M 100,200 L 300,200",  // Absolute coordinates
  translationId: "esv",             // Which translation it was drawn on
  requiresRepositioning: true       // Flag for manual adjustment
}
```

### Translation Switch Warning

When switching translations with freehand drawings:
```
┌─────────────────────────────────────────┐
│  Switch to NIV?                          │
│                                          │
│  Your word highlights will stay linked. │
│  Freehand drawings may need adjustment  │
│  due to text length differences.        │
│                                          │
│  [Switch Anyway]  [Cancel]              │
└─────────────────────────────────────────┘
```

## Future Features

### Phase 2: Smart Reflow
- AI detects annotation intent
- Automatically repositions drawings when switching translations
- "This underline was under 'helper' in ESV → place under 'helper' in NIV"

### Phase 3: Parallel View
- Show two translations side-by-side
- Highlight corresponding words across translations
- Useful for translation comparison studies

### Phase 4: User Translation Preferences
- Set default translation per book
- "I prefer ESV for Psalms, NIV for Paul's letters"
- Auto-switch based on context

## Copyright & Licensing

### Public Domain Translations
- KJV, ASV, WEB - freely available
- No API fees or restrictions
- Can display full text

### Commercial Translations
- ESV, NIV, NLT, NASB - require licensing
- Options:
  - API access (Crossway, Biblica)
  - One-time licensing fees
  - Usage limits (verses per day)
- May restrict certain features (bulk export, offline access)

### Recommended API Providers
- **API.Bible** - Multiple translations, free tier available
- **ESV API** - Official Crossway API for ESV
- **YouVersion API** - Many translations, partnership program
- **BibleGateway** - Comprehensive but complex licensing

## Implementation Priority

### Current
1. Support 2-3 translations (KJV + 1-2 public domain)
2. Basic dropdown selector
3. Text switching without page reload
4. Word-based annotations stay linked

### Phase 1 (Next)
1. Add ESV, NIV (via API or licensing)
2. Translation info panel (copyright, year, description)
3. Popular translations list
4. User preference persistence

### Phase 2 (Future)
1. Smart annotation repositioning
2. Multi-language support (Spanish, Chinese, etc.)
3. Parallel translation view
4. Translation comparison tools

### Phase 3 (Long-term)
1. 20+ translations across 10+ languages
2. Advanced original language tooltips
3. Interlinear view (Hebrew/Greek + translation)
4. Custom translation upload (for private use)

## Acceptance Criteria

- User can select Bible translation from dropdown
- Text updates instantly when translation changes
- Word-based annotations (highlights/underlines) remain linked to original words
- Meaning Explorer shows same Hebrew/Greek regardless of translation
- Graph connections unchanged across translations
- Reading experience remains calm and uncluttered
- Translation preference saved in localStorage
- Works seamlessly in both Reading and Study modes
