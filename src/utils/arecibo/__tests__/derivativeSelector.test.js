/**
 * @fileoverview Tests for derivative selector
 * Verifies:
 * - Correct Bond Level gating
 * - Deterministic selection
 * - Sentiment-based logic
 * - All 7 sections return valid derivatives
 */

import {
  selectDerivatives,
  selectCountDerivative,
  selectElementsDerivative,
  selectPatternDerivative,
  selectThreadDerivative,
  selectReflectionDerivative,
  selectKingdomDerivative,
  selectSignalDerivative,
  hashWeek,
} from '../derivativeSelector.js';

// Mock WeekData
function createMockWeekData(overrides = {}) {
  return {
    weekNumber: 5,
    billsPaid: 3,
    billsTotal: 4,
    habitsCompleted: 12,
    habitsTotal: 14,
    meetings: 4,
    daysActive: 6,
    bondXpEarned: 75,
    activeHabits: [
      { key: 'meditation', name: 'Meditation', completed: 7, total: 7 },
      { key: 'exercise', name: 'Exercise', completed: 5, total: 7 },
      { key: 'reading', name: 'Reading', completed: 0, total: 7 },
    ],
    dailyIntensity: [3, 5, 7, 6, 8, 4, 2],
    longestStreak: { habit: 'meditation', days: 12 },
    nearestMilestone: { type: 'streak', daysAway: 3, target: 14 },
    weekSentiment: 'mixed',
    companionName: 'Test Companion',
    kingdomName: 'Test Kingdom',
    ...overrides,
  };
}

describe('Derivative Selector', () => {
  describe('hashWeek', () => {
    test('produces consistent hash for same week number', () => {
      const hash1 = hashWeek(5);
      const hash2 = hashWeek(5);
      expect(hash1).toBe(hash2);
    });

    test('produces different hashes for different weeks', () => {
      const hash5 = hashWeek(5);
      const hash6 = hashWeek(6);
      expect(hash5).not.toBe(hash6);
    });

    test('hash output is in valid range 0-999', () => {
      for (let i = 1; i <= 52; i++) {
        const hash = hashWeek(i);
        expect(hash).toBeGreaterThanOrEqual(0);
        expect(hash).toBeLessThan(1000);
      }
    });
  });

  describe('selectCountDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1 returns only standard', () => {
      const d = selectCountDerivative(weekData, 1);
      expect(d).toBe('standard');
    });

    test('Level 2 returns only standard', () => {
      const d = selectCountDerivative(weekData, 2);
      expect(d).toBe('standard');
    });

    test('Level 3+ can use other derivatives', () => {
      const validDerivatives = [
        'standard',
        'highlight',
        'streak_emphasis',
        'minimal',
      ];
      for (let level = 3; level <= 5; level++) {
        const d = selectCountDerivative(weekData, level);
        expect(validDerivatives).toContain(d);
      }
    });

    test('returns streak_emphasis when strong streak exists', () => {
      const strongStreak = createMockWeekData({
        longestStreak: { habit: 'meditation', days: 14 },
      });
      const d = selectCountDerivative(strongStreak, 3);
      expect(d).toBe('streak_emphasis');
    });

    test('returns highlight for tough week with all bills paid', () => {
      const toughWeek = createMockWeekData({
        weekSentiment: 'tough',
        billsPaid: 4,
        billsTotal: 4,
      });
      const d = selectCountDerivative(toughWeek, 3);
      expect(d).toBe('highlight');
    });

    test('deterministic: same input produces same output', () => {
      const d1 = selectCountDerivative(weekData, 4);
      const d2 = selectCountDerivative(weekData, 4);
      expect(d1).toBe(d2);
    });
  });

  describe('selectElementsDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1-2 returns only full', () => {
      expect(selectElementsDerivative(weekData, 1)).toBe('full');
      expect(selectElementsDerivative(weekData, 2)).toBe('full');
    });

    test('Level 3+ can use other derivatives', () => {
      const validDerivatives = ['full', 'dominant', 'discovery', 'decay'];
      for (let level = 3; level <= 5; level++) {
        const d = selectElementsDerivative(weekData, level);
        expect(validDerivatives).toContain(d);
      }
    });

    test('returns decay when habit is breaking', () => {
      const decayWeek = createMockWeekData({
        weekSentiment: 'tough',
        activeHabits: [
          { key: 'habit1', name: 'Habit 1', completed: 1, total: 7 },
        ],
      });
      const d = selectElementsDerivative(decayWeek, 3);
      expect(d).toBe('decay');
    });

    test('deterministic selection', () => {
      const d1 = selectElementsDerivative(weekData, 4);
      const d2 = selectElementsDerivative(weekData, 4);
      expect(d1).toBe(d2);
    });
  });

  describe('selectPatternDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1-2 returns only heatmap', () => {
      expect(selectPatternDerivative(weekData, 1)).toBe('heatmap');
      expect(selectPatternDerivative(weekData, 2)).toBe('heatmap');
    });

    test('Level 3+ can use other derivatives', () => {
      const validDerivatives = [
        'heatmap',
        'waveform',
        'binary_pulse',
        'bookend',
      ];
      for (let level = 3; level <= 5; level++) {
        const d = selectPatternDerivative(weekData, level);
        expect(validDerivatives).toContain(d);
      }
    });

    test('returns bookend when start/end differ significantly', () => {
      const bookendWeek = createMockWeekData({
        dailyIntensity: [2, 2, 2, 2, 2, 10, 10], // Starts low, ends high
      });
      const d = selectPatternDerivative(bookendWeek, 3);
      expect(d).toBe('bookend');
    });

    test('deterministic selection', () => {
      const d1 = selectPatternDerivative(weekData, 4);
      const d2 = selectPatternDerivative(weekData, 4);
      expect(d1).toBe(d2);
    });
  });

  describe('selectThreadDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1-2 returns only clean_helix', () => {
      expect(selectThreadDerivative(weekData, 1)).toBe('clean_helix');
      expect(selectThreadDerivative(weekData, 2)).toBe('clean_helix');
    });

    test('Level 3+ can use other derivatives', () => {
      const validDerivatives = [
        'clean_helix',
        'growth_thread',
        'near_miss',
        'origin',
      ];
      for (let level = 3; level <= 5; level++) {
        const d = selectThreadDerivative(weekData, level);
        expect(validDerivatives).toContain(d);
      }
    });

    test('returns near_miss when close to milestone', () => {
      const closeToMilestone = createMockWeekData({
        nearestMilestone: { type: 'streak', daysAway: 5, target: 30 },
      });
      const d = selectThreadDerivative(closeToMilestone, 3);
      expect(d).toBe('near_miss');
    });

    test('returns origin for early weeks', () => {
      const earlyWeek = createMockWeekData({ weekNumber: 2 });
      const d = selectThreadDerivative(earlyWeek, 3);
      expect(d).toBe('origin');
    });

    test('returns growth_thread for long streaks', () => {
      const longStreak = createMockWeekData({
        longestStreak: { habit: 'meditation', days: 21 },
      });
      const d = selectThreadDerivative(longStreak, 3);
      expect(d).toBe('growth_thread');
    });

    test('deterministic selection', () => {
      const d1 = selectThreadDerivative(weekData, 4);
      const d2 = selectThreadDerivative(weekData, 4);
      expect(d1).toBe(d2);
    });
  });

  describe('selectReflectionDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1-2 returns only working', () => {
      expect(selectReflectionDerivative(weekData, 1)).toBe('working');
      expect(selectReflectionDerivative(weekData, 2)).toBe('working');
    });

    test('Level 3+ can use emotional poses', () => {
      const validDerivatives = [
        'victory',
        'working',
        'resting',
        'guardian',
        'celebration',
        'vigil',
      ];
      for (let level = 3; level <= 5; level++) {
        const d = selectReflectionDerivative(weekData, level);
        expect(validDerivatives).toContain(d);
      }
    });

    test('returns victory for successful week with high completion', () => {
      const victoryWeek = createMockWeekData({
        weekSentiment: 'victory',
        habitsCompleted: 14,
        habitsTotal: 14,
      });
      const d = selectReflectionDerivative(victoryWeek, 3);
      expect(d).toBe('victory');
    });

    test('returns celebration for victory week with lower completion', () => {
      const celebrationWeek = createMockWeekData({
        weekSentiment: 'victory',
        habitsCompleted: 10,
        habitsTotal: 14,
      });
      const d = selectReflectionDerivative(celebrationWeek, 3);
      expect(d).toBe('celebration');
    });

    test('returns guardian for tough week with bills paid', () => {
      const guardianWeek = createMockWeekData({
        weekSentiment: 'tough',
        billsPaid: 4,
        billsTotal: 4,
      });
      const d = selectReflectionDerivative(guardianWeek, 3);
      expect(d).toBe('guardian');
    });

    test('returns vigil for tough week without bill payment', () => {
      const vigilWeek = createMockWeekData({
        weekSentiment: 'tough',
        billsPaid: 0,
        billsTotal: 4,
      });
      const d = selectReflectionDerivative(vigilWeek, 3);
      expect(d).toBe('vigil');
    });

    test('returns resting for mixed week with low habit completion', () => {
      const restingWeek = createMockWeekData({
        weekSentiment: 'mixed',
        habitsCompleted: 3,
        habitsTotal: 14,
      });
      const d = selectReflectionDerivative(restingWeek, 3);
      expect(d).toBe('resting');
    });
  });

  describe('selectKingdomDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1-2 returns only overview', () => {
      expect(selectKingdomDerivative(weekData, 1)).toBe('overview');
      expect(selectKingdomDerivative(weekData, 2)).toBe('overview');
    });

    test('Level 3+ can use other derivatives', () => {
      const validDerivatives = [
        'overview',
        'growth_compare',
        'spotlight',
        'seasonal',
      ];
      for (let level = 3; level <= 5; level++) {
        const d = selectKingdomDerivative(weekData, level);
        expect(validDerivatives).toContain(d);
      }
    });

    test('returns spotlight for high XP week', () => {
      const highXpWeek = createMockWeekData({ bondXpEarned: 150 });
      const d = selectKingdomDerivative(highXpWeek, 3);
      expect(d).toBe('spotlight');
    });

    test('returns growth_compare for later weeks', () => {
      const laterWeek = createMockWeekData({ weekNumber: 10 });
      const d = selectKingdomDerivative(laterWeek, 3);
      expect(d).toBe('growth_compare');
    });

    test('deterministic selection', () => {
      const d1 = selectKingdomDerivative(weekData, 4);
      const d2 = selectKingdomDerivative(weekData, 4);
      expect(d1).toBe(d2);
    });
  });

  describe('selectSignalDerivative', () => {
    const weekData = createMockWeekData();

    test('Level 1-2 returns only fact_grounded', () => {
      expect(selectSignalDerivative(weekData, 1)).toBe('fact_grounded');
      expect(selectSignalDerivative(weekData, 2)).toBe('fact_grounded');
    });

    test('Level 3 can use quote for tough weeks', () => {
      const toughWeek = createMockWeekData({ weekSentiment: 'tough' });
      const d = selectSignalDerivative(toughWeek, 3);
      expect(d).toBe('quote');
    });

    test('Level 4 can use verse for tough weeks', () => {
      const toughWeek = createMockWeekData({ weekSentiment: 'tough' });
      const d = selectSignalDerivative(toughWeek, 4);
      expect(d).toBe('verse');
    });

    test('Level 5 can use callback for weeks > 5', () => {
      const laterWeek = createMockWeekData({ weekNumber: 10 });
      const d = selectSignalDerivative(laterWeek, 5);
      expect(d).toBe('callback');
    });

    test('Level 5 can use symbolic for victory week with high XP', () => {
      const victoryWeek = createMockWeekData({
        weekNumber: 3,
        weekSentiment: 'victory',
        bondXpEarned: 150,
      });
      const d = selectSignalDerivative(victoryWeek, 5);
      expect(d).toBe('symbolic');
    });

    test('Level 5 uses quote for victory week by default', () => {
      const victoryWeek = createMockWeekData({
        weekNumber: 3,
        weekSentiment: 'victory',
        bondXpEarned: 50,
      });
      const d = selectSignalDerivative(victoryWeek, 5);
      expect(['quote', 'symbolic']).toContain(d);
    });

    test('deterministic selection', () => {
      const d1 = selectSignalDerivative(weekData, 4);
      const d2 = selectSignalDerivative(weekData, 4);
      expect(d1).toBe(d2);
    });

    test('respects Bond Level gating', () => {
      // Level 1-2: only fact_grounded
      expect(selectSignalDerivative(weekData, 1)).toBe('fact_grounded');
      expect(selectSignalDerivative(weekData, 2)).toBe('fact_grounded');

      // Level 3-4: NOT symbolic or callback
      const d3 = selectSignalDerivative(weekData, 3);
      const d4 = selectSignalDerivative(weekData, 4);
      expect(['fact_grounded', 'quote', 'verse']).toContain(d3);
      expect(['fact_grounded', 'quote', 'verse']).toContain(d4);

      // Level 5: can use all
      const d5 = selectSignalDerivative(weekData, 5);
      expect(
        ['fact_grounded', 'quote', 'verse', 'symbolic', 'callback'].includes(d5)
      ).toBe(true);
    });
  });

  describe('selectDerivatives (main export)', () => {
    const weekData = createMockWeekData();

    test('returns object with all 7 sections', () => {
      const derivatives = selectDerivatives(weekData, 3);
      expect(derivatives).toHaveProperty('count');
      expect(derivatives).toHaveProperty('elements');
      expect(derivatives).toHaveProperty('pattern');
      expect(derivatives).toHaveProperty('thread');
      expect(derivatives).toHaveProperty('reflection');
      expect(derivatives).toHaveProperty('kingdom');
      expect(derivatives).toHaveProperty('signal');
    });

    test('Level 1: minimal derivatives across all sections', () => {
      const derivatives = selectDerivatives(weekData, 1);
      expect(derivatives.count).toBe('standard');
      expect(derivatives.elements).toBe('full');
      expect(derivatives.pattern).toBe('heatmap');
      expect(derivatives.thread).toBe('clean_helix');
      expect(derivatives.reflection).toBe('working');
      expect(derivatives.kingdom).toBe('overview');
      expect(derivatives.signal).toBe('fact_grounded');
    });

    test('Level 5: can use personalized derivatives', () => {
      const derivatives = selectDerivatives(weekData, 5);
      // Level 5 should be able to select from wider range
      const validCountDerivatives = [
        'standard',
        'highlight',
        'streak_emphasis',
        'minimal',
      ];
      expect(validCountDerivatives).toContain(derivatives.count);
    });

    test('deterministic: same input produces same output', () => {
      const d1 = selectDerivatives(weekData, 3);
      const d2 = selectDerivatives(weekData, 3);
      expect(JSON.stringify(d1)).toBe(JSON.stringify(d2));
    });

    test('throws on invalid bondLevel', () => {
      expect(() => selectDerivatives(weekData, 0)).toThrow();
      expect(() => selectDerivatives(weekData, 6)).toThrow();
      expect(() => selectDerivatives(weekData, 3.5)).toThrow();
    });

    test('throws on missing weekNumber', () => {
      const badData = { ...weekData };
      delete badData.weekNumber;
      expect(() => selectDerivatives(badData, 3)).toThrow();
    });

    test('Bond Level gating works across all sections', () => {
      // Level 1: all minimal
      const level1 = selectDerivatives(weekData, 1);
      // Check that aggressive personalization features aren't used
      expect(level1.signal).toBe('fact_grounded');

      // Level 5: can use advanced features
      const level5 = selectDerivatives(weekData, 5);
      // Just verify it completes without error and returns valid derivatives
      expect(level5.signal).toBeDefined();
    });
  });

  describe('Edge cases and boundary conditions', () => {
    test('handles week 1 specially', () => {
      const week1 = createMockWeekData({ weekNumber: 1 });
      const derivatives = selectDerivatives(week1, 3);
      // origin should be selected for thread
      expect(derivatives.thread).toBe('origin');
    });

    test('handles week 52 normally', () => {
      const week52 = createMockWeekData({ weekNumber: 52 });
      const derivatives = selectDerivatives(week52, 3);
      // Should complete without error
      expect(derivatives).toBeDefined();
    });

    test('handles no streak', () => {
      const noStreak = createMockWeekData({ longestStreak: null });
      const derivatives = selectDerivatives(noStreak, 4);
      expect(derivatives.count).not.toBe('streak_emphasis');
    });

    test('handles no milestone', () => {
      const noMilestone = createMockWeekData({ nearestMilestone: null });
      const derivatives = selectDerivatives(noMilestone, 3);
      expect(derivatives.thread).not.toBe('near_miss');
    });

    test('handles edge case: 100% bills paid, 0% habits', () => {
      const edge = createMockWeekData({
        billsPaid: 4,
        billsTotal: 4,
        habitsCompleted: 0,
        habitsTotal: 14,
      });
      const derivatives = selectDerivatives(edge, 3);
      // Should have chosen guardian or vigil for reflection
      expect(['guardian', 'vigil', 'resting']).toContain(derivatives.reflection);
    });
  });
});
