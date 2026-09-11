---
"timothyjoh-skills": patch
---

`playlist-to-skill` gains `pts_add.js` for folding specific videos into an existing skill without editing the YouTube playlist (useful when the playlist belongs to someone else). Each video is appended to `scope.json` with `source: "manual"` and survives later re-enumerations; `sources.md` lists them in a "Manual additions" table. The skill also reuses an existing scope for the same playlist ID even after its directory was renamed.
