/**
 * Expression Picker — Template-based daily decoration selector.
 *
 * Gathers context (facts + taste + bond level), picks an appropriate
 * decoration from the asset catalog, chooses a placement slot, and
 * returns an Expression Decision (JSON contract from the PRD).
 *
 * No LLM calls — pure deterministic template selection.
 * LLM integration (Epic 6+) would replace this with intent generation.
 */

import { ASSET_CATALOG } from './assetCatalog';
import { getAvailableSlots } from './placementSlots';
import { getTodayDate } from './formatters';

// ── Context Assembly ─────────────────────────────────────

/**
 * Assemble expression context from stores.
 * Call with store getState() snapshots.
 */
export function assembleContext({ factState, profileState, bondState, worldState }) {
  const today = getTodayDate();
  const todayHabits = factState.habits.filter((h) => h.date === today);
  const activeHabitDefs = factState.habitDefinitions.filter((h) => !h.archived);
  const habitsCompleted = todayHabits.filter((h) => h.completed).length;
  const habitsTotal = activeHabitDefs.length;

  const todayMeetings = factState.meetings.filter((m) => m.date === today);
  const heavyMeetings = todayMeetings.filter((m) => m.intensity === 'heavy').length;

  const activeBills = factState.bills.filter((b) => !b.isPaid);
  const surplus = factState.income - factState.bills.reduce((t, b) => t + (b.amount || 0), 0);

  return {
    today,
    habitsCompleted,
    habitsTotal,
    meetingCount: todayMeetings.length,
    heavyMeetings,
    activeBillCount: activeBills.length,
    surplus,
    bondLevel: bondState.bondLevel,
    moodPack: profileState.preferences.moodPack,
    favoriteSymbols: profileState.preferences.favoriteSymbols || [],
    favoriteColorFamily: profileState.preferences.favoriteColorFamily,
    existingDecorations: worldState.decorations || [],
  };
}

// ── Template Rules ───────────────────────────────────────

/**
 * Each rule: { condition, assets, message, rarity }
 * First matching rule wins. Order matters (most specific first).
 */
const EXPRESSION_RULES = [
  // Hard day: heavy meetings + many bills
  {
    condition: (ctx) => ctx.heavyMeetings >= 2 || (ctx.activeBillCount >= 4 && ctx.surplus < 0),
    assets: ['campfire', 'lantern_warm'],
    message: 'A quiet light for a long day.',
    rarity: 'common',
  },
  // Habit streak day
  {
    condition: (ctx) => ctx.habitsCompleted >= 3,
    assets: ['banner_gold', 'flower_gold', 'trophy_bronze'],
    message: 'Three habits down. The streak holds.',
    rarity: 'rare',
  },
  // All habits done
  {
    condition: (ctx) => ctx.habitsTotal > 0 && ctx.habitsCompleted === ctx.habitsTotal,
    assets: ['flower_gold', 'banner_red', 'bird_gold'],
    message: 'Every habit checked. A perfect day.',
    rarity: 'rare',
  },
  // Meeting-heavy day
  {
    condition: (ctx) => ctx.meetingCount >= 3,
    assets: ['coffee_mug', 'books', 'lantern_blue'],
    message: 'Meetings survived. Coffee earned.',
    rarity: 'common',
  },
  // Surplus positive
  {
    condition: (ctx) => ctx.surplus > 500,
    assets: ['banner_gold', 'plaque_gold', 'shield_gold'],
    message: 'The treasury breathes easy.',
    rarity: 'rare',
  },
  // Some habits done
  {
    condition: (ctx) => ctx.habitsCompleted >= 1,
    assets: ['flower_pink', 'flower_blue', 'lantern_warm'],
    message: 'One more day of showing up.',
    rarity: 'common',
  },
  // Has meetings
  {
    condition: (ctx) => ctx.meetingCount >= 1,
    assets: ['coffee_mug', 'lantern_warm', 'books'],
    message: 'The day had its rhythms.',
    rarity: 'common',
  },
  // Default: cozy fallback
  {
    condition: () => true,
    assets: ['lantern_warm', 'flower_pink', 'bird_blue', 'campfire'],
    message: 'A small mark on a quiet day.',
    rarity: 'common',
  },
];

// ── Bond Level Enrichment ────────────────────────────────

function enrichWithTaste(assets, context) {
  if (context.bondLevel < 2) return assets;

  // Bond 2+: filter toward mood-matching assets
  if (context.moodPack === 'cozy') {
    return [...assets, 'campfire', 'coffee_mug', 'lantern_warm'];
  }
  if (context.moodPack === 'tactical') {
    return [...assets, 'shield_blue', 'banner_red', 'plaque_bronze'];
  }
  if (context.moodPack === 'reverent') {
    return [...assets, 'lantern_blue', 'books', 'plaque_gold'];
  }
  if (context.moodPack === 'playful') {
    return [...assets, 'bird_blue', 'flower_pink', 'banner_gold'];
  }

  return assets;
}

function enrichWithSymbols(assets, context) {
  if (context.bondLevel < 3) return assets;

  // Bond 3+: incorporate favorite symbols
  const symbolMap = {
    lanterns: ['lantern_warm', 'lantern_blue', 'lantern_rose'],
    books: ['books'],
    flowers: ['flower_pink', 'flower_gold', 'flower_blue'],
    banners: ['banner_red', 'banner_gold'],
    stars: ['trophy_gold', 'plaque_gold'],
    shields: ['shield_blue', 'shield_gold'],
  };

  const extras = [];
  for (const sym of context.favoriteSymbols) {
    if (symbolMap[sym]) extras.push(...symbolMap[sym]);
  }

  return extras.length > 0 ? [...assets, ...extras] : assets;
}

// ── Cooldown Check ───────────────────────────────────────

function getRecentAssetIds(decorations, days = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString();
  return new Set(
    decorations
      .filter((d) => d.createdAt >= cutoffStr)
      .map((d) => d.artifact),
  );
}

// ── Deterministic "Random" from Date ─────────────────────

function seededIndex(dateStr, arrayLength) {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = ((hash << 5) - hash + dateStr.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % arrayLength;
}

// ── Main Picker ──────────────────────────────────────────

/**
 * Pick today's expression. Returns an Expression Decision or null
 * if an expression was already placed today.
 *
 * @param {object} context - From assembleContext()
 * @returns {object|null} Expression Decision (PRD JSON contract)
 */
export function pickDailyExpression(context) {
  const { today, existingDecorations } = context;

  // Already expressed today?
  const todayExpression = existingDecorations.find((d) => d.date === today);
  if (todayExpression) return null;

  // Find matching rule
  const rule = EXPRESSION_RULES.find((r) => r.condition(context)) || EXPRESSION_RULES[EXPRESSION_RULES.length - 1];

  // Enrich candidate assets based on bond level
  let candidates = enrichWithTaste([...rule.assets], context);
  candidates = enrichWithSymbols(candidates, context);

  // Filter out recently used assets (7-day cooldown)
  const recentIds = getRecentAssetIds(existingDecorations, 7);
  let available = candidates.filter((id) => !recentIds.has(id) && ASSET_CATALOG[id]);
  if (available.length === 0) {
    available = candidates.filter((id) => ASSET_CATALOG[id]);
  }
  if (available.length === 0) return null;

  // Deterministic pick from date seed (same day = same result)
  const assetId = available[seededIndex(today, available.length)];

  // Pick a placement slot
  const occupiedSlots = existingDecorations.map((d) => d.placement);
  const freeSlots = getAvailableSlots(occupiedSlots);
  if (freeSlots.length === 0) return null;

  const slot = freeSlots[seededIndex(today + assetId, freeSlots.length)];

  return {
    id: `expr-${today}`,
    date: today,
    trigger: 'daily',
    artifact: assetId,
    placement: slot.id,
    message: rule.message,
    quote: null,
    rarity: rule.rarity,
    persistent: false,
    expiresAt: getExpiryDate(today, 7),
    reason: `Rule matched for ${today}. Bond Lv.${context.bondLevel}.`,
    createdAt: new Date().toISOString(),
  };
}

function getExpiryDate(dateStr, days) {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Remove expired decorations from the list.
 */
export function pruneExpired(decorations) {
  const today = getTodayDate();
  return decorations.filter((d) => d.persistent || !d.expiresAt || d.expiresAt >= today);
}
