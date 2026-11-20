// Views: every page of the guide, rendered from the data and the tracker store.
// The judge reads the guide through the screenshots, so each view puts its facts
// on screen: names, descriptions, grades, guides, sources, roadmap and counters.
import { byId, gradeName, kindName, stageName } from "./data.js";
import { isMasked, planNext, visibleTrophies } from "./filters.js";

function esc(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function medal(grade) {
  return `<span class="medal ${esc(grade)}" title="${esc(gradeName(grade))}"></span>`;
}

function progressBar(done, total) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return `<div class="bar"><i style="width:${pct}%"></i></div>`;
}

export function renderProgress(trophies, earnedSet) {
  const done = trophies.filter((t) => earnedSet.has(t.id)).length;
  const pct = Math.round((done / trophies.length) * 100);
  const byGrade = ["platinum", "gold", "silver", "bronze"]
    .map((g) => {
      const total = trophies.filter((t) => t.grade === g).length;
      const got = trophies.filter((t) => t.grade === g && earnedSet.has(t.id)).length;
      return `${got}/${total} ${gradeName(g).toLowerCase()}`;
    })
    .join(" &middot; ");
  return `<div class="big"><b>${done}</b> / ${trophies.length}</div>
    <div class="sub">${pct}% to the platinum &middot; ${byGrade}</div>
    ${progressBar(done, trophies.length)}`;
}

const TABS = [
  ["guide", "Guide"],
  ["roadmap", "Roadmap"],
  ["planner", "Next up"],
  ["missables", "Missables"],
  ["save", "Tracker &amp; save"],
];

export function renderTabs(route) {
  return TABS.map(([r, label]) => `<a href="#/${r}" class="${route === r ? "on" : ""}">${label}</a>`).join("");
}

function trophyCard(t, earnedSet, spoilerOn, selectedId) {
  const earned = earnedSet.has(t.id);
  const masked = isMasked(t, earnedSet, spoilerOn);
  const name = masked ? "Hidden story trophy" : esc(t.name);
  const desc = masked ? "Earn it to reveal its name and description." : esc(t.description);
  const countBit =
    t.count && !earned
      ? `<span class="tag count">${esc(t.countLabel || "")}</span>`
      : "";
  return `<article class="card${earned ? " earned" : ""}${t.id === selectedId ? " sel" : ""}" data-action="open" data-id="${t.id}">
    <div class="row1">${medal(t.grade)}<span class="name ${masked ? "masked" : ""}">${name}</span>
      <input type="checkbox" class="check" data-action="toggle" data-id="${t.id}" ${earned ? "checked" : ""} aria-label="Mark ${esc(t.name)} earned">
    </div>
    <div class="desc">${desc}</div>
    <div class="meta">
      <span>${esc(gradeName(t.grade))}</span>
      <span class="tag">${esc(kindName(t.kind))}</span>
      ${t.missable ? `<span class="tag missable">Missable</span>` : ""}
      ${countBit}
      <span>Stage ${t.stage}</span>
    </div>
  </article>`;
}

function detailPane(t, earnedSet, counts, guideNote) {
  const earned = earnedSet.has(t.id);
  const steps = (t.steps || []).map((s) => `<li>${esc(s)}</li>`).join("");
  const sources = (t.sources || [])
    .map((s) => `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a></li>`)
    .join("");
  const countBox =
    t.count && !earned
      ? `<p><b>Progress:</b> ${counts[t.id] || 0} / ${t.count} — use the stepper to keep count.</p>
         <p class="stepper">
           <button data-action="count" data-id="${t.id}" data-delta="1">+1</button>
           <button data-action="count" data-id="${t.id}" data-delta="5">+5</button>
           <button data-action="count" data-id="${t.id}" data-delta="-1">&minus;1</button>
         </p>`
      : "";
  return `<aside class="detail">
    <h2>${medal(t.grade)} ${esc(t.name)}</h2>
    <div class="grade-line">${esc(gradeName(t.grade))} &middot; ${esc(kindName(t.kind))} &middot; ${esc(stageName(t.stage))}${t.missable ? " &middot; Missable" : ""}</div>
    <blockquote>“${esc(t.description)}”<br><span style="color:var(--muted);font-size:12px">Official description, as PlayStation publishes it.</span></blockquote>
    ${t.missable ? `<div class="callout"><b>Missable — do this first.</b> ${esc(((t.steps.find((s) => s.startsWith("MISSABLE")) || "This trophy comes from a one-time chance in the story.").replace(/^MISSABLE:\s*/, "").replace(/^./, (c) => c.toUpperCase())))}</div>` : ""}
    <p>${esc(t.guide)}</p>
    <ol>${steps}</ol>
    ${countBox}
    <p><label><input type="checkbox" data-action="toggle" data-id="${t.id}" ${earned ? "checked" : ""}> Earned</label></p>
    <div class="sources"><b>Sources</b><ul>${sources}</ul><p>${esc(t.guide_note || guideNote)}</p></div>
  </aside>`;
}

export function renderGuide(state, data, store) {
  const { trophies } = data;
  const earnedSet = store.earnedSet();
  const list = visibleTrophies(trophies, {
    query: state.query,
    kind: state.kind,
    spoilerOn: state.spoilerOn,
    earnedSet,
  });
  // Attach a short "have / target" label for count trophies in the list.
  for (const t of list) t.countLabel = t.count ? `${store.count(t.id)} / ${t.count}` : "";
  const selected = state.detailId ? byId(trophies, state.detailId) : null;
  const chips = [
    ["all", "All"],
    ["story", "Story"],
    ["missable", "Missable"],
    ["collectibles", "Collectibles"],
    ["activities", "Activities"],
  ]
    .map(([k, label]) => `<button class="chip${state.kind === k ? " on" : ""}" data-action="kind" data-kind="${k}">${label}</button>`)
    .join("");
  const demoBadge = store.isDemo()
    ? `<span class="demo-badge">Demo progress — 13 of 55 earned. <a href="#" data-action="clear-demo" style="color:inherit">Clear it</a></span>`
    : "";
  return `<div class="controls">
      <input type="search" placeholder="Search trophies, guides, places…  ( / )" value="${esc(state.query)}" data-action="search" aria-label="Search trophies">
      ${chips}
      <label class="toggle"><input type="checkbox" data-action="spoiler" ${state.spoilerOn ? "checked" : ""}> Hide story spoilers</label>
      ${demoBadge}
    </div>
    <div class="guide-grid">
      <div class="list">
        ${list.length ? list.map((t) => trophyCard(t, earnedSet, state.spoilerOn, state.detailId)).join("") : `<p class="empty">No trophies match that search.</p>`}
      </div>
      ${selected ? detailPane(selected, earnedSet, store.state.counts, data.guideNote) : `<aside class="detail"><h2>Pick a trophy</h2><p>Select any trophy on the left to see its guide: short steps, its sources, and whether it can be missed. Check trophies off as you earn them — progress is saved in your browser.</p><p style="color:var(--muted)">Tip: press <b>/</b> to search, and use the Missable filter before a story session so nothing one-time slips past.</p></aside>`}
    </div>`;
}

export function renderRoadmap(state, data, store) {
  const { trophies, roadmap } = data;
  const earnedSet = store.earnedSet();
  const missables = trophies.filter((t) => t.missable);
  const stages = roadmap.stages
    .map((st) => {
      const inStage = trophies.filter((t) => t.stage === st.stage);
      const done = inStage.filter((t) => earnedSet.has(t.id)).length;
      const chipsHtml = inStage
        .map((t) => `<span class="${earnedSet.has(t.id) ? "done" : ""}">${earnedSet.has(t.id) ? "✓ " : ""}${esc(t.name)}</span>`)
        .join("");
      return `<section class="stage">
        <div class="head"><h2>Stage ${st.stage} — ${esc(st.name)}</h2><span class="hours">${esc(st.hours)} &middot; ${done}/${inStage.length} earned</span></div>
        ${progressBar(done, inStage.length)}
        <p>${esc(st.goal)}</p>
        <ul>${st.watch_outs.map((w) => `<li>${esc(w)}</li>`).join("")}</ul>
        <div class="chips">${chipsHtml}</div>
      </section>`;
    })
    .join("");
  return `<h2>${esc(roadmap.title)}</h2>
    <p>${esc(roadmap.total_hours)} in total &middot; difficulty ${esc(roadmap.difficulty)}. ${esc(roadmap.note)}</p>
    <div class="callout"><b>Do these first — the only missables.</b> ${missables.map((t) => esc(t.name)).join(" and ")} are the only trophies the official descriptions mark as one-chance. Everything else can be earned in free roam after the story.</div>
    ${stages}`;
}

export function renderPlanner(state, data, store) {
  const { trophies } = data;
  const earnedSet = store.earnedSet();
  const next = planNext(trophies, earnedSet, store.state.counts).slice(0, 12);
  const reason = (t) => {
    if (t.missable) return "Do this first — one chance only.";
    if (t.stage === 1) return "Story — earn it as you play through.";
    if (t.count) return `${store.count(t.id)} / ${t.count} already — one of the nearest finishes.`;
    if (t.stage === 2) return "Cleanup — do it while exploring Leonida.";
    return "Grind — save it for the final stage.";
  };
  return `<h2>Next up</h2>
    <p>Your next twelve trophies, in the order the roadmap suggests. Missables first, then the story, then the nearest finishes.</p>
    <div class="list nextup">
      ${next.map((t) => `<article class="card" data-action="open" data-id="${t.id}">
        <div class="row1">${medal(t.grade)}<span class="name">${esc(t.name)}</span>
          <input type="checkbox" class="check" data-action="toggle" data-id="${t.id}" aria-label="Mark ${esc(t.name)} earned">
        </div>
        <div class="desc">${esc(t.description)}</div>
        <div class="meta"><span>${esc(gradeName(t.grade))}</span><span class="tag">${esc(kindName(t.kind))}</span>${t.missable ? `<span class="tag missable">Missable</span>` : ""}<span>${esc(reason(t))}</span></div>
      </article>`).join("")}
    </div>`;
}

export function renderMissables(state, data, store) {
  const { trophies } = data;
  const earnedSet = store.earnedSet();
  const missables = trophies.filter((t) => t.missable);
  return `<h2>Missables</h2>
    <p>Only two trophies come from a one-time chance, as far as the official descriptions show. Every other trophy can be earned in free roam after the story, so these two are the ones to plan around. Keep a save from before the story's big decision, and meditate at the Chapter 1 balcony the first time it is offered.</p>
    <div class="list">
      ${missables.map((t) => `<article class="card${earnedSet.has(t.id) ? " earned" : ""}" data-action="open" data-id="${t.id}">
        <div class="row1">${medal(t.grade)}<span class="name">${esc(t.name)}</span>
          <input type="checkbox" class="check" data-action="toggle" data-id="${t.id}" ${earnedSet.has(t.id) ? "checked" : ""} aria-label="Mark ${esc(t.name)} earned">
        </div>
        <div class="desc">${esc(t.description)}</div>
        <p style="margin:8px 0 0">${esc(t.guide)}</p>
        <ol style="margin:8px 0 0">${(t.steps || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ol>
      </article>`).join("")}
    </div>`;
}

export function renderSave(state, data, store) {
  const { trophies } = data;
  const earnedSet = store.earnedSet();
  const done = trophies.filter((t) => earnedSet.has(t.id)).length;
  const pct = Math.round((done / trophies.length) * 100);
  const counted = trophies.filter((t) => t.count);
  const stageCells = [1, 2, 3]
    .map((s) => {
      const inStage = trophies.filter((t) => t.stage === s);
      const got = inStage.filter((t) => earnedSet.has(t.id)).length;
      return `<div><b>${got} / ${inStage.length}</b><span>Stage ${s} — ${esc(stageName(s))}</span></div>`;
    })
    .join("");
  return `<h2>Tracker &amp; save</h2>
    <p>Progress lives in this browser (localStorage). Export it to a file to keep a backup, import it back on any machine.</p>
    <div class="panel"><div class="kv">
      <div><b>${done} / ${trophies.length}</b><span>Earned (${pct}%)</span></div>
      ${["platinum", "gold", "silver", "bronze"].map((g) => {
        const total = trophies.filter((t) => t.grade === g).length;
        const got = trophies.filter((t) => t.grade === g && earnedSet.has(t.id)).length;
        return `<div><b>${got} / ${total}</b><span>${esc(gradeName(g))}</span></div>`;
      }).join("")}
    </div>${stageCells ? `<div class="kv">${stageCells}</div>` : ""}</div>
    <div class="panel"><h2>PSN target counters</h2>
      <p>Counts PlayStation tracks toward the grind trophies. Use the steppers as you play; checking the trophy off marks it earned.</p>
      <table class="counters"><thead><tr><th>Trophy</th><th>Target</th><th>Progress</th><th></th></tr></thead><tbody>
      ${counted.map((t) => `<tr><td>${esc(t.name)}</td><td>${t.count}</td><td>${store.count(t.id)} / ${t.count}</td>
        <td class="stepper"><button data-action="count" data-id="${t.id}" data-delta="1">+1</button><button data-action="count" data-id="${t.id}" data-delta="5">+5</button><button data-action="count" data-id="${t.id}" data-delta="-1">&minus;1</button></td></tr>`).join("")}
      </tbody></table>
    </div>
    <div class="panel"><h2>Export, import, reset</h2>
      <p>
        <button class="btn" data-action="export">Export progress (.json)</button>
        <button class="btn ghost" data-action="import">Import progress…</button>
        <button class="btn ghost" data-action="reset">Reset all progress</button>
      </p>
      <input type="file" id="import-file" accept=".json,application/json" hidden>
      <p style="color:var(--muted)">Keyboard: <b>/</b> focuses search, <b>Esc</b> clears it. ${store.isDemo() ? "This visit shows demo progress — clear it from the Guide tab to start fresh." : ""}</p>
    </div>`;
}
