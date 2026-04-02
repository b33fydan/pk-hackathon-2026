/**
 * @fileoverview Section assemblers for Arecibo Recap
 * Convert week data to pixel grids for each of 7 sections
 * All functions are deterministic (pure) and return number[][] grids
 */

/**
 * Create a blank grid filled with black (0)
 * @param {number} width
 * @param {number} height
 * @returns {number[][]}
 */
function createBlankGrid(width, height) {
  return Array.from({ length: height }, () => Array(width).fill(0));
}

/**
 * Set a pixel value in a grid with bounds checking
 * @param {number[][]} grid
 * @param {number} x
 * @param {number} y
 * @param {number} value
 */
function setPixel(grid, x, y, value) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    grid[y][x] = value;
  }
}

/**
 * Get a pixel value from a grid with bounds checking
 * @param {number[][]} grid
 * @param {number} x
 * @param {number} y
 * @returns {number}
 */
function getPixel(grid, x, y) {
  if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
    return grid[y][x];
  }
  return 0;
}

/**
 * Draw a rectangle outline
 * @param {number[][]} grid
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} color
 */
function drawRect(grid, x, y, width, height, color) {
  // Horizontal lines
  for (let i = 0; i < width; i++) {
    setPixel(grid, x + i, y, color);
    setPixel(grid, x + i, y + height - 1, color);
  }
  // Vertical lines
  for (let i = 0; i < height; i++) {
    setPixel(grid, x, y + i, color);
    setPixel(grid, x + width - 1, y + i, color);
  }
}

/**
 * Fill a rectangle with a color
 * @param {number[][]} grid
 * @param {number} x
 * @param {number} y
 * @param {number} width
 * @param {number} height
 * @param {number} color
 */
function fillRect(grid, x, y, width, height, color) {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      setPixel(grid, x + dx, y + dy, color);
    }
  }
}

/**
 * SECTION 1: THE COUNT
 * Render statistics: bills, habits, meetings, days active, XP earned
 *
 * Derivatives:
 * - 'standard': All 5 stats displayed in equal columns
 * - 'highlight': One standout stat enlarged, others smaller
 * - 'streak_emphasis': If a streak exists, pulses with brightness
 * - 'minimal': Only 2-3 most significant stats
 *
 * @param {Object} weekData - WeekData object
 * @param {string} derivative - One of: standard, highlight, streak_emphasis, minimal
 * @returns {number[][]} Grid of color indices
 */
function assembleCount(weekData, derivative = 'standard') {
  const grid = createBlankGrid(20, 10);
  const WHITE = 1;

  // Calculate percentages for habit/bill completion
  const billPercent = weekData.billsTotal > 0 ? Math.round((weekData.billsPaid / weekData.billsTotal) * 100) : 0;
  const habitPercent = weekData.habitsTotal > 0 ? Math.round((weekData.habitsCompleted / weekData.habitsTotal) * 100) : 0;

  if (derivative === 'standard') {
    // Display all 5 stats in equal vertical columns
    // Col 1: Bills (0-4)
    fillRect(grid, 0, 0, 4, 2, WHITE);
    setPixel(grid, 1, 3, WHITE); // Bill indicator

    // Col 2: Habits (5-9)
    fillRect(grid, 5, 0, 4, 2, WHITE);
    setPixel(grid, 6, 3, WHITE);

    // Col 3: Meetings (10-14)
    fillRect(grid, 10, 0, 4, 2, WHITE);
    setPixel(grid, 11, 3, WHITE);

    // Col 4: Days Active (15-19)
    fillRect(grid, 15, 0, 4, 2, WHITE);
    setPixel(grid, 16, 3, WHITE);

    // Row with numeric encoding (simple: 1 pixel per unit, up to 5)
    const units = [
      Math.min(weekData.billsPaid, 5),
      Math.min(weekData.habitsCompleted, 5),
      Math.min(weekData.meetings, 5),
      Math.min(weekData.daysActive, 5),
    ];
    units.forEach((unit, idx) => {
      for (let i = 0; i < unit; i++) {
        setPixel(grid, idx * 5 + 1, 5 + i, WHITE);
      }
    });

    // Bottom row: XP earned (max 10)
    const xpBarLength = Math.min(Math.floor(weekData.bondXpEarned / 10), 19);
    fillRect(grid, 0, 9, xpBarLength + 1, 1, WHITE);
  } else if (derivative === 'highlight') {
    // Determine highlight stat: which is most significant
    // Priority: habits, meetings, bills, days, xp
    let highlightIdx = 1; // habits by default
    if (weekData.meetings > 5) highlightIdx = 2;
    if (weekData.billsPaid < billPercent * 0.5) highlightIdx = 0;

    // Highlighted stat gets 2x height
    const positions = [0, 5, 10, 15];
    positions.forEach((x, idx) => {
      if (idx === highlightIdx) {
        fillRect(grid, x, 0, 4, 4, WHITE);
      } else {
        fillRect(grid, x, 1, 4, 2, WHITE);
      }
    });

    // XP bar at bottom
    const xpBarLength = Math.min(Math.floor(weekData.bondXpEarned / 10), 19);
    fillRect(grid, 0, 9, xpBarLength + 1, 1, WHITE);
  } else if (derivative === 'streak_emphasis') {
    // If there's an active streak, show it prominently
    if (weekData.longestStreak) {
      const streakLength = weekData.longestStreak.days;
      // Draw a tall vertical bar for streak
      const streakHeight = Math.min(streakLength, 8);
      fillRect(grid, 8, 10 - streakHeight, 4, streakHeight, WHITE);
      // Context: other stats smaller
      fillRect(grid, 0, 7, 3, 2, WHITE);
      fillRect(grid, 4, 7, 3, 2, WHITE);
      fillRect(grid, 12, 7, 3, 2, WHITE);
      fillRect(grid, 16, 7, 3, 2, WHITE);
    } else {
      // No streak: fall back to standard
      return assembleCount(weekData, 'standard');
    }
  } else if (derivative === 'minimal') {
    // Only show top 2 stats
    const topStats = [
      { label: 'habits', value: weekData.habitsCompleted },
      { label: 'meetings', value: weekData.meetings },
    ];
    topStats.forEach((stat, idx) => {
      const x = idx * 8;
      fillRect(grid, x, 0, 6, 3, WHITE);
      // Numeric bar
      const barHeight = Math.min(stat.value, 5);
      fillRect(grid, x + 1, 4, 4, barHeight, WHITE);
    });
  }

  return grid;
}

/**
 * SECTION 2: THE ELEMENTS
 * Render active habits as pixelated "element symbols"
 * Completed habits are solid, missed habits are dimmed
 *
 * Derivatives:
 * - 'full': All active habits shown
 * - 'dominant': Highest-streak habit enlarged
 * - 'discovery': If new habit added, highlight it
 * - 'decay': If streak broke, show faded glyph
 *
 * @param {Object} weekData
 * @param {string} derivative
 * @returns {number[][]}
 */
function assembleElements(weekData, derivative = 'full') {
  const grid = createBlankGrid(20, 10);
  const PURPLE = 6; // Purple for elements
  const DIMMED = 2; // Dimmed purple-ish

  const habits = weekData.activeHabits || [];
  if (habits.length === 0) return grid;

  if (derivative === 'full') {
    // Display all habits as small glyphs in a grid
    // 4 cols × 2 rows = up to 8 habits
    habits.slice(0, 8).forEach((habit, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = col * 5 + 1;
      const y = row * 5 + 1;

      const completed = habit.completed >= habit.total;
      const color = completed ? PURPLE : DIMMED;

      // Draw a 3×3 symbol
      fillRect(grid, x, y, 3, 3, color);
      // Cross through if incomplete
      if (!completed) {
        setPixel(grid, x + 1, y + 1, 0);
      }
    });
  } else if (derivative === 'dominant') {
    // Find habit with best completion ratio
    let dominant = habits[0];
    let bestRatio = dominant.completed / (dominant.total || 1);
    habits.forEach((habit) => {
      const ratio = habit.completed / (habit.total || 1);
      if (ratio > bestRatio) {
        dominant = habit;
        bestRatio = ratio;
      }
    });

    // Draw dominant habit large in center
    fillRect(grid, 8, 3, 4, 4, PURPLE);

    // Other habits small in corners
    const others = habits.filter((h) => h.key !== dominant.key).slice(0, 4);
    others.forEach((habit, idx) => {
      const corner = idx % 4;
      let x, y;
      if (corner === 0) [x, y] = [1, 1]; // top-left
      else if (corner === 1) [x, y] = [15, 1]; // top-right
      else if (corner === 2) [x, y] = [1, 7]; // bottom-left
      else [x, y] = [15, 7]; // bottom-right

      const color = habit.completed >= habit.total ? PURPLE : DIMMED;
      fillRect(grid, x, y, 2, 2, color);
    });
  } else if (derivative === 'discovery') {
    // Highlight as if a new habit was added
    // Show all habits, with first one glowing
    habits.slice(0, 8).forEach((habit, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = col * 5 + 1;
      const y = row * 5 + 1;

      const color = idx === 0 ? PURPLE : DIMMED;
      fillRect(grid, x, y, 3, 3, color);
    });
    // Add glow around first
    if (habits.length > 0) {
      drawRect(grid, 0, 1, 5, 5, PURPLE);
    }
  } else if (derivative === 'decay') {
    // Show habits with emphasis on any broken streak
    const brokenHabit = habits.find((h) => h.completed < Math.ceil(h.total / 2));

    habits.slice(0, 8).forEach((habit, idx) => {
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const x = col * 5 + 1;
      const y = row * 5 + 1;

      if (habit.key === brokenHabit?.key) {
        // Draw with crack pattern
        fillRect(grid, x, y, 3, 3, DIMMED);
        setPixel(grid, x + 1, y, 0);
        setPixel(grid, x, y + 1, 0);
      } else {
        const color = habit.completed >= habit.total ? PURPLE : DIMMED;
        fillRect(grid, x, y, 3, 3, color);
      }
    });
  }

  return grid;
}

/**
 * SECTION 3: THE PATTERN
 * Render daily intensity as heatmap/waveform
 * 7 days (Mon-Sun) with intensity 0-10
 *
 * Derivatives:
 * - 'heatmap': Vertical bars, height = intensity
 * - 'waveform': Smooth curves (pixelated)
 * - 'binary_pulse': Dense/sparse blocks per day
 * - 'bookend': Emphasize contrast (start vs end of week)
 *
 * @param {Object} weekData
 * @param {string} derivative
 * @returns {number[][]}
 */
function assemblePattern(weekData, derivative = 'heatmap') {
  const grid = createBlankGrid(20, 10);
  const GREEN = 2; // Green for pattern

  const dailyIntensity = weekData.dailyIntensity || [5, 5, 5, 5, 5, 5, 5];

  if (derivative === 'heatmap') {
    // Each of 7 days gets a column, height proportional to intensity
    dailyIntensity.forEach((intensity, day) => {
      const x = day * 2 + 1;
      const height = Math.max(1, Math.round((intensity / 10) * 8));
      fillRect(grid, x, 10 - height, 1, height, GREEN);
    });
  } else if (derivative === 'waveform') {
    // Smooth-ish curve connecting intensity points
    let prevY = 5;
    dailyIntensity.forEach((intensity, day) => {
      const x = day * 2 + 1;
      const y = Math.round(5 - (intensity / 10) * 4);
      setPixel(grid, x, y, GREEN);
      // Connect to previous point
      if (day > 0) {
        const deltaY = y - prevY;
        for (let i = 0; i < Math.abs(deltaY); i++) {
          const midX = x - 1;
          const midY = prevY + (deltaY > 0 ? i : -i);
          setPixel(grid, midX, midY, GREEN);
        }
      }
      prevY = y;
    });
  } else if (derivative === 'binary_pulse') {
    // Dense blocks for busy days, sparse for calm
    dailyIntensity.forEach((intensity, day) => {
      const x = day * 2 + 1;
      const isBusy = intensity > 5;
      if (isBusy) {
        fillRect(grid, x, 2, 1, 6, GREEN);
      } else {
        setPixel(grid, x, 4, GREEN);
        setPixel(grid, x, 6, GREEN);
      }
    });
  } else if (derivative === 'bookend') {
    // Emphasize start vs end
    const startIntensity = dailyIntensity[0];
    const endIntensity = dailyIntensity[6];
    const startHeight = Math.max(1, Math.round((startIntensity / 10) * 4));
    const endHeight = Math.max(1, Math.round((endIntensity / 10) * 4));

    // Large bar for start
    fillRect(grid, 1, 10 - startHeight, 2, startHeight, GREEN);
    // Large bar for end
    fillRect(grid, 17, 10 - endHeight, 2, endHeight, GREEN);

    // Small bars for middle days
    for (let day = 1; day < 6; day++) {
      const x = day * 2 + 1;
      const height = Math.max(1, Math.round((dailyIntensity[day] / 10) * 2));
      fillRect(grid, x, 9, 1, height, GREEN);
    }
  }

  return grid;
}

/**
 * SECTION 4: THE THREAD
 * Render streaks and milestones as a spiral/helix
 *
 * Derivatives:
 * - 'clean_helix': Simple spiral with milestone dots
 * - 'growth_thread': Helix thickens toward bottom
 * - 'near_miss': Pulsing node if close to milestone
 * - 'origin': Small genesis helix (early weeks)
 *
 * @param {Object} weekData
 * @param {string} derivative
 * @returns {number[][]}
 */
function assembleThread(weekData, derivative = 'clean_helix') {
  const grid = createBlankGrid(20, 10);
  const BLUE = 3; // Blue for thread
  const WHITE = 1;

  const streakLength = weekData.longestStreak?.days || 1;
  const weeksEngaged = weekData.weekNumber || 1;

  if (derivative === 'clean_helix') {
    // Draw a simple double-helix spiral
    const centerX = 10;
    for (let y = 0; y < 10; y++) {
      const phase = (y / 10) * Math.PI * 2;
      const x1 = centerX + Math.round(3 * Math.cos(phase));
      const x2 = centerX + Math.round(3 * Math.sin(phase));
      setPixel(grid, x1, y, BLUE);
      setPixel(grid, x2, y, BLUE);
    }

    // Add milestone dots
    if (weekData.nearestMilestone && weekData.nearestMilestone.daysAway < 7) {
      setPixel(grid, centerX - 2, 3, WHITE);
      setPixel(grid, centerX + 2, 3, WHITE);
    }
  } else if (derivative === 'growth_thread') {
    // Helix gets thicker toward bottom
    const centerX = 10;
    for (let y = 0; y < 10; y++) {
      const thickness = Math.round((y / 10) * 2);
      const phase = (y / 10) * Math.PI * 2;
      const x1 = centerX + Math.round(3 * Math.cos(phase));
      const x2 = centerX + Math.round(3 * Math.sin(phase));

      for (let t = -thickness; t <= thickness; t++) {
        setPixel(grid, x1 + t, y, BLUE);
        setPixel(grid, x2 + t, y, BLUE);
      }
    }
  } else if (derivative === 'near_miss') {
    // Draw helix with pulsing node at top
    const centerX = 10;
    for (let y = 0; y < 10; y++) {
      const phase = (y / 10) * Math.PI * 2;
      const x1 = centerX + Math.round(3 * Math.cos(phase));
      const x2 = centerX + Math.round(3 * Math.sin(phase));
      setPixel(grid, x1, y, BLUE);
      setPixel(grid, x2, y, BLUE);
    }

    // Pulsing node at top if near milestone
    if (weekData.nearestMilestone && weekData.nearestMilestone.daysAway < 10) {
      drawRect(grid, centerX - 2, 0, 5, 3, WHITE);
    }
  } else if (derivative === 'origin') {
    // Small genesis helix for early weeks
    const centerX = 10;
    for (let y = 0; y < 6; y++) {
      const phase = (y / 6) * Math.PI * 2;
      const x1 = centerX + Math.round(2 * Math.cos(phase));
      const x2 = centerX + Math.round(2 * Math.sin(phase));
      setPixel(grid, x1, y + 2, BLUE);
      setPixel(grid, x2, y + 2, BLUE);
    }
  }

  return grid;
}

/**
 * SECTION 5: THE REFLECTION
 * Render companion pose reflecting week sentiment
 *
 * Derivatives:
 * - 'victory': Arms up
 * - 'working': Bent over desk
 * - 'resting': Seated
 * - 'guardian': Shield forward
 * - 'celebration': Dancing
 * - 'vigil': Standing by light
 *
 * @param {Object} weekData
 * @param {string} derivative
 * @returns {number[][]}
 */
function assembleReflection(weekData, derivative = 'working') {
  const grid = createBlankGrid(20, 10);
  const RED = 4; // Red for reflection figure
  const WHITE = 1;

  if (derivative === 'victory') {
    // Figure with arms up (4, 3)
    // Head
    fillRect(grid, 9, 1, 2, 2, RED);
    // Body
    fillRect(grid, 9, 3, 2, 3, RED);
    // Arms up
    fillRect(grid, 7, 2, 2, 1, RED);
    fillRect(grid, 11, 2, 2, 1, RED);
    // Legs
    fillRect(grid, 9, 6, 1, 3, RED);
    fillRect(grid, 10, 6, 1, 3, RED);
  } else if (derivative === 'working') {
    // Figure bent over desk
    // Head (bent)
    fillRect(grid, 9, 1, 2, 2, RED);
    // Back (curved)
    fillRect(grid, 8, 3, 4, 2, RED);
    // Desk
    fillRect(grid, 6, 5, 8, 1, RED);
    // Legs under desk
    fillRect(grid, 8, 6, 1, 3, RED);
    fillRect(grid, 11, 6, 1, 3, RED);
  } else if (derivative === 'resting') {
    // Seated figure
    // Head
    fillRect(grid, 9, 1, 2, 2, RED);
    // Body
    fillRect(grid, 9, 3, 2, 2, RED);
    // Seat
    fillRect(grid, 7, 5, 6, 2, RED);
    // Legs down
    fillRect(grid, 9, 7, 1, 2, RED);
    fillRect(grid, 10, 7, 1, 2, RED);
  } else if (derivative === 'guardian') {
    // Figure with shield
    // Head
    fillRect(grid, 10, 1, 2, 2, RED);
    // Body
    fillRect(grid, 10, 3, 2, 3, RED);
    // Shield (left side)
    fillRect(grid, 6, 2, 3, 4, RED);
    // Legs
    fillRect(grid, 10, 6, 1, 3, RED);
    fillRect(grid, 11, 6, 1, 3, RED);
  } else if (derivative === 'celebration') {
    // Jumping/dancing figure
    // Head (up)
    fillRect(grid, 9, 0, 2, 2, RED);
    // Body
    fillRect(grid, 9, 2, 2, 2, RED);
    // Arms out and up
    fillRect(grid, 6, 1, 3, 1, RED);
    fillRect(grid, 11, 1, 3, 1, RED);
    // Legs (bent, ready to jump)
    fillRect(grid, 9, 4, 1, 3, RED);
    fillRect(grid, 10, 4, 1, 3, RED);
    // Confetti dots
    setPixel(grid, 5, 2, WHITE);
    setPixel(grid, 15, 2, WHITE);
    setPixel(grid, 6, 5, WHITE);
    setPixel(grid, 14, 5, WHITE);
  } else if (derivative === 'vigil') {
    // Standing figure by light
    // Head
    fillRect(grid, 9, 1, 2, 2, RED);
    // Body
    fillRect(grid, 9, 3, 2, 3, RED);
    // Legs
    fillRect(grid, 9, 6, 1, 3, RED);
    fillRect(grid, 10, 6, 1, 3, RED);
    // Light/lantern (right side)
    drawRect(grid, 15, 2, 3, 4, WHITE);
    setPixel(grid, 16, 3, WHITE);
  }

  return grid;
}

/**
 * SECTION 6: THE KINGDOM
 * Render kingdom/world state as top-down map snapshot
 *
 * Derivatives:
 * - 'overview': All structures visible
 * - 'growth_compare': This week vs last week
 * - 'spotlight': Zoomed into one new addition
 * - 'seasonal': Colored by mood theme
 *
 * @param {Object} weekData
 * @param {string} derivative
 * @returns {number[][]}
 */
function assembleKingdom(weekData, derivative = 'overview') {
  const grid = createBlankGrid(20, 10);
  const YELLOW = 5; // Yellow for kingdom

  if (derivative === 'overview') {
    // Simple kingdom map: few structures scattered
    // Castle/tower center
    fillRect(grid, 9, 2, 2, 4, YELLOW);
    // Scattered buildings
    fillRect(grid, 3, 1, 2, 2, YELLOW);
    fillRect(grid, 15, 1, 2, 2, YELLOW);
    fillRect(grid, 2, 6, 2, 2, YELLOW);
    fillRect(grid, 16, 6, 2, 2, YELLOW);
    // Border
    drawRect(grid, 0, 0, 20, 10, YELLOW);
  } else if (derivative === 'growth_compare') {
    // Left side: previous, Right side: current
    // Previous (dimmed)
    fillRect(grid, 1, 2, 3, 3, 3); // dimmed
    fillRect(grid, 5, 3, 2, 2, 3);

    // Current (bright)
    fillRect(grid, 12, 2, 3, 3, YELLOW);
    fillRect(grid, 16, 3, 2, 2, YELLOW);
    fillRect(grid, 14, 6, 2, 2, YELLOW); // new

    // Arrow between
    setPixel(grid, 9, 4, 1);
    setPixel(grid, 10, 4, 1);
  } else if (derivative === 'spotlight') {
    // Zoomed view of one structure
    drawRect(grid, 5, 2, 10, 6, YELLOW);
    fillRect(grid, 8, 4, 4, 2, YELLOW);
  } else if (derivative === 'seasonal') {
    // Same as overview but with subtle color variation
    // All in YELLOW (no color override in assembler; done in selector)
    fillRect(grid, 9, 2, 2, 4, YELLOW);
    fillRect(grid, 3, 1, 2, 2, YELLOW);
    fillRect(grid, 15, 1, 2, 2, YELLOW);
    fillRect(grid, 2, 6, 2, 2, YELLOW);
    fillRect(grid, 16, 6, 2, 2, YELLOW);
    drawRect(grid, 0, 0, 20, 10, YELLOW);
  }

  return grid;
}

/**
 * SECTION 7: THE SIGNAL
 * Agent's personal message (most Bond-dependent)
 *
 * Derivatives:
 * - 'fact_grounded': Encoded facts
 * - 'quote': Quote from user's favorite source
 * - 'verse': Faith-based verse
 * - 'symbolic': Just a symbol
 * - 'callback': Reference to past week
 *
 * @param {Object} weekData
 * @param {string} derivative
 * @returns {number[][]}
 */
function assembleSignal(weekData, derivative = 'fact_grounded') {
  const grid = createBlankGrid(20, 10);
  const TEAL = 7; // Teal for signal
  const WHITE = 1;

  if (derivative === 'fact_grounded') {
    // Dish antenna shape (top)
    fillRect(grid, 6, 0, 8, 1, TEAL);
    fillRect(grid, 5, 1, 10, 1, TEAL);

    // Shaft
    fillRect(grid, 9, 2, 2, 4, TEAL);

    // Signal lines (radiating out)
    setPixel(grid, 4, 3, WHITE);
    setPixel(grid, 4, 4, WHITE);
    setPixel(grid, 3, 5, WHITE);

    setPixel(grid, 16, 3, WHITE);
    setPixel(grid, 16, 4, WHITE);
    setPixel(grid, 17, 5, WHITE);

    // Message area (bottom)
    drawRect(grid, 3, 6, 14, 3, TEAL);
  } else if (derivative === 'quote') {
    // Similar antenna
    fillRect(grid, 6, 0, 8, 1, TEAL);
    fillRect(grid, 5, 1, 10, 1, TEAL);
    fillRect(grid, 9, 2, 2, 2, TEAL);

    // Quote marks
    setPixel(grid, 2, 4, WHITE);
    setPixel(grid, 18, 4, WHITE);

    // Message area
    drawRect(grid, 1, 5, 18, 4, TEAL);
  } else if (derivative === 'verse') {
    // Cross symbol (faith)
    fillRect(grid, 9, 0, 2, 8, TEAL);
    fillRect(grid, 5, 3, 10, 2, TEAL);

    // Transmission lines below
    setPixel(grid, 3, 9, TEAL);
    setPixel(grid, 10, 9, TEAL);
    setPixel(grid, 17, 9, TEAL);
  } else if (derivative === 'symbolic') {
    // Just a central symbol (star, heart, etc.)
    // Star shape
    setPixel(grid, 10, 1, WHITE);
    fillRect(grid, 8, 3, 4, 2, WHITE);
    setPixel(grid, 10, 5, WHITE);
    setPixel(grid, 6, 4, WHITE);
    setPixel(grid, 14, 4, WHITE);

    // Surrounding glow
    drawRect(grid, 5, 2, 10, 5, TEAL);
  } else if (derivative === 'callback') {
    // Multi-section antenna (past-present connection)
    fillRect(grid, 5, 0, 10, 2, TEAL);
    fillRect(grid, 8, 2, 4, 3, TEAL);
    fillRect(grid, 6, 5, 8, 1, TEAL);

    // Connection dots
    setPixel(grid, 2, 3, WHITE);
    setPixel(grid, 18, 3, WHITE);
    setPixel(grid, 10, 8, WHITE);
  }

  return grid;
}

export {
  assembleCount,
  assembleElements,
  assemblePattern,
  assembleThread,
  assembleReflection,
  assembleKingdom,
  assembleSignal,
};
