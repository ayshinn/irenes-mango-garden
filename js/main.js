import { save, load, reset } from './save.js';
import { DEFAULT_STATE } from './data.js';
import { initFarm, tickFarm } from './farm.js';
import { initKitchen, tickKitchen } from './recipes.js';
import { initMarket, tickMarket } from './market.js';
import { initUpgrades } from './upgrades.js';
import { initUI, renderFarm, renderKitchen, renderMarket, renderUpgrades, updateCoinDisplay, showToast } from './ui.js';

export let state = {};

const SAVE_INTERVAL   = 10_000;
const RENDER_INTERVAL = 200;

let lastTs     = 0;
let lastSave   = 0;
let lastRender = 0;

function init() {
  const saved = load();
  Object.assign(state, JSON.parse(JSON.stringify(DEFAULT_STATE)), saved ?? {});

  initFarm();
  initKitchen();
  initMarket();
  initUpgrades();

  _applyOfflineProgress();
  initUI();

  updateCoinDisplay();
  renderFarm();
  renderKitchen();
  renderMarket();
  renderUpgrades();

  lastTs = performance.now();
  requestAnimationFrame(loop);
}

function _applyOfflineProgress() {
  if (!state.lastSaveTime) return;
  const elapsed = Math.min((Date.now() - state.lastSaveTime) / 1000, 3600);
  if (elapsed < 5) return;
  tickFarm(elapsed);
  const mins = Math.floor(elapsed / 60);
  if (mins > 0) showToast(`Welcome back! ${mins}m of farm growth applied.`, 'info');
}

function loop(ts) {
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;

  tickFarm(dt);
  tickKitchen(dt);
  tickMarket(dt);

  if (ts - lastRender > RENDER_INTERVAL) {
    const activeTab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (activeTab === 'farm')     renderFarm();
    if (activeTab === 'kitchen')  renderKitchen();
    if (activeTab === 'market')   renderMarket();
    if (activeTab === 'upgrades') renderUpgrades();
    updateCoinDisplay();
    lastRender = ts;
  }

  if (ts - lastSave > SAVE_INTERVAL) {
    save(state);
    lastSave = ts;
  }

  requestAnimationFrame(loop);
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('new-game-btn')?.addEventListener('click', () => {
  if (confirm('Start a new game? All progress will be lost.')) {
    reset();
    location.reload();
  }
});
