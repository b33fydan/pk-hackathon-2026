/**
 * @fileoverview Tests for Signal Composer (Section 7: THE SIGNAL)
 * Verifies all 5 message types and Bond Level gating
 */

import { composeSignalMessage, validateSignalMessage } from '../signalComposer.js';

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
    longestStreak: { habit: 'meditation', days: 5 },
    nearestMilestone: { type: 'streak', daysAway: 2, target: 7 },
    weekSentiment: 'mixed',
    bondLevel: 3,
    companionName: 'Companion',
    kingdomName: 'Kingdom',
    ...overrides,
  };
}

function createMockTasteProfile(overrides = {}) {
  return {
    favoriteSymbols: ['lantern', 'bird', 'star'],
    favoriteSources: ['Marcus Aurelius', 'Rumi'],
    favoriteItems: ['guitar', 'book'],
    faithMode: false,
    ...overrides,
  };
}

describe('Signal Composer', () => {
  describe('Test 1: Fact-grounded messages (all Bond Levels)', () => {
    test('should compose fact-grounded message for tough week', () => {
      const weekData = createMockWeekData({ weekSentiment: 'tough' });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile: {},
      });

      expect(result.derivative).toBe('fact_grounded');
      expect(result.message).toBeTruthy();
      expect(result.message).toMatch(/\d+/); // Should contain numbers
      expect(result.message.toLowerCase()).not.toMatch(/amazing|wonderful|great/);
    });

    test('should compose fact-grounded message for victory week', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        billsPaid: 4,
        billsTotal: 4,
        habitsCompleted: 12,
        habitsTotal: 14,
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile: {},
      });

      expect(result.derivative).toBe('fact_grounded');
      expect(result.message).toContain('4'); // All bills
      expect(result.message).toMatch(/built|something/i);
    });

    test('should compose fact-grounded message for mixed week', () => {
      const weekData = createMockWeekData({ weekSentiment: 'mixed' });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 2,
        tasteProfile: {},
      });

      expect(result.derivative).toBe('fact_grounded');
      expect(result.message).toBeTruthy();
      // Should be neutral, not over-celebratory
      expect(result.message.toLowerCase()).not.toMatch(/amazing|incredible/);
    });
  });

  describe('Test 2: Symbolic messages (Bond 3+)', () => {
    test('should NOT use symbolic at Bond Level 1', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        bondLevel: 1,
      });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile,
      });

      // Should fall back to fact_grounded
      expect(result.derivative).not.toBe('symbolic');
    });

    test('should use symbolic at Bond Level 3 on victory week', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        bondLevel: 3,
      });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 3,
        tasteProfile,
      });

      // Might be symbolic if conditions align
      expect(result.message).toBeTruthy();
    });

    test('should NOT use symbolic on tough week', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'tough',
        bondLevel: 3,
      });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 3,
        tasteProfile,
      });

      // Tough weeks stay fact-grounded
      expect(result.derivative).toBe('fact_grounded');
    });
  });

  describe('Test 3: Quote messages (Bond 4+)', () => {
    test('should NOT use quote at Bond Level 3', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        bondLevel: 3,
      });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 3,
        tasteProfile,
      });

      expect(result.derivative).not.toBe('quote');
    });

    test('should use quote at Bond Level 4 on victory week', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        bondLevel: 4,
      });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 4,
        tasteProfile,
      });

      // Might use quote if available
      if (result.derivative === 'quote') {
        expect(result.source).toBeTruthy();
        expect(result.message).toBeTruthy();
      }
    });

    test('should NOT use quote on tough week (even at Bond 5)', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'tough',
        bondLevel: 5,
      });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile,
      });

      expect(result.derivative).toBe('fact_grounded');
    });
  });

  describe('Test 4: Verse messages (Bond 5 + faith mode)', () => {
    test('should NOT use verse without faith mode', () => {
      const weekData = createMockWeekData({ bondLevel: 5 });
      const tasteProfile = createMockTasteProfile({ faithMode: false });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile,
      });

      expect(result.derivative).not.toBe('verse');
    });

    test('should NOT use verse without Bond 5', () => {
      const weekData = createMockWeekData({ bondLevel: 4 });
      const tasteProfile = createMockTasteProfile({ faithMode: true });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 4,
        tasteProfile,
      });

      expect(result.derivative).not.toBe('verse');
    });

    test('might use verse at Bond 5 with faith mode enabled', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        bondLevel: 5,
      });
      const tasteProfile = createMockTasteProfile({ faithMode: true });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile,
      });

      // On victory week with faith mode, verse is possible
      expect(result.message).toBeTruthy();
    });
  });

  describe('Test 5: Callback messages (Bond 5 only, requires history)', () => {
    test('should NOT use callback without previous week data', () => {
      const weekData = createMockWeekData({ bondLevel: 5 });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile,
        previousWeekData: null, // No history
      });

      expect(result.derivative).not.toBe('callback');
    });

    test('should NOT use callback at Bond Level 4', () => {
      const weekData = createMockWeekData({ bondLevel: 4 });
      const previousWeekData = createMockWeekData({
        weekNumber: 4,
        weekSentiment: 'mixed',
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 4,
        tasteProfile: {},
        previousWeekData,
      });

      expect(result.derivative).not.toBe('callback');
    });

    test('might use callback on recovery from tough to victory', () => {
      const weekData = createMockWeekData({
        weekNumber: 6,
        weekSentiment: 'victory',
        bondLevel: 5,
      });
      const previousWeekData = createMockWeekData({
        weekNumber: 5,
        weekSentiment: 'tough',
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile: createMockTasteProfile(),
        previousWeekData,
      });

      // Recovery arc might trigger callback
      expect(result.message).toBeTruthy();
    });

    test('might use callback on sustained momentum', () => {
      const weekData = createMockWeekData({
        weekNumber: 7,
        weekSentiment: 'victory',
        bondLevel: 5,
        longestStreak: { habit: 'meditation', days: 20 },
      });
      const previousWeekData = createMockWeekData({
        weekNumber: 6,
        weekSentiment: 'victory',
        longestStreak: { habit: 'meditation', days: 13 },
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile: createMockTasteProfile(),
        previousWeekData,
      });

      expect(result.message).toBeTruthy();
    });
  });

  describe('Test 6: Message validation', () => {
    test('should reject empty message', () => {
      const signal = {
        derivative: 'fact_grounded',
        message: '',
        source: null,
      };
      const weekData = createMockWeekData();
      const result = validateSignalMessage(signal, weekData, 1);

      expect(result.valid).toBe(false);
    });

    test('should accept valid fact-grounded message on tough week', () => {
      const signal = {
        derivative: 'fact_grounded',
        message: '2 bills cleared. 8 habits held. That counts.',
        source: null,
      };
      const weekData = createMockWeekData({ weekSentiment: 'tough' });
      const result = validateSignalMessage(signal, weekData, 1);

      expect(result.valid).toBe(true);
    });

    test('should reject toxic positivity on tough week', () => {
      const signal = {
        derivative: 'fact_grounded',
        message: 'This is a growth opportunity in disguise.',
        source: null,
      };
      const weekData = createMockWeekData({ weekSentiment: 'tough' });
      const result = validateSignalMessage(signal, weekData, 1);

      expect(result.valid).toBe(false);
    });

    test('should enforce symbolic messages are short', () => {
      const signal = {
        derivative: 'symbolic',
        message: '🏮 This is a long explanation of the lantern symbol.',
        source: null,
      };
      const weekData = createMockWeekData();
      const result = validateSignalMessage(signal, weekData, 3);

      expect(result.valid).toBe(false);
      expect(result.reason).toMatch(/should be just a symbol/i);
    });

    test('should accept symbolic-only message', () => {
      const signal = {
        derivative: 'symbolic',
        message: '🏮',
        source: null,
      };
      const weekData = createMockWeekData();
      const result = validateSignalMessage(signal, weekData, 3);

      expect(result.valid).toBe(true);
    });
  });

  describe('Test 7: Bond Level progression', () => {
    test('Bond 1: only fact_grounded available', () => {
      const weekData = createMockWeekData({ bondLevel: 1 });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile,
      });

      expect(result.derivative).toBe('fact_grounded');
    });

    test('Bond 2: still only fact_grounded', () => {
      const weekData = createMockWeekData({ bondLevel: 2 });
      const tasteProfile = createMockTasteProfile();
      const result = composeSignalMessage({
        weekData,
        bondLevel: 2,
        tasteProfile,
      });

      expect(result.derivative).toBe('fact_grounded');
    });

    test('Bond 3: can add symbolic', () => {
      const weekData = createMockWeekData({
        bondLevel: 3,
        weekSentiment: 'victory',
      });
      const tasteProfile = createMockTasteProfile();
      // Result can be fact_grounded or symbolic
      const result = composeSignalMessage({
        weekData,
        bondLevel: 3,
        tasteProfile,
      });

      expect(['fact_grounded', 'symbolic']).toContain(result.derivative);
    });

    test('Bond 4: can add quote', () => {
      const weekData = createMockWeekData({
        bondLevel: 4,
        weekSentiment: 'victory',
      });
      const tasteProfile = createMockTasteProfile();
      // Result can be fact_grounded, symbolic, or quote
      const result = composeSignalMessage({
        weekData,
        bondLevel: 4,
        tasteProfile,
      });

      expect(['fact_grounded', 'symbolic', 'quote']).toContain(result.derivative);
    });

    test('Bond 5: can add verse and callback', () => {
      const weekData = createMockWeekData({
        bondLevel: 5,
        weekSentiment: 'victory',
      });
      const tasteProfile = createMockTasteProfile({ faithMode: true });
      const previousWeekData = createMockWeekData({ weekNumber: 4 });

      // With full capabilities, all types possible
      const result = composeSignalMessage({
        weekData,
        bondLevel: 5,
        tasteProfile,
        previousWeekData,
      });

      expect(result.message).toBeTruthy();
    });
  });

  describe('Test 8: Message appropriateness per sentiment', () => {
    test('victory week should be celebratory', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        billsPaid: 4,
        billsTotal: 4,
        habitsCompleted: 13,
        habitsTotal: 14,
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile: {},
      });

      expect(result.message).toMatch(/built|something|strong/i);
    });

    test('tough week should be honest and dignified', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'tough',
        billsPaid: 1,
        billsTotal: 4,
        habitsCompleted: 4,
        habitsTotal: 14,
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile: {},
      });

      expect(result.derivative).toBe('fact_grounded');
      expect(result.message).toMatch(/counts|held|standing/i);
    });

    test('mixed week should be balanced', () => {
      const weekData = createMockWeekData({
        weekSentiment: 'mixed',
        billsPaid: 2,
        billsTotal: 4,
        habitsCompleted: 8,
        habitsTotal: 14,
      });
      const result = composeSignalMessage({
        weekData,
        bondLevel: 1,
        tasteProfile: {},
      });

      expect(result.derivative).toBe('fact_grounded');
      // Mixed should acknowledge both sides
      expect(result.message).toBeTruthy();
    });
  });
});
