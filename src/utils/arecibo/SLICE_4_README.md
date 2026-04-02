# Arecibo Slice 4: Expression Engine + Intent Generator

**Status:** ✅ COMPLETE

This slice implements the LLM integration layer and expression engine for Arecibo Recap generation. It's where the system takes raw week data and generates a personalized, emotionally-aware Arecibo Intent.

## What's Included

### Core Files

1. **expressionEngine.js** (~400 lines)
   - Main entry point: `generateAreciboIntent(weekData, bondLevel, tasteProfile, llmBudget, llmService)`
   - LLM integration with 8-second timeout
   - Graceful fallback to deterministic templates
   - Week sentiment detection
   - Week context assembly from factStore

2. **areciboPrompts.js** (~350 lines)
   - System prompts for Claude Sonnet (sentiment-aware)
   - Three variants: victory week, tough week, mixed week
   - Strict JSON output contract
   - Emotional guardrails enforcement in prompts
   - Hard-week dignity protocol specification

3. **signalComposer.js** (~350 lines)
   - Special handling for Section 7 (THE SIGNAL)
   - 5 message types:
     - Fact-grounded (all Bond Levels)
     - Quote transmission (Bond 4+)
     - Verse transmission (Bond 5 + faith mode)
     - Symbolic message (Bond 3+)
     - Callback message (Bond 5, requires history)
   - Bond Level gating logic
   - Message validation

4. **emotionalGuardrails.js** (~300 lines)
   - Critical validation layer
   - Detects: therapy-speak, guilt-induction, fake triumph, patronizing language
   - Hard-week dignity protocol enforcement
   - Bond Level derivative gating
   - Reflection pose validation
   - Signal derivative validation

### Test Files

1. **emotionalGuardrails.test.js** (~500 lines, 10+ critical tests)
   - ✅ Test 1: Therapy-speak detection
   - ✅ Test 2: Guilt-inducing language detection
   - ✅ Test 3: Fake triumph detection (CRITICAL)
   - ✅ Test 4: Patronizing language detection
   - ✅ Test 5: Therapist-speak detection
   - ✅ Test 6: Hard-week dignity protocol
   - ✅ Test 7: Victory week appropriateness
   - ✅ Test 8: Bond Level gating validation
   - ✅ Test 9: Mixed week balance
   - ✅ Test 10: Full integration validation

2. **signalComposer.test.js** (~400 lines)
   - All 5 message types tested
   - Bond Level progression (1→5)
   - Message validation
   - Sentiment-appropriate messaging
   - Tough week protocol

3. **expressionEngine.test.js** (~450 lines)
   - Template fallback (no LLM)
   - All 7 sections generated
   - Sentiment detection (victory/tough/mixed)
   - Bond Level gating
   - Hard-week handling
   - LLM error fallback
   - 8-second timeout enforcement
   - Determinism verification
   - End-to-end integration

## How It Works

### The Flow

```
weekData + bondLevel + tasteProfile
    ↓
generateAreciboIntent()
    ↓
    ├─→ [If LLM budget > 0 & service available]
    │   ├─→ getAreciboSystemPrompt() [sentiment-aware]
    │   ├─→ callAreciboLLM() [8-second timeout]
    │   ├─→ validateEmotionalGuardrails() [CRITICAL]
    │   └─→ Return LLM intent OR
    │
    └─→ [Fallback to templates]
        ├─→ selectCountDerivative()
        ├─→ selectElementsDerivative()
        ├─→ selectPatternDerivative()
        ├─→ selectThreadDerivative()
        ├─→ selectReflectionDerivative()
        ├─→ selectKingdomDerivative()
        ├─→ composeSignalMessage()
        └─→ Return deterministic intent
```

### AreciboIntent Contract

```typescript
{
  weekNumber: number,
  sections: {
    count: { derivative: string, stats: {...} },
    elements: { derivative: string, habits: [{key, name, completed, total}] },
    pattern: { derivative: string, dailyIntensity: number[], narrative: string },
    thread: { derivative: string, longestStreak: {...}, nearestMilestone: {...} },
    reflection: { derivative: string, weekSentiment: string, heldItem?: string },
    kingdom: { derivative: string, spotlightObject?: string, totalStructures: number },
    signal: { derivative: string, message: string, source?: string }
  }
}
```

All sections guaranteed to be present, all derivatives valid.

## Key Design Decisions

### 1. LLM Integration with Fallback
- Try LLM if budget > 0 and service available
- 8-second timeout (don't block UI)
- Graceful fallback to deterministic templates
- **Result:** Works with or without API access, playable without any LLM

### 2. Emotional Guardrails (The Critical Check)
The system is built around **NOT sounding like a corporate wellness app**:
- ❌ No therapy-speak ("your feelings are valid", "healing journey")
- ❌ No guilt-induction ("could have done better", "missed opportunity")
- ❌ No fake triumph on hard weeks ("blessing in disguise", "character building")
- ❌ No patronizing ("you're doing great!", "proud of you")
- ✅ Direct, honest, data-grounded messages
- ✅ Hard-week dignity protocol (standing WITH the user, not above)

Every LLM output is validated against these patterns. If it fails, the system falls back to templates.

### 3. Hard-Week Dignity Protocol
When week sentiment = 'tough':
- Acknowledge plainly: "This was a hard week."
- Honor what held: "You kept 2 of 5 habits. That counts."
- Use appropriate pose: 'vigil', 'guardian', not 'victory' or 'celebration'
- Signal message: ALWAYS 'fact_grounded' (no creativity, no reframing)
- Never reframe adversity as positive ("what you learned!", "stronger now!")

### 4. Bond Level Gating
Each message type is gated by Bond Level, respecting the user-AI relationship:
- **Bond 1-2:** Generic, safe. Only fact-grounded signals, generic items.
- **Bond 3:** Can reference user's stated symbols. Slightly more personal.
- **Bond 4:** Can quote the user's stated favorite sources.
- **Bond 5:** Full personalization. Callbacks to past weeks, faith mode, symbols-only messages.

### 5. Deterministic Template Fallback
Without LLM:
- Week number seeded hash → same week = same derivative selection
- No randomness, fully reproducible
- Still visually unique (different weeks get different data + different derivatives)
- Still beautiful (grid renderer makes it all look striking)
- **Result:** Game is playable 100% offline with no API key

## Usage Example

```javascript
import { generateAreciboIntent } from './expressionEngine.js';

const weekData = {
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
  kingdomName: 'TestKingdom',
};

const tasteProfile = {
  favoriteSymbols: ['lantern', 'bird'],
  favoriteSources: ['Marcus Aurelius'],
  favoriteItems: ['guitar'],
  faithMode: false,
};

// With LLM
const intent = await generateAreciboIntent({
  weekData,
  bondLevel: 3,
  tasteProfile,
  llmBudget: 1, // Use one LLM call
  llmService: claudeService, // Must implement .call()
});

// Without LLM (fallback)
const intent = await generateAreciboIntent({
  weekData,
  bondLevel: 3,
  tasteProfile,
  llmBudget: 0, // No LLM, use templates
});

// Both return the same AreciboIntent contract
```

## Validation & Testing

### Emotional Guardrails Tests (10+)
Each test covers a real anti-pattern:
1. Therapy-speak ("your feelings are valid")
2. Guilt ("could have done better")
3. Fake triumph ("but look how strong you are!")
4. Patronizing ("you're doing great!")
5. Therapist-speak ("you should consider")
6. Hard-week dignity (plain acknowledgment)
7. Victory appropriateness
8. Bond Level gating
9. Mixed week balance
10. Full integration

**All tests PASS** — the system correctly rejects inappropriate output.

### Critical Test: Tough Week
```javascript
// This PASSES (respects hard-week protocol)
"Hard week. 2 bills cleared. 8 habits held. That counts."

// This FAILS (fake triumph)
"Hard week, but look how strong you are!"

// This FAILS (therapy-speak)
"This is part of your healing journey."

// This FAILS (guilt)
"Could have done better this week."
```

## Integration Points

### With GridRenderer (Slice 1)
The AreciboIntent output feeds into the grid renderer:
```javascript
const intent = await generateAreciboIntent(...);
const gridPixels = renderAreciboGrid(intent); // From slice 1
```

### With FactStore
Week data is pulled from factStore via `assembleWeekContext()`:
```javascript
const weekData = assembleWeekContext({
  factStore,
  weekNumber: 5,
  habitsStore,
  kingdomStore,
});
```

### With Progression System
Bond Level comes from user progression:
```javascript
const bondLevel = user.bondLevel; // 1-5
const intent = await generateAreciboIntent({...bondLevel});
```

## What's NOT Included (Intentional)

- ❌ **Actual rendering:** That's gridRenderer's job (Slice 1)
- ❌ **Pixel grid mapping:** That's sectionAssemblers' job (Slice 2)
- ❌ **Derivative selection determinism:** That's derivativeSelector's job (Slice 3)
- ❌ **FactStore queries:** That's the data layer's job
- ❌ **UI components:** That's React's job

This layer **only** generates the intent. Everything else is handled by other slices.

## Proof of Done

✅ **Expression engine generates valid AreciboIntent** (matches contract)
✅ **LLM integration works with fallback** (8-second timeout, error handling)
✅ **Signal composer produces all 5 message types** (fact, quote, verse, symbolic, callback)
✅ **Emotional guardrails pass 10+ validation tests** (therapy-speak, guilt, fake triumph, patronizing)
✅ **Template fallback works** (fully deterministic, no LLM needed)
✅ **Bond Level gating verified** (all 5 levels tested)
✅ **Tough-week protocol respected** (read hard week messages aloud — no patronizing)
✅ **npm run build passes** (syntax valid, imports resolve)
✅ **No breaking changes** to existing stores/components (standalone module)

## Files Modified/Created

### New Files
- `expressionEngine.js` (400 lines) ✅
- `areciboPrompts.js` (350 lines) ✅
- `signalComposer.js` (350 lines) ✅
- `emotionalGuardrails.js` (300 lines) ✅
- `__tests__/emotionalGuardrails.test.js` (500 lines) ✅
- `__tests__/signalComposer.test.js` (400 lines) ✅
- `__tests__/expressionEngine.test.js` (450 lines) ✅

### Modified Files
- `package.json` (added jest, test scripts)
- `jest.config.js` (created for testing)

## Next Steps (Slice 5+)

This expression engine feeds into:
1. **Section rendering** (Slice 1 gridRenderer)
2. **Interactive decode UI** (show human-readable breakdowns when user taps)
3. **Share card generation** (PNG export with metadata)
4. **Weekly loop integration** (triggers at end of week)

Slice 4 is **complete and isolated** — all dependencies are interfaces, not concrete implementations.

---

**The Mission:** Generate Arecibo Recaps that are personal, honest, and beautiful — without sounding like a corporate wellness app. This slice delivers on that promise.
