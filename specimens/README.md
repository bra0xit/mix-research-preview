# MIX living specimens

Three original, procedurally modelled WebGL nature sculptures. No stock models, external image dependencies, or build step. The mushroom includes two fruiting bodies, radial gills, mycelium, and drifting spores. The fish has a flexing body, separate ribbed fin membranes, scales, eyes, and gill covers. The lizard has four limbs with five digits each, individual scales, breathing motion, and an undulating tapered tail.

These are artistic depictions, not anatomical/species-identification reference models. The DNA point view is illustrative, not a measured sample.

## View

Serve this folder over HTTP(S). ES modules cannot run by simply double-clicking index.html.

- Gallery: `index.html`
- Fish: `index.html?specimen=fish`
- Lizard: `index.html?specimen=lizard`
- English: add `&lang=en` (or `?lang=en` if there are no other query parameters).
- Embed: add `&embed=1`. This removes surrounding copy and uses a transparent background.

## Put on either MIX website

The gallery’s “Use on the website” button produces the appropriate iframe for the selected sculpture. Example:

```html
<iframe
  src="specimens/index.html?specimen=fish&embed=1&lang=sv"
  title="Interaktiv fiskskulptur från MIX Research"
  loading="lazy"
  style="width:100%;height:600px;border:0;background:transparent"
></iframe>
```

For the option-b folder use `../specimens/index.html` or the full hosted URL. Embed against the existing dark green page background. Use responsive heights of 380–600px. Load one specimen at a time when possible; each iframe creates a WebGL context.

## Controls and accessibility

- Drag / touch rotates. Zoom buttons work on all devices; two-finger pinch works in embed mode.
- Focus the viewer and use arrow keys to rotate, +/- to zoom, 0 to reset.
- Slider blends the surface into ~24,000 surface-sampled points.
- Pause freezes biological motion. Reduced-motion preference starts paused.
- Background tabs and offscreen viewers suspend their animation loops. Rendering is capped around 30fps with pixel ratio limited to 1.8.
- “Save transparent image” exports the current angle and surface/trace blend as PNG.
- `posters/` contains actual transparent PNG renders and provides a static fallback when WebGL initialization fails.

## Files

- `models.js`: geometry, surface materials, skinning-like vertex movement and surface sampling.
- `gallery.js`: lighting, orbit interaction, localization, exports and lifecycle.
- `gallery.css`: independent styles scoped by the standalone document.
- `vendor/`: locally hosted Three.js 0.160.1 and OrbitControls. MIT license in `vendor/THREE-LICENSE.txt`; the OrbitControls import is adjusted to the local module.

The original homepage and science page are unchanged. The gallery is an isolated review surface, ready to embed after choosing placement.
