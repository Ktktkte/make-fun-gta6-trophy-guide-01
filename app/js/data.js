// Data layer: loads the official trophy list and the platinum roadmap.
// The app fetches only its own files, never the network.
let cache = null;

export async function loadData() {
  if (cache) return cache;
  const [trophiesRes, roadmapRes] = await Promise.all([
    fetch("data/trophies.json"),
    fetch("data/roadmap.json"),
  ]);
  if (!trophiesRes.ok || !roadmapRes.ok) throw new Error("could not load guide data");
  const trophiesDoc = await trophiesRes.json();
  const roadmap = await roadmapRes.json();
  const trophies = trophiesDoc.trophies;
  cache = { trophies, roadmap, guideNote: trophiesDoc.guide_note || "" };
  return cache;
}

export function byId(trophies, id) {
  return trophies.find((t) => t.id === id);
}

export function gradeName(grade) {
  return { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" }[grade] || grade;
}

export function kindName(kind) {
  return { story: "Story", missable: "Missable", collectibles: "Collectibles", activities: "Activities" }[kind] || kind;
}

export function stageName(stage) {
  return { 1: "Story first", 2: "Leonida cleanup", 3: "Grind and platinum" }[stage] || ("Stage " + stage);
}
