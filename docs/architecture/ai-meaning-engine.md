# Architecture: AI Meaning Engine

## Summary

The AI Meaning Engine is responsible for transforming structured biblical data into clear, grounded, and concise explanations for users.

It should operate on top of trusted data sources and graph relationships, not replace them.

## Purpose

The engine should help users understand:
- what a word or concept means here
- how often it appears
- where else it appears
- what the other uses contribute
- what the purpose of a person, place, event, or idea is in context
- how the meaning develops in the broader biblical pattern

## Core Responsibilities

- summarize structured data into concise meaning cards
- generate contextual analysis
- rank and select key related occurrences
- explain narrative and cultural significance
- prepare interpretation summaries
- support graph-aware exploration
- support story and animation workflows with grounded insight

## Input Sources

- Bible text and translations
- original-language data
- occurrence data
- people/place/theme links
- knowledge graph relationships
- genealogy data
- user study selections

## Output Types

- meaning card
- occurrence summary
- contextual analysis
- interpretive summary
- graph explanation
- thematic story summary
- visual prompt suggestions for animation/story mode

## Guardrails

- do not invent raw occurrence counts
- do not invent source-language facts
- prefer structured evidence first
- keep the default output concise
- allow expansion into deeper analysis
- express uncertainty where appropriate
- distinguish evidence from inference

## Agentic Workflow Direction

An orchestration layer may:
- detect the selected target
- gather the relevant structured evidence
- query graph relationships
- rank the most important supporting passages
- ask the AI to generate a concise explanation
- prepare multiple output forms for UI display

## Product Principle

The AI should act as a guide to meaning, not a generator of noise.

Its role is to distill, clarify, connect, and explain — always grounded in structured biblical evidence.
