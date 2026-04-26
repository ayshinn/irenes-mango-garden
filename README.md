# 🥭 Irene's Mango Garden

A browser-based active farming game. Plant mango trees, harvest fruit, craft delicious products, and sell them for coins. Built with plain HTML, CSS, and JavaScript — no build step required.

**Made for Irene 🥭**

▶ **Play now: https://ayshinn.github.io/irenes-mango-garden/**

## How to Play

1. **Farm tab** — click an empty plot to plant (3g for Seedling). Click a planted plot to water it (2× growth). Click 🥭 when ready to harvest.
2. **Kitchen tab** — click a recipe to craft products. Buy ingredients from the shop below.
3. **Market tab** — sell products. Prices fluctuate every 60s. Watch for 2× market events every 5 min!
4. **Upgrades tab** — expand your farm, unlock tree tiers, faster crafting, and more.
5. **Stats tab** — track progress and earn milestone badges.

### Tips
- Water your plants — 2× growth is a big deal early on.
- Harvest before plots wither (idle 2× past grow time = yield halved).
- Market events: one product 2× price for 30 seconds — a flashing banner with a countdown circle appears on every tab. Stockpile for them!
- Cancel any in-progress craft with the × button on the craft slot — ingredients return to your inventory. Useful for breaking out of Auto-Craft loops.
- Harvest 500 mangos total to unlock ✨ Golden Mango (worth 1000g each).

## Deploy to GitHub Pages

1. Push this repo to GitHub (`main` branch, files at root).
2. Go to **Settings → Pages**.
3. Source: **Deploy from a branch** → `main` → `/` (root).
4. Save. Live at `https://<username>.github.io/<repo-name>/`.

No build step needed.

## File Structure

```
index.html          shell, tab layout
css/
  style.css         pixel art theme, layout, animations
  pixel-font.css    Google Fonts "Press Start 2P" import
js/
  main.js           init, game loop, milestone checking
  data.js           all static data (products, upgrades, tree tiers, milestones)
  farm.js           plot grid, plant/water/harvest state machine
  recipes.js        crafting queue logic
  market.js         sell logic, price fluctuation, market events
  upgrades.js       upgrade tree, apply effects to game state
  ui.js             render all tabs, toasts, animations
  save.js           localStorage save / load / reset
```
