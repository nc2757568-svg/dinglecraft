# Project status (fork work in progress)

Last updated: 2026-11-22, game version **7.0** (label "Release 1.0", not released yet). Read this with [CLAUDE.md](CLAUDE.md)
before resuming. Everything below says whether it was **implemented and tested**, **implemented but only partly verified**,
or only **proposed**.

## Where the work lives

| what | value |
|---|---|
| repository | the fork `nc2757568-svg/dinglecraft` (never push to the upstream project) |
| working branch | `claude/clever-volta-osn95d` (tracks `origin/claude/clever-volta-osn95d`) |
| pull request | #1 into the fork's `main`: "fix: iPhone title buttons and touch controls (v7.0, a Release 1.0 cut)" |
| CI | `.github/workflows/ci.yml`, enabled on the fork; push runs on this branch were green at `c7b4d07` (all 10 jobs) |
| version | `GAME_VERSION` 7.0 (bumped from the shipped 6.9); `npm run release` has **not** been run, so 7.0 is not frozen |
| play file | `npm run build` writes `dist/dinglecraft_v7.0.html` (~42.5 MB). The repo-root `DINGLECRAFT.html` is still the 6.9 release |

Another branch exists on the fork, `chatgpt/catastrophe-creatures-v7-1`, made outside this work. Its CI fails `og_trace`
(15 digest mismatches: its new creatures add meshes, materials and random-number calls to the original game's recorded
sessions) and `gate repo` (a commit author address that is not a noreply one). It has not been touched here.

## Implemented and tested

Committed (pushed):

1. **Title boot gate** (`#title.tboot`, `html/dom/title.html`, `html/css/core.css`, dropped by `tmBoot` in
   `src/ui/p07g_title.js`): the menu buttons are hidden behind "Loading DINGLECRAFT…" until the script has wired them;
   a slow-load and file-preview hint after 12 s; a `<noscript>` note. Cause it fixes: the 42.5 MB page paints its title
   long before its script runs, so the buttons looked live and did nothing (reproduced in WebKitGTK 2.52 at 2 MB/s).
2. **Boot watchdog** (`<script id="tbootjs">` in `html/99_scripts.html`): an error before the menu is wired is shown on the
   title with Try again; a WebGL refusal gets its own message. Cause: `boot()` creates the WebGL renderer before wiring the
   menus, so a refusal (iOS Lockdown Mode, low memory) left a normal-looking title with dead buttons.
3. **HUD on narrow windows** (`uiCaps` in `src/ui/p06e_ui_scale.js`): below 526 px wide the HUD scales down so all nine
   hotbar slots fit (0.7 at 390 px); the XP and armour badges move above the hearts row (`html/css/features.css`).
4. **Touch controls in the safe area** (an `@supports` block in `html/css/core.css`).
5. **iOS audio after a call**: `audio()` resumes an `interrupted` AudioContext; `touchend` also kicks audio.
6. Docs: LANDMINES, QA (phone rig, SwiftShader note), ARCHITECTURE, TESTING (counts, fork CI email note), README phone note.

Tests for 1-5: `tests/ui/u_touch.js` (38 checks, quick tier) with `tests/lib/stubs_T.js`; the muted phone rig
`tools/qa/ui/mobile_qa.mjs` (33 checks: 33/33 on 7.0, 26/31 on 6.9 as the control); `boot_check.mjs` 15/15; the full
`npm run gate` was green at the 7.0 commit (3,783 checks).

Implemented in this session, **not yet committed when this file was written** (the commit that adds this file carries them):

7. **Shotgun pellets and rapid fire vs the hurt window** (`hurtMob` in `src/entities/p05d_mobs.js`, `updateBullet` in
   `src/features/p08_torches_weapons_vehicles_music.js`): bullets set `HIT_PIERCE` and land inside the 0.25 s window;
   knockback and the hit sound stay once per window; melee is unchanged. Measured before: a point-blank blast 2.4 damage
   (1 of 8 pellets), 10 SMG shots 12 damage. After: 19.2, and the full stream.
8. **Mining re-rates on a tool switch** (`doMine` in `src/core/p04d_player_update.js`): measured before: fist then
   pickaxe took 188 frames (fist pace), pickaxe then fist finished at pickaxe pace (10 frames). After: both correct.
9. **Click latch** (`mbDown`/`mbUp`/`mbFrameEnd` in `src/ui/p06b_input.js`, called from `frame()`): a press and release
   between two frames still acts once. Found when a browser rig's quick clicks never landed a sword hit.
10. **Touch long press uses food and bows** (`touchHoldKey` in `src/ui/p06c_touch.js`): before, a phone could not eat (eating
    needs the right button held; touch only had a 60 ms tap) or draw a bow. Found by reading the code; the fix is tested in
    `u_play.js`, not yet on a touch device.

Tests for 7-10: `tests/ui/u_play.js` (12 checks, core group; registered in `tests/gate.json`). After 7-8, the frozen core
quartet (test 69, smoke 220, botsmoke 199) and all four `og_trace` sessions still passed: none of the recordings fires a gun.

## Browser rigs and what they showed

- `tools/qa/ui/play_qa.mjs` (new, desktop survival loop with real keys, mouse and clicks): last run **25 passed, 1 failed**.
  Passing: title to world, walk, sprint, sneak, jump, mouse look, walls, mining + pickup, crafting planks in the 2x2 grid
  by clicking, sword combat, shotgun, death screen + Respawn click, Nether there and back, tornado + dragon, Esc pause,
  Save, Save & Quit, reload from Saved Worlds with the placed block and inventory, zero console errors. **Failing:** "a right
  click places the held dirt" (it passed one run earlier; the latest rig change walks the player forward before placing, so the
  likely cause is the rig aiming at its own feet. Not yet confirmed: see open items).
- Found and rejected as rig mistakes, not game bugs: the drop pickup magnet is 2.0 m by design; the rig's test pad dropped the
  player before the floor loaded (fall damage that looked like Nether damage); death drops the inventory with Keep Inventory off.

## Open items, in priority order

1. Confirm or fix the dirt-placing failure in `play_qa.mjs` (aim at a floor cell 2 m ahead, not at the feet), then rerun.
2. Run `npm test` and `npm run gate` after items 7-10, commit, push, and check CI.
3. Phone matrix in real WebKit (WebKitGTK MiniBrowser over WebKitWebDriver; Playwright WebKit is not installed here) and Chrome
   emulation: small iPhone, modern iPhone, iPad, portrait and landscape; multi-touch (joystick + look together), orientation
   change, menus scrolling.
4. Performance: `play_qa.mjs` records the JavaScript cost of a frame per phase (renderer draw excluded) in its summary.json.
   Leads to check: ~88 ms per frame while the inventory is open (9 samples), 100-370 ms spikes around teleports (chunk
   meshing). Measured on SwiftShader in a container, not real hardware.
5. Memory: WebKit's web process grows ~450 MB loading the title (224 MB blank to 676 MB). Most of the 42.5 MB file is the
   embedded Hyperreal art (`hrassets.js`, 36.8 MB) in the same script element as the game. Proposed (not tried): measure a
   build with the art in its own ASCII-only script element (8-bit strings in WebKit). It changes the build layout, so it needs
   the owner's agreement.
6. Proposed, not started: per-world game rules need a right click (unreachable on touch); the 572 px inventory scrolls
   sideways on a phone held upright.
7. Owner decisions: `npm run release` for 7.0 (freezes its bytes, replaces `DINGLECRAFT.html`) and the git tags, after a try
   on a real iPhone.

## Not verified anywhere

No real iPhone or iPad was available. Tested stand-ins: WebKitGTK 2.52 (same engine family as Safari, desktop) and Chrome's
iPhone emulation (touch, DPR 3, safe-area insets). Not covered: iOS memory limits, Lockdown Mode, Safari gestures, file
previews, audio on a device.

## Environment notes for the next session

- GitHub: git push/fetch works. In the last session the GitHub connector returned 404 on every pull-request call (Actions
  calls worked); the fix is reconnecting GitHub at claude.ai/connect-github and checking the Claude GitHub App has
  pull-request access on the fork.
- Commits: the repo-local identity is `Claude <noreply@dinglecraft.invalid>` (the project's placeholder) and
  `commit.gpgsign=false` for this checkout (the history scan refuses signature headers). Commit with `TZ=UTC0`.
- Never leave scratch git refs (for example a fetched `refs/pull/*/merge`) in the checkout: `r_privacy.js` scans every local
  ref and a GitHub merge commit carries the account's e-mail.
- Browsers here have no GPU: point `CHROME` at a wrapper that adds `--use-angle=swiftshader --enable-unsafe-swiftshader`
  (docs/QA.md). WebKitGTK: `apt-get install webkit2gtk-driver` plus Xvfb.
- No paid API is needed for any of this; the brain self-test needs `npm ci --prefix brain` (free, offline).
