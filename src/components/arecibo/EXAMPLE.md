# Arecibo Slice 5 - Usage Examples

## Basic Modal

```jsx
import { useState } from 'react';
import { AreciboRecap } from '@/components/arecibo';

export function RecapExample() {
  const [open, setOpen] = useState(false);

  const weekData = {
    weekNumber: 1,
    weekStart: new Date('2024-01-01'),
    weekEnd: new Date('2024-01-07'),
    billsPaid: 3,
    billsTotal: 4,
    habitsCompleted: 12,
    habitsTotal: 14,
    meetings: 4,
    daysActive: 6,
    activeHabits: [
      { name: 'Meditation', completed: 5, total: 7 },
      { name: 'Exercise', completed: 4, total: 5 },
    ],
    longestStreak: { habit: 'Meditation', days: 12 },
    nearestMilestone: null,
    weekSentiment: 'mixed',
    bondXpEarned: 75,
  };

  const intent = {
    weekNumber: 1,
    sections: {
      count: { derivative: 'standard', stats: {} },
      elements: { derivative: 'full' },
      pattern: { derivative: 'heatmap', narrative: 'strong_finish' },
      thread: { derivative: 'clean_helix' },
      reflection: { derivative: 'working' },
      kingdom: { derivative: 'overview' },
      signal: { derivative: 'fact_grounded', message: 'Week one complete.' },
    },
  };

  // Generate pixel data (from gridRenderer utility)
  const pixelData = Array(23)
    .fill(null)
    .map(() => Array(73).fill(0));

  return (
    <>
      <button onClick={() => setOpen(true)}>Show Recap</button>

      <AreciboRecap
        weekData={weekData}
        intent={intent}
        pixelData={pixelData}
        bondLevel={3}
        kingdomName="MyKingdom"
        companionName="MyCompanion"
        open={open}
        onClose={() => setOpen(false)}
        onArchive={() => console.log('Archived!')}
      />
    </>
  );
}
```

## With State Management

```jsx
import { useWeeklyStore } from '@/store/weeklyStore';
import { AreciboRecap } from '@/components/arecibo';
import { generateAreciboIntent } from '@/utils/arecibo/expressionEngine';

export function GameWithRecap() {
  const [showRecap, setShowRecap] = useState(false);
  const {
    currentWeekIntent,
    currentWeekNumber,
    setCurrentWeekIntent,
    archiveCurrentWeek,
  } = useWeeklyStore();

  // When week ends
  const handleWeekEnd = async () => {
    const weekData = {
      weekNumber: currentWeekNumber,
      billsPaid: 3,
      billsTotal: 4,
      // ... more data
    };

    // Generate intent
    const intent = await generateAreciboIntent({
      weekData,
      bondLevel: 3,
      tasteProfile: {
        favoriteSymbols: ['lantern'],
        favoriteSources: ['Marcus Aurelius'],
      },
      llmBudget: 1,
      llmService: claudeService,
    });

    // Render grid
    const pixelData = renderAreciboGrid(intent);

    // Save to store
    setCurrentWeekIntent(intent, currentWeekNumber, new Date().toISOString());

    // Show modal
    setShowRecap(true);
  };

  // When saving recap
  const handleArchive = () => {
    archiveCurrentWeek();
    setShowRecap(false);
  };

  return (
    <>
      {/* Game elements */}
      <button onClick={handleWeekEnd}>End Week</button>

      {currentWeekIntent && (
        <AreciboRecap
          weekData={/* current week data */}
          intent={currentWeekIntent}
          pixelData={/* rendered pixels */}
          bondLevel={3}
          kingdomName="MyKingdom"
          companionName="MyCompanion"
          open={showRecap}
          onClose={() => setShowRecap(false)}
          onArchive={handleArchive}
        />
      )}
    </>
  );
}
```

## Custom Grid Scaling

```jsx
import { AreciboGrid } from '@/components/arecibo';

export function CustomGridExample() {
  const pixelData = Array(23).fill(null).map(() => Array(73).fill(0));

  return (
    <AreciboGrid
      pixelData={pixelData}
      onSectionClick={(sectionIndex) => {
        console.log(`Section ${sectionIndex} clicked`);
      }}
      scale={2} // Smaller pixels
      className="my-custom-class"
    />
  );
}
```

## Share Card Export

```jsx
import { AreciboShareCard } from '@/components/arecibo';

export function ShareExample() {
  const pixelData = Array(23).fill(null).map(() => Array(73).fill(0));

  return (
    <AreciboShareCard
      intent={{ weekNumber: 1, sections: {} }}
      kingdomName="MyKingdom"
      companionName="Companion"
      weekNumber="1"
      weekDate="Jan 1 - Jan 7"
      pixelData={pixelData}
      bondLevel={3}
      onExport={(data) => {
        console.log(`Exported ${data.format}:`, data.blob);
        // Send to social media, etc.
      }}
    />
  );
}
```

## Archive Browser

```jsx
import { AreciboArchive } from '@/components/arecibo';
import { useWeeklyStore } from '@/store/weeklyStore';

export function ArchiveViewerExample() {
  const { getArchivedWeek } = useWeeklyStore();

  return (
    <AreciboArchive
      onSelectWeek={(weekNum) => {
        const week = getArchivedWeek(weekNum);
        console.log('Selected week:', week);
        // Load and display in modal
      }}
    />
  );
}
```

## HUD Integration

Add a button to show recap from anywhere in game:

```jsx
import { AreciboRecap } from '@/components/arecibo';
import { useWeeklyStore } from '@/store/weeklyStore';

export function GameHUD() {
  const [showRecap, setShowRecap] = useState(false);
  const { currentWeekIntent, currentWeekNumber } = useWeeklyStore();

  // Don't show button if no recap
  if (!currentWeekIntent) {
    return null;
  }

  return (
    <div className="hud-corner">
      <button
        onClick={() => setShowRecap(true)}
        className="hud-button recap-button"
      >
        📡 Week {currentWeekNumber}
      </button>

      <AreciboRecap
        open={showRecap}
        onClose={() => setShowRecap(false)}
        // ... other props
      />
    </div>
  );
}
```

## Full Game Loop Example

```jsx
import { useEffect } from 'react';
import { generateAreciboIntent } from '@/utils/arecibo/expressionEngine';
import { useWeeklyStore } from '@/store/weeklyStore';
import { AreciboRecap } from '@/components/arecibo';

export function GameScene() {
  const [showRecap, setShowRecap] = useState(false);
  const { setCurrentWeekIntent, archiveCurrentWeek } = useWeeklyStore();
  const { bondLevel, weekNumber } = useGameState();
  const { billsPaid, billsTotal, habits, meetings } = useFactStore();

  // Listen for week end
  useEffect(() => {
    const unsubscribe = useGameState.subscribe((state) => {
      if (state.weekEnded && !state.recapShown) {
        handleWeekEnd();
      }
    });
    return unsubscribe;
  }, []);

  const handleWeekEnd = async () => {
    // Assemble week data
    const weekData = {
      weekNumber,
      billsPaid,
      billsTotal,
      habitsCompleted: habits.filter((h) => h.completed).length,
      habitsTotal: habits.length,
      meetings: meetings.length,
      daysActive: 6,
      activeHabits: habits,
      dailyIntensity: [3, 5, 7, 6, 8, 4, 2],
      longestStreak: { habit: 'meditation', days: 12 },
      weekSentiment: 'mixed',
      bondXpEarned: 75,
      companionName: 'Companion',
      kingdomName: 'MyKingdom',
    };

    // Generate intent
    const intent = await generateAreciboIntent({
      weekData,
      bondLevel,
      tasteProfile: userStore.tasteProfile,
      llmBudget: 1,
      llmService: claudeService,
    });

    // Render grid
    const pixelData = renderAreciboGrid(intent);

    // Save state
    setCurrentWeekIntent(intent, weekNumber, new Date().toISOString());

    // Show modal
    setShowRecap(true);

    // Mark recap as shown
    useGameState.getState().setRecapShown(true);
  };

  return (
    <>
      {/* Game elements */}
      <AreciboRecap
        weekData={/* ... */}
        intent={/* ... */}
        pixelData={/* ... */}
        bondLevel={bondLevel}
        kingdomName="MyKingdom"
        companionName="Companion"
        open={showRecap}
        onClose={() => setShowRecap(false)}
        onArchive={() => {
          archiveCurrentWeek();
          useGameState.getState().advanceToNextWeek();
        }}
      />
    </>
  );
}
```

## Styling Customization

Override CSS variables in your parent component:

```css
/* your-styles.css */
:root {
  --color-purple: #7c3aed; /* Custom purple */
  --color-bg: #030712; /* Custom background */
  --color-text: #f1f5f9; /* Custom text */
}
```

## Responsive Design

The components are mobile-first and responsive:
- Desktop (1024px+): Full modal with side panels
- Tablet (768px+): Optimized grid layout
- Mobile (< 768px): Single column, larger touch targets (44px+)

Example mobile layout:
```jsx
// On mobile, sections stack vertically
// Grid scales to fit screen width
// Buttons expand to full width
// Archive grid adjusts column count
```

## State Persistence

Archive persists to localStorage automatically via Zustand:

```javascript
// Data is automatically saved
useWeeklyStore.getState().archiveCurrentWeek();

// Retrieve past weeks
const week5 = useWeeklyStore.getState().getArchivedWeek(5);

// Clear all history
useWeeklyStore.getState().clearArchive();
```

## Error Handling

All components handle missing data gracefully:

```jsx
// Missing intent
<AreciboRecap intent={null} /> // Renders nothing

// Missing pixel data
<AreciboGrid pixelData={[]} /> // Shows empty canvas

// Missing week data
<AreciboSection data={undefined} /> // Shows no stats

// Works with minimal data
<AreciboRecap
  weekData={{ weekNumber: 1 }}
  intent={{ sections: {} }}
  pixelData={[]}
  open={true}
  onClose={() => {}}
/>
```

## Testing

```javascript
import { render, screen } from '@testing-library/react';
import { AreciboRecap } from '@/components/arecibo';

describe('AreciboRecap', () => {
  it('renders when open', () => {
    render(
      <AreciboRecap
        weekData={{ weekNumber: 1 }}
        intent={{ sections: {} }}
        pixelData={[]}
        open={true}
        onClose={jest.fn()}
      />
    );

    expect(screen.getByText(/Weekly Recap/i)).toBeInTheDocument();
  });
});
```

## Performance Tips

1. **Grid rendering**: Fast (1-2ms for 73×23)
2. **Archive**: Limit to 52 weeks (auto-trimmed)
3. **Pixel data**: Pass pre-computed data, don't regenerate on every render
4. **Modal**: Uses createPortal for isolation
5. **CSS**: All module-scoped, no global conflicts

## Accessibility

- All buttons have proper ARIA labels
- Modal is keyboard dismissable (Escape, close button)
- 44px+ touch targets on mobile
- Canvas has alt text
- Color-independent information

## Next Phase

Once gridRenderer utility (Slice 1) is complete, you can:
1. Auto-generate pixel data from intent
2. Use advanced visualization techniques
3. Add animations during grid reveal
4. Implement interactive grid features

Enjoy the recap!
