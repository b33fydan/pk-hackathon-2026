/**
 * Companion Finite State Machine — Pure logic, zero Three.js imports.
 *
 * Resolves which idle state the companion should be in based on
 * time-of-day and context (e.g. payday proximity).
 */

export const COMPANION_STATES = {
  morning_sweep: {
    id: 'morning_sweep',
    label: 'Sweeping',
    timeRanges: [{ start: 5, end: 8 }],
    priority: 10,
  },
  coffee_sit: {
    id: 'coffee_sit',
    label: 'Coffee Break',
    timeRanges: [{ start: 8, end: 15 }],
    priority: 10,
  },
  evening_read: {
    id: 'evening_read',
    label: 'Reading',
    timeRanges: [{ start: 15, end: 20 }],
    priority: 10,
  },
  night_sleep: {
    id: 'night_sleep',
    label: 'Sleeping',
    timeRanges: [
      { start: 20, end: 24 },
      { start: 0, end: 5 },
    ],
    priority: 10,
  },
  pre_payday: {
    id: 'pre_payday',
    label: 'Preparing for Battle',
    timeRanges: [],
    priority: 20,
  },
};

const TIME_BASED_STATES = [
  COMPANION_STATES.morning_sweep,
  COMPANION_STATES.coffee_sit,
  COMPANION_STATES.evening_read,
  COMPANION_STATES.night_sleep,
];

const DEFAULT_STATE = COMPANION_STATES.coffee_sit.id;

/**
 * Check if tomorrow is the user's payday.
 * @param {number} paydayDate - Day of month (1-31) for payday
 * @param {Date}   [now]      - Current date (default: new Date())
 * @returns {boolean}
 */
export function isPaydayTomorrow(paydayDate, now) {
  if (!paydayDate || paydayDate < 1) return false;
  if (!now) now = new Date();

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.getDate() === paydayDate;
}

/**
 * Pure resolver: given an hour (0-24 float) and context flags,
 * returns the correct companion state ID.
 *
 * @param {number} hour    - Current hour as float (e.g. 14.5 = 2:30pm)
 * @param {object} context - { isPaydayTomorrow: boolean }
 * @returns {string} State ID from COMPANION_STATES
 */
export function resolveCompanionState(hour, context) {
  if (!context) context = {};

  // Priority override: pre-payday prep in afternoon/evening
  if (context.isPaydayTomorrow && hour >= 15) {
    return COMPANION_STATES.pre_payday.id;
  }

  // Time-based resolution
  for (const state of TIME_BASED_STATES) {
    for (const range of state.timeRanges) {
      if (hour >= range.start && hour < range.end) {
        return state.id;
      }
    }
  }

  return DEFAULT_STATE;
}

/**
 * Convenience: get the current companion state for right now.
 * @param {number} paydayDate - Day of month for payday (from profileStore)
 * @param {Date}   [now]      - Current date (default: new Date())
 * @returns {string} State ID
 */
export function getCurrentCompanionState(paydayDate, now) {
  if (!now) now = new Date();
  const hour = now.getHours() + now.getMinutes() / 60;
  return resolveCompanionState(hour, {
    isPaydayTomorrow: isPaydayTomorrow(paydayDate, now),
  });
}
