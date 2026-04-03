/**
 * Achievement System — Tiered achievements across finance, habits, business,
 * bond, and resilience categories.
 *
 * Tiers: Bronze → Silver → Gold → Platinum → Diamond
 * Each achievement has: id, icon, label, description, tier, category, title, check function
 */

// ── Tier Definitions ─────────────────────────────────────

export const ACHIEVEMENT_TIERS = {
  bronze: { key: 'bronze', label: 'Bronze', color: '#b45309', order: 1 },
  silver: { key: 'silver', label: 'Silver', color: '#d1d5db', order: 2 },
  gold: { key: 'gold', label: 'Gold', color: '#fbbf24', order: 3 },
  platinum: { key: 'platinum', label: 'Platinum', color: '#7dd3fc', order: 4 },
  diamond: { key: 'diamond', label: 'Diamond', color: '#c084fc', order: 5 },
};

// ── Achievement Definitions ──────────────────────────────

export const ACHIEVEMENT_DEFINITIONS = [
  // ── Finance ────────────────────────────────────────────
  {
    id: 'first-blood',
    icon: '⚔️',
    label: 'First Blood',
    description: 'Slay your first bill monster.',
    tier: 'bronze',
    category: 'finance',
    title: null,
    accentColor: '#ef4444',
    accentDarkColor: '#7f1d1d',
    shareLine: 'First monster down. The realm is awake.',
    check: (m) => m.totalBillsSlain >= 1,
  },
  {
    id: 'monster-hunter',
    icon: '🏅',
    label: 'Monster Hunter',
    description: 'Slay 10 bill monsters total.',
    tier: 'silver',
    category: 'finance',
    title: 'The Hunter',
    accentColor: '#f59e0b',
    accentDarkColor: '#92400e',
    shareLine: 'Ten monsters down. The kingdom collects trophies.',
    check: (m) => m.totalBillsSlain >= 10,
  },
  {
    id: 'bill-slayer',
    icon: '🗡️',
    label: 'Bill Slayer',
    description: 'Slay 50 bill monsters total.',
    tier: 'gold',
    category: 'finance',
    title: 'The Slayer',
    accentColor: '#fbbf24',
    accentDarkColor: '#78350f',
    shareLine: 'Fifty monsters fell. The realm respects the blade.',
    check: (m) => m.totalBillsSlain >= 50,
  },
  {
    id: 'overkill',
    icon: '💀',
    label: 'Overkill',
    description: 'Slay a $1,000+ bill monster.',
    tier: 'silver',
    category: 'finance',
    title: null,
    accentColor: '#fb7185',
    accentDarkColor: '#9f1239',
    shareLine: 'A giant fell. Overkill in the best way.',
    check: (m) => m.history.some((e) => (e.largestBillPaid ?? 0) >= 1000),
  },
  {
    id: 'perfect-month',
    icon: '🎯',
    label: 'Perfect Month',
    description: 'Clear all bills with 50%+ surplus.',
    tier: 'gold',
    category: 'finance',
    title: 'The Efficient',
    accentColor: '#34d399',
    accentDarkColor: '#065f46',
    shareLine: 'Perfect month. Bills cleared with room to spare.',
    check: (m) => m.history.some((e) => e.totalBills > 0 && e.surplus >= e.totalBills * 0.5),
  },
  {
    id: 'dragons-hoard',
    icon: '💰',
    label: "Dragon's Hoard",
    description: 'Accumulate $10,000 saved.',
    tier: 'platinum',
    category: 'finance',
    title: 'The Wealthy',
    accentColor: '#fbbf24',
    accentDarkColor: '#78350f',
    shareLine: 'The treasury overflows. The hoard keeps growing.',
    check: (m) => m.lifetimeSaved >= 10000,
  },

  // ── Kingdom ────────────────────────────────────────────
  {
    id: 'kingdom-builder',
    icon: '🏰',
    label: 'Kingdom Builder',
    description: 'Reach Village stage.',
    tier: 'silver',
    category: 'finance',
    title: 'The Builder',
    accentColor: '#22c55e',
    accentDarkColor: '#166534',
    shareLine: 'Village reached. The island finally feels alive.',
    check: (m) => m.islandStage >= 3,
  },
  {
    id: 'royal-guard',
    icon: '👑',
    label: 'Royal Guard',
    description: 'Reach hero level 5.',
    tier: 'gold',
    category: 'finance',
    title: 'The Royal',
    accentColor: '#60a5fa',
    accentDarkColor: '#1d4ed8',
    shareLine: 'Level 5. The realm marches with a royal guard.',
    check: (m) => m.level >= 5,
  },
  {
    id: 'ironclad',
    icon: '📅',
    label: 'Ironclad',
    description: 'Survive 6 consecutive months.',
    tier: 'gold',
    category: 'finance',
    title: 'The Ironclad',
    accentColor: '#94a3b8',
    accentDarkColor: '#334155',
    shareLine: 'Six months survived. The budget holds the line.',
    check: (m) => m.monthsCompleted >= 6,
  },
  {
    id: 'diamond-discipline',
    icon: '💎',
    label: 'Diamond Discipline',
    description: 'Survive 12 consecutive months.',
    tier: 'diamond',
    category: 'finance',
    title: 'The Diamond',
    accentColor: '#67e8f9',
    accentDarkColor: '#155e75',
    shareLine: 'Twelve months. Discipline turned into a gem.',
    check: (m) => m.monthsCompleted >= 12,
  },
  {
    id: 'legend-of-the-realm',
    icon: '🌟',
    label: 'Legend of the Realm',
    description: 'Reach hero level 12.',
    tier: 'diamond',
    category: 'finance',
    title: 'The Legend',
    accentColor: '#a78bfa',
    accentDarkColor: '#5b21b6',
    shareLine: 'Level 12. The hero is now legend.',
    check: (m) => m.level >= 12,
  },

  // ── Habits ─────────────────────────────────────────────
  {
    id: 'first-check',
    icon: '✅',
    label: 'First Check',
    description: 'Complete your first habit check-in.',
    tier: 'bronze',
    category: 'habits',
    title: null,
    accentColor: '#4ade80',
    accentDarkColor: '#166534',
    shareLine: 'First habit checked. The journey of a thousand days.',
    check: (m) => m.habitsCompleted >= 1,
  },
  {
    id: 'streak-3',
    icon: '🔥',
    label: '3-Day Streak',
    description: 'Maintain any habit for 3 consecutive days.',
    tier: 'bronze',
    category: 'habits',
    title: null,
    accentColor: '#fb923c',
    accentDarkColor: '#9a3412',
    shareLine: 'Three days running. The flame catches.',
    check: (m) => m.longestStreak >= 3,
  },
  {
    id: 'streak-7',
    icon: '🔥',
    label: '7-Day Streak',
    description: 'Maintain any habit for 7 consecutive days.',
    tier: 'silver',
    category: 'habits',
    title: 'The Consistent',
    accentColor: '#f97316',
    accentDarkColor: '#7c2d12',
    shareLine: 'Seven days strong. The rhythm holds.',
    check: (m) => m.longestStreak >= 7,
  },
  {
    id: 'streak-14',
    icon: '🔥',
    label: '14-Day Streak',
    description: 'Maintain any habit for 14 consecutive days.',
    tier: 'gold',
    category: 'habits',
    title: 'The Relentless',
    accentColor: '#ef4444',
    accentDarkColor: '#991b1b',
    shareLine: 'Two weeks unbroken. Relentless.',
    check: (m) => m.longestStreak >= 14,
  },
  {
    id: 'streak-30',
    icon: '🔥',
    label: '30-Day Streak',
    description: 'Maintain any habit for 30 consecutive days.',
    tier: 'platinum',
    category: 'habits',
    title: 'The Unbreakable',
    accentColor: '#dc2626',
    accentDarkColor: '#7f1d1d',
    shareLine: 'Thirty days. The fire cannot be extinguished.',
    check: (m) => m.longestStreak >= 30,
  },

  // ── Bond ───────────────────────────────────────────────
  {
    id: 'bond-acquaintance',
    icon: '🤝',
    label: 'Acquaintance',
    description: 'Reach Bond Level 2.',
    tier: 'bronze',
    category: 'bond',
    title: null,
    accentColor: '#a78bfa',
    accentDarkColor: '#5b21b6',
    shareLine: 'The companion begins to know you.',
    check: (m) => m.bondLevel >= 2,
  },
  {
    id: 'bond-companion',
    icon: '💜',
    label: 'True Companion',
    description: 'Reach Bond Level 3.',
    tier: 'silver',
    category: 'bond',
    title: 'The Trusted',
    accentColor: '#8b5cf6',
    accentDarkColor: '#4c1d95',
    shareLine: 'A true companion. The bond deepens.',
    check: (m) => m.bondLevel >= 3,
  },
  {
    id: 'bond-confidant',
    icon: '💛',
    label: 'Confidant',
    description: 'Reach Bond Level 4.',
    tier: 'gold',
    category: 'bond',
    title: 'The Open',
    accentColor: '#fbbf24',
    accentDarkColor: '#92400e',
    shareLine: 'Confidant. The companion sees what others cannot.',
    check: (m) => m.bondLevel >= 4,
  },
  {
    id: 'bond-kindred',
    icon: '✨',
    label: 'Kindred Spirit',
    description: 'Reach Bond Level 5 (maximum).',
    tier: 'diamond',
    category: 'bond',
    title: 'The Kindred',
    accentColor: '#c084fc',
    accentDarkColor: '#7c3aed',
    shareLine: 'Kindred spirit. No two kingdoms look alike.',
    check: (m) => m.bondLevel >= 5,
  },

  // ── Milestones ─────────────────────────────────────────
  {
    id: 'first-milestone',
    icon: '🚀',
    label: 'First Milestone',
    description: 'Log your first milestone.',
    tier: 'bronze',
    category: 'business',
    title: null,
    accentColor: '#38bdf8',
    accentDarkColor: '#0369a1',
    shareLine: 'The first milestone is logged. The climb begins.',
    check: (m) => m.milestoneCount >= 1,
  },
  {
    id: 'milestone-collector',
    icon: '🏆',
    label: 'Milestone Collector',
    description: 'Log 10 milestones.',
    tier: 'gold',
    category: 'business',
    title: 'The Achiever',
    accentColor: '#fbbf24',
    accentDarkColor: '#78350f',
    shareLine: 'Ten milestones. A life well-marked.',
    check: (m) => m.milestoneCount >= 10,
  },

  // ── Resilience ─────────────────────────────────────────
  {
    id: 'tough-week-standing',
    icon: '🛡️',
    label: 'Still Standing',
    description: 'Complete a weekly recap after a tough week.',
    tier: 'silver',
    category: 'resilience',
    title: 'The Unbowed',
    accentColor: '#94a3b8',
    accentDarkColor: '#475569',
    shareLine: 'A tough week, but still standing. The tower lantern stays lit.',
    check: (m) => m.toughWeekRecaps >= 1,
  },
  {
    id: 'comeback',
    icon: '🔄',
    label: 'The Comeback',
    description: 'Follow a tough week with a victory week.',
    tier: 'gold',
    category: 'resilience',
    title: 'The Resilient',
    accentColor: '#4ade80',
    accentDarkColor: '#166534',
    shareLine: 'From tough to triumph. The comeback is always stronger.',
    check: (m) => m.comebackWeeks >= 1,
  },
];

export const ACHIEVEMENT_MAP = Object.fromEntries(
  ACHIEVEMENT_DEFINITIONS.map((a) => [a.id, a]),
);

export const ACHIEVEMENT_CATEGORIES = {
  finance: { label: 'Finance', icon: '💰' },
  habits: { label: 'Habits', icon: '🔥' },
  bond: { label: 'Bond', icon: '💜' },
  business: { label: 'Business', icon: '🚀' },
  resilience: { label: 'Resilience', icon: '🛡️' },
};

/**
 * Get IDs of all achievements whose conditions are met.
 * @param {object} metrics - Achievement metrics assembled from stores
 * @returns {string[]}
 */
export function getUnlockedAchievementIds(metrics) {
  return ACHIEVEMENT_DEFINITIONS
    .filter((a) => a.check(metrics))
    .map((a) => a.id);
}

/**
 * Get the highest earned title from unlocked achievements.
 * @param {object} unlocked - { [achievementId]: { unlockedAt } }
 * @returns {string|null}
 */
export function getHighestTitle(unlocked) {
  const tierOrder = { diamond: 5, platinum: 4, gold: 3, silver: 2, bronze: 1 };
  let best = null;
  let bestOrder = 0;

  for (const id of Object.keys(unlocked)) {
    const achievement = ACHIEVEMENT_MAP[id];
    if (!achievement?.title) continue;
    const order = tierOrder[achievement.tier] || 0;
    if (order > bestOrder) {
      bestOrder = order;
      best = achievement.title;
    }
  }

  return best;
}

export function formatAchievementDate(unlockedAt) {
  if (!unlockedAt) return 'Locked';
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(unlockedAt));
}
