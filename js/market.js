import { state } from './main.js';
import { PRODUCTS, MARKET } from './data.js';

export function initMarket() {
  if (!state.demandUpdateTimer) state.demandUpdateTimer = 0;
  if (!state.marketEventTimer)  state.marketEventTimer  = 0;

  for (const p of PRODUCTS) {
    if (state.demandFactors[p.id] == null) state.demandFactors[p.id] = 1.0;
  }
}

export function tickMarket(dt) {
  // Demand fluctuation
  state.demandUpdateTimer = (state.demandUpdateTimer ?? 0) + dt;
  if (state.demandUpdateTimer >= MARKET.demandUpdateInterval) {
    state.demandUpdateTimer -= MARKET.demandUpdateInterval;
    _rotateDemand();
  }

  // Market events
  if (state.marketEventActive) {
    if (Date.now() > state.marketEventEnds) {
      state.marketEventActive  = false;
      state.marketEventProduct = null;
    }
  } else {
    state.marketEventTimer = (state.marketEventTimer ?? 0) + dt;
    if (state.marketEventTimer >= MARKET.eventInterval) {
      state.marketEventTimer -= MARKET.eventInterval;
      _triggerEvent();
    }
  }
}

function _rotateDemand() {
  const r = MARKET.demandFluctuationRange;
  for (const p of PRODUCTS) {
    state.demandFactors[p.id] = 1.0 + (Math.random() * 2 - 1) * r;
  }
}

function _triggerEvent() {
  // Prefer products the player actually has stocked
  const stocked = PRODUCTS.filter(p => (state.inventory[p.id] ?? 0) > 0);
  const pool    = stocked.length ? stocked : PRODUCTS;
  const product = pool[Math.floor(Math.random() * pool.length)];

  state.marketEventActive  = true;
  state.marketEventProduct = product.id;
  state.marketEventEnds    = Date.now() + MARKET.eventDuration * 1000;
}

export function getEffectivePrice(productId) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return 0;

  let price = product.baseSell * (state.priceBonus ?? 1.0);
  price *= (state.demandFactors[productId] ?? 1.0);
  if (state.marketEventActive && state.marketEventProduct === productId) {
    price *= MARKET.eventMultiplier;
  }
  return Math.floor(price);
}

// Raw mango sell price: slightly below Fresh Mango (encourages crafting)
export const RAW_MANGO_BASE = 4;
export function getRawMangoPrice() {
  return Math.floor(RAW_MANGO_BASE * (state.priceBonus ?? 1.0));
}

export function sellProduct(productId, qty = 1) {
  const have = state.inventory[productId] ?? 0;
  if (have <= 0) return { ok: false, coins: 0, qty: 0 };

  const actual = Math.min(qty, have);
  const price  = getEffectivePrice(productId);
  const earned = price * actual;

  state.inventory[productId]   = have - actual;
  state.coins                 += earned;
  state.stats.coinsEarned     += earned;

  return { ok: true, coins: earned, qty: actual };
}

export function sellAll(productId) {
  return sellProduct(productId, state.inventory[productId] ?? 0);
}

export function sellRawMangos(qty = 1) {
  const have = state.inventory.mango ?? 0;
  if (have <= 0) return { ok: false, coins: 0, qty: 0 };

  const actual = Math.min(qty, have);
  const price  = getRawMangoPrice();
  const earned = price * actual;

  state.inventory.mango    = have - actual;
  state.coins             += earned;
  state.stats.coinsEarned += earned;

  return { ok: true, coins: earned, qty: actual };
}
