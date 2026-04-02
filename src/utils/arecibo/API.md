# Arecibo Expression Engine - API Reference

## Main Functions

### `generateAreciboIntent(params)`

**Purpose:** Generate a complete AreciboIntent for a given week.

**Signature:**
```javascript
async function generateAreciboIntent({
  weekData,          // WeekData object (required)
  bondLevel,         // 1-5 (required)
  tasteProfile,      // Object (optional, default {})
  llmBudget,         // Number (optional, default 1)
  llmService,        // Service (optional, default null)
  previousWeekData   // WeekData (optional, for callbacks)
})
```

**Returns:**
```javascript
Promise<{
  weekNumber: number,
  sections: {
    count: {...},
    elements: {...},
    pattern: {...},
    thread: {...},
    reflection: {...},
    kingdom: {...},
    signal: {...}
  }
}>
```

**Behavior:**
1. If `llmBudget > 0` and `llmService` provided: Try LLM call (8-second timeout)
2. If LLM succeeds and passes validation: Return LLM intent
3. Otherwise: Fall back to deterministic templates
4. Always returns valid AreciboIntent (never null/undefined)

**Example:**
```javascript
import { generateAreciboIntent } from './expressionEngine.js';

const intent = await generateAreciboIntent({
  weekData: {
    weekNumber: 5,
    billsPaid: 3,
    billsTotal: 4,
    habitsCompleted: 12,
    habitsTotal: 14,
    meetings: 4,
    daysActive: 6,
    bondXpEarned: 75,
    activeHabits: [...],
    dailyIntensity: [3, 5, 7, 6, 8, 4, 2],
    longestStreak: { habit: 'meditation', days: 12 },
    nearestMilestone: { type: 'streak', daysAway: 3, target: 14 },
    weekSentiment: 'mixed',
    bondLevel: 3,
    companionName: 'Companion',
    kingdomName: 'MyKingdom',
  },
  bondLevel: 3,
  tasteProfile: {
    favoriteSymbols: ['lantern'],
    favoriteSources: ['Marcus Aurelius'],
    favoriteItems: ['guitar'],
    faithMode: false,
  },
  llmBudget: 1,
  llmService: claudeService,
});
```

---

### `composeSignalMessage(params)`

**Purpose:** Generate the SIGNAL section message (Section 7).

**Signature:**
```javascript
function composeSignalMessage({
  weekData,          // WeekData object (required)
  bondLevel,         // 1-5 (required)
  tasteProfile,      // Object (optional, default {})
  previousWeekData   // WeekData (optional, for callbacks)
})
```

**Returns:**
```javascript
{
  derivative: string,  // 'fact_grounded' | 'quote' | 'verse' | 'symbolic' | 'callback'
  message: string,     // The actual message text
  source: string|null  // Attribution (for quote/verse/callback)
}
```

**Message Types:**
- **fact_grounded:** "3 bills cleared. 12 habits held. Mixed week." (all Bond Levels)
- **quote:** "A transmission from Marcus Aurelius: ..." (Bond 4+)
- **verse:** "A verse for this victory week: ..." (Bond 5 + faith mode)
- **symbolic:** "🏮" (Bond 3+, requires favoriteSymbols)
- **callback:** "Week 4 started this. Still going." (Bond 5 + previousWeekData)

**Example:**
```javascript
import { composeSignalMessage } from './signalComposer.js';

const signal = composeSignalMessage({
  weekData: { weekSentiment: 'tough', billsPaid: 2, ... },
  bondLevel: 1,
  tasteProfile: {},
  previousWeekData: null,
});

console.log(signal.message);  // "Hard week. 2 bills cleared. That counts."
```

---

### `validateAreciboIntent(intent, weekData, tasteProfile)`

**Purpose:** Validate that an AreciboIntent respects all guardrails.

**Signature:**
```javascript
function validateAreciboIntent(
  areciboIntent,  // AreciboIntent object
  weekData,       // WeekData (for sentiment context)
  tasteProfile    // Taste profile (for Bond Level validation)
)
```

**Returns:**
```javascript
{
  valid: boolean,        // true if no critical errors
  errors: string[],      // Critical violations (break output)
  warnings: string[]     // Non-critical issues (log but accept)
}
```

**What It Checks:**
- All 7 sections present
- All derivatives valid for their section type
- No therapy-speak, guilt, fake triumph, patronizing language
- Reflection pose matches week sentiment
- Signal derivative respects Bond Level gates
- Message quality (not empty, appropriate length)

**Example:**
```javascript
import { validateAreciboIntent } from './emotionalGuardrails.js';

const result = validateAreciboIntent(intent, weekData, tasteProfile);

if (!result.valid) {
  console.error('Validation failed:', result.errors);
  // Fall back to templates or reject
} else if (result.warnings.length > 0) {
  console.warn('Non-critical issues:', result.warnings);
}
```

---

## Supporting Functions

### `getAreciboSystemPrompt(params)`

**Purpose:** Generate sentiment-aware system prompt for Claude Sonnet.

**From:** `areciboPrompts.js`

**Signature:**
```javascript
function getAreciboSystemPrompt({
  companionName,  // string
  userName,       // string (optional, default 'friend')
  weekSentiment,  // 'victory' | 'tough' | 'mixed'
  bondLevel       // 1-5
})
```

**Returns:** String (system prompt for LLM)

---

### `computeWeekSentiment(billsPaid, billsTotal, habitsCompleted, habitsTotal)`

**Purpose:** Determine week sentiment from statistics.

**From:** `expressionEngine.js`

**Signature:**
```javascript
function computeWeekSentiment(billsPaid, billsTotal, habitsCompleted, habitsTotal)
```

**Returns:** `'victory' | 'tough' | 'mixed'`

**Logic:**
- **tough:** billsPaid < billsTotal * 0.5 OR habitsCompleted < habitsTotal * 0.5
- **victory:** billsPaid === billsTotal AND habitsCompleted > habitsTotal * 0.8
- **mixed:** Everything else

---

### `validateEmotionalGuardrails(intent, weekSentiment)`

**Purpose:** Check for therapy-speak, guilt, fake triumph, etc.

**From:** `emotionalGuardrails.js`

**Signature:**
```javascript
function validateEmotionalGuardrails(areciboIntent, weekSentiment)
```

**Returns:**
```javascript
{
  valid: boolean,
  violations: string[],     // List of detected anti-patterns
  severity: 'clean' | 'warning' | 'critical'
}
```

---

## Data Structures

### WeekData

```javascript
{
  weekNumber: number,              // 1-52
  billsPaid: number,               // 0+
  billsTotal: number,              // 0+
  habitsCompleted: number,         // 0+
  habitsTotal: number,             // 0+
  meetings: number,                // 0+
  daysActive: number,              // 0-7
  bondXpEarned: number,            // 0+
  activeHabits: [{                 // Array
    key: string,
    name: string,
    completed: number,
    total: number
  }],
  dailyIntensity: [number, ...],  // 7 values (0-10 scale)
  longestStreak: {                 // Or null
    habit: string,
    days: number
  },
  nearestMilestone: {              // Or null
    type: string,
    daysAway: number,
    target: number
  },
  weekSentiment: 'victory' | 'tough' | 'mixed',
  bondLevel: 1 | 2 | 3 | 4 | 5,
  companionName: string,
  kingdomName: string,
  weeksEngaged: number             // Optional
}
```

### TasteProfile

```javascript
{
  favoriteSymbols: string[],       // ['lantern', 'bird', ...]
  favoriteSources: string[],       // ['Marcus Aurelius', ...]
  favoriteItems: string[],         // ['guitar', 'book', ...]
  faithMode: boolean,              // For verse transmission
  userName: string                 // Optional
}
```

### AreciboIntent (Output)

See the main spec for full structure. All sections guaranteed present.

---

## Error Handling

All functions are defensive:

### `generateAreciboIntent`
- LLM timeout (8s) → fallback to templates
- LLM error → fallback to templates
- Bad JSON response → fallback to templates
- Validation failure → fallback to templates
- **Never throws.** Always returns valid intent.

### `composeSignalMessage`
- Missing taste profile → fallback to fact_grounded
- Invalid Bond Level → use fact_grounded
- Incomplete previous week data → skip callback

### Validation functions
- Check all preconditions
- Return descriptive error messages
- Never throw on bad input

---

## Bond Level Reference

### Bond 1-2
- Message types: fact_grounded only
- Signal source: null
- Reflection item: null
- Limitations: No personalization

### Bond 3
- Message types: fact_grounded, symbolic
- Can reference: favoriteSymbols
- Limitations: No quotes or callbacks

### Bond 4
- Message types: fact_grounded, symbolic, quote
- Can reference: favoriteSymbols, favoriteSources
- Limitations: No verse or callbacks

### Bond 5
- Message types: fact_grounded, symbolic, quote, verse, callback
- Can reference: Everything
- Can do: Deep personalization, multi-week narratives

---

## Sentiment Protocol

### Victory Week
- Use: celebration, victory, growth_thread poses
- Signal: can be quote, callback, or symbolic
- Tone: Genuine celebration (not over-the-top)

### Tough Week
- Use: vigil, guardian, resting, working poses
- Signal: ALWAYS fact_grounded
- Tone: Honest, dignified, no reframing
- **HARD-WEEK DIGNITY:** Stand WITH user, not above

### Mixed Week
- Use: working, resting, or neutral poses
- Signal: fact_grounded with balanced narrative
- Tone: Hold both sides in tension

---

## Testing

Run tests:
```bash
npm test
```

Run specific test file:
```bash
npm test -- emotionalGuardrails.test.js
```

Watch mode:
```bash
npm run test:watch
```

---

## Integration Checklist

- [ ] Import `generateAreciboIntent`
- [ ] Provide `weekData` from factStore
- [ ] Provide `bondLevel` from progression system
- [ ] Optionally provide `tasteProfile` from user settings
- [ ] Optionally provide `llmService` (Claude Sonnet)
- [ ] Call async function: `const intent = await generateAreciboIntent(...)`
- [ ] Pass intent to gridRenderer for visualization
- [ ] Validate output with `validateAreciboIntent()`

---

**That's it. The API is simple, forgiving, and reliable.**
