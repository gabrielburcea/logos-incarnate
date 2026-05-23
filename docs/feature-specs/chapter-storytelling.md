# Feature Spec: Chapter Storytelling

## Summary

Chapter Storytelling allows users to turn Bible chapters into visual teaching flows, storyboards, and eventually mini-movies.

## Goals

- help users communicate chapter meaning visually
- capture themes, subtleties, and movement in the text
- support teachers, group leaders, and devotional creators

## Recommended First Version

Start with a storyboard system instead of full video generation.

## Core Features

### Chapter to Scene Builder
- select a chapter
- break the chapter into scenes
- assign verse ranges to scenes

### Scene Notes
- attach observations
- add teaching themes
- add emotional or narrative emphasis

### Presentation Output
- show scenes in order
- allow a shareable presentation or exportable study flow

## Future Expansion
- image prompts
- narration text
- slide transitions
- audio
- video export

## Data Requirements

### Entities
- StoryProject
- ChapterScene
- SceneNote
- VerseRange
- ThemeTag

## Acceptance Criteria

- user can create a chapter storyboard
- user can add multiple scenes
- user can attach notes to scenes
- user can review the storyboard in sequence
- user can share or export a lightweight presentation format
