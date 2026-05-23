# Logos Incarnate Product Rules

These rules govern product, UX, and implementation decisions for Logos Incarnate. They are the default guardrails for all future work in this repository.

## 1. Scripture is always the center
The biblical text is always the primary visual center of the product.

Everything else is subordinate:
- notes
- tools
- cards
- graphs
- AI
- metadata

No screen should feel more like software than Scripture.

## 2. Reading Mode and Study Manuscript Mode must be separate interfaces
These are not two panels on the same screen. They are not one mixed layout with conditional clutter.

They must be experienced as distinct modes with distinct UI surfaces.

### Reading Mode
When the user enters Reading Mode, they should see only Reading Mode.

### Study Manuscript Mode
When the user enters Study Manuscript Mode, they should see only Study Manuscript Mode.

### Rule
The two modes must not visually coexist in the same active UI.

## 3. Reading Mode must show only the Bible
Reading Mode is a pure Scripture-reading surface.

### It may contain
- Bible text
- verse numbers
- minimal mode switch/navigation

### It must not contain
- study controls
- note editors
- focus cards
- graph previews
- annotation summaries
- stats
- explanatory copy
- manuscript spacing
- margin note UI

### Goal
Reading Mode should feel like opening a Bible and reading it.

## 4. Study Manuscript Mode is a distinct study surface
Study Manuscript Mode is where the reader interacts with the text as a manuscript.

### It may contain
- verse interaction
- underlining
- phrase underlining
- handwritten note behavior
- focus cards
- expanded related passages
- manuscript spacing
- contextual analysis notes

### It must feel like
- a studied page
- a marked manuscript
- a personal study surface
- not a dashboard

## 5. Reading and Study must differ structurally, not cosmetically
The distinction between the two modes must not be only color or spacing.

### Reading Mode
- compact
- uninterrupted
- text-only
- flowing like actual Bible reading

### Study Manuscript Mode
- spacious
- interactive
- verse-aware
- annotation-capable
- card-capable

If both modes still look like the same page, the design is wrong.

## 6. Study mode must support word and phrase underlining
Study Manuscript Mode must allow the user to underline:
- individual words
- selected phrases

### Rule
Annotation should be precise and text-aware, not broad and vague.

### Constraint
All underlining interaction must preserve natural readability:
- correct spacing
- correct punctuation
- correct flow

## 7. Meaning Explorer must live inside the focus cards
Meaning Explorer should not feel like a detached panel.

It should be embodied inside each curated focus card for the relevant word.

### Therefore
- pressing a focus word opens its own card
- the word's meaning content is inside that card
- related passages are inside that card
- expansions happen inside that card

### Rule
The focus card is the container for meaning exploration.

## 8. Each focus card must begin with the actual Hebrew meaning
The first intellectual value of the card should be the word's original-language meaning.

### Each focus card should show
- English focus word
- Hebrew/original word
- transliteration where helpful
- original script if available
- actual definition/meaning rooted in the Hebrew term

### Rule
Meaning must begin from the original word, not only from English explanation.

## 9. Focus card content order must follow this sequence
Inside each focus card, the information order should be:

1. original word / Hebrew definition
2. contextual analysis
3. core meaning
4. why it matters here
5. related passages using the same original word
6. same English rendering with different original word
7. graph preview if present

This replaces weaker generic ordering.

## 10. Contextual analysis is user-authored and comes before interpretation layers
Contextual analysis should not be prefilled by default.

### It should
- begin empty where appropriate
- allow the user to add their own contextual observations
- appear in the card once authored/saved

### Rule
User reflection is part of the product, not an afterthought.

## 11. Related passages must expand inside the focus card
When the user presses a focus card:
- related passages should appear within that same card
- each passage should be expandable
- expanded passages should quote the verse text

### Rule
The user should not be thrown elsewhere to understand the word.

Everything needed for first-pass study should unfold within the card.

## 12. Distinguish same-original-word and same-English-word
Focus cards must clearly separate:
- passages using the same original Hebrew word
- passages using the same English translation but a different original word

### Also include
- a brief explanation of the difference in meaning

This is one of the clearest ways Logos Incarnate can become truly meaning-first.

## 13. Notes must feel handwritten and attached to the verse
Saved notes in study mode must:
- appear under the relevant verse
- feel handwritten
- allow user-selected color
- persist over time

### Rule
Notes should feel written onto the manuscript, not stored off to the side.

## 14. Interaction must never damage readability
Any interactive rendering of text must preserve:
- spaces
- punctuation
- natural reading rhythm
- visual integrity of the verse

If interaction breaks the text, it fails the product standard.

## 15. Graph remains subordinate
Graph is allowed only as a supporting layer.

### Rule
Graph never comes before:
- text
- meaning
- contextual analysis
- related passages

Graph must help interpretation, not dominate it.

## 16. Progressive disclosure remains mandatory
The user should move through this flow:

1. read the verse
2. enter study mode
3. underline word or phrase
4. open focus card
5. see Hebrew meaning
6. add contextual analysis
7. expand core meaning and why it matters
8. expand related passages
9. optionally inspect graph

Do not invert this order.

## 17. Calm, reverent, manuscript-aware design is mandatory
The product should feel:
- calm
- reverent
- serious
- manuscript-like
- elegant
- visually restrained

Avoid:
- SaaS dashboard energy
- bright clutter
- too many panels
- excessive chrome
- technical overload

## 18. Study Mode tools must support the manuscript, not dominate it
Study Manuscript Mode must not begin with a large detached control panel that visually overwhelms Scripture.

### Required behavior
- the chapter text must remain the primary visual surface
- study controls must feel attached to the active verse or active study context
- large tool blocks must not push the manuscript far below the fold
- the interface must not feel like a form-first editor or settings screen

### Rule
If Study Mode looks like a dashboard, settings form, or control console before it looks like a manuscript, the layout is wrong.

## 19. Default implementation bias
## 18. Default implementation bias
When uncertain, prefer:
- stronger mode separation
- fewer visible controls
- more embodied annotation
- more original-language grounding
- simpler expansion patterns
- text-first layouts
- card-contained meaning exploration

Not:
- detached side systems
- always-visible complexity
- dashboard layering
- overloaded panels

## Summary rule
Logos Incarnate must present Scripture as a pure reading experience in Reading Mode, a living annotated manuscript in Study Mode, and a meaning-first Hebrew-aware exploration through expandable focus cards without overload.
