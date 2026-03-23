/**
 * @fileoverview Emotional guardrails validation for Arecibo Expression Engine
 * Ensures output doesn't contain therapy-speak, guilt, fake triumph, or patronizing language
 * Critical for respecting the hard-week dignity protocol
 */

/**
 * List of therapy-speak patterns to detect
 * These are common phrases from corporate wellness apps that undermine authenticity
 */
const THERAPY_SPEAK_PATTERNS = [
  /your feelings are valid/i,
  /healing journey/i,
  /inner strength/i,
  /truly the best version/i,
  /embrace your vulnerability/i,
  /safe space/i,
  /processing/i,
  /ground yourself/i,
  /manifest/i,
  /higher self/i,
  /toxic/i,
  /self-care journey/i,
  /mindful/i,
  /authentic self/i,
  /being present/i,
];

/**
 * Guilt-inducing language patterns
 * Phrases that make the user feel bad about what they didn't do
 */
const GUILT_PATTERNS = [
  /could have done better/i,
  /missed opportunity/i,
  /didn't live up to/i,
  /fell short/i,
  /failed to/i,
  /couldn't manage/i,
  /let yourself down/i,
  /wasted/i,
  /broke your promise/i,
  /didn't meet your goal/i,
  /disappointing/i,
];

/**
 * Fake triumph patterns
 * Phrases that pretend a tough week is actually a win
 */
const FAKE_TRIUMPH_PATTERNS = [
  /but look how strong you are/i,
  /this teaches you/i,
  /blessing in disguise/i,
  /silver lining/i,
  /actually made you better/i,
  /character building/i,
  /growth opportunity/i,
  /lucky to experience/i,
  /grateful for/i, // when applied to hardship
  /everything happens for a reason/i,
];

/**
 * Patronizing/corporate wellness language
 * Treats the user like they need corporate HR advice
 */
const PATRONIZING_PATTERNS = [
  /you're doing great!/i,
  /keep up the good work/i,
  /way to go/i,
  /attaboy/i,
  /atta girl/i,
  /champion/i,
  /superstar/i,
  /nailed it/i,
  /proud of you/i, // when used patronizingly
  /you got this/i,
  /go get em/i,
];

/**
 * Patterns indicating the companion is speaking AS a therapist/coach
 */
const THERAPIST_SPEAK_PATTERNS = [
  /let's explore your/i,
  /you should consider/i,
  /have you tried/i,
  /i recommend/i,
  /the key is/i,
  /you need to/i,
  /what you really need/i,
  /work through/i,
  /process your/i,
];

/**
 * Validate that output respects emotional guardrails
 * Returns { valid: boolean, violations: string[] }
 *
 * @param {Object} areciboIntent - Full Arecibo intent output
 * @param {'victory' | 'tough' | 'mixed'} weekSentiment - The week's character
 * @returns {{ valid: boolean, violations: string[], severity: 'critical' | 'warning' | 'clean' }}
 */
export function validateEmotionalGuardrails(areciboIntent, weekSentiment) {
  const violations = [];
  const allText = extractAllText(areciboIntent).toLowerCase();

  // Check for therapy-speak
  const therapySpeakViolations = findPatternMatches(allText, THERAPY_SPEAK_PATTERNS);
  if (therapySpeakViolations.length > 0) {
    violations.push(
      `Detected therapy-speak: ${therapySpeakViolations.join(', ')}. ` +
      `The companion is not a therapist. Be a friend instead.`
    );
  }

  // Check for guilt patterns
  const guiltViolations = findPatternMatches(allText, GUILT_PATTERNS);
  if (guiltViolations.length > 0) {
    violations.push(
      `Detected guilt-inducing language: ${guiltViolations.join(', ')}. ` +
      `Never make the user feel bad about what they didn't do.`
    );
  }

  // Check for fake triumph (CRITICAL on tough weeks)
  const fauxTriumphViolations = findPatternMatches(allText, FAKE_TRIUMPH_PATTERNS);
  if (fauxTriumphViolations.length > 0) {
    if (weekSentiment === 'tough') {
      violations.push(
        `CRITICAL: Detected fake triumph on a tough week: ${fauxTriumphViolations.join(', ')}. ` +
        `Hard weeks deserve dignity, not reframing. Acknowledge the difficulty plainly.`
      );
    } else {
      violations.push(
        `Detected fake triumph language: ${fauxTriumphViolations.join(', ')}. ` +
        `Don't pretend challenges are actually wins.`
      );
    }
  }

  // Check for patronizing language
  const patronizingViolations = findPatternMatches(allText, PATRONIZING_PATTERNS);
  if (patronizingViolations.length > 0) {
    violations.push(
      `Detected patronizing language: ${patronizingViolations.join(', ')}. ` +
      `Treat the user as a peer, not a pet.`
    );
  }

  // Check for therapist-speak
  const therapistViolations = findPatternMatches(allText, THERAPIST_SPEAK_PATTERNS);
  if (therapistViolations.length > 0) {
    violations.push(
      `Detected coaching/therapy language: ${therapistViolations.join(', ')}. ` +
      `Be a companion, not a coach or therapist.`
    );
  }

  // Tough week specific checks
  if (weekSentiment === 'tough') {
    // Should have acknowledged the difficulty
    const acknowledgesHardship = /hard|difficult|tough|struggle/i.test(allText);
    if (!acknowledgesHardship && findPatternMatches(allText, FAKE_TRIUMPH_PATTERNS).length === 0) {
      // Only warn if they didn't use fake triumph (which would be caught above)
      // A tough week message should acknowledge the difficulty somehow
      if (!hasFactGroundedAcknowledgment(areciboIntent)) {
        violations.push(
          `Tough week detected, but message doesn't acknowledge the difficulty. ` +
          `Hard weeks need acknowledgment: "This was a hard week. [What held: specific facts]"`
        );
      }
    }
  }

  // Determine severity
  let severity = 'clean';
  if (violations.length > 0) {
    const hasCritical = violations.some((v) => v.includes('CRITICAL'));
    severity = hasCritical ? 'critical' : 'warning';
  }

  return {
    valid: violations.length === 0,
    violations,
    severity,
  };
}

/**
 * Validate reflection derivative matches week sentiment
 * E.g., 'victory' pose on a tough week is wrong
 *
 * @param {string} reflectionDerivative - The chosen pose derivative
 * @param {'victory' | 'tough' | 'mixed'} weekSentiment
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateReflectionDerivative(reflectionDerivative, weekSentiment) {
  const validByMood = {
    victory: ['victory', 'celebration', 'working'],
    tough: ['vigil', 'guardian', 'working', 'resting'],
    mixed: ['working', 'resting', 'victory', 'guardian'],
  };

  const allowed = validByMood[weekSentiment] || [];
  const valid = allowed.includes(reflectionDerivative);

  return {
    valid,
    reason: valid
      ? undefined
      : `Pose "${reflectionDerivative}" doesn't fit "${weekSentiment}" week. ` +
        `Expected one of: ${allowed.join(', ')}`,
  };
}

/**
 * Validate signal derivative respects Bond Level gates
 *
 * @param {string} signalDerivative - The chosen signal type
 * @param {1|2|3|4|5} bondLevel
 * @param {Object} tasteProfile - User's taste profile (for validation)
 * @returns {{ valid: boolean, reason?: string }}
 */
export function validateSignalDerivative(signalDerivative, bondLevel, tasteProfile = {}) {
  const allowedByLevel = {
    1: ['fact_grounded'],
    2: ['fact_grounded'],
    3: ['fact_grounded', 'symbolic'],
    4: ['fact_grounded', 'symbolic', 'quote'],
    5: ['fact_grounded', 'symbolic', 'quote', 'verse', 'callback'],
  };

  const allowed = allowedByLevel[bondLevel] || [];
  const valid = allowed.includes(signalDerivative);

  if (!valid) {
    return {
      valid: false,
      reason: `Signal derivative "${signalDerivative}" not allowed at Bond Level ${bondLevel}. ` +
        `Allowed: ${allowed.join(', ')}`,
    };
  }

  // Extra validation for types that require taste profile data
  if (signalDerivative === 'symbolic' && (!tasteProfile || !tasteProfile.favoriteSymbols)) {
    return {
      valid: false,
      reason: `Signal derivative "symbolic" requires favoriteSymbols in taste profile.`,
    };
  }

  if (signalDerivative === 'quote' && (!tasteProfile || !tasteProfile.favoriteSources)) {
    return {
      valid: false,
      reason: `Signal derivative "quote" requires favoriteSources in taste profile.`,
    };
  }

  if (signalDerivative === 'verse' && (!tasteProfile || !tasteProfile.faithMode)) {
    return {
      valid: false,
      reason: `Signal derivative "verse" requires faithMode enabled in taste profile.`,
    };
  }

  return { valid: true };
}

/**
 * Check if signal is fact-grounded (safe fallback)
 * Fact-grounded signals refer to specific achievements or facts from the week
 *
 * @param {Object} signal - Signal section of areciboIntent
 * @returns {boolean}
 */
function hasFactGroundedAcknowledgment(areciboIntent) {
  if (!areciboIntent?.sections?.signal) return false;

  const signal = areciboIntent.sections.signal;
  const message = (signal.message || '').toLowerCase();

  // Look for concrete facts: numbers, specific habits, bills, etc.
  const hasFactReference = /\d+|bills?|habit|streak|day|week/i.test(message);
  return signal.derivative === 'fact_grounded' || hasFactReference;
}

/**
 * Extract all text content from areciboIntent for analysis
 * @param {Object} areciboIntent
 * @returns {string}
 */
function extractAllText(areciboIntent) {
  const sections = areciboIntent?.sections || {};
  const texts = [];

  Object.values(sections).forEach((section) => {
    if (section?.message) texts.push(section.message);
    if (section?.narrative) texts.push(section.narrative);
    if (typeof section === 'object') {
      Object.values(section).forEach((value) => {
        if (typeof value === 'string') texts.push(value);
      });
    }
  });

  return texts.join(' ');
}

/**
 * Find matching patterns in text
 * Returns matched patterns (for reporting)
 *
 * @param {string} text
 * @param {RegExp[]} patterns
 * @returns {string[]}
 */
function findPatternMatches(text, patterns) {
  const matched = [];
  patterns.forEach((pattern) => {
    const match = text.match(pattern);
    if (match) {
      matched.push(`"${match[0]}"`);
    }
  });
  return matched;
}

/**
 * Validate complete AreciboIntent structure and content
 * Comprehensive check combining all guardrails
 *
 * @param {Object} areciboIntent - The generated intent
 * @param {Object} weekData - Original week data for context
 * @param {Object} tasteProfile - User's taste profile
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateAreciboIntent(areciboIntent, weekData, tasteProfile = {}) {
  const errors = [];
  const warnings = [];

  // Check required structure
  if (!areciboIntent?.sections) {
    errors.push('Missing sections object');
    return { valid: false, errors, warnings };
  }

  const required = ['count', 'elements', 'pattern', 'thread', 'reflection', 'kingdom', 'signal'];
  required.forEach((sectionName) => {
    if (!areciboIntent.sections[sectionName]) {
      errors.push(`Missing section: ${sectionName}`);
    }
  });

  // Emotional guardrails
  const emotionalCheck = validateEmotionalGuardrails(areciboIntent, weekData.weekSentiment);
  if (!emotionalCheck.valid) {
    if (emotionalCheck.severity === 'critical') {
      errors.push(...emotionalCheck.violations);
    } else {
      warnings.push(...emotionalCheck.violations);
    }
  }

  // Reflection derivative check
  const reflectionCheck = validateReflectionDerivative(
    areciboIntent.sections.reflection?.derivative,
    weekData.weekSentiment
  );
  if (!reflectionCheck.valid) {
    warnings.push(reflectionCheck.reason);
  }

  // Signal derivative check
  const signalCheck = validateSignalDerivative(
    areciboIntent.sections.signal?.derivative,
    weekData.bondLevel,
    tasteProfile
  );
  if (!signalCheck.valid) {
    errors.push(signalCheck.reason);
  }

  // Signal message quality check
  const signalMsg = areciboIntent.sections.signal?.message || '';
  if (!signalMsg || signalMsg.length < 5) {
    errors.push('Signal message is too short or empty');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
