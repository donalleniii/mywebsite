# Don Allen III — A world of possibility

An experimental, playable portfolio on `codex/playable-world`, based on `main`.
The original homepage is preserved byte-for-byte in `classic.html`. Existing
product, support, legal, and resource routes are retained. No production-domain
or Cloudflare configuration changes are required for this experiment.

## Experience

Six procedural 3D islands connect Don’s story, eight projects, OMNIII, speaking,
learning resources, and collaboration. Select an island to guide a small explorer
across the world, read its content, and collect a principle. All six principles
reveal a seat at the center: a nod to *Make a Seat*. Principles are editorial
interpretations of the original website, not attributed quotations.

Drag horizontally or use the rotation buttons to orbit; reset returns to the
initial view. Island labels and the bottom navigation work with keyboard and
touch. Arrow keys move through the bottom navigation, Enter opens a destination,
and Escape closes it. Progress stays in this browser's local storage; the field
notes panel can reset it. No content is locked behind game completion.

Reduced-motion preferences start animation paused. The world caps pixel density
and rendering at 30fps and suspends rendering in hidden tabs. When WebGL or the
3D module is unavailable, the same content remains available through a simple
island directory. With JavaScript disabled, a visible link opens the classic site.

## Run locally

Requires Node.js 22+ (development tooling only).

```sh
npm ci
npm run dev
```

Open `http://127.0.0.1:4173`. The website itself is static: HTML, CSS, JavaScript,
and locally vendored Three.js 0.180.0 with its MIT license. There is no runtime
build step or third-party 3D CDN dependency. Google Fonts has system fallbacks;
the speaking panel's optional thumbnail comes from YouTube.

## Verify

```sh
npx playwright install chromium webkit
npm test
```

The browser suite exercises the full collection loop, persistence, reset,
keyboard focus, reduced motion, storage denial, 3D failure, no-JavaScript access,
touch selection, existing pages, and portrait/landscape resizing at phone,
small-phone, tablet, foldable-size, and laptop widths. Chromium and WebKit are
covered. These are browser/device emulations, not physical-device certification.
CSS includes safe-area-friendly spacing and viewport-segment support; a physical
dual-screen device should be checked before merging.

## Isolated preview

```sh
npm run export
```

`dist/` contains only public HTML, assets, existing redirects, and a Vercel
preview configuration. Tooling, tests, dependencies, and repository metadata
are excluded. Deploy this export to the separate `donalleniii-playable-preview`
project, never the production website project. Its standalone demo URL is:

https://donalleniii-playable-preview.vercel.app

The Vercel project is deliberately independent of `donalleniii.me`. Vercel calls
the first deployment of a new project “production”; here that refers only to
the isolated demo project and does not change the existing website.

`wrangler.json` is unchanged. `.assetsignore` excludes development files should
this branch later be served by the existing Cloudflare assets workflow. Review
and merge the branch only after approving the experiment. Until then, `main`
and the existing website are unchanged.
