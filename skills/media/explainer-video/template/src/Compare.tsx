import React from "react";
import { AbsoluteFill, Audio, OffthreadVideo, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Poppins";
import project from "./data/project.json";

const { fontFamily } = loadFont("normal", { weights: ["700"], subsets: ["latin"] });
const LABEL = 56;

const layout = (n: number, w: number, h: number) => {
  const tall = h > w;
  const cols = tall ? Math.min(n, 4) : n <= 1 ? 1 : n <= 4 ? 2 : 3;
  const rows = Math.ceil(n / cols);
  const scale = tall ? 960 / h : 960 / w;
  const cw = Math.round((w * scale) / 2) * 2;
  const ch = Math.round((h * scale) / 2) * 2;
  return { cols, rows, cw, ch };
};

export const compareSize = (n: number, w: number, h: number) => {
  const { cols, rows, cw, ch } = layout(Math.max(1, n), w, h);
  return { width: cols * cw, height: rows * (ch + LABEL) };
};

// Every rendered style side by side, playing in sync, with its name above it.
// Videos are muted and the shared narration plays once; compare.html lets you hear
// each style's own music and effects.
export const Compare: React.FC<{ ids: string[] }> = ({ ids }) => {
  const { cols, cw, ch } = layout(ids.length, project.width, project.height);
  return (
    <AbsoluteFill style={{ backgroundColor: "#111" }}>
      {ids.map((id, i) => {
        const x = (i % cols) * cw;
        const y = Math.floor(i / cols) * (ch + LABEL);
        return (
          <div key={id} style={{ position: "absolute", left: x, top: y, width: cw, height: ch + LABEL }}>
            <div
              style={{
                height: LABEL,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontFamily,
                fontSize: 26,
                background: "#1c1c1c",
                borderRight: "2px solid #111",
              }}
            >
              {id}
            </div>
            <OffthreadVideo muted src={staticFile(`renders/${id}.mp4`)} style={{ width: cw, height: ch }} />
          </div>
        );
      })}
      {project.narration ? <Audio src={staticFile("audio/narration.wav")} /> : null}
    </AbsoluteFill>
  );
};
