import React, { useMemo } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import * as THREE from "three";

// One full-screen fragment shader, optionally reading 2D canvases as textures.
// Use it to "print" or "photograph" flat layers (plates, paper pieces, cels, sprites)
// with a medium: grain, misregistration, halftone, paper tooth, lens effects.
//
// The fragment shader receives:
//   varying vec2 vUv;            0..1, origin bottom-left
//   uniform float uTime;         seconds
//   uniform float uFrame;        frame number
//   uniform vec2 uResolution;    output size in px
//   uniform sampler2D uTex0..7;  the canvases in `layers`, in order
// plus any extra numeric uniforms you pass.

const VERT = /* glsl */ `
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

type U = number | [number, number] | [number, number, number] | [number, number, number, number];

const toUniform = (v: U) => (typeof v === "number" ? v : v.length === 2 ? new THREE.Vector2(...v) : v.length === 3 ? new THREE.Vector3(...v) : new THREE.Vector4(...v));

const Quad: React.FC<{ fragment: string; layers: HTMLCanvasElement[]; paint?: (frame: number) => void; uniforms: Record<string, U> }> = ({ fragment, layers, paint, uniforms }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const textures = useMemo(
    () =>
      layers.map((c) => {
        const t = new THREE.CanvasTexture(c);
        t.colorSpace = THREE.SRGBColorSpace;
        t.minFilter = THREE.LinearFilter;
        t.generateMipmaps = false;
        return t;
      }),
    [layers],
  );
  const material = useMemo(() => {
    const u: Record<string, THREE.IUniform> = {
      uTime: { value: 0 },
      uFrame: { value: 0 },
      uResolution: { value: new THREE.Vector2(width, height) },
    };
    textures.forEach((t, i) => (u[`uTex${i}`] = { value: t }));
    Object.entries(uniforms).forEach(([k, v]) => (u[k] = { value: toUniform(v) }));
    return new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: fragment, uniforms: u, depthTest: false, depthWrite: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fragment, textures, width, height]);

  // Draw this frame's layers, upload them, set uniforms. Runs during render, before R3F draws.
  paint?.(frame);
  textures.forEach((t) => (t.needsUpdate = true));
  material.uniforms.uTime.value = frame / fps;
  material.uniforms.uFrame.value = frame;
  Object.entries(uniforms).forEach(([k, v]) => (material.uniforms[k].value = toUniform(v)));

  return (
    <mesh frustumCulled={false} material={material}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
};

export const ShaderPass: React.FC<{
  fragment: string;
  layers?: HTMLCanvasElement[];
  paint?: (frame: number) => void;
  uniforms?: Record<string, U>;
}> = ({ fragment, layers = [], paint, uniforms = {} }) => {
  const { width, height } = useVideoConfig();
  return (
    <ThreeCanvas width={width} height={height} gl={{ antialias: false, preserveDrawingBuffer: true }} linear flat>
      <Quad fragment={fragment} layers={layers} paint={paint} uniforms={uniforms} />
    </ThreeCanvas>
  );
};
