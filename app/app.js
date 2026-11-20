// Bootstrap for the GTA VI trophy guide: loads the trophy and roadmap data, reads
// the route and filters from the URL, wires the toolbar and tracker, and renders
// the guide list, the roadmap, or one trophy's detail view.

import { loadEarnedProgress, saveEarnedProgress, exportProgressFile, parseProgressFile, loadSampleProgress } from './tracker.js';
import { renderTrophyList } from './render-list.js';
import { renderRoadmapView } from './render-roadmap.js';
import { renderTrophyDetail } from './render-detail.js';

const listElement = document.getElementById('trophyList');
const countElement = document.getElementById('resultCount');
const roadmapElement = document.getElementById('roadmapView');
const detailElement = document.getElementById('trophyDetail');
const viewGuide = document.getElementById('view-guide');
const viewRoadmap = document.getElementById('view-roadmap');
const viewDetail = document.getElementById('view-detail');
const toolbar = document.getElementById('toolbar');
const searchInput = document.getElementById('search');
const gradeSelect = document.getElementById('grade');
const spoilerBox = document.getElementById('spoiler');
const tabGuide = document.getElementById('tabGuide');
const tabRoadmap = document.getElementById('tabRoadmap');

const state = {
  trophies: [],
  roadmap: null,
  earned: loadEarnedProgress(),
  kind: 'all',
  grade: 'all',
  query: '',
  spoiler: false,
  openId: null,
};

function readUrlState() {
  const params = new URLSearchParams(location.search);
  const kind = params.get('filter');
  if (['all', 'story', 'missable', 'collectibles', 'activities', 'online'].includes(kind)) {
    state.kind = kind;
  }
  const grade = params.get('grade');
  if (['all', 'platinum', 'gold', 'silver', 'bronze'].includes(grade)) state.grade = grade;
  state.spoiler = params.get('spoiler') === 'on';
  state.query = params.get('q') ?? '';
  const open = Number(params.get('open'));
  if (Number.isInteger(open) && open >= 1 && open <= 55) state.openId = open;
  if (params.get('demo') === '1' && state.earned.size === 0) {
    state.earned = loadSampleProgress();
    saveEarnedProgress(state.earned);
  }
}

function currentRoute() {
  const hash = location.hash.replace(/^#/, '');
  if (hash === '/roadmap' || hash === 'roadmap') return { name: 'roadmap' };
  const trophyMatch = hash.match(/^\/?trophy\/(\d+)$/);
  if (trophyMatch) return { name: 'detail', id: Number(trophyMatch[1]) };
  return { name: 'guide' };
}

function updateProgressBox() {
  const total = state.trophies.length || 55;
  const earned = state.earned.size;
  document.getElementById('progressText').textContent = `${earned} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${Math.round((earned / total) * 100)}%`;
  document.getElementById('progressBar').style.width = `${(earned / total) * 100}%`;
}

function syncToolbar() {
  searchInput.value = state.query;
  gradeSelect.value = state.grade;
  spoilerBox.checked = state.spoiler;
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.classList.toggle('active', chip.dataset.kind === state.kind);
  }
}

const callbacks = {
  onToggleEarned(id, checked) {
    if (checked) state.earned.add(id);
    else state.earned.delete(id);
    saveEarnedProgress(state.earned);
    renderCurrentView();
  },
  onToggleOpen(id) {
    state.openId = state.openId === id ? null : id;
    renderCurrentView();
  },
};

function renderCurrentView() {
  updateProgressBox();
  const route = currentRoute();
  viewGuide.hidden = route.name !== 'guide';
  viewRoadmap.hidden = route.name !== 'roadmap';
  viewDetail.hidden = route.name !== 'detail';
  toolbar.hidden = route.name !== 'guide';
  tabGuide.classList.toggle('active', route.name === 'guide' || route.name === 'detail');
  tabRoadmap.classList.toggle('active', route.name === 'roadmap');
  if (route.name === 'guide') {
    renderTrophyList(listElement, countElement, state.trophies, state, callbacks);
  } else if (route.name === 'roadmap') {
    renderRoadmapView(roadmapElement, state.roadmap, state.trophies, state);
  } else {
    const trophy = state.trophies.find((entry) => entry.id === route.id);
    if (trophy) renderTrophyDetail(detailElement, trophy, state.trophies, state, callbacks);
    else location.hash = '#/';
  }
}

function wireToolbar() {
  searchInput.addEventListener('input', () => {
    state.query = searchInput.value;
    renderTrophyList(listElement, countElement, state.trophies, state, callbacks);
  });
  gradeSelect.addEventListener('change', () => {
    state.grade = gradeSelect.value;
    renderTrophyList(listElement, countElement, state.trophies, state, callbacks);
  });
  spoilerBox.addEventListener('change', () => {
    state.spoiler = spoilerBox.checked;
    renderCurrentView();
  });
  for (const chip of document.querySelectorAll('#kindChips .chip')) {
    chip.addEventListener('click', () => {
      state.kind = chip.dataset.kind;
      syncToolbar();
      renderTrophyList(listElement, countElement, state.trophies, state, callbacks);
    });
  }
  document.getElementById('export').addEventListener('click', () => {
    exportProgressFile(state.earned);
  });
  document.getElementById('import').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state.earned = parseProgressFile(await file.text());
      saveEarnedProgress(state.earned);
      renderCurrentView();
    } catch {
      alert('That file is not a trophy-progress export.');
    }
    event.target.value = '';
  });
  document.getElementById('demo').addEventListener('click', () => {
    state.earned = loadSampleProgress();
    saveEarnedProgress(state.earned);
    renderCurrentView();
  });
  document.getElementById('reset').addEventListener('click', () => {
    state.earned = new Set();
    saveEarnedProgress(state.earned);
    renderCurrentView();
  });
  window.addEventListener('hashchange', renderCurrentView);
}

async function loadTrophyData() {
  const [trophyDoc, roadmapDoc] = await Promise.all([
    (await fetch('data/trophies.json')).json(),
    (await fetch('data/roadmap.json')).json(),
  ]);
  state.trophies = trophyDoc.trophies;
  state.roadmap = roadmapDoc;
}

readUrlState();
await loadTrophyData();
syncToolbar();
wireToolbar();
renderCurrentView();
