# Logos Incarnate

Logos Incarnate is a meaning-first Bible reading and study platform designed to help readers move from text, to meaning, to relationships, to reflection, without being overwhelmed by information overload.

## Phase 1 POC

This repository now includes a runnable Phase 1 proof of concept built around **Genesis 2**.

The POC emphasizes:
- a quiet, text-first reading experience
- a distinct Study Manuscript Mode
- local-first annotation scaffolding for highlights, underlines, and notes
- a meaning-first explorer for selected Genesis 2 terms
- a restrained graph preview using mocked local data

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Included routes

- `/` — landing page and entry into the Genesis 2 vertical slice
- `/genesis-2` — the reading-first Genesis 2 experience

## Product direction

The long-term goal is not simply to provide more Bible study data.

The goal is to help readers understand:
- what a word means in context
- how often it appears
- where else it appears
- what those other appearances contribute
- how people, places, themes, and passages are related
- how biblical meaning can be explored in a calm, reverent, and visually rich way

See the `docs/` directory for deeper product, architecture, and decision records.
