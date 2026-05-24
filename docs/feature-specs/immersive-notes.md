# Feature Spec: Immersive Notes

## Summary

Immersive Notes transforms Bible reading into a living study manuscript.

The goal is to allow readers to annotate the Bible text in a way that feels like writing in a real physical Bible, while preserving those notes visually inside the reading experience.

## Goals

- let users annotate directly on the reading surface
- preserve notes visually on the page
- make notes feel handwritten, anchored, and personal
- support a manuscript-like study experience

## Core User Experience

A user opens a chapter in Reading Mode.

The user enters Study Manuscript Mode.

The text layout opens up with more space, annotation controls, and margin room.

The user can then add highlights, underlines, handwritten-style notes, and simple visual connectors.

When the user returns later, the chapter still appears as their annotated study manuscript.

## Annotation Layers

### 1. Text Styling Layer
- highlight
- underline
- circle
- colour emphasis

### 2. Margin Notes Layer
- handwritten-style note cards
- notes anchored to verses or word ranges
- visual placement near the related text

### 3. SVG Drawing Layer
- freehand pen/marker strokes
- arrows connecting concepts
- lines and connectors between words or phrases
- circles, brackets, and visual emphasis marks
- all stored as scalable vector graphics (SVG) for quality and future animation integration

## Anchoring Model

Annotations should support anchoring to:
- verse
- verse range
- word range
- SVG coordinate positions for freehand drawings
- relative positioning for responsive layout compatibility

## Persistence

The visual placement and appearance of notes should be saved so that the annotated chapter reopens in the same state.

## Data Requirements

### Entities
- Annotation
- VerseAnchor
- WordAnchor
- MarginNote
- SVGStroke (freehand drawing paths)
- StudyDrawingState

### Required Fields
- id
- userId
- chapterReference
- anchorType
- anchorTarget
- visualPosition
- annotationType
- style
- colour
- content
- createdAt
- updatedAt

## Acceptance Criteria

- user can annotate directly on the reading page
- highlights and underlines remain visible on revisit
- handwritten-style notes remain anchored in place
- simple arrows/connectors can be added
- chapter reopens as a persistent annotated manuscript
