/**
 * @fileoverview Tests for Expression Engine
 * Verifies:
 * - LLM fallback logic (handles unavailable LLM gracefully)
 * - Template generation (deterministic, valid)
 * - AreciboIntent contract validation
 * - Sentiment detection
 * - Week context assembly
 */

import {
  generateAreciboIntent,
  validateAreciboOutput,
  computeWeekSentiment,
} from '../expressionEngine.js';

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
    ],
    dailyIntensity: [3, 5, 7, 6, 8, 4, 2],
    longestStreak: { habit: 'meditation', days: 12 },
    nearestMilestone: { type: 'streak', daysAway: 3, target: 14 },
    weekSentiment: 'mixed',
    bondLevel: 3,
    companionName: 'Companion',
    kingdomName: 'TestKingdom',
    weeksEngaged: 5,
    ...overrides,
  };
}

function createMockTasteProfile(overrides = {}) {
  return {
    favoriteSymbols: ['lantern'],
    favoriteSources: ['Marcus Aurelius'],
    favoriteItems: ['guitar'],
    faithMode: false,
    ...overrides,
  };
}

describe('Expression Engine', () => {
  describe('Test 1: Template fallback (no LLM)', () => {
    test('should generate valid AreciboIntent without LLM', async () => {
      const weekData = createMockWeekData();
      const tasteProfile = createMockTasteProfile();

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile,
        llmBudget: 0, // No LLM budget
        llmService: null,
      });

      // Verify structure
      expect(intent).toBeTruthy();
      expect(intent.weekNumber).toBe(5);
      expect(intent.sections).toBeTruthy();
      expect(intent.sections.count).toBeTruthy();
      expect(intent.sections.signal).toBeTruthy();
    });

    test('should generate all 7 sections', async () => {
      const weekData = createMockWeekData();
      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 2,
        tasteProfile: {},
        llmBudget: 0,
      });

      const required = [
        'count',
        'elements',
        'pattern',
        'thread',
        'reflection',
        'kingdom',
        'signal',
      ];
      required.forEach((sectionName) => {
        expect(intent.sections[sectionName]).toBeTruthy();
        expect(intent.sections[sectionName].derivative).toBeTruthy();
      });
    });

    test('should assign valid derivatives', async () => {
      const weekData = createMockWeekData();
      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile: createMockTasteProfile(),
        llmBudget: 0,
      });

      // Verify each derivative is valid
      const validDerivatives = {
        count: ['standard', 'highlight', 'streak_emphasis', 'minimal'],
        elements: ['full', 'dominant', 'discovery', 'decay'],
        pattern: ['heatmap', 'waveform', 'binary_pulse', 'bookend'],
        thread: ['clean_helix', 'growth_thread', 'near_miss', 'origin'],
        reflection: ['victory', 'working', 'resting', 'guardian', 'celebration', 'vigil'],
        kingdom: ['overview', 'growth_compare', 'spotlight', 'seasonal'],
        signal: ['fact_grounded', 'quote', 'verse', 'symbolic', 'callback'],
      };

      Object.entries(validDerivatives).forEach(([section, allowed]) => {
        expect(allowed).toContain(intent.sections[section].derivative);
      });
    });
  });

  describe('Test 2: Sentiment detection', () => {
    test('should detect TOUGH week', () => {
      const result = computeWeekSentiment(
        1,
        4, // 1/4 bills (< 50%)
        7,
        14 // 7/14 habits (50%)
      );
      expect(result).toBe('tough');
    });

    test('should detect TOUGH week when habits fail', () => {
      const result = computeWeekSentiment(
        4,
        4, // All bills
        5,
        14 // 5/14 habits (< 50%)
      );
      expect(result).toBe('tough');
    });

    test('should detect VICTORY week', () => {
      const result = computeWeekSentiment(
        4,
        4, // All bills
        12,
        14 // 12/14 habits (> 80%)
      );
      expect(result).toBe('victory');
    });

    test('should detect MIXED week', () => {
      const result = computeWeekSentiment(
        2,
        4, // 50% bills
        8,
        14 // 57% habits
      );
      expect(result).toBe('mixed');
    });

    test('should handle edge case: no bills', () => {
      const result = computeWeekSentiment(
        0,
        0, // No bills
        7,
        14
      );
      expect(result).toBe('mixed');
    });
  });

  describe('Test 3: Bond Level gating', () => {
    test('Bond 1: minimal personalization', async () => {
      const weekData = createMockWeekData({ bondLevel: 1 });
      const tasteProfile = createMockTasteProfile();

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 1,
        tasteProfile,
        llmBudget: 0,
      });

      // Bond 1 should use generic derivatives
      expect(intent.sections.signal.derivative).toBe('fact_grounded');
      expect(intent.sections.reflection.heldItem).toBeNull();
    });

    test('Bond 3: can use symbols', async () => {
      const weekData = createMockWeekData({ bondLevel: 3 });
      const tasteProfile = createMockTasteProfile();

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile,
        llmBudget: 0,
      });

      // Bond 3 can use held items
      if (intent.sections.reflection.heldItem) {
        expect(['guitar', 'shield', 'sword', 'staff']).toContain(
          intent.sections.reflection.heldItem
        );
      }
    });

    test('Bond 5: should include personal items in reflection', async () => {
      const weekData = createMockWeekData({
        bondLevel: 5,
        weekSentiment: 'victory',
      });
      const tasteProfile = createMockTasteProfile();

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 5,
        tasteProfile,
        llmBudget: 0,
      });

      // Bond 5 can use personal held items
      expect(intent.sections.reflection.heldItem).toBeTruthy();
    });
  });

  describe('Test 4: Tough week handling', () => {
    test('should respect hard-week dignity protocol', async () => {
      const weekData = createMockWeekData({
        weekSentiment: 'tough',
        billsPaid: 1,
        billsTotal: 4,
        habitsCompleted: 5,
        habitsTotal: 14,
      });

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 2,
        tasteProfile: {},
        llmBudget: 0,
      });

      // Reflection should use appropriate pose
      expect(['vigil', 'guardian', 'resting', 'working']).toContain(
        intent.sections.reflection.derivative
      );

      // Signal should be fact-grounded (no fake triumph)
      expect(intent.sections.signal.derivative).toBe('fact_grounded');

      // Validate no toxic positivity in message
      const validation = validateAreciboOutput(intent, weekData);
      expect(validation.valid).toBe(true);
    });

    test('should NOT use victory pose on tough week', async () => {
      const weekData = createMockWeekData({
        weekSentiment: 'tough',
        billsPaid: 1,
        billsTotal: 4,
        habitsCompleted: 3,
        habitsTotal: 14,
      });

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile: createMockTasteProfile(),
        llmBudget: 0,
      });

      expect(intent.sections.reflection.derivative).not.toBe('victory');
      expect(intent.sections.reflection.derivative).not.toBe('celebration');
    });
  });

  describe('Test 5: Victory week handling', () => {
    test('should celebrate appropriately on victory week', async () => {
      const weekData = createMockWeekData({
        weekSentiment: 'victory',
        billsPaid: 4,
        billsTotal: 4,
        habitsCompleted: 13,
        habitsTotal: 14,
        longestStreak: { habit: 'meditation', days: 21 },
      });

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile: createMockTasteProfile(),
        llmBudget: 0,
      });

      // Can use celebration or victory pose
      expect(['celebration', 'victory', 'working']).toContain(
        intent.sections.reflection.derivative
      );

      // Signal should reference the wins
      expect(intent.sections.signal.message).toMatch(/\d+/);
    });
  });

  describe('Test 6: LLM fallback on error', () => {
    test('should fallback to templates if LLM fails', async () => {
      const mockLLMService = {
        call: async () => {
          throw new Error('API error');
        },
      };

      const weekData = createMockWeekData();
      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile: createMockTasteProfile(),
        llmBudget: 1,
        llmService: mockLLMService,
      });

      // Should still return valid intent (from templates)
      expect(intent).toBeTruthy();
      expect(intent.sections).toBeTruthy();
      expect(intent.sections.count).toBeTruthy();
    });

    test('should fallback if LLM response is invalid JSON', async () => {
      const mockLLMService = {
        call: async () => ({
          content: 'not valid json',
        }),
      };

      const weekData = createMockWeekData();
      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 2,
        tasteProfile: {},
        llmBudget: 1,
        llmService: mockLLMService,
      });

      expect(intent).toBeTruthy();
      expect(intent.sections).toBeTruthy();
    });

    test('should respect 8-second timeout', async () => {
      const mockLLMService = {
        call: async () => {
          // Simulate slow response
          return new Promise((resolve) =>
            setTimeout(() => resolve({ content: '{}' }), 10000)
          );
        },
      };

      const weekData = createMockWeekData();
      const startTime = Date.now();

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 2,
        tasteProfile: {},
        llmBudget: 1,
        llmService: mockLLMService,
      });

      const elapsed = Date.now() - startTime;

      // Should fallback quickly, not wait 10 seconds
      expect(elapsed).toBeLessThan(10000);
      expect(intent).toBeTruthy();
    }, 15000); // Jest timeout
  });

  describe('Test 7: Habit streak handling', () => {
    test('should emphasize active streaks in COUNT section', async () => {
      const weekData = createMockWeekData({
        longestStreak: { habit: 'meditation', days: 21 },
        bondLevel: 3,
      });

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile: createMockTasteProfile(),
        llmBudget: 0,
      });

      // High-bond weeks with notable streaks might use emphasis
      expect(intent.sections.thread.longestStreak.days).toBe(21);
    });

    test('should include nearestMilestone data', async () => {
      const weekData = createMockWeekData({
        nearestMilestone: { type: 'streak', daysAway: 3, target: 30 },
      });

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 2,
        tasteProfile: {},
        llmBudget: 0,
      });

      expect(intent.sections.thread.nearestMilestone).toBeTruthy();
      expect(intent.sections.thread.nearestMilestone.daysAway).toBe(3);
    });
  });

  describe('Test 8: Output validation', () => {
    test('should validate complete AreciboIntent', async () => {
      const weekData = createMockWeekData();
      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile: createMockTasteProfile(),
        llmBudget: 0,
      });

      const validation = validateAreciboOutput(intent, weekData, createMockTasteProfile());

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should reject intent missing sections', () => {
      const incompleteIntent = {
        weekNumber: 5,
        sections: {
          count: { derivative: 'standard', stats: {} },
          // Missing other sections
        },
      };

      const weekData = createMockWeekData();
      const validation = validateAreciboOutput(incompleteIntent, weekData);

      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Test 9: Determinism (same input = same output)', () => {
    test('template generation should be deterministic', async () => {
      const weekData = createMockWeekData({ weekNumber: 7 });
      const tasteProfile = createMockTasteProfile();

      const intent1 = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile,
        llmBudget: 0,
      });

      const intent2 = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile,
        llmBudget: 0,
      });

      // Same week number + bondLevel = same derivatives
      expect(intent1.sections.count.derivative).toBe(intent2.sections.count.derivative);
      expect(intent1.sections.reflection.derivative).toBe(intent2.sections.reflection.derivative);
    });
  });

  describe('Test 10: Integration: tough week end-to-end', () => {
    test('complete tough week flow respects dignity protocol', async () => {
      const weekData = createMockWeekData({
        weekSentiment: 'tough',
        weekNumber: 8,
        billsPaid: 1,
        billsTotal: 4,
        habitsCompleted: 4,
        habitsTotal: 14,
        meetings: 1,
        daysActive: 4,
        longestStreak: { habit: 'meditation', days: 0 },
      });

      const tasteProfile = createMockTasteProfile();

      const intent = await generateAreciboIntent({
        weekData,
        bondLevel: 3,
        tasteProfile,
        llmBudget: 0,
      });

      // Validate structure
      expect(intent.weekNumber).toBe(8);
      expect(intent.sections).toBeTruthy();

      // Validate tough-week appropriateness
      expect(intent.sections.reflection.derivative).not.toBe('victory');
      expect(intent.sections.reflection.derivative).not.toBe('celebration');
      expect(intent.sections.signal.derivative).toBe('fact_grounded');

      // Full validation
      const validation = validateAreciboOutput(intent, weekData, tasteProfile);
      expect(validation.valid).toBe(true);

      // Signal message should be honest, not toxic
      const signalMsg = intent.sections.signal.message;
      expect(signalMsg).toBeTruthy();
      expect(signalMsg.toLowerCase()).not.toMatch(/amazing|wonderful|blessing/);
    });
  });
});
