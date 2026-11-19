// Leonida Trophy Guide — tracker for the 55 GTA VI trophies on PS5.
// Progress and settings live in localStorage; the list itself is data/trophies.json.
// The app makes no network request other than loading that one local file.
const STORE_KEY = 'gta6-trophy-guide-v1';

const state = {
  earned: new Set(),
  spoiler: false,
  kind: 'all',
  grade: 'all',
  earnedOnly: false,
  query: '',
};

let doc = null;
let sourceByKey = {};

function loadState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) ?? '{}');
    if (Array.isArray(raw.earned)) state.earned = new Set(raw.earned.filter((n) => typeof n === 'string'));
    state.spoiler = raw.spoiler === true;
    if (typeof raw.kind === 'string') state.kind = raw.kind;
    if (typeof raw.grade === 'string') state.grade = raw.grade;
    state.earnedOnly = raw.earnedOnly === true;
  } catch {
    state.earned = new Set();
  }
}

function saveState() {
  localStorage.setItem(STORE_KEY, JSON.stringify({
    earned: [...state.earned],
    spoiler: state.spoiler,
    kind: state.kind,
    grade: state.grade,
    earnedOnly: state.earnedOnly,
  }));
}

function el(tag, cls, text) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

function sourceLinks(keys) {
  const wrap = el('p', 'card-sources', 'Sources: ');
  keys.forEach((key, i) => {
    const src = sourceByKey[key];
    if (!src) return;
    if (i > 0) wrap.append(document.createTextNode(' · '));
    if (src.url) {
      const a = document.createElement('a');
      a.href = src.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = src.name;
      wrap.append(a);
    } else {
      wrap.append(document.createTextNode(src.name));
    }
  });
  return wrap;
}

function trophyVisible(t) {
  if (state.kind === 'missable' && !t.missable) return false;
  if (state.kind === 'online') return false; // the official list has no online trophies
  if (state.kind !== 'all' && state.kind !== 'missable' && t.kind !== state.kind) return false;
  if (state.grade !== 'all' && t.grade !== state.grade) return false;
  if (state.earnedOnly && !state.earned.has(t.name)) return false;
  if (state.query) {
    const hay = `${t.name} ${t.description} ${t.guide}`.toLowerCase();
    if (!hay.includes(state.query)) return false;
  }
  return true;
}

function spoilerHidden(t) {
  return state.spoiler && t.kind === 'story' && !state.earned.has(t.name);
}

function renderFacts() {
  const f = doc.facts;
  const items = [
    `${f.total} trophies`,
    `1 platinum · 2 gold · 6 silver · 46 bronze`,
    `${f.hidden} hidden`,
    `${f.online} online`,
    f.time,
    `difficulty ${f.difficulty}`,
    `${f.playthroughs} playthrough`,
    'no mission replay',
    f.missable,
  ];
  const ul = document.getElementById('facts');
  ul.replaceChildren();
  for (const item of items) ul.append(el('li', '', item));
  document.getElementById('missableText').textContent =
    'Positive Mental Attitude — meditate at every spot across Leonida. The first spot is Lucia’s balcony meditation at Jason’s house in Chapter 1, after the mission Down to Earth. Do it before leaving Chapter 1: that spot disappears and there is no mission replay.';
}

function renderRoadmap() {
  const box = document.getElementById('roadmap');
  box.replaceChildren();
  for (const s of doc.roadmap) {
    const card = el('article', 'stage');
    card.append(el('h3', '', s.title));
    card.append(el('p', 'stage-time', s.time));
    card.append(el('p', '', s.text));
    card.append(sourceLinks(s.sources));
    box.append(card);
  }
}

function renderSources() {
  const ul = document.getElementById('sourcesList');
  ul.replaceChildren();
  for (const key of Object.keys(doc.sources)) {
    const src = doc.sources[key];
    const li = el('li');
    if (src.url) {
      const a = document.createElement('a');
      a.href = src.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = src.name;
      li.append(a);
    } else {
      li.textContent = src.name;
    }
    ul.append(li);
  }
}

function renderProgress() {
  const total = doc.trophies.length;
  const done = state.earned.size;
  const pct = Math.round((done / total) * 100);
  document.getElementById('progressText').textContent = `${done} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of doc.trophies) {
    byGrade[t.grade] = byGrade[t.grade] ?? { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (state.earned.has(t.name)) byGrade[t.grade].got += 1;
  }
  document.getElementById('gradeCounts').textContent =
    ['platinum', 'gold', 'silver', 'bronze']
      .map((g) => `${byGrade[g].got}/${byGrade[g].total} ${g}`)
      .join(' · ');
}

function trophyCard(t) {
  const card = el('article', 'card' + (state.earned.has(t.name) ? ' earned' : ''));
  card.id = `trophy-${t.id}`;
  const top = el('div', 'card-top');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(t.name);
  box.setAttribute('aria-label', `Mark ${t.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) state.earned.add(t.name);
    else state.earned.delete(t.name);
    saveState();
    renderAll();
  });
  top.append(box);
  const head = el('div', 'card-head');
  const hidden = spoilerHidden(t);
  head.append(el('h3', 'card-name', hidden ? 'Hidden story trophy' : t.name));
  head.querySelector('.card-name').classList.toggle('spoiler-name', hidden);
  head.append(el('p', 'card-desc', hidden ? 'Complete the story to reveal this trophy.' : t.description));
  const badges = el('div', 'badges');
  badges.append(el('span', `badge ${t.grade}`, t.grade));
  badges.append(el('span', 'badge kind', t.kind));
  if (t.count) badges.append(el('span', 'badge', `× ${t.count}`));
  if (t.hidden) badges.append(el('span', 'badge hidden', 'hidden'));
  if (t.missable) badges.append(el('span', 'badge missable', 'missable'));
  badges.append(el('span', 'badge', `stage ${t.stage}`));
  head.append(badges);
  if (!hidden) {
    head.append(el('p', 'card-guide', t.guide));
    head.append(sourceLinks(t.sources));
  }
  top.append(head);
  card.append(top);
  return card;
}

function renderList() {
  const list = document.getElementById('list');
  list.replaceChildren();
  let shown = 0;
  for (const stage of [1, 2, 3]) {
    const stageTrophies = doc.trophies.filter((t) => t.stage === stage && trophyVisible(t));
    if (!stageTrophies.length) continue;
    const heading = el('h3', 'stage-heading', doc.roadmap[stage - 1].title);
    list.append(heading);
    for (const t of stageTrophies) {
      list.append(trophyCard(t));
      shown += 1;
    }
  }
  document.getElementById('listNote').textContent =
    shown === doc.trophies.length
      ? `Showing all ${shown} trophies. Tick a trophy when you earn it — progress is saved in this browser.`
      : `Showing ${shown} of ${doc.trophies.length} trophies.`;
}

function renderAll() {
  renderProgress();
  renderList();
}

function applyHash() {
  const hash = new URLSearchParams(location.hash.slice(1));
  if (hash.get('spoiler') === 'on') {
    state.spoiler = true;
    document.getElementById('spoilerToggle').checked = true;
    saveState();
  }
  const openId = Number(hash.get('trophy'));
  if (openId) {
    const target = document.getElementById(`trophy-${openId}`);
    if (target) target.scrollIntoView({ block: 'center' });
    return;
  }
  const stage = hash.get('stage');
  if (stage === 'roadmap') {
    document.getElementById('roadmapSection').scrollIntoView();
  }
}

function wireControls() {
  document.querySelectorAll('.kind-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.kind === state.kind);
    btn.addEventListener('click', () => {
      state.kind = btn.dataset.kind;
      document.querySelectorAll('.kind-btn').forEach((b) => b.classList.toggle('active', b === btn));
      saveState();
      renderList();
    });
  });
  const grade = document.getElementById('gradeFilter');
  grade.value = state.grade;
  grade.addEventListener('change', () => {
    state.grade = grade.value;
    saveState();
    renderList();
  });
  const spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = state.spoiler;
  spoiler.addEventListener('change', () => {
    state.spoiler = spoiler.checked;
    saveState();
    renderList();
  });
  const earnedOnly = document.getElementById('earnedOnly');
  earnedOnly.checked = state.earnedOnly;
  earnedOnly.addEventListener('change', () => {
    state.earnedOnly = earnedOnly.checked;
    saveState();
    renderList();
  });
  document.getElementById('search').addEventListener('input', (e) => {
    state.query = e.target.value.trim().toLowerCase();
    renderList();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    const payload = { game: 'Grand Theft Auto VI', exported: new Date().toISOString(), earned: [...state.earned] };
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
    a.download = 'gta6-trophy-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const names = Array.isArray(data) ? data : data.earned;
      const known = new Set(doc.trophies.map((t) => t.name));
      const kept = (Array.isArray(names) ? names : []).filter((n) => known.has(n));
      state.earned = new Set(kept);
      saveState();
      renderAll();
    } catch {
      alert('That file is not a trophy progress export.');
    }
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!confirm('Clear all earned trophies?')) return;
    state.earned = new Set();
    saveState();
    renderAll();
  });
}

loadState();
doc = await (await fetch('data/trophies.json')).json();
sourceByKey = doc.sources;
renderFacts();
renderRoadmap();
renderSources();
wireControls();
renderAll();
applyHash();
