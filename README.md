# Logos Incarnate

Logos Incarnate is a Bible study platform centered on transforming Scripture reading into an active, research-rich study experience.

## Vision

This project aims to make Bible reading more interactive by turning a standard reading view into a full Bible study workspace. The goal is to support readers, teachers, students, and small groups with tools for annotation, original-language study, genealogy exploration, and visual storytelling.

## Core Product Direction

The initial product direction includes four major capabilities:

### 1. Reading Mode to Study Mode
- Transform Bible reading into a study workspace.
- Add increased spacing between verses for easier note-taking.
- Let users underline verses, highlight text with different colours, and write notes directly on passages.
- Support a clean reading mode and a richer study mode as two distinct experiences.

### 2. Original Word Study
- Enable lookup of the original Hebrew and Greek words behind a verse.
- Show lexical definitions and word-level study data.
- Map where the same original word appears throughout Scripture.
- Display English translations alongside original-language forms and definitions.

### 3. Genealogy and Biblical Lineage Exploration
- Trace biblical people through fathers, descendants, tribes, and nations.
- Build lineage views that help users understand historical and relational context.
- Support navigation between people, families, and nation-level connections.

### 4. Chapter Storytelling and Mini-Movie Creation
- Let users create short visual summaries or mini-movies from Bible chapters.
- Capture themes, subtleties, and narrative flow.
- Support educational, devotional, and teaching use cases.

## Proposed MVP

A practical first release could focus on:
- ESV reading view with verse spacing
- Highlights, underlining, and note-taking
- Basic original word lookup for selected verses
- A first-pass genealogy explorer for major biblical figures

## Suggested Architecture Areas

As development begins, the repository will likely grow into areas such as:
- `frontend/` for Bible reading and study interfaces
- `backend/` for APIs, user content, and search services
- `data/` for lexical, genealogical, and Bible-reference datasets
- `media/` for chapter visualization and story composition assets
- `docs/` for product planning and technical decisions

## Roadmap

### Phase 1
- Establish project structure
- Build Bible reading interface
- Add study annotations
- Define data models for notes, highlights, and verse references

### Phase 2
- Add original word search and lexical detail
- Build cross-reference mapping for repeated original words

### Phase 3
- Add genealogy graph and lineage navigation
- Model relationships among persons, tribes, and nations

### Phase 4
- Prototype chapter mini-movie creation
- Explore storyboard, timeline, and export workflows

## Users

This platform is intended for:
- individual Bible readers
- Bible study group leaders
- teachers and preachers
- students of Scripture
- researchers interested in biblical language and lineage

## Status

This repository is in its initial planning stage.

The next steps are:
1. define the MVP in detail
2. create feature issues
3. choose the technical stack
4. begin implementation of the reading-to-study experience

## Repository

GitHub repository: `gabrielburcea/logos-incarnate`
