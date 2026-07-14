# Sprite & Visual Design Ideas

Running list of sprite-powered game design directions, so we can pick differently later.
Status reflects what's implemented in `js/sprites.js` / `js/sprites-data.js`.

## The system so far

- **Bora** (Cooking-Mama chibi, double buns) is the game's character, in three costumes:
  Gardener (Farm), Chef (Kitchen, wearing Dasom's white shirt + red apron), Merchant (Market).
- Each tab has a **scene strip**: a pixel canvas above the main UI where the cast animates.
- Sprites are char grids + palettes in `js/sprites-data.js` — no image files. New frames are
  drawn by adding rows of characters; the engine (`js/sprites.js`) plays sequences.
- Actions trigger from real game events (plant/water/harvest clicks, craft queue state, sales).

## Options

### 1. Per-recipe craft boards — ✅ implemented
The board in the kitchen strip plays a different animation depending on what's cooking:
blender (juice, smoothie), jam jar filling (jam), knife chop (everything else).
Extend by drawing more 32×20 board scenes and adding entries to `RECIPE_BOARD` in
`js/sprites.js`. Candidates: freezer frost (ice cream, bingsoo), steamer (sticky rice),
drying rack (dried mango).

### 2. Crew size = upgrades — ✅ implemented
Visible chefs = craft slots (capped at 3 on screen). Visible gardeners grow with farm
expansions (2×2 → 1, 3×2 → 2, 3×3+ → 3). Buying "Second Kitchen Slot" makes a second
chef appear — upgrades you can *see*. Cap is `CREW_XS` in `js/sprites.js`; add positions
to show more.

### 3. Merchant customers — not started
Customer sprites (could be recolored Bora variants or new villagers) walk up to the stall
during market events, buy, and walk off with a coin sparkle. Makes 2× events feel like a
rush hour. Needs: walk cycle frames, simple x-movement in the Actor class (add `vx`),
spawn/despawn on `state.marketEventActive`.

### 4. Reaction frames — not started
Extra face frames for Bora: happy (harvest, milestone), panic (plot withering, market event
ending soon), heart-eyes (golden mango). Cheap art (head rows only change), big charm.
Wire by playing a one-shot sequence on the matching event, same pattern as `gardenerAct`.

### 5. Walk cycles / free movement — not started (biggest lift)
Gardeners walk to the plot you clicked; chefs walk between stations; merchant paces the
stall. Needs 2-4 walk frames per costume plus pathing (linear x-walk is enough at this
scale). Turns the strips into a living diorama. Do after 3, reusing its movement code.

### Parking lot
- Sprout cycle tied to real plot states (each strip plant mirrors an actual plot)
- Seasonal reskins (palette swaps: winter snow counter, spring blossoms)
- Bora outfit unlocks as coin-sink cosmetics (palette swaps of existing frames)
- Golden mango special cutscene (one-off longer sequence, Cooking-Mama style)

## Art pipeline reminder

Prototypes were drawn/iterated in a session scratchpad with a Python renderer
(grids → PNG contact sheet). To add sprites: draw char grids by hand or regenerate —
the format is self-describing in `js/sprites-data.js`. Keep frames within one sprite the
same width/height. Prototype gallery (all styles + role cast):
https://claude.ai/code/artifact/a1bad478-0168-49f2-96d2-bbfb5bbefacd
