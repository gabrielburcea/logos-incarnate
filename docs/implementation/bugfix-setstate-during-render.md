# Bug Fix: React setState During Render

## Date: 2026-05-24

## Issue

**Error Message:**
```
Cannot update a component (GenesisExperience) while rendering a different component (SVGDrawingLayer). 
To locate the bad setState() call inside SVGDrawingLayer...
```

## Root Cause

The `SVGDrawingLayer` component was calling `onStrokesChange(updatedStrokes)` **synchronously during state updates**, which triggered a parent component re-render while the child was still rendering.

### Problematic Code

**Location 1: `eraseAtPoint` function**
```typescript
const eraseAtPoint = (point: Point) => {
  setStrokes((prev) => {
    const remaining = prev.filter((stroke) => !isPointNearStroke(point, stroke));
    if (remaining.length !== prev.length) {
      onStrokesChange(remaining);  // ❌ Called during setStrokes callback
    }
    return remaining;
  });
};
```

**Location 2: `handlePointerUp` function**
```typescript
const handlePointerUp = () => {
  if (isDrawing && currentStroke.length > 1) {
    const newStroke = { /* ... */ };
    const updatedStrokes = [...strokes, newStroke];
    setStrokes(updatedStrokes);
    onStrokesChange(updatedStrokes);  // ❌ Called immediately after setState
  }
};
```

## Problem Explanation

React's rendering model requires that:
1. State updates should not trigger other component updates synchronously
2. Side effects (like calling parent callbacks) should happen **after** render completes
3. Use `useEffect` to defer side effects to after commit phase

When `onStrokesChange` was called immediately:
- Child component (`SVGDrawingLayer`) was updating its own state
- This triggered a parent update (`GenesisExperience`) synchronously
- React couldn't guarantee consistent render order
- Result: React threw error to prevent potential infinite loops

## Solution

Move `onStrokesChange` calls into a `useEffect` that watches the `strokes` state:

```typescript
// Notify parent of strokes changes (debounced to avoid render issues)
useEffect(() => {
  const timer = setTimeout(() => {
    onStrokesChange(strokes);
  }, 50);
  return () => clearTimeout(timer);
}, [strokes, onStrokesChange]);
```

### Fixed Code

**Location 1: `eraseAtPoint` - Removed callback**
```typescript
const eraseAtPoint = (point: Point) => {
  setStrokes((prev) => {
    const remaining = prev.filter((stroke) => !isPointNearStroke(point, stroke));
    return remaining;  // ✅ Just update state, effect handles callback
  });
};
```

**Location 2: `handlePointerUp` - Removed immediate callback**
```typescript
const handlePointerUp = () => {
  if (isDrawing && currentStroke.length > 1) {
    const newStroke = { /* ... */ };
    setStrokes((prev) => [...prev, newStroke]);  // ✅ Just update state
  }
  // Effect will call onStrokesChange after render
};
```

## Benefits of This Approach

1. **React-compliant** - No setState during render
2. **Debounced** - 50ms delay prevents excessive parent updates
3. **Clean separation** - State management separate from side effects
4. **Predictable** - Updates happen in consistent order
5. **Performance** - Fewer unnecessary renders

## Testing

✅ Build passes
✅ TypeScript compilation clean
✅ No React warnings
✅ Drawing still works
✅ Eraser still works
✅ Parent receives stroke updates correctly
✅ No performance degradation

## Key Takeaway

**Rule of thumb:** Never call parent callbacks synchronously during state updates. Always use `useEffect` to defer side effects until after render completes.

```typescript
// ❌ Bad - calls during render
const handleAction = () => {
  setState(newValue);
  onParentCallback(newValue);  // Synchronous!
};

// ✅ Good - defers to effect
const handleAction = () => {
  setState(newValue);  // Just update state
};

useEffect(() => {
  onParentCallback(state);  // Runs after render
}, [state, onParentCallback]);
```

---

**Bug fixed and verified. Drawing system is now React-compliant.**
