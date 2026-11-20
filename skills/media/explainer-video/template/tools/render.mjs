#!/usr/bin/env node
// Render stills, films and the side-by-side comparison.
//
//   node tools/render.mjs --stills                   # one still per beat, every style
//   node tools/render.mjs --stills --frames 0,45,300 --styles cartoon-3d
//   node tools/render.mjs                            # every style to out/<id>.mp4, then compare
//   node tools/render.mjs --styles a,b --no-compare
//
// Bundles once, then renders in headless Chrome with ANGLE so three.js has WebGL.
// Stills go to out/stills/<id>/f<frame>.png. Films go to out/<id>.mp4 and are copied to
// public/renders/ for the "compare" composition, which writes out/compare.mp4 and
// out/compare.html (open it with a file:// URL; no server needed).

import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";

const root = process.cwd();
const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n, d) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : d;
};

const proj = JSON.parse(fs.readFileSync(path.join(root, "src/data/project.json"), "utf8"));
const beats = JSON.parse(fs.readFileSync(path.join(root, "src/data/beats.json"), "utf8"));
const ids = opt("styles") ? opt("styles").split(",") : proj.styles;
const unknown = ids.filter((id) => !proj.styles.includes(id));
if (unknown.length) {
  console.error(`not in project.json styles: ${unknown.join(", ")} (run new-project.mjs --styles to add them)`);
  process.exit(2);
}
const chromiumOptions = { gl: "angle" };
const concurrency = opt("concurrency") ? Number(opt("concurrency")) : null;

console.log("bundling...");
const serveUrl = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
const out = path.join(root, "out");
fs.mkdirSync(out, { recursive: true });

if (flag("stills")) {
  const fps = proj.fps;
  const frames = opt("frames")
    ? opt("frames").split(",").map(Number)
    : beats.length
      ? beats.map((b) => Math.min(proj.durationInFrames - 1, Math.round(((b.start + b.end) / 2) * fps)))
      : [0, Math.floor(proj.durationInFrames / 2), proj.durationInFrames - 1];
  const written = [];
  for (const id of ids) {
    const composition = await selectComposition({ serveUrl, id, chromiumOptions });
    for (const frame of frames) {
      const output = path.join(out, "stills", id, `f${String(frame).padStart(5, "0")}.png`);
      await renderStill({ composition, serveUrl, output, frame, chromiumOptions, imageFormat: "png" });
      written.push(output);
    }
    console.log(`${id}: ${frames.length} stills`);
  }
  console.log(JSON.stringify({ stills: written }, null, 2));
  process.exit(0);
}

const films = [];
for (const id of ids) {
  const composition = await selectComposition({ serveUrl, id, chromiumOptions });
  const output = path.join(out, `${id}.mp4`);
  let last = -1;
  await renderMedia({
    composition, serveUrl, codec: "h264", crf: 18, outputLocation: output, chromiumOptions, concurrency,
    onProgress: ({ progress }) => {
      const p = Math.floor(progress * 10);
      if (p !== last) { last = p; process.stdout.write(`\r${id}: ${p * 10}%`); }
    },
  });
  process.stdout.write("\n");
  fs.mkdirSync(path.join(root, "public/renders"), { recursive: true });
  fs.copyFileSync(output, path.join(root, "public/renders", `${id}.mp4`));
  films.push(output);
}

const result = { films };
const all = proj.styles.filter((id) => fs.existsSync(path.join(root, "public/renders", `${id}.mp4`)));
if (!flag("no-compare") && all.length > 1) {
  // Re-bundle so the compare composition sees the fresh files in public/renders.
  const url2 = await bundle({ entryPoint: path.join(root, "src/index.ts"), publicDir: path.join(root, "public") });
  const composition = await selectComposition({ serveUrl: url2, id: "compare", chromiumOptions, inputProps: { ids: all } });
  const output = path.join(out, "compare.mp4");
  await renderMedia({ composition, serveUrl: url2, codec: "h264", crf: 20, outputLocation: output, chromiumOptions, concurrency, inputProps: { ids: all } });
  result.compare = output;

  const tall = proj.height > proj.width;
  const cards = all
    .map((id) => `<figure><figcaption>${id} <button data-id="${id}">sound</button></figcaption><video src="${id}.mp4" playsinline muted preload="auto"></video></figure>`)
    .join("\n");
  const html = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${proj.title}: style comparison</title>
<style>
:root{color-scheme:dark}body{margin:0;background:#111;color:#eee;font:15px system-ui,sans-serif;padding:16px}
.grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(${tall ? 220 : 420}px,1fr))}
figure{margin:0;background:#1c1c1c;border-radius:8px;overflow:hidden}figcaption{display:flex;justify-content:space-between;align-items:center;padding:8px 10px;font-weight:600}
video{display:block;width:100%;height:auto}button{background:#333;color:#eee;border:0;border-radius:4px;padding:4px 10px;cursor:pointer}button.on{background:#E3E302;color:#000}
.bar{display:flex;gap:10px;align-items:center;margin-bottom:12px}input[type=range]{flex:1}
</style>
<div class="bar"><button id="play">Play all</button><input id="scrub" type="range" min="0" max="1000" value="0"><span id="time">0.0 s</span></div>
<div class="grid">${cards}</div>
<script>
const vids=[...document.querySelectorAll('video')];const lead=vids[0];
document.getElementById('play').onclick=e=>{const go=lead.paused;vids.forEach(v=>go?v.play():v.pause());e.target.textContent=go?'Pause all':'Play all'};
document.querySelectorAll('figcaption button').forEach((b,i)=>b.onclick=()=>{vids.forEach((v,j)=>{v.muted=j!==i||!v.muted;});document.querySelectorAll('figcaption button').forEach((x,j)=>x.classList.toggle('on',!vids[j].muted));});
const scrub=document.getElementById('scrub');scrub.oninput=()=>{const t=scrub.value/1000*(lead.duration||0);vids.forEach(v=>v.currentTime=t)};
setInterval(()=>{if(!lead.duration)return;scrub.value=Math.round(lead.currentTime/lead.duration*1000);document.getElementById('time').textContent=lead.currentTime.toFixed(1)+' s';vids.forEach(v=>{if(v!==lead&&Math.abs(v.currentTime-lead.currentTime)>0.1)v.currentTime=lead.currentTime})},250);
</script>`;
  fs.writeFileSync(path.join(out, "compare.html"), html);
  result.compareHtml = `file://${path.join(out, "compare.html")}`;
}
console.log(JSON.stringify(result, null, 2));
