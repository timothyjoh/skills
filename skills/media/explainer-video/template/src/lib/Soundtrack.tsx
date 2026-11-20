import React from "react";
import { Audio, staticFile, useVideoConfig } from "remotion";
import project from "../data/project.json";
import words from "../data/words.json";

const db = (d: number) => Math.pow(10, d / 20);

type AudioFlags = { music?: boolean; sfx?: boolean };

// Narration at full level. Music sits musicDb under it (default -20 dB) and ducks a further
// duckDb while a word is being spoken. Effects sit sfxDb under the voice.
export const Soundtrack: React.FC<{ styleId: string }> = ({ styleId }) => {
  const { fps } = useVideoConfig();
  const flags = ((project.audio as Record<string, AudioFlags>)[styleId] ?? {}) as AudioFlags;
  const mix = project.mix;
  const speaking = (frame: number) => {
    const t = frame / fps;
    return (words as { start: number; end: number }[]).some((w) => t >= w.start - 0.08 && t <= w.end + 0.15);
  };
  return (
    <>
      {project.narration ? <Audio src={staticFile("audio/narration.wav")} /> : null}
      {flags.music ? (
        <Audio
          src={staticFile(`audio/${styleId}/music.wav`)}
          volume={(f) => db(mix.musicDb + (project.narration && speaking(f) ? mix.duckDb : 0))}
        />
      ) : null}
      {flags.sfx ? <Audio src={staticFile(`audio/${styleId}/sfx.wav`)} volume={db(mix.sfxDb)} /> : null}
    </>
  );
};
