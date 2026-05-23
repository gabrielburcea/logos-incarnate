# Feature Spec: Meaning Explorer

## Summary

Meaning Explorer is a meaning-first study system that helps readers understand words, people, places, themes, and passages without overwhelming them with too much raw information.

The aim is to provide clarity first, then depth.

## Goals

- help readers grasp the core meaning of a word or concept in context
- show how often a word or concept appears
- show where else it appears
- explain what those occurrences contribute to meaning
- give concise but deep contextual analysis
- support guided interpretation anchored in structured biblical data

## Core User Experience

When a user taps or selects a word, person, place, phrase, or theme, the app should display a meaning card or expandable meaning panel.

The first layer should remain concise and digestible.

The user should then be able to expand into deeper analysis.

## Core Sections

### 1. Core Meaning
- a concise explanation of the meaning in this passage
- original-language anchor where relevant
- a short summary of the idea in context

### 2. Occurrence Count
- how many times the word or idea appears
- how many times it appears in the same testament or section
- optional distribution by book or category

### 3. Key Related Occurrences
- the most important other places where the word or concept appears
- not every result by default
- a curated or ranked subset first

### 4. Contextual Analysis
- what the term means in this verse
- why it matters in this scene
- what role it plays in the narrative
- what cultural or literary insight is relevant

### 5. Biblical Development
- how this meaning develops elsewhere
- how the concept is deepened or echoed in other passages

### 6. Concise Interpretive Summary
- a short synthesis grounded in the data and context
- suitable for readers who want clarity without overload

## Example Direction

For a word such as "helper" in Genesis 2, the feature should present:
- the original word
- occurrence count
- selected key occurrences elsewhere
- analysis of what those occurrences suggest
- explanation of the word in Genesis 2 specifically
- synthesis of its meaning in relation to woman in the passage

## Expansion Model

The experience should be layered:

### Default Layer
- concise meaning
- occurrence count
- 3 to 5 key related passages
- short contextual summary

### Expanded Layer
- wider occurrence list
- original-language detail
- more extensive analysis
- graph links
- person/place/theme connections

## Data Requirements

### Primary Entities
- MeaningTarget
- WordMeaning
- PersonMeaning
- PlaceMeaning
- ThemeMeaning
- PassageMeaning
- OccurrenceReference
- ContextAnalysis
- InterpretationSummary

### Required Fields
- targetType
- targetId
- displayLabel
- originalForm
- transliteration
- occurrenceCount
- relatedReferences
- coreMeaning
- contextualAnalysis
- interpretiveSummary
- confidenceLevel

## Acceptance Criteria

- user can tap a supported target and receive a concise meaning view
- user can see occurrence count
- user can see key related occurrences
- user can read contextual analysis
- user can expand into deeper detail if desired
- the default experience remains clear and not overloaded
