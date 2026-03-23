\# Payday Kingdom: Final Form — Codex Build Guide

How to prompt each phase of the Final Form build so Codex delivers clean, soulful, verifiable work every time.

\---

\#\# The Universal Formula

Every prompt you give Codex for this build should follow this skeleton:

\`\`\`  
north star → current state → one slice → constraints → proof of done  
\`\`\`

That means every prompt contains:

1\. \*\*North star\*\* — what should the player feel?  
2\. \*\*Current state\*\* — what exists right now?  
3\. \*\*One slice\*\* — what is the single thing we are adding or changing?  
4\. \*\*Constraints\*\* — what must NOT change, what libraries are off-limits, what rules apply?  
5\. \*\*Proof of done\*\* — what does "finished" look like? How do we verify?

If you skip any of these, the output gets vague. If you include all five, the output gets sharp.

\---

\#\# The Build Cycle (Use This Every Time)

For every slice within every phase, repeat this cycle:

\`\`\`  
1\. Explore    — "Inspect the current codebase and find the smallest clean insertion point."  
2\. Plan       — "Give me a short plan with risks before writing code."  
3\. Implement  — "Make the code changes directly."  
4\. Verify     — "Run npm run build and any relevant checks."  
5\. Review     — "What feels unfinished, risky, or emotionally off?"  
6\. Polish     — "Choose one specific improvement pass."  
\`\`\`

\*\*Why this works:\*\* Codex is strongest when it reads before writing, plans before building, and verifies before declaring victory. Skipping Explore leads to guesswork. Skipping Verify leads to broken builds. Skipping Review means you miss taste problems early.

\---

\#\# Sub-Agent Roles for Final Form

When a slice is complex, ask Codex to think through multiple lenses before implementing. These are the roles that matter for this project:

| Role | What It Catches |  
|------|----------------|  
| \*\*Systems designer\*\* | State shape errors, missing edge cases, store coupling |  
| \*\*Three.js performance guardian\*\* | Geometry leaks, per-frame allocations, draw call bloat |  
| \*\*Voxel art direction reviewer\*\* | Readability, silhouette clarity, palette discipline |  
| \*\*Game-feel polisher\*\* | Timing, pacing, animation easing, sound cue placement |  
| \*\*Bond engine reviewer\*\* | XP math balance, cycle pacing, expression budget violations |  
| \*\*Emotional guardrails reviewer\*\* | Guilt language, fake triumph, therapy cosplay, manipulation |  
| \*\*UI clarity critic\*\* | Input friction, drawer ergonomics, mobile touch targets |

\*\*How to invoke:\*\* Add one line to any prompt:

\> Think as systems designer, Three.js perf guardian, and emotional guardrails reviewer before implementing. Give me the top concern from each, then build.

\*\*Why this works:\*\* It forces Codex to audit its own plan before writing code. The concerns surface problems that would otherwise become bugs or taste failures after the fact.

\---

\#\# Phase-by-Phase Prompting Guide

\---

\#\#\# Phase 1 — Preserve \+ Evolve the Stage

\*\*What this is:\*\* Migration work. Replace the hackathon's 6 stores with the Final Form's 5-store architecture (profileStore, factStore, bondStore, worldStore, uiStore) without breaking the existing island scene, screenshot pipeline, or battle flow.

\*\*Why this phase needs careful prompting:\*\* Migration is where things silently break. The island scene reads from budgetStore and gameStore — if you swap stores without verifying every consumer, the 3D scene goes blank and you don't know why. Codex needs explicit "do not break" constraints.

\*\*Prompting strategy:\*\* One store at a time. Each store is its own slice. After each store migration, verify the full render pipeline still works.

\*\*Template:\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
Evolve the store architecture without losing anything that currently works.

Current state:  
The hackathon MVP has 6 Zustand stores (budgetStore, gameStore, kingdomStore,  
achievementStore, audioStore, sceneStore). The island scene in IslandScene.jsx  
reads from budgetStore and gameStore. The screenshot pipeline reads from  
sceneStore. All stores persist to localStorage.

Slice:  
Migrate \[budgetStore\] into the new \[factStore\] shape defined in  
PK\_FINAL\_FORM\_PRD.md. Update all consumers. Keep backward compatibility  
with existing localStorage data if possible.

Constraints:  
\- Do not touch IslandScene.jsx rendering logic  
\- Do not change the battle state machine flow  
\- Do not add new libraries  
\- All existing functionality must still work after migration  
\- Zustand \+ persist middleware pattern stays the same

Definition of done:  
\- New store shape matches the PRD data model  
\- All components that read from the old store now read from the new one  
\- \`npm run build\` passes  
\- Island scene renders correctly  
\- Payday battle still triggers and completes  
\- localStorage migration handles existing user data gracefully

Please:  
\- Inspect all consumers of the old store first  
\- List every file that imports from it  
\- Make the changes  
\- Run the build  
\- Tell me what still feels risky  
\`\`\`

\*\*Why this works:\*\* Migration is not creative work — it is precision work. The prompt is explicit about what must not break, which forces Codex to read all consumers before editing. The "list every file that imports" step prevents silent breakage.

\*\*Repeat for:\*\* each store migration (budgetStore → factStore, gameStore → worldStore partial, kingdomStore → profileStore, etc.)

\---

\#\#\# Phase 2 — Companion Presence

\*\*What this is:\*\* Adding a voxel companion character to the island scene with a Finite State Machine that cycles through idle behaviors based on time-of-day.

\*\*Why this phase needs careful prompting:\*\* This is where game feel lives or dies. A companion that just stands there is a prop. A companion that sweeps steps in the morning and reads by lantern at night feels alive. The FSM design matters more than the mesh.

\*\*Prompting strategy:\*\* Split into two slices — (1) the voxel model and placement, (2) the FSM and time-of-day behavior. Do not try to build both in one prompt. The model needs art direction review. The FSM needs systems design review.

\*\*Template (Slice 1 — Model):\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
The companion should feel like a warm, slightly toy-like friend who belongs  
on this island. Not a robot. Not a pet. A small capable person.

Current state:  
IslandScene.jsx renders the island, hero, monsters, and decorations.  
voxelBuilder.js has createCharacter() for the hero model. No companion  
exists yet.

Slice:  
Add a companion voxel model to the island scene. Place it in a default  
idle position near the tower/lighthouse. Use the existing voxelBuilder  
pattern — shared geometry, shared materials, procedural BoxGeometry only.

Constraints:  
\- Procedural geometry only, no external assets  
\- Reuse getSharedBoxGeometry and getSharedMaterial from voxelBuilder.js  
\- Companion should be visually distinct from the hero (different proportions,  
  no weapon, softer colors)  
\- Keep draw call count flat or better  
\- Do not change the hero model or battle flow

Definition of done:  
\- Companion visible on the island in a resting pose  
\- Visually distinct from the hero at a glance  
\- \`npm run build\` passes  
\- No new geometry leaks (verify shared caching is used)

Think as voxel art direction reviewer and Three.js perf guardian before  
implementing. Give me the top concern from each, then build.  
\`\`\`

\*\*Template (Slice 2 — FSM):\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
The companion should feel like it responds to the user's life rhythm —  
sweeping in the morning, reading at night, sharpening a sword before payday.  
It should never steal the spotlight.

Current state:  
The companion model exists on the island. It is in a static resting pose.  
No behavior system exists yet.

Slice:  
Build the companion Finite State Machine with 4-5 initial idle states:  
morning sweep, coffee sit, evening read, night sleep (with floating Z's),  
pre-payday weapon prep. Wire transitions to time-of-day using the user's  
local clock.

Constraints:  
\- FSM logic lives in a new companionFSM.js utility, not inside IslandScene.jsx  
\- State transitions should be clean and testable independent of Three.js  
\- Animation is procedural (position/rotation tweens), not skeletal  
\- No React state updates per frame — use Three.js refs for animation  
\- Delta-time-based animation, not frame-count

Definition of done:  
\- Companion cycles through states based on local time  
\- Each state has a visually distinct pose or small animation  
\- State transitions are smooth (no teleporting)  
\- FSM can be inspected: \`console.log(companionFSM.currentState)\` works  
\- \`npm run build\` passes  
\- No performance regression

Think as systems designer and game-feel polisher before implementing.  
\`\`\`

\*\*Why this works:\*\* Splitting model from behavior prevents the "giant blob" problem. The art direction sub-agent catches proportion/palette issues before they get baked in. The systems designer sub-agent catches FSM coupling issues before state becomes spaghetti.

\---

\#\#\# Phase 3 — Life Event Inputs (Fact Layer)

\*\*What this is:\*\* Building the bottom-drawer input panel where users enter bills, mark payday, check habits, add meetings, log milestones, and write weekly notes.

\*\*Why this phase needs careful prompting:\*\* Input UI is deceptively complex. Every input needs validation, persistence, and visual feedback. The drawer needs to feel fast and light on mobile. If the inputs feel clunky, users will never enter enough data for the Bond Engine to work.

\*\*Prompting strategy:\*\* One input type per slice. Start with the one that already exists (bills) and evolve it, then add new input types one at a time.

\*\*Template:\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
Entering life data should feel quick, light, and slightly rewarding — not  
like filling out a form. Each input is a small gift the user gives their  
companion.

Current state:  
KingdomPanel.jsx has bill entry and income setting. The factStore (or  
budgetStore if not yet migrated) persists bills. No habit, meeting,  
milestone, or weekly note inputs exist yet.

Slice:  
Add \[habit check-in\] input to the bottom drawer. A habit is a named daily  
boolean (did you do it today or not). The user can define up to 5 habits.  
Each check-in writes to factStore as a HabitEntry { id, date, habitKey,  
completed }.

Constraints:  
\- Mobile-first: 44px minimum touch targets  
\- Bottom drawer pattern, not a new page  
\- No new libraries for UI  
\- Tailwind CSS only for styling  
\- Data persists to localStorage via factStore  
\- Keep the drawer scannable — no walls of text

Definition of done:  
\- User can create a habit, name it, and check it off for today  
\- Check-in persists across refresh  
\- Drawer opens and closes smoothly  
\- Mobile layout is usable with one thumb  
\- \`npm run build\` passes

Think as UI clarity critic before implementing. What is the biggest friction  
risk in this input flow?  
\`\`\`

\*\*Why this works:\*\* Input design fails when you try to build all inputs at once — you get a cluttered drawer and inconsistent patterns. One input type per slice lets you nail the interaction pattern, then replicate it. The UI clarity critic catches friction before it ships.

\*\*Repeat for:\*\* meeting entry, milestone logging, weekly notes, payday marking.

\---

\#\#\# Phase 4 — The Tactile Climax (Smash Bills)

\*\*What this is:\*\* The JRPG-style "Smash Bills" battle overlay. Lighting shifts, bill monsters pace the horizon, a retro UI panel slides in, cursor becomes a pixel-art white glove, user clicks "Smash Bills," and the agent executes them with particle effects.

\*\*Why this phase needs careful prompting:\*\* This is the emotional peak of every payday cycle. If it feels flat, the whole game loses its reason to exist. This phase is 80% game feel and 20% systems. Prompt for feeling first, implementation second.

\*\*Prompting strategy:\*\* Define the target emotion before any code. Then build in layers: (1) lighting shift \+ monster staging, (2) JRPG UI overlay, (3) the click moment and execution animation, (4) aftermath and return to peace.

\*\*Template:\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
The payday battle should feel like the climax of an old JRPG: dramatic but  
playful, tense but cathartic. The user is the one who pulls the trigger.  
The release should feel earned and relieving, not stressful.

Current state:  
The existing battle flow in gameStore uses a state machine  
(idle → queued → animating → completing → idle). IslandScene.jsx handles  
the hero spawn, bill-defeat animations, XP rewards, and victory sequence.  
It works but feels more like an automated demo than a player-triggered  
climax.

Slice:  
Add the JRPG "Smash Bills" UI overlay. When payday is triggered:  
1\. Diorama lighting shifts (warmer, more dramatic shadows)  
2\. Bill monsters are staged on the horizon with slight idle animations  
3\. A retro UI panel slides in from the bottom with a "Smash Bills" command  
4\. User clicks the command to initiate the battle  
5\. Hero charges and executes bills with the existing animation system  
6\. After all bills are slain, world returns to peaceful lighting

Constraints:  
\- The user must click to initiate — never auto-trigger the actual battle  
\- Keep the existing battle state machine, extend it with a new "staged" state  
  before "queued"  
\- UI overlay is HTML/CSS positioned over the Three.js canvas, not rendered  
  in WebGL  
\- Pixel-art white-glove cursor via CSS cursor property  
\- No new libraries  
\- Mobile-friendly: the "Smash Bills" button must be a large, satisfying  
  tap target

Definition of done:  
\- Lighting visibly shifts when payday is staged  
\- Monsters are visible and idle-animated on the horizon  
\- UI panel slides in with "Smash Bills" command  
\- Clicking triggers the battle sequence  
\- After victory, lighting returns to normal  
\- The moment of clicking feels good — not rushed, not delayed  
\- \`npm run build\` passes

Think as game-feel polisher and voxel art direction reviewer.  
What is the single biggest risk to this moment feeling flat?  
\`\`\`

\*\*Why this works:\*\* The emotional target is named first ("dramatic but playful, tense but cathartic"). Without that, Codex will build a technically correct overlay that feels lifeless. The constraint "the user must click" is load-bearing — removing player agency kills the catharsis.

\---

\#\#\# Phase 5 — Bond Engine \+ Taste Layer

\*\*What this is:\*\* The Sentient Bond system: Bond XP earned by sharing personal info, 5 Bond Levels that gate expression range, 4-week diminishing returns cycle, and the Taste Layer input UI (mood pack, favorite symbols, encouragement style, faith mode, etc.).

\*\*Why this phase needs careful prompting:\*\* This is pure systems design. The math has to feel right — too fast and levels are meaningless, too slow and users never see personalization. The diminishing returns cycle is simultaneously a game mechanic, an emotional pacing tool, and a cost engineering mechanism. All three must work together.

\*\*Prompting strategy:\*\* Build the math engine first (no UI), verify the numbers feel right, then build the input UI. Never build the UI before the system is proven.

\*\*Template (Slice 1 — Math Engine):\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
The Bond Engine should make sharing personal info feel rewarding without  
feeling extractive. Each disclosure earns XP. Levels unlock richer  
expression. The 4-week cycle prevents monotony and controls LLM costs.

Current state:  
No bond system exists yet. The PRD defines Bond XP values per action type,  
5 Bond Levels with XP thresholds (0, 50, 150, 300, 500), and a 4-week  
cycle with multipliers (100%, 75%, 50%, 25%).

Slice:  
Implement bondMath.js in packages/core (or src/utils if monorepo isn't  
split yet). Pure functions, no UI, no store:  
\- calculateBondXP(action, currentMultiplier, isNewDomain) → xpEarned  
\- getBondLevel(totalXP) → { level, label, nextThreshold }  
\- getCycleMultiplier(cycleStartDate, now) → multiplier (1.0 to 0.25)  
\- shouldResetCycle(cycleStartDate, now) → boolean

Constraints:  
\- Pure functions with no side effects  
\- No store imports — this is domain logic only  
\- XP values and thresholds from the PRD, defined as constants  
\- All dates use ISO strings  
\- Must handle edge cases: brand new user (0 XP), max level user, cycle  
  boundary exactly on reset day

Definition of done:  
\- All four functions implemented with correct math per PRD  
\- Edge cases handled (zero state, max state, boundary)  
\- I can verify the math by reading the output of test-like calls you  
  describe  
\- \`npm run build\` passes

Think as systems designer and bond engine reviewer. Walk me through the  
math before implementing to confirm the numbers feel right.  
\`\`\`

\*\*Why this works:\*\* Building math separately from UI means you can verify the progression curve before any player ever sees it. The "walk me through the math before implementing" step catches balancing errors early. If the XP curve is wrong, the entire Bond system feels broken — fixing it after UI is built means rework.

\---

\#\#\# Phase 6 — Expression Engine \+ Asset Catalog

\*\*What this is:\*\* The curated voxel prop library (lanterns, banners, flowers, trophies, etc.) with named placement slots, and the Expression Engine that assembles context, calls the LLM (or falls back to templates), and outputs a JSON intent contract.

\*\*Why this phase needs careful prompting:\*\* This is the AI integration layer and the most architecturally complex phase. The LLM must act as Director (selecting from catalog), never as Creator (generating meshes). The template fallback must be good enough that the game feels complete with zero LLM calls.

\*\*Prompting strategy:\*\* Three slices in order: (1) asset catalog \+ placement slots, (2) template fallback system, (3) LLM intent generator. Build the non-AI parts first. The game must be fully playable before any LLM call exists.

\*\*Template (Slice 1 — Asset Catalog):\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
The asset catalog is a curated library of voxel props that feel handcrafted  
and meaningful. Each prop should have a clear silhouette and emotional  
register (warm, dignified, celebratory, quiet).

Current state:  
voxelBuilder.js has createMonster, createCharacter, createTree, createBuilding,  
createRocks. No decoration/prop system exists. No placement slot system exists.

Slice:  
Build the asset catalog: 15-20 voxel decoration functions covering the  
expression types from the PRD (lanterns, banners, flowers, trophies, coffee  
mugs, campfires, shields, plaques, books, birds, candles, benches, scrolls).  
Each function follows the voxelBuilder pattern (shared geometry, shared  
materials). Also define named placement slots on the island (dock\_post\_left,  
tower\_balcony, garden\_corner, study\_shelf, etc.) as a placement map.

Constraints:  
\- All procedural BoxGeometry, no external assets  
\- Reuse getSharedBoxGeometry and getSharedMaterial  
\- Each decoration must be removable (cleanup function that disposes from scene)  
\- Placement slots are fixed positions on the island grid  
\- Props must be small — decorations, not buildings  
\- Keep geometry count disciplined

Definition of done:  
\- 15-20 decoration builder functions exist in assetCatalog.js  
\- Placement slots defined as a map of { slotId → { x, y, z, rotation } }  
\- Each decoration can be placed at a slot and removed cleanly  
\- At least 3 decorations visible on the island simultaneously without  
  performance regression  
\- \`npm run build\` passes

Think as voxel art direction reviewer and Three.js perf guardian.  
Which decorations have the highest emotional value per geometry cost?  
\`\`\`

\*\*Why this works:\*\* Building the catalog before the LLM integration means the template fallback path works first. The "emotional value per geometry cost" question forces Codex to prioritize props that look meaningful over props that look complex.

\---

\#\#\# Phase 7 — Weekly Summary \+ Hard-Week Protocol

\*\*What this is:\*\* The weekly narrative generator with two paths (victory/tough), the Arecibo-structured 7-band shareable recap card, the hard-week dignified artifact placement, and the kingdom archive gallery.

\*\*Why this phase needs careful prompting:\*\* The emotional guardrails are load-bearing here. A weekly summary that reads like motivational spam will make users cringe and close the app. The hard-week protocol is where most products fail — they either guilt or patronize. This phase requires the emotional guardrails reviewer on every prompt.

\*\*Prompting strategy:\*\* Build the data-driven summary first (factual recap from factStore data), then add narrative layer, then build the Arecibo visual card, then implement the archive.

\*\*Template:\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
The weekly summary should feel like a short heroic dispatch — grounded in  
real facts, observant, concise, beautiful. On a tough week it should feel  
dignified and honest, never guilt-tripping or fake-triumphant.

Current state:  
factStore holds all weekly data (bills, habits, meetings, milestones, notes).  
The expression engine can generate intents. No weekly summary exists yet.

Slice:  
Build the weekly narrative generator with two paths:  
\- Victory path: highlight reel from facts, celebration artifact, optional  
  quote from approved source  
\- Tough path: name one real thing accomplished, place one dignified artifact,  
  respectful tone

The output is structured data that feeds into the recap card renderer.

Constraints:  
\- Narrative must reference specific facts from the Fact Layer — never invent  
\- Anti-cheese rule: never say the week was amazing when the facts say otherwise  
\- No therapy-speak, no guilt, no fake triumph  
\- Hard-week artifacts are specific: storm lantern, repaired banner, quiet  
  campfire, bench under tree, shield on wall, candle in tower window  
\- LLM generates narrative text when budget allows; template fallback produces  
  shorter but still factual summaries  
\- The Arecibo visual structure (7-band layout) is used for the shareable card  
  but section-to-category mapping is placeholder for now — do not finalize  
  those mappings

Definition of done:  
\- Victory path produces a 2-3 sentence summary referencing real facts  
\- Tough path produces a 1-2 sentence summary that feels dignified  
\- Template fallback works without LLM  
\- Summary data structure feeds cleanly into a card renderer  
\- \`npm run build\` passes

Think as emotional guardrails reviewer and game-feel polisher.  
Read the tough-week output aloud. Does it sound like something a human  
would feel respected by?  
\`\`\`

\*\*Why this works:\*\* The emotional guardrails reviewer is critical here. The "read it aloud" test is the real verification — if the tough-week summary sounds like a corporate wellness app, it fails. Naming the specific dignified artifacts prevents Codex from inventing participation trophies.

\---

\#\#\# Phase 8 — Achievement System

\*\*What this is:\*\* Achievement tiers (Bronze → Diamond) across finance, habits, business, and resilience categories. Permanent trophies placed in the world. Named titles. Achievement share cards.

\*\*Why this phase needs careful prompting:\*\* Achievement systems either feel meaningful or feel like checkbox spam. The difference is whether the presentation matches the weight of the accomplishment. A 30-day streak deserves a full celebration scene. A 3-day streak deserves a small trophy on a tile. Over-rewarding cheapens everything.

\*\*Prompting strategy:\*\* Define the tier thresholds and reward types as data first, then implement the unlock logic, then implement the visual rewards.

\*\*Template:\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
A trophy is not just a badge. It is an authored memory. Achievements should  
mix objective thresholds with tasteful presentation. The reward is not points.  
The reward is the way the world remembers it.

Current state:  
The hackathon has a basic achievementStore with 10 threshold-based achievements  
and toast notifications. The Final Form PRD defines 5 tiers (Bronze through  
Diamond) and 4 categories (finance, habits, business, resilience).

Slice:  
Implement the achievement tier system:  
\- Define all achievement rules as data in achievementRules.js  
  (threshold, category, tier, reward type)  
\- Unlock logic checks factStore \+ bondStore state after each user action  
\- Each tier maps to a specific visual reward scale:  
  Bronze \= small trophy, Silver \= trophy \+ banner, Gold \= trophy \+ banner \+  
  crowd, Platinum \= full celebration scene, Diamond \= agent-designed unique  
\- Named titles earned at Gold+ ("The Relentless", "The Unbowed", etc.)

Constraints:  
\- Achievement definitions are data, not code — easy to add new ones  
\- Unlock check is a pure function: (achievements, currentState) → newUnlocks  
\- Resilience achievements (survived rough week, maintained anchor habit)  
  must never feel patronizing  
\- Do not auto-generate titles — curate them manually  
\- Reuse existing toast notification pattern for unlock announcements

Definition of done:  
\- Achievement rules defined as structured data covering all 4 categories  
\- Unlock function correctly identifies new achievements from current state  
\- At least 3 tiers working end-to-end (definition → unlock → toast → world  
  object placed)  
\- Named titles display correctly  
\- \`npm run build\` passes

Think as systems designer and emotional guardrails reviewer.  
Are any resilience achievements at risk of feeling like a participation  
trophy?  
\`\`\`

\*\*Why this works:\*\* The "achievements as data, not code" constraint prevents hardcoded spaghetti. The emotional guardrails check on resilience achievements catches the most common failure: rewarding failure in a way that feels condescending instead of dignified.

\---

\#\#\# Phase 9 — Open-Source Packaging

\*\*What this is:\*\* Split the codebase into a monorepo with clean package boundaries. Document the Expression JSON contract, asset catalog extension guide, and adapter pattern. Write CONTRIBUTING.md.

\*\*Why this phase needs careful prompting:\*\* Monorepo restructuring is high-risk refactoring. Every import path changes. Every build config needs updating. One wrong path and the whole app breaks. This phase is 100% precision work.

\*\*Prompting strategy:\*\* One package extraction at a time. Extract, verify the app still builds, then extract the next. Never move two packages in the same prompt.

\*\*Template:\*\*

\`\`\`md  
We are building Payday Kingdom Final Form.

North star:  
A developer who has never seen this codebase should be able to read the  
README, understand the architecture, and add a new decoration to the asset  
catalog within 30 minutes.

Current state:  
All code lives in a flat src/ directory. The target monorepo structure has  
apps/web/ and packages/core, expression, scene, content.

Slice:  
Extract \[packages/core\] from the current src/. This package should contain:  
\- All type definitions / data model interfaces  
\- bondMath.js  
\- achievementRules.js  
\- Any pure domain logic with no React or Three.js imports

Constraints:  
\- apps/web imports from packages/core, never the reverse  
\- No circular dependencies  
\- The app must still build and run after extraction  
\- Keep the same Zustand store pattern (stores stay in apps/web, they import  
  domain logic from packages/core)  
\- Use simple relative imports or workspace aliases — no complex bundler config

Definition of done:  
\- packages/core/ exists with clean exports  
\- apps/web/ imports from packages/core  
\- \`npm run build\` passes from apps/web  
\- \`npm run dev\` still works  
\- No circular dependency warnings  
\- A new developer could read packages/core in isolation and understand the  
  domain model

Think as systems designer. What is the riskiest import to move?  
\`\`\`

\*\*Why this works:\*\* One package at a time prevents the "everything is broken and I don't know which move broke it" problem. The "riskiest import" question forces Codex to identify the highest-coupling dependency before moving anything.

\---

\#\# The Recyclable Checklist

After every slice in every phase, run this before moving on:

\`\`\`  
□ npm run build passes  
□ The thing I just built is visible / testable in the browser  
□ No console errors  
□ Mobile layout still works  
□ Existing features still work (quick smoke test)  
□ I understand what changed and why  
□ I know what the next slice is  
\`\`\`

If any box is unchecked, fix it before starting the next slice. Momentum built on broken foundations is not momentum — it is debt.

\---

\#\# The Emotional Guardrails Check (Phases 5-8)

For any phase involving the Bond Engine, Expression Engine, weekly summaries, or achievements, add this to your prompt:

\> Before finalizing, review the output through the emotional guardrails from  
\> the PRD. Does this output: guilt the user? fake triumph? act like a therapist?  
\> pressure dependency? overpraise? If yes, revise until it passes.

This is not optional polish. This is a core product requirement. The whole point of Payday Kingdom is that it treats humans with dignity. If the AI output fails this check, it ships broken regardless of whether the code compiles.

\---

\#\# Quick-Reference Prompt Starters

Copy-paste these and fill in the brackets:

\*\*Feature slice:\*\*  
\`\`\`  
We are building Payday Kingdom Final Form. Inspect the current codebase  
and find the smallest clean way to add \[feature\]. Keep scope tight.  
Implement it, run npm run build, and tell me any risks.  
\`\`\`

\*\*Feel upgrade:\*\*  
\`\`\`  
This part works mechanically but not emotionally: \[moment\]. Give it more  
\[relief / warmth / tenderness / toy-like punch\] without adding heavy scope.  
Make the changes, verify them, and summarize the tradeoffs.  
\`\`\`

\*\*Systems review:\*\*  
\`\`\`  
Think as \[role 1\], \[role 2\], and \[role 3\] for this feature. Give me the  
top concern from each, then synthesize one implementation plan.  
\`\`\`

\*\*Guardrails check:\*\*  
\`\`\`  
Review this output through the emotional guardrails. Read the tough-week  
path aloud. Does it sound like something a human would feel respected by?  
If not, revise.  
\`\`\`

\*\*Migration safety:\*\*  
\`\`\`  
Before changing \[store/module\], list every file that imports from it.  
Then make the changes, run the build, and verify nothing broke silently.  
\`\`\`

\---

\*"North star → current state → one slice → constraints → proof of done. That formula beats giant vague prompts almost every time."\*  
