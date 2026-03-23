# Arecibo Developer Handoff Guide

**For:** Future maintainers and feature developers  
**Level:** Intermediate+ (React, async patterns, CSS)  
**Time to understand:** 2-3 hours

---

## Project Structure

```
src/
├── components/arecibo/
│   ├── AreciboRecap.jsx          # Main modal component (entry point)
│   ├── AreciboGrid.jsx            # Pixel grid rendering
│   ├── AreciboSection.jsx         # Expandable section component
│   ├── AreciboShareCard.jsx       # PNG export + social format
│   ├── AreciboArchive.jsx         # Archive browsing UI
│   ├── styles.module.css          # All Arecibo-specific styles
│   ├── index.js                   # Exports
│   ├── __tests__/                 # Unit tests
│   ├── README.md                  # Component API
│   ├── QUICK_REFERENCE.md         # Quick copy-paste examples
│   └── INTEGRATION.md             # How to integrate into game
│
└── utils/arecibo/
    ├── expressionEngine.js         # Main orchestrator (async)
    ├── derivativeSelector.js       # Derivative choice logic
    ├── emotionalGuardrails.js      # Tone validation
    ├── signalComposer.js           # Final message generation
    ├── sectionAssemblers.js        # Template text for sections
    ├── areciboPrompts.js           # LLM system/user prompts
    ├── types.js                    # TypeScript-like definitions
    ├── API.md                      # Detailed function signatures
    ├── __tests__/                  # Unit tests (jest)
    └── EMOTIONAL_GUARDRAILS_EXAMPLES.md
```

---

## Key Concepts

### 1. Derivative (Variant Selection)

Each section has multiple "poses" or variants. The engine picks one based on:
- **Week sentiment** (victory, tough, mixed)
- **Bond level** (1-5)
- **Random seed** (for consistency/reproducibility)

**Example:** `reflection` section derivatives:
- `victory` — Companion celebrates
- `vigil` — Companion stands watch (tough week)
- `guardian` — Companion protects (mixed week)
- `resting` — Companion rests (low activity week)
- `celebration` — Bond 4+ only (requires higher trust)

**Adding a new derivative:**
1. Add case to selector function in `derivativeSelector.js`
2. Add templates to `sectionAssemblers.js`
3. Update LLM prompt in `areciboPrompts.js`
4. Add validation rule to `emotionalGuardrails.js`

### 2. Week Sentiment

Computed from bills + habits:
- **victory** — All bills paid AND >80% habits completed
- **tough** — >50% bills unpaid OR <50% habits completed
- **mixed** — Everything else

Code: `expressionEngine.js` → `computeWeekSentiment()`

### 3. Bond Level

Player progression (1-5):
- **1:** Companion learning you
- **2:** Initial trust built
- **3:** Personal details unlocked (favorites, items)
- **4:** Deep connection (quotes, symbolic refs)
- **5:** Full intimacy (callbacks, verses)

Bond gates determine what's available (e.g., Bond 1 can't see callbacks).

### 4. Signal (Final Transmission)

The most complex section. Derivatives:
- **fact_grounded** — Specific week stats (always safe)
- **symbolic** — Metaphorical ref (needs favorites list)
- **quote** — Quotes from player's fave authors
- **verse** — Scripture/poetry (needs faith mode)
- **callback** — Reference to past week (needs previous data)

Logic in: `signalComposer.js`

### 5. Emotional Guardrails

Regex patterns that detect problematic language:
- Therapy-speak ("healing journey")
- Guilt ("you failed to")
- Fake triumph ("blessing in disguise")
- Patronizing ("you got this!")
- Therapist-speak ("let's explore")

**Validation always runs** on LLM output. Templates are pre-validated.

---

## Data Flow

### Happy Path (With LLM)

```
1. Weekly loop triggers
   ↓
2. assembleWeekContext() builds weekData
   {
     billsPaid: 3, billsTotal: 5,
     habitsCompleted: 10, habitsTotal: 14,
     weekSentiment: 'mixed',
     bondLevel: 3,
     ...
   }
   ↓
3. generateAreciboIntent() called
   ↓
4. Check: llmBudget > 0 && llmService available?
   YES → callAreciboLLM()
   ↓
5. Build system prompt (context + guardrails)
   Build user prompt (week facts)
   ↓
6. Claude responds with JSON
   ↓
7. validateAreciboIntent() checks tone + structure
   PASS → Return intent
   FAIL → Log warning, fall through
   ↓
8. Component renders AreciboRecap(intent)
```

### Fallback Path (No LLM)

```
1-3. Same as above
   ↓
4. Check: llmBudget > 0 && llmService available?
   NO → generateFromTemplates()
   ↓
5. For each section:
   - Call selectXxxDerivative() (picks based on sentiment)
   - Call getXxxMessage() from sectionAssemblers (fills text)
   ↓
6. Compose signal via signalComposer()
   ↓
7. Return AreciboIntent (same structure)
   ↓
8. Component renders exactly the same way
```

**Key insight:** Player doesn't know which path was taken. Output quality identical.

---

## Critical Functions

### `expressionEngine.js`

**`generateAreciboIntent(params)`**
- **Input:** weekData, bondLevel, tasteProfile, llmBudget, llmService
- **Output:** AreciboIntent (Promise)
- **Does:** Orchestrates LLM or templates, validates, returns
- **Error handling:** Catches LLM errors, falls back gracefully

**`callAreciboLLM(params)`**
- **Input:** weekData, bondLevel, tasteProfile, llmService
- **Output:** AreciboIntent (Promise)
- **Timeout:** 8 seconds (hard limit via Promise.race)
- **JSON parsing:** Strips markdown, parses, validates structure

**`generateFromTemplates(params)`**
- **Input:** weekData, bondLevel, tasteProfile, previousWeekData
- **Output:** AreciboIntent (sync)
- **Does:** Calls all derivative selectors, assembles sections
- **Never throws:** Always returns valid intent

**`computeWeekSentiment(billsPaid, billsTotal, ...)`**
- **Input:** Week metrics
- **Output:** 'victory' | 'tough' | 'mixed'
- **Logic:** Bills>50% unpaid OR habits<50% completed → tough; else victory/mixed

---

### `derivativeSelector.js`

All functions follow same pattern:

```javascript
selectXxxDerivative(weekData, bondLevel) {
  // Logic based on sentiment + bond level
  if (weekSentiment === 'victory' && bondLevel >= 3) {
    return 'celebration';
  }
  if (weekSentiment === 'tough') {
    return 'vigil';
  }
  return 'default_derivative';
}
```

**Functions:**
- `selectCountDerivative()`
- `selectElementsDerivative()`
- `selectPatternDerivative()`
- `selectThreadDerivative()`
- `selectReflectionDerivative()`
- `selectKingdomDerivative()`
- `selectSignalDerivative()`

**To add new derivative:** Create new branch in selector + add templates.

---

### `emotionalGuardrails.js`

**`validateEmotionalGuardrails(areciboIntent, weekSentiment)`**
- **Input:** Generated intent, week sentiment
- **Output:** { valid: bool, violations: string[], severity: 'critical'|'warning'|'clean' }
- **Checks:** Therapy-speak, guilt, fake triumph, patronizing, therapist-speak
- **Tough week check:** Requires acknowledgment of difficulty

**`validateReflectionDerivative(derivative, weekSentiment)`**
- **Input:** Chosen pose, sentiment
- **Output:** { valid: bool, reason?: string }
- **Validates:** Pose matches week (victory pose on tough week = error)

**`validateSignalDerivative(derivative, bondLevel, tasteProfile)`**
- **Input:** Signal type, bond level, profile
- **Output:** { valid: bool, reason?: string }
- **Checks:** Bond gates, required data (favorites, etc.)

**To add new validation:** Add pattern regex to list, add check function.

---

### `signalComposer.js`

**`composeSignalMessage(params)`**
- **Input:** weekData, bondLevel, tasteProfile, previousWeekData
- **Output:** { derivative, message, source }
- **Does:** Picks signal derivative, generates message
- **Complex logic:** Callbacks require previous week data

---

### `sectionAssemblers.js`

Contains template strings for each section + derivative combo.

**Example:**
```javascript
const countMessages = {
  concise: (stats) => `You tracked ${stats.billsPaid}/${stats.billsTotal} bills.`,
  detailed: (stats) => `This week: ${stats.billsPaid}/${stats.billsTotal} bills paid, ${stats.habitsCompleted}/${stats.habitsTotal} habits completed.`,
};
```

**To add template:** Find section, add derivative key, write template function.

---

## React Components

### `AreciboRecap.jsx` (Entry Point)

**Props:**
```javascript
{
  weekData: Object,           // Week facts
  intent: Object,             // AreciboIntent
  bondLevel: 1-5,            // Player bond
  kingdomName: string,       // Player's kingdom
  companionName: string,     // Companion name
  pixelData: number[][],     // 73x23 grid
  open: boolean,             // Modal visible?
  onClose: Function,         // Dismiss
  onArchive?: Function,      // Save to archive
}
```

**State:**
- `showArchive` — Toggle archive view

**Behavior:**
- Modal overlays whole screen
- Click outside to close
- Close button top-right
- Sections expandable
- Share card + buttons at bottom
- Portal to body (z-index: 50)

### `AreciboGrid.jsx`

**Props:**
```javascript
{
  pixelData: number[][],     // 73x23 matrix (0-7 = colors)
  onSectionClick?: Function,
  scale: number = 4,         // Pixel scale
}
```

**Renders:** Canvas element with pixelated grid

**Colors (values 0-7):**
- 0 → Black (empty)
- 1 → Purple (bills)
- 2 → Green (habits)
- 3 → Blue (meetings)
- 4 → Red (critical)
- 5 → Yellow (peak)
- 6 → Teal (streak)
- 7 → Cyan (milestone)

### `AreciboSection.jsx`

**Props:**
```javascript
{
  title: string,
  icon: string,              // Emoji
  data: Object,              // Section data
  narrative: string,
  stats: Array,              // Stat rows
  isExpanded: boolean,
  onToggle: Function,
}
```

**Behavior:**
- Click header to expand/collapse
- Smooth height animation
- Stats render as table
- Narrative + data visible when expanded

### `AreciboShareCard.jsx`

**Props:**
```javascript
{
  intent: Object,
  kingdomName: string,
  companionName: string,
  weekNumber: number,
  weekDate: string,
  pixelData: number[][],
  bondLevel: 1-5,
  onExport: Function,        // Called with PNG data
}
```

**Features:**
- Live preview of share card
- Download PNG button
- Copy to clipboard button (for data URL)
- Formatted for 1200x630 (social standard)

### `AreciboArchive.jsx`

**Props:**
```javascript
{
  onSelectWeek: Function,    // Called with week number
}
```

**Behavior:**
- Loads from localStorage
- Shows list of archived weeks
- Click to view recap
- Pagination for 52+ weeks

---

## Testing Strategy

### Unit Tests (Jest)

Located in `__tests__/` folders:

**Test files:**
- `emotionalGuardrails.test.js` — Tone validation rules
- `derivativeSelector.test.js` — Derivative choice logic
- `expressionEngine.test.js` — LLM vs template flow
- `signalComposer.test.js` — Signal message generation
- `sectionAssemblers.test.js` — Template rendering

**Run:** `npm run test`

### Integration Tests

Manual scenarios (see `ARECIBO_SCENARIO_TESTS.md`):
1. Victory week (all metrics high)
2. Tough week (failed metrics)
3. First week (no prior data)
4. No LLM (fallback templates)
5. Mobile viewport + share

---

## Common Tasks

### Adding a New Derivative

**Example: Add 'standby' pose to reflection**

1. **Update `derivativeSelector.js`:**
   ```javascript
   function selectReflectionDerivative(weekData, bondLevel) {
     // ... existing logic ...
     if (bondLevel >= 2 && isLowActivityWeek(weekData)) {
       return 'standby';  // NEW
     }
   }
   ```

2. **Update `sectionAssemblers.js`:**
   ```javascript
   const reflectionMessages = {
     victory: (data) => "The companion celebrates...",
     vigil: (data) => "...",
     standby: (data) => "The companion waits patiently...",  // NEW
   };
   ```

3. **Update `areciboPrompts.js`:**
   ```
   Available reflection poses:
   - victory: celebratory
   - vigil: watchful
   - standby: patient, ready  // NEW
   ```

4. **Update `emotionalGuardrails.js`:**
   ```javascript
   const validByMood = {
     victory: ['victory', 'celebration', ...],
     tough: ['vigil', 'guardian', ...],
     mixed: ['standby', 'working', ...],  // ADD standby
   };
   ```

5. **Test:** Write test for selector, validate tone on standby messages.

### Changing the LLM Model

In `expressionEngine.js`, `callAreciboLLM()`:
```javascript
const response = await Promise.race([
  llmService.call({
    model: 'claude-3-5-sonnet-20241022',  // Change here
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  }),
  timeoutPromise,
]);
```

**Recommended:** Keep Sonnet (fast + quality). Don't use Opus (too slow).

### Adjusting Timeout

In `expressionEngine.js`, `callAreciboLLM()`:
```javascript
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Arecibo LLM timeout')), 8000)  // milliseconds
);
```

**Trade-off:** Shorter = faster fallback, longer = more LLM attempts.

### Debugging a Tough Week Message

1. Set `weekData.weekSentiment = 'tough'`
2. Run `validateAreciboIntent(intent, weekData)`
3. Check `violations` array
4. Look for: lack of difficulty acknowledgment, fake triumph, guilt language

### Adding localStorage to Archive

Already implemented in `AreciboArchive.jsx`, but to extend:

```javascript
const archive = JSON.parse(localStorage.getItem('arecibo_archive') || '[]');
archive.push({
  weekNumber: 5,
  data: intent,
  savedAt: new Date().toISOString(),
});
localStorage.setItem('arecibo_archive', JSON.stringify(archive));
```

**Size check:** `JSON.stringify(archive).length` → keep under 5MB

---

## Performance Tuning

### Render Performance

**Canvas rendering (AreciboGrid):**
- Use `image-rendering: pixelated` for sharp pixels
- Keep scale factor reasonable (default 4x)
- Canvas size: 73px × 23px → renders as 292px × 92px at scale=4

**Section toggling:**
- CSS transitions (height, opacity)
- Use `useMemo` to avoid re-rendering section list
- Don't re-render all sections when one toggles

### Archive Performance

**Pagination:**
- Load only visible weeks (lazy load)
- Avoid rendering all 52 weeks at once
- Use virtual scrolling for 1000+ weeks

**localStorage**
- Compress data if approaching 5MB limit
- Delete archives older than 1 year
- Consider IndexedDB for larger datasets

### LLM Performance

**8-second timeout:** If hitting regularly:
1. Check network latency
2. Consider shorter user prompt
3. Reduce model size (but not below Sonnet)
4. Batch requests (if multiple recaps in session)

---

## Troubleshooting

### Common Issues

**Issue:** "Arecibo LLM timeout"
- **Cause:** Network slow or LLM overloaded
- **Fix:** Check timeout value, consider fallback templates, check API key

**Issue:** No sections rendering
- **Cause:** intent.sections undefined
- **Fix:** Check expressionEngine returned valid object, validate areciboIntent schema

**Issue:** Share card blank on mobile
- **Cause:** Canvas not sized correctly for mobile
- **Fix:** Check viewport scaling, test on actual device

**Issue:** Old recaps not showing in archive
- **Cause:** localStorage cleared or corrupted
- **Fix:** Check localStorage quota, verify JSON parse succeeds

---

## Extension Points

### 1. Custom Colors

In `styles.module.css` and `AreciboGrid.jsx` color mapping:
```javascript
const colors = {
  0: '#000000',  // Black
  1: '#8b5cf6',  // Purple (bills)
  2: '#10b981',  // Green (habits)
  3: '#3b82f6',  // Blue (meetings)
  // Add custom colors here
};
```

### 2. New Section Types

See "Adding a New Derivative" above. Same pattern for entire new sections.

### 3. Custom Fallback Templates

Override `sectionAssemblers.js` functions with your own templates.

### 4. Callbacks to Past Weeks

Enhance `signalComposer.js` to support more complex callbacks (multi-week patterns, milestones, etc.).

---

## Code Standards

- **ESLint:** React recommended rules
- **Format:** Prettier (2-space indent)
- **Comments:** JSDoc for all exported functions
- **Tests:** >80% coverage for core logic
- **CSS:** BEM-style naming (`.section__title`, `.button--primary`)

---

## Resources

- **System README:** `ARECIBO_SYSTEM_README.md`
- **Component API:** `src/components/arecibo/README.md`
- **Function signatures:** `src/utils/arecibo/API.md`
- **Examples:** `src/components/arecibo/QUICK_REFERENCE.md`
- **Troubleshooting:** `ARECIBO_TROUBLESHOOTING.md`

---

**Questions?** Start with the README, then check API.md, then dive into the code comments. Everything is documented.
