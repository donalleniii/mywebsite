# Don Allen III — Same human. New interface.

An experimental playable portfolio on `codex/playable-world`, based on `main`.
The first view is a 3D LCD handheld containing a live overhead pixel game.
Visitors guide **Little Don** through five device generations:

1. A pocket LCD handheld — story and learning.
2. A beige 1990s CRT and keyboard — projects and creative process.
3. An open flip phone — speaking and collaboration.
4. A modern touch workstation — OMNIII and current systems.
5. An animated organic, holographic interface — future possibilities.

The hardware consists of procedural Three.js meshes. A single game canvas is
mapped onto each screen as a live texture. Little Don's player object, location,
and collected curiosity stay intact when devices change. The pixel character
is a stylized interpretation: glasses, beard, and an orange shirt. Game rooms
use the muted overhead studio/gallery direction of the supplied reference.

## Play

- **WASD / arrows:** move Little Don.
- **Enter / E / on-screen A:** activate a nearby portal.
- **Tap a portal on the device screen:** walk there and activate it.
- **On-screen direction pad:** tap to step or hold to walk.
- **Physical 3D controls:** handheld direction pad/A/B and flip-phone buttons work.
- **Drag the shell:** inspect the 3D object.
- **Focus screen:** zoom in for a more readable play area. A first screen tap on
  small displays also zooms in; subsequent taps interact.
- **Device timeline:** visit any device directly. Content shortcuts expose all
  portfolio information without requiring gameplay.

Sound is off until enabled. Reduced motion disables ambient motion and makes
initial device transitions immediate. Content dialogs suspend game movement.
Game state lasts for the current visit; a new visit starts on the handheld.

When 3D is unavailable, the same game remains playable as a 2D canvas. Without
JavaScript, the original portfolio is reachable via the classic-site link.

## Local development

Requires Node.js 22+ for tooling; the website itself is static.

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. No runtime build step or external model download is
needed. Three.js 0.180.0 is locally vendored with its MIT license. Google Fonts
has local system fallbacks. The renderer caps pixel density and runs at 30fps,
stopping updates in hidden tabs. Small device-label textures reduce GPU memory.

## Browser verification

```sh
npx playwright install chromium webkit
npm test
```

The suite checks default handheld rendering, WASD movement, actual 3D-screen
portal selection, character/collection continuity, all five devices, touch
controls, screen zoom, focus restoration, reduced motion, sound opt-in, content
access, fallbacks, and portrait/landscape layouts. Chromium and WebKit are used.
Physical phone and dual-screen hardware have not been certified.

## Preview and branch isolation

```sh
npm run export
```

`dist/` contains public HTML and assets with preview routing for Vercel. Deploy
only that export to the separate `donalleniii-playable-preview` project:

https://donalleniii-playable-preview.vercel.app

This project is independent of `donalleniii.me`. Vercel's “production” target
refers only to the standalone demo project's stable URL.

The original homepage remains byte-for-byte in `classic.html`. Existing product,
support, legal, and resource routes remain available. `wrangler.json` and the
original custom domain are unchanged. `.assetsignore` excludes development
files if this branch is later served by the original Cloudflare setup. Nothing
merges into `main` automatically; the draft PR remains for review.
