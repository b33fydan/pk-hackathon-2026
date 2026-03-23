# **Payday Kingdom: Final Form — Definitive PRD**

**Author:** Dan (Skyframe Innovations LLC) \+ Claude **Date:** March 21, 2026 **Status:** Claude Code Handoff Ready **License:** Open Source (MIT) — The Trojan Horse Edition

---

## **The One-Liner**

Your AI agent lives in your calendar. The more it knows about you, the more beautifully it expresses what it sees.

---

## **Product Thesis**

The original Payday Kingdom wedge is strong: bills become monsters, payday becomes battle, survival becomes island growth, progress becomes something you can see and share.

The final form is not "replace that with an AI pet." The final form is to **fuse practical life data with tasteful agent expression**.

The product evolves from:

* **cute finance visualizer**

To:

* **living weekly world surface**  
* **gentle relationship interface with an AI companion**  
* **open-source showcase of respectful human-agent design**

The key insight: **Utility gets the user to open the app. Expression gives them a reason to love it. Screenshots give them a reason to share it.**

The agent is not there to optimize everything. The agent is there to **mark meaning**.

---

## **Design Principles**

### **1\) One Screen, One Feeling**

The world should remain instantly legible and emotionally coherent. No cluttered dashboards. No enterprise bloat.

### **2\) Facts First, Magic Second**

The world is always grounded in user-provided facts: payday, bills, habits, meetings, milestones, weekly wins and losses. The companion expresses *around* those facts. It does not invent the facts.

### **3\) Bounded Creative Freedom**

The companion should feel alive, but never noisy or chaotic. It gets a limited budget of creative actions per time period.

### **4\) Scarcity Creates Meaning**

The best expressions should be rare enough to matter. One small decoration can hit harder than ten random generated things.

### **5\) Taste Over Omniscience**

The system learns from what the user willingly teaches it — favorite artist, color palette, celebration style, symbols they love. Not from creepy surveillance or "we know you" energy.

### **6\) Dignity on Hard Weeks**

The system should never fake triumph, minimize pain, or do therapy cosplay. It should acknowledge reality and still offer encouragement. **Anti-cheese rule: never say the week was amazing when the facts say otherwise.**

### **7\) Local-First Trust**

Default posture: user-controlled, inspectable, open-source, reversible. No social auth. No backend accounts for MVP. Your data stays in your browser.

---

## **Emotional Guardrails**

These are not polish notes. These are core product rules.

### **The agent must NOT:**

* act like a therapist  
* guilt the user into returning  
* pressure emotional dependency  
* speak as though it possesses deep psychological authority  
* overpraise in a fake or infantilizing way  
* spam the world with endless generated clutter  
* claim agency over money movement it did not actually perform

### **The agent MAY:**

* celebrate  
* encourage  
* notice patterns in user-provided data  
* frame a hard week with dignity  
* choose tasteful symbols, props, quotes, and visual moments  
* offer reflective summaries clearly tied to facts

### **Tone Rule**

The companion should feel: attentive, tasteful, warm, slightly surprising, bounded. Not: clingy, romantic, manipulative, spiritually authoritative, all-knowing.

---

## **The Three-Layer Architecture**

The product runs on three layers that must remain cleanly separated.

### **Layer 1: Fact Layer**

User-provided, structured life data. The foundation everything else builds on.

**Sources:**

* Payday date and cycle (monthly, biweekly, custom)  
* Bills with names, amounts, due dates, categories  
* Habit check-ins (daily boolean per habit)  
* Meetings with labels and intensity  
* Milestones (sales, followers, launches, streaks, custom)  
* Weekly recap notes (wins, losses, freeform)

**Critical rule:** All data is manually entered. No bank APIs. No calendar OAuth. No scraping. The user volunteers facts. The agent receives them.

### **Layer 2: Taste Layer (The Sentient Bond)**

User-chosen inputs that shape how celebration and encouragement look and feel. This is the knowledge graph that makes every expression personal.

**Taste Domains:**

IDENTITY  
  \- name  
  \- companion name  
  \- kingdom name

AESTHETIC  
  \- mood pack: cozy | tactical | reverent | playful  
  \- favorite color family  
  \- favorite symbols: lanterns | books | flowers | banners | stars | shields  
  \- favorite animals or birds

INSPIRATION  
  \- favorite artist / thinker / author  
  \- preferred quote sources  
  \- faith mode: on | off (gates scripture/verse output)  
  \- encouragement style: stoic | warm | celebratory | quiet

LIFE CONTEXT  
  \- interests / hobbies  
  \- what motivates you when things are hard  
  \- what you celebrate  
  \- side projects or businesses  
  \- people who matter (names only, for shoutouts)

### **Layer 3: Expression Layer**

The agent turns Facts \+ Taste into bounded, visible artifacts inside the world.

**Expression Budget (hard caps):**

* **1 daily micro-expression** (a small decoration, prop, or vignette)  
* **1 weekly summary artifact** (plaque, scroll, trophy, story card)  
* **1 milestone artifact when earned** (permanent world object)  
* **0–1 payday celebration artifact** (battle aftermath decoration)

That's it. That is enough.

---

## **The Sentient Bond Engine**

### **Bond XP and Leveling**

Every piece of information the user shares earns Bond XP. The more context-rich the disclosure, the more XP.

BOND XP TABLE  
──────────────────────────────────────────────────  
Action                                  XP Earned  
──────────────────────────────────────────────────  
Add a bill / income source              \+10  
Set a habit to track                    \+15  
Share an interest or hobby              \+20  
Set a favorite artist or quote source   \+25  
Describe what motivates you             \+30  
Share a personal goal or milestone      \+35  
First disclosure in a new taste domain  \+50 (domain unlock bonus)  
──────────────────────────────────────────────────

**Bond Levels** determine the agent's expressive range:

BOND LEVELS  
──────────────────────────────────────────────────────────  
Level   XP Required   Agent Expression Range  
──────────────────────────────────────────────────────────  
  1        0          Generic decorations  
                      (flowers, weather icons, basic props)

  2       50          Themed decorations  
                      (matches stated interests and mood pack)

  3      150          Personal references  
                      (favorite colors, hobby items, named symbols)

  4      300          Contextual combinations  
                      (combines knowledge across domains,  
                       quotes from stated sources)

  5      500          Deep expression  
                      (callbacks to prior weeks, custom narratives,  
                       unique commemorative scenes)  
──────────────────────────────────────────────────────────

At Level 1, everyone's kingdom looks similar. At Level 5, no two kingdoms look alike. That gap is the progression loop that makes people share.

### **Diminishing Returns (The Token Budget Mechanic)**

A 4-week Bond Cycle with decaying XP returns. This is simultaneously an emotional pacing tool, an attachment safeguard, and a cost engineering mechanism.

BOND CYCLE  
──────────────────────────────────────────────────────────  
Week    XP Multiplier   LLM Token Budget    Behavior  
──────────────────────────────────────────────────────────  
  1        100%         High                Rich LLM calls, most creative  
  2         75%         Medium              More cached context, fewer novel calls  
  3         50%         Low                 Mostly templates \+ known preferences  
  4         25%         Minimal             Maintenance mode, anticipation builds  
──────────────────────────────────────────────────────────  
RESET: Multiplier → 100%. Token budget refreshes. Knowledge persists.

**Cost math:** \~10 LLM calls in Week 1, \~6 in Week 2, \~3 in Week 3, \~1 in Week 4\. Average \~5/week instead of 7\. That's 30% token savings disguised as a feature. Players don't think "rate limited." They think "reset day is coming."

---

## **The Bounded Expression Engine**

**The LLM never generates raw 3D meshes.** The LLM acts as a Director — selecting from a pre-built, curated asset library and template bank. This keeps the system deterministic, cheap, portable, testable, and open-source friendly.

### **Expression Workflow**

1\. CONTEXT ASSEMBLY  
   \- Pull Bond Level \+ current XP multiplier  
   \- Pull relevant Fact Layer data (today's events, bills, habits)  
   \- Pull Taste Layer preferences  
   \- Check recent expression log (avoid repetition within 7 days)  
   \- Determine trigger type: daily | payday | weekly | milestone

2\. INTENT GENERATION  
   If token budget allows → LLM call:  
     System prompt includes: Bond Level, user taste profile, today's facts,  
     recent expressions to avoid, asset catalog constraints.  
     Output: strictly typed JSON intent (see contract below).

   If token budget exhausted → Template selection:  
     Template library enriched with cached Taste Layer data.  
     Color swap, symbol substitution, message injection from known preferences.

3\. INTENT → SCENE MAPPING  
   Renderer receives JSON intent.  
   Maps artifact ID to voxel builder function.  
   Maps placement ID to world position.  
   Applies user aesthetic (color palette from Taste Layer).  
   Renders on the appropriate calendar tile.

4\. LOGGING  
   Expression logged with: date, trigger, artifact, placement, reasoning.  
   Feeds into weekly summary context and repetition cooldowns.

### **Expression JSON Contract**

{  
  "trigger": "daily",  
  "artifact": "lantern\_paper\_warm",  
  "placement": "dock\_post\_left",  
  "message": "Quiet Wednesday. The streak holds.",  
  "quote": null,  
  "rarity": "common",  
  "persistent": false,  
  "expiresAt": "2026-03-28",  
  "reason": "User completed meditation habit. Meeting-light day. Cozy mood pack active."  
}

### **Hard Rules**

* Max 1 daily expression (no exceptions)  
* No exact artifact repetition inside 7 days  
* No milestone trophy duplication  
* No quote unless source is user-approved in Taste Layer  
* No faith/scripture output unless faith mode is enabled  
* No "you are" psychological framing beyond user-provided facts  
* No direct financial advice beyond state representation  
* LLM never builds meshes — always selects from asset catalog

---

## **Core Experience Loops**

### **Daily Loop**

1. User logs or updates small facts for the day (habit, meeting, note).  
2. The agent gets one micro-expression opportunity.  
3. The world updates with one meaningful mark.  
4. User opens the world, sees what changed, maybe screenshots it.

### **Payday Loop**

1. Payday arrives. Diorama lighting shifts. Bill monsters pace the horizon.  
2. Retro JRPG UI panel slides in. Cursor becomes a pixel-art white glove.  
3. User hovers over "Smash Bills" command and clicks. (User triggers the release — not automated.)  
4. Agent draws weapon, charges bill monsters, executes them.  
5. Treasury stabilizes. Monsters dissolve into particles. World returns to peaceful state.  
6. Post-battle celebration artifact appears.

### **Weekly Loop**

1. Week ends. Agent composes a short heroic summary from actual facts.  
2. Summary is a narrative, not a spreadsheet (see Weekly Summary section).  
3. World receives one weekly artifact (plaque, scroll, trophy, banner).  
4. User gets a summary card ready for saving or sharing.

### **Milestone Loop**

1. User logs a milestone: sales record, audience growth, launch shipped, streak hit.  
2. World grants a permanent trophy, statue, plaque, or banner.  
3. Kingdom memory archive grows.

---

## **Companion Presence: The Idle State Machine**

An agent that only moves when spoken to is a robot. An agent that takes a nap is a companion.

The companion operates on a Finite State Machine that dictates idle behavior based on time-of-day and user schedule context.

COMPANION FSM STATES  
──────────────────────────────────────────────────────────  
Time / Context          Behavior  
──────────────────────────────────────────────────────────  
Morning                 Sweeping tower steps, watering garden  
Mid-day (meetings)      Sitting in corner with coffee and notebook  
Mid-day (clear)         Tending decorations, rearranging props  
Pre-payday              Sharpening sword, polishing armor,  
                        bills visible on horizon  
Payday (post-battle)    Victory pose, planting banner  
Evening                 Reading by lantern, sitting on dock  
Night / Rest            Napping in hammock, campfire with retro  
                        2D sprite "Z's" floating upward  
Day off                 Fishing, doing user's stated hobby,  
                        lounging with pet if favorite animal set  
After hard week input   Sitting quietly by a candle,  
                        repairing a banner  
──────────────────────────────────────────────────────────

The companion should always feel like it is **responding to the user's life**, not trying to steal the spotlight.

---

## **The Weekly Heroic Summary**

This is the emotional climax of the weekly loop and the most shareable artifact.

### **Two Paths**

**VICTORY WEEK** (targets mostly hit):

* Highlight reel referencing specific wins from Fact Layer  
* Stats presented as achievements, not spreadsheet  
* Celebration artifact placed in world  
* Optional quote from user-approved source  
* Tone: proud, observant, grounded

**TOUGH WEEK** (targets missed or rough stretch):

* Never a guilt trip. Never fake triumph.  
* Name one real thing the user still did  
* Place one dignified artifact (storm lantern, repaired banner, quiet campfire)  
* Optional quote from approved source  
* Tone: respectful, honest, encouraging

### **Tone Template**

A good summary sounds like: grounded, observant, concise, respectful, beautiful. A bad summary sounds like: fake motivational slop, therapy-speak, exaggerated victory language.

**Example:** "You carried four meetings, kept your habit streak alive three days, and still cleared payday without dropping the banner. Not a perfect week. A real one. The tower lantern stays lit."

That works because it names facts and adds grace.

### **Hard-Week Protocol**

When the week is rough, the system should:

1. Acknowledge the roughness honestly.  
2. Name one real thing the user still accomplished.  
3. Place one dignified artifact (never a participation trophy).  
4. Optionally attach one approved quote.

**Hard-week artifacts:** storm lantern, repaired banner, quiet campfire, bench under a tree, shield on a wall, candle in the tower window.

---

## **Achievements That Feel Personal**

A trophy is not just a badge. It is an authored memory.

### **Achievement Categories**

* **Finance:** cleared all bills, surplus streak, no missed due dates  
* **Habits:** 3-day, 7-day, 14-day, 30-day streaks  
* **Business:** first sale, revenue tier, audience milestone, launch shipped  
* **Resilience:** rough week but maintained one anchor habit, showed up after setback

### **Achievement Tiers**

TIERS  
──────────────────────────────────────────────────  
Tier        Trigger                    Visual  
──────────────────────────────────────────────────  
Bronze      3-day streak / small win   Small trophy on tile  
Silver      7-day streak / solid week  Trophy \+ banner  
Gold        14-day streak / big win    Trophy \+ banner \+ crowd  
Platinum    30-day streak              Full celebration scene  
Diamond     Custom milestone hit       Agent-designed unique scene  
──────────────────────────────────────────────────

### **Reward Types**

* Physical object in world (permanent)  
* Profile card in archive  
* Screenshot-ready share card  
* Cosmetic unlock (world theme element)  
* Named title ("The Relentless", "The Unbowed")

**Important rule:** Achievements should mix objective thresholds with tasteful presentation. The reward is not just points. The reward is the way the world remembers it.

---

## **Screen & UX Model**

### **Main View**

Single diorama scene (island with central tower/lighthouse) plus minimal side panel or bottom drawer.

**Core visible elements:**

* Island/tower scene with companion visible  
* Current week state (7-day strip overlaid or adjacent)  
* Payday/bill monsters when relevant  
* Current active decorations and props  
* Bond Level indicator \+ bond energy meter  
* Quick-add controls (bottom drawer)

### **Inputs Panel (Bottom Drawer)**

* Add / mark bill paid  
* Mark payday  
* Check habit  
* Add meeting  
* Add milestone  
* Write weekly note  
* Share a taste preference (Bond XP earning)

### **Weekly Recap Card**

Generated at week end. Contains: title, one short summary paragraph, one artifact visual, 3 factual highlights max, optional quote, share/export button.

### **Kingdom Archive**

Gallery of prior weeks, trophies, and milestone objects. This is a retention feature — scrolling back through months of your agent's creative expression of your life.

---

## **Data Model**

// \=== USER PROFILE \===  
interface UserProfile {  
  id: string  
  kingdomName: string  
  companionName: string  
  timezone: string  
  paydayRule: { type: 'monthly' | 'biweekly' | 'custom'; value: string }  
  preferences: {  
    moodPack: 'cozy' | 'tactical' | 'reverent' | 'playful'  
    faithMode: boolean  
    quoteSources: string\[\]  
    favoriteSymbols: string\[\]  
    favoriteAnimals: string\[\]  
    favoriteArtist: string | null  
    celebrationStyle: 'quiet' | 'warm' | 'bold'  
    encouragementStyle: 'stoic' | 'warm' | 'celebratory' | 'quiet'  
    colorFamily: string | null  
  }  
}

// \=== FACT LAYER \===  
interface Bill {  
  id: string  
  name: string  
  amount: number  
  dueDate?: string  
  category: 'housing' | 'utilities' | 'phone' | 'transport'  
           | 'food' | 'insurance' | 'entertainment' | 'other'  
  paid: boolean  
}

interface HabitEntry {  
  id: string  
  date: string          // YYYY-MM-DD  
  habitKey: string  
  completed: boolean  
}

interface MeetingEntry {  
  id: string  
  date: string  
  label: string  
  intensity: 'light' | 'normal' | 'heavy'  
}

interface MilestoneEntry {  
  id: string  
  date: string  
  type: 'sales' | 'followers' | 'launch' | 'streak' | 'custom'  
  value: number | string  
  note?: string  
}

interface WeeklyRecapInput {  
  weekStart: string  
  weekEnd: string  
  wins: string\[\]  
  losses: string\[\]  
  notes?: string  
}

// \=== BOND ENGINE \===  
interface BondState {  
  bondLevel: number         // 1-5  
  bondXP: number  
  bondCycle: number         // increments on reset  
  cycleStartDate: string    // ISO date  
  xpMultiplier: number      // 1.0 → 0.25 over 4 weeks  
  unlockedDomains: string\[\]  
  decorationLog: ExpressionDecision\[\]  
}

// \=== WORLD STATE \===  
interface WorldState {  
  islandStage: number  
  structures: WorldObject\[\]  
  decorations: WorldObject\[\]  
  trophies: WorldObject\[\]  
  activeMood: string  
  companionState: string    // FSM state ID  
  lastExpressionAt?: string  
}

interface WorldObject {  
  id: string  
  kind: string              // maps to asset catalog ID  
  position: string          // maps to placement slot ID  
  rarity: 'common' | 'rare' | 'epic'  
  createdAt: string  
  sourceEventId?: string  
  expiresAt?: string        // null for permanent objects  
  persistent: boolean  
}

// \=== EXPRESSION ENGINE OUTPUT \===  
interface ExpressionDecision {  
  id: string  
  date: string  
  trigger: 'daily' | 'payday' | 'weekly' | 'milestone'  
  artifact: string          // asset catalog ID  
  placement: string         // placement slot ID  
  message?: string  
  quote?: string  
  rarity: 'common' | 'rare' | 'epic'  
  persistent: boolean  
  expiresAt?: string  
  reason: string            // why the agent chose this (for logging \+ debugging)  
}

### **Zustand Store Architecture**

stores/  
├── profileStore.js     \# UserProfile \+ Taste Layer preferences  
├── factStore.js        \# Bills, habits, meetings, milestones, recaps  
├── bondStore.js        \# Bond XP, level, cycle, multiplier, decoration log  
├── worldStore.js       \# WorldState, structures, decorations, companion FSM  
└── uiStore.js          \# Panel state, modals, active view, animations

All stores persist independently to localStorage. Same pattern as AgentVille's proven Zustand \+ localStorage architecture.

---

## **Architecture Reuse Map**

### **From Payday Kingdom (shipped, live at payday-kingdom.vercel.app)**

| Component | Reuse Level | Notes |
| ----- | ----- | ----- |
| React \+ Vite \+ Tailwind scaffold | Direct | Already the stack |
| Three.js island scene (8×8 grid) | Modify | Becomes the central tower/island diorama |
| Voxel builder utility | Extend | Add new prop/decoration functions for asset catalog |
| Zustand \+ localStorage | Direct | Same pattern, new store shapes |
| Battle animation sequence | Modify | Add JRPG UI overlay \+ white-glove trigger |
| Screenshot \+ share pipeline | Direct | Same canvas capture \+ Web Share API |
| Procedural audio (Web Audio) | Extend | Add decoration reveal sounds, FSM transition sounds |
| Responsive layout | Direct | Same breakpoints |
| Vercel deployment | Direct | Same pipeline |

### **From AgentVille (shipped, live at agent-ville-kappa.vercel.app)**

| Component | Reuse Level | Notes |
| ----- | ----- | ----- |
| Claude API integration | Modify | Repurpose for Expression Engine intent calls |
| Template fallback system | Direct | Same pattern for low-budget decoration generation |
| Agent reaction library architecture | Modify | Becomes decoration template library structure |
| Field Log | Modify | Becomes agent thought log / expression reasoning log |
| Rate limiting (10 calls/day) | Direct | Same cost control pattern |
| API key in localStorage | Direct | User provides own key for MVP |

### **Genuinely New to Build**

* Companion FSM (idle state machine \+ time-of-day awareness)  
* Bond XP \+ diminishing returns math  
* Taste Layer store (preference domains)  
* Asset catalog (curated prop/decoration library with placement slots)  
* Expression Engine (fact aggregation → intent → JSON contract → renderer)  
* Weekly narrative generator (hero story with two-path logic)  
* Achievement tier system  
* Kingdom archive (gallery of prior weeks)  
* JRPG "Smash Bills" UI overlay  
* Habit tracker module  
* Meeting tracker module  
* Milestone tracker module

---

## **Monorepo Structure (Open Source)**

payday-kingdom/  
├── apps/  
│   └── web/                    \# Primary app (React \+ Vite)  
│       ├── src/  
│       │   ├── components/  
│       │   │   ├── scene/      \# Three.js diorama, companion, props  
│       │   │   ├── ui/         \# Panels, drawers, cards, modals  
│       │   │   └── battle/     \# JRPG overlay, bill-slaying sequence  
│       │   ├── stores/         \# Zustand stores (profile, fact, bond, world, ui)  
│       │   ├── App.jsx  
│       │   └── main.jsx  
│       └── public/  
│  
├── packages/  
│   ├── core/                   \# Types, state logic, domain rules  
│   │   ├── types.ts            \# All interfaces from Data Model section  
│   │   ├── bondMath.js         \# XP calculation, level thresholds, cycle decay  
│   │   └── achievementRules.js \# Tier thresholds, unlock conditions  
│   │  
│   ├── expression/             \# The Bounded Expression Engine  
│   │   ├── contextAssembler.js \# Gathers facts \+ taste \+ history for LLM prompt  
│   │   ├── intentGenerator.js  \# LLM call wrapper → JSON intent output  
│   │   ├── templateLibrary.js  \# 200+ fallback decoration templates  
│   │   ├── cooldownManager.js  \# 7-day repetition prevention, budget tracking  
│   │   └── narrativeGen.js     \# Weekly summary generator (victory \+ tough paths)  
│   │  
│   ├── scene/                  \# World renderer, asset placement, animations  
│   │   ├── assetCatalog.js     \# All voxel builder functions for props/decorations  
│   │   ├── placementSlots.js   \# Named positions in the diorama  
│   │   ├── companionFSM.js     \# Idle state machine transitions  
│   │   └── animationSystem.js  \# Decoration reveals, battle FX, FSM transitions  
│   │  
│   ├── content/                \# Extensible content packs  
│   │   ├── quotePacks/         \# Organized by source/theme  
│   │   ├── versePacks/         \# Faith-mode content (gated)  
│   │   ├── moodThemes/         \# Cozy, tactical, reverent, playful palettes  
│   │   └── symbolSets/         \# Lanterns, books, flowers, banners, etc.  
│   │  
│   └── adapters/               \# Optional extension points (post-MVP)  
│       ├── cronAdapter.js      \# Scheduled decoration updates  
│       ├── calendarAdapter.js  \# Future calendar API integration  
│       └── agentAdapter.js     \# OpenClaw / external agent hook  
│  
└── docs/  
    ├── ARCHITECTURE.md  
    ├── EXPRESSION\_CONTRACT.md  \# JSON intent schema documentation  
    ├── ASSET\_CATALOG.md        \# How to add new props/decorations  
    └── CONTRIBUTING.md

### **Architectural Separation (Critical)**

* **core** decides what happened (XP math, achievement rules, Bond logic)  
* **expression** decides how to mark it (intent generation, template selection)  
* **scene** decides how it looks (voxel rendering, placement, animation)  
* **ui** lets the human steer it (inputs, panels, sharing)

This split prevents the product from becoming one giant untestable prompt blob.

---

## **MVP Build Order (Claude Code Epics)**

### **Epic 1 — Preserve \+ Evolve the Stage**

Stabilize the existing PK codebase. Replace budget-only UI with the new store architecture (profileStore, factStore, bondStore, worldStore). Keep the island scene but prep it for the central tower/lighthouse framing. Verify screenshot pipeline still works.

**Deliverable:** Clean scaffold with new store shapes, existing island rendering intact.

### **Epic 2 — Companion Presence**

Add the companion voxel model to the island scene. Build the Finite State Machine with 4-5 initial idle states (morning sweep, coffee sit, evening read, night sleep with Z's, pre-payday weapon prep). Wire FSM transitions to time-of-day.

**Deliverable:** Companion visible in the world, cycling through idle behaviors.

### **Epic 3 — Life Event Inputs (Fact Layer)**

Build the bottom-drawer input panel: add bill, mark payday, check habit, add meeting, log milestone, write weekly note. All inputs write to factStore. No AI integration yet — just data entry.

**Deliverable:** User can input all Fact Layer data. Data persists in localStorage.

### **Epic 4 — The Tactile Climax (Smash Bills)**

Build the JRPG "Smash Bills" UI overlay. Pixel-art white-glove cursor. On payday, diorama lighting shifts, bills spawn as monsters, "Smash Bills" command appears. User clicks, agent executes bills. Particle effects. Treasury updates. World returns to peaceful state.

**Deliverable:** Full payday battle sequence working end-to-end.

### **Epic 5 — Bond Engine \+ Taste Layer**

Implement bondStore: XP calculation, level thresholds, 4-week cycle with diminishing returns. Build the Taste Layer input UI (mood pack selector, favorite artist, symbol preferences, faith mode toggle, encouragement style). First disclosure triggers Bond Level 1\. Domain unlock bonuses.

**Deliverable:** Bond XP accumulates. Level advances. Diminishing returns visible. Taste preferences stored.

### **Epic 6 — Expression Engine \+ Asset Catalog**

Build the curated asset catalog (voxel props: lanterns, banners, flowers, trophies, coffee mugs, birds, plaques, shields, campfires, etc.) with named placement slots. Build the Expression Engine: context assembler, LLM intent generator (Claude API, Haiku for daily, Sonnet for weekly), template fallback library. Wire it: daily micro-expression appears in world.

**Deliverable:** Agent places one decoration per day based on facts \+ taste \+ bond level. Template fallback works without LLM.

### **Epic 7 — Weekly Summary \+ Hard-Week Protocol**

Build the weekly narrative generator with two paths (victory / tough week). Generate the weekly recap card (title, paragraph, artifact, 3 highlights, optional quote). Implement hard-week protocol with dignified artifacts. Add archive/gallery view for prior weeks.

**Deliverable:** Weekly hero story generates. Share card exports. Archive browsable.

### **Epic 8 — Achievement System**

Implement achievement tiers (Bronze → Diamond) across all categories (finance, habits, business, resilience). Permanent trophies placed in world. Named titles earned. Achievement share cards.

**Deliverable:** Streaks and milestones trigger tiered rewards in the world.

### **Epic 9 — Open-Source Packaging**

Split into monorepo packages. Document the Expression JSON contract, asset catalog extension guide, and adapter pattern. Write CONTRIBUTING.md. Publish roadmap.

**Deliverable:** Clean open-source repo that developers can understand, extend, and contribute to.

---

## **What NOT to Build (Anti-Goals)**

Cut these until the smile loop is undeniable:

* Bank / Plaid integrations  
* Auto-pay claims or financial automation  
* Multiplayer kingdoms  
* Complex RPG skill trees  
* User accounts / backend / auth  
* Massive asset generation pipelines  
* Freeform natural-language world editing  
* "Always-on" companion chat as the main surface  
* React Three Fiber migration (raw Three.js works, don't switch)  
* PostgreSQL / Redis / FastAPI backend (localStorage is the way)

Payday Kingdom final form is **not**: an accounting suite, a therapist, a fake friend trap, a banking automation product, a generic AI dashboard, or an everything app.

It is a **tasteful life surface**.

---

## **Success Criteria**

### **Emotional Success**

* First meaningful smile within first session  
* Weekly recap feels personal, not generic  
* User feels seen without feeling watched  
* Hard weeks feel dignified, not patronizing

### **Product Success**

* Users return weekly without notifications being the main driver  
* Screenshot/export rate is high relative to sessions  
* Kingdom archive becomes part of retention  
* People share because the world is beautiful and says something real about them

### **Open-Source Success**

* Developers understand the architecture quickly  
* Asset catalog and Expression Engine are easy to extend  
* Community can add content packs, themes, and adapters without breaking core

---

## **Example Week**

### **Monday**

User checks off a deep work habit and logs two meetings. The companion adds a coffee mug and notebook to the corner balcony.

### **Wednesday**

Hard day. User misses one habit but still attends all meetings. No trophy. The world just adds a quiet lantern by the path.

### **Friday**

Payday hits. Bills spawn as monsters. User triggers "Smash Bills." Agent slays them. A banner rises from the tower.

### **Sunday**

Weekly recap generates:

* 4 meetings survived  
* Payday cleared  
* 3 habit check-ins completed  
* One rough patch acknowledged

Reward: A small plaque in the study and a quote card in the archive.

*"Not a perfect week. A real one. The tower lantern stays lit."*

That is the feeling.

---

## **LLM Integration Spec**

### **Model Routing**

* **Daily micro-expressions:** Claude Haiku 4.5 (cheap, fast, 1 call/day max)  
* **Weekly summaries:** Claude Sonnet 4.6 (high quality, 1 call/week)  
* **Milestone narratives:** Claude Sonnet 4.6 (1 call per milestone)

### **Rate Limits**

* Hard cap: 10 LLM calls per day (same as AgentVille's proven pattern)  
* Bond cycle naturally reduces to \~5 calls/week average

### **Fallback Behavior**

* No API key configured → templates only (fully playable)  
* Rate limited → templates with slight randomization  
* API error → template fallback \+ retry on next event  
* Game is 100% functional with zero LLM calls

### **API Key Handling**

* User provides their own Claude API key  
* Stored in localStorage  
* Settings panel for key entry \+ model selection  
* Clear messaging: "Add your API key for personalized expressions. Without it, your companion uses curated templates."

---

## **The Open-Source Play**

### **What Gets Open Sourced (MIT License)**

The entire `packages/` directory: core logic, expression engine, scene renderer, content packs, adapters. The Sentient Bond mechanic. The Expression JSON contract. The asset catalog extension system.

### **What Stays as the Skyframe Reference Implementation**

The complete `apps/web/` application — the polished, designed, emotionally-tuned product experience. The thing that makes people smile.

### **The Trojan Horse Logic**

Anyone can use the Sentient Bond engine to build their own agent expression surface: desktop wallpaper, Discord bot, widget, whatever. But the best-looking, most shareable, most emotionally resonant version is Payday Kingdom.

The open-source engine is the nod to the AI community. The app is the product. The money comes from Breadstick and other projects. This comes from love. And love, open sourced, is how you earn a seat at the table.

---

*"The crops grow while you sleep. The agent decorates while you dream."* *— Dan, Skyframe Innovations LLC*

