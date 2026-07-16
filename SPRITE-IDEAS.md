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

### 3. Merchant customers — ✅ implemented
Customer villager (long bob + clip, dress palette-swapped pink/blue/green per spawn) walks
in when an order spawns and waits with a "!" bubble; a two-customer crowd rushes in during
market events and leaves when they end. Movement = `Actor.walk(x)` linear slide with the
idle bounce.

### 4. Reaction frames — ✅ implemented
Happy (closed eyes + smile) and panic (O mouth + sweat drop) faces for all three costumes,
plus a happy frame for customers. Triggers: withered harvest → gardener panic; perfect
stir → chef happy; order delivered / market event start → merchant happy; customer hops
happily on delivery. API: `react(role, 'happy'|'panic')` in `js/sprites.js`.

### 5. Walk cycles / free movement — not started (biggest lift)
Gardeners walk to the plot you clicked; chefs walk between stations; merchant paces the
stall. Basic x-walk already exists (`Actor.walk`, used by customers) — this option adds
real walk-cycle frames + per-plot targeting. Turns the strips into a living diorama.

### Parking lot
- Sprout cycle tied to real plot states (each strip plant mirrors an actual plot)
- Seasonal reskins (palette swaps: winter snow counter, spring blossoms)
- Bora outfit unlocks as coin-sink cosmetics (palette swaps of existing frames)
- Golden mango special cutscene (one-off longer sequence, Cooking-Mama style)

## Gameplay features (beyond sprites)

- **Customer orders** — ✅ implemented (`js/orders.js`): every ~90s a timed order for an
  unlocked recipe (1-3×, 150s, 1.5× payout). Deliver from the Market order panel; customer
  sprite waits with a bubble. Tune in `ORDERS` (`js/data.js`).
- **Stir minigame** — ✅ implemented (`js/recipes.js`): tap 🥄 Stir! 8× within 3s on a
  cooking job → double batch. One try per job. Tune `STIR_TAPS` / `STIR_WINDOW`.
- **Weather** — ✅ implemented (`js/orders.js` tickWeather): rain rolls every 2 min of sun
  (40%), lasts 40-80s, auto-waters all planted plots; rain pixels over the farm strip +
  ☀️/🌧️ indicator by the water can. Tune in `WEATHER` (`js/data.js`).
- **Sticker book** — ✅ implemented (Stats tab): craft 10 of a product → sticker. Golden
  sticker ideas: 100× versions, order-streak stickers.
- **Sound** — not started. WebAudio chiptune SFX: harvest plink, blender whir, coin ding,
  milestone jingle. Biggest remaining charm gap.
- **Cooking quality stars** — not started. Extend the stir minigame to a quality system
  (1-3 stars affecting sell price) instead of the flat double batch.
- **Pet** — not started. Mango-fed puppy actor in the farm strip, grows over playtime.

## Art pipeline reminder

Prototypes were drawn/iterated in a session scratchpad with a Python renderer
(grids → PNG contact sheet). To add sprites: draw char grids by hand or regenerate —
the format is self-describing in `js/sprites-data.js`. Keep frames within one sprite the
same width/height. Prototype gallery (all styles + role cast):
https://claude.ai/code/artifact/a1bad478-0168-49f2-96d2-bbfb5bbefacd
