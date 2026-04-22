import { save, load, reset } from './save.js';
import { DEFAULT_STATE, MILESTONES } from './data.js';
import { initFarm, tickFarm } from './farm.js';
import { initKitchen, tickKitchen } from './recipes.js';
import { initMarket, tickMarket } from './market.js';
import { initUpgrades } from './upgrades.js';
import {
  initUI, renderFarm, renderKitchen, renderMarket, renderUpgrades, renderStats,
  updateCoinDisplay, showToast,
} from './ui.js';

export let state = {};

const SAVE_INTERVAL      = 10_000;
const RENDER_INTERVAL    = 200;
const MILESTONE_INTERVAL = 1_000;

let lastTs        = 0;
let lastSave      = 0;
let lastRender    = 0;
let lastMilestone = 0;

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
  renderStats();

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

  state.stats.playtime = (state.stats.playtime ?? 0) + dt;

  tickFarm(dt);
  tickKitchen(dt);
  const mktEvents = tickMarket(dt);
  for (const ev of mktEvents) {
    if (ev.type === 'event_warn')  showToast('📢 Market event in 30s! Stock up!', 'info');
    if (ev.type === 'event_start') showToast(`🎉 Market event! ${ev.productName} is 2× price!`, 'success');
  }

  if (ts - lastMilestone > MILESTONE_INTERVAL) {
    _checkMilestones();
    lastMilestone = ts;
  }

  if (ts - lastRender > RENDER_INTERVAL) {
    const tab = document.querySelector('.tab-btn.active')?.dataset.tab;
    if (tab === 'farm')     renderFarm();
    if (tab === 'kitchen')  renderKitchen();
    if (tab === 'market')   renderMarket();
    if (tab === 'upgrades') renderUpgrades();
    if (tab === 'stats')    renderStats();
    updateCoinDisplay();
    lastRender = ts;
  }

  if (ts - lastSave > SAVE_INTERVAL) {
    save(state);
    lastSave = ts;
  }

  requestAnimationFrame(loop);
}

function _checkMilestones() {
  for (const m of MILESTONES) {
    if (!state.stats.milestones.includes(m.id) && m.check(state)) {
      state.stats.milestones.push(m.id);
      showToast(m.label, 'success');
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
document.getElementById('new-game-btn')?.addEventListener('click', () => {
  if (confirm('Start a new game? All progress will be lost.')) {
    reset();
    location.reload();
  }
});
