const OLD_KEYS = {
  budget: 'payday-kingdom-budget',
  game: 'payday-kingdom-game',
  identity: 'payday-kingdom-identity',
  achievements: 'payday-kingdom-achievements',
  audio: 'payday-kingdom-audio',
};

const MIGRATION_FLAG = 'pk-migrated-v2';

export function runMigration() {
  if (localStorage.getItem(MIGRATION_FLAG)) return false;

  const oldBudget = readOldStore(OLD_KEYS.budget);
  const oldGame = readOldStore(OLD_KEYS.game);
  const oldIdentity = readOldStore(OLD_KEYS.identity);
  const oldAchievements = readOldStore(OLD_KEYS.achievements);
  const oldAudio = readOldStore(OLD_KEYS.audio);

  // If no old data exists, just set the flag and return
  const hasOldData = oldBudget || oldGame || oldIdentity || oldAchievements || oldAudio;
  if (!hasOldData) {
    localStorage.setItem(MIGRATION_FLAG, Date.now().toString());
    return false;
  }

  console.log('[PK Migration] Old stores found, migrating...');

  // Build new store states
  const profile = {
    state: {
      kingdomName: oldIdentity?.kingdomName ?? 'Fort Savings',
      companionName: 'Keeper',
      bannerColor: oldIdentity?.bannerColor ?? 'gold',
      hasCompletedOnboarding: oldIdentity?.hasCompletedOnboarding ?? false,
      income: oldBudget?.income ?? 0,
      paydayDate: oldBudget?.paydayDate ?? 1,
      preferences: { moodPack: 'cozy', activeSkin: 'adventurer' },
      location: null,
    },
    version: 0,
  };

  const facts = {
    state: {
      income: oldBudget?.income ?? 0,
      bills: oldBudget?.bills ?? [],
      paydayDate: oldBudget?.paydayDate ?? 1,
      currentMonth: oldBudget?.currentMonth ?? getCurrentMonthKey(),
      history: oldBudget?.history ?? [],
      habits: [],
      meetings: [],
      milestones: [],
      weeklyRecaps: [],
    },
    version: 0,
  };

  const world = {
    state: {
      xp: oldGame?.xp ?? 0,
      displayXp: oldGame?.xp ?? 0,
      level: oldGame?.level ?? 1,
      totalBillsSlain: oldGame?.totalBillsSlain ?? 0,
      heroVisible: oldGame?.heroVisible ?? false,
      heroPosition: { x: 0, y: 0, z: 2.05 },
      armorTier: oldGame?.armorTier ?? 'peasant',
      islandStage: oldGame?.islandStage ?? 0,
      unlocked: oldAchievements?.unlocked ?? {},
      companionState: 'morning_coffee',
      decorations: [],
      trophies: [],
    },
    version: 0,
  };

  const ui = {
    state: {
      muted: oldAudio?.muted ?? false,
    },
    version: 0,
  };

  // Write new stores
  localStorage.setItem('pk-profile', JSON.stringify(profile));
  localStorage.setItem('pk-facts', JSON.stringify(facts));
  localStorage.setItem('pk-world', JSON.stringify(world));
  localStorage.setItem('pk-ui', JSON.stringify(ui));

  // Clean up old keys
  Object.values(OLD_KEYS).forEach((key) => localStorage.removeItem(key));

  // Set migration flag
  localStorage.setItem(MIGRATION_FLAG, Date.now().toString());

  console.log('[PK Migration] Complete. Old keys removed.');
  return true;
}

function readOldStore(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.state ?? parsed;
  } catch {
    return null;
  }
}

function getCurrentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
