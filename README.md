# pedrov-android-mvp

# Parallax Creator

A minimal single-page web app for building parallax backgrounds. Runs entirely in the browser with no backend.

## Usage

1. Open `index.html` in a modern browser.
2. Use **+ Add Images** to load PNG/JPG files or drag and drop images onto the page. Each file becomes a layer.
3. Adjust layer properties in the **Layers** panel.
4. Configure global settings (canvas size, base speed, direction, easing, sky colors, sun rays) in the toolbar.
5. Press **Export** to download a `parallax_pack.zip` containing the runtime (`parallax.html`, `parallax.css`, `parallax.js`, `parallax.json`) and all images.

Keyboard shortcuts:

* `↑` / `↓` – select previous/next layer
* `Delete` – remove selected layer
* `Space` – pause/resume preview

## Integration

Unzip the exported package in your project and embed the parallax using:

```html
<script src="parallax.js"></script>
<script>
  fetch('parallax.json').then(r=>r.json()).then(cfg=>{
    Parallax.start(document.getElementById('bg'), cfg, {baseSpeed:120});
  });
</script>
```

This draws the parallax into the `<canvas id="bg"></canvas>` element.

## Notes

* All assets are kept in memory and never uploaded.
* Large images (>4096px) may impact memory usage and FPS. The status bar displays estimates.
* The project is deliberately framework‑free; only vanilla HTML/CSS/JS.
