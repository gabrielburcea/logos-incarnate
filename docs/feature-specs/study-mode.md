# Feature Spec: Study Mode

## Summary

Study Mode transforms Bible reading into an active workspace for annotation, reflection, and investigation.

## Goals

- Make verses easier to study visually
- Support multiple forms of annotation
- Keep the reading experience uncluttered when Study Mode is off

## Core Features

### Mode Toggle
- Users can switch between Reading Mode and Study Mode

### Verse Layout
- Increase space between verses
- Preserve clean alignment and verse numbering
- Optimize the display for markups and notes

### Annotation Types
- highlight (word-based or marker tool)
- underline (word-based or pen tool)
- note (typed or handwritten)
- freehand drawing (SVG-based pen/marker strokes for natural manuscript annotation)

### Note Attachment
Notes should be attachable to:
- a verse
- a verse range
- later: a selected word range

## UX Expectations

### Reading Mode
- minimal distractions
- compact text flow
- optimized for reading continuity

### Study Mode
- expanded spacing
- annotation controls visible
- notes discoverable and editable
- side panel or inline editing supported

## Data Requirements

### Entities
- VerseReference
- Annotation
- Highlight
- Underline
- Note
- UserAnnotationSet

### Required Fields
- id
- userId
- book
- chapter
- verseStart
- verseEnd
- annotationType
- content
- color
- createdAt
- updatedAt

## Acceptance Criteria

- user can toggle modes
- user sees increased spacing in Study Mode
- user can add highlight
- user can add underline
- user can add note
- saved annotations reload correctly
