# Arecibo Scenario Tests (End-to-End)

**Purpose:** Verify all 5 core scenarios work as designed  
**Status:** Ready for manual testing  
**Duration:** ~30 minutes per scenario

---

## Test Environment Setup

### Prerequisites
1. Clone/pull latest code
2. `npm install`
3. `npm run build` ✅
4. Start dev server: `npm run dev`
5. Open browser dev tools (F12)

### Test Data Prep

Each scenario requires specific weekData. Modify the mock data in test or manually in localStorage:

```javascript
// In browser console:
const testData = {
  weekNumber: 1,
  billsPaid: 5, billsTotal: 5,
  habitsCompleted: 10, habitsTotal: 10,
  meetings: 3,
  daysActive: 7,
  bondXpEarned: 50,
  activeHabits: [...],
  dailyIntensity: [5,6,7,8,8,9,10],
  longestStreak: { habit: 'Exercise', days: 45 },
  nearestMilestone: { type: 'Bill Mastery', daysAway: 2, target: 100 },
  weekSentiment: 'victory',
  bondLevel: 3,
  companionName: 'Aria',
  kingdomName: 'Silverhold',
};

localStorage.setItem('arecibo_test', JSON.stringify(testData));
```

---

## Scenario A: Victory Week

**Definition:** All metrics high (celebration + confidence)

### Setup
```javascript
const victoryData = {
  weekNumber: 1,
  billsPaid: 5,
  billsTotal: 5,           // 100% paid ✓
  habitsCompleted: 14,
  habitsTotal: 14,         // 100% completed ✓
  meetings: 4,
  daysActive: 7,           // All 7 days active ✓
  bondXpEarned: 75,        // High XP ✓
  activeHabits: [
    { name: 'Exercise', completed: 7, total: 7 },
    { name: 'Journaling', completed: 7, total: 7 },
  ],
  dailyIntensity: [8,8,9,9,9,10,10],  // Strong finish ✓
  longestStreak: { habit: 'Exercise', days: 127 },
  weekSentiment: 'victory',
  bondLevel: 4,
  companionName: 'Aria',
  kingdomName: 'Silverhold',
};
```

### Run Test

1. Load victory data
2. Call `generateAreciboIntent(victoryData)`
3. Render `AreciboRecap` with result

### Expected Behavior

✅ **Emotional Tone**
- [ ] Celebratory but not smug
- [ ] Acknowledges specific achievement ("All 5 bills paid, all habits completed")
- [ ] Not: "You're amazing!" or "You crushed it!"
- [ ] Yes: "You paid every bill and completed every habit."

✅ **Derivatives**
- [ ] Reflection derivative: `victory` or `celebration` ✓
- [ ] Count derivative: `detailed` ✓
- [ ] Pattern narrative: `strong_finish` ✓

✅ **Signal Message**
- [ ] Includes specific stats ("5/5", "127 days", etc.)
- [ ] Callback welcome (Bond 4 allows it)
- [ ] Not generic ("you did good")

✅ **Visual**
- [ ] Grid mostly green/blue (completed)
- [ ] Few or no red cells
- [ ] Share card looks appealing
- [ ] No console errors

### Read-Aloud Test

Read the entire recap aloud. Does it feel:
- [ ] Grounded in facts?
- [ ] Conversational?
- [ ] Like a friend who saw what you did?
- [ ] Or like an algorithm congratulating you?

If "algorithm," flag the language as too generic.

### Validation

```javascript
// In console:
const validation = validateAreciboIntent(intent, victoryData);
console.log(validation);
// Expected: { valid: true, errors: [], warnings: [] }
```

---

## Scenario B: Tough Week

**Definition:** Multiple failures (dignity without guilt)

### Setup
```javascript
const toughData = {
  weekNumber: 2,
  billsPaid: 2,
  billsTotal: 5,           // 60% unpaid = stressed ✗
  habitsCompleted: 5,
  habitsTotal: 14,         // 36% completed = hard week ✗
  meetings: 1,
  daysActive: 3,           // Only 3/7 days active ✗
  bondXpEarned: 10,        // Low XP ✗
  activeHabits: [
    { name: 'Exercise', completed: 2, total: 7 },
    { name: 'Journaling', completed: 3, total: 7 },
  ],
  dailyIntensity: [3,2,2,1,2,3,4],  // Slow finish ✗
  longestStreak: { habit: 'Exercise', days: 0 },  // Lost streak ✗
  weekSentiment: 'tough',
  bondLevel: 2,
  companionName: 'Aria',
  kingdomName: 'Silverhold',
};
```

### Run Test

1. Load tough data
2. Call `generateAreciboIntent(toughData)`
3. Check validation BEFORE rendering

### Expected Behavior

✅ **Emotional Guardrails (CRITICAL)**
- [ ] No fake triumph ("but look how strong you are!")
- [ ] No guilt ("you failed to")
- [ ] No therapy-speak ("healing journey")
- [ ] No patronizing ("you got this!")

✅ **Actual Tone**
- [ ] Acknowledges difficulty plainly: "This was a hard week."
- [ ] Facts-grounded: "2 of 5 bills paid, 5 of 14 habits completed"
- [ ] Not reframing failure as success
- [ ] Respectful silence (no inspirational false hope)

✅ **Derivatives**
- [ ] Reflection derivative: `vigil` or `guardian` ✓
- [ ] Pattern narrative: `slow_finish` ✓
- [ ] Signal: fact_grounded ONLY ✓ (no callbacks)

✅ **Visual**
- [ ] Grid shows red/yellow cells (failures)
- [ ] Reflection figure in defensive/watching pose
- [ ] Companion drawn smaller or more reserved
- [ ] Color palette shifts toward muted tones

### Read-Aloud Test (CRITICAL)

Read aloud slowly. Listen for:
- [ ] Does it feel honest?
- [ ] Does it feel respectful?
- [ ] Or does it feel like corporate HR trying to motivate me?
- [ ] Or does it feel like guilt-tripping?
- [ ] Or does it feel like fake enthusiasm?

If ANY of those, fix the message before launch.

### Validation

```javascript
// In console:
const validation = validateAreciboIntent(intent, toughData);
console.log(validation);
// Expected: { valid: true, errors: [], warnings: [] }

// Specifically check:
const guardrails = validateEmotionalGuardrails(intent, 'tough');
console.log(guardrails);
// Expected: no violations, severity 'clean'
```

### Manual Check

```javascript
// Extract all text from intent
const allText = JSON.stringify(intent).toLowerCase();

// Should NOT contain:
const forbidden = [
  /blessing in disguise/,
  /actually made you stronger/,
  /you failed/,
  /healing journey/,
  /you got this/,
];

forbidden.forEach(pattern => {
  if (pattern.test(allText)) {
    console.error('❌ FORBIDDEN PHRASE FOUND:', allText.match(pattern)[0]);
  }
});
```

---

## Scenario C: First Week

**Definition:** Brand new player (no history)

### Setup
```javascript
const firstWeekData = {
  weekNumber: 1,
  billsPaid: 3,
  billsTotal: 4,
  habitsCompleted: 5,
  habitsTotal: 7,
  meetings: 0,
  daysActive: 5,
  bondXpEarned: 20,
  activeHabits: [
    { name: 'Learning to Track', completed: 5, total: 7 },
  ],
  dailyIntensity: [2,3,4,5,4,5,6],
  longestStreak: null,     // No prior data ✗
  nearestMilestone: null,  // No prior data ✗
  weekSentiment: 'mixed',
  bondLevel: 1,            // Just started ✗
  companionName: 'Aria',
  kingdomName: 'Unnamed',  // May be default
  previousWeekData: null,  // KEY: no callback data
};
```

### Run Test

1. Load first week data
2. Call `generateAreciboIntent(firstWeekData, { previousWeekData: null })`
3. Ensure NO callbacks or streak references

### Expected Behavior

✅ **No Callbacks**
- [ ] No "you've been doing this for X weeks"
- [ ] No "compared to last week"
- [ ] No streak numbers (no prior data)
- [ ] No milestone callbacks

✅ **Welcoming Tone**
- [ ] Acknowledges: "You started tracking this week"
- [ ] Encourages but honestly: "You completed 5 of 7 habits"
- [ ] Sets expectations: "This is week 1, let's build from here"
- [ ] NOT: "Welcome! You're already crushing it!"

✅ **Simple Message**
- [ ] No complex derivatives (Bond 1 limit)
- [ ] Signal: fact_grounded only
- [ ] No callbacks, symbolic, or quotes

✅ **Derivatives**
- [ ] Reflection: basic pose (not celebration)
- [ ] Count: simpler version
- [ ] Thread: minimal data

### Validation

```javascript
const validation = validateAreciboIntent(intent, firstWeekData);
console.log(validation);

// Check: no callback references
const hasCallback = JSON.stringify(intent).includes('callback') || 
                   JSON.stringify(intent).includes('last week') ||
                   JSON.stringify(intent).includes('previously');
console.assert(!hasCallback, '❌ Callback found in first week!');
```

---

## Scenario D: Fallback (No LLM)

**Definition:** No API key, no internet, or budget exhausted

### Setup

1. **Disable LLM service:**
   ```javascript
   const intent = await generateAreciboIntent({
     weekData: victoryData,  // Use any week
     llmBudget: 0,           // KEY: no budget
     llmService: null,       // KEY: no service
   });
   ```

2. **Or simulate timeout:**
   ```javascript
   const llmService = {
     call: async () => {
       // Simulate 10-second delay (exceeds 8s timeout)
       await new Promise(r => setTimeout(r, 10000));
       return { content: '{"sections":{}}' };
     }
   };
   ```

### Run Test

1. Generate intent with fallback
2. Compare to LLM version (if available)
3. Render both side-by-side

### Expected Behavior

✅ **Visual Quality**
- [ ] No visible difference from LLM output
- [ ] Same layout, colors, typography
- [ ] Same animations

✅ **Content Quality**
- [ ] Still personalized (uses sentiment, bond)
- [ ] Still fact-grounded (includes numbers)
- [ ] Still appropriate tone (no therapy-speak)
- [ ] Shorter messages (templates not LLM) but still clear

✅ **Derivatives**
- [ ] Chosen based on sentiment (deterministic)
- [ ] Bond level gates respected
- [ ] No degradation

### Validation

```javascript
// Fallback intent
const fallbackIntent = await generateAreciboIntent({
  weekData: victoryData,
  llmBudget: 0,
  llmService: null,
});

// LLM intent (if available)
const llmIntent = await generateAreciboIntent({
  weekData: victoryData,
  llmBudget: 1,
  llmService: activeService,
});

// Check both pass validation
const fallbackValid = validateAreciboIntent(fallbackIntent, victoryData);
const llmValid = validateAreciboIntent(llmIntent, victoryData);

console.assert(fallbackValid.valid && llmValid.valid, 'Validation failed');
console.log('Both valid ✓');

// Check they look similar (not identical, but same quality)
console.log('Fallback signal:', fallbackIntent.sections.signal.message);
console.log('LLM signal:', llmIntent.sections.signal.message);
```

---

## Scenario E: Mobile + Share

**Definition:** Display on 375px viewport, export PNG

### Setup

1. **Resize browser to 375px width:**
   ```javascript
   // Open DevTools → Device emulation (mobile)
   // Or: window.innerWidth = 375
   ```

2. **Load any complete intent:**
   ```javascript
   const intent = await generateAreciboIntent(victoryData);
   ```

3. **Render with mobile viewport**

### Expected Behavior

✅ **Layout Responsive**
- [ ] Modal scales to full-width - padding
- [ ] Sections readable at 375px
- [ ] No horizontal scroll
- [ ] Text not cut off

✅ **Touch Targets**
- [ ] All buttons ≥44px (touch-friendly)
- [ ] Sections easy to tap
- [ ] Close button easy to hit
- [ ] Share button easy to tap

✅ **Interaction**
- [ ] Can scroll through sections
- [ ] Can expand/collapse sections
- [ ] Can open share card
- [ ] Can download PNG

✅ **PNG Export**
- [ ] "Download PNG" button works
- [ ] File downloads in <500ms
- [ ] Image quality high (no pixelation)
- [ ] Size reasonable (<2MB)
- [ ] Format: 1200×630 (LinkedIn/Twitter)

### Test PNG Export

1. **Open AreciboShareCard**
2. **Click "Download PNG"**
3. **Check file:**
   ```bash
   # In terminal:
   file ~/Downloads/arecibo-week-*.png
   identify ~/Downloads/arecibo-week-*.png  # If ImageMagick installed
   ```
4. **Verify:**
   - [ ] Dimensions 1200×630 or 1080×1080
   - [ ] File size <2MB
   - [ ] Image quality clear (not blurry)
   - [ ] All text readable

### Test Share Behavior

1. **Click "Copy to Clipboard"** (if available)
2. **Paste in social media platform:**
   - [ ] Image renders correctly
   - [ ] Metadata (title, description) included
   - [ ] Compelling enough to share?

### Validation

```javascript
// Check mobile layout
const modal = document.querySelector('.modalContent');
console.log('Modal width:', modal.offsetWidth);  // Should be ~375 or less

// Check touch targets
const buttons = document.querySelectorAll('button');
buttons.forEach(btn => {
  const rect = btn.getBoundingClientRect();
  console.assert(rect.height >= 44 && rect.width >= 44, 
    `Button too small: ${rect.width}x${rect.height}`);
});

// Check PNG export
const canvas = document.querySelector('canvas');
console.log('Canvas size:', canvas.width, 'x', canvas.height);
// Expected: 1200x630 or similar
```

---

## Summary Checklist

### All 5 Scenarios
- [ ] **Scenario A (Victory):** Celebratory, fact-grounded, no smugness
- [ ] **Scenario B (Tough):** Dignified, acknowledges difficulty, no guilt
- [ ] **Scenario C (First):** Welcoming, no callbacks, Bond 1 appropriate
- [ ] **Scenario D (Fallback):** Indistinguishable quality, deterministic
- [ ] **Scenario E (Mobile + Share):** Responsive, exportable, touch-friendly

### Read-Aloud Validation
- [ ] Victory week sounds human (not algorithm)
- [ ] Tough week sounds respectful (not patronizing)
- [ ] First week sounds welcoming (not overwhelming)

### Technical Validation
- [ ] `npm run build` ✅
- [ ] No console errors
- [ ] All validation checks pass
- [ ] Performance targets met (<500ms export, <100ms archive)

### Ready for Launch
- [ ] All 5 scenarios pass ✅
- [ ] Edge cases handled (zero data, overflow, etc.)
- [ ] Documentation complete
- [ ] Team signoff

---

## Notes for Testers

1. **Be critical about tone:** Read aloud. Does it feel human?
2. **Check guardrails:** Run validation checks. Trust the regexes.
3. **Test on real device:** Mobile not just DevTools.
4. **Try fallback:** Disable API key and verify fallback works.
5. **Archive testing:** Create multiple weeks, verify archive loads.

---

**Test Date:** ________________  
**Tester:** ________________  
**Results:** ☐ PASS ☐ FAIL (note issues below)

---

Issues Found:
```
(space for notes)
```
