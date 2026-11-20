// Platinum roadmap rendering: the three stages to the platinum, the missable
// warning, the watch-outs, and the trophies that belong to each stage.

export function renderRoadmapView(viewElement, roadmap, trophies, state) {
  viewElement.replaceChildren();

  const intro = document.createElement('p');
  intro.textContent =
    `Platinum roadmap — difficulty ${roadmap.difficulty}, ${roadmap.hours}. ${roadmap.note}`;
  viewElement.append(intro);

  for (const stage of roadmap.stages) {
    const section = document.createElement('section');
    section.className = 'roadmap-stage';
    const heading = document.createElement('h2');
    heading.textContent = `Stage ${stage.n}: ${stage.title} `;
    const hours = document.createElement('span');
    hours.className = 'stage-hours';
    hours.textContent = `(${stage.hours})`;
    heading.append(hours);
    section.append(heading);

    const summary = document.createElement('p');
    summary.textContent = stage.summary;
    section.append(summary);

    const list = document.createElement('ul');
    for (const bullet of stage.bullets) {
      const item = document.createElement('li');
      item.textContent = bullet;
      list.append(item);
    }
    section.append(list);

    if (stage.missable_callout) {
      const callout = document.createElement('p');
      callout.className = 'roadmap-callout';
      callout.textContent = `⚠ ${stage.missable_callout}`;
      section.append(callout);
    }

    const stageTrophies = trophies.filter((trophy) => trophy.stage === stage.n);
    const trophyLine = document.createElement('p');
    trophyLine.className = 'roadmap-trophies';
    trophyLine.append(document.createTextNode(`Trophies in this stage (${stageTrophies.length}): `));
    stageTrophies.forEach((trophy, index) => {
      if (index > 0) trophyLine.append(document.createTextNode(', '));
      if (state.spoiler && trophy.story && !state.earned.has(trophy.id)) {
        const hidden = document.createElement('span');
        hidden.textContent = 'hidden story trophy';
        trophyLine.append(hidden);
      } else {
        const link = document.createElement('a');
        link.href = `#/trophy/${trophy.id}`;
        link.textContent = trophy.name;
        trophyLine.append(link);
      }
    });
    section.append(trophyLine);
    viewElement.append(section);
  }

  const warnings = document.createElement('div');
  warnings.className = 'warnings';
  for (const warning of roadmap.warnings) {
    const box = document.createElement('div');
    box.className = 'warning';
    const title = document.createElement('h3');
    title.textContent = warning.title;
    const text = document.createElement('p');
    text.textContent = warning.text;
    box.append(title, text);
    warnings.append(box);
  }
  viewElement.append(warnings);

  const sources = document.createElement('p');
  sources.className = 'roadmap-sources';
  sources.append(document.createTextNode('Roadmap sources: '));
  roadmap.sources.forEach((source, index) => {
    if (index > 0) sources.append(document.createTextNode(' · '));
    const link = document.createElement('a');
    link.href = source.url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = source.name;
    sources.append(link);
  });
  viewElement.append(sources);
}
