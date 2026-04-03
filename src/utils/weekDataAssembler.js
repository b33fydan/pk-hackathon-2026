/**
 * Week Data Assembler — Gathers data from stores into the weekData shape
 * that the Arecibo expressionEngine expects.
 *
 * Also generates the pixel grid data for AreciboGrid.
 */

import { getTodayDate, getWeekBounds } from './formatters';

/**
 * Assemble weekData from store snapshots for a given week.
 *
 * @param {object} params
 * @param {object} params.factState   - useFactStore.getState()
 * @param {object} params.bondState   - useBondStore.getState()
 * @param {object} params.profileState - useProfileStore.getState()
 * @param {string} [params.weekStart] - Override week start (YYYY-MM-DD)
 * @returns {object} weekData matching expressionEngine shape
 */
export function assembleWeekData({ factState, bondState, profileState, weekStart }) {
  const bounds = weekStart
    ? { weekStart, weekEnd: getWeekEnd(weekStart) }
    : getWeekBounds();

  const { weekStart: ws, weekEnd: we } = bounds;

  // Habits for this week
  const weekHabits = factState.habits.filter(
    (h) => h.date >= ws && h.date <= we,
  );
  const activeHabitDefs = factState.habitDefinitions.filter((h) => !h.archived);
  const habitsCompleted = weekHabits.filter((h) => h.completed).length;
  const habitsTotal = activeHabitDefs.length * 7; // potential check-ins

  // Per-habit stats
  const activeHabits = activeHabitDefs.map((def) => {
    const entries = weekHabits.filter((h) => h.habitKey === def.key);
    const completed = entries.filter((h) => h.completed).length;
    return {
      key: def.key,
      name: def.label,
      completed,
      total: 7,
    };
  });

  // Meetings this week
  const weekMeetings = factState.meetings.filter(
    (m) => m.date >= ws && m.date <= we,
  );

  // Bills
  const billsPaid = factState.bills.filter((b) => b.isPaid).length;
  const billsTotal = factState.bills.length;

  // Daily intensity (Mon-Sun: 0-10 scale)
  const dailyIntensity = computeDailyIntensity(weekHabits, weekMeetings, ws);

  // Days with any activity
  const activeDays = new Set([
    ...weekHabits.map((h) => h.date),
    ...weekMeetings.map((m) => m.date),
  ]);

  // Longest streak (from any habit)
  let longestStreak = null;
  for (const def of activeHabitDefs) {
    const streak = computeStreakForWeek(factState.habits, def.key, we);
    if (streak > 0 && (!longestStreak || streak > longestStreak.days)) {
      longestStreak = { habit: def.label, days: streak };
    }
  }

  // Week sentiment
  const weekSentiment = computeWeekSentiment(billsPaid, billsTotal, habitsCompleted, habitsTotal);

  // Week number (ISO week)
  const weekNumber = getISOWeekNumber(new Date(ws + 'T00:00:00'));

  // Weekly recap notes (from factStore)
  const recap = factState.weeklyRecaps.find((r) => r.weekStart === ws);

  return {
    weekNumber,
    weekStart: ws,
    weekEnd: we,
    billsPaid,
    billsTotal,
    habitsCompleted,
    habitsTotal,
    meetings: weekMeetings.length,
    daysActive: activeDays.size,
    bondXpEarned: bondState.bondXP,
    activeHabits,
    dailyIntensity,
    longestStreak,
    nearestMilestone: null,
    weekSentiment,
    bondLevel: bondState.bondLevel,
    companionName: profileState.companionName,
    kingdomName: profileState.kingdomName,
    weeksEngaged: factState.history.length,
    wins: recap?.wins || [],
    losses: recap?.losses || [],
    notes: recap?.notes || '',
  };
}

// ── Pixel Grid Generator ─────────────────────────────────

const GRID_WIDTH = 73;
const GRID_HEIGHT = 23;

/**
 * Generate a 2D pixel grid from weekData for AreciboGrid.
 * Encodes weekly stats into a visually meaningful pattern
 * inspired by the Arecibo message format.
 *
 * @param {object} weekData
 * @returns {number[][]} 73x23 grid of color indices (0-7)
 */
export function generatePixelData(weekData) {
  // Initialize with background (0 = black)
  const grid = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => 0),
  );

  // Section 0 (cols 0-9): Week number encoded as dots
  encodeNumber(grid, 2, 2, weekData.weekNumber, 1); // Purple

  // Section 1 (cols 10-20): Habit completion bars
  encodeHabits(grid, 11, weekData.activeHabits);

  // Section 2 (cols 21-31): Daily intensity heatmap
  encodeDailyIntensity(grid, 22, weekData.dailyIntensity);

  // Section 3 (cols 32-42): Bills & financial status
  encodeBills(grid, 33, weekData.billsPaid, weekData.billsTotal);

  // Section 4 (cols 43-53): Meeting density
  encodeMeetings(grid, 44, weekData.meetings);

  // Section 5 (cols 54-63): Bond level indicator
  encodeBondLevel(grid, 55, weekData.bondLevel);

  // Section 6 (cols 64-72): Sentiment symbol
  encodeSentiment(grid, 65, weekData.weekSentiment);

  return grid;
}

// ── Encoding Helpers ─────────────────────────────────────

function setPixel(grid, x, y, color) {
  if (y >= 0 && y < GRID_HEIGHT && x >= 0 && x < GRID_WIDTH) {
    grid[y][x] = color;
  }
}

function encodeNumber(grid, startX, startY, num, color) {
  // Binary representation as dot pattern
  const binary = Math.min(num, 255).toString(2).padStart(8, '0');
  for (let i = 0; i < 8; i++) {
    if (binary[i] === '1') {
      setPixel(grid, startX + i, startY, color);
      setPixel(grid, startX + i, startY + 1, color);
    }
  }
}

function encodeHabits(grid, startX, habits) {
  habits.forEach((habit, i) => {
    if (i >= 8) return;
    const row = 2 + i * 2;
    const barLen = Math.round((habit.completed / Math.max(habit.total, 1)) * 8);
    for (let j = 0; j < barLen; j++) {
      setPixel(grid, startX + j, row, 2); // Green
    }
    // Dim unfilled
    for (let j = barLen; j < 8; j++) {
      setPixel(grid, startX + j, row, 0);
    }
  });
}

function encodeDailyIntensity(grid, startX, intensity) {
  intensity.forEach((val, day) => {
    const height = Math.round((val / 10) * 18);
    const color = val >= 7 ? 5 : val >= 4 ? 6 : 3; // Yellow / Teal / Blue
    for (let y = GRID_HEIGHT - 2; y >= GRID_HEIGHT - 2 - height; y--) {
      setPixel(grid, startX + day + day, y, color);
      setPixel(grid, startX + day + day + 1, y, color);
    }
  });
}

function encodeBills(grid, startX, paid, total) {
  const ratio = total > 0 ? paid / total : 1;
  const color = ratio >= 1 ? 2 : ratio >= 0.5 ? 5 : 4; // Green / Yellow / Red
  // Stack of blocks representing bills
  for (let i = 0; i < Math.min(total, 8); i++) {
    const row = GRID_HEIGHT - 3 - i * 2;
    const blockColor = i < paid ? color : 0;
    for (let j = 0; j < 6; j++) {
      setPixel(grid, startX + j, row, blockColor);
      setPixel(grid, startX + j, row + 1, blockColor);
    }
    // Border
    setPixel(grid, startX, row, color);
    setPixel(grid, startX + 5, row, color);
  }
}

function encodeMeetings(grid, startX, meetingCount) {
  // Dots in a cluster pattern
  const count = Math.min(meetingCount, 12);
  for (let i = 0; i < count; i++) {
    const col = startX + (i % 4) * 2;
    const row = 4 + Math.floor(i / 4) * 3;
    setPixel(grid, col, row, 7);     // Cyan
    setPixel(grid, col + 1, row, 7);
  }
}

function encodeBondLevel(grid, startX, level) {
  // Diamond/star shape that grows with bond level
  const size = Math.min(level, 5);
  const centerY = 11;
  const centerX = startX + 4;
  const color = level >= 4 ? 5 : level >= 2 ? 1 : 3; // Yellow / Purple / Blue

  for (let ring = 0; ring <= size; ring++) {
    setPixel(grid, centerX, centerY - ring, color);
    setPixel(grid, centerX, centerY + ring, color);
    setPixel(grid, centerX - ring, centerY, color);
    setPixel(grid, centerX + ring, centerY, color);
  }
}

function encodeSentiment(grid, startX, sentiment) {
  // Simple glyph per sentiment
  const color = sentiment === 'victory' ? 5 : sentiment === 'tough' ? 4 : 6;
  const cx = startX + 3;
  const cy = 11;

  if (sentiment === 'victory') {
    // Upward arrow / crown
    setPixel(grid, cx, cy - 3, color);
    setPixel(grid, cx - 1, cy - 2, color);
    setPixel(grid, cx + 1, cy - 2, color);
    setPixel(grid, cx - 2, cy - 1, color);
    setPixel(grid, cx + 2, cy - 1, color);
    for (let x = cx - 2; x <= cx + 2; x++) setPixel(grid, x, cy, color);
  } else if (sentiment === 'tough') {
    // Shield / diamond
    setPixel(grid, cx, cy - 2, color);
    setPixel(grid, cx - 1, cy - 1, color);
    setPixel(grid, cx + 1, cy - 1, color);
    setPixel(grid, cx - 2, cy, color);
    setPixel(grid, cx + 2, cy, color);
    setPixel(grid, cx - 1, cy + 1, color);
    setPixel(grid, cx + 1, cy + 1, color);
    setPixel(grid, cx, cy + 2, color);
  } else {
    // Circle / neutral
    for (let a = 0; a < 8; a++) {
      const angle = (a / 8) * Math.PI * 2;
      const px = Math.round(cx + Math.cos(angle) * 2);
      const py = Math.round(cy + Math.sin(angle) * 2);
      setPixel(grid, px, py, color);
    }
  }
}

// ── Date Helpers ─────────────────────────────────────────

function getWeekEnd(weekStart) {
  const d = new Date(weekStart + 'T00:00:00');
  d.setDate(d.getDate() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function computeDailyIntensity(habits, meetings, weekStart) {
  const intensity = [0, 0, 0, 0, 0, 0, 0];
  const start = new Date(weekStart + 'T00:00:00');

  for (let day = 0; day < 7; day++) {
    const d = new Date(start);
    d.setDate(start.getDate() + day);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const dayHabits = habits.filter((h) => h.date === dateStr && h.completed).length;
    const dayMeetings = meetings.filter((m) => m.date === dateStr).length;
    const heavyMeetings = meetings.filter((m) => m.date === dateStr && m.intensity === 'heavy').length;

    intensity[day] = Math.min(10, dayHabits * 2 + dayMeetings + heavyMeetings * 2);
  }

  return intensity;
}

function computeWeekSentiment(billsPaid, billsTotal, habitsCompleted, habitsTotal) {
  const billStress = billsTotal > 0 && billsPaid < billsTotal * 0.5;
  const habitStress = habitsTotal > 0 && habitsCompleted < habitsTotal * 0.3;
  const billsCleared = billsTotal > 0 && billsPaid >= billsTotal;
  const habitsStrong = habitsTotal > 0 && habitsCompleted > habitsTotal * 0.6;

  if (billStress || habitStress) return 'tough';
  if (billsCleared && habitsStrong) return 'victory';
  return 'mixed';
}

function computeStreakForWeek(allHabits, habitKey, weekEnd) {
  const end = new Date(weekEnd + 'T00:00:00');
  let streak = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date(end);
    d.setDate(end.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = allHabits.find((h) => h.habitKey === habitKey && h.date === dateStr && h.completed);
    if (entry) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}
