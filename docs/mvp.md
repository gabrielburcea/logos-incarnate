# MVP Definition

## Goal

The MVP for Logos Incarnate should prove that Bible reading can be transformed into Bible study in a natural, useful, and visually rich way.

The first release should focus on the smallest feature set that delivers clear study value without requiring the full long-term vision to be completed.

## MVP Scope

The MVP includes:

1. Bible reading interface
2. Study Mode toggle
3. Verse formatting for study
4. Annotation tools
5. Basic original word lookup
6. Basic genealogy exploration

## In Scope

### 1. Bible Reading Interface
- Display Bible books, chapters, and verses
- Render chapter text in a clean reading view
- Allow navigation between chapters

### 2. Study Mode Toggle
- Toggle between:
  - Reading Mode
  - Study Mode
- Study Mode should optimize the screen for annotation and investigation

### 3. Verse Formatting for Study
- Add larger spacing between verses
- Preserve verse numbering
- Improve readability for note-taking and markup

### 4. Annotation Tools
- Highlight verses in multiple colours
- Underline verses or text ranges
- Add notes attached to verses
- Persist annotations for each user

### 5. Basic Original Word Lookup
- Allow selection of a verse or word
- Display:
  - original word
  - transliteration
  - definition
- Link to a small set of related occurrences for the same source word

### 6. Basic Genealogy Exploration
- Search major biblical figures
- Show a basic lineage view
- Display father/descendant relationships where available
- Link genealogy data back to Scripture references

## Out of Scope for MVP

The following should not block the first release:

- Full lexical search across the whole Bible
- Advanced morphology filtering
- Fully editable freehand writing layers
- Full-screen genealogy graph for every person
- Mini-movie rendering
- Collaboration and sharing
- Export to presentation/video formats

## User Stories

### Reader / Student
- As a reader, I want to switch to Study Mode so I can examine the text more carefully.
- As a reader, I want to highlight and underline verses so I can remember important insights.
- As a reader, I want to add notes to verses so I can record observations and prayers.

### Word Study User
- As a student of Scripture, I want to inspect the original word behind a verse so I can understand its meaning more deeply.
- As a student of Scripture, I want to see other places the same word appears so I can compare usage.

### Genealogy User
- As a learner, I want to search a biblical person and see their lineage so I can understand context and relationships.

## MVP Success Criteria

The MVP is successful if:

- users can read and navigate Bible chapters
- users can switch into Study Mode
- users can highlight, underline, and annotate verses
- users can inspect at least basic original-language data
- users can explore at least a starter genealogy experience
- the experience is stable, clear, and useful enough for repeated study sessions

## Suggested Build Order

1. Chapter and verse rendering
2. Study Mode layout
3. Annotation persistence
4. Original word inspector
5. Basic genealogy explorer

## Open Questions

- What exact ESV access/storage model will be used?
- What text anchoring model should notes and highlights use?
- What original-language data source will back the lookup panel?
- Which biblical people should be included in the first genealogy dataset?
