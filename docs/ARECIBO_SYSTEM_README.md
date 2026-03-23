# Arecibo: Weekly Recap System

**Version:** 1.0  
**Status:** Launch Ready (Slice 7)  
**Last Updated:** March 23, 2026

---

## What is Arecibo?

Arecibo is the weekly recap system in Payday Kingdom. Named after the Arecibo Message (a 1974 radio transmission sent to space containing visual data about humanity), Arecibo presents players with a personalized, pixel-perfect recap of their week.

**The core idea:** Every week (Sunday evening), the companion reviews the past week and sends a transmission—visual and narrative—reflecting what happened. It's not judgment. It's witness.

### Why Weekly Recaps?

1. **Celebration** — Players should see what they accomplished
2. **Reflection** — Hard weeks deserve acknowledgment, not reframing
3. **Connection** — The companion knows the player is there, doing the work
4. **Continuity** — Archive of weeks builds narrative over time

---

## System Architecture

### Core Flow

```
Game State (weekly store)
      ↓
[Weekly Loop] — Aggregates bills, habits, meetings, sentiment
      ↓
Expression Engine — Chooses derivatives, calls LLM or fallback templates
      ↓
AreciboIntent — Structured JSON with 7 sections
      ↓
React Components — Renders modal, grid, shares
      ↓
Emotional Guardrails — Validates tone (no therapy-speak, no guilt)
      ↓
Player sees recap
```

### Key Components

**Expression Engine** (`expressionEngine.js`)
- Orchestrates the entire recap generation
- 8-second LLM timeout (doesn't block UI)
- Falls back to templates if LLM unavailable or budget exhausted
- Validates all output against emotional guardrails

**Derivative Selectors** (`derivativeSelector.js`)
- Chooses one "pose" or variant per section based on week sentiment and bond level
- Examples: `count` section can be `concise` or `detailed`
- Bond Level gates: Bond 1 gets fewer options, Bond 5 gets everything

**Emotional Guardrails** (`emotionalGuardrails.js`)
- Detects and blocks: therapy-speak, guilt language, fake triumph, patronizing tone
- Hard-week dignity protocol: acknowledges difficulty without reframing
- Validates signal derivative matches bond level
- **Critical for respecting the player**

**Signal Composer** (`signalComposer.js`)
- Generates the final "transmission" message
- Can be: fact-grounded, symbolic, quote, verse, or callback
- Callbacks (Bond 5) reference past weeks; requires `previousWeekData`

**Section Assemblers** (`sectionAssemblers.js`)
- Generates narrative text for each section
- Provides fallback templates when LLM unavailable
- Ensures consistent tone across all sections

### The 7 Sections

Every recap contains exactly 7 sections:

1. **Count** — Bills and habits numerics
2. **Elements** — Individual habits detailed
3. **Pattern** — Daily intensity graph description
4. **Thread** — Streaks and milestones
5. **Reflection** — Companion's pose (visual + sentiment)
6. **Kingdom** — Structures and world changes
7. **Signal** — Final transmission from companion

### Data Structure: AreciboIntent

```javascript
{
  weekNumber: 1,
  sections: {
    count: {
      derivative: 'concise' | 'detailed',
      stats: { billsPaid, habitsCompleted, ... },
      message: "You paid X bills and completed Y habits."
    },
    elements: {
      derivative: 'focused' | 'full',
      habits: [{ name, completed, total }, ...],
      message: "Your habits this week..."
    },
    pattern: {
      derivative: 'graph' | 'prose',
      dailyIntensity: [0-10, ...],
      narrative: 'strong_finish' | 'slow_finish' | ...,
      message: "Your week built momentum..."
    },
    thread: {
      derivative: 'milestone_focused' | 'streak_focused',
      longestStreak: { habit, days },
      weeksEngaged: 5,
      message: "Your longest streak..."
    },
    reflection: {
      derivative: 'victory' | 'vigil' | 'guardian' | ..., // pose name
      weekSentiment: 'victory' | 'tough' | 'mixed',
      heldItem: 'sword' | 'shield' | null,
      message: "The companion stands..."
    },
    kingdom: {
      derivative: 'growth' | 'stability',
      spotlightObject: { name, type, x, y },
      totalStructures: 42,
      addedThisWeek: 3,
      message: "Your kingdom grew..."
    },
    signal: {
      derivative: 'fact_grounded' | 'symbolic' | 'quote' | 'verse' | 'callback',
      message: "Final transmission...",
      source: 'arecibo.msg' // meta info
    }
  }
}
```

---

## Design Principles

### 1. Respect Over Celebration

- **Victory weeks** get celebration, but never smugness
- **Tough weeks** get acknowledgment, never guilt-tripping or false reframing
- **Mixed weeks** get honesty

### 2. Fact-Grounded

- Every message includes specific numbers or facts from the week
- No vague praise ("You're amazing!") without evidence
- Callbacks reference actual past achievements

### 3. Companion-Centered

- Arecibo is the companion speaking, not an algorithm
- Tone: friend, witness, equal
- Not a therapist, coach, or corporate wellness app

### 4. Player Agency

- Player chooses what to see (expandable sections)
- Player archives past recaps
- Player creates shares (PNG exports)
- Never forces the recap onto the player

### 5. Bond Level Gates

- **Bond 1-2:** Fact-grounded signals only
- **Bond 3:** Can include symbolic references
- **Bond 4:** Can include quotes
- **Bond 5:** Callbacks to past weeks + verses (if faith mode enabled)

### 6. Emoji Integrity

- All emojis serve purpose (not decoration)
- Consistent per section
- Dark mode compatible (high contrast)
- Export-safe (no complex sequences)

---

## Feature Overview

### 1. Weekly Recap Modal

- Opens Sunday evening (or on demand)
- Centered overlay, 800px max-width (responsive)
- 7 expandable sections
- Pixel grid (73x23) generated from week data
- Close button, saves without forcing

### 2. Pixelated Grid

- Each cell represents a day/category
- Rendered as 4x scale for clarity
- Colors: purple (bills), green (habits), blue (meetings)
- Clickable sections toggle expansion

### 3. Expandable Sections

- Click to expand/collapse
- Smooth animations
- Touch-friendly (44px minimum targets)
- One section expanded at a time (UX best practice)

### 4. Share Card

- PNG export with week data
- Formatted for social media (1200x630 or 1080x1080)
- Includes: week number, date range, sentiment, key stat
- High contrast for accessibility

### 5. Archive

- Stores recaps in localStorage
- View past weeks
- Search by week number
- Max 52 weeks (1 year) to stay under 5MB localStorage limit
- Cleanup: archive older than 1 year auto-deleted

### 6. Dark Mode

- Default: dark slate background
- High contrast text: #e2e8f0
- WCAG AA compliant
- No light mode (respects player's environment assumption)

---

## Edge Cases Handled

### 1. First Week Ever
- No "you've been doing this for..." language
- No callbacks to past weeks (don't have data)
- Generic greetings only
- Uses templates only (no LLM needed)

### 2. Emergency Week (Zero Habits)
- Still generates recap (not a crash)
- Acknowledges: "You tracked bills but no habits this week"
- Not patronizing
- Not guilt-inducing

### 3. Catastrophic Week (All Failures)
- Never fake-triumph reframes
- Acknowledges the difficulty plainly
- Fact-grounds: "X bills unpaid, Y habits incomplete"
- Reflection derivative: `vigil` (companion stands watch)
- Signal: factual, not inspirational

### 4. Bond Level 0
- Shouldn't exist (game starts at Bond 1)
- If encountered, treats as Bond 1
- No verse or callback access

### 5. Numeric Overflow
- Bills paid: capped at 999 (display as "999+")
- XP earned: capped at 99,999
- Streak days: capped at 9,999 (display as "9,999+d")

### 6. No LLM Budget
- Fully deterministic fallback (templates)
- Still personalized (uses bond level, sentiment)
- Still beautiful (CSS identical to LLM output)
- No degraded experience

### 7. LLM Timeout (>8 seconds)
- Gracefully falls back to templates
- Logs warning but doesn't block UI
- Player sees recap, doesn't see the error
- No loading spinner (instant fallback)

### 8. Mobile Viewport (375px width)
- Modal scales down to 100% - padding
- Touch targets minimum 44px
- Sections still expandable
- Share card still exportable
- No horizontal scroll

### 9. Corrupted localStorage
- Archive fails gracefully
- Player can still see current recap
- Old archives deleted on next session
- Logs error to console

### 10. Missing Data
- If `weekData` incomplete, fills with defaults
- If `pixelData` missing, shows placeholder grid
- If previous week data unavailable, no callbacks
- Always renders _something_

---

## LLM Integration (Optional)

### When LLM is Used
- Budget available (llmBudget > 0)
- Service configured and healthy
- Current week, not archived week
- Response completes within 8 seconds

### When LLM is Skipped (Fallback)
- No budget
- No service
- Timeout
- Validation fails (suspicious output)

### LLM Behavior
- **Model:** Claude 3.5 Sonnet (for quality + speed)
- **System Prompt:** Week context + emotional guardrails
- **Output Format:** JSON only
- **Timeout:** 8 seconds hard limit
- **Validation:** Checks emotional guardrails + structure

### LLM Budget (Per Cycle)
- Cycle = 7 days
- Typical allocation: 1 LLM call per week
- Used for current week only
- Archive viewing uses templates only

---

## Performance Targets

- **Modal open/close:** 60fps (CSS animations)
- **Section expand:** <100ms (toggle state)
- **Archive load:** <100ms for 52 weeks
- **PNG export:** <500ms
- **LLM call:** 8-second timeout
- **localStorage footprint:** <5MB after 1 year (52 weeks)

---

## Accessibility

### WCAG AA Compliant

- **Text contrast:** #e2e8f0 on #0f172a = 18.5:1 ✅
- **Touch targets:** 44px minimum
- **Focus states:** Visible outline on all buttons
- **Keyboard nav:** Tab through sections, Enter to expand
- **Screen reader:** Semantic HTML, aria-labels

### Mobile Responsive

- Breakpoint: 640px
- Modal full-width below 640px
- Touch-friendly padding
- Readable text at 375px
- Share card reformats for mobile preview

---

## Error Recovery

### Missing Section Data
- Shows placeholder message
- Doesn't crash modal
- Logs to console
- Archives still work

### Failed PNG Export
- User informed with toast notification
- Can retry
- PNG generation uses canvas API (native)

### localStorage Quota Exceeded
- Removes oldest archive first
- Tries again
- If still fails, alerts user
- Current recap still displayed

### LLM JSON Parse Failure
- Falls back to templates immediately
- No user-facing error
- Logs error details
- Still shows beautiful recap

---

## Future Extensions

### Adding New Sections
1. Add to `AreciboIntent` structure (types.js)
2. Create `selectXxxDerivative()` in `derivativeSelector.js`
3. Add narrative templates to `sectionAssemblers.js`
4. Add validation to `emotionalGuardrails.js`
5. Create `AreciboXxxSection.jsx` component
6. Update `AreciboRecap.jsx` to include it

### Adding New Derivatives
1. Add selector logic to `derivativeSelector.js`
2. Add templates to `sectionAssemblers.js`
3. Validate in `emotionalGuardrails.js`
4. Update LLM prompts in `areciboPrompts.js`
5. Test all edge cases

### Adding New Colors
1. Add to CSS vars in `styles.module.css`
2. Update pixel color mappings in `AreciboGrid.jsx`
3. Test contrast in dark mode

### Custom Companion Names
- Already supported (passed to LLM)
- Callbacks use companion name ("He stood watch" vs "Aria stood watch")
- No changes needed

---

## Testing Checklist

- [ ] npm run build — zero errors
- [ ] npm run test — 100% on critical paths
- [ ] Victory Week scenario — celebratory, no smugness
- [ ] Tough Week scenario — dignified, no guilt
- [ ] First Week scenario — welcoming, no callbacks
- [ ] Fallback (no LLM) — indistinguishable quality
- [ ] Mobile viewport (375px) — responsive
- [ ] PNG export — <500ms, high quality
- [ ] Archive load — <100ms for 52 weeks
- [ ] Dark mode contrast — WCAG AA ✅
- [ ] Touch targets — 44px minimum ✅
- [ ] No console errors — clean logs
- [ ] Hard-week output read aloud — sounds human
- [ ] Emotional guardrails tests — all pass

---

## Support & Troubleshooting

See `ARECIBO_TROUBLESHOOTING.md` for common issues and solutions.

---

## Credits

**Design:** Inspired by the Arecibo Message (1974) and cosmic-scale communication  
**Implementation:** Slice 1-7 (Jan-Mar 2026)  
**Philosophy:** Respect the player's reality; witness without judgment
