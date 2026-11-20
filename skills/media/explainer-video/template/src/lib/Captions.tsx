import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import project from "../data/project.json";
import captions from "../data/captions.json";

const { fontFamily: poppins } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });

export type CaptionToken = { text: string; start: number; end: number };
export type CaptionPage = { start: number; end: number; tokens: CaptionToken[] };

export type CaptionProps = {
  /** Font family; defaults to Poppins Bold. Load other Google fonts with @remotion/google-fonts. */
  fontFamily?: string;
  fontWeight?: number;
  /** Font size in px; defaults to 8.5% of the short side for vertical, 6% for wide. */
  size?: number;
  color?: string;
  /** Colour of the word being spoken. */
  highlight?: string;
  outline?: string;
  /** Outline width in px; defaults to size / 11. */
  outlineWidth?: number;
  /** Distance of the caption baseline from the bottom, as a fraction of height. */
  bottom?: number;
  /** Replace the default look entirely (cut-paper letters, chalk, brush). */
  renderPage?: (page: CaptionPage, activeIndex: number, t: number) => React.ReactNode;
};

/** The caption page on screen at time t (seconds), and which token is being spoken. */
export const pageAt = (t: number) => {
  const pages = captions as CaptionPage[];
  const page = pages.find((p) => t >= p.start && t < p.end);
  if (!page) return null;
  let active = -1;
  page.tokens.forEach((tok, i) => {
    if (t >= tok.start) active = i;
  });
  return { page, active };
};

// Burned-in captions: two or three words per page, digits as written in the script's
// "show" text, the spoken word highlighted. Pages come from src/data/captions.json.
export const Captions: React.FC<CaptionProps> = (p) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  if (!project.captions) return null;
  const tall = height > width;
  const size = p.size ?? Math.round(Math.min(width, height) * (tall ? 0.085 : 0.06));
  const t = frame / fps;
  const hit = pageAt(t);
  if (!hit) return null;
  if (p.renderPage) return <AbsoluteFill>{p.renderPage(hit.page, hit.active, t)}</AbsoluteFill>;
  const ow = p.outlineWidth ?? Math.max(2, Math.round(size / 11));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", pointerEvents: "none" }}>
      <div
        style={{
          marginBottom: height * (p.bottom ?? (tall ? 0.17 : 0.09)),
          maxWidth: width * 0.86,
          textAlign: "center",
          fontFamily: p.fontFamily ?? poppins,
          fontWeight: p.fontWeight ?? 700,
          fontSize: size,
          lineHeight: 1.1,
          color: p.color ?? "#ffffff",
          WebkitTextStroke: `${ow * 2}px ${p.outline ?? "#000000"}`,
          paintOrder: "stroke fill",
          textShadow: `0 ${Math.round(ow / 2)}px ${ow}px rgba(0,0,0,0.45)`,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {hit.page.tokens.map((tok, i) => (
          <span key={i} style={{ color: i === hit.active ? p.highlight ?? "#E3E302" : undefined }}>
            {tok.text}
            {i < hit.page.tokens.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    </AbsoluteFill>
  );
};
