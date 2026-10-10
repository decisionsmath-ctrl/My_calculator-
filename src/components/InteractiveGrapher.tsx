import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Layers, Info } from 'lucide-react';
import { GraphData } from '../types/calculator';

interface InteractiveGrapherProps {
  graphData?: GraphData;
  className?: string;
  defaultTitle?: string;
  onCanvasRef?: (canvas: HTMLCanvasElement | null) => void;
}

export const InteractiveGrapher: React.FC<InteractiveGrapherProps> = ({
  graphData,
  className = '',
  defaultTitle = 'Interactive 2D Function Visualizer',
  onCanvasRef,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (onCanvasRef && canvasRef.current) {
      onCanvasRef(canvasRef.current);
    }
  }, [onCanvasRef]);

  // View bounds
  const [view, setView] = useState({
    xMin: graphData?.xMin ?? -6,
    xMax: graphData?.xMax ?? 6,
    yMin: graphData?.yMin ?? -6,
    yMax: graphData?.yMax ?? 6,
  });

  // Toggles
  const [showDerivative, setShowDerivative] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showShading, setShowShading] = useState(true);
  const [hoverCoord, setHoverCoord] = useState<{ x: number; y: number; fVal?: number } | null>(null);

  // Dragging state for pan
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ x: number; y: number; view: typeof view }>({
    x: 0,
    y: 0,
    view: { ...view },
  });

  // Safe compiler for Javascript math expressions with math notation fallback
  const compileFunction = useCallback((expr?: string, fallbackLatex?: string) => {
    let source = expr;
    if (!source && fallbackLatex) {
      // Strip "f(x) =" or "y ="
      source = fallbackLatex
        .replace(/^f\(x\)\s*=\s*/i, '')
        .replace(/^y\s*=\s*/i, '')
        .replace(/\\left|\\right/g, '')
        .replace(/\\sin/g, 'Math.sin')
        .replace(/\\cos/g, 'Math.cos')
        .replace(/\\tan/g, 'Math.tan')
        .replace(/\\exp/g, 'Math.exp')
        .replace(/\\ln/g, 'Math.log')
        .replace(/\\sqrt\{([^}]+)\}/g, 'Math.sqrt($1)')
        .replace(/([0-9a-zA-Z]+)\^([0-9]+)/g, 'Math.pow($1, $2)')
        .replace(/(\d)([a-zA-Z])/g, '$1 * $2')
        .replace(/([a-zA-Z])\((\w+)\)/g, '$1($2)')
        .replace(/(\w)\s*\(/g, '$1 * (');
    }

    if (!source) return null;

    try {
      // Ensure Math prefixes for common functions if missing
      const sanitized = source
        .replace(/\bsin\(/g, 'Math.sin(')
        .replace(/\bcos\(/g, 'Math.cos(')
        .replace(/\btan\(/g, 'Math.tan(')
        .replace(/\bexp\(/g, 'Math.exp(')
        .replace(/\bln\(/g, 'Math.log(')
        .replace(/\bsqrt\(/g, 'Math.sqrt(')
        .replace(/\babs\(/g, 'Math.abs(')
        .replace(/\bpi\b/gi, 'Math.PI')
        .replace(/\be\b(?![a-zA-Z])/g, 'Math.E');

      // eslint-disable-next-line @typescript-eslint/no-implied-eval
      const fn = new Function('x', `"use strict"; try { return (${sanitized}); } catch(e) { return NaN; }`);
      const testVal = fn(1);
      if (typeof testVal === 'number' || Number.isNaN(testVal)) {
        return fn;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const fFunc = compileFunction(graphData?.functionJs, graphData?.functionLatex);
  const dfFunc = compileFunction(graphData?.derivativeJs);

  // Sync initial graph bounds when graphData changes
  useEffect(() => {
    if (graphData) {
      setView({
        xMin: graphData.xMin ?? -6,
        xMax: graphData.xMax ?? 6,
        yMin: graphData.yMin ?? -6,
        yMax: graphData.yMax ?? 6,
      });
    }
  }, [graphData]);

  // Main render loop
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, width, height);

    const { xMin, xMax, yMin, yMax } = view;
    const toScreenX = (x: number) => ((x - xMin) / (xMax - xMin)) * width;
    const toScreenY = (y: number) => height - ((y - yMin) / (yMax - yMin)) * height;
    const toMathX = (px: number) => xMin + (px / width) * (xMax - xMin);
    const toMathY = (py: number) => yMin + ((height - py) / height) * (yMax - yMin);

    // Calculate grid step nicely
    const rangeX = xMax - xMin;
    const rawStep = rangeX / 10;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const residual = rawStep / magnitude;
    let step = magnitude;
    if (residual > 5) step = 5 * magnitude;
    else if (residual > 2) step = 2 * magnitude;

    // Draw Grid
    if (showGrid) {
      ctx.strokeStyle = '#1e293b'; // slate-800
      ctx.lineWidth = 1;
      ctx.font = '10px "Fira Code", monospace';
      ctx.fillStyle = '#64748b'; // slate-500

      // Vertical lines
      const firstX = Math.floor(xMin / step) * step;
      for (let x = firstX; x <= xMax; x += step) {
        const sx = toScreenX(x);
        ctx.beginPath();
        ctx.moveTo(sx, 0);
        ctx.lineTo(sx, height);
        ctx.stroke();

        if (Math.abs(x) > 1e-9) {
          const sy = Math.max(15, Math.min(height - 5, toScreenY(0) + 12));
          ctx.fillText(Number(x.toFixed(4)).toString(), sx + 3, sy);
        }
      }

      // Horizontal lines
      const firstY = Math.floor(yMin / step) * step;
      for (let y = firstY; y <= yMax; y += step) {
        const sy = toScreenY(y);
        ctx.beginPath();
        ctx.moveTo(0, sy);
        ctx.lineTo(width, sy);
        ctx.stroke();

        if (Math.abs(y) > 1e-9) {
          const sx = Math.max(5, Math.min(width - 40, toScreenX(0) + 4));
          ctx.fillText(Number(y.toFixed(4)).toString(), sx, sy - 3);
        }
      }
    }

    // Main Axes (X & Y)
    ctx.strokeStyle = '#475569'; // slate-600
    ctx.lineWidth = 1.5;

    // X-axis
    const originY = toScreenY(0);
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(width, originY);
    ctx.stroke();

    // Y-axis
    const originX = toScreenX(0);
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, height);
    ctx.stroke();

    // Definite Integral Shaded Area
    if (showShading && graphData?.definiteIntegralBounds && fFunc) {
      const { lower, upper } = graphData.definiteIntegralBounds;
      const xStart = Math.max(xMin, Math.min(lower, upper));
      const xEnd = Math.min(xMax, Math.max(lower, upper));

      if (xEnd > xStart) {
        ctx.beginPath();
        const startSx = toScreenX(xStart);
        ctx.moveTo(startSx, toScreenY(0));

        const steps = Math.min(width, 300);
        for (let i = 0; i <= steps; i++) {
          const x = xStart + (i / steps) * (xEnd - xStart);
          const y = fFunc(x);
          if (Number.isFinite(y)) {
            ctx.lineTo(toScreenX(x), toScreenY(y));
          }
        }
        ctx.lineTo(toScreenX(xEnd), toScreenY(0));
        ctx.closePath();

        // Shaded gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
        gradient.addColorStop(1, 'rgba(14, 165, 233, 0.05)');
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    // Plot primary function f(x)
    if (fFunc) {
      ctx.strokeStyle = '#38bdf8'; // sky-400
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let isDrawing = false;
      const pixelStep = 1;
      for (let px = 0; px <= width; px += pixelStep) {
        const x = toMathX(px);
        const y = fFunc(x);

        if (Number.isFinite(y) && Math.abs(y) < 1e6) {
          const py = toScreenY(y);
          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            // Check for vertical asymptote discontinuity
            if (Math.abs(py - toScreenY(fFunc(toMathX(px - pixelStep)))) > height * 0.8) {
              ctx.moveTo(px, py);
            } else {
              ctx.lineTo(px, py);
            }
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
    }

    // Plot derivative f'(x)
    if (showDerivative && dfFunc) {
      ctx.strokeStyle = '#c084fc'; // purple-400
      ctx.lineWidth = 1.8;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();

      let isDrawing = false;
      for (let px = 0; px <= width; px += 2) {
        const x = toMathX(px);
        const y = dfFunc(x);

        if (Number.isFinite(y) && Math.abs(y) < 1e6) {
          const py = toScreenY(y);
          if (!isDrawing) {
            ctx.moveTo(px, py);
            isDrawing = true;
          } else {
            ctx.lineTo(px, py);
          }
        } else {
          isDrawing = false;
        }
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Critical Points & Extrema markers
    if (graphData?.criticalPoints && graphData.criticalPoints.length > 0) {
      graphData.criticalPoints.forEach((pt) => {
        const sx = toScreenX(pt.x);
        const sy = toScreenY(pt.y);

        if (sx >= -10 && sx <= width + 10 && sy >= -10 && sy <= height + 10) {
          ctx.fillStyle = '#f59e0b'; // amber-500
          ctx.beginPath();
          ctx.arc(sx, sy, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Label
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = '#fde68a';
          ctx.fillText(
            `${pt.label} (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})`,
            sx + 8,
            sy - 6
          );
        }
      });
    }

    // Hover crosshair and value readout
    if (hoverCoord && fFunc) {
      const sx = toScreenX(hoverCoord.x);
      const sy = toScreenY(hoverCoord.y);

      // Vertical guide
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, 0);
      ctx.lineTo(sx, height);
      ctx.stroke();

      // Point on curve f(x)
      const curveY = fFunc(hoverCoord.x);
      if (Number.isFinite(curveY)) {
        const curveSy = toScreenY(curveY);

        ctx.setLineDash([]);
        ctx.fillStyle = '#38bdf8';
        ctx.beginPath();
        ctx.arc(sx, curveSy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Tooltip badge
        const text = `x: ${hoverCoord.x.toFixed(3)}, f(x): ${curveY.toFixed(3)}`;
        ctx.font = '11px "Fira Code", monospace';
        const textWidth = ctx.measureText(text).width;
        const boxX = Math.min(width - textWidth - 16, Math.max(8, sx + 10));
        const boxY = Math.max(20, Math.min(height - 20, curveSy - 14));

        ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.fillRect(boxX - 4, boxY - 12, textWidth + 8, 18);
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 1;
        ctx.strokeRect(boxX - 4, boxY - 12, textWidth + 8, 18);

        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(text, boxX, boxY);
      }
      ctx.setLineDash([]);
    }
  }, [view, showGrid, showDerivative, showShading, graphData, fFunc, dfFunc, hoverCoord]);

  // Redraw when view or settings change
  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // Handle Resize with high DPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeObserver = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      drawGraph();
    });

    resizeObserver.observe(canvas);
    return () => resizeObserver.disconnect();
  }, [drawGraph]);

  // Zoom handlers
  const handleZoom = (factor: number) => {
    setView((v) => {
      const centerX = (v.xMin + v.xMax) / 2;
      const centerY = (v.yMin + v.yMax) / 2;
      const spanX = (v.xMax - v.xMin) * factor;
      const spanY = (v.yMax - v.yMin) * factor;
      return {
        xMin: centerX - spanX / 2,
        xMax: centerX + spanX / 2,
        yMin: centerY - spanY / 2,
        yMax: centerY + spanY / 2,
      };
    });
  };

  const handleReset = () => {
    setView({
      xMin: graphData?.xMin ?? -6,
      xMax: graphData?.xMax ?? 6,
      yMin: graphData?.yMin ?? -6,
      yMax: graphData?.yMax ?? 6,
    });
  };

  // Mouse pan handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      view: { ...view },
    };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    const mathX = view.xMin + (px / rect.width) * (view.xMax - view.xMin);
    const mathY = view.yMin + ((rect.height - py) / rect.height) * (view.yMax - view.yMin);
    setHoverCoord({ x: mathX, y: mathY });

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      const spanX = dragStartRef.current.view.xMax - dragStartRef.current.view.xMin;
      const spanY = dragStartRef.current.view.yMax - dragStartRef.current.view.yMin;

      const shiftX = (dx / rect.width) * spanX;
      const shiftY = (dy / rect.height) * spanY;

      setView({
        xMin: dragStartRef.current.view.xMin - shiftX,
        xMax: dragStartRef.current.view.xMax - shiftX,
        yMin: dragStartRef.current.view.yMin + shiftY,
        yMax: dragStartRef.current.view.yMax + shiftY,
      });
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleMouseLeave = () => {
    isDraggingRef.current = false;
    setHoverCoord(null);
  };

  return (
    <div className={`relative flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl ${className}`}>
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-950/80 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-semibold text-slate-200">{defaultTitle}</span>
          {graphData?.functionLatex && (
            <span className="text-slate-400 font-mono hidden sm:inline-block">
              [{graphData.functionLatex}]
            </span>
          )}
        </div>

        {/* Action controls */}
        <div className="flex items-center gap-1">
          {graphData?.derivativeJs && (
            <button
              onClick={() => setShowDerivative(!showDerivative)}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                showDerivative ? 'bg-purple-950 text-purple-300 border border-purple-700/50' : 'bg-slate-800 text-slate-400'
              }`}
              title="Toggle Derivative f'(x)"
            >
              {showDerivative ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
              f'(x)
            </button>
          )}

          {graphData?.definiteIntegralBounds && (
            <button
              onClick={() => setShowShading(!showShading)}
              className={`px-2 py-1 rounded text-[11px] font-medium flex items-center gap-1 transition ${
                showShading ? 'bg-sky-950 text-sky-300 border border-sky-700/50' : 'bg-slate-800 text-slate-400'
              }`}
              title="Toggle Integral Area Shading"
            >
              <Layers className="w-3 h-3" />
              Area
            </button>
          )}

          <div className="h-4 w-px bg-slate-800 mx-1" />

          <button
            onClick={() => handleZoom(0.8)}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => handleZoom(1.25)}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            className="p-1 hover:bg-slate-800 text-slate-300 rounded transition"
            title="Reset View"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Canvas container */}
      <div className="relative flex-1 w-full min-h-[300px] h-[360px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          className="w-full h-full block"
        />

        {/* Legend Overlay */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-slate-950/80 backdrop-blur-sm border border-slate-800/80 px-2.5 py-1.5 rounded-lg text-[11px] pointer-events-none">
          <div className="flex items-center gap-1.5 text-sky-400">
            <span className="w-3 h-0.5 bg-sky-400 rounded-full inline-block" />
            <span>f(x)</span>
          </div>
          {graphData?.derivativeJs && showDerivative && (
            <div className="flex items-center gap-1.5 text-purple-400">
              <span className="w-3 h-0.5 bg-purple-400 rounded-full border-t border-dashed inline-block" />
              <span>f'(x)</span>
            </div>
          )}
          {graphData?.definiteIntegralBounds && showShading && (
            <div className="flex items-center gap-1.5 text-sky-300">
              <span className="w-2.5 h-2.5 bg-sky-400/40 border border-sky-400/70 rounded inline-block" />
              <span>∫ Area</span>
            </div>
          )}
        </div>

        {/* Controls hint */}
        <div className="absolute top-2 right-2 text-[10px] text-slate-500 bg-slate-950/70 px-2 py-0.5 rounded pointer-events-none flex items-center gap-1">
          <Info className="w-3 h-3 text-slate-400" />
          <span>Drag to pan • Hover for (x, y)</span>
        </div>
      </div>
    </div>
  );
};
