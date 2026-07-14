---
name: verify
description: Build/launch/drive recipe for verifying changes to Irene's Mango Garden (static ES-module browser game)
---

# Verifying Irene's Mango Garden

Static site, no build step. ES modules require an HTTP server (file:// fails CORS).

## Launch

```bash
cd <repo root>
python3 -m http.server 8123 &   # then open http://localhost:8123/index.html
```

## Drive (headless)

Python Playwright works well (`pip3 install --user playwright`, browsers cached in
`~/Library/Caches/ms-playwright`; if version mismatch run
`python3 -m playwright install chromium-headless-shell`).

Useful patterns:

- Grab game state from the page:
  `page.evaluate("async () => { const { state } = await import('./js/main.js'); window.__state = state; }")`
  then rig it: `window.__state.coins = 500`, `window.__state.inventory.mango = 20`,
  `window.__state.plots[0].progress = 1` (forces plot ready next tick).
- Flows: plant/water/harvest = click `.plot[data-index="N"]` (action depends on plot state);
  craft = click `.recipe-card[data-recipe="mango_juice"]`; sell = click
  `[data-sell="mango_juice"][data-mode="one"]`; tabs = `.tab-btn[data-tab="kitchen"]`.
- Collect `page.on('pageerror')` + console errors — the game has no error UI.

## Gotchas

- UI re-renders innerHTML every 200ms (`RENDER_INTERVAL` in main.js): element handles go
  stale fast — re-query selectors per click, expect occasional detached-element errors
  when click-spamming.
- Game autosaves to localStorage every 10s — use a fresh browser context per run for
  clean state.
- Sprite scene strips (js/sprites.js) render on separate canvases outside the re-rendered
  containers; check them via screenshot, and test `reduced_motion='reduce'` context
  (scenes must render one static frame, no rAF loop).
