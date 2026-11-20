// store.js — pure trophy-progress state for the GTA 6 guide.
// No DOM here: the browser passes its localStorage in, and Node tests pass a stub.
// Every function is small and testable on its own.

export const KEY = 'gta6-trophy-guide-v1';

export function blankState() {
  return { earned: {}, counts: {}, spoiler: true };
}

function cleanMap(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (/^\d+$/.test(k) && v === true) out[k] = true;
  }
  return out;
}

function cleanEarned(value, trophies) {
  const known = new Set(trophies.map((t) => String(t.id)));
  const out = {};
  for (const [k, v] of Object.entries(cleanMap(value))) {
    if (known.has(k)) out[k] = true;
  }
  return out;
}

function cleanCounts(value, trophies) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const targets = new Map(trophies.filter((t) => t.count).map((t) => [String(t.id), t.count]));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (!targets.has(k)) continue;
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) continue;
    out[k] = Math.max(0, Math.min(targets.get(k), n));
  }
  return out;
}

export function loadState(storage, trophies) {
  try {
    const raw = storage.getItem(KEY);
    if (!raw) return blankState();
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) return blankState();
    const state = {
      earned: cleanEarned(data.earned, trophies),
      counts: cleanCounts(data.counts, trophies),
      spoiler: data.spoiler !== false,
    };
    // Counts at target mark the trophy earned.
    for (const t of trophies) {
      if (t.count && state.counts[t.id] >= t.count) state.earned[t.id] = true;
    }
    return state;
  } catch {
    return blankState();
  }
}

export function saveState(storage, state) {
  storage.setItem(KEY, JSON.stringify(state));
}

export function toggleEarned(state, id) {
  if (state.earned[id]) delete state.earned[id];
  else state.earned[id] = true;
  return state;
}

export function setCount(state, trophies, id, value) {
  const trophy = trophies.find((t) => t.id === id);
  if (!trophy || !trophy.count) return state;
  const n = Math.max(0, Math.min(trophy.count, Math.floor(Number(value) || 0)));
  state.counts[id] = n;
  if (n >= trophy.count) state.earned[id] = true;
  return state;
}

export function progress(state, trophies) {
  const earned = trophies.filter((t) => state.earned[t.id]).length;
  const total = trophies.length;
  const byGrade = {};
  for (const t of trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { earned: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (state.earned[t.id]) byGrade[t.grade].earned += 1;
  }
  const byStage = {};
  for (const t of trophies) {
    byStage[t.stage] = byStage[t.stage] || { earned: 0, total: 0 };
    byStage[t.stage].total += 1;
    if (state.earned[t.id]) byStage[t.stage].earned += 1;
  }
  return {
    earned,
    total,
    percent: total ? Math.round((earned / total) * 100) : 0,
    byGrade,
    byStage,
  };
}

export function exportState(state) {
  return JSON.stringify({ app: 'gta6-trophy-guide-01', version: 1, state }, null, 1);
}

export function importState(text, trophies) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('Not a JSON file.');
  }
  if (!data || typeof data !== 'object' || !data.state || typeof data.state !== 'object') {
    throw new Error('Not a trophy-guide export file.');
  }
  const state = {
    earned: cleanEarned(data.state.earned, trophies),
    counts: cleanCounts(data.state.counts, trophies),
    spoiler: data.state.spoiler !== false,
  };
  for (const t of trophies) {
    if (t.count && state.counts[t.id] >= t.count) state.earned[t.id] = true;
  }
  return state;
}

// A visible sample progress set, used only when the page is opened with ?demo=1
// and nothing is saved yet. The page labels it as demo progress.
export function demoState() {
  return {
    earned: { 2: true, 3: true, 4: true, 5: true, 8: true, 9: true, 10: true, 16: true, 20: true, 21: true, 44: true, 46: true, 47: true },
    counts: { 15: 120, 28: 5, 31: 40, 35: 60 },
    spoiler: true,
  };
}
