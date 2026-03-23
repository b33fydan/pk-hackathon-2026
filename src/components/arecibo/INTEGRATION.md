# Arecibo Slice 5 - Integration Guide

## Overview

Arecibo Slice 5 provides React components to display the Arecibo Recap modal with weekly summary data. This guide shows how to integrate the components into your game flow.

## Components

### AreciboRecap (Main)
The modal that displays everything:
- Pixelated Arecibo grid (73×23)
- 7 expandable sections (Count, Elements, Pattern, Thread, Reflection, Kingdom, Signal)
- Share card generator
- Archive gallery
- Action buttons

**Usage:**
```jsx
import { AreciboRecap } from '@/components/arecibo';
import { generateAreciboIntent } from '@/utils/arecibo/expressionEngine';

export function MyGameScene() {
  const [showRecap, setShowRecap] = useState(false);
  const [intent, setIntent] = useState(null);
  const [pixelData, setPixelData] = useState(null);

  // When week ends (Sunday)
  const handleWeekEnd = async () => {
    const weekData = assembleWeekContext({ /* ... */ });
    const intent = await generateAreciboIntent({
      weekData,
      bondLevel: 3,
      tasteProfile: {},
      llmBudget: 1,
      llmService: claudeService,
    });

    // Render the grid (requires gridRenderer utility)
    const pixels = renderAreciboGrid(intent);
    
    setIntent(intent);
    setPixelData(pixels);
    setShowRecap(true);
  };

  return (
    <>
      <AreciboRecap
        weekData={weekData}
        intent={intent}
        pixelData={pixelData}
        bondLevel={3}
        kingdomName="MyKingdom"
        companionName="MyCompanion"
        open={showRecap}
        onClose={() => setShowRecap(false)}
        onArchive={() => {
          // Save to store
          useWeeklyStore.getState().archiveCurrentWeek();
        }}
      />
    </>
  );
}
```

### AreciboGrid
Canvas renderer with clickable sections.

**Props:**
- `pixelData` (number[][]): 2D pixel array (0-7 color indices)
- `onSectionClick` (Function): Called with sectionIndex (0-6)
- `scale` (number, default 4): Pixel scaling
- `className` (string): Extra CSS classes

### AreciboSection
Expandable section with narrative and stats.

**Props:**
- `index` (number): Section index (0-6)
- `title` (string): Section name
- `icon` (string): Emoji icon
- `data` (Object): Section data
- `narrative` (string): Human-readable text
- `stats` (Array): Array of { label, value }
- `isExpanded` (boolean): Show/hide content
- `onToggle` (Function): Called when clicked

### AreciboShareCard
Share card generator with export options.

**Props:**
- `intent` (Object): AreciboIntent
- `kingdomName` (string): Kingdom name
- `companionName` (string): Companion name
- `weekNumber` (string): Week number
- `weekDate` (string): Date range
- `pixelData` (number[][]): Grid pixels
- `bondLevel` (number): Bond level (1-5)
- `onExport` (Function): Called with { format, blob }

### AreciboArchive
Gallery of past weeks.

**Props:**
- `onSelectWeek` (Function): Called with weekNumber

## State Management

### useWeeklyStore (Zustand)

```javascript
import { useWeeklyStore } from '@/store/weeklyStore';

const {
  // Getters
  currentWeekIntent,
  currentWeekNumber,
  archive,
  selectedSectionIndex,

  // Setters
  setCurrentWeekIntent,
  archiveCurrentWeek,
  getArchivedWeek,
  clearArchive,
  setSelectedSection,
  toggleSectionExpanded,
  clearCurrentWeek,
} = useWeeklyStore();
```

**Example: Save current week**
```javascript
useWeeklyStore.getState().setCurrentWeekIntent(
  intent,
  weekNumber,
  new Date().toISOString()
);
```

**Example: Archive week**
```javascript
useWeeklyStore.getState().archiveCurrentWeek();
```

**Example: Get past week**
```javascript
const week = useWeeklyStore.getState().getArchivedWeek(5); // Week 5
```

## Integration Points

### 1. Weekly Loop (End of Sunday)

In your game loop, when the week ends:

```javascript
// Pseudo-code in your game state manager
async function endWeekly() {
  // Assemble week data from factStore
  const weekData = assembleWeekContext({
    factStore,
    weekNumber: currentWeekNumber,
    habitsStore,
    kingdomStore,
  });

  // Generate intent (with or without LLM)
  const intent = await generateAreciboIntent({
    weekData,
    bondLevel: progressionStore.bondLevel,
    tasteProfile: userStore.tasteProfile,
    llmBudget: 1,
    llmService: claudeService,
  });

  // Validate
  const validation = validateAreciboIntent(intent, weekData, userStore.tasteProfile);
  if (!validation.valid) {
    console.error('Intent validation failed:', validation.errors);
    // Handle error
  }

  // Render grid (requires gridRenderer utility - Slice 1)
  const pixelData = renderAreciboGrid(intent);

  // Save to store
  useWeeklyStore.getState().setCurrentWeekIntent(
    intent,
    weekNumber,
    new Date().toISOString()
  );

  // Show modal
  setShowRecapModal(true);
}
```

### 2. HUD Integration

Add "View Weekly Recap" button to SeasonHUD:

```jsx
function SeasonHUD() {
  const { currentWeekIntent, currentWeekNumber } = useWeeklyStore();
  const [showRecap, setShowRecap] = useState(false);

  if (!currentWeekIntent) {
    return null; // No recap this week
  }

  return (
    <div className="hud">
      {/* ... other HUD elements ... */}
      
      <button onClick={() => setShowRecap(true)}>
        📡 Week {currentWeekNumber} Recap
      </button>

      <AreciboRecap
        weekData={/* current week data */}
        intent={currentWeekIntent}
        pixelData={/* rendered pixels */}
        open={showRecap}
        onClose={() => setShowRecap(false)}
      />
    </div>
  );
}
```

### 3. Archive Browser

Show gallery anywhere:

```jsx
function RecapLibrary() {
  const { archive } = useWeeklyStore();

  return <AreciboArchive onSelectWeek={(weekNum) => {
    // Load week from archive
    const week = useWeeklyStore.getState().getArchivedWeek(weekNum);
    // Show in modal or detail view
  }} />;
}
```

## Styling

All components use CSS modules (`styles.module.css`):
- Dark theme (matches island scene)
- Mobile-first responsive
- 44px+ touch targets
- No external UI libraries
- Pixel-perfect grid rendering

### Custom Colors

Section colors (in palette order):
```css
--color-purple: #8b5cf6;   /* Count */
--color-green: #10b981;    /* Elements */
--color-blue: #3b82f6;     /* Pattern */
--color-red: #ef4444;      /* Thread */
--color-yellow: #fbbf24;   /* Reflection */
--color-teal: #14b8a6;     /* Kingdom */
--color-cyan: #06b6d4;     /* Signal */
```

## Data Flow

```
Game Loop
  ↓
assembleWeekContext() [from expressionEngine.js]
  ↓
generateAreciboIntent() [expressionEngine.js]
  ↓
renderAreciboGrid() [gridRenderer utility - Slice 1]
  ↓
useWeeklyStore.setCurrentWeekIntent()
  ↓
<AreciboRecap> renders
  ↓
User clicks section → toggleSectionExpanded()
  ↓
User clicks Share → onExport callback
  ↓
User clicks Save → archiveCurrentWeek()
```

## Testing

Run tests:
```bash
npm test -- AreciboRecap.test.jsx
npm test -- AreciboGrid.test.jsx
npm test -- AreciboShareCard.test.jsx
```

## Troubleshooting

### Modal doesn't appear
- Check `open={true}` prop
- Verify intent is not null
- Ensure portal target exists (body element)

### Grid doesn't render
- Verify pixelData is 2D array of valid indices (0-7)
- Check canvas context support
- Canvas size should be width × height (e.g., 73 × 23)

### Sections not clickable
- Ensure `onSectionClick` callback is provided
- Check `scale` prop (default 4)
- Verify grid overlay buttons are not hidden

### Share export fails
- html2canvas library required for full export (not included)
- Fallback uses canvas blob download
- Copy to clipboard requires ClipboardItem API (modern browsers)

### Archive is empty
- Archive only saves when `archiveCurrentWeek()` called
- Check localStorage quota
- Verify weeklyStore persistence is working

## Performance Notes

- Canvas rendering is fast (~1ms for 73×23 grid)
- Modal animation is GPU-accelerated
- Archive stores up to 52 weeks
- No external dependencies (CSS only, except Zustand)

## Next Steps

After Slice 5 integration, consider:
1. Add gridRenderer utility (Slice 1) for pixel-perfect rendering
2. Wire up weekly game loop trigger
3. Add SeasonHUD button
4. Test with real game data
5. Polish animations and UX

## Related Utilities

- `generateAreciboIntent()` - expressionEngine.js
- `validateAreciboIntent()` - emotionalGuardrails.js
- `assembleWeekContext()` - expressionEngine.js
- `renderAreciboGrid()` - gridRenderer utility (Slice 1, not yet built)
- `useWeeklyStore` - weeklyStore.js

## Questions?

Refer to the API.md in `src/utils/arecibo/` for detailed utility documentation.
