import React, { useLayoutEffect, useRef } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

export type Draw = (ctx: CanvasRenderingContext2D, frame: number, size: { width: number; height: number }) => void;

// A full-frame 2D canvas redrawn from scratch every frame. The draw function must depend
// only on the frame number (and seeded randomness), never on what the canvas held before.
export const Canvas2D: React.FC<{ draw: Draw; style?: React.CSSProperties }> = ({ draw, style }) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    draw(ctx, frame, { width, height });
  }, [draw, frame, width, height]);
  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", inset: 0, ...style }} />;
};

/**
 * An offscreen canvas for building layers (printing plates, paper pieces, sprite sheets)
 * that a ShaderPass then composites. Create it once per size with useMemo.
 */
export const makeLayer = (width: number, height: number) => {
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const ctx = c.getContext("2d");
  if (!ctx) throw new Error("2D canvas unavailable");
  return { canvas: c, ctx };
};
