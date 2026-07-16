import { state } from './main.js';
import { PRODUCTS, ORDERS, WEATHER } from './data.js';
import { getEffectivePrice } from './market.js';

export function initOrders() {
  // older saves lack these keys
  state.stats.ordersCompleted ??= 0;
  state.stats.stickers ??= [];
  state.orderTimer ??= 0;
  state.weather ??= 'sunny';
  state.weatherEnds ??= 0;
  state.weatherTimer ??= 0;
}

// ── Customer orders ─────────────────────────────────────────
export function tickOrders(dt) {
  const events = [];

  if (state.order) {
    if (Date.now() > state.order.expiresAt) {
      state.order = null;
      events.push({ type: 'order_expired' });
    }
  } else {
    state.orderTimer += dt;
    if (state.orderTimer >= ORDERS.interval) {
      state.orderTimer = 0;
      const order = _spawnOrder();
      if (order) events.push({ type: 'order_new', order });
    }
  }

  return events;
}

function _spawnOrder() {
  // only ask for things the player can actually make
  const pool = PRODUCTS.filter(p => state.unlockedRecipes.includes(p.id) && p.craftTime > 0);
  if (!pool.length) return null;

  const product = pool[Math.floor(Math.random() * pool.length)];
  const qty = ORDERS.minQty + Math.floor(Math.random() * (ORDERS.maxQty - ORDERS.minQty + 1));
  state.order = {
    productId: product.id,
    qty,
    expiresAt: Date.now() + ORDERS.duration * 1000,
    reward: Math.floor(getEffectivePrice(product.id) * qty * ORDERS.bonusMult),
  };
  return state.order;
}

export function fulfillOrder() {
  const order = state.order;
  if (!order) return { ok: false };
  if ((state.inventory[order.productId] ?? 0) < order.qty) {
    return { ok: false, msg: 'Not enough stock!' };
  }

  state.inventory[order.productId] -= order.qty;
  state.coins += order.reward;
  state.stats.coinsEarned += order.reward;
  state.stats.ordersCompleted++;
  state.order = null;
  return { ok: true, coins: order.reward };
}

// ── Weather ─────────────────────────────────────────────────
export function tickWeather(dt) {
  const events = [];

  if (state.weather === 'rainy') {
    // rain keeps every planted plot watered, for free
    for (const plot of state.plots) {
      if (plot.state === 'planted') {
        plot.state = 'watered';
        plot.watered = true;
      }
    }
    if (Date.now() > state.weatherEnds) {
      state.weather = 'sunny';
      state.weatherTimer = 0;
      events.push({ type: 'weather', weather: 'sunny' });
    }
  } else {
    state.weatherTimer += dt;
    if (state.weatherTimer >= WEATHER.rainChanceInterval) {
      state.weatherTimer = 0;
      if (Math.random() < WEATHER.rainChance) {
        state.weather = 'rainy';
        state.weatherEnds = Date.now() +
          (WEATHER.rainMin + Math.random() * (WEATHER.rainMax - WEATHER.rainMin)) * 1000;
        events.push({ type: 'weather', weather: 'rainy' });
      }
    }
  }

  return events;
}
