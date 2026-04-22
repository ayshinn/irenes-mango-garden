import { state } from './main.js';
import { TREE_TIERS, PRODUCTS, INGREDIENTS } from './data.js';
import { plantPlot, waterPlot, harvestPlot } from './farm.js';
import { queueRecipe, buyIngredient } from './recipes.js';
import { sellProduct, sellAll, sellRawMangos, getEffectivePrice, getRawMangoPrice } from './market.js';

const TIER_EMOJI = ['🌱', '🌿', '🌳', '🌲'];

// ── Init ────────────────────────────────────────────────────
export function initUI() {
  _setupTabs();
  _setupFarmEvents();
  _setupKitchenEvents();
  _setupMarketEvents();
}

function _setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b  => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

function _setupFarmEvents() {
  document.getElementById('farm-grid').addEventListener('click', e => {
    const el = e.target.closest('.plot');
    if (!el) return;
    const i = parseInt(el.dataset.index);
    const s = state.plots[i].state;

    if (s === 'empty') {
      const r = plantPlot(i);
      if (!r.ok && r.msg) showToast(r.msg, 'error');
      else updateCoinDisplay();
    } else if (s === 'planted') {
      const r = waterPlot(i);
      if (!r.ok && r.msg) showToast(r.msg, 'error');
    } else if (s === 'ready' || s === 'withered') {
      const r = harvestPlot(i);
      if (r.ok) showToast(`+${r.yield} 🥭${r.wasWithered ? ' (withered)' : ''}`,
        r.wasWithered ? 'warn' : 'success');
    }
  });

  // Tier selector (delegated)
  document.getElementById('tab-farm').addEventListener('click', e => {
    const btn = e.target.closest('.tier-btn');
    if (!btn) return;
    state.selectedTier = parseInt(btn.dataset.tier);
    _renderTierSelector();
  });
}

function _setupKitchenEvents() {
  document.getElementById('recipe-grid').addEventListener('click', e => {
    const card = e.target.closest('.recipe-card');
    if (!card || card.classList.contains('locked')) return;
    const r = queueRecipe(card.dataset.recipe);
    if (!r.ok) showToast(r.msg, 'error');
  });

  document.getElementById('tab-kitchen').addEventListener('click', e => {
    const btn = e.target.closest('.ing-buy-btn');
    if (!btn) return;
    const r = buyIngredient(btn.dataset.ing, parseInt(btn.dataset.qty));
    if (!r.ok) showToast(r.msg ?? 'Not enough coins', 'error');
    else updateCoinDisplay();
  });
}

// ── Farm ────────────────────────────────────────────────────
export function renderFarm() {
  _renderTierSelector();
  _renderFarmGrid();
  _renderWaterCan();
}

function _renderTierSelector() {
  const section  = document.getElementById('tab-farm');
  let   selector = section.querySelector('.tier-selector');

  if (state.unlockedTiers.length <= 1) {
    selector?.remove();
    return;
  }

  if (!selector) {
    selector = document.createElement('div');
    selector.className = 'tier-selector';
    document.getElementById('farm-grid').before(selector);
  }

  const cur = state.selectedTier ?? 1;
  selector.innerHTML =
    '<span class="tier-label">Plant:</span>' +
    state.unlockedTiers.map(id => {
      const t = TREE_TIERS[id - 1];
      return `<button class="btn btn-small tier-btn${id === cur ? ' active' : ''}" data-tier="${id}">`
           + `${TIER_EMOJI[id - 1]} ${t.name} (${t.seedCost}g)</button>`;
    }).join('');
}

function _renderFarmGrid() {
  const grid = document.getElementById('farm-grid');
  grid.style.gridTemplateColumns = `repeat(${state.farmCols}, 80px)`;

  grid.innerHTML = state.plots.map((plot, i) => {
    const tier = TREE_TIERS[plot.tier - 1];
    let emoji = '🟫', label = `${TIER_EMOJI[(state.selectedTier ?? 1) - 1]} Plant`;
    let pct = 0, cls = '';

    switch (plot.state) {
      case 'planted':
        emoji = TIER_EMOJI[plot.tier - 1]; label = tier.name;
        pct = plot.progress * 100; break;
      case 'watered':
        emoji = TIER_EMOJI[plot.tier - 1]; label = '💧 Growing';
        pct = plot.progress * 100; cls = ' watered'; break;
      case 'ready':
        emoji = '🥭'; label = 'Harvest!'; pct = 100; cls = ' ready'; break;
      case 'withered':
        emoji = '🍂'; label = 'Withered'; pct = 100; cls = ' withered'; break;
    }

    return `<div class="plot${cls}" data-index="${i}">
      <span class="plot-emoji">${emoji}</span>
      <span class="plot-label">${label}</span>
      <div class="plot-progress${plot.watered ? ' watered' : ''}" style="width:${pct.toFixed(1)}%"></div>
    </div>`;
  }).join('');
}

function _renderWaterCan() {
  document.getElementById('water-charges').textContent = state.waterCharges;
  document.getElementById('water-max').textContent     = state.waterMax;
  const refillRate = state.waterRefillRate ?? 20;
  const accum      = state.waterRefillAccum ?? 0;
  const pct = state.waterCharges >= state.waterMax ? 100 : (accum / refillRate) * 100;
  document.getElementById('water-refill-fill').style.width = pct + '%';
}

// ── Kitchen ─────────────────────────────────────────────────
export function renderKitchen() {
  _renderCraftQueue();
  _renderRecipeGrid();
  _renderIngShop();
}

function _renderCraftQueue() {
  const el    = document.getElementById('craft-queue');
  const slots = state.craftSlots ?? 1;
  const speed = state.craftSpeedMult ?? 1.0;

  if (!state.craftQueue.length) {
    el.innerHTML = '<span class="queue-empty">Kitchen is idle…</span>';
    return;
  }

  el.innerHTML = state.craftQueue.slice(0, slots).map(job => {
    const product  = PRODUCTS.find(p => p.id === job.recipeId);
    if (!product) return '';
    const duration = product.craftTime * speed;
    const pct      = duration === 0 ? 100 : Math.min(((job.elapsed ?? 0) / duration) * 100, 100);
    const remaining = Math.ceil(Math.max(0, duration - (job.elapsed ?? 0)));
    return `<div class="craft-slot">
      <span class="craft-name">${product.emoji} ${product.name}</span>
      <div class="craft-bar"><div class="craft-bar-fill" style="width:${pct.toFixed(1)}%"></div></div>
      <span class="craft-time">${remaining}s</span>
    </div>`;
  }).join('') || '<span class="queue-empty">Kitchen is idle…</span>';
}

function _renderRecipeGrid() {
  document.getElementById('recipe-grid').innerHTML = PRODUCTS.map(product => {
    const unlocked   = state.unlockedRecipes.includes(product.id);
    const canCraft   = unlocked && _canCraft(product);
    const sellPrice  = Math.floor(product.baseSell * (state.priceBonus ?? 1.0));
    const ings = [
      `${product.mangos} 🥭`,
      ...Object.entries(product.ingredients).map(([id, qty]) => `${qty} ${INGREDIENTS[id].name}`),
    ].join(', ');

    return `<div class="recipe-card${unlocked ? '' : ' locked'}${canCraft ? ' craftable' : ''}" data-recipe="${product.id}">
      <div class="recipe-name">${product.emoji} ${product.name}</div>
      <div class="recipe-ings">${ings}</div>
      ${product.craftTime ? `<div class="recipe-time">⏱ ${product.craftTime}s</div>` : ''}
      <div class="recipe-sell">🪙 ${sellPrice}g</div>
    </div>`;
  }).join('');
}

function _canCraft(product) {
  if ((state.inventory.mango ?? 0) < product.mangos) return false;
  for (const [id, qty] of Object.entries(product.ingredients)) {
    if (INGREDIENTS[id].price === 0) continue;
    if ((state.ingredients[id] ?? 0) < qty) return false;
  }
  return true;
}

function _renderIngShop() {
  const kitchen = document.getElementById('tab-kitchen');
  let shop = kitchen.querySelector('.ingredient-shop');
  if (!shop) {
    shop = document.createElement('div');
    shop.className = 'ingredient-shop panel-card';
    kitchen.appendChild(shop);
  }

  const ING_IDS = ['sugar', 'tomato', 'onion', 'milk', 'cream', 'rice', 'coconutMilk', 'redBean', 'shavedIce'];
  shop.innerHTML = '<h3 class="shop-title">🛒 Ingredients</h3><div class="ing-grid">'
    + ING_IDS.map(id => {
        const ing = INGREDIENTS[id];
        const qty = state.ingredients[id] ?? 0;
        return `<div class="ing-row">
          <span class="ing-name">${ing.name}</span>
          <span class="ing-qty">×${qty}</span>
          <button class="btn btn-small ing-buy-btn" data-ing="${id}" data-qty="1">+1 (${ing.price}g)</button>
          <button class="btn btn-small ing-buy-btn" data-ing="${id}" data-qty="5">+5 (${ing.price * 5}g)</button>
        </div>`;
      }).join('')
    + '</div>';
}

// ── Market ──────────────────────────────────────────────────
function _setupMarketEvents() {
  document.getElementById('tab-market').addEventListener('click', e => {
    const btn = e.target.closest('[data-sell]');
    if (!btn || btn.disabled) return;
    const productId = btn.dataset.sell;
    const mode      = btn.dataset.mode;   // 'one' | 'all' | 'raw-one' | 'raw-all'

    let result;
    if (mode === 'raw-one') result = sellRawMangos(1);
    else if (mode === 'raw-all') result = sellRawMangos(state.inventory.mango ?? 0);
    else if (mode === 'all')     result = sellAll(productId);
    else                         result = sellProduct(productId, 1);

    if (result.ok && result.coins > 0) {
      updateCoinDisplay();
      showCoinToast(`+${result.coins}g`, btn);
    }
  });
}

export function renderMarket() {
  _renderMarketBanner();
  _renderInventoryGrid();
}

function _renderMarketBanner() {
  const banner = document.getElementById('market-event-banner');
  if (state.marketEventActive && state.marketEventProduct) {
    const p         = PRODUCTS.find(q => q.id === state.marketEventProduct);
    const remaining = Math.ceil(Math.max(0, (state.marketEventEnds - Date.now()) / 1000));
    banner.textContent = `🎉 ${p.emoji} ${p.name} is 2× price! ${remaining}s left`;
    banner.classList.remove('hidden');
  } else {
    banner.classList.add('hidden');
  }
}

function _renderInventoryGrid() {
  const grid = document.getElementById('inventory-grid');
  let html   = '';

  // Raw mangos row
  const rawQty   = state.inventory.mango ?? 0;
  const rawPrice = getRawMangoPrice();
  html += `<div class="inventory-card">
    <div class="item-name">🥭 Raw Mango</div>
    <div class="item-qty">In stock: ${rawQty}</div>
    <div class="item-price">🪙 ${rawPrice}g</div>
    <div class="sell-btns">
      <button class="btn btn-small" data-sell="mango" data-mode="raw-one" ${rawQty === 0 ? 'disabled' : ''}>Sell 1</button>
      <button class="btn btn-small btn-green" data-sell="mango" data-mode="raw-all" ${rawQty === 0 ? 'disabled' : ''}>Sell All</button>
    </div>
  </div>`;

  // Crafted products
  const unlocked = PRODUCTS.filter(p => state.unlockedRecipes.includes(p.id));
  for (const product of unlocked) {
    const qty     = state.inventory[product.id] ?? 0;
    const price   = getEffectivePrice(product.id);
    const demand  = state.demandFactors[product.id] ?? 1.0;
    const isEvent = state.marketEventActive && state.marketEventProduct === product.id;

    let arrow = '';
    if (isEvent || demand > 1.05)  arrow = '<span class="price-arrow-up">↑</span>';
    else if (demand < 0.95)         arrow = '<span class="price-arrow-down">↓</span>';

    html += `<div class="inventory-card${isEvent ? ' event-product' : ''}">
      <div class="item-name">${product.emoji} ${product.name}</div>
      <div class="item-qty">In stock: ${qty}</div>
      <div class="item-price">🪙 ${price}g ${arrow}</div>
      <div class="sell-btns">
        <button class="btn btn-small" data-sell="${product.id}" data-mode="one" ${qty === 0 ? 'disabled' : ''}>Sell 1</button>
        <button class="btn btn-small btn-green" data-sell="${product.id}" data-mode="all" ${qty === 0 ? 'disabled' : ''}>Sell All</button>
      </div>
    </div>`;
  }

  grid.innerHTML = html;
}

// ── Stubs (filled in later steps) ───────────────────────────
export function renderUpgrades() {}
export function renderStats()    {}

// ── Shared utils ────────────────────────────────────────────
export function updateCoinDisplay() {
  document.getElementById('coin-amount').textContent =
    Math.floor(state.coins).toLocaleString();
}

export function showToast(msg, type = 'info') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = `toast${type === 'coin' ? ' coin-toast' : ''}`;
  el.textContent = msg;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

export function showCoinToast(msg, anchorEl) {
  const el = document.createElement('div');
  el.className = 'coin-float';
  el.textContent = msg;

  // Position near the anchor button
  if (anchorEl) {
    const rect = anchorEl.getBoundingClientRect();
    el.style.left = rect.left + rect.width / 2 + 'px';
    el.style.top  = rect.top + window.scrollY + 'px';
  } else {
    el.style.right  = '20px';
    el.style.bottom = '60px';
  }

  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}
