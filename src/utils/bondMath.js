/**
 * Bond Engine Math — Pure functions for Bond XP, levels, and cycle decay.
 * No store imports. Fully testable in isolation.
 */

// ── Bond Level Thresholds ────────────────────────────────

export const BOND_LEVELS = [
  { level: 1, xp: 0, label: 'Stranger', description: 'Generic decorations' },
  { level: 2, xp: 50, label: 'Acquaintance', description: 'Themed decorations' },
  { level: 3, xp: 150, label: 'Companion', description: 'Personal references' },
  { level: 4, xp: 300, label: 'Confidant', description: 'Contextual combinations' },
  { level: 5, xp: 500, label: 'Kindred', description: 'Deep expression' },
];

// ── XP Award Table ───────────────────────────────────────

export const BOND_XP_AWARDS = {
  add_bill: 10,
  add_habit: 15,
  share_interest: 20,
  share_artist: 25,
  share_motivation: 30,
  share_milestone: 35,
  domain_unlock: 50,
};

// ── Cycle Multipliers ────────────────────────────────────

const CYCLE_MULTIPLIERS = [1.0, 0.75, 0.50, 0.25];
const CYCLE_DURATION_DAYS = 28;
const DAYS_PER_WEEK = 7;

// ── Level Functions ──────────────────────────────────────

/**
 * Get bond level for a given XP total.
 * @param {number} xp
 * @returns {{ level: number, label: string, description: string }}
 */
export function getBondLevel(xp) {
  for (let i = BOND_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= BOND_LEVELS[i].xp) {
      return BOND_LEVELS[i];
    }
  }
  return BOND_LEVELS[0];
}

/**
 * Get progress toward the next bond level.
 * @param {number} xp
 * @returns {{ current: number, previousThreshold: number, nextThreshold: number|null, ratio: number }}
 */
export function getBondProgress(xp) {
  const currentLevel = getBondLevel(xp);
  const currentIndex = BOND_LEVELS.findIndex((l) => l.level === currentLevel.level);
  const nextLevel = BOND_LEVELS[currentIndex + 1];

  if (!nextLevel) {
    return {
      current: xp,
      previousThreshold: currentLevel.xp,
      nextThreshold: null,
      ratio: 1,
    };
  }

  const span = nextLevel.xp - currentLevel.xp || 1;
  return {
    current: xp,
    previousThreshold: currentLevel.xp,
    nextThreshold: nextLevel.xp,
    ratio: Math.min(1, (xp - currentLevel.xp) / span),
  };
}

// ── Cycle Functions ──────────────────────────────────────

/**
 * Get the current week (1-4) within a bond cycle.
 * @param {string|null} cycleStartDate - ISO date string
 * @param {Date}        [now]
 * @returns {number} 1-4
 */
export function getWeekInCycle(cycleStartDate, now) {
  if (!cycleStartDate) return 1;
  if (!now) now = new Date();

  const start = new Date(cycleStartDate);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  const week = Math.min(4, Math.floor(diffDays / DAYS_PER_WEEK) + 1);
  return week;
}

/**
 * Get the XP multiplier for a given week in the cycle.
 * @param {number} weekInCycle - 1-4
 * @returns {number} 1.0, 0.75, 0.50, or 0.25
 */
export function getCycleMultiplier(weekInCycle) {
  const index = Math.max(0, Math.min(3, weekInCycle - 1));
  return CYCLE_MULTIPLIERS[index];
}

/**
 * Check if the cycle should reset (28+ days elapsed).
 * @param {string|null} cycleStartDate - ISO date string
 * @param {Date}        [now]
 * @returns {boolean}
 */
export function shouldResetCycle(cycleStartDate, now) {
  if (!cycleStartDate) return false;
  if (!now) now = new Date();

  const start = new Date(cycleStartDate);
  const diffMs = now.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays >= CYCLE_DURATION_DAYS;
}

/**
 * Apply cycle multiplier to a raw XP amount.
 * @param {number}      rawXP
 * @param {string|null} cycleStartDate
 * @param {Date}        [now]
 * @returns {number} Adjusted XP (rounded)
 */
export function applyMultiplier(rawXP, cycleStartDate, now) {
  const week = getWeekInCycle(cycleStartDate, now);
  const multiplier = getCycleMultiplier(week);
  return Math.round(rawXP * multiplier);
}

/**
 * Get cycle info for display.
 * @param {string|null} cycleStartDate
 * @param {number}      currentCycle
 * @param {Date}        [now]
 * @returns {{ week: number, multiplier: number, daysRemaining: number, cycle: number }}
 */
export function getCycleInfo(cycleStartDate, currentCycle, now) {
  if (!now) now = new Date();
  const week = getWeekInCycle(cycleStartDate, now);
  const multiplier = getCycleMultiplier(week);

  let daysRemaining = CYCLE_DURATION_DAYS;
  if (cycleStartDate) {
    const start = new Date(cycleStartDate);
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, CYCLE_DURATION_DAYS - elapsed);
  }

  return { week, multiplier, daysRemaining, cycle: currentCycle };
}
