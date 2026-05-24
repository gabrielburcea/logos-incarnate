"use client";

import { useEffect, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

type Stroke = {
  id: string;
  points: Point[];
  color: string;
  width: number;
  opacity: number;
  tool: "pen" | "marker";
};

type SVGDrawingLayerProps = {
  isActive: boolean;
  currentTool: "pen" | "marker" | "eraser";
  currentColor: string;
  onStrokesChange: (strokes: Stroke[]) => void;
  initialStrokes?: Stroke[];
};

export function SVGDrawingLayer({
  isActive,
  currentTool,
  currentColor,
  onStrokesChange,
  initialStrokes = [],
}: SVGDrawingLayerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>(initialStrokes);
  const [currentStroke, setCurrentStroke] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get stroke properties based on tool
  const getStrokeProps = (tool: "pen" | "marker") => {
    if (tool === "marker") {
      return { width: 18, opacity: 0.35 };
    }
    return { width: 2.5, opacity: 1 };
  };

  // Convert points array to SVG path data
  const pointsToPath = (points: Point[]): string => {
    if (points.length < 2) return "";
    
    // Simple smoothing using quadratic curves
    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 1; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const midX = (curr.x + next.x) / 2;
      const midY = (curr.y + next.y) / 2;
      path += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
    }
    
    // Add final point
    if (points.length > 1) {
      const last = points[points.length - 1];
      path += ` L ${last.x} ${last.y}`;
    }
    
    return path;
  };

  // Get coordinates relative to SVG
  const getCoordinates = (e: MouseEvent | TouchEvent): Point | null => {
    if (!svgRef.current) return null;
    
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    
    let clientX: number, clientY: number;
    
    if (e instanceof MouseEvent) {
      clientX = e.clientX;
      clientY = e.clientY;
    } else if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      return null;
    }
    
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  // Check if point is near a stroke (for eraser)
  const isPointNearStroke = (point: Point, stroke: Stroke, threshold = 15): boolean => {
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p1 = stroke.points[i];
      const p2 = stroke.points[i + 1];
      
      // Calculate distance from point to line segment
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      
      if (length === 0) continue;
      
      const t = Math.max(0, Math.min(1, ((point.x - p1.x) * dx + (point.y - p1.y) * dy) / (length * length)));
      const projX = p1.x + t * dx;
      const projY = p1.y + t * dy;
      const distance = Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
      
      if (distance < threshold + stroke.width / 2) {
        return true;
      }
    }
    return false;
  };

  // Erase strokes under the point
  const eraseAtPoint = (point: Point) => {
    setStrokes((prev) => {
      const remaining = prev.filter((stroke) => !isPointNearStroke(point, stroke));
      return remaining;
    });
  };

  const handlePointerDown = (e: MouseEvent | TouchEvent) => {
    if (!isActive || currentTool === "eraser") {
      if (currentTool === "eraser") {
        const point = getCoordinates(e);
        if (point) {
          eraseAtPoint(point);
        }
      }
      return;
    }

    e.preventDefault();
    const point = getCoordinates(e);
    if (point) {
      setIsDrawing(true);
      setCurrentStroke([point]);
    }
  };

  const handlePointerMove = (e: MouseEvent | TouchEvent) => {
    if (!isActive) return;

    const point = getCoordinates(e);
    if (!point) return;

    if (currentTool === "eraser") {
      eraseAtPoint(point);
      return;
    }

    if (isDrawing) {
      e.preventDefault();
      setCurrentStroke((prev) => [...prev, point]);
    }
  };

  const handlePointerUp = () => {
    if (!isActive || currentTool === "eraser") {
      setIsDrawing(false);
      return;
    }

    if (isDrawing && currentStroke.length > 1) {
      const props = getStrokeProps(currentTool as "pen" | "marker");
      const newStroke: Stroke = {
        id: `stroke-${Date.now()}-${Math.random()}`,
        points: currentStroke,
        color: currentColor,
        width: props.width,
        opacity: props.opacity,
        tool: currentTool as "pen" | "marker",
      };
      
      setStrokes((prev) => [...prev, newStroke]);
    }
    
    setCurrentStroke([]);
    setIsDrawing(false);
  };

  // Notify parent of strokes changes (debounced to avoid render issues)
  useEffect(() => {
    const timer = setTimeout(() => {
      onStrokesChange(strokes);
    }, 50);
    return () => clearTimeout(timer);
  }, [strokes, onStrokesChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => handlePointerDown(e);
    const handleMouseMove = (e: MouseEvent) => handlePointerMove(e);
    const handleMouseUp = () => handlePointerUp();
    const handleTouchStart = (e: TouchEvent) => handlePointerDown(e);
    const handleTouchMove = (e: TouchEvent) => handlePointerMove(e);
    const handleTouchEnd = () => handlePointerUp();

    container.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    container.addEventListener("touchstart", handleTouchStart, { passive: false });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      container.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isActive, isDrawing, currentStroke, currentTool, currentColor, strokes]);

  return (
    <div
      ref={containerRef}
      className={`svg-drawing-container ${isActive ? "is-active" : ""} ${currentTool === "eraser" ? "is-eraser" : ""}`}
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: isActive ? "auto" : "none",
        cursor: isActive
          ? currentTool === "eraser"
            ? "crosshair"
            : "crosshair"
          : "default",
      }}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        style={{ position: "absolute", inset: 0 }}
      >
        {/* Render all completed strokes */}
        {strokes.map((stroke) => (
          <path
            key={stroke.id}
            d={pointsToPath(stroke.points)}
            stroke={stroke.color}
            strokeWidth={stroke.width}
            strokeOpacity={stroke.opacity}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
        
        {/* Render current stroke being drawn */}
        {isDrawing && currentStroke.length > 1 && (
          <path
            d={pointsToPath(currentStroke)}
            stroke={currentColor}
            strokeWidth={getStrokeProps(currentTool as "pen" | "marker").width}
            strokeOpacity={getStrokeProps(currentTool as "pen" | "marker").opacity}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
}
