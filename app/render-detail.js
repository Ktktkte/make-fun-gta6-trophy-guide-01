// Single-trophy detail rendering: the full guide, its numbered steps, its sources,
// the missable warning, and previous / next navigation through the list.

export function renderTrophyDetail(detailElement, trophy, trophies, state, callbacks) {
  detailElement.replaceChildren();
  const masked = state.spoiler && trophy.story && !state.earned.has(trophy.id);

  const card = document.createElement('article');
  card.className = `detail-card trophy-card grade-${trophy.grade}`;

  const heading = document.createElement('h2');
  heading.textContent = masked ? 'Hidden story trophy' : trophy.name;
  card.append(heading);

  const meta = document.createElement('p');
  meta.className = 'trophy-desc';
  meta.textContent = masked
    ? 'Hidden until earned — turn spoiler mode off to reveal it.'
    : `“${trophy.description}” — ${trophy.grade}, roadmap stage ${trophy.stage}.`;
  card.append(meta);

  if (trophy.missable && trophy.missable_note) {
    const warning = document.createElement('p');
    warning.className = 'roadmap-callout';
    warning.textContent = `⚠ ${trophy.missable_note}`;
    card.append(warning);
  }

  const guide = document.createElement('p');
  guide.className = 'trophy-guide';
  const guideLabel = document.createElement('span');
  guideLabel.className = 'label';
  guideLabel.textContent = 'Guide: ';
  guide.append(guideLabel);
  guide.append(
    document.createTextNode(
      masked ? 'Guide hidden — earn this trophy or turn spoiler mode off.' : trophy.guide,
    ),
  );
  card.append(guide);

  if (!masked) {
    const steps = document.createElement('ol');
    steps.className = 'trophy-steps';
    for (const step of trophy.steps) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    card.append(steps);

    const sources = document.createElement('p');
    sources.className = 'trophy-sources';
    sources.append(document.createTextNode('Sources: '));
    trophy.sources.forEach((source, index) => {
      if (index > 0) sources.append(document.createTextNode(' · '));
      if (source.url) {
        const link = document.createElement('a');
        link.href = source.url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = source.name;
        sources.append(link);
      } else {
        const span = document.createElement('span');
        span.textContent = source.name;
        sources.append(span);
      }
    });
    card.append(sources);
  }

  const earnedRow = document.createElement('p');
  earnedRow.className = 'trophy-guide';
  const earnedBox = document.createElement('input');
  earnedBox.type = 'checkbox';
  earnedBox.checked = state.earned.has(trophy.id);
  earnedBox.addEventListener('change', () => callbacks.onToggleEarned(trophy.id, earnedBox.checked));
  earnedRow.append(earnedBox, document.createTextNode(' Mark as earned'));
  card.append(earnedRow);

  detailElement.append(card);

  const nav = document.createElement('div');
  nav.className = 'detail-nav';
  const index = trophies.findIndex((entry) => entry.id === trophy.id);
  const back = document.createElement('a');
  back.href = '#/';
  back.textContent = '← Back to the guide';
  nav.append(back);
  const neighbours = document.createElement('span');
  if (index > 0) {
    const prev = document.createElement('a');
    prev.href = `#/trophy/${trophies[index - 1].id}`;
    prev.textContent = `← ${trophies[index - 1].name}`;
    neighbours.append(prev);
  }
  if (index > 0 && index < trophies.length - 1) neighbours.append(document.createTextNode(' · '));
  if (index < trophies.length - 1) {
    const next = document.createElement('a');
    next.href = `#/trophy/${trophies[index + 1].id}`;
    next.textContent = `${trophies[index + 1].name} →`;
    neighbours.append(next);
  }
  nav.append(neighbours);
  detailElement.append(nav);
}
