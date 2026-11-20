# Style catalogue

21 looks, every one drawn entirely in code. Use the id with `new-project.mjs --styles`. Each file has the look, how to build it, motion, how it draws the explainer devices, captions, a starting score and what to check in the stills.

## Paper and print

| Id | Look | Engine | Best for |
|---|---|---|---|
| [cut-paper-collage](cut-paper-collage.md) | Stop-motion collage of real-looking paper stocks, torn and cut, taped to a board | Canvas + shader | Cities, nature, cosy stories, processes |
| [paper-shadowbox](paper-shadowbox.md) | Layered cut-paper diorama with real shadows between layers, a jointed paper puppet | three.js | Science "inside the thing" explainers |
| [construction-paper](construction-paper.md) | Crude construction-paper cutout cartoon, big round heads, rough stop motion | Canvas + shader | Comic history, absurd true stories |
| [editorial-collage](editorial-collage.md) | Torn paper, halftone cutouts, risograph grain, cream, black and red | Canvas + shader | Documentary, politics, economics |
| [woodblock-print](woodblock-print.md) | Animated woodblock print: three plates, misregistration, wood grain | Canvas + shader | History, nature, weather, the sea |
| [watercolour](watercolour.md) | Loose wet-on-wet watercolour with blooms and paper texture | Canvas + shader | Gentle history, travel, nature |
| [retro-futurism](retro-futurism.md) | Atomic-age poster: gouache and airbrush, chrome curves, teal, cream, orange | SVG + shader | Space, inventions, "the future that was" |

## Illustration and cartoon

| Id | Look | Engine | Best for |
|---|---|---|---|
| [painted-anime](painted-anime.md) | Painted feature-anime look: lush skies, cel characters, warm light | Canvas + shader | Nostalgic, human, nature stories |
| [tv-cartoon](tv-cartoon.md) | Bold-outline flat-colour prime-time TV cartoon | SVG | Comic explainers, everyday science |
| [quirky-absurd](quirky-absurd.md) | Wobbly lines, googly eyes on everything, pastel candy colours | SVG | Weird facts, comedy |
| [flat-vector-science](flat-vector-science.md) | Flat vector shapes, vivid gradients on deep navy, cute mouthless creatures | SVG | Science, space, biology, big numbers |
| [ink-scroll](ink-scroll.md) | Sumi-e handscroll on rice paper, red seals, sideways scroll | SVG | Calm history, philosophy, timelines |
| [cartoon-3d](cartoon-3d.md) | 2D hand-drawn characters on billboards in a toon-shaded 3D world | three.js | Comic history, mysteries, "what went wrong" |

## 3D and cinematic

| Id | Look | Engine | Best for |
|---|---|---|---|
| [toy-brick](toy-brick.md) | Glossy toy bricks in tabletop stop motion, macro lens | three.js | How things are built, playful processes |
| [pixel-diorama](pixel-diorama.md) | Pixel-art sprites stood up in a lit 3D miniature, tilt-shift | three.js | Games, journeys, retro tech |
| [neon-megacity](neon-megacity.md) | Rain-soaked neon city at night, reflections, teal and magenta | three.js | Tech, cities, the future, cyber topics |
| [raymarched-sci-fi](raymarched-sci-fi.md) | One-shader sci-fi world: canyon flight, ringed planet, film optics | Shader (SDF) | Space, speed, epic openers |
| [holo-3d](holo-3d.md) | Holographic interfaces, glass and chrome, cyan and magenta light | three.js | AI, tech, data, futures |
| [map-desk](map-desk.md) | Documentary map table: pins, red string, taped photos, desk lamp | three.js | Geography, investigations, history |

## Motion graphics and data

| Id | Look | Engine | Best for |
|---|---|---|---|
| [mono-motion-graphics](mono-motion-graphics.md) | Black, white and one yellow: glowing counters, block figures, app panels | SVG | Tech claims, numbers, phone-first shorts |
| [data-3d](data-3d.md) | 3D data journalism: instanced figures, column maps, bars, node graphs | three.js | Statistics, studies, "the numbers say" |

## Choosing

- Numbers and claims: mono-motion-graphics, data-3d, flat-vector-science.
- History and place: woodblock-print, ink-scroll, map-desk, watercolour, cartoon-3d.
- How something works or is made: toy-brick, paper-shadowbox, flat-vector-science, holo-3d.
- Comedy and absurd true stories: cartoon-3d, construction-paper, quirky-absurd, tv-cartoon.
- Mood and spectacle: neon-megacity, raymarched-sci-fi, painted-anime, pixel-diorama.
- Cosy and crafted: cut-paper-collage, paper-shadowbox, watercolour.

Several styles from different rows make the most useful comparison.

These looks are adapted from the films in AI Samson's Claude Video Prompt Library. Styles that used an image model there are rebuilt here to be drawn in code.
