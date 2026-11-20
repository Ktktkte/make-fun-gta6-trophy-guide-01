// Filtering and the spoiler rule.
// Spoiler mode hides the name and description of story trophies that are not yet
// earned: the card shows "Hidden story trophy" instead. Earned story trophies,
// and every non-story trophy, always show in full.
export function isMasked(trophy, earnedSet, spoilerOn) {
  return spoilerOn && trophy.story && !earnedSet.has(trophy.id);
}

export function visibleTrophies(trophies, { query, kind, spoilerOn, earnedSet }) {
  const q = (query || "").trim().toLowerCase();
  return trophies.filter((t) => {
    if (kind === "missable" && !t.missable) return false;
    if (kind && kind !== "all" && kind !== "missable" && t.kind !== kind) return false;
    if (!q) return true;
    const hay = (t.name + " " + t.description + " " + t.guide + " " + (t.steps || []).join(" ")).toLowerCase();
    return hay.includes(q);
  });
}

// Next up: the planner order. Missables first (one chance), then the current
// stage's unearned trophies in story order, then count trophies nearest completion,
// then the rest by stage.
export function planNext(trophies, earnedSet, counts) {
  const left = trophies.filter((t) => !earnedSet.has(t.id));
  const score = (t) => {
    let s = 0;
    if (t.missable) s -= 1000;
    s += (t.stage - 1) * 100;
    if (t.count) {
      const have = counts[t.id] || 0;
      s -= Math.min(90, Math.round((have / t.count) * 90));
    }
    return s + t.id * 0.01;
  };
  return [...left].sort((a, b) => score(a) - score(b));
}
