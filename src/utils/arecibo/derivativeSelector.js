/**
 * @fileoverview Derivative selector for Arecibo sections
 * Deterministically chooses one derivative per section based on weekData and Bond Level
 *
 * Logic:
 * - Bond Level 1-2: Minimal, generic derivatives only
 * - Bond Level 3: Can use stated symbols and preferences
 * - Bond Level 4: Can quote sources and reference data
 * - Bond Level 5: Deep personalization, callbacks, callbacks
 *
 * Week sentiment (victory/tough/mixed) influences emotional choices
 */

/**
 * Simple deterministic hash for week number
 * Used to pseudo-randomly select derivatives in a deterministic way
 * Same week number always produces same derivative selection
 *
 * @param {number} weekNumber
 * @returns {number} Hash value 0-999
 */
function hashWeek(weekNumber) {
  // Simple LCG (Linear Congruential Generator)
  const a = 1103515245;
  const c = 12345;
  const m = 2 ** 31;
  return Math.abs((a * weekNumber + c) % m) % 1000;
}

/**
 * Select derivative for COUNT section based on week data
 *
 * Derivatives: 'standard', 'highlight', 'streak_emphasis', 'minimal'
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string} Chosen derivative
 */
function selectCountDerivative(weekData, bondLevel) {
  const hash = hashWeek(weekData.weekNumber);

  // Bond Level 1-2: only standard
  if (bondLevel <= 2) {
    return 'standard';
  }

  // Bond Level 3+: can use emphasis if conditions met
  if (bondLevel >= 3) {
    // If a strong streak exists, emphasize it
    if (weekData.longestStreak && weekData.longestStreak.days >= 7) {
      return 'streak_emphasis';
    }

    // If tough week and bills were paid, highlight that win
    if (weekData.weekSentiment === 'tough' && weekData.billsPaid === weekData.billsTotal) {
      return 'highlight';
    }

    // Default for level 3+: use hash to vary
    const choice = hash % 4;
    return ['standard', 'highlight', 'streak_emphasis', 'minimal'][choice];
  }

  return 'standard';
}

/**
 * Select derivative for ELEMENTS section
 *
 * Derivatives: 'full', 'dominant', 'discovery', 'decay'
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string}
 */
function selectElementsDerivative(weekData, bondLevel) {
  const hash = hashWeek(weekData.weekNumber);

  // Bond Level 1-2: full habits only
  if (bondLevel <= 2) {
    return 'full';
  }

  // Bond Level 3+: can emphasize dominant or show changes
  if (bondLevel >= 3) {
    const habits = weekData.activeHabits || [];
    
    // If no habits, return full
    if (habits.length === 0) {
      return 'full';
    }

    // If a habit is breaking (decay)
    const decayingHabit = habits.find((h) => h.completed < Math.ceil(h.total / 2));
    if (decayingHabit && weekData.weekSentiment === 'tough') {
      return 'decay';
    }

    // If a habit is dominant (high completion)
    const dominantHabit = habits.reduce((prev, curr) => {
      const prevRatio = prev.completed / (prev.total || 1);
      const currRatio = curr.completed / (curr.total || 1);
      return currRatio > prevRatio ? curr : prev;
    });
    if (dominantHabit && dominantHabit.completed === dominantHabit.total) {
      return 'dominant';
    }

    // Default: use hash
    const choice = hash % 4;
    return ['full', 'dominant', 'discovery', 'decay'][choice];
  }

  return 'full';
}

/**
 * Select derivative for PATTERN section (daily intensity)
 *
 * Derivatives: 'heatmap', 'waveform', 'binary_pulse', 'bookend'
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string}
 */
function selectPatternDerivative(weekData, bondLevel) {
  const hash = hashWeek(weekData.weekNumber);
  const intensity = weekData.dailyIntensity || [5, 5, 5, 5, 5, 5, 5];

  // Bond Level 1-2: heatmap only (simplest)
  if (bondLevel <= 2) {
    return 'heatmap';
  }

  // Bond Level 3+: can use more expressive patterns
  if (bondLevel >= 3) {
    // If week starts different from end, use bookend
    const startAvg = intensity.slice(0, 2).reduce((a, b) => a + b) / 2;
    const endAvg = intensity.slice(5, 7).reduce((a, b) => a + b) / 2;
    if (Math.abs(startAvg - endAvg) > 4) {
      return 'bookend';
    }

    // Otherwise: hash to vary
    const choice = hash % 4;
    return ['heatmap', 'waveform', 'binary_pulse', 'bookend'][choice];
  }

  return 'heatmap';
}

/**
 * Select derivative for THREAD section (streaks/milestones)
 *
 * Derivatives: 'clean_helix', 'growth_thread', 'near_miss', 'origin'
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string}
 */
function selectThreadDerivative(weekData, bondLevel) {
  const hash = hashWeek(weekData.weekNumber);

  // Bond Level 1-2: clean helix only
  if (bondLevel <= 2) {
    return 'clean_helix';
  }

  // Bond Level 3+: can show progression and milestones
  if (bondLevel >= 3) {
    // If close to milestone, show near_miss
    if (weekData.nearestMilestone && weekData.nearestMilestone.daysAway <= 7) {
      return 'near_miss';
    }

    // If early weeks (1-3), show origin growth
    if (weekData.weekNumber <= 3) {
      return 'origin';
    }

    // If showing growth trajectory
    if (weekData.longestStreak && weekData.longestStreak.days > 14) {
      return 'growth_thread';
    }

    // Default: hash
    const choice = hash % 4;
    return ['clean_helix', 'growth_thread', 'near_miss', 'origin'][choice];
  }

  return 'clean_helix';
}

/**
 * Select derivative for REFLECTION section (companion pose)
 *
 * Derivatives: 'victory', 'working', 'resting', 'guardian', 'celebration', 'vigil'
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string}
 */
function selectReflectionDerivative(weekData, bondLevel) {
  const habitCompletion = weekData.habitsTotal > 0 ? weekData.habitsCompleted / weekData.habitsTotal : 0;

  // Bond Level 1-2: working pose only (neutral)
  if (bondLevel <= 2) {
    return 'working';
  }

  // Bond Level 3+: can express sentiment
  if (bondLevel >= 3) {
    // Victory week: strong completion, high XP
    if (weekData.weekSentiment === 'victory') {
      return habitCompletion > 0.75 ? 'victory' : 'celebration';
    }

    // Tough week: survival, resilience
    if (weekData.weekSentiment === 'tough') {
      return weekData.billsPaid === weekData.billsTotal ? 'guardian' : 'vigil';
    }

    // Mixed/neutral: working or resting
    if (weekData.weekSentiment === 'mixed') {
      return habitCompletion < 0.5 ? 'resting' : 'working';
    }

    // Default
    return 'working';
  }

  return 'working';
}

/**
 * Select derivative for KINGDOM section
 *
 * Derivatives: 'overview', 'growth_compare', 'spotlight', 'seasonal'
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string}
 */
function selectKingdomDerivative(weekData, bondLevel) {
  const hash = hashWeek(weekData.weekNumber);

  // Bond Level 1-2: overview only
  if (bondLevel <= 2) {
    return 'overview';
  }

  // Bond Level 3+: can show changes and seasonality
  if (bondLevel >= 3) {
    // If a milestone was hit (high XP), spotlight the new structure
    if (weekData.bondXpEarned > 100) {
      return 'spotlight';
    }

    // If showing growth over time
    if (weekData.weekNumber > 4) {
      return 'growth_compare';
    }

    // Otherwise: hash
    const choice = hash % 4;
    return ['overview', 'growth_compare', 'spotlight', 'seasonal'][choice];
  }

  return 'overview';
}

/**
 * Select derivative for SIGNAL section (most Bond-dependent)
 *
 * Derivatives: 'fact_grounded', 'quote', 'verse', 'symbolic', 'callback'
 *
 * Bond Level Gates:
 * - Level 1-2: only 'fact_grounded' (generic, data-driven)
 * - Level 3: can use 'quote' (stated sources)
 * - Level 4: can quote sources (verified)
 * - Level 5: can do 'callback' (deep personal memory), 'symbolic' (stylized)
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {string}
 */
function selectSignalDerivative(weekData, bondLevel) {
  // Level 1-2: fact-grounded only
  if (bondLevel <= 2) {
    return 'fact_grounded';
  }

  // Level 3: can use quotes or symbolic
  if (bondLevel === 3) {
    if (weekData.weekSentiment === 'tough') {
      return 'quote'; // Encouragement quote for tough weeks
    }
    return 'fact_grounded'; // Default still data-driven
  }

  // Level 4: can quote sources with more freedom
  if (bondLevel === 4) {
    if (weekData.weekSentiment === 'victory') {
      return 'quote';
    }
    if (weekData.weekSentiment === 'tough') {
      return 'verse'; // Deeper message for hard weeks
    }
    return 'fact_grounded';
  }

  // Level 5: full personalization
  if (bondLevel === 5) {
    // Callback if week number > 5 (has history)
    if (weekData.weekNumber > 5) {
      return 'callback';
    }

    // Symbolic if victory or special milestone
    if (weekData.weekSentiment === 'victory' && weekData.bondXpEarned > 100) {
      return 'symbolic';
    }

    // Quote or verse based on sentiment
    if (weekData.weekSentiment === 'tough') {
      return 'verse';
    }

    return 'quote';
  }

  return 'fact_grounded';
}

/**
 * Main export: select all derivatives for a week
 *
 * Deterministic: Same weekData + bondLevel always produces same derivatives
 *
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {Object} Selected derivatives per section
 */
function selectDerivatives(weekData, bondLevel) {
  // Validate inputs
  if (!weekData || typeof weekData.weekNumber !== 'number') {
    throw new Error('selectDerivatives: weekData.weekNumber must be a number');
  }
  if (!Number.isInteger(bondLevel) || bondLevel < 1 || bondLevel > 5) {
    throw new Error('selectDerivatives: bondLevel must be an integer 1-5');
  }

  return {
    count: selectCountDerivative(weekData, bondLevel),
    elements: selectElementsDerivative(weekData, bondLevel),
    pattern: selectPatternDerivative(weekData, bondLevel),
    thread: selectThreadDerivative(weekData, bondLevel),
    reflection: selectReflectionDerivative(weekData, bondLevel),
    kingdom: selectKingdomDerivative(weekData, bondLevel),
    signal: selectSignalDerivative(weekData, bondLevel),
  };
}

export {
  selectDerivatives,
  selectCountDerivative,
  selectElementsDerivative,
  selectPatternDerivative,
  selectThreadDerivative,
  selectReflectionDerivative,
  selectKingdomDerivative,
  selectSignalDerivative,
  hashWeek,
};
