// app.js — the GTA 6 trophy guide + tracker. Static, offline, no network at run time
// beyond loading its own two JSON files. ES module; the store logic lives in store.js.
import {
  KEY, blankState, loadState, saveState, toggleEarned, setCount,
  progress, exportState, importState, demoState,
} from './store.js';

const KIND_LABELS = { story: 'Story', collectibles: 'Collectibles', activities: 'Activities' };
const GRADE_LABELS = { platinum: 'Platinum', gold: 'Gold', silver: 'Silver', bronze: 'Bronze' };

function params() {
  return new URLSearchParams(location.search);
}

function esc(s) {
  return String(s)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

let TROPHIES = [];
let ROADMAP = null;
let state = blankState();
let demoMode = false;
let view = 'guide';
let kindFilter = 'all';
let gradeFilter = 'all';
let query = '';

function isMasked(t) {
  return state.spoiler && t.kind === 'story' && !state.earned[t.id];
}

function visibleTrophies() {
  return TROPHIES.filter((t) => {
    if (kindFilter === 'missable' && !t.missable) return false;
    if (kindFilter !== 'all' && kindFilter !== 'missable' && t.kind !== kindFilter) return false;
    if (gradeFilter !== 'all' && t.grade !== gradeFilter) return false;
    if (query) {
      const hay = (t.name + ' ' + t.description + ' ' + t.guide).toLowerCase();
      if (!hay.includes(query.toLowerCase())) return false;
    }
    return true;
  });
}

function headerHtml() {
  const p = progress(state, TROPHIES);
  const gradeBits = Object.keys(GRADE_LABELS)
    .map((g) => `${GRADE_LABELS[g]} ${p.byGrade[g] ? p.byGrade[g].earned : 0}/${p.byGrade[g] ? p.byGrade[g].total : 0}`)
    .join(' · ');
  return `
  <div class="progress-wrap">
    <div class="progress-line"><strong>${p.earned} / ${p.total} earned</strong> <span>(${p.percent}%)</span></div>
    <div class="bar"><div class="bar-fill" style="width:${p.percent}%"></div></div>
    <div class="progress-sub">${gradeBits}</div>
    ${demoMode ? '<div class="demo-badge">Demo progress — <button id="clear-demo" type="button">clear it</button></div>' : ''}
  </div>`;
}

function tabsHtml() {
  const tabs = [['guide', 'Guide & Tracker'], ['roadmap', 'Roadmap'], ['missables', 'Missables']];
  return `<nav class="tabs">${tabs.map(([k, label]) =>
    `<button type="button" data-view="${k}" class="${view === k ? 'active' : ''}">${label}</button>`).join('')}</nav>`;
}

function filtersHtml() {
  const kinds = [['all', 'All'], ['story', 'Story'], ['collectibles', 'Collectibles'], ['activities', 'Activities'], ['missable', 'Missable']];
  const grades = [['all', 'All grades'], ['platinum', 'Platinum'], ['gold', 'Gold'], ['silver', 'Silver'], ['bronze', 'Bronze']];
  return `
  <div class="filters">
    <input id="search" type="search" placeholder="Search trophies, guides…" value="${esc(query)}" aria-label="Search trophies">
    <div class="chips">${kinds.map(([k, label]) =>
      `<button type="button" data-kind="${k}" class="${kindFilter === k ? 'active' : ''}">${label}</button>`).join('')}</div>
    <select id="grade" aria-label="Filter by grade">${grades.map(([k, label]) =>
      `<option value="${k}" ${gradeFilter === k ? 'selected' : ''}>${label}</option>`).join('')}</select>
    <label class="spoiler-toggle"><input id="spoiler" type="checkbox" ${state.spoiler ? 'checked' : ''}> Spoiler mode</label>
  </div>`;
}

function counterHtml(t) {
  if (!t.count) return '';
  const n = state.counts[t.id] || 0;
  const done = n >= t.count;
  return `
  <div class="counter" data-id="${t.id}">
    <span class="counter-label">Progress</span>
    <span class="counter-value">${n.toLocaleString()} / ${t.count.toLocaleString()}</span>
    <button type="button" data-count="-1" aria-label="Decrease count">−1</button>
    <button type="button" data-count="1" aria-label="Increase count">+1</button>
    <button type="button" data-count="5" aria-label="Add five">+5</button>
    ${done ? '<span class="counter-done">Target reached ✓</span>' : ''}
  </div>`;
}

function cardHtml(t) {
  const masked = isMasked(t);
  const earned = !!state.earned[t.id];
  const name = masked ? 'Hidden story trophy' : esc(t.name);
  const desc = masked
    ? 'Story trophy — hidden until earned (spoiler mode is on).'
    : esc(t.description);
  const body = masked
    ? '<p class="masked-note">Earn it to reveal the guide. Spoiler mode hides story trophies until you earn them.</p>'
    : `
    <p class="guide">${esc(t.guide)}</p>
    <ol class="steps">${t.steps.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
    ${counterHtml(t)}
    <p class="sources">Sources: ${t.sources.map((s) => `<a href="${esc(s.u)}" target="_blank" rel="noopener">${esc(s.n)}</a>`).join(' · ')}</p>`;
  return `
  <article class="card ${earned ? 'earned' : ''} ${t.missable ? 'is-missable' : ''}" id="trophy-${t.id}" data-id="${t.id}">
    <div class="card-top">
      <label class="check"><input type="checkbox" data-earn="${t.id}" ${earned ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned"> <span>${earned ? 'Earned ✓' : 'Not earned'}</span></label>
      <span class="grade grade-${t.grade}">${GRADE_LABELS[t.grade]}</span>
    </div>
    <h3>${name}</h3>
    <p class="desc">${desc}</p>
    <div class="tags">
      <span class="tag">${KIND_LABELS[t.kind]}</span>
      <span class="tag">Stage ${t.stage}</span>
      ${t.missable ? '<span class="tag tag-missable">⚠ Missable</span>' : ''}
      ${t.count ? `<span class="tag">Target ${t.count.toLocaleString()}</span>` : ''}
    </div>
    ${body}
  </article>`;
}

function guideViewHtml() {
  const list = visibleTrophies();
  return `
  ${filtersHtml()}
  <p class="count-line">Showing ${list.length} of ${TROPHIES.length} trophies.</p>
  <div class="cards">${list.map(cardHtml).join('') || '<p class="empty">No trophies match these filters.</p>'}</div>`;
}

function roadmapViewHtml() {
  const p = progress(state, TROPHIES);
  const stages = ROADMAP.stages.map((s) => {
    const chips = s.trophies.map((id) => {
      const t = TROPHIES.find((x) => x.id === id);
      if (!t) return '';
      return `<li class="${state.earned[id] ? 'done' : ''}">${state.earned[id] ? '✓ ' : ''}${esc(t.name)}</li>`;
    }).join('');
    return `
    <section class="stage">
      <h3>Stage ${s.n} — ${esc(s.title)}</h3>
      <p class="stage-hours">${esc(s.hours)} · ${s.trophies.length} trophies</p>
      <p>${esc(s.summary)}</p>
      <ul class="stage-list">${chips}</ul>
      <ul class="watchouts">${s.watchouts.map((w) => `<li>${esc(w)}</li>`).join('')}</ul>
    </section>`;
  }).join('');
  return `
  <section class="roadmap-intro">
    <h2>${esc(ROADMAP.title)}</h2>
    <p>Difficulty ${esc(ROADMAP.difficulty)} · about ${esc(ROADMAP.time)} · ${p.earned}/${p.total} earned so far · ${ROADMAP.online} online trophies · ${ROADMAP.playthroughs} playthrough.</p>
    <ul class="rules">${ROADMAP.rules.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
  </section>
  ${stages}`;
}

function missablesViewHtml() {
  const missable = TROPHIES.filter((t) => t.missable);
  return `
  <section class="missables-intro">
    <h2>Missable trophies — just one</h2>
    <p>Every guide we cite agrees: only one trophy in the whole list can be missed, and only in Chapter 1. Everything else can be finished after the story, in free roam.</p>
  </section>
  <div class="cards">${missable.map(cardHtml).join('')}</div>
  <section class="missables-note">
    <h3>One-time moments that are not missable</h3>
    <p>These are easy to forget, but they stay available in free roam: the Ocean Beach cocktail (In The Beginning…), the unscheduled departure at VCIA (Catch Me If You Can), and smashing out of a vehicle showroom (Capital Offense). Do them when you pass — or mop them up in Stage 3.</p>
  </section>`;
}

function render() {
  const app = document.getElementById('app');
  let body = '';
  if (view === 'roadmap') body = roadmapViewHtml();
  else if (view === 'missables') body = missablesViewHtml();
  else body = guideViewHtml();
  app.innerHTML = headerHtml() + tabsHtml() + body;
  bind();
  const open = params().get('open');
  if (open) {
    const el = document.getElementById('trophy-' + open);
    if (el) {
      el.scrollIntoView({ block: 'start' });
      el.classList.add('flash');
    }
  }
}

function bind() {
  document.querySelectorAll('[data-view]').forEach((b) => {
    b.addEventListener('click', () => {
      view = b.dataset.view;
      const p = params();
      p.set('view', view);
      history.replaceState(null, '', '?' + p.toString());
      render();
    });
  });
  const search = document.getElementById('search');
  if (search) {
    search.addEventListener('input', () => {
      query = search.value;
      render();
      const again = document.getElementById('search');
      if (again) {
        again.focus();
        again.setSelectionRange(again.value.length, again.value.length);
      }
    });
  }
  document.querySelectorAll('[data-kind]').forEach((b) => {
    b.addEventListener('click', () => { kindFilter = b.dataset.kind; render(); });
  });
  const grade = document.getElementById('grade');
  if (grade) grade.addEventListener('change', () => { gradeFilter = grade.value; render(); });
  const spoiler = document.getElementById('spoiler');
  if (spoiler) {
    spoiler.addEventListener('change', () => {
      state.spoiler = spoiler.checked;
      saveState(localStorage, state);
      render();
    });
  }
  const clearDemo = document.getElementById('clear-demo');
  if (clearDemo) {
    clearDemo.addEventListener('click', () => {
      state = blankState();
      demoMode = false;
      saveState(localStorage, state);
      render();
    });
  }
  document.querySelectorAll('[data-earn]').forEach((box) => {
    box.addEventListener('change', () => {
      toggleEarned(state, Number(box.dataset.earn));
      demoMode = false;
      saveState(localStorage, state);
      render();
    });
  });
  document.querySelectorAll('[data-count]').forEach((b) => {
    b.addEventListener('click', () => {
      const card = b.closest('.counter');
      const id = Number(card.dataset.id);
      const n = (state.counts[id] || 0) + Number(b.dataset.count);
      setCount(state, TROPHIES, id, n);
      demoMode = false;
      saveState(localStorage, state);
      render();
    });
  });
  const exportBtn = document.getElementById('export');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const blob = new Blob([exportState(state)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'gta6-trophies-progress.json';
      a.click();
      URL.revokeObjectURL(a.href);
    });
  }
  const importInput = document.getElementById('import');
  if (importInput) {
    importInput.addEventListener('change', async () => {
      const file = importInput.files[0];
      const note = document.getElementById('import-note');
      if (!file) return;
      try {
        state = importState(await file.text(), TROPHIES);
        demoMode = false;
        saveState(localStorage, state);
        if (note) note.textContent = 'Progress imported.';
        render();
      } catch (e) {
        if (note) note.textContent = 'Import failed: ' + e.message;
      }
      importInput.value = '';
    });
  }
  const resetBtn = document.getElementById('reset');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (window.confirm('Clear all tracked progress?')) {
        state = blankState();
        demoMode = false;
        saveState(localStorage, state);
        render();
      }
    });
  }
}

async function boot() {
  const [tRes, rRes] = await Promise.all([fetch('data/trophies.json'), fetch('data/roadmap.json')]);
  const tData = await tRes.json();
  TROPHIES = tData.trophies;
  ROADMAP = await rRes.json();
  const p = params();
  view = ['guide', 'roadmap', 'missables'].includes(p.get('view')) ? p.get('view') : 'guide';
  kindFilter = p.get('kind') || 'all';
  gradeFilter = p.get('grade') || 'all';
  query = p.get('q') || '';
  const saved = localStorage.getItem(KEY);
  if (p.get('demo') === '1' && !saved) {
    state = demoState();
    demoMode = true;
  } else {
    state = loadState(localStorage, TROPHIES);
  }
  if (p.get('spoiler') === '0') state.spoiler = false;
  if (p.get('spoiler') === '1') state.spoiler = true;
  render();
}

boot();
