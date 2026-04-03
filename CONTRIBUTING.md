# Contributing to Payday Kingdom

Thanks for your interest in contributing! Payday Kingdom is open source (MIT) and welcomes contributions.

## Getting Started

```bash
git clone https://github.com/b33fydan/pk-hackathon-2026.git
cd pk-hackathon-2026
npm install
npm run dev
```

Navigate to `http://localhost:5173/kingdom` to see the app.

## Project Structure

```
src/
├── components/
│   ├── scene/          # Three.js island scene + viewport wrapper
│   ├── ui/             # React UI panels, dialogs, overlays
│   └── arecibo/        # Weekly recap system (grid, sections, share card)
├── store/              # Zustand stores (profile, facts, world, bond, weekly, ui)
├── utils/              # Pure functions, voxel builders, math
│   └── arecibo/        # Expression engine, guardrails, templates
└── pages/              # Landing page + Kingdom page
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## Adding New Decorations

The asset catalog (`src/utils/assetCatalog.js`) contains all voxel decorations the companion can place.

### 1. Create a builder function

```javascript
export function createMyProp(x, z, color = '#default') {
  const group = new THREE.Group();
  // Use createVoxel() and createBoxMesh() for geometry
  // Use getSharedMaterial() for materials (caches automatically)
  group.add(createBoxMesh(0, 0.2, 0, 0.2, 0.3, 0.2, color));
  group.position.set(x, 0, z);
  return group;
}
```

### 2. Register in the catalog

```javascript
export const ASSET_CATALOG = {
  // ... existing entries
  my_prop: { builder: createMyProp, args: ['#hexcolor'], label: 'My Prop', rarity: 'common' },
};
```

### 3. Add expression rules (optional)

In `src/utils/expressionPicker.js`, add your asset ID to relevant `EXPRESSION_RULES`:

```javascript
{
  condition: (ctx) => ctx.someCondition,
  assets: ['my_prop', 'existing_asset'],
  message: 'A message about this decoration.',
  rarity: 'common',
},
```

## Adding New Achievements

In `src/utils/achievements.js`, add to `ACHIEVEMENT_DEFINITIONS`:

```javascript
{
  id: 'unique-id',
  icon: '🏆',
  label: 'Achievement Name',
  description: 'What the user did.',
  tier: 'bronze',           // bronze | silver | gold | platinum | diamond
  category: 'habits',       // finance | habits | bond | business | resilience
  title: 'The Title',       // Named title (null if none)
  accentColor: '#hexcolor',
  accentDarkColor: '#darkhex',
  shareLine: 'Share card text.',
  check: (metrics) => metrics.someValue >= threshold,
}
```

Available metrics: `totalBillsSlain`, `islandStage`, `lifetimeSaved`, `level`, `monthsCompleted`, `history`, `habitsCompleted`, `longestStreak`, `bondLevel`, `milestoneCount`, `toughWeekRecaps`, `comebackWeeks`.

## Expression JSON Contract

The Expression Engine outputs decisions in this format:

```json
{
  "id": "expr-2026-04-02",
  "date": "2026-04-02",
  "trigger": "daily",
  "artifact": "lantern_warm",
  "placement": "dock_left",
  "message": "A quiet light for a long day.",
  "quote": null,
  "rarity": "common",
  "persistent": false,
  "expiresAt": "2026-04-09",
  "reason": "Rule matched. Bond Lv.3.",
  "createdAt": "2026-04-02T10:00:00.000Z"
}
```

## Design Principles

1. **One Screen, One Feeling** — No cluttered dashboards
2. **Facts First, Magic Second** — Grounded in user-provided data
3. **Bounded Creative Freedom** — Max 1 daily expression
4. **Scarcity Creates Meaning** — Rare decorations hit harder
5. **Taste Over Omniscience** — Learn from voluntary disclosure only
6. **Dignity on Hard Weeks** — Never fake triumph or guilt-trip
7. **Local-First Trust** — All data stays in the browser

## Code Style

- Functional React components with hooks (no class components)
- Zustand for state management (no Redux, no Context for global state)
- Raw Three.js (not React Three Fiber)
- Tailwind CSS for styling
- Press_Start_2P font for pixel-art UI elements
- Inter font for body text

## Building

```bash
npm run build    # Production build to dist/
npm run dev      # Development server with HMR
npm run preview  # Preview production build locally
```
