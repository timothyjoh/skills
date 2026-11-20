import React from "react";
import { AbsoluteFill } from "remotion";
import { styles } from "../styles";
import { Soundtrack } from "./Soundtrack";

// Wraps one style's scene with the soundtrack. The scene draws picture and captions.
// Narration is shared by every style, so a side-by-side comparison is fair; music and
// effects are per style (public/audio/<styleId>/), written by tools/synth.mjs.
export const StyleFrame: React.FC<{ styleId: string }> = ({ styleId }) => {
  const Scene = styles[styleId];
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      <Scene />
      <Soundtrack styleId={styleId} />
    </AbsoluteFill>
  );
};
