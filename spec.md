# Irene's Mango Garden — Game Spec

## Overview

Browser-based active management farming game. Plant mango trees, harvest fruit,
craft mango products, sell for coins, unlock upgrades, expand farm. Cute pixel-CSS
aesthetic. Single-player, infinite progression. Runs 100% client-side, hosted on
GitHub Pages.

**For:** Irene 🥭

---

## Tech Stack

- `index.html` — shell, tab layout
- `css/style.css` — pixel art theme, CSS sprites, animations
- `css/pixel-font.css` — Google Fonts "Press Start 2P" for pixel text
- `js/main.js` — init, game loop (requestAnimationFrame tick)
- `js/farm.js` — plot grid, plant/water/harvest logic
- `js/recipes.js` — product definitions and crafting
- `js/market.js` — sell prices, demand, market events
- `js/upgrades.js` — upgrade tree definitions + apply logic
- `js/ui.js` — render all panels, toasts, animations
- `js/save.js` — localStorage save/load/reset
- `js/data.js` — all static data (growth times, prices, unlock costs)

No build step. Plain ES modules via `<script type="module">`. Works on GitHub Pages as-is.

---

## Game Screens / Tabs

```
[ 🌳 Farm ] [ 🍴 Kitchen ] [ 🏪 Market ] [ ⬆️ Upgrades ] [ 📊 Stats ]
```

All tabs visible at once on desktop. On mobile, tab-switch UI.

---

## Core Loop

```
Plant seed → Water (speeds growth) → Harvest mangos
    → Craft products in Kitchen
        → Sell in Market
            → Earn coins → Buy upgrades / expand farm
```

Each cycle takes real seconds (fast early game, scaled by upgrades).

---

## Farm Tab

### Plot Grid
- Starts: 2×2 grid (4 plots)
- Max (fully upgraded): 5×5 grid (25 plots)
- Unlock new rows/columns via Upgrades

### Plot States
1. **Empty** — click to plant (costs seeds, seeds cost coins)
2. **Planted** — progress bar fills over N seconds
3. **Watered** — progress bar fills 2× faster (click water can on plot)
4. **Ready** — bouncing mango emoji, click to harvest
5. **Withered** — if not harvested in time (2× grow time), yield halved

### Mango Tree Tiers (unlock via upgrades)
| Tier | Name | Grow Time | Yield | Unlock Cost |
|------|------|-----------|-------|-------------|
| 1 | Seedling | 30s | 1–2 mangos | start |
| 2 | Young Tree | 25s | 2–3 mangos | 500g |
| 3 | Mature Tree | 20s | 3–5 mangos | 2000g |
| 4 | Ancient Tree | 15s | 5–8 mangos | 8000g |

### Water Can
- Starts with 3 charges, refills over time (1 charge / 20s)
- Upgrade: more charges, faster refill

---

## Kitchen Tab

### Crafting
- Grid of unlockable recipe cards
- Each recipe: shows required mangos + ingredients, craft time, output qty
- Click recipe → queues craft (one queue slot by default, upgradeable)
- Progress bar shows craft time
- Finish → product goes to inventory

### Products & Recipes

| Product | Mangos | Other Ingredients | Craft Time | Base Sell |
|---------|--------|-------------------|------------|-----------|
| Fresh Mango | 1 | — | instant | 5g |
| Mango Salsa | 3 | Tomato, Onion | 15s | 35g |
| Mango Juice | 2 | Water | 10s | 20g |
| Mango Jam | 4 | Sugar | 25s | 60g |
| Mango Smoothie | 2 | Milk | 12s | 28g |
| Dried Mango | 3 | — | 40s | 55g |
| Mango Sticky Rice | 3 | Rice, Coconut Milk | 35s | 75g |
| Mango Ice Cream | 4 | Cream, Sugar | 45s | 90g |
| Mango Bingsoo | 5 | Shaved Ice, Red Bean | 50s | 120g |

### Ingredients
- Bought from Market (auto-buy toggle option in upgrades)
- Stock: Sugar, Tomato, Onion, Milk, Cream, Rice, Coconut Milk, Red Bean, Water (free)
- Prices low relative to output value (ingredients are not the bottleneck)

### Recipe Unlock
- First 3 (Fresh Mango, Juice, Salsa) available from start
- Rest unlock via Upgrades panel, cost coins

---

## Market Tab

### Selling
- Inventory grid showing held products + quantities
- "Sell All" button per product type
- "Sell 1" button for manual control
- Each product shows current price

### Dynamic Pricing
- Base price per product (see table above)
- Mild demand fluctuation: ±20% every 60s (visual indicator: arrow up/down)
- "Market Event" popup every 5 min: one product 2× price for 30s (encourages stockpiling)

### Coin Display
- Always visible top bar: 🪙 [amount]
- Animated +N coin toast on each sale

---

## Upgrades Tab

### Categories
1. **Farm** — unlock plot rows/columns, tree tier upgrades, withering grace period
2. **Water** — more water can charges, faster refill, auto-water (late game)
3. **Kitchen** — extra craft queue slots, faster craft times, auto-craft toggle
4. **Market** — higher base prices (+10% per tier), demand event notifications
5. **Garden Decor** — cosmetic unlocks (flowers, signs, paths) — no gameplay effect, purely cute

### Upgrade Tree Structure
- Linear per category with 3–5 tiers each
- Each tier: name, description, cost, effect
- Locked upgrades show greyed-out with cost visible
- Unlocking plays a pixel sparkle animation

### Notable Upgrades
- **Auto-Harvest** (Farm tier 4): plots auto-harvest when ready
- **Auto-Water** (Water tier 4): water can applies automatically
- **Auto-Craft** (Kitchen tier 4): re-queues last recipe automatically
- **Golden Mango** (secret): after selling 500 total mangos, rare golden mango appears — sells for 1000g

---

## Stats Tab

- Total mangos harvested
- Total products crafted (per type)
- Total coins earned
- Playtime
- Favorite product (most crafted)
- Small milestones list ("First harvest!", "Salsa master!", etc.)

---

## Progression Feel

| Time | State |
|------|-------|
| 0–2 min | 4 plots, basic mangos, sell fresh |
| 2–5 min | Unlock salsa + juice, first kitchen crafts |
| 5–15 min | Expand to 3×3, tier 2 trees, unlock 4–5 products |
| 15–30 min | Auto-harvest/water, full recipe list, market events matter |
| 30 min+ | 5×5 farm, ancient trees, auto-craft, golden mango hunt |

---

## Visual Style

- **Font:** "Press Start 2P" (Google Fonts) — all UI text
- **Palette:** warm tropical (mango orange `#FF9900`, leaf green `#4CAF50`, sky `#87CEEB`, cream `#FFF8E7`)
- **Sprites:** CSS-drawn pixel art — mango tree stages as div+pseudo-element compositions
- **Animations:**
  - Plots pulse gently when ready to harvest
  - Coins animate upward (+N) on sale
  - Kitchen craft bar fills with juice-like animation
  - Tab transitions: quick fade
  - Bounce on button hover
- **Background:** tiled pixel grass pattern (CSS)
- **UI panels:** rounded pixel-border style (box-shadow pixel staircase trick)

---

## Save System

- Auto-save to `localStorage` every 10s
- Save slot key: `irenesMangarden_save`
- Saves: coins, inventory, plot states, upgrade levels, stats, settings
- "New Game" button in Stats tab (confirm dialog)
- Offline progress: on load, calculate elapsed time and fast-forward farm growth (not kitchen or market)

---

## File Build Order (Implementation Steps)

### Step 1 — Scaffold
- `index.html` with tab nav shell
- `css/style.css` base: palette vars, pixel font, tab layout, button styles
- `js/data.js` all static data (products, upgrades, tree tiers)
- `js/save.js` save/load/reset

### Step 2 — Farm
- `js/farm.js` plot grid, plant/water/harvest state machine
- Farm tab HTML render in `js/ui.js`
- CSS: plot sprites (empty/planted/watered/ready/withered)
- Water can UI + recharge timer

### Step 3 — Kitchen
- `js/recipes.js` crafting queue logic
- Kitchen tab render
- CSS: recipe cards, craft progress bar

### Step 4 — Market
- `js/market.js` inventory display, sell logic, price fluctuation, market events
- Market tab render
- Coin toast animation

### Step 5 — Upgrades
- `js/upgrades.js` tree, apply effects
- Upgrades tab render
- Unlock animations

### Step 6 — Stats + Polish
- Stats tab
- Milestone toasts
- Golden mango secret
- Offline progress calc
- Mobile layout tweaks
- README for GitHub Pages deploy

---

## GitHub Pages Deploy

- Repo: `irenes-mango-garden`
- No build step needed — plain HTML/CSS/JS
- `index.html` at root
- Enable Pages on `main` branch → `/` root
