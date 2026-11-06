# Jutsu Clash: guide for Claude sessions

Jutsu Clash (術合戦, formerly "Ink Elements") is a cozy low-poly elemental tower defense **by Diego Danylov** (Yura's son). Credit Diego everywhere the game names an author. Yura (designer, writes Ukrainian or English) coordinates the work.

## Files

| Path | What |
|---|---|
| `src.html` | The whole game. Starts at `<title>Jutsu Clash</title>`, no doctype/html/head/body (the artifact platform adds its own skeleton). **Edit this file.** |
| `index.html` | Full page for Vercel (charset, `viewport-fit=cover`, meta). Generated: `bash tools/build-index.sh`. Never hand-edit. |
| `assets/jc_*.webp` | 56 images, referenced by relative path `assets/…`: screens (`title`, `meadow`, `sakura`, `snow`, `autumn` (Maple Temple cover, Google Flow "JC cover Maple Temple"), `shogun`, `victory`, `defeat`, 1024×572), painted ground `g_meadow/g_sakura/g_snow` (1376×768) and road strips `road_dirt/road_snow` (512², road runs top→bottom), tower cards `t_<type>` (512², cream ground, all 34 towers: 4 base, 10 fusions, 20 level 3; the level-3 cards were made in Google Flow, project "[game] Jutsu Clash", Nano Banana 2.1 1:1, prompts start with "JC3 <Name> tower"), enemy cards `e_<type>` (16:9, subject right) and ultimate cut-ins `u_meteor/u_tsunami/u_tornado` (16:9, empty left third). |
| `assets/video/jcv_*.mp4` + `.webp` | 5 Veo clips (854×480 H.264 + AAC, ~3.6 s, faststart) with first-frame posters: `meteor`, `tsunami`, `tornado` (ultimates), `shogun`, `ronin` (boss cut-ins). Full-frame scenes, subject centred. Plus `victory`, `defeat` (7.9 s, result-screen backdrops, fade in/out) and `e_grunt`, `e_runner`, `e_shield`, `e_brute`, `e_ninja` (3.6 s, new-enemy reveals; poster = a pose near the end). |
| `tools/` | `package.json`, `build-index.sh`, `build-test.sh`, `lib.js` + tests `boot.js`, `menus.js`, `run.js`, `mobile.js`, `level3.js`. |

## How src.html is organised

- `W×H = 1280×720` is **board space** (game logic, 3D projection, ultimate + boss cut-ins).
- The 2D overlay draws in **UI space** `VW×VH = W/US × H/US`. `US` (UI scale) grows on small stages so text and hit areas stay readable (Settings → UI size overrides it). Use `VW/VH` for all HUD/menu layout; `ptr.x/y`, `scr()`, `groundAt()` are in UI space.
- `K` is canvas px per board px; `CSSU` is CSS px per board px. `minT()` = the 44 CSS px touch minimum in UI units.
- **Every interactive control goes through `ctl(id,x,y,w,h,{act,disabled,sel,tip,dir,hud})`.** It registers the hit rect (grown to 44 CSS px on touch), and returns `{hov,foc,prs,dis,sel,k,on}`. `button()`, `seg()`, `hudIcon()`, `lobbyButton()`, map/codex cards and radial items are built on it. Draw focus with `focusRing()` / `focusRingC()`; disabled with tone fill + `screentone()`.
- Activation happens on **pointer release over the same control** (pressed state while held). Keyboard/pad `confirm` sets `press` for a short pressed flash.
- Screens: `intro` (key art) → `title` (3D lobby) → `maps` / `codex` / `help` / `settings` (sheets over the lobby) → `play` (+ `paused` with `pauseView` `main|settings`, `G.result`). Change screens with `go(fn,{soft})` (curtain/fade), never by hard assignment from UI code.
- Art: `ART[k]`, `artOk(k)`, `artA(k)` (fade-in alpha), `cover(k,x,y,w,h,{zoom,fx,fy})`, `ART_HOOKS` (called when an image finishes loading). Every art use has a drawn fallback. `towerArtCard(type,…,{sil})` draws a tower card (or its keyed-out silhouette via `towerSil`); `ART_SHIFT` moves 16:9 art right when the subject sits mid-frame.
- Painted level: `paintMap(M)` swaps the board to the theme's ground texture (multi-scale blend in `onBeforeCompile`, `GTINT` colour correction) and adds `roadRibbon(M)`: a rounded spline through the path tile centres with feathered edges (`edgeTex`), pebbles/tufts. The logical grid and road tiles are unchanged; without the art the old checker board stays. Grid lines exist only around buildable tiles and fade in only in `gridMode()` (build menu, drag, fuse).
- Cut-ins: one queue (`queueCut`, `bossCut` = the active one, `kind` boss | enemy | fusion) that pauses the sim; `skipCut()` on any click/confirm. New-enemy reveals fire once per type (`save.seenEnemies`), new-fusion reveals on first discovery; ultimates use `cutin` + `drawCutin` with `u_*` art. Effects: `specialMesh`/`syncSpecial` (meteor + `shock` + `scorch`, curling `wave` with foam, `tornado` funnel + petal points).
- Video cut-ins: `VID`, `vidLoad(k)`, `vidTry(cut,k,isUlt)`, `vidTick`, `drawVidCut`. Ultimates and boss cut-ins attach a clip (`cut.vid.mode` wait → video | still); the poster shows while it starts, and if it isn't playing within 0.4 s (0.9 s for a mid-clip repeat) the still `jc_u_*`/boss-art cut-in runs instead. The cut-in clock follows the clip's `currentTime`; skip fades out in 0.3 s. Repeat ultimates in a session play a 1.8 s cut from 1.0 s. Audio plays at SFX volume when sound is on (muted retry if autoplay refuses). Preload: ultimate clips 1.2 s after a match starts, boss clips when the boss wave or the one before it is called. `vidAllowed()` is false under reduced motion, `QLOW` (so phones and low-end devices always use stills) and data-saver; `__jc.video(true|false)` forces it for tests.
- New-enemy reveal clips: an `enemy` cut-in calls `vidTry(c,'e_'+type)` (header NEW ENEMY, enemy accent and icon); same wait/still rules as the boss clips. Preload: `vidPreloadEnemies(n)` loads the clip of every not-yet-seen type in wave n, for the wave being called and the next one (and wave 1 at match start). Ronin and Shogun keep their boss clips.
- Result clips: `RV`, `resVidStart(k)`, `resVidTick`, `resVidStop`. `jcv_victory`/`jcv_defeat` start when the result backdrop appears (resultT 0.75 s), play once and hold 0.6 s before the end (before the fade-out); the result fade follows the clip's clock. Same fallback rules (0.4 s, reduced motion, QLOW, data-saver, error → `jc_victory`/`jc_defeat` stills). Preload: victory when wave 18+ is called, defeat when the shrine drops to 40. `state.resVid`/`resVidT`.
- Enemy portraits: `EFACE` (face crop per card), `enemyFace(t,sil)` caches 128 px crops, `enemyIcon(t,x,y,r,{seen,count,ring})` draws a round icon (gold ring for bosses, element ring on the boss bar, dark "?" when unseen, kanji medallion without art). Used by the next-wave preview under the wave button (`drawWavePreview`, `waveComp(n)` from `makeWave`; hover or tap an icon for the `EINFO` tip), the boss HP bar, the reveal cut-ins and the Bestiary. `state.preview` lists what it drew.
- Codex has three tabs (`codexTab` fus | tri | best): fusion cards, level-3 cards (`drawFusionGrid(cmp,n,TRIPLES,10)`) and a Bestiary (`BESTIARY`, `EINFO` tips). Counts: `fusCount()`, `triCount()` (both live in `save.codex`).
- Tower models: `TB` (an IIFE holding the procedural low-poly builders, same code as the prototype page https://claude.ai/artifact/9uMTXhHJVPgPniBZUErPzD) — `TB.build(type,tier)` → Group with `userData.anims` + `userData.h`. `towerTier(t)`: base and fusions 1 weapon (power 0), 2 reinforced (1–2), 3 tower (3–5), 4 upgraded (6+); level 3 towers 3 (0–2) and 4 (3+). `bakeTower()` samples the animations and merges every part that never moves into one mesh per material (few draw calls); `userData.dispose` frees it. `towerMesh` scales by `TOWER_SC`; the sync loop rebuilds a tower when its tier changes ("NEW FORM"/"MAX FORM" pop) and runs its anims each frame; `t.mh` (model height) feeds `handH()`. `TRIART`/`startTriArt()` render fallback cards from the models only if a level-3 card image fails to load.
- Level 3 fusions: `TRIPLES`, `TRIREC` (key = sorted 3 elements, `elKey`), `fuseResult(a,b)` (base+base → `RECIPES`, fusion+base either way → `TRIREC`, else null), `fuseDeny()` texts, `isTri/isFus2/isBaseT`. New attack kinds in `updateTower`: `storm` (falls from the sky on n random enemies in range: rain, meteor), `ray` (hits every enemy on the line: sun); flag `pierce` ignores armour (forge). Level 3 power-ups start at 160 gold (`upCost`).
- Maps: `MAPS[i]` has `path` (tile vertices, first = portal, last = shrine), optional `path2` (second portal's lane, ending on a vertex of `path` = merge; `trunkFrom(m)` builds its full route), `stones` (spirit-stone tiles: `STONE_DMG`/`STONE_RNG` via `t.stone`), `cam.pol` (home tilt). `mapRoad(m)` is the union of road tiles. Enemies carry their own route `e.P` (`G.P` or `G.P2`); targeting picks the smallest `e.P.L-e.d`. On two-lane maps packs of 3 alternate portals (bosses use the first) and gaps are ×0.85. Theme `autumn` borrows `g_meadow` through `THEMES.autumn.ground` (`groundKey()`) until it has its own painted ground; its map card uses `jc_autumn.webp`.
- Dioramas: **all 4 maps are compact terraced islands** (`area` + `lay` + `decor`, built by `buildDiorama`; the old flat board builder is only a fallback). `DIO[theme]` holds each island's look (grass, cliffs, road, petals/leaves/snow, flowers, water); decor kinds: round/tall/weep (sakura), maple, gold, green, yellow, pine, spine (snowy pine), windmill, house, snowman, lantern, boulder, bush, fence. Both lanes walk into stairs/bridges, each lane gets a torii portal, spirit stones sit on the terraces. The shrine is a cozy two-tier pagoda `skPagoda(theme)` (`PAGODA` colours per island; snow adds snow caps, icicles and a smoking chimney; sakura/autumn a torii), from Yura's Google Flow concepts "JC cozy pagoda <map>".
- Balance bot: `node bot.js [map…]` plays every map with the same greedy strategy (last run, compact islands: Meadow, Sakura and Snow won at 100, Maple lost on wave 20). `peek.js` / `peek4.js` shoot home views.
- Motion: check `RM` (reduced motion: system setting or Settings → Motion).
- Mobile: `resize()` letterboxes 16:9 inside the safe area; phones under 560 px short side go edge-to-edge (`body.compact`). Portrait phones get the `#rotate` overlay (auto-pauses a match). `QLOW` (small or low-end screens, or Settings → Graphics) lowers pixel ratio and shadow maps to 1024.
- Save key **`inkElements.v1` must not change** (keeps players' progress). New fields: `rm`, `ui`, `q`, `seenEnemies`.
- Debug handle `window.__jc`: `state`, `ui()`, `center(id)`, `tileClient(tx,ty)`, `freeTiles(n)`, `step(sec)`, `startMap(i)`, `skipToWave(n)`, `untilBoss()`, `win()`, `lose()`, `gold(v)`, `go(screen)`, `unlockAll()`, `instant()`, `reducedMotion(v)`, `untilCut(kind)`, `clearCuts()`, `seenAll()`, `ult(id,tx,ty)`, `snapCam()`, `video(v)`, `preloadVideos()`, `resetReveals()`; `state` also reports `cut`, `cutType`, `cutin`, `reveals`, `grid`, `gridOp`, `painted`, `codexTab`, `vid`, `vidKey`, `vidT`, `vidDur`, `vidState`. Legacy `window.TD` is still there.

## Workflow

```bash
# after editing src.html
bash tools/build-index.sh
cd tools && npm install && bash build-test.sh
node boot.js && node menus.js && node run.js && node mobile.js
```

Then **Read the screenshots in `tools/shots/`** and fix anything ugly before publishing. Chromium runs headless with SwiftShader (`lib.js` picks `/opt/pw-browsers/...` when present). Rendering is slow there (1–5 fps), so tests wait on frames, not timeouts. This Chromium build decodes H.264, so the video path is really tested (headless counts as low-end, so tests force video with `__jc.video(true)`); `lib.js`'s server supports Range requests for the clips.

## Publishing (only when Yura asks)

1. **Artifact:** republish to the SAME URL https://claude.ai/artifact/S7iHMaGiMrj1LSU99ujVcy with the Artifact tool: `file_path: src.html`, `url:` that link, and the images as supporting files, `files: {"assets/jc_title.webp": "assets/jc_title.webp", ...}` (all 56 `assets/jc_*.webp` **and** the 24 files in `assets/video/`, e.g. `"assets/video/jcv_meteor.mp4": "assets/video/jcv_meteor.mp4"`). Read the artifact first if this conversation hasn't.
2. **GitHub → Vercel:** commit on `main` and push to `github.com/ydanilov/game-jutsu-clash`; Vercel project `game-jutsu-clash` auto-deploys `index.html` + `assets/` to https://game-jutsu-clash.vercel.app. It is also listed on https://diego-games.vercel.app.

## Agreed design decisions (don't change without asking)

- 4 base elements (Fire, Water, Earth, Air). Water > Fire > Air > Earth > Water.
- Fusion of any two base towers by **dragging one onto another** (or the FUSE button). Free. 10 fusions, recorded in the Codex.
- **Level 3** (Yura, Nov 2026): a fusion + one base tower = one of 20 three-element towers (the three elements decide it, any path). Level 3 towers are final and have 2 looks (tower, upgraded).
- Towers are real towers, not stick-men: they grow with power-ups (weapon → reinforced → tower → upgraded) and look like their menu cards.
- Power-ups have no cap; each one costs more.
- Ultimates recharge on a **timer** (40 s), no hero. Meteor from the start; Tsunami and Tornado **unlock by clearing maps**.
- **4 maps × 20 waves**: Flower Meadow, Sakura Hills, Snow Village, Maple Temple. Waves start on a button with an early-send bonus.
- Spawn portals and the shrine must always be findable: the home view (`camFit`) fits the whole route, H / R3 returns to it, `drawEdgeMarks()` points at them when off screen.
- **Boss every 5 waves** (Ronin), Shogun on wave 20 (changes element, summons grunts), each with an anime cut-in.
- Look: golden-hour palette tokens on `:root`, cream panels with ink outline, Mochiy Pop One + M PLUS Rounded 1c, katakana SFX pops. Input: mouse, keyboard, DualShock 4, touch.
