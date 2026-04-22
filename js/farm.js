import { state } from './main.js';
import { TREE_TIERS } from './data.js';

export function initFarm() {
  const total = state.farmRows * state.farmCols;
  while (state.plots.length < total) {
    state.plots.push({ state: 'empty', tier: 1, progress: 0, watered: false, readyAt: null });
  }
  state.plots.length = total;
}

export function tickFarm(dt) {
  const witherMult = state.witherMultiplier ?? 2;
  const refillRate  = state.waterRefillRate ?? 20;

  if (state.waterCharges < state.waterMax) {
    state.waterRefillAccum += dt;
    while (state.waterRefillAccum >= refillRate && state.waterCharges < state.waterMax) {
      state.waterRefillAccum -= refillRate;
      state.waterCharges++;
    }
  } else {
    state.waterRefillAccum = 0;
  }

  for (let i = 0; i < state.plots.length; i++) {
    const plot = state.plots[i];
    const tier = TREE_TIERS[plot.tier - 1];

    if (plot.state === 'planted' || plot.state === 'watered') {
      const speed = plot.watered ? 2 : 1;
      plot.progress = Math.min(plot.progress + (dt * speed) / tier.growTime, 1);
      if (plot.progress >= 1) {
        plot.state   = 'ready';
        plot.readyAt = Date.now();
      }
    } else if (plot.state === 'ready') {
      const elapsed = (Date.now() - (plot.readyAt ?? Date.now())) / 1000;
      if (elapsed > witherMult * tier.growTime) plot.state = 'withered';
    }

    if (state.autoHarvest && (plot.state === 'ready' || plot.state === 'withered')) {
      harvestPlot(i);
    }
    if (state.autoWater && plot.state === 'planted' && state.waterCharges > 0) {
      waterPlot(i);
    }
  }
}

export function plantPlot(index) {
  const plot   = state.plots[index];
  if (plot.state !== 'empty') return { ok: false, msg: null };

  const tierId = state.selectedTier ?? 1;
  const tier   = TREE_TIERS[tierId - 1];

  if (!state.unlockedTiers.includes(tierId)) return { ok: false, msg: 'Tier locked' };
  if (state.coins < tier.seedCost) return { ok: false, msg: `Need ${tier.seedCost}g for seeds` };

  state.coins  -= tier.seedCost;
  plot.state    = 'planted';
  plot.tier     = tierId;
  plot.progress = 0;
  plot.watered  = false;
  plot.readyAt  = null;
  return { ok: true };
}

export function waterPlot(index) {
  const plot = state.plots[index];
  if (plot.watered || plot.state !== 'planted') return { ok: false, msg: null };
  if (state.waterCharges <= 0) return { ok: false, msg: 'No water charges!' };

  state.waterCharges--;
  plot.state  = 'watered';
  plot.watered = true;
  return { ok: true };
}

export function harvestPlot(index) {
  const plot = state.plots[index];
  if (plot.state !== 'ready' && plot.state !== 'withered') return { ok: false, yield: 0 };

  const tier       = TREE_TIERS[plot.tier - 1];
  const wasWithered = plot.state === 'withered';
  let amount = tier.yieldMin + Math.floor(Math.random() * (tier.yieldMax - tier.yieldMin + 1));
  if (wasWithered) amount = Math.max(1, Math.floor(amount / 2));

  state.inventory.mango         = (state.inventory.mango ?? 0) + amount;
  state.stats.mangosHarvested  += amount;
  if (state.stats.mangosHarvested >= 500 && !state.goldenMangoUnlocked) {
    state.goldenMangoUnlocked = true;
  }

  plot.state    = 'empty';
  plot.progress = 0;
  plot.watered  = false;
  plot.readyAt  = null;
  return { ok: true, yield: amount, wasWithered };
}
