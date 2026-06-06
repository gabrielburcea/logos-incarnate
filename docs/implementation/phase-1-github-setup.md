# Phase 1 GitHub Setup — Genesis 2 Vertical Slice

## Milestone

### Title
Phase 1 — Genesis 2 Vertical Slice

### Description
Phase 1 focuses on proving the core distinctiveness of Logos Incarnate through a polished Genesis 2 experience.

This milestone should validate that the product can combine:
- elegant chapter reading
- Study Manuscript Mode
- persistent manuscript-style annotations
- Meaning Explorer for selected targets
- a restrained graph preview

The goal is not broad coverage.

The goal is to prove the product's identity through one narrow but compelling vertical slice.

---

## Suggested Labels

- phase-1
- genesis-2
- vertical-slice
- reader
- study-mode
- annotations
- meaning-explorer
- graph
- design
- frontend

Minimum set if you want fewer:
- phase-1
- genesis-2
- vertical-slice

---

## Tracking Issue

### Title
Phase 1 tracking issue — Genesis 2 vertical slice

### Body
## Goal

Track the full Phase 1 Genesis 2 vertical slice implementation.

This phase is intended to prove the core distinctiveness of Logos Incarnate through one polished chapter experience.

## Phase 1 Scope

- Genesis 2 reader UI
- Study Manuscript Mode
- persistent highlights, underlines, and handwritten-style notes
- Meaning Explorer for selected Genesis 2 targets
- graph preview for selected targets

## Linked Work

- [ ] Build Genesis 2 reader UI for Phase 1 vertical slice
- [ ] Implement Study Manuscript Mode layout and interaction model
- [ ] Add persistent highlights, underlines, and handwritten-style notes
- [ ] Build Meaning Explorer card for selected Genesis 2 targets
- [ ] Add graph preview for selected Genesis 2 words, people, and themes

## Success Criteria

Phase 1 is successful if:
- Genesis 2 feels elegant and compelling to read
- Study Manuscript Mode feels distinct and useful
- annotations persist visually after reopen
- Meaning Explorer adds immediate insight
- graph preview improves understanding without overload

## Notes

Reference docs:
- `docs/founder-notes.md`
- `docs/product-roadmap.md`
- `docs/implementation/phase-1-genesis-2.md`
- `docs/architecture/ai-meaning-engine.md`
- `docs/architecture/knowledge-graph.md`
- `docs/decisions/001-start-with-genesis-2.md`

Suggested labels:
- phase-1
- genesis-2
- vertical-slice

Milestone:
- Phase 1 — Genesis 2 Vertical Slice

---

## Issue 1

### Title
Build Genesis 2 reader UI for Phase 1 vertical slice

### Body
## Background

The Genesis 2 reader UI is the foundation of the Phase 1 vertical slice.

It should provide a calm, elegant reading experience that becomes the entry point for Study Manuscript Mode, Meaning Explorer, and graph preview interactions.

## Scope

- render Genesis 2 in a clean reading layout
- show verse numbers
- support responsive layout
- provide a visible entry point for Study Manuscript Mode

## Acceptance Criteria

- Genesis 2 displays in a visually calm, elegant chapter view
- verse numbers are visible and readable
- layout adapts gracefully to target screen sizes
- Study Manuscript Mode entry point is clear and functioning

## Notes

This issue should focus on the chapter reading foundation, not annotation persistence or meaning features.

Suggested labels:
- phase-1
- genesis-2
- vertical-slice
- reader
- frontend

Milestone:
- Phase 1 — Genesis 2 Vertical Slice

---

## Issue 2

### Title
Implement Study Manuscript Mode layout and interaction model

### Body
## Background

Study Manuscript Mode is one of the core differentiators of the product.

It should transform the normal reading surface into a manuscript-style study environment that creates room for annotation while preserving readability and reverence.

## Scope

- enable switching between reading mode and Study Manuscript Mode
- increase verse or line spacing in study mode
- create room for margin-style interaction
- provide annotation toolbar or annotation entry affordances
- preserve text readability and visual calm

## Acceptance Criteria

- user can enter and exit Study Manuscript Mode from the reader UI
- study mode applies clear layout and spacing changes
- study mode creates space for annotation without feeling cluttered
- the text remains readable and visually pleasing

## Dependencies

- depends on the Genesis 2 reader UI

Suggested labels:
- phase-1
- genesis-2
- vertical-slice
- study-mode
- design
- frontend

Milestone:
- Phase 1 — Genesis 2 Vertical Slice

---

## Issue 3

### Title
Add persistent highlights, underlines, and handwritten-style notes

### Body
## Background

Persistent annotation is a core part of the manuscript-style product experience.

Highlights, underlines, and notes should remain visually attached to the reading surface after reload and revisit.

## Scope

- allow users to highlight text
- allow users to underline text
- allow users to attach handwritten-style margin notes
- save annotation state
- restore annotation state on reopen

## Acceptance Criteria

- highlights persist after reload or reopen
- underlines persist after reload or reopen
- margin notes remain visually attached to the intended verse or selection
- chapter reopens with annotation state intact

## Dependencies

- depends on Study Manuscript Mode layout

Suggested labels:
- phase-1
- genesis-2
- vertical-slice
- annotations
- frontend

Milestone:
- Phase 1 — Genesis 2 Vertical Slice

---

## Issue 4

### Title
Build Meaning Explorer card for selected Genesis 2 targets

### Body
## Background

The Meaning Explorer card should provide concise, meaning-first insight for selected Genesis 2 words and concepts.

The first version should focus on a limited set of curated targets.

## Initial Targets

- helper
- woman
- man
- one flesh
- side/rib
- naked / not ashamed

## Scope

- allow user to select a supported target
- open a Meaning Explorer card
- show core meaning
- show occurrence count
- show key related passages
- show concise contextual analysis

## Acceptance Criteria

- selecting a supported target opens a meaning card
- card displays concise meaning-first information
- card includes related passages or references
- card remains readable and does not feel overloaded

## Dependencies

- depends on the Genesis 2 reader UI

Suggested labels:
- phase-1
- genesis-2
- vertical-slice
- meaning-explorer
- frontend

Milestone:
- Phase 1 — Genesis 2 Vertical Slice

---

## Issue 5

### Title
Add graph preview for selected Genesis 2 words, people, and themes

### Body
## Background

The graph preview should help users see key contextual relationships without overwhelming them.

The first version should remain intentionally small and focused.

## Scope

- show a small graph preview for supported targets
- include the selected node and a limited set of related nodes
- keep the structure understandable and visually restrained
- design with future expansion in mind

## Acceptance Criteria

- graph preview is available for supported targets
- graph remains understandable and intentionally limited
- graph adds clarity rather than noise
- preview structure can be expanded later into a fuller graph experience

## Dependencies

- ideally follows the Meaning Explorer card

Suggested labels:
- phase-1
- genesis-2
- vertical-slice
- graph
- frontend

Milestone:
- Phase 1 — Genesis 2 Vertical Slice

---

## Recommended Creation Order

1. create milestone
2. create labels
3. create tracking issue
4. create Issue 1
5. create Issue 2
6. create Issue 3
7. create Issue 4
8. create Issue 5

---

## Recommended Build Order

1. Build Genesis 2 reader UI
2. Implement Study Manuscript Mode
3. Add persistent annotations
4. Build Meaning Explorer card
5. Add graph preview

---

## After Creation

Replace the checklist in the tracking issue with actual issue references, for example:

- [ ] #12 Build Genesis 2 reader UI for Phase 1 vertical slice
- [ ] #13 Implement Study Manuscript Mode layout and interaction model
- [ ] #14 Add persistent highlights, underlines, and handwritten-style notes
- [ ] #15 Build Meaning Explorer card for selected Genesis 2 targets
- [ ] #16 Add graph preview for selected Genesis 2 words, people, and themes
