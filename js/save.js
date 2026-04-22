const SAVE_KEY = 'irenesMangarden_save';

export function save(state) {
  state.lastSaveTime = Date.now();
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}

export function load() {
  const raw = localStorage.getItem(SAVE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function reset() {
  localStorage.removeItem(SAVE_KEY);
}
