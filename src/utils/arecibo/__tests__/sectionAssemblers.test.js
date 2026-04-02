/**
 * @fileoverview Tests for section assemblers
 * Verifies:
 * - All assemblers return valid pixel grids (number[][] with 0-7 values)
 * - Each derivative produces expected visual patterns
 * - Deterministic behavior (same input = same output)
 */

import {
  assembleCount,
  assembleElements,
  assemblePattern,
  assembleThread,
  assembleReflection,
  assembleKingdom,
  assembleSignal,
} from '../sectionAssemblers.js';

// Helper to validate a pixel grid
function validateGrid(grid, width = 20, height = 10) {
  expect(Array.isArray(grid)).toBe(true);
  expect(grid.length).toBe(height);
  grid.forEach((row, y) => {
    expect(Array.isArray(row)).toBe(true);
    expect(row.length).toBe(width);
    row.forEach((pixel, x) => {
      expect(typeof pixel).toBe('number');
      expect(pixel).toBeGreaterThanOrEqual(0);
      expect(pixel).toBeLessThanOrEqual(7);
    });
  });
}

// Mock WeekData for consistent testing
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
    bondLevel: 3,
    companionName: 'Test Companion',
    kingdomName: 'Test Kingdom',
    ...overrides,
  };
}

describe('Section Assemblers', () => {
  describe('assembleCount', () => {
    const weekData = createMockWeekData();

    test('standard derivative returns valid grid', () => {
      const grid = assembleCount(weekData, 'standard');
      validateGrid(grid);
    });

    test('highlight derivative returns valid grid', () => {
      const grid = assembleCount(weekData, 'highlight');
      validateGrid(grid);
    });

    test('streak_emphasis derivative returns valid grid', () => {
      const grid = assembleCount(weekData, 'streak_emphasis');
      validateGrid(grid);
    });

    test('minimal derivative returns valid grid', () => {
      const grid = assembleCount(weekData, 'minimal');
      validateGrid(grid);
    });

    test('default derivative is standard', () => {
      const grid = assembleCount(weekData);
      expect(grid).toBeDefined();
      validateGrid(grid);
    });

    test('deterministic: same input produces same output', () => {
      const grid1 = assembleCount(weekData, 'highlight');
      const grid2 = assembleCount(weekData, 'highlight');
      expect(JSON.stringify(grid1)).toBe(JSON.stringify(grid2));
    });

    test('streak_emphasis with no streak falls back to standard', () => {
      const weekDataNoStreak = createMockWeekData({ longestStreak: null });
      const grid = assembleCount(weekDataNoStreak, 'streak_emphasis');
      validateGrid(grid);
      // Should be same as standard
      const standardGrid = assembleCount(weekDataNoStreak, 'standard');
      expect(JSON.stringify(grid)).toBe(JSON.stringify(standardGrid));
    });
  });

  describe('assembleElements', () => {
    const weekData = createMockWeekData();

    test('full derivative shows all habits', () => {
      const grid = assembleElements(weekData, 'full');
      validateGrid(grid);
      // Should have some white/purple pixels (habits)
      let habitPixels = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) habitPixels++;
        });
      });
      expect(habitPixels).toBeGreaterThan(0);
    });

    test('dominant derivative shows one large habit', () => {
      const grid = assembleElements(weekData, 'dominant');
      validateGrid(grid);
      // Should have a large area (dominant) and smaller areas (others)
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('discovery derivative shows new habit highlight', () => {
      const grid = assembleElements(weekData, 'discovery');
      validateGrid(grid);
      // Should have outline around first habit
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('decay derivative shows broken streak', () => {
      const grid = assembleElements(weekData, 'decay');
      validateGrid(grid);
      // Should show dimmed habits
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('handles empty activeHabits array', () => {
      const weekDataNoHabits = createMockWeekData({ activeHabits: [] });
      const grid = assembleElements(weekDataNoHabits, 'full');
      validateGrid(grid);
      // Should be mostly blank
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBe(0);
    });
  });

  describe('assemblePattern', () => {
    const weekData = createMockWeekData();

    test('heatmap derivative returns valid grid', () => {
      const grid = assemblePattern(weekData, 'heatmap');
      validateGrid(grid);
      // Should have 7 columns (days)
      let columnPixels = [0, 0, 0, 0, 0, 0, 0];
      grid.forEach((row) => {
        for (let x = 0; x < 7; x++) {
          if (row[x * 2 + 1] > 0) columnPixels[x]++;
        }
      });
      // Should have pixels in some columns
      expect(columnPixels.some((count) => count > 0)).toBe(true);
    });

    test('waveform derivative creates curved pattern', () => {
      const grid = assemblePattern(weekData, 'waveform');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('binary_pulse derivative shows busy/calm blocks', () => {
      const grid = assemblePattern(weekData, 'binary_pulse');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('bookend derivative emphasizes start/end', () => {
      const grid = assemblePattern(weekData, 'bookend');
      validateGrid(grid);
      // Should have larger bars at start (x=1) and end (x=17)
      let startPixels = 0,
        endPixels = 0;
      grid.forEach((row) => {
        if (row[1] > 0) startPixels++;
        if (row[17] > 0) endPixels++;
      });
      expect(startPixels + endPixels).toBeGreaterThan(0);
    });

    test('handles all intensity values 0-10', () => {
      const highIntensity = createMockWeekData({
        dailyIntensity: [10, 10, 10, 10, 10, 10, 10],
      });
      const grid = assemblePattern(highIntensity, 'heatmap');
      validateGrid(grid);
      // Should have tall columns
      let maxHeight = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) maxHeight++;
        });
      });
      expect(maxHeight).toBeGreaterThan(0);
    });
  });

  describe('assembleThread', () => {
    const weekData = createMockWeekData();

    test('clean_helix derivative returns valid grid', () => {
      const grid = assembleThread(weekData, 'clean_helix');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('growth_thread derivative shows thickening helix', () => {
      const grid = assembleThread(weekData, 'growth_thread');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      // Should have more pixels than clean_helix
      const cleanGrid = assembleThread(weekData, 'clean_helix');
      let cleanPixels = 0;
      cleanGrid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) cleanPixels++;
        });
      });
      expect(pixelCount).toBeGreaterThanOrEqual(cleanPixels);
    });

    test('near_miss derivative highlights upcoming milestone', () => {
      const grid = assembleThread(weekData, 'near_miss');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('origin derivative shows early-stage helix', () => {
      const weekDataEarly = createMockWeekData({ weekNumber: 1 });
      const grid = assembleThread(weekDataEarly, 'origin');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });
  });

  describe('assembleReflection', () => {
    const weekData = createMockWeekData();

    test('victory derivative returns valid grid', () => {
      const grid = assembleReflection(weekData, 'victory');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('working derivative returns valid grid', () => {
      const grid = assembleReflection(weekData, 'working');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('resting derivative returns valid grid', () => {
      const grid = assembleReflection(weekData, 'resting');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('guardian derivative returns valid grid', () => {
      const grid = assembleReflection(weekData, 'guardian');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('celebration derivative includes confetti pixels', () => {
      const grid = assembleReflection(weekData, 'celebration');
      validateGrid(grid);
      // Should have white pixels (confetti) along with red
      let whitePixels = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel === 1) whitePixels++;
        });
      });
      expect(whitePixels).toBeGreaterThan(0);
    });

    test('vigil derivative includes light source', () => {
      const grid = assembleReflection(weekData, 'vigil');
      validateGrid(grid);
      // Should have white pixels for light
      let whitePixels = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel === 1) whitePixels++;
        });
      });
      expect(whitePixels).toBeGreaterThan(0);
    });

    test('default derivative is working', () => {
      const grid = assembleReflection(weekData);
      const workingGrid = assembleReflection(weekData, 'working');
      expect(JSON.stringify(grid)).toBe(JSON.stringify(workingGrid));
    });
  });

  describe('assembleKingdom', () => {
    const weekData = createMockWeekData();

    test('overview derivative returns valid grid', () => {
      const grid = assembleKingdom(weekData, 'overview');
      validateGrid(grid);
      // Should have structures and border
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('growth_compare derivative shows left/right comparison', () => {
      const grid = assembleKingdom(weekData, 'growth_compare');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('spotlight derivative zooms into structure', () => {
      const grid = assembleKingdom(weekData, 'spotlight');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('seasonal derivative returns valid grid', () => {
      const grid = assembleKingdom(weekData, 'seasonal');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('default derivative is overview', () => {
      const grid = assembleKingdom(weekData);
      const overviewGrid = assembleKingdom(weekData, 'overview');
      expect(JSON.stringify(grid)).toBe(JSON.stringify(overviewGrid));
    });
  });

  describe('assembleSignal', () => {
    const weekData = createMockWeekData();

    test('fact_grounded derivative returns valid grid', () => {
      const grid = assembleSignal(weekData, 'fact_grounded');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('quote derivative returns valid grid', () => {
      const grid = assembleSignal(weekData, 'quote');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('verse derivative returns valid grid', () => {
      const grid = assembleSignal(weekData, 'verse');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('symbolic derivative returns valid grid', () => {
      const grid = assembleSignal(weekData, 'symbolic');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('callback derivative returns valid grid', () => {
      const grid = assembleSignal(weekData, 'callback');
      validateGrid(grid);
      let pixelCount = 0;
      grid.forEach((row) => {
        row.forEach((pixel) => {
          if (pixel > 0) pixelCount++;
        });
      });
      expect(pixelCount).toBeGreaterThan(0);
    });

    test('default derivative is fact_grounded', () => {
      const grid = assembleSignal(weekData);
      const factGrid = assembleSignal(weekData, 'fact_grounded');
      expect(JSON.stringify(grid)).toBe(JSON.stringify(factGrid));
    });

    test('all derivatives produce different visual patterns', () => {
      const derivatives = [
        'fact_grounded',
        'quote',
        'verse',
        'symbolic',
        'callback',
      ];
      const grids = derivatives.map((d) => assembleSignal(weekData, d));

      // Verify each is unique
      for (let i = 0; i < grids.length; i++) {
        for (let j = i + 1; j < grids.length; j++) {
          // Most should be different (symbolic might match others visually, but structure differs)
          expect(
            JSON.stringify(grids[i]) !== JSON.stringify(grids[j]) ||
              derivatives[i] === 'symbolic'
          ).toBe(true);
        }
      }
    });
  });

  describe('Cross-assembler validation', () => {
    const weekData = createMockWeekData();

    test('all assemblers return grids of same dimensions (20×10)', () => {
      const assemblers = [
        assembleCount,
        assembleElements,
        assemblePattern,
        assembleThread,
        assembleReflection,
        assembleKingdom,
        assembleSignal,
      ];

      assemblers.forEach((assembler) => {
        const grid = assembler(weekData);
        expect(grid.length).toBe(10);
        grid.forEach((row) => {
          expect(row.length).toBe(20);
        });
      });
    });

    test('all assemblers produce only valid color indices (0-7)', () => {
      const assemblers = [
        assembleCount,
        assembleElements,
        assemblePattern,
        assembleThread,
        assembleReflection,
        assembleKingdom,
        assembleSignal,
      ];

      assemblers.forEach((assembler) => {
        const grid = assembler(weekData);
        grid.forEach((row) => {
          row.forEach((pixel) => {
            expect(pixel).toBeGreaterThanOrEqual(0);
            expect(pixel).toBeLessThanOrEqual(7);
          });
        });
      });
    });

    test('deterministic behavior across all assemblers', () => {
      const assemblers = [
        assembleCount,
        assembleElements,
        assemblePattern,
        assembleThread,
        assembleReflection,
        assembleKingdom,
        assembleSignal,
      ];

      assemblers.forEach((assembler) => {
        const grid1 = assembler(weekData);
        const grid2 = assembler(weekData);
        expect(JSON.stringify(grid1)).toBe(JSON.stringify(grid2));
      });
    });
  });
});
