// Tracker store: earned trophies and PSN target counters, saved in localStorage.
// Export downloads the progress as a file; import reads one back. A ?demo=1 visit
// seeds a sample mid-game state (13 of 55 earned, counters part way) so the guide
// can be previewed with progress; it only seeds when nothing is saved yet, and the
// banner it shows offers a one-click clear.
const KEY = "leonida-trophy-guide-v1";

// A plausible mid-game demo state: Chapters 1-2 done, a few missions and activities.
const DEMO_EARNED = [2, 3, 8, 9, 16, 20, 21, 22, 44, 45, 46, 47, 51];
const DEMO_COUNTS = { 15: 61, 19: 6, 30: 1, 31: 23, 32: 18, 35: 34 };

function blank() {
  return { earned: [], counts: {}, demo: false };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blank();
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.earned)) return blank();
    return {
      earned: parsed.earned.filter((n) => Number.isInteger(n)),
      counts: parsed.counts && typeof parsed.counts === "object" ? parsed.counts : {},
      demo: parsed.demo === true,
    };
  } catch {
    return blank();
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or unavailable: progress stays in memory for the session.
  }
}

export const store = {
  state: read(),

  isDemo() {
    return this.state.demo;
  },

  seedDemoIfFresh() {
    if (this.state.earned.length === 0 && Object.keys(this.state.counts).length === 0) {
      this.state = { earned: [...DEMO_EARNED], counts: { ...DEMO_COUNTS }, demo: true };
      write(this.state);
      return true;
    }
    return false;
  },

  earnedSet() {
    return new Set(this.state.earned);
  },

  isEarned(id) {
    return this.state.earned.includes(id);
  },

  toggle(id) {
    const at = this.state.earned.indexOf(id);
    if (at === -1) this.state.earned.push(id);
    else this.state.earned.splice(at, 1);
    this.state.earned.sort((a, b) => a - b);
    write(this.state);
  },

  count(id) {
    return this.state.counts[id] || 0;
  },

  addCount(id, delta) {
    const next = Math.max(0, (this.state.counts[id] || 0) + delta);
    if (next === 0) delete this.state.counts[id];
    else this.state.counts[id] = next;
    write(this.state);
  },

  setCount(id, value) {
    const next = Math.max(0, Math.floor(value) || 0);
    if (next === 0) delete this.state.counts[id];
    else this.state.counts[id] = next;
    write(this.state);
  },

  clear() {
    this.state = blank();
    write(this.state);
  },

  exportFile() {
    const payload = {
      app: "leonida-trophy-guide",
      exported_at: new Date().toISOString(),
      earned: this.state.earned,
      counts: this.state.counts,
    };
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "gta6-trophy-progress.json";
    a.click();
    URL.revokeObjectURL(url);
  },

  importText(text) {
    const parsed = JSON.parse(text);
    if (!parsed || !Array.isArray(parsed.earned)) throw new Error("not a progress file");
    const earned = parsed.earned.filter((n) => Number.isInteger(n) && n >= 1 && n <= 55);
    const counts = {};
    if (parsed.counts && typeof parsed.counts === "object") {
      for (const [k, v] of Object.entries(parsed.counts)) {
        const id = Number(k);
        if (Number.isInteger(id) && id >= 1 && id <= 55 && Number.isInteger(v) && v > 0) counts[id] = v;
      }
    }
    this.state = { earned, counts, demo: false };
    write(this.state);
    return earned.length;
  },
};
