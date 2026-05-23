# Feature Spec: Graph Explorer

## Summary

Graph Explorer makes biblical relationships visible through a structured, filterable, and expandable knowledge graph.

It should help users see connections among words, people, places, themes, passages, and genealogies.

The graph should reveal meaning, not merely display abstract nodes.

## Goals

- make connections visible and intuitive
- support focused exploration from a selected target
- avoid graph overload through layered presentation
- unify meaning exploration, genealogy, and thematic relationships

## Core User Experience

When a user selects a word, person, place, theme, or verse, the app should show a small graph preview.

The user can then expand into a full graph explorer.

## Graph Layers

### Inline Graph Preview
- appears in a compact card or side panel
- shows immediate key relationships
- optimized for clarity

### Expanded Graph Explorer
- opens into a larger interactive graph canvas
- supports filtering, zooming, and selective expansion
- shows deeper relationships without overwhelming the user by default

## Node Types

- Word
- Lemma
- Person
- Place
- Theme
- Passage
- Event
- Nation
- Tribe
- Genealogy Node

## Edge Types

- appears_in
- associated_with
- related_to
- refers_to
- occurs_with
- parent_of
- child_of
- member_of
- belongs_to
- fulfilled_in
- contrasts_with
- develops_into

## Filters

Users should be able to filter the graph by:
- words
- people
- places
- themes
- genealogies
- passages
- events

## Genealogy Integration

Genealogy should be treated as a graph layer, not a separate disconnected tool.

This allows lineage data to connect naturally to people, nations, tribes, and passages.

## Acceptance Criteria

- user can open a graph preview from a selected target
- user can expand into a larger graph explorer
- user can filter node categories
- user can inspect node details
- user can navigate from graph nodes back to verses or related entities
- graph remains understandable at default zoom/state
