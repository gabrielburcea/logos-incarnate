# Product Roadmap

## Vision

Logos Incarnate is a Bible study platform designed to transform Bible reading into an immersive study experience. The product begins with an ESV-centered reading workflow and expands into deeper tools for annotation, original-language study, genealogy exploration, and chapter-based visual storytelling.

## Product Goals

- Turn reading into study through annotations and workspace tools
- Make original Hebrew and Greek insights accessible during reading
- Help users trace biblical family lines, tribes, and nations
- Enable chapter-based storytelling for teaching and devotion
- Support individual, group, and ministry use cases

## Roadmap Overview

### Phase 1 — Foundation + Study Mode
Build the core reading and study experience.

**Objectives**
- Set up project structure and technical foundation
- Create a chapter/verse reading interface
- Add a Study Mode toggle
- Add double line spacing for verses
- Support highlighting, underlining, and notes
- Save annotation state

**Success Criteria**
- A user can open a chapter in ESV reading mode
- A user can switch to study mode
- A user can highlight, underline, and add notes to verses
- A user’s annotations persist between sessions

---

### Phase 2 — Original Word Study
Add original-language depth to the study experience.

**Objectives**
- Support Hebrew/Greek word lookup tied to verse text
- Show transliteration and lexical definition
- Add repeated-occurrence search for the same source word
- Show English renderings in context
- Build a study panel or inspector UI

**Success Criteria**
- A user can inspect a verse and see original-language data
- A user can search for other appearances of the same word
- A user can compare English renderings in multiple verses

---

### Phase 3 — Genealogy Explorer
Add biblical lineage exploration.

**Objectives**
- Support search for biblical people
- Model genealogical relationships
- Show fathers, descendants, tribes, and nations
- Build a lineage visualization
- Connect genealogy entities to Scripture references

**Success Criteria**
- A user can search for a person and open a genealogy profile
- A user can trace ancestry and descendants visually
- A user can navigate from people to nations or tribes where relevant

---

### Phase 4 — Chapter Storytelling
Turn Bible chapters into teachable visual stories.

**Objectives**
- Build a chapter storyboard workflow
- Allow verse grouping into scenes
- Add notes and thematic overlays per scene
- Support shareable study presentations
- Explore lightweight mini-movie generation later

**Success Criteria**
- A user can create a chapter-based storyboard
- A user can annotate scenes with teaching notes and themes
- A user can export or share the result

---

### Phase 5 — Sharing, Collaboration, and Polish
Improve usability, growth, and teaching workflows.

**Objectives**
- Add study project organization
- Support exports and sharing
- Improve mobile usability
- Add presentation mode for teaching contexts
- Strengthen search, performance, and onboarding

## Dependencies and Risks

### Data and Licensing
- Clarify ESV text usage rights and storage/display restrictions
- Identify source-language datasets and lexicon sources
- Define genealogy data provenance and editorial rules

### Technical Risks
- Word-level mapping between English and Hebrew/Greek may require careful indexing
- Freeform annotations over verse text may require a richer text-anchor model
- Genealogy graphs may become large and require progressive rendering
- Mini-movie generation may need to begin as storyboards, not full rendered video

## Suggested Working Order
1. Project setup and architecture
2. Study Mode MVP
3. Original Word Study basics
4. Genealogy explorer basics
5. Storyboard creation
6. Sharing and polish
