/**
 * @fileoverview Type definitions for Arecibo Recap system
 * Uses JSDoc for type safety without TypeScript
 */

/**
 * @typedef {Object} HabitData
 * @property {string} key - Unique identifier for habit
 * @property {string} name - Display name
 * @property {number} completed - Completed count this week
 * @property {number} total - Total scheduled for week
 */

/**
 * @typedef {Object} StreakData
 * @property {string} habit - Habit key with active streak
 * @property {number} days - Current streak length
 */

/**
 * @typedef {Object} MilestoneData
 * @property {'streak' | 'xp' | 'kingdom' | 'bond'} type - Milestone type
 * @property {number} daysAway - Days until milestone reached
 * @property {number} target - Target value
 * @property {string} [habitKey] - Associated habit (for streak milestones)
 */

/**
 * @typedef {Object} WeekData
 * Weekly aggregated facts for Arecibo assembly
 *
 * @property {number} weekNumber - Week index (1-52)
 * @property {number} billsPaid - Number of bills paid this week
 * @property {number} billsTotal - Total bills due this week
 * @property {number} habitsCompleted - Total habit completions
 * @property {number} habitsTotal - Total habit slots this week
 * @property {number} meetings - Number of meetings attended/logged
 * @property {number} daysActive - Days with at least one fact logged
 * @property {number} bondXpEarned - Bond XP earned this week
 * @property {HabitData[]} activeHabits - Array of active habits with completion data
 * @property {number[]} dailyIntensity - 7 values (Mon-Sun) for daily intensity 0-10
 * @property {StreakData} [longestStreak] - Current longest streak if any
 * @property {MilestoneData} [nearestMilestone] - Next milestone approaching if any
 * @property {'victory' | 'tough' | 'mixed'} weekSentiment - Overall week character
 * @property {1 | 2 | 3 | 4 | 5} bondLevel - Bond Level 1-5
 * @property {string} companionName - Name of companion/agent
 * @property {string} kingdomName - User's kingdom name
 */

/**
 * @typedef {Object} SectionPixelGrid
 * Raw pixel data for a single section
 *
 * @property {number[][]} grid - 2D array of color indices (0-7)
 * @property {number} width - Grid width in pixels
 * @property {number} height - Grid height in pixels
 * @property {string} derivative - Name of chosen derivative
 */

/**
 * @typedef {'standard' | 'highlight' | 'streak_emphasis' | 'minimal'} CountDerivative
 */

/**
 * @typedef {'full' | 'dominant' | 'discovery' | 'decay'} ElementDerivative
 */

/**
 * @typedef {'heatmap' | 'waveform' | 'binary_pulse' | 'bookend'} PatternDerivative
 */

/**
 * @typedef {'clean_helix' | 'growth_thread' | 'near_miss' | 'origin'} ThreadDerivative
 */

/**
 * @typedef {'victory' | 'working' | 'resting' | 'guardian' | 'celebration' | 'vigil'} ReflectionDerivative
 */

/**
 * @typedef {'overview' | 'growth_compare' | 'spotlight' | 'seasonal'} KingdomDerivative
 */

/**
 * @typedef {'fact_grounded' | 'quote' | 'verse' | 'symbolic' | 'callback'} SignalDerivative
 */

/**
 * @typedef {Object} DerivativeSelection
 * Chosen derivative for each section
 *
 * @property {CountDerivative} count
 * @property {ElementDerivative} elements
 * @property {PatternDerivative} pattern
 * @property {ThreadDerivative} thread
 * @property {ReflectionDerivative} reflection
 * @property {KingdomDerivative} kingdom
 * @property {SignalDerivative} signal
 */

/**
 * @typedef {Object} AssemblerConfig
 * Configuration for section assemblers
 *
 * @property {number} width - Grid width (must be <= 73)
 * @property {number} height - Grid height (must be <= 23)
 * @property {number} [padding] - Padding around content (default: 1)
 */

// Type definitions exported as JSDoc annotations only
// No runtime values needed - this file is for IDE type hints
