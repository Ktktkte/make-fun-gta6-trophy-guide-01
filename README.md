# make-fun-gta6-trophy-guide-01

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

Leonida Trophy Guide — an offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI. Every trophy carries the official name, description and grade as PlayStation publishes them, a short guide in our own words with numbered steps, and its sources (the official list on Exophase, PSNProfiles for the counts). The guide never claims a place the official descriptions do not pin down: where a location is not named, it says so.

What it does:

- Checklist tracker for all 55 trophies, saved in the browser, with export to a file and import back.
- Search and filters by kind (story, missable, collectibles, activities), plus a spoiler setting that hides story trophy names and descriptions until they are earned.
- A three-stage platinum roadmap (story first, Leonida cleanup, grind and platinum) with hour estimates and watch-outs, and a missables page for the only two one-chance trophies.
- A Next-up planner that orders the unearned trophies: missables first, then the story, then the nearest finishes.
- Progress counters for every PSN target the game tracks (250 stunts, 42 Shooting Range challenges, 100 WAiNK spots, and the rest), with steppers to keep count as you play.

The app is static files under `app/` with no build step and makes no network request at run time. Source links in the guides open only when the reader follows them.

## Run it

```sh
node serve.ts
# open http://localhost:8080 (app/ served at the root)
```

Hand the entry in (copies `app/` and `screenshots/` to the output directory and writes `dossier.json`):

```sh
MAKEFUN_OUTPUT_DIR=/tmp/out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=md2m7pb0&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
