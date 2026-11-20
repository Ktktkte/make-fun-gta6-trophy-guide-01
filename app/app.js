// Leonida Trophy Guide — tracker logic.
// Loads app/data/trophies.json, renders the checklist, saves progress in
// localStorage, and offers search, filters, a spoiler setting, and JSON
// export / import. The app fetches nothing from the network: the trophy
// file is one of its own files, served from the same folder.

const DATA_URL = 'data/trophies.json';
const STORAGE_KEY = 'gta6-trophy-guide-progress-v2';
const TOTAL_TROPHIES = 55;

// Filter names the buttons carry, mapped to the trophies they show.
const FILTERS = {
  all: { label: 'All 55', test: () => true, note: '' },
  story: {
    label: 'Story',
    test: (t) => t.kind === 'story' || t.kind === 'questline',
    note: 'Story trophies (the 12 story trophies and the platinum) plus the 8 character questlines.',
  },
  missable: {
    label: 'Missable & story-gated',
    test: (t) => t.missable === true,
    note: '24 trophies flagged: 1 is truly missable (Positive Mental Attitude, Chapter 1), the rest are story-gated, questline-gated, choice-gated or one-chance. Each card states its reason.',
  },
  collectible: {
    label: 'Collectibles',
    test: (t) => t.kind === 'collectible' || t.kind === 'money' || t.kind === 'exploration',
    note: 'Collectibles, exploration and money trophies: cards, WAiNK scans, vehicles, meditations, map coverage, garages and the two money totals.',
  },
  activity: {
    label: 'Activities',
    test: (t) => t.kind === 'activity' || t.kind === 'combat',
    note: 'Activity and combat trophies: stunts, races, shooting ranges, challenges, robberies and the rest.',
  },
  online: {
    label: 'Online',
    test: () => false,
    note: 'There are no online trophies in GTA 6 — every trophy is earned in single-player, so this filter is empty by design.',
  },
};

const KIND_LABELS = {
  story: 'Story',
  questline: 'Questline',
  collectible: 'Collectible',
  activity: 'Activity',
  combat: 'Combat',
  exploration: 'Exploration',
  money: 'Money',
};

const STAGE_LABELS = { 1: 'Stage 1 · Story', 2: 'Stage 2 · 100%', 3: 'Stage 3 · Clean-up' };

let allTrophies = [];
let earnedIds = new Set();
let spoilerOn = false;
let activeFilter = 'all';
let searchText = '';

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) earnedIds = new Set(saved.earned.filter((n) => Number.isInteger(n)));
    if (typeof saved.spoiler === 'boolean') spoilerOn = saved.spoiler;
  } catch (err) {
    // A damaged save must never break the guide: start fresh.
    earnedIds = new Set();
    spoilerOn = false;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ earned: [...earnedIds].sort((a, b) => a - b), spoiler: spoilerOn }));
  } catch (err) {
    // Private mode can refuse localStorage; the checklist still works in memory.
  }
}

function gradeWord(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function formatCount(trophy) {
  if (trophy.count === null || trophy.count === undefined) return '';
  return '×' + trophy.count.toLocaleString('en-US');
}

function isSpoilerHidden(trophy) {
  return spoilerOn && trophy.hidden === true && !earnedIds.has(trophy.id);
}

function buildTrophyCard(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy' + (earnedIds.has(trophy.id) ? ' is-earned' : '');
  li.dataset.trophyId = String(trophy.id);

  const head = document.createElement('div');
  head.className = 'trophy-head';

  const check = document.createElement('input');
  check.type = 'checkbox';
  check.className = 'trophy-check';
  check.checked = earnedIds.has(trophy.id);
  check.setAttribute('aria-label', 'Mark ' + trophy.name + ' as earned');
  check.addEventListener('change', () => {
    if (check.checked) earnedIds.add(trophy.id); else earnedIds.delete(trophy.id);
    saveState();
    renderTrophyList();
    updateProgressBar();
  });

  const titleBtn = document.createElement('button');
  titleBtn.type = 'button';
  titleBtn.className = 'trophy-title';
  titleBtn.setAttribute('aria-expanded', 'false');
  titleBtn.addEventListener('click', () => {
    const open = li.classList.toggle('is-open');
    titleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggleLabel.textContent = open ? 'Hide guide' : 'Show guide';
  });

  const nameEl = document.createElement('span');
  nameEl.className = 'trophy-name';
  nameEl.textContent = isSpoilerHidden(trophy) ? 'Hidden trophy — earn it to reveal' : trophy.name;

  const descEl = document.createElement('span');
  descEl.className = 'trophy-desc';
  descEl.textContent = isSpoilerHidden(trophy)
    ? 'A hidden story trophy. Its name and description stay hidden until you earn it.'
    : trophy.description;

  const metaEl = document.createElement('span');
  metaEl.className = 'trophy-meta';
  const pills = [
    { text: gradeWord(trophy.grade), cls: 'pill-' + trophy.grade },
    { text: KIND_LABELS[trophy.kind] || trophy.kind, cls: 'pill-kind' },
  ];
  if (trophy.count !== null && trophy.count !== undefined) pills.push({ text: formatCount(trophy), cls: 'pill-count' });
  if (trophy.hidden) pills.push({ text: 'Hidden', cls: 'pill-hidden' });
  if (trophy.missable) pills.push({ text: 'Missable / gated', cls: 'pill-missable' });
  pills.push({ text: STAGE_LABELS[trophy.stage] || '', cls: 'pill-stage' });
  for (const pill of pills) {
    const span = document.createElement('span');
    span.className = 'pill ' + pill.cls;
    span.textContent = pill.text;
    metaEl.appendChild(span);
  }

  titleBtn.appendChild(nameEl);
  titleBtn.appendChild(descEl);
  titleBtn.appendChild(metaEl);

  const toggleLabel = document.createElement('span');
  toggleLabel.className = 'trophy-toggle';
  toggleLabel.textContent = 'Show guide';

  head.appendChild(check);
  head.appendChild(titleBtn);
  head.appendChild(toggleLabel);
  li.appendChild(head);

  const body = document.createElement('div');
  body.className = 'trophy-body';

  const guideHeading = document.createElement('h4');
  guideHeading.textContent = 'Guide';
  const guidePara = document.createElement('p');
  guidePara.className = 'trophy-guide';
  guidePara.textContent = trophy.guide;
  body.appendChild(guideHeading);
  body.appendChild(guidePara);

  if (Array.isArray(trophy.steps) && trophy.steps.length > 0) {
    const stepsHeading = document.createElement('h4');
    stepsHeading.textContent = 'Steps';
    const stepsList = document.createElement('ol');
    stepsList.className = 'trophy-steps';
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      stepsList.appendChild(item);
    }
    body.appendChild(stepsHeading);
    body.appendChild(stepsList);
  }

  if (trophy.missable && trophy.missableReason) {
    const warn = document.createElement('p');
    warn.className = 'trophy-warning';
    warn.textContent = 'Missable / gated — ' + trophy.missableReason;
    body.appendChild(warn);
  }

  if (Array.isArray(trophy.sources) && trophy.sources.length > 0) {
    const sourcesHeading = document.createElement('h4');
    sourcesHeading.textContent = 'Sources';
    const sourcesList = document.createElement('ul');
    sourcesList.className = 'trophy-sources-list';
    for (const source of trophy.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      item.appendChild(link);
      sourcesList.appendChild(item);
    }
    const sourcesWrap = document.createElement('div');
    sourcesWrap.className = 'trophy-sources';
    sourcesWrap.appendChild(sourcesHeading);
    sourcesWrap.appendChild(sourcesList);
    body.appendChild(sourcesWrap);
  }

  li.appendChild(body);
  return li;
}

function visibleTrophies() {
  const filter = FILTERS[activeFilter] || FILTERS.all;
  const query = searchText.trim().toLowerCase();
  return allTrophies.filter((trophy) => {
    if (!filter.test(trophy)) return false;
    if (!query) return true;
    const haystack = (trophy.name + ' ' + trophy.description + ' ' + trophy.guide).toLowerCase();
    return haystack.includes(query);
  });
}

function renderTrophyList() {
  const list = document.getElementById('trophyList');
  const status = document.getElementById('listStatus');
  const note = document.getElementById('filterNote');
  list.replaceChildren();
  const shown = visibleTrophies();
  if (shown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty-note';
    empty.textContent = activeFilter === 'online'
      ? 'No online trophies — every GTA 6 trophy is earned in single-player.'
      : 'No trophies match this search or filter.';
    list.appendChild(empty);
  } else {
    for (const trophy of shown) list.appendChild(buildTrophyCard(trophy));
  }
  const filter = FILTERS[activeFilter] || FILTERS.all;
  note.textContent = filter.note || '';
  status.textContent = shown.length + ' of ' + allTrophies.length + ' trophies shown · ' + earnedIds.size + ' earned';
}

function updateProgressBar() {
  const earned = earnedIds.size;
  const total = allTrophies.length || TOTAL_TROPHIES;
  const pct = total === 0 ? 0 : Math.round((earned / total) * 100);
  document.getElementById('progressLabel').textContent = earned + ' / ' + total + ' earned · ' + pct + '%';
  document.getElementById('progressFill').style.width = pct + '%';
  document.getElementById('stickyLabel').textContent = earned + ' / ' + total + ' · ' + pct + '%';
  document.getElementById('stickyFill').style.width = pct + '%';
  const byGrade = {};
  for (const trophy of allTrophies) {
    if (!earnedIds.has(trophy.id)) continue;
    byGrade[trophy.grade] = (byGrade[trophy.grade] || 0) + 1;
  }
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const have = byGrade[grade] || 0;
    const want = allTrophies.filter((t) => t.grade === grade).length;
    return gradeWord(grade) + ' ' + have + '/' + want;
  });
  document.getElementById('gradeCounts').textContent = parts.join(' · ');
  document.getElementById('stickyGrades').textContent = parts.join(' · ');
}

function setFilter(name, button) {
  activeFilter = name;
  document.querySelectorAll('#filters .filter').forEach((btn) => {
    btn.classList.toggle('is-active', btn === button);
  });
  renderTrophyList();
}

function downloadProgressFile() {
  const payload = {
    app: 'gta6-trophy-guide-01',
    exportedAt: new Date().toISOString(),
    earned: [...earnedIds].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'gta6-trophy-progress.json';
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function importProgressFile(file) {
  const reader = new FileReader();
  reader.addEventListener('load', () => {
    try {
      const parsed = JSON.parse(String(reader.result));
      const ids = Array.isArray(parsed) ? parsed : parsed.earned;
      if (!Array.isArray(ids)) throw new Error('no earned list');
      const known = new Set(allTrophies.map((t) => t.id));
      const next = new Set();
      for (const id of ids) if (known.has(id)) next.add(id);
      earnedIds = next;
      saveState();
      renderTrophyList();
      updateProgressBar();
    } catch (err) {
      document.getElementById('listStatus').textContent = 'That file could not be imported — it is not a progress export from this guide.';
    }
  });
  reader.readAsText(file);
}

function wireControls() {
  document.querySelectorAll('#filters .filter').forEach((button) => {
    button.addEventListener('click', () => setFilter(button.dataset.filter, button));
  });
  document.getElementById('searchBox').addEventListener('input', (event) => {
    searchText = event.target.value;
    renderTrophyList();
  });
  const spoiler = document.getElementById('spoilerToggle');
  spoiler.checked = spoilerOn;
  spoiler.addEventListener('change', () => {
    spoilerOn = spoiler.checked;
    saveState();
    renderTrophyList();
  });
  document.getElementById('exportBtn').addEventListener('click', downloadProgressFile);
  const importFile = document.getElementById('importFile');
  document.getElementById('importBtn').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', () => {
    if (importFile.files && importFile.files[0]) importProgressFile(importFile.files[0]);
    importFile.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (!window.confirm('Clear all checked trophies?')) return;
    earnedIds = new Set();
    saveState();
    renderTrophyList();
    updateProgressBar();
  });
}

async function loadTrophyData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('trophy data did not load (' + response.status + ')');
  const data = await response.json();
  const trophies = Array.isArray(data) ? data : data.trophies;
  if (!Array.isArray(trophies) || trophies.length !== TOTAL_TROPHIES) {
    throw new Error('trophy data did not hold 55 trophies');
  }
  allTrophies = trophies;
}

async function startGuide() {
  loadSavedState();
  wireControls();
  try {
    await loadTrophyData();
  } catch (err) {
    document.getElementById('listStatus').textContent = 'The trophy list could not be loaded. Reload the page to try again.';
    return;
  }
  renderTrophyList();
  updateProgressBar();
}

startGuide();
