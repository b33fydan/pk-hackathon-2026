/**
 * @fileoverview Test suite for emotional guardrails
 * CRITICAL: Tests for anti-patterns that would break the system
 *
 * 10+ test cases covering:
 * - Therapy-speak detection
 * - Guilt induction detection
 * - Fake triumph detection
 * - Patronizing language detection
 * - Hard-week dignity protocol
 * - Bond Level gating
 * - Reflection derivative validation
 */

import {
  validateEmotionalGuardrails,
  validateReflectionDerivative,
  validateSignalDerivative,
  validateAreciboIntent,
} from '../emotionalGuardrails.js';

// Mock WeekData and AreciboIntent generators
function createMockWeekData(overrides = {}) {
  return {
    weekNumber: 5,
    billsPaid: 2,
    billsTotal: 4,
    habitsCompleted: 8,
    habitsTotal: 14,
    meetings: 3,
    daysActive: 5,
    bondXpEarned: 40,
    activeHabits: [
      { key: 'meditation', name: 'Meditation', completed: 3, total: 7 },
      { key: 'exercise', name: 'Exercise', completed: 2, total: 7 },
      { key: 'reading', name: 'Reading', completed: 0, total: 7 },
    ],
    dailyIntensity: [2, 4, 3, 5, 4, 2, 1],
    longestStreak: { habit: 'meditation', days: 5 },
    nearestMilestone: { type: 'streak', daysAway: 2, target: 7 },
    weekSentiment: 'tough',
    bondLevel: 3,
    companionName: 'Companion',
    kingdomName: 'Kingdom',
    ...overrides,
  };
}

function createMockIntent(sectionOverrides = {}) {
  return {
    weekNumber: 5,
    sections: {
      count: {
        derivative: 'standard',
        stats: { billsPaid: 2, habitsCompleted: 8, meetings: 3, daysActive: 5, xpEarned: 40 },
      },
      elements: {
        derivative: 'full',
        habits: [
          { key: 'meditation', name: 'Meditation', completed: 3, total: 7 },
        ],
      },
      pattern: {
        derivative: 'heatmap',
        dailyIntensity: [2, 4, 3, 5, 4, 2, 1],
        narrative: 'mixed_week',
      },
      thread: {
        derivative: 'clean_helix',
        longestStreak: { habit: 'meditation', days: 5 },
        weeksEngaged: 5,
        nearestMilestone: { type: 'streak', daysAway: 2, target: 7 },
      },
      reflection: {
        derivative: 'working',
        weekSentiment: 'tough',
        heldItem: null,
      },
      kingdom: {
        derivative: 'overview',
        spotlightObject: null,
        totalStructures: 3,
        addedThisWeek: 0,
      },
      signal: {
        derivative: 'fact_grounded',
        message: '2 bills paid. 8 habits held this week.',
        source: null,
      },
      ...sectionOverrides,
    },
  };
}

describe('Emotional Guardrails Validation', () => {
  describe('Test 1: Detect therapy-speak', () => {
    test('should reject "your feelings are valid" language', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'Your feelings are valid and this is a safe space for growth.',
          source: null,
        },
      });

      const weekData = createMockWeekData({ weekSentiment: 'tough' });
      const result = validateEmotionalGuardrails(intent, weekData.weekSentiment);

      expect(result.valid).toBe(false);
      expect(result.violations.length).toBeGreaterThan(0);
      expect(result.violations[0]).toMatch(/therapy-speak/i);
    });

    test('should reject "healing journey" language', () => {
      const intent = createMockIntent({
        reflection: {
          derivative: 'vigil',
          weekSentiment: 'tough',
          message: 'This week is part of your healing journey.',
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.violations[0]).toMatch(/therapy-speak/i);
    });

    test('should reject "mindfulness" and "manifest" language', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'Manifest your best self and practice mindfulness.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'mixed');
      expect(result.valid).toBe(false);
    });
  });

  describe('Test 2: Detect guilt-inducing language', () => {
    test('should reject "could have done better"', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'You could have done better this week.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.violations[0]).toMatch(/guilt/i);
    });

    test('should reject "missed opportunity" framing', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'You had a missed opportunity to complete all your habits.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
    });

    test('should reject "fell short" language', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'You fell short of your goals this week.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'mixed');
      expect(result.valid).toBe(false);
    });

    test('should reject "disappointed" framing', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'A disappointing week, but you can do better.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
    });
  });

  describe('Test 3: Detect fake triumph on tough weeks (CRITICAL)', () => {
    test('should reject "but look how strong you are" on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'This was a hard week, but look how strong you are.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.severity).toBe('critical');
      expect(result.violations[0]).toMatch(/CRITICAL.*fake triumph/i);
    });

    test('should reject "character building" reframe on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'This was a character-building week.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.severity).toBe('critical');
    });

    test('should reject "silver lining" on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'Hard week, but there is a silver lining: you learned something.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.severity).toBe('critical');
    });

    test('should reject "blessing in disguise" on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'This struggle is a blessing in disguise.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.severity).toBe('critical');
    });

    test('should reject "everything happens for a reason" on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'Everything happens for a reason.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.severity).toBe('critical');
    });
  });

  describe('Test 4: Detect patronizing language', () => {
    test('should reject "you\'re doing great!"', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: "You're doing great! Keep up the good work!",
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'mixed');
      expect(result.valid).toBe(false);
      expect(result.violations[0]).toMatch(/patronizing/i);
    });

    test('should reject "proud of you" when used patronizingly', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: "I'm so proud of you for trying.",
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
    });

    test('should reject "you got this" cheerleading', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'You got this! Go get em next week!',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
    });
  });

  describe('Test 5: Detect therapist-speak', () => {
    test('should reject coaching language "you should consider"', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'You should consider exploring what went wrong this week.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
      expect(result.violations[0]).toMatch(/coaching|therapy/i);
    });

    test('should reject "have you tried"', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'Have you tried adjusting your expectations?',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
    });

    test('should reject "the key is" prescriptive language', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'The key is to work through your emotions.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(false);
    });
  });

  describe('Test 6: Hard-week dignity protocol', () => {
    test('should PASS plain acknowledgment on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'Hard week. 2 bills cleared. 8 habits held. That counts.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(true);
    });

    test('should PASS "you\'re still standing" on tough week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'You cleared the bills. You held the line. You\'re still standing.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'tough');
      expect(result.valid).toBe(true);
    });

    test('should require reflection pose to match tough week', () => {
      const result = validateReflectionDerivative('victory', 'tough');
      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/doesn't fit/);
    });

    test('should ALLOW "vigil" pose for tough week', () => {
      const result = validateReflectionDerivative('vigil', 'tough');
      expect(result.valid).toBe(true);
    });
  });

  describe('Test 7: Victory week should not fake struggle', () => {
    test('should PASS celebratory message on victory week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'All 4 bills cleared. 12 habits held. You built something this week.',
          source: null,
        },
        reflection: {
          derivative: 'celebration',
          weekSentiment: 'victory',
          heldItem: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'victory');
      expect(result.valid).toBe(true);
    });

    test('should allow "celebration" or "victory" pose on victory week', () => {
      expect(validateReflectionDerivative('celebration', 'victory').valid).toBe(true);
      expect(validateReflectionDerivative('victory', 'victory').valid).toBe(true);
    });
  });

  describe('Test 8: Bond Level gating validation', () => {
    test('should reject "quote" signal at Bond Level 2', () => {
      const result = validateSignalDerivative('quote', 2, {
        favoriteSources: ['Marcus Aurelius'],
      });
      expect(result.valid).toBe(false);
    });

    test('should accept "quote" signal at Bond Level 4', () => {
      const result = validateSignalDerivative('quote', 4, {
        favoriteSources: ['Marcus Aurelius'],
      });
      expect(result.valid).toBe(true);
    });

    test('should reject "symbolic" at Bond Level 1', () => {
      const result = validateSignalDerivative('symbolic', 1, {
        favoriteSymbols: ['lantern'],
      });
      expect(result.valid).toBe(false);
    });

    test('should accept "symbolic" at Bond Level 3', () => {
      const result = validateSignalDerivative('symbolic', 3, {
        favoriteSymbols: ['lantern'],
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('Test 9: Mixed week should hold both sides', () => {
    test('should PASS balanced message on mixed week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: '2 of 4 bills. 8 of 14 habits. Mixed week.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'mixed');
      expect(result.valid).toBe(true);
    });

    test('should NOT fake triumph on mixed week', () => {
      const intent = createMockIntent({
        signal: {
          derivative: 'fact_grounded',
          message: 'This is a growth opportunity disguised as a mixed week.',
          source: null,
        },
      });

      const result = validateEmotionalGuardrails(intent, 'mixed');
      expect(result.valid).toBe(false);
    });
  });

  describe('Test 10: Full integration validation', () => {
    test('should PASS valid tough-week intent', () => {
      const intent = createMockIntent({
        reflection: {
          derivative: 'vigil',
          weekSentiment: 'tough',
          heldItem: 'shield',
        },
        signal: {
          derivative: 'fact_grounded',
          message: 'Bills cleared. Key habits held. You\'re still in the game.',
          source: null,
        },
      });

      const weekData = createMockWeekData({ weekSentiment: 'tough' });
      const result = validateAreciboIntent(intent, weekData);

      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });

    test('should FAIL tough-week intent with fake triumph', () => {
      const intent = createMockIntent({
        reflection: {
          derivative: 'victory',
          weekSentiment: 'tough',
          heldItem: null,
        },
        signal: {
          derivative: 'fact_grounded',
          message: 'This was a blessing in disguise.',
          source: null,
        },
      });

      const weekData = createMockWeekData({ weekSentiment: 'tough' });
      const result = validateAreciboIntent(intent, weekData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should PASS valid victory-week intent', () => {
      const intent = createMockIntent({
        reflection: {
          derivative: 'celebration',
          weekSentiment: 'victory',
          heldItem: 'sword',
        },
        signal: {
          derivative: 'fact_grounded',
          message: 'All bills cleared. 12 of 14 habits. You built something this week.',
          source: null,
        },
      });

      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        billsPaid: 4,
        billsTotal: 4,
        habitsCompleted: 12,
        habitsTotal: 14,
      });
      const result = validateAreciboIntent(intent, weekData);

      expect(result.valid).toBe(true);
    });
  });
});
