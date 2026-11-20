# make-fun-gta6-trophy-guide-01
[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/Ktktkte/make-fun-gta6-trophy-guide-01/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline guide and tracker for all 55 PlayStation 5 trophies of Grand Theft Auto VI — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 of them hidden until earned, none of them online.

Every trophy is shown with its official name, description and grade exactly as PlayStation publishes it, plus a guide written in our own words, the steps to earn it, and a named, linked source beside it (mainly the GTABase trophy guide and the PowerPyx trophy guide & roadmap). Where those guides say the exact steps are not yet confirmed, this guide says so instead of inventing a location or a step.

The guide also gives a roadmap to the platinum in three stages — story first (60–80 hours), then the 100% checklist (about 100 hours), then character questlines, Strangers & Freaks and clean-up (about 10 hours) — and flags every missable or story-gated trophy with its reason. The honest headline: only one trophy can truly be missed — Positive Mental Attitude, a Chapter 1 meditation that is gone after Chapter 1. Everything else can be cleaned up in free roam after the story.

The tracker is a checklist that saves in the browser (localStorage) and can be exported to a file and imported back. It filters by story, missable & story-gated, collectibles, activities and online, has a search box, and a spoiler setting that hides the names and descriptions of hidden story trophies until they are earned.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. The app is static files under `app/` with no build step and no network at runtime — it works with the network off.

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This copies `app/` and `screenshots/` to the output folder and writes `dossier.json` there.

<sub>Entered on [make.fun](https://make.fun/?ref=kawan-ko&utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
