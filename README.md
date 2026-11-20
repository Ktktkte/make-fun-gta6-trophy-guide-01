# make-fun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a short guide in our own words with its source cited beside it, a three-stage platinum roadmap, missable flags, and a checklist that saves in the browser, exports, imports, filters by kind and grade, and hides story trophies in spoiler mode.

The headline facts, all checked against the published guides: 55 trophies (1 platinum, 2 gold, 6 silver, 46 bronze), 0 online trophies, about 200 hours to the platinum at difficulty 4/10, and only one trophy that may be missable — Positive Mental Attitude, the Chapter 1 balcony meditation with Lucia.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

The app is plain static files under `app/` — no build step, no network at run time. To hand it in:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Files

- `app/index.html`, `app/style.css` — the guide shell and its look
- `app/app.js` — bootstrap, routing, toolbar
- `app/render-list.js` — the filterable trophy checklist
- `app/render-roadmap.js` — the platinum roadmap view
- `app/render-detail.js` — one trophy's full guide
- `app/tracker.js` — saved progress, export / import, sample progress
- `app/data/trophies.json` — the 55 trophies with guides, steps, sources, kinds and roadmap stages
- `app/data/roadmap.json` — the three roadmap stages and the watch-outs
- `screenshots/` — four real renders of the app (the cover first)
- `main.ts` — copies `app/` and `screenshots/` to the output directory and writes `dossier.json`

## Sources

PowerPyx, GTABase, KeenGamer, Push Square, GTA Spotter, Mobalytics, games.gg, and the Exophase / PSNProfiles trophy list. Guides are written in our own words; trophy names, descriptions and grades are as PlayStation publishes them. Unofficial and not affiliated with Rockstar Games.

---

<sub>Entered on [make.fun](https://make.fun/?ref=md2m7pb0&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
