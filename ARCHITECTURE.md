# Payday Kingdom — Architecture Guide

Your AI agent lives in your calendar. The more it knows about you, the more beautifully it expresses what it sees.

## Tech Stack

- **React 19** + **Vite 7** — UI framework and build tool
- **Three.js 0.183** — Raw Three.js (not React Three Fiber) for the voxel island scene
- **Zustand 5** — State management with localStorage persistence
- **Tailwind CSS 4** — Styling via CDN
- **No backend** — Client-only, all data in browser localStorage

## Three-Layer Architecture

### Layer 1: Fact Layer (`factStore.js`)
User-provided structured life data. The foundation everything else builds on.
- Bills, income, payday date
- Habit definitions + daily check-ins
- Meetings with intensity levels
- Milestones (sales, launches, streaks)
- Weekly recap notes (wins, losses, reflections)

### Layer 2: Taste Layer (`profileStore.js` preferences)
User-chosen inputs that shape how the companion expresses itself.
- **Identity**: kingdom name, companion name
- **Aesthetic**: mood pack, color family, favorite symbols
- **Inspiration**: favorite artist, quote sources, faith mode, encouragement style
- **Life Context**: interests, motivation, side projects, people who matter

### Layer 3: Expression Layer (`expressionPicker.js` + `assetCatalog.js`)
The companion turns Facts + Taste into bounded, visible artifacts in the world.
- Max 1 daily decoration (no exceptions)
- No repetition within 7 days
- Bond level gates expression richness (generic → deeply personal)
- Template fallback works without any LLM

## Store Architecture

```
src/store/
├── profileStore.js   # Identity + income + taste preferences
├── factStore.js      # Bills, habits, meetings, milestones, weekly recaps
├── worldStore.js     # XP, level, hero, island stage, battle, decorations, companion
├── bondStore.js      # Bond XP, level, 4-week cycle, disclosure log
├── weeklyStore.js    # Arecibo recap state + archive
├── uiStore.js        # Muted, active panel, modal state
└── migration.js      # One-time old→new localStorage migration
```

All stores persist independently to localStorage via Zustand's persist middleware.

## Scene Architecture

The 3D island scene (`IslandScene.jsx`) uses a runtime object with named root groups:

```
worldRoot (scaled by WORLD_SCALE)
├── island        # Terrain grid, water, trees, rocks, lighthouse
├── treasury      # Gold pile structure
├── identity      # Kingdom banner
├── growth        # Island stage props (unlock over months)
├── monsters      # Bill monsters (arc layout)
├── hero          # Battle hero (visible only during combat)
├── companion     # Chibi FF companion with FSM idle animations
├── decorations   # Expression Engine daily decorations
└── particles     # Battle particle effects
```

### Render Loop
```
requestAnimationFrame → stepAnimations → updateIdleMotion → controls.update → render
```

### Companion FSM
5 states driven by time-of-day with payday override:
- `morning_sweep` (5-8h), `coffee_sit` (8-15h), `evening_read` (15-20h)
- `night_sleep` (20-5h), `pre_payday` (afternoon before payday)

## Bond Engine

Bond XP is separate from battle XP. Earned by sharing personal information.

| Bond Level | XP Required | Expression Range |
|-----------|-------------|-----------------|
| 1 Stranger | 0 | Generic decorations |
| 2 Acquaintance | 50 | Themed (matches mood pack) |
| 3 Companion | 150 | Personal references (favorites) |
| 4 Confidant | 300 | Cross-domain combinations |
| 5 Kindred | 500 | Deep expression (callbacks, custom) |

4-week cycle: XP multiplier decays 100% → 75% → 50% → 25%, then resets.

## Expression Engine

Daily decoration placement follows this pipeline:

```
1. assembleContext()     — Gather facts + taste + bond from all stores
2. Match EXPRESSION_RULES — First matching template rule wins
3. enrichWithTaste()     — Bond 2+: filter by mood pack
4. enrichWithSymbols()   — Bond 3+: include favorite symbols
5. 7-day cooldown        — Filter recently placed assets
6. Deterministic pick    — Date-seeded selection (same day = same result)
7. Place on island       — Choose free placement slot, create decoration
```

LLM integration (optional): Replace step 2-3 with Claude API intent generation. Template fallback always works.

## Battle Sequence

```
Trigger Payday → queuePayday() → runPaydaySequence()
  1. Hero descends (520ms easeOutBack)
  2. Per-monster combat loop (rush 460ms + defeat animation + XP float)
  3. Victory state + optional level-up
  4. resetBattle() → rebuildIdleScene()
```

BattleOverlay renders pixel-art JRPG chrome with kanji fatality flashes (斬破炎雷滅).

## Achievement System

25 achievements across 5 categories (finance, habits, bond, business, resilience).
5 tiers: Bronze → Silver → Gold → Platinum → Diamond.
Gold+ achievements auto-place trophy voxels on the island.

## Key Conventions

- **Delta time** for all movement and timing
- **InstancedMesh** for terrain (50+ similar objects)
- **Shared geometry/material cache** (`getSharedBoxGeometry`, `getSharedMaterial`)
- **rememberTransform()** on animatable parts (stores base position/rotation/scale)
- **Game loop order**: Animations → Entities → Camera → Render
- **No `new THREE.Vector3()`** inside per-frame animation functions
- **White base material** when using per-instance colors
- **Always dispose** Three.js GPU resources when removing objects
