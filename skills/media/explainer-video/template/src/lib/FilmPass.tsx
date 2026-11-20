import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useCurrentFrame } from "remotion";
import * as THREE from "three";

// A one-pass "film pipeline" for three.js scenes inside <ThreeCanvas>. It takes over
// rendering: the scene goes to an HDR render target with a depth texture, then one
// shader adds bloom, depth of field, chromatic aberration, a colour grade, vignette,
// grain and an optional letterbox. Put <FilmPass .../> anywhere inside the canvas.
//
// (@react-three/postprocessing's EffectComposer renders black under Remotion's frame
// driver in our tests, so styles use this instead.)

export type FilmSettings = {
  /** Bloom strength (0 = off) and the brightness above which things glow. */
  bloom?: number;
  bloomThreshold?: number;
  /** Depth of field: focus distance in world units from the camera, and blur size in px (0 = off). */
  focus?: number;
  aperture?: number;
  /** Chromatic aberration at the frame edge, in px. */
  aberration?: number;
  /** Vignette strength 0..1. */
  vignette?: number;
  /** Grain strength 0..1, re-seeded every frame. */
  grain?: number;
  /** Lift shadows toward this colour and push highlights toward that one (split-tone grade). */
  shadowTint?: [number, number, number];
  highlightTint?: [number, number, number];
  saturation?: number;
  exposure?: number;
  /** Letterbox aspect (for example 2.39); 0 = none. */
  letterbox?: number;
};

const FRAG = /* glsl */ `
precision highp float;
varying vec2 vUv;
uniform sampler2D tColor; uniform sampler2D tDepth;
uniform vec2 uRes; uniform float uFrame;
uniform float uBloom, uThresh, uFocus, uAperture, uAberr, uVignette, uGrain, uSat, uExposure, uLetterbox;
uniform vec3 uShadow, uHigh;
uniform float uNear, uFar;
float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
float linDepth(vec2 uv){ float z = texture2D(tDepth, uv).x * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
vec3 tex(vec2 uv){
  vec2 c = uv - 0.5; float r = dot(c, c);
  vec2 o = c * r * uAberr / uRes.x * 4.0;
  return vec3(texture2D(tColor, uv + o).r, texture2D(tColor, uv).g, texture2D(tColor, uv - o).b);
}
void main(){
  vec2 uv = vUv;
  vec3 col = tex(uv);
  // depth of field: blur radius grows with distance from the focus plane
  if (uAperture > 0.0) {
    float d = linDepth(uv);
    float coc = clamp(abs(d - uFocus) / max(uFocus, 0.001), 0.0, 1.0) * uAperture;
    vec3 acc = col; float n = 1.0;
    for (int i = 0; i < 24; i++) {
      float a = float(i) * 2.39996; float rr = sqrt(float(i) / 24.0);
      vec2 o = vec2(cos(a), sin(a)) * rr * coc / uRes;
      acc += tex(uv + o); n += 1.0;
    }
    col = acc / n;
  }
  // bloom: bright parts, blurred wide
  if (uBloom > 0.0) {
    vec3 b = vec3(0.0); float n = 0.0;
    for (int i = 0; i < 32; i++) {
      float a = float(i) * 2.39996; float rr = sqrt(float(i) / 32.0) * 0.06;
      vec2 o = vec2(cos(a), sin(a)) * rr * vec2(uRes.y / uRes.x, 1.0);
      vec3 s = texture2D(tColor, uv + o).rgb;
      b += max(s - uThresh, 0.0); n += 1.0;
    }
    col += uBloom * b / n * 4.0;
  }
  col *= uExposure;
  col = col / (1.0 + col * 0.15); // gentle shoulder
  // The render target is linear; encode to sRGB, then grade in display space.
  col = mix(col * 12.92, 1.055 * pow(max(col, 0.0), vec3(1.0 / 2.4)) - 0.055, step(0.0031308, col));
  float l = dot(col, vec3(0.2126, 0.7152, 0.0722));
  col = mix(vec3(l), col, uSat);
  col += uShadow * (1.0 - smoothstep(0.0, 0.5, l)) * 0.12 + uHigh * smoothstep(0.5, 1.0, l) * 0.12;
  vec2 c = uv - 0.5;
  col *= 1.0 - uVignette * smoothstep(0.25, 0.8, length(c * vec2(uRes.x / uRes.y, 1.0)) / max(1.0, uRes.x / uRes.y) * 1.2);
  col += (h(uv * uRes + uFrame * 17.0) - 0.5) * uGrain * 0.12;
  if (uLetterbox > 0.0) {
    float visible = (uRes.x / uLetterbox) / uRes.y;
    if (abs(uv.y - 0.5) > visible * 0.5) col = vec3(0.0);
  }
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

export const FilmPass: React.FC<FilmSettings> = (s) => {
  const { gl, scene, camera, size } = useThree();
  const frame = useCurrentFrame();
  const dpr = gl.getPixelRatio();
  const target = useMemo(() => {
    const t = new THREE.WebGLRenderTarget(size.width * dpr, size.height * dpr, { type: THREE.HalfFloatType });
    t.depthTexture = new THREE.DepthTexture(size.width * dpr, size.height * dpr);
    return t;
  }, [size.width, size.height, dpr]);
  useEffect(() => () => target.dispose(), [target]);
  const post = useMemo(() => {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        tColor: { value: null }, tDepth: { value: null }, uRes: { value: new THREE.Vector2() }, uFrame: { value: 0 },
        uBloom: { value: 0 }, uThresh: { value: 0.8 }, uFocus: { value: 5 }, uAperture: { value: 0 }, uAberr: { value: 0 },
        uVignette: { value: 0 }, uGrain: { value: 0 }, uSat: { value: 1 }, uExposure: { value: 1 }, uLetterbox: { value: 0 },
        uShadow: { value: new THREE.Vector3() }, uHigh: { value: new THREE.Vector3() }, uNear: { value: 0.1 }, uFar: { value: 100 },
      },
      depthTest: false,
      depthWrite: false,
    });
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    quad.frustumCulled = false;
    const sc = new THREE.Scene();
    sc.add(quad);
    return { mat, sc, cam: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1) };
  }, []);

  // Priority 1 means R3F stops rendering on its own and this callback renders instead.
  useFrame(() => {
    const u = post.mat.uniforms;
    u.tColor.value = target.texture;
    u.tDepth.value = target.depthTexture;
    u.uRes.value.set(size.width * dpr, size.height * dpr);
    u.uFrame.value = frame;
    u.uBloom.value = s.bloom ?? 0;
    u.uThresh.value = s.bloomThreshold ?? 0.8;
    u.uFocus.value = s.focus ?? 5;
    u.uAperture.value = (s.aperture ?? 0) * dpr;
    u.uAberr.value = s.aberration ?? 0;
    u.uVignette.value = s.vignette ?? 0;
    u.uGrain.value = s.grain ?? 0;
    u.uSat.value = s.saturation ?? 1;
    u.uExposure.value = s.exposure ?? 1;
    u.uLetterbox.value = s.letterbox ?? 0;
    u.uShadow.value.set(...(s.shadowTint ?? [0, 0, 0]));
    u.uHigh.value.set(...(s.highlightTint ?? [0, 0, 0]));
    const pc = camera as THREE.PerspectiveCamera;
    u.uNear.value = pc.near ?? 0.1;
    u.uFar.value = pc.far ?? 100;
    gl.setRenderTarget(target);
    gl.render(scene, camera);
    gl.setRenderTarget(null);
    gl.render(post.sc, post.cam);
  }, 1);
  return null;
};
