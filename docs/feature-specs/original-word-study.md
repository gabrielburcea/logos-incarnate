# Feature Spec: Original Word Study

## Summary

Original Word Study allows users to inspect the Hebrew or Greek words behind the Bible text and compare occurrences across Scripture.

## Goals

- make source-language study accessible to non-specialists
- connect English rendering to original-language meaning
- support word-level exploration without overwhelming the user

## Core Features

### Word Inspection
When a user selects a word or verse, the interface should display:
- original word
- transliteration
- lexical definition
- part of speech
- optional morphology

### Occurrence Mapping
- show where the same source word appears elsewhere
- show the English rendering in each context
- let users navigate to those verses

### Study Panel
A side panel should present:
- word details
- definitions
- related verses
- contextual translation examples

## Data Requirements

### Entities
- OriginalWord
- LexiconEntry
- VerseWordMapping
- OccurrenceReference

### Key Fields
- lemma
- surfaceForm
- transliteration
- language
- definition
- strongsNumber (if used)
- partOfSpeech
- morphology
- verseReference

## Acceptance Criteria

- user can inspect original word data for supported verses
- user can see transliteration and definition
- user can open a list of related occurrences
- user can navigate from occurrence results back to the text

## Risks

- source data licensing
- incomplete verse-word alignment
- UI overload if too much lexical detail appears at once
