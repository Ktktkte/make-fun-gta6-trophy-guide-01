// Earned-progress tracking for the GTA VI trophy guide: localStorage checklist,
// export to a file, import back, a sample set for trying the tracker, and reset.
// Progress is stored as an array of trophy ids under one localStorage key.

export const STORAGE_KEY = 'gta6-trophy-guide-v3-earned';

// A realistic mid-game sample: the opening story trophies, a few activities and the
// Chapter 1 meditation, so a first-time reader can see the tracker working.
export const SAMPLE_EARNED_IDS = [15, 16, 18, 20, 21, 25, 28, 32, 35, 44, 46, 51, 53, 55];

export function loadEarnedProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((id) => Number.isInteger(id)));
  } catch {
    return new Set();
  }
}

export function saveEarnedProgress(earned) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
  } catch {
    // Storage full or unavailable: the checklist still works for this visit.
  }
}

export function exportProgressFile(earned) {
  const blob = new Blob([JSON.stringify([...earned].sort((a, b) => a - b), null, 2)], {
    type: 'application/json',
  });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'gta6-trophy-progress.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

export function parseProgressFile(text) {
  const ids = JSON.parse(text);
  if (!Array.isArray(ids)) throw new Error('Progress file must hold a list of trophy ids.');
  const valid = ids.filter((id) => Number.isInteger(id) && id >= 1 && id <= 55);
  return new Set(valid);
}

export function loadSampleProgress() {
  return new Set(SAMPLE_EARNED_IDS);
}
