# SVG-Based Annotation System

## Overview

The Study Manuscript Mode uses SVG (Scalable Vector Graphics) for all freehand drawing and annotation capabilities.

This architectural decision enables high-quality manuscript annotations that can scale, transform, and integrate with future animation features.

## Why SVG Instead of Canvas

### Canvas Limitations
- bitmap-based (pixels, not vectors)
- degrades quality when zoomed
- no individual stroke manipulation
- difficult to animate or export
- not AI-readable for storytelling features

### SVG Benefits
- vector-based (infinite scalability)
- each stroke is a semantic object (can be edited, animated, deleted)
- AI can read and understand relationships
- perfect export to illustrations, animations, videos
- works seamlessly across all screen sizes and zoom levels

## Architecture Layers

```
Study Manuscript Mode:

┌─────────────────────────────────────┐
│  SVG Drawing Layer                   │  ← User annotations (pen/marker/eraser)
│  - Freehand strokes as <path>       │
│  - Transparent overlay               │
│  - Only visible when user draws      │
├─────────────────────────────────────┤
│  HTML Text Layer                     │  ← Bible text (any translation/language)
│  - Verse elements                    │
│  - Word-level highlighting           │
│  - Meaning explorer triggers         │
├─────────────────────────────────────┤
│  Background Layer                    │  ← Manuscript aesthetic
│  - Paper texture                     │
│  - Parchment styling                 │
└─────────────────────────────────────┘

Reading Mode:
- No SVG layer rendered
- Pure HTML text + background
- Maximum performance and simplicity
```

## Drawing Tools

### 1. Pen/Stilo
- Thin stroke (2-3px)
- Solid color
- Used for: underlining, circling, arrows, brackets, connecting lines
- SVG: `<path>` with stroke-width="2-3"

### 2. Marker/Highlighter
- Thick stroke (15-20px)
- Semi-transparent (opacity: 0.3-0.4)
- Used for: highlighting words, phrases, passages
- SVG: `<path>` with stroke-width="15-20" and opacity

### 3. Eraser
- Click/drag over strokes to remove
- Collision detection with existing SVG paths
- Deletes matched `<path>` elements

## Stroke Rendering

### Mouse/Touch Input → SVG Path
1. User presses down (mousedown/touchstart)
2. Collect coordinate points as mouse moves
3. Smooth points using Catmull-Rom or Bezier curves
4. Generate SVG `<path>` element with `d` attribute
5. Apply current tool's color, width, opacity

### Example SVG Output
```svg
<svg class="annotation-layer">
  <path 
    d="M 100,200 L 150,205 L 200,210"
    stroke="#ff2d55"
    stroke-width="3"
    fill="none"
    stroke-linecap="round"
    stroke-linejoin="round"
  />
</svg>
```

## Persistence

### Storage Format
```typescript
interface SVGAnnotation {
  id: string;
  userId: string;
  chapterReference: string; // e.g. "genesis-2"
  verseNumber?: number; // optional verse association
  pathData: string; // SVG path d attribute
  strokeColor: string;
  strokeWidth: number;
  opacity: number;
  toolType: "pen" | "marker";
  createdAt: string;
  updatedAt: string;
}
```

### Storage Location
- localStorage for MVP (client-side persistence)
- Future: database with user accounts
- Export capability: JSON, SVG file, PDF with annotations

## Multi-Language Support

SVG coordinates are **position-based**, not text-dependent.

This means:
- Annotations work across any language (English, Spanish, Chinese, Arabic, etc.)
- Switching Bible translations preserves annotation positions
- Text reflow may require annotation adjustment (future feature)

## Animation Integration

SVG annotations become source material for Story/Animation Mode:

### Workflow
1. User studies Genesis 2, draws connections between verses
2. User underlines "helper" (ezer), circles Hebrew text, draws arrow to verse 20
3. User enters Animation Mode
4. AI reads:
   - SVG paths (visual relationships user drew)
   - Verse content (text being connected)
   - Graph data (semantic relationships)
5. AI generates animation:
   - Underline animates on
   - Hebrew word appears with definition
   - Arrow draws connecting verses
   - Narration explains the connection

### Technical Pipeline
```
SVG Paths → JSON → AI Analysis → Video Storyboard → Animation Frames
```

## Performance Considerations

### Optimization Strategies
- Lazy render: Only load annotations for visible chapter
- Path simplification: Reduce point count while preserving visual quality
- Debounced saves: Batch annotation updates to localStorage
- Virtual scrolling: Render only visible verses + annotations

### Limitations
- SVG performs well up to ~10,000 paths
- For extensive annotations, may need pagination or lazy loading
- Mobile devices: optimize touch input sampling rate

## Future Enhancements

### Phase 1 (Current POC)
- Basic pen, marker, eraser
- Stroke smoothing
- Color selection
- Persistence in localStorage

### Phase 2
- Undo/Redo stack
- Stroke selection and editing
- Lasso tool for multi-stroke operations
- Annotation layers (separate drawing layers)

### Phase 3
- Pressure sensitivity (Apple Pencil, Wacom)
- Stroke beautification (straighten lines, perfect circles)
- Snap-to-text for precise underlining
- Collaborative annotations (multi-user)

### Phase 4
- Animation Mode integration
- AI reads annotations for storytelling
- Export to video, PDF, presentation formats

## Implementation Reference

Real-world examples using SVG for drawing:
- Excalidraw (whiteboard tool)
- tldraw (infinite canvas)
- Figma (design tool)
- Rough.js (hand-drawn style annotations)
- Apple Notes with Apple Pencil

## Acceptance Criteria

- User can draw naturally with pen/marker tools
- Strokes appear smooth and responsive
- Annotations persist across sessions
- Quality remains sharp at any zoom level
- Works across all Bible translations/languages
- No impact on Reading Mode performance
- Ready for future animation integration
