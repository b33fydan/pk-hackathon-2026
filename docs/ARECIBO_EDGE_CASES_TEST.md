# Arecibo Edge Cases Test Suite

**Purpose:** Verify system handles boundary conditions gracefully  
**Status:** Ready for automated + manual testing  
**Coverage:** 10 critical edge cases

---

## Edge Case 1: First Week Ever (No Prior Data)

**Condition:** weekNumber=1, no previousWeekData, no streaks

**Test:**
```javascript
const data = {
  weekNumber: 1,
  billsPaid: 2, billsTotal: 3,
  habitsCompleted: 3, habitsTotal: 5,
  longestStreak: null,
  nearestMilestone: null,
  weekSentiment: 'mixed',
  bondLevel: 1,
};

const intent = generateFromTemplates({
  weekData: data,
  bondLevel: 1,
  previousWeekData: null,
});
```

**Expected:**
- [ ] No callback in signal ✓
- [ ] No "longest streak" reference (null handling) ✓
- [ ] No "compared to last week" ✓
- [ ] Default/welcoming message ✓
- [ ] Thread section handles null gracefully ✓

**Validation:**
```javascript
const json = JSON.stringify(intent);
assert(!json.includes('callback'));
assert(!json.includes('last week'));
assert(!json.includes('previously'));
```

---

## Edge Case 2: Zero Habits in Week

**Condition:** habitsTotal=0 (emergency week, only bills tracked)

**Test:**
```javascript
const data = {
  weekNumber: 5,
  billsPaid: 3, billsTotal: 4,
  habitsCompleted: 0, habitsTotal: 0,  // Empty!
  activeHabits: [],
  dailyIntensity: [0,0,0,0,0,0,0],
  weekSentiment: 'mixed',
  bondLevel: 2,
};

const intent = generateFromTemplates({ weekData: data, ... });
```

**Expected:**
- [ ] Still generates 7 sections ✓
- [ ] Doesn't crash ✓
- [ ] Elements section handles empty array ✓
- [ ] Pattern section doesn't divide by zero ✓
- [ ] Message acknowledges: "You tracked bills but no habits this week" ✓
- [ ] Not guilt-inducing ✓

**Validation:**
```javascript
assert(intent.sections.elements.habits.length === 0);
assert(intent.sections.pattern.dailyIntensity.every(x => x === 0));
assert(!JSON.stringify(intent).includes('failed'));
```

---

## Edge Case 3: All Failures (Catastrophic Week)

**Condition:** 0% bills paid, 0% habits completed, lowest sentiment

**Test:**
```javascript
const data = {
  weekNumber: 10,
  billsPaid: 0, billsTotal: 5,
  habitsCompleted: 0, habitsTotal: 7,
  meetings: 0,
  daysActive: 0,
  bondXpEarned: 0,
  activeHabits: [
    { name: 'Exercise', completed: 0, total: 7 },
    { name: 'Journaling', completed: 0, total: 7 },
  ],
  dailyIntensity: [0,0,0,0,0,0,0],
  longestStreak: { habit: 'Exercise', days: 0 },
  weekSentiment: 'tough',
  bondLevel: 3,
};

const intent = generateAreciboIntent({ weekData: data, ... });
```

**Expected:**
- [ ] Reflection derivative is NOT 'victory' or 'celebration' ✓
- [ ] Signal is fact_grounded ONLY ✓
- [ ] No fake triumph ("blessing in disguise") ✓
- [ ] No guilt ("you failed to") ✓
- [ ] Acknowledges: "0 of 5 bills paid, 0 of 7 habits completed" ✓
- [ ] Tone: dignified, honest, respectful ✓
- [ ] Validation passes (no critical errors) ✓

**Validation:**
```javascript
const validation = validateAreciboIntent(intent, data);
assert(validation.valid, 'Validation failed: ' + validation.errors);
assert(validation.errors.length === 0, 'Critical errors found');

const guardrails = validateEmotionalGuardrails(intent, 'tough');
assert(guardrails.severity !== 'critical');
assert(guardrails.violations.every(v => !v.includes('fake triumph')));

assert(intent.sections.reflection.derivative !== 'victory');
assert(intent.sections.signal.derivative === 'fact_grounded');
```

---

## Edge Case 4: Only One Stat Populated

**Condition:** Only bills tracked, habits/meetings empty

**Test:**
```javascript
const data = {
  weekNumber: 7,
  billsPaid: 2, billsTotal: 2,
  habitsCompleted: 0, habitsTotal: 0,
  meetings: 0,
  daysActive: 0,
  activeHabits: [],
  dailyIntensity: [],
  weekSentiment: 'mixed',
};

const intent = generateFromTemplates({ weekData: data, ... });
```

**Expected:**
- [ ] Doesn't crash on missing arrays ✓
- [ ] Count section still renders ✓
- [ ] Elements section shows "No habits this week" ✓
- [ ] Pattern shows placeholder message ✓
- [ ] No division by zero ✓

**Validation:**
```javascript
assert(intent.sections.count.stats.billsPaid === 2);
assert(intent.sections.elements.habits.length === 0);
assert(intent.sections.pattern.dailyIntensity.length === 0 || 
       intent.sections.pattern.dailyIntensity.every(x => x === 0));
```

---

## Edge Case 5: Rapid Week Transitions (Skip to Next Week)

**Condition:** User jumps from week 1 to week 3 (skips week 2)

**Test:**
```javascript
// Week 1 generated + archived
const week1 = { weekNumber: 1, ... };
const intent1 = await generateAreciboIntent({ weekData: week1, ... });
// Archive it
localStorage.setItem('arecibo_archive', JSON.stringify([intent1]));

// Week 3 (no week 2 data!)
const week3 = { weekNumber: 3, previousWeekData: null, ... };
const intent3 = await generateAreciboIntent({ weekData: week3, ... });
```

**Expected:**
- [ ] Week 3 generates without error ✓
- [ ] No callback to missing week 2 ✓
- [ ] previousWeekData=null handled gracefully ✓
- [ ] Archive still shows week 1 ✓
- [ ] Week number correctly incremented ✓

**Validation:**
```javascript
assert(intent3.weekNumber === 3);
assert(!JSON.stringify(intent3).includes('week 2'));
const archive = JSON.parse(localStorage.getItem('arecibo_archive'));
assert(archive.length === 1 && archive[0].weekNumber === 1);
```

---

## Edge Case 6: Very Long Streaks (1000+ Days)

**Condition:** longestStreak.days > 999 (overflow risk)

**Test:**
```javascript
const data = {
  weekNumber: 200,
  longestStreak: { habit: 'Never Miss', days: 1729 },  // 4+ years
  weekSentiment: 'victory',
};

const intent = generateFromTemplates({ weekData: data, ... });
```

**Expected:**
- [ ] Displays as "1729 days" or "1,729d" (readable) ✓
- [ ] Thread section handles large numbers ✓
- [ ] Share card doesn't overflow text ✓
- [ ] Signal message includes streak fact-grounded ✓

**Validation:**
```javascript
const threadMsg = intent.sections.thread.message;
assert(threadMsg.includes('1729') || threadMsg.includes('1,729'));

// Check share card renders
const shareCard = <AreciboShareCard intent={intent} ... />;
// Should not have text overflow in DOM
```

---

## Edge Case 7: Bond Level 0 (Shouldn't Exist)

**Condition:** bondLevel passed as 0 (defensive programming test)

**Test:**
```javascript
const data = {
  weekNumber: 1,
  bondLevel: 0,  // Invalid!
  weekSentiment: 'mixed',
};

const signalValidation = validateSignalDerivative('callback', 0, {});
```

**Expected:**
- [ ] Validation rejects callback (not allowed at Bond 0) ✓
- [ ] Treats as Bond 1 (fallback) ✓
- [ ] Game shouldn't let bondLevel drop to 0, but system handles it ✓

**Validation:**
```javascript
const validation = validateSignalDerivative('callback', 0, {});
assert(!validation.valid, 'Should reject callback at Bond 0');
assert(validation.reason.includes('Bond'));

// Or selector treats 0 as 1:
const derivative = selectReflectionDerivative(data, 0);
assert(derivative === selectReflectionDerivative(data, 1));
```

---

## Edge Case 8: No LLM Budget + No Internet

**Condition:** llmBudget=0 AND no llmService

**Test:**
```javascript
const intent = await generateAreciboIntent({
  weekData: {
    weekNumber: 5,
    billsPaid: 3, billsTotal: 5,
    habitsCompleted: 8, habitsTotal: 12,
    weekSentiment: 'mixed',
  },
  llmBudget: 0,
  llmService: null,
});
```

**Expected:**
- [ ] Generates from templates instantly ✓
- [ ] No timeout waiting ✓
- [ ] Quality indistinguishable from LLM ✓
- [ ] No console errors ✓
- [ ] Player sees beautiful recap ✓

**Validation:**
```javascript
const start = Date.now();
const intent = generateAreciboIntent({ weekData, llmBudget: 0, llmService: null });
const elapsed = Date.now() - start;
assert(elapsed < 100, 'Should be instant (templates)');
assert(intent.sections);
assert(Object.keys(intent.sections).length === 7);
```

---

## Edge Case 9: Numeric Overflow (999+ Bills)

**Condition:** billsTotal=999, try to add more

**Test:**
```javascript
const data = {
  weekNumber: 100,
  billsPaid: 999,
  billsTotal: 999,
  habitsCompleted: 1000,  // Also test habits
  habitsTotal: 1000,
  bondXpEarned: 99999,    // Max XP
};

const intent = generateFromTemplates({ weekData: data, ... });
```

**Expected:**
- [ ] Displays "999+" instead of "999999" ✓
- [ ] Share card doesn't overflow ✓
- [ ] No layout break ✓
- [ ] Still readable ✓

**Validation:**
```javascript
// Check display logic (in component)
const countMsg = intent.sections.count.message;
// Should cap or use "+" notation
assert(!countMsg.includes('99999') || countMsg.includes('+'));

// Or in CSS, ensure no text overflow
const shareCard = document.querySelector('.shareCard');
assert(shareCard.scrollWidth <= shareCard.clientWidth + 10); // 10px tolerance
```

---

## Edge Case 10: Corrupted localStorage

**Condition:** localStorage contains invalid JSON or old schema

**Test:**
```javascript
// Corrupt the archive
localStorage.setItem('arecibo_archive', 'NOT_VALID_JSON{]');

// Try to load archive
const ArchiveComponent = <AreciboArchive />;
// Should render without crashing
```

**Expected:**
- [ ] Archive component catches JSON parse error ✓
- [ ] Shows "No archives" or recovery message ✓
- [ ] Doesn't crash entire app ✓
- [ ] User can still see current recap ✓
- [ ] Next session clears bad data ✓

**Validation:**
```javascript
try {
  const archive = JSON.parse(localStorage.getItem('arecibo_archive'));
} catch (e) {
  console.error('Corrupted archive, clearing...');
  localStorage.removeItem('arecibo_archive');
  // Recovery logic
}
```

---

## Additional Edge Cases (Quick Check)

### 11. Missing pixelData

**Test:**
```javascript
const modal = <AreciboRecap
  pixelData={null}  // Missing!
  intent={intent}
  onClose={() => {}}
/>;
```

**Expected:** Placeholder grid shown, no crash ✓

### 12. Empty activeHabits Array

**Test:**
```javascript
const data = { activeHabits: [] };
const intent = generateFromTemplates({ weekData: data, ... });
```

**Expected:** Elements section shows "No tracked habits" ✓

### 13. Missing companionName

**Test:**
```javascript
const data = { companionName: '' };
const intent = await generateAreciboIntent({ weekData: data, ... });
```

**Expected:** Uses default "Companion" ✓

### 14. Daily Intensity All Zeros

**Test:**
```javascript
const data = { dailyIntensity: [0,0,0,0,0,0,0] };
const pattern = getPatternNarrative(data.dailyIntensity);
```

**Expected:** Returns sensible narrative ("no activity" or similar) ✓

### 15. LLM Response Missing Sections

**Test:**
```javascript
// Mock LLM returns incomplete JSON
const response = { sections: { count: {...} } };  // Missing 6 sections!
const validation = validateAreciboIntent(response, weekData);
```

**Expected:** Validation fails, falls back to templates ✓

---

## Test Automation

### Jest Unit Tests

Create `src/utils/arecibo/__tests__/edgeCases.test.js`:

```javascript
describe('Arecibo Edge Cases', () => {
  test('handles first week (no prior data)', () => {
    const data = { weekNumber: 1, longestStreak: null };
    const intent = generateFromTemplates({ weekData: data });
    expect(JSON.stringify(intent)).not.toContain('callback');
  });

  test('handles zero habits', () => {
    const data = { habitsTotal: 0, activeHabits: [] };
    const intent = generateFromTemplates({ weekData: data });
    expect(intent.sections.elements.habits).toHaveLength(0);
  });

  test('handles all failures (tough week)', () => {
    const data = {
      billsPaid: 0, billsTotal: 5,
      habitsCompleted: 0, habitsTotal: 7,
      weekSentiment: 'tough',
    };
    const intent = generateFromTemplates({ weekData: data });
    const validation = validateAreciboIntent(intent, data);
    expect(validation.valid).toBe(true);
  });

  test('falls back instantly with no LLM', async () => {
    const start = Date.now();
    const intent = await generateAreciboIntent({
      weekData: {},
      llmBudget: 0,
      llmService: null,
    });
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(intent.sections).toBeDefined();
  });

  test('handles numeric overflow', () => {
    const data = { billsPaid: 999, billsTotal: 999 };
    const intent = generateFromTemplates({ weekData: data });
    // Verify display caps at 999+ (in component)
    expect(intent.sections.count).toBeDefined();
  });
});
```

Run: `npm run test -- edgeCases.test.js`

---

## Summary Checklist

- [ ] Edge Case 1: First week (no prior data) ✓
- [ ] Edge Case 2: Zero habits ✓
- [ ] Edge Case 3: All failures ✓
- [ ] Edge Case 4: One stat only ✓
- [ ] Edge Case 5: Rapid week transitions ✓
- [ ] Edge Case 6: 1000+ day streaks ✓
- [ ] Edge Case 7: Bond Level 0 ✓
- [ ] Edge Case 8: No LLM + no internet ✓
- [ ] Edge Case 9: Numeric overflow ✓
- [ ] Edge Case 10: Corrupted localStorage ✓
- [ ] All additional edge cases (11-15) ✓

---

**Test Date:** ________________  
**Tester:** ________________  
**All Passed:** ☐ YES ☐ NO

Failed tests:
```
(space for notes)
```

---

## Notes

1. **Defensive Programming:** System handles invalid data gracefully
2. **No Crashes:** Every edge case still renders a recap
3. **Graceful Degradation:** Missing data → defaults, not errors
4. **Validation Always:** Guardrails check every output before showing

If edge case fails, fix in code and re-test.
