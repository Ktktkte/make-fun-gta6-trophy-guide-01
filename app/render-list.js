// Trophy list rendering for the GTA VI guide: filterable checklist cards, each with
// its official name, description and grade, an own-words guide, its sources, and a
// spoiler mask for story trophies while spoiler mode is on.

const KIND_LABELS = {
  story: 'Story',
  missable: 'Missable',
  collectibles: 'Collectibles',
  activities: 'Activities',
  online: 'Online',
};

export function trophyMatchesFilters(trophy, state) {
  if (state.kind === 'missable' && !trophy.missable) return false;
  if (state.kind === 'online') return false;
  if (state.kind !== 'all' && state.kind !== 'missable' && trophy.kind !== state.kind) return false;
  if (state.grade !== 'all' && trophy.grade !== state.grade) return false;
  if (state.query) {
    const haystack = `${trophy.name} ${trophy.description} ${trophy.guide}`.toLowerCase();
    if (!haystack.includes(state.query.toLowerCase())) return false;
  }
  return true;
}

function spoilerMasked(trophy, state) {
  return state.spoiler && trophy.story && !state.earned.has(trophy.id);
}

function sourceLinks(sources) {
  const parts = [];
  for (const source of sources) {
    if (source.url) {
      const link = document.createElement('a');
      link.href = source.url;
      link.target = '_blank';
      link.rel = 'noopener';
      link.textContent = source.name;
      parts.push(link);
    } else {
      const span = document.createElement('span');
      span.textContent = source.name;
      parts.push(span);
    }
  }
  return parts;
}

export function buildTrophyCard(trophy, state, callbacks) {
  const card = document.createElement('article');
  card.className = `trophy-card grade-${trophy.grade}`;
  card.id = `trophy-${trophy.id}`;
  if (state.earned.has(trophy.id)) card.classList.add('earned');

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earned.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => callbacks.onToggleEarned(trophy.id, box.checked));
  head.append(box);

  const name = document.createElement('h3');
  name.className = 'trophy-name';
  name.textContent = spoilerMasked(trophy, state) ? 'Hidden story trophy' : trophy.name;
  head.append(name);

  const gradeBadge = document.createElement('span');
  gradeBadge.className = 'grade-badge';
  gradeBadge.textContent = trophy.grade;
  head.append(gradeBadge);

  const kindTag = document.createElement('span');
  kindTag.className = 'kind-tag';
  kindTag.textContent = KIND_LABELS[trophy.kind] ?? trophy.kind;
  head.append(kindTag);

  const stageTag = document.createElement('span');
  stageTag.className = 'stage-tag';
  stageTag.textContent = `Roadmap stage ${trophy.stage}`;
  head.append(stageTag);

  if (trophy.missable) {
    const missableTag = document.createElement('span');
    missableTag.className = 'missable-tag';
    missableTag.textContent = 'Possibly missable';
    head.append(missableTag);
  }
  card.append(head);

  const desc = document.createElement('p');
  desc.className = 'trophy-desc';
  desc.textContent = spoilerMasked(trophy, state)
    ? 'Hidden until earned — turn spoiler mode off to reveal it.'
    : `“${trophy.description}”`;
  card.append(desc);

  if (trophy.missable && trophy.missable_note) {
    const note = document.createElement('p');
    note.className = 'trophy-guide';
    const label = document.createElement('span');
    label.className = 'label';
    label.textContent = 'Missable warning: ';
    note.append(label, document.createTextNode(trophy.missable_note));
    card.append(note);
  }

  const guide = document.createElement('p');
  guide.className = 'trophy-guide';
  const guideLabel = document.createElement('span');
  guideLabel.className = 'label';
  guideLabel.textContent = 'Guide: ';
  guide.append(guideLabel);
  guide.append(
    document.createTextNode(
      spoilerMasked(trophy, state)
        ? 'Guide hidden — earn this trophy or turn spoiler mode off.'
        : trophy.guide,
    ),
  );
  card.append(guide);

  if (!spoilerMasked(trophy, state)) {
    const sources = document.createElement('p');
    sources.className = 'trophy-sources';
    sources.append(document.createTextNode('Source: '));
    const links = sourceLinks(trophy.sources);
    links.forEach((link, index) => {
      if (index > 0) sources.append(document.createTextNode(' · '));
      sources.append(link);
    });
    card.append(sources);
  }

  if (state.openId === trophy.id && !spoilerMasked(trophy, state)) {
    const steps = document.createElement('ol');
    steps.className = 'trophy-steps';
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    card.append(steps);
  }

  const actions = document.createElement('div');
  actions.className = 'trophy-actions';
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.textContent = state.openId === trophy.id ? 'Hide the steps' : 'Read the steps';
  toggle.addEventListener('click', () => callbacks.onToggleOpen(trophy.id));
  actions.append(toggle);
  const detail = document.createElement('a');
  detail.href = `#/trophy/${trophy.id}`;
  detail.textContent = 'Full guide →';
  actions.append(detail);
  card.append(actions);

  return card;
}

export function renderTrophyList(listElement, countElement, trophies, state, callbacks) {
  listElement.replaceChildren();
  if (state.kind === 'online') {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent =
      'There are 0 online trophies in GTA VI — every trophy is earned offline in single-player. Nothing to track here.';
    listElement.append(empty);
    countElement.textContent = 'Showing 0 of 55 trophies — no online trophies exist.';
    return;
  }
  const visible = trophies.filter((trophy) => trophyMatchesFilters(trophy, state));
  countElement.textContent =
    `Showing ${visible.length} of ${trophies.length} trophies · ` +
    `${state.earned.size} earned (${Math.round((state.earned.size / trophies.length) * 100)}%)`;
  if (visible.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind.';
    listElement.append(empty);
    return;
  }
  for (const trophy of visible) {
    listElement.append(buildTrophyCard(trophy, state, callbacks));
  }
}
