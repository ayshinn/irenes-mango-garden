import { state } from './main.js';
import { UPGRADES } from './data.js';
import { initFarm } from './farm.js';

export function initUpgrades() {
  if (!Array.isArray(state.upgrades)) state.upgrades = [];
}

export function isPurchased(id) {
  return state.upgrades.includes(id);
}

export function isAvailable(id) {
  const u = UPGRADES.find(u => u.id === id);
  if (!u) return false;
  if (isPurchased(id)) return false;
  if (u.requires && !isPurchased(u.requires)) return false;
  return true;
}

export function purchaseUpgrade(id) {
  const u = UPGRADES.find(u => u.id === id);
  if (!u)                               return { ok: false, msg: 'Unknown upgrade' };
  if (isPurchased(id))                  return { ok: false, msg: 'Already purchased' };
  if (u.requires && !isPurchased(u.requires)) return { ok: false, msg: 'Requires previous upgrade' };
  if (state.coins < u.cost)             return { ok: false, msg: `Need ${u.cost}g` };

  state.coins -= u.cost;
  state.upgrades.push(id);
  _apply(u.effect);
  return { ok: true };
}

function _apply(eff) {
  switch (eff.type) {
    case 'farm_size':
      state.farmCols = eff.cols;
      state.farmRows = eff.rows;
      initFarm();
      break;
    case 'unlock_tier':
      if (!state.unlockedTiers.includes(eff.tier)) {
        state.unlockedTiers.push(eff.tier);
        state.unlockedTiers.sort((a, b) => a - b);
      }
      break;
    case 'wither_multiplier':
      state.witherMultiplier = eff.value;
      break;
    case 'auto_harvest':
      state.autoHarvest = true;
      break;
    case 'water_max':
      state.waterMax = eff.value;
      break;
    case 'water_refill':
      state.waterRefillRate = eff.value;
      break;
    case 'auto_water':
      state.autoWater = true;
      break;
    case 'craft_slots':
      state.craftSlots = eff.value;
      break;
    case 'craft_speed':
      state.craftSpeedMult = eff.value;
      break;
    case 'unlock_recipes':
      for (const id of eff.ids) {
        if (!state.unlockedRecipes.includes(id)) state.unlockedRecipes.push(id);
      }
      break;
    case 'auto_craft':
      state.autoCraft = true;
      break;
    case 'price_bonus':
      state.priceBonus = eff.value;
      break;
    case 'event_notify':
      state.marketEventNotify = true;
      break;
    case 'auto_buy':
      state.autoBuy = true;
      break;
    case 'cosmetic':
      if (!state.cosmetics.includes(eff.key)) state.cosmetics.push(eff.key);
      break;
  }
}
