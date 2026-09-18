# Don Allen III — Same human. New interface.

An experimental playable portfolio on `codex/playable-world`, based on `main`.
The first view is a 3D LCD handheld containing a live overhead pixel game.
Visitors guide **Little Don** through six playable interfaces:

1. A pocket LCD handheld — story and learning.
2. A beige 1990s CRT and keyboard — projects and creative process.
3. An open flip phone — speaking and collaboration.
4. A modern touch workstation — OMNIII and current systems.
5. An animated organic, holographic interface — future possibilities.
6. An open hardback sketchbook — ink-drawn Don, stories, and a curiosity library.

The hardware consists of procedural Three.js meshes. A single game canvas is
mapped onto each screen as a live texture. Little Don's player object, location,
and collected curiosity stay intact when devices change. The pixel character
follows the supplied drawing: tied-up locs, oversized square glasses, a full
beard, open jacket, and sneakers, with a small alternating walk cycle. Game rooms
use the muted overhead studio/gallery direction of the supplied reference.

## Play

- **WASD / arrows:** move Little Don.
- **Enter / E / on-screen A:** activate a nearby portal.
- **Tap a portal on the device screen:** walk there and activate it.
- **On-screen direction pad:** tap to step or hold to walk.
- **Physical 3D controls:** handheld direction pad/A/B and flip-phone buttons work.
- **Drag the shell:** inspect the 3D object. Devices rotate into view on arrival;
  a fine desktop pointer adds a gentle tilt while viewing the whole device.
- **Sun / moon button:** switch between a warm daylight studio and a violet
  nighttime studio, including device lighting, controls, and content panels.
  The theme follows the system until chosen, then remembers the choice when
  browser storage is available.
- **Focus screen:** zoom in for a more readable play area. A first screen tap on
  small displays also zooms in; subsequent taps interact.
- **Device timeline:** visit any device directly. Content shortcuts expose all
  portfolio information without requiring gameplay.

Sound is off until enabled. Reduced motion disables ambient motion and makes
device transitions immediate, and disables pointer-follow tilt.

Selecting a content portal or shortcut zooms the camera into the actual screen.
A semantic HTML reading surface tracks the projected display, with scrollable
content, section tabs, working links, and a Classic / readable option. On the
book, the same interface becomes ink on paper. Reading suspends movement;
Escape or Back to play restores the player, focus, and page position.
Game state lasts for the current visit; a new visit starts on the handheld.

When 3D is unavailable, the same game remains playable as a 2D canvas. Without
JavaScript, the original portfolio is reachable via the classic-site link.

## Studio shelf and visual portfolio

The shelf below the device timeline opens three in-screen collections: video
posters, Systems I Build, and Advisor & Collaborator. Speaking retains the
original YouTube videos and timestamps; Beyond Our Reality uses the verified
OpenAI channel upload. Missing high-resolution thumbnails fall back to standard
thumbnails, then to a readable poster with the video link intact.

Projects include the original FormWright artwork plus small animated visual
studies for the other tools. These are lightweight previews, not embedded apps;
links open the actual projects. Animation runs only for visible previews, respects
motion settings, and is disposed when leaving the section. The 19-name collaborator
stamp collection preserves the original site's relationship label and names.

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
portal selection, character/collection continuity, all six interfaces, touch
controls, screen zoom, focus restoration, in-screen navigation and scrolling,
book portal travel, reduced motion, sound opt-in, content
access, fallbacks, theme persistence and system preferences (including unavailable
storage), static reduced-motion rendering, and portrait/landscape layouts. Chromium and WebKit are used.
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
