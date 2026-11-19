# make-fun-gta6-trophy-guide-01
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden.

Every trophy shows its official name, description and grade exactly as PlayStation publishes them, plus a guide written in my own words that names its sources beside it. The guide gives a three-stage roadmap to the platinum (story, then the 100% completion checklist, then the character questlines and stragglers), flags the one trophy that can be missed — Positive Mental Attitude, whose Chapter 1 meditation disappears — and is honest where a trigger is still unconfirmed in launch week.

The tracker is a checklist saved in the browser (localStorage), with export to a file and import back, filters by kind (story, missable, collectibles, activities, online) and grade, a search box, and a spoiler setting that hides the names and descriptions of story trophies until you earn them. All 28 hidden trophies are flagged, and each card shows its roadmap stage.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. The app is plain static files under `app/` with no build step and no network use at runtime.

## How it is built

- `app/index.html` — the page: progress, facts, roadmap, checklist, sources.
- `app/app.js` — renders the list, filters, spoiler mode, localStorage progress, export/import.
- `app/style.css` — the look (system fonts only, no images).
- `app/data/trophies.json` — the 55 trophies with guides, sources, kinds, roadmap stages and flags.
- `main.ts` — copies `app/` and `screenshots/` to `/output` and writes `/output/dossier.json`.

<sub>Entered on [make.fun](https://make.fun/?ref=kawan-ko&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
