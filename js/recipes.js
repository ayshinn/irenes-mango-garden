import { state } from './main.js';
import { PRODUCTS, INGREDIENTS } from './data.js';

export function initKitchen() {
  if (!Array.isArray(state.craftQueue)) state.craftQueue = [];
}

export function tickKitchen(dt) {
  const slots     = state.craftSlots   ?? 1;
  const speedMult = state.craftSpeedMult ?? 1.0;
  let i = 0;

  while (i < Math.min(state.craftQueue.length, slots)) {
    const job     = state.craftQueue[i];
    const product = PRODUCTS.find(p => p.id === job.recipeId);
    if (!product) { state.craftQueue.splice(i, 1); continue; }

    const duration = product.craftTime * speedMult;

    if (duration === 0) {
      _complete(job, product);
      state.craftQueue.splice(i, 1);
    } else {
      job.elapsed = (job.elapsed ?? 0) + dt;
      if (job.elapsed >= duration) {
        _complete(job, product);
        state.craftQueue.splice(i, 1);
        if (state.autoCraft && state.lastCraftRecipe) _tryQueue(state.lastCraftRecipe);
      } else {
        i++;
      }
    }
  }
}

function _complete(job, product) {
  state.inventory[product.id]             = (state.inventory[product.id] ?? 0) + 1;
  state.stats.productsCrafted[product.id] = (state.stats.productsCrafted[product.id] ?? 0) + 1;
}

export function queueRecipe(recipeId) {
  return _tryQueue(recipeId);
}

function _tryQueue(recipeId) {
  const product = PRODUCTS.find(p => p.id === recipeId);
  if (!product) return { ok: false, msg: 'Unknown recipe' };
  if (!state.unlockedRecipes.includes(recipeId)) return { ok: false, msg: 'Recipe locked' };

  const slots = state.craftSlots ?? 1;
  if (state.craftQueue.length >= slots) return { ok: false, msg: 'Kitchen full!' };

  if ((state.inventory.mango ?? 0) < product.mangos) {
    return { ok: false, msg: `Need ${product.mangos} 🥭` };
  }

  // Auto-buy missing paid ingredients if upgrade purchased
  if (state.autoBuy) {
    for (const [ingId, qty] of Object.entries(product.ingredients)) {
      if (INGREDIENTS[ingId].price === 0) continue;
      const need = qty - (state.ingredients[ingId] ?? 0);
      if (need > 0) {
        const cost = INGREDIENTS[ingId].price * need;
        if (state.coins >= cost) {
          state.coins -= cost;
          state.ingredients[ingId] = (state.ingredients[ingId] ?? 0) + need;
        }
      }
    }
  }

  for (const [ingId, qty] of Object.entries(product.ingredients)) {
    if (INGREDIENTS[ingId].price === 0) continue; // free (water)
    if ((state.ingredients[ingId] ?? 0) < qty) {
      return { ok: false, msg: `Need ${qty} ${INGREDIENTS[ingId].name}` };
    }
  }

  state.inventory.mango -= product.mangos;
  for (const [ingId, qty] of Object.entries(product.ingredients)) {
    if (INGREDIENTS[ingId].price === 0) continue;
    state.ingredients[ingId] = (state.ingredients[ingId] ?? 0) - qty;
  }

  state.craftQueue.push({ recipeId, elapsed: 0 });
  state.lastCraftRecipe = recipeId;
  return { ok: true };
}

export function cancelCraft(index) {
  const job = state.craftQueue[index];
  if (!job) return { ok: false };

  const product = PRODUCTS.find(p => p.id === job.recipeId);
  if (product) {
    state.inventory.mango = (state.inventory.mango ?? 0) + product.mangos;
    for (const [ingId, qty] of Object.entries(product.ingredients)) {
      if (INGREDIENTS[ingId].price === 0) continue;
      state.ingredients[ingId] = (state.ingredients[ingId] ?? 0) + qty;
    }
  }

  const recipeId = job.recipeId;
  state.craftQueue.splice(index, 1);

  // Clear auto-craft target if no more of this recipe remain, breaking potential loop
  if (state.lastCraftRecipe === recipeId && !state.craftQueue.some(j => j.recipeId === recipeId)) {
    state.lastCraftRecipe = null;
  }

  return { ok: true };
}

export function buyIngredient(ingId, qty = 1) {
  const ing = INGREDIENTS[ingId];
  if (!ing || ing.price === 0) return { ok: false, msg: 'Cannot buy' };

  const cost = ing.price * qty;
  if (state.coins < cost) return { ok: false, msg: `Need ${cost}g` };

  state.coins -= cost;
  state.ingredients[ingId] = (state.ingredients[ingId] ?? 0) + qty;
  return { ok: true };
}
