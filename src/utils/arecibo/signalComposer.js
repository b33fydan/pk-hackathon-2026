/**
 * @fileoverview Signal Composer for Arecibo Section 7: THE SIGNAL
 * Special handling for the agent's personal weekly message
 * Supports 5 message types with Bond Level gating
 */

/**
 * Compose the SIGNAL section (Section 7) of Arecibo Recap
 * The most personal, most Bond-influenced section
 *
 * Five message types:
 * 1. Fact-grounded: Data-driven encouragement (all Bond Levels)
 * 2. Quote transmission: User's favorite thinker/artist (Bond 4+)
 * 3. Verse transmission: Poetry/faith (Bond 5 + faith mode enabled)
 * 4. Symbolic message: User's favorite symbol only, no text (Bond 3+)
 * 5. Callback message: Reference to previous week (Bond 5 only)
 *
 * @param {Object} params
 * @param {Object} params.weekData - Current week's aggregated data
 * @param {1|2|3|4|5} params.bondLevel - Bond relationship level
 * @param {Object} params.tasteProfile - User's preferences {favoriteSymbols, favoriteSources, faithMode, ...}
 * @param {Object} [params.previousWeekData] - Optional: Previous week for callback messages
 * @returns {Object} Signal section { derivative, message, source }
 */
export function composeSignalMessage({
  weekData,
  bondLevel,
  tasteProfile = {},
  previousWeekData = null,
}) {
  // Determine which message types are available at this Bond Level
  const availableTypes = getAvailableSignalTypes(bondLevel, tasteProfile);

  // Select the best message type for this week's character
  const selectedType = selectBestSignalType(
    availableTypes,
    weekData,
    tasteProfile,
    previousWeekData
  );

  // Compose the actual message
  const message = composeMessageByType(selectedType, {
    weekData,
    tasteProfile,
    previousWeekData,
  });

  return {
    derivative: selectedType,
    message,
    source: getMessageSource(selectedType, tasteProfile),
  };
}

/**
 * Determine which signal types are available given Bond Level
 *
 * @param {1|2|3|4|5} bondLevel
 * @param {Object} tasteProfile
 * @returns {string[]} Available derivative types
 */
function getAvailableSignalTypes(bondLevel, tasteProfile) {
  const available = [];

  // All levels: fact_grounded
  available.push('fact_grounded');

  // Bond 3+: symbolic (if symbols are defined)
  if (bondLevel >= 3 && tasteProfile?.favoriteSymbols?.length > 0) {
    available.push('symbolic');
  }

  // Bond 4+: quote (if sources are defined)
  if (bondLevel >= 4 && tasteProfile?.favoriteSources?.length > 0) {
    available.push('quote');
  }

  // Bond 5: verse (if faith mode enabled) and callback (if previous data exists)
  if (bondLevel >= 5) {
    if (tasteProfile?.faithMode) {
      available.push('verse');
    }
    // callback will be added conditionally in selectBestSignalType
  }

  return available;
}

/**
 * Select the best message type for this week
 * Takes week sentiment and Bond Level into account
 *
 * @param {string[]} availableTypes
 * @param {Object} weekData
 * @param {Object} tasteProfile
 * @param {Object} previousWeekData
 * @returns {string} Selected derivative type
 */
function selectBestSignalType(availableTypes, weekData, tasteProfile, previousWeekData) {
  const { weekSentiment, bondLevel } = weekData;

  // Victory weeks: use quote or callback if available
  if (weekSentiment === 'victory') {
    // Bond 5 with history: callback can be powerful
    if (bondLevel === 5 && previousWeekData) {
      return 'callback';
    }
    // Bond 4+: quote works well for victory
    if (availableTypes.includes('quote')) {
      return 'quote';
    }
    // Bond 3: symbolic celebration
    if (availableTypes.includes('symbolic')) {
      return 'symbolic';
    }
  }

  // Tough weeks: must be fact_grounded or vigil/honest pose
  // Never quote, symbolic, or verse on hard weeks (can feel disconnected)
  if (weekSentiment === 'tough') {
    return 'fact_grounded';
  }

  // Mixed weeks: fact_grounded stays balanced
  if (weekSentiment === 'mixed') {
    return 'fact_grounded';
  }

  // Default fallback
  return 'fact_grounded';
}

/**
 * Compose the actual message based on selected type
 *
 * @param {string} messageType - One of: fact_grounded, quote, verse, symbolic, callback
 * @param {Object} context - {weekData, tasteProfile, previousWeekData}
 * @returns {string} The message to display
 */
function composeMessageByType(messageType, { weekData, tasteProfile, previousWeekData }) {
  switch (messageType) {
    case 'fact_grounded':
      return composeFactGroundedMessage(weekData);

    case 'quote':
      return composeQuoteMessage(weekData, tasteProfile);

    case 'verse':
      return composeVerseMessage(weekData, tasteProfile);

    case 'symbolic':
      return composeSymbolicMessage(tasteProfile);

    case 'callback':
      return composeCallbackMessage(weekData, previousWeekData);

    default:
      return composeFactGroundedMessage(weekData);
  }
}

/**
 * FACT-GROUNDED MESSAGE
 * Data-driven, honest, specific to this week's facts
 * Safe for all Bond Levels
 *
 * Format: "[stat]. [stat]. [observation]."
 * Examples:
 * - "4 bills. 3 habits. Still standing."
 * - "All 5 bills cleared. The streak holds."
 * - "Hard week. 2 habits kept. That counts."
 *
 * @param {Object} weekData
 * @returns {string}
 */
function composeFactGroundedMessage(weekData) {
  const {
    billsPaid,
    billsTotal,
    habitsCompleted,
    habitsTotal,
    weekSentiment,
    daysActive,
    longestStreak,
  } = weekData;

  const parts = [];

  // Lead with the most relevant fact
  if (billsPaid === billsTotal && billsTotal > 0) {
    parts.push(`All ${billsTotal} bills cleared`);
  } else if (billsPaid > 0) {
    parts.push(`${billsPaid}/${billsTotal} bills`);
  }

  // Add habits fact
  if (habitsCompleted > 0) {
    parts.push(`${habitsCompleted} habits held`);
  }

  // Add streak if notable
  if (longestStreak && longestStreak.days >= 5) {
    parts.push(`${longestStreak.days}-day ${longestStreak.habit} streak`);
  }

  // Context based on sentiment
  let closing = '.';
  if (weekSentiment === 'victory') {
    closing = '. You built something this week.';
  } else if (weekSentiment === 'tough') {
    closing = '. That\'s what mattered.';
  } else {
    closing = '.';
  }

  return (parts.join('. ') || 'You showed up this week') + closing;
}

/**
 * QUOTE TRANSMISSION
 * A quote from the user's favorite thinker/artist
 * Relevant to this week's character
 *
 * Bond 4+, requires favoriteSources in taste profile
 *
 * @param {Object} weekData
 * @param {Object} tasteProfile - Must have favoriteSources array
 * @returns {string}
 */
function composeQuoteMessage(weekData, tasteProfile) {
  // In production, this would fetch/select an actual quote from tasteProfile.favoriteSources
  // For now, return a placeholder that LLM will fill in
  // (The system prompt will handle actual quote selection)

  const source = tasteProfile?.favoriteSources?.[0] || 'a wise voice';
  return `A transmission from ${source}: [quote relevant to "${weekData.weekSentiment}" week]`;
}

/**
 * VERSE TRANSMISSION
 * Short verse/poetry, optionally faith-based
 * Requires faithMode enabled + Bond 5
 *
 * @param {Object} weekData
 * @param {Object} tasteProfile
 * @returns {string}
 */
function composeVerseMessage(weekData, tasteProfile) {
  // Similar to quote, the LLM will compose the actual verse
  // This is a template marker for the LLM to fill in

  const sentiment = weekData.weekSentiment;
  return `A verse for this ${sentiment} week: [short poem or reflection]`;
}

/**
 * SYMBOLIC MESSAGE
 * No text — just a symbol the user loves
 * Pure visual transmission
 *
 * Bond 3+, requires favoriteSymbols in taste profile
 *
 * @param {Object} tasteProfile
 * @returns {string}
 */
function composeSymbolicMessage(tasteProfile) {
  // Symbol is handled visually in the grid, but for text output we show the symbol name
  const symbols = tasteProfile?.favoriteSymbols || ['lantern'];
  const symbol = symbols[0]; // In real use, pick based on week sentiment

  // Return a Unicode representation or name
  const symbolMap = {
    lantern: '🏮',
    bird: '🐦',
    star: '⭐',
    sword: '⚔️',
    shield: '🛡️',
    tree: '🌲',
    flame: '🔥',
    wave: '〰️',
  };

  const emoji = symbolMap[symbol] || symbol;
  return emoji; // Pure symbol, no text
}

/**
 * CALLBACK MESSAGE
 * Reference to a previous week or pattern
 * Creates continuity across multiple weeks
 * Bond 5 only, requires previousWeekData
 *
 * Examples:
 * - "Remember Week 3? You're still building on it."
 * - "Same habit. Week 7 of the streak."
 * - "Last week was tough. This week, you recovered."
 *
 * @param {Object} weekData - Current week
 * @param {Object} previousWeekData - Previous week
 * @returns {string}
 */
function composeCallbackMessage(weekData, previousWeekData) {
  if (!previousWeekData) {
    return "You're building a pattern.";
  }

  const { weekNumber } = weekData;
  const weeksBefore = weekNumber - previousWeekData.weekNumber;

  // Callback based on pattern continuity
  if (previousWeekData.longestStreak?.days > 0 && weekData.longestStreak?.days > previousWeekData.longestStreak.days) {
    // Growing streak
    return `Week ${previousWeekData.weekNumber} started this. Still going.`;
  }

  if (previousWeekData.weekSentiment === 'tough' && weekData.weekSentiment === 'victory') {
    // Recovery narrative
    return `Last week was hard. This week, you found your footing.`;
  }

  if (previousWeekData.weekSentiment === 'victory' && weekData.weekSentiment === 'victory') {
    // Sustained momentum
    return `Two good weeks in a row. You\\'re building something.`;
  }

  // Generic callback
  return `Week ${previousWeekData.weekNumber} → Week ${weekData.weekNumber}. Still here.`;
}

/**
 * Get the source attribution for quote/verse/callback messages
 *
 * @param {string} messageType
 * @param {Object} tasteProfile
 * @returns {string|null}
 */
function getMessageSource(messageType, tasteProfile) {
  switch (messageType) {
    case 'quote':
      return tasteProfile?.favoriteSources?.[0] || null;

    case 'verse':
      return tasteProfile?.faithMode ? 'transmission' : null;

    case 'callback':
      return 'week to week';

    case 'symbolic':
      return tasteProfile?.favoriteSymbols?.[0] || null;

    default:
      return null;
  }
}

/**
 * Validate signal message content
 * Ensures it's appropriate for the week sentiment and Bond Level
 *
 * @param {Object} signal - Signal section {derivative, message, source}
 * @param {Object} weekData
 * @param {1|2|3|4|5} bondLevel
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateSignalMessage(signal, weekData, bondLevel) {
  const { derivative, message } = signal;

  // Validate message isn't empty
  if (!message || message.length < 2) {
    return { valid: false, reason: 'Signal message is empty' };
  }

  // On tough weeks, fact_grounded must NOT have toxic positivity
  if (weekData.weekSentiment === 'tough') {
    const toxicPatterns = [
      /but.*stronger/i,
      /growth.*opportunity/i,
      /silver.*lining/i,
      /blessing/i,
    ];

    const hasToxic = toxicPatterns.some((p) => p.test(message));
    if (hasToxic) {
      return {
        valid: false,
        reason: 'Tough week message contains toxic positivity reframing',
      };
    }
  }

  // Symbolic message should be short (just a symbol)
  if (derivative === 'symbolic' && message.length > 10) {
    return { valid: false, reason: 'Symbolic message should be just a symbol, no extra text' };
  }

  return { valid: true };
}
