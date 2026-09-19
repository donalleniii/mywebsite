# Personal worlds: interview to build

Direction from Don’s September 19 interview: adaptability, flexibility, customization, and personalization connect the objects and the work. The portfolio should communicate creative range and demonstrated value, and make collaboration easy to initiate.

## Built in this iteration

- **Ocean / attention:** A hands-on, planar rigid-body scene inside the existing 3D rock-world screen. Visitors can drag, select, rotate, release, and restack irregular stones. Matter.js supplies collisions, friction, angular motion, and soft or natural gravity. A stack can topple; there is no score or failure penalty. Don’s field notes describe breathing, time away from devices, tension becoming clarity, and trying again.
- **Blocks / possible cities:** A second physics scene with plain blocks, cylinders, triangles, and planks. The latest iteration uses a plain stacking surface and unpainted wooden shapes, with six pieces falling into place on entry. Field notes connect childhood building to Don’s ambition for walkable, accessible, nature-integrated places. These are playful sketches, not an urban planning simulation.
- **Adaptability:** The opening and story copy now use Don’s stated principles. Nine interfaces, the persistent character, alternate input methods, themes, and the classic route put that idea into practice.
- **Proof of work:** The Meta Connect moment leads the studio shelf, alongside the official MasterClass series artwork and its trailer/sample destination. The existing full YouTube thumbnails, project previews, and collaborator collection remain.
- **Invitation:** The existing Strategic Partnership Inquiry Google Form is available from the header, introduction, top of the collaboration screen, workshops, and closing invitation. No new form, altered Google Sheet, or meeting booking is implied.
- **Keepsake:** Visitors can download a PNG postcard recording the worlds explored in this visit. Hands-on milestones add a “made by you” stamp. The download is created in the browser; it is not uploaded.

## Input and lifecycle

Mouse/touch dragging moves pieces and releases after a drag. Tapping picks a piece up for rotation with visible buttons; Release lets go. Keyboard arrows move, Q/E rotate, Space releases, and Enter cycles pieces. All controls also have ordinary keyboard-focusable equivalents. The physics can be paused independently. Reduced motion removes ambient waves; deliberate user-controlled physics remains available. Physics and listeners are disposed when leaving a workshop, and piece positions survive revisiting during the current page session. Hidden tabs do not advance simulation. The workshops also work when WebGL falls back to 2D. A failed workshop module leaves the portfolio tabs and classic route usable.

## Measurement boundary

Each click to the existing collaboration form emits a `don:conversion` browser event:

```js
{ name: 'collaboration_form_open', placement: 'header', world: 'handheld' }
```

Only fixed placement/world labels are included. This is an outbound-intent event, not a submission or booked meeting. If a `window.va` analytics adapter is installed, the same custom event is forwarded. The current Vercel team is on Hobby, which does not include Vercel custom events; no paid plan was enabled. The event hook is ready for a supported analytics destination, but this iteration does not provide a live aggregate click dashboard. Actual submissions remain measurable in the existing Google Form’s Responses view/linked sheet. Measuring booked meetings needs the actual scheduling flow and its completion signal. No fabricated conversions or external test form submissions are sent.

## Sources

Personal memories and principles: Don’s spoken interview in this thread (edited for readable copy).

Official MasterClass: https://www.masterclass.com/series/achieve-more-with-gen-ai

MasterClass co-instructor listing: https://work.masterclass.com/em/genai-7

Original collaboration form: https://forms.gle/QVLGQnNdkHDoeVA77 (verified title: Strategic Partnership Inquiry).

Physics: Matter.js 0.20.0, locally vendored with MIT license. The UMD root is changed from `this` to `globalThis` so it can load as a browser ES module. No external physics runtime request is needed.
