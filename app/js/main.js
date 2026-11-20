// Boot and routing: hash routes (#/guide, #/guide/<id>, #/roadmap, #/planner,
// #/missables, #/save). All state lives here; every change re-renders the view.
import { loadData } from "./data.js";
import { store } from "./store.js";
import {
  renderGuide,
  renderMissables,
  renderPlanner,
  renderProgress,
  renderRoadmap,
  renderSave,
  renderTabs,
} from "./views.js";

const viewEl = document.getElementById("view");
const tabsEl = document.getElementById("tabs");
const progressEl = document.getElementById("progress");

const state = {
  route: "guide",
  detailId: null,
  query: "",
  kind: "all",
  spoilerOn: true,
};

function parseHash() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [route, arg] = raw.split("/");
  const known = ["guide", "roadmap", "planner", "missables", "save"];
  state.route = known.includes(route) ? route : "guide";
  state.detailId = state.route === "guide" && arg ? Number(arg) || null : null;
}

function render(data) {
  const earnedSet = store.earnedSet();
  progressEl.innerHTML = renderProgress(data.trophies, earnedSet);
  tabsEl.innerHTML = renderTabs(state.route);
  const pages = {
    guide: renderGuide,
    roadmap: renderRoadmap,
    planner: renderPlanner,
    missables: renderMissables,
    save: renderSave,
  };
  viewEl.innerHTML = pages[state.route](state, data, store);
  const search = viewEl.querySelector('[data-action="search"]');
  if (search && state.query) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
  }
}

async function boot() {
  const params = new URLSearchParams(location.search);
  if (params.has("demo")) store.seedDemoIfFresh();
  const data = await loadData();
  parseHash();
  render(data);
  window.addEventListener("hashchange", () => {
    parseHash();
    render(data);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "/" && document.activeElement?.tagName !== "INPUT") {
      e.preventDefault();
      if (state.route !== "guide") location.hash = "#/guide";
      viewEl.querySelector('[data-action="search"]')?.focus();
    }
    if (e.key === "Escape") {
      state.query = "";
      render(data);
    }
  });
  viewEl.addEventListener("click", (e) => {
    const el = e.target.closest("[data-action]");
    if (!el) return;
    const action = el.dataset.action;
    const id = Number(el.dataset.id);
    if (action === "open") {
      if (e.target.closest('input[type="checkbox"]')) return;
      location.hash = `#/guide/${id}`;
    } else if (action === "kind") {
      state.kind = el.dataset.kind;
      render(data);
    } else if (action === "count") {
      store.addCount(id, Number(el.dataset.delta));
      render(data);
    } else if (action === "export") {
      store.exportFile();
    } else if (action === "import") {
      document.getElementById("import-file")?.click();
    } else if (action === "reset") {
      if (window.confirm("Clear all earned trophies and counters?")) {
        store.clear();
        render(data);
      }
    } else if (action === "clear-demo") {
      e.preventDefault();
      store.clear();
      render(data);
    }
  });
  viewEl.addEventListener("change", (e) => {
    if (e.target.id === "import-file" && e.target.files?.length) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const n = store.importText(String(reader.result));
          window.alert(`Imported progress for ${n} trophies.`);
        } catch {
          window.alert("That file is not a progress export from this guide.");
        }
        render(data);
      };
      reader.readAsText(file);
      return;
    }
    const el = e.target.closest("[data-action]");
    if (!el) return;
    if (el.dataset.action === "toggle") {
      e.stopPropagation();
      store.toggle(Number(el.dataset.id));
      render(data);
    } else if (el.dataset.action === "spoiler") {
      state.spoilerOn = el.checked;
      render(data);
    }
  });
  viewEl.addEventListener("input", (e) => {
    const el = e.target.closest('[data-action="search"]');
    if (!el) return;
    state.query = el.value;
    // Re-render the list without losing the search box focus.
    const data2 = data;
    const earnedSet = store.earnedSet();
    progressEl.innerHTML = renderProgress(data2.trophies, earnedSet);
    tabsEl.innerHTML = renderTabs(state.route);
    const keepFocus = document.activeElement === el;
    viewEl.innerHTML = renderGuide(state, data2, store);
    if (keepFocus) {
      const again = viewEl.querySelector('[data-action="search"]');
      again.focus();
      again.setSelectionRange(again.value.length, again.value.length);
    }
  });
}

boot().catch((err) => {
  viewEl.innerHTML = `<p class="empty">The guide could not load its data (${err.message}). Check that data/trophies.json and data/roadmap.json are served with the app.</p>`;
});
