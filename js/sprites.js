import { state } from './main.js';
import { SPRITES } from './sprites-data.js';

// ── Low-level draw ──────────────────────────────────────────
function drawSprite(ctx, sprite, frameIdx, dx, dy) {
  const frame = sprite.frames[frameIdx];
  if (!frame) return;
  const pal = sprite.pal;
  for (let y = 0; y < frame.length; y++) {
    const row = frame[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === '.') continue;
      ctx.fillStyle = pal[ch];
      ctx.fillRect(dx + x, dy + y, 1, 1);
    }
  }
}

// ── Actor: one sprite at a position, idle bounce + one-shot actions ──
class Actor {
  constructor(sprite, x, y, { idleMs = 500, loopFrames = null, loopMs = 500 } = {}) {
    this.sprite = sprite;
    this.x = x;
    this.y = y;
    this.idleMs = idleMs;
    this.loopFrames = loopFrames;   // ambient loop instead of idle (scenes)
    this.loopMs = loopMs;
    this.seq = null;                // active one-shot action
    this.acc = 0;
    this.tick = 0;
  }

  play(frames, ms, loops = 2) {
    this.seq = { frames, ms, left: frames.length * loops };
    this.acc = 0;
    this.tick = 0;
  }

  step(dtMs) {
    const ms = this.seq ? this.seq.ms : (this.loopFrames ? this.loopMs : this.idleMs);
    this.acc += dtMs;
    while (this.acc >= ms) {
      this.acc -= ms;
      this.tick++;
      if (this.seq && --this.seq.left <= 0) this.seq = null;
    }
  }

  draw(ctx) {
    if (this.seq) {
      drawSprite(ctx, this.sprite, this.seq.frames[this.tick % this.seq.frames.length], this.x, this.y);
    } else if (this.loopFrames) {
      drawSprite(ctx, this.sprite, this.loopFrames[this.tick % this.loopFrames.length], this.x, this.y);
    } else {
      // idle: frame 0 with a 1px bounce
      drawSprite(ctx, this.sprite, 0, this.x, this.y + (this.tick % 2));
    }
  }
}

// ── Scene: one composited canvas strip per tab ──────────────
const SCENE_W = 176;
const SCENE_H = 30;

class Scene {
  constructor(mountEl, ground) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = SCENE_W;
    this.canvas.height = SCENE_H;
    this.canvas.className = 'scene-canvas';
    mountEl.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.actors = [];
    this.ground = ground;           // [topColor, bottomColor]
    this.onFrame = null;            // per-frame hook (derive state)
  }

  add(actor) {
    this.actors.push(actor);
    return actor;
  }

  step(dtMs) {
    if (this.onFrame) this.onFrame();
    for (const a of this.actors) a.step(dtMs);
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, SCENE_W, SCENE_H);
    ctx.fillStyle = this.ground[0];
    ctx.fillRect(0, SCENE_H - 2, SCENE_W, 1);
    ctx.fillStyle = this.ground[1];
    ctx.fillRect(0, SCENE_H - 1, SCENE_W, 1);
    for (const a of this.actors) a.draw(ctx);
  }
}

// ── Public API ──────────────────────────────────────────────
const scenes = {};
let gardeners = [];
let chefs = [];
let merchant = null;
let chopBoard = null;

const GARDENER = { water: [1, 2], plant: [3, 4], harvest: [5, 6] };
const CHEF_STIR = [1, 2];
const MERCHANT_SELL = [1, 2];

// Which board scene plays for the recipe currently cooking (default: chop)
const RECIPE_BOARD = {
  mango_juice:    'blender',
  mango_smoothie: 'blender',
  mango_jam:      'jar',
};

const CREW_XS = [10, 42, 74];   // up to 3 visible crew members per scene

// Grow/shrink a crew list to `count`, adding actors at fixed positions
function _syncCrew(scene, crew, sprite, count) {
  const target = Math.max(1, Math.min(count, CREW_XS.length));
  while (crew.length < target) {
    crew.push(scene.add(new Actor(sprite, CREW_XS[crew.length], 4)));
  }
  while (crew.length > target) {
    const a = crew.pop();
    scene.actors.splice(scene.actors.indexOf(a), 1);
  }
}

export function initSprites() {
  const mounts = {
    farm:    _mount('tab-farm',    document.getElementById('farm-grid')),
    kitchen: _mount('tab-kitchen', document.getElementById('craft-queue')),
    market:  _mount('tab-market',  document.getElementById('inventory-grid')),
  };

  // Farm: gardener crew (grows with farm expansions) + sprouting plants
  scenes.farm = new Scene(mounts.farm, ['#66BB6A', '#388E3C']);
  [112, 136, 156].forEach((x, i) => {
    const p = scenes.farm.add(new Actor(SPRITES.sprout, x, 10,
      { loopFrames: [0, 1, 2, 3], loopMs: 1300 }));
    p.tick = i;                    // stagger growth phases
  });
  scenes.farm.onFrame = () => {
    // 2×2 farm → 1 gardener, 3×2 → 2, 3×3 and up → 3
    const plots = (state.farmRows ?? 2) * (state.farmCols ?? 2);
    _syncCrew(scenes.farm, gardeners, SPRITES.gardener, plots >= 9 ? 3 : plots >= 6 ? 2 : 1);
  };

  // Kitchen: chef crew (one per craft slot, up to 3) + recipe board
  scenes.kitchen = new Scene(mounts.kitchen, ['#BCAAA4', '#8B5E3C']);
  chopBoard = scenes.kitchen.add(new Actor(SPRITES.chop, 118, 8,
    { loopFrames: [0, 1, 2, 3], loopMs: 380 }));
  scenes.kitchen.onFrame = () => {
    _syncCrew(scenes.kitchen, chefs, SPRITES.chef, state.craftSlots ?? 1);
    const busy = state.craftQueue?.length ?? 0;
    chefs.forEach((chef, i) => {
      const cooking = i < busy;
      if (cooking && !chef.seq) chef.play(CHEF_STIR, 320, 999);
      if (!cooking) chef.seq = null;
    });
    // board plays the animation for whatever is cooking first
    const job = state.craftQueue?.[0];
    chopBoard.sprite = SPRITES[job ? (RECIPE_BOARD[job.recipeId] ?? 'chop') : 'chop'];
    chopBoard.loopFrames = busy > 0 ? [0, 1, 2, 3] : [0];
  };

  // Market: stall backdrop + merchant beside it
  scenes.market = new Scene(mounts.market, ['#D7B98E', '#8B5E3C']);
  scenes.market.add(new Actor(SPRITES.stall, 96, 6, { loopFrames: [0, 1], loopMs: 900 }));
  merchant = scenes.market.add(new Actor(SPRITES.merchant, 56, 4));

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced) requestAnimationFrame(_loop);
  else Object.values(scenes).forEach(s => { s.step(0); s.draw(); });
}

function _mount(panelId, beforeEl) {
  const wrap = document.createElement('div');
  wrap.className = `scene-strip scene-${panelId.replace('tab-', '')}`;
  document.getElementById(panelId).insertBefore(wrap, beforeEl);
  return wrap;
}

let lastTs = 0;
function _loop(ts) {
  const dtMs = Math.min(ts - lastTs, 100);
  lastTs = ts;
  const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
  for (const [name, scene] of Object.entries(scenes)) {
    scene.step(dtMs);
    if (name === activeTab) scene.draw();
  }
  requestAnimationFrame(_loop);
}

// ── Triggers (called from ui.js) ────────────────────────────
export function gardenerAct(action) {
  const frames = GARDENER[action];
  if (!frames || !gardeners.length) return;
  const free = gardeners.filter(g => !g.seq);
  const g = (free.length ? free : gardeners)[Math.floor(Math.random() * (free.length ? free.length : gardeners.length))];
  g.play(frames, 340, 3);
}

export function merchantSell() {
  merchant?.play(MERCHANT_SELL, 300, 3);
}
