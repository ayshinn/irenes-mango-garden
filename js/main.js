import { save, load, reset } from './save.js';
import { DEFAULT_STATE } from './data.js';

export let state = {};

const SAVE_INTERVAL = 10_000;
let lastSave = 0;

function init() {
  const saved = load();
  Object.assign(state, JSON.parse(JSON.stringify(DEFAULT_STATE)), saved ?? {});

  setupTabs();
  setupNewGame();
  updateCoinDisplay();

  requestAnimationFrame(loop);
}

function loop(ts) {
  if (ts - lastSave > SAVE_INTERVAL) {
    save(state);
    lastSave = ts;
  }
  requestAnimationFrame(loop);
}

function setupTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tab = btn.dataset.tab;
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${tab}`).classList.add('active');
    });
  });
}

function setupNewGame() {
  document.getElementById('new-game-btn').addEventListener('click', () => {
    if (confirm('Start a new game? All progress will be lost.')) {
      reset();
      location.reload();
    }
  });
}

export function updateCoinDisplay() {
  document.getElementById('coin-amount').textContent = Math.floor(state.coins).toLocaleString();
}

document.addEventListener('DOMContentLoaded', init);
