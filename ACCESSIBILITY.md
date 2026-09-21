# Playable preview accessibility checks

This pass covers the playable homepage, its nine device palettes, all six portfolio reading sections, and the blocks/shore workshops. The preserved classic site and external destinations are outside this audit.

## Readability changes

- Normal text uses paired foreground/background colors. The desktop’s ink is darker; every device ink/paper pair exceeds WCAG AA’s 4.5:1 normal-text minimum.
- The studio’s dark theme no longer overrides text or card backgrounds inside a device’s reading surface.
- Portal labels have larger, bold lettering on opaque device-colored plates. Handheld scanlines no longer cross the text. Collectible diamonds have contrasting outlines.
- Thumbnail and animated project captions have opaque backplates, independent of the image beneath them.
- Small page labels, reading-panel text, navigation, and controls are larger. Main control targets are at least 44px high; mobile headers wrap, and device navigation uses a readable three-column layout.
- Keyboard focus has explicit contrasting outlines, including inverted active tabs/buttons. Forced-colors users retain a system focus indicator.

## Repeatable verification

Run `npx playwright test tests/accessibility.spec.js --workers=1`.

The Chromium axe matrix checks WCAG 2 A/AA, 2.1 A/AA, and 2.2 AA rules on the home page and every portfolio section in every device, in both studio themes, plus both workshops (114 scans). Direct computed-style assertions also verify that reading text retains its device ink in both themes: overlapping WebGL surfaces can make axe’s contrast analysis inconclusive. Separate numerical checks cover the canvas label color pairs, since axe cannot inspect text drawn into WebGL/canvas. Chromium and WebKit reflow/keyboard checks cover 320px width, a 720px viewport representing a 1440px desktop at 200% zoom, and phone landscape. Existing device/studio/workshop tests cover movement, touch, modal focus, reduced motion, image fallbacks, and keyboard workshop controls.

Also visually review the actual rendered screens and thumbnail captions. The miniature game deliberately remains a small illustrative view until “Focus screen” or a portal is selected; portfolio reading content is semantic HTML, and equivalent content buttons do not require playing the game. A viewport-size reflow test does not replace testing actual browser text scaling or zoom with assistive technology.

Automated passes are not WCAG certification. This is not a comprehensive screen-reader user study, and 3D/canvas interactions, browser zoom, external videos/forms, and the preserved classic pages warrant continued manual review.

Standards: [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html), [target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).
