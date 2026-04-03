/**
 * Companion Idle Animations — Per-frame motion for each FSM state.
 *
 * Follows the animateMonsterIdle pattern: reads userData.basePosition /
 * baseRotation / baseScale, applies sinusoidal offsets. Zero allocations
 * per frame.
 */

// ── Helpers ──────────────────────────────────────────────

function safeBase(part, prop) {
  return part?.userData?.[prop];
}

function resetToBase(part) {
  const bp = safeBase(part, 'basePosition');
  const br = safeBase(part, 'baseRotation');
  const bs = safeBase(part, 'baseScale');
  if (bp) part.position.copy(bp);
  if (br) part.rotation.copy(br);
  if (bs) part.scale.copy(bs);
}

// ── State Animators ──────────────────────────────────────

function animateSweep(parts, t) {
  // Right arm + broom: side-to-side sweep
  const sweep = Math.sin(t * 0.004) * 0.35;
  if (parts.armRight) {
    parts.armRight.rotation.z = (safeBase(parts.armRight, 'baseRotation')?.z ?? 0) + sweep;
  }
  if (parts.broomHandle) {
    parts.broomHandle.rotation.z = (safeBase(parts.broomHandle, 'baseRotation')?.z ?? 0) + sweep;
  }
  if (parts.broomBristles) {
    parts.broomBristles.rotation.z = (safeBase(parts.broomBristles, 'baseRotation')?.z ?? 0) + sweep;
  }

  // Left arm: counter-swing
  if (parts.armLeft) {
    parts.armLeft.rotation.z = (safeBase(parts.armLeft, 'baseRotation')?.z ?? 0) + Math.sin(t * 0.004 + Math.PI) * 0.12;
  }

  // Body: lean with sweep direction
  if (parts.body) {
    parts.body.rotation.z = (safeBase(parts.body, 'baseRotation')?.z ?? 0) + Math.sin(t * 0.004) * 0.04;
  }

  // Head: gentle bob
  if (parts.head) {
    const baseY = safeBase(parts.head, 'basePosition')?.y ?? 1.35;
    parts.head.position.y = baseY + Math.sin(t * 0.003) * 0.015;
  }
}

function animateCoffee(parts, t) {
  // Body: very gentle rocking
  if (parts.body) {
    parts.body.rotation.z = (safeBase(parts.body, 'baseRotation')?.z ?? 0) + Math.sin(t * 0.0015) * 0.02;
  }

  // Head: tiny nod
  if (parts.head) {
    parts.head.rotation.x = (safeBase(parts.head, 'baseRotation')?.x ?? 0) + Math.sin(t * 0.002) * 0.03;
  }

  // Steam: 3 particles cycle upward and fade
  ['steam0', 'steam1', 'steam2'].forEach((key, i) => {
    const steam = parts[key];
    if (!steam) return;
    const base = safeBase(steam, 'basePosition');
    if (!base) return;

    // Each particle has a staggered phase, loops every ~2.5s
    const phase = ((t * 0.0008 + i * 0.85) % 2.5) / 2.5; // 0..1
    steam.position.y = base.y + phase * 0.45;
    steam.position.x = base.x + Math.sin(t * 0.003 + i * 2.1) * 0.03;

    // Fade: full opacity at bottom, invisible at top
    const opacity = 0.45 * (1 - phase);
    if (steam.material && !steam.material.userData?.shared) {
      steam.material.opacity = opacity;
    } else if (steam.material?.userData?.shared) {
      // Clone material on first animation frame to avoid mutating shared material
      steam.material = steam.material.clone();
      steam.material.userData = { shared: false };
      steam.material.transparent = true;
      steam.material.opacity = opacity;
    }
  });
}

function animateRead(parts, t) {
  // Right arm: periodic page turn
  if (parts.armRight) {
    parts.armRight.rotation.x = (safeBase(parts.armRight, 'baseRotation')?.x ?? 0) + Math.sin(t * 0.0025) * 0.08;
  }

  // Head: looking down at book
  if (parts.head) {
    parts.head.rotation.x = (safeBase(parts.head, 'baseRotation')?.x ?? 0) + 0.08 + Math.sin(t * 0.0018) * 0.02;
  }

  // Lantern light flicker
  if (parts.lanternLight) {
    parts.lanternLight.intensity = 0.7 + Math.sin(t * 0.003) * 0.15;
  }

  // Body: subtle sway
  if (parts.body) {
    parts.body.rotation.z = (safeBase(parts.body, 'baseRotation')?.z ?? 0) + Math.sin(t * 0.0012) * 0.015;
  }
}

function animateSleep(parts, t) {
  // Breathing: body scale oscillation
  if (parts.body) {
    const bs = safeBase(parts.body, 'baseScale');
    if (bs) {
      parts.body.scale.y = bs.y * (1 + Math.sin(t * 0.002) * 0.03);
    }
  }

  // Head: gentle roll
  if (parts.head) {
    parts.head.rotation.z = (safeBase(parts.head, 'baseRotation')?.z ?? 0) + Math.sin(t * 0.001) * 0.05;
  }

  // Z-sprites: float upward in staggered loop
  ['z0', 'z1', 'z2'].forEach((key, i) => {
    const z = parts[key];
    if (!z) return;
    const base = safeBase(z, 'basePosition');
    const baseScale = safeBase(z, 'baseScale');
    if (!base || !baseScale) return;

    // Each Z is offset by 0.7s in phase, loops every ~2.5s
    const phase = ((t * 0.0008 + i * 0.7) % 2.5) / 2.5; // 0..1
    z.position.y = base.y + phase * 0.6;
    z.position.x = base.x + Math.sin(t * 0.002 + i * 1.5) * 0.04;

    // Shrink as it rises
    const scaleFactor = Math.max(0.3, 1 - phase * 0.6);
    z.scale.set(
      baseScale.x * scaleFactor,
      baseScale.y * scaleFactor,
      baseScale.z * scaleFactor,
    );
  });
}

function animatePrePayday(parts, t) {
  // Right arm: grinding motion (faster = effort)
  if (parts.armRight) {
    parts.armRight.rotation.x = (safeBase(parts.armRight, 'baseRotation')?.x ?? 0) + Math.sin(t * 0.006) * 0.25;
  }

  // Left arm: holds sword steady, small vibration
  if (parts.armLeft) {
    parts.armLeft.rotation.x = (safeBase(parts.armLeft, 'baseRotation')?.x ?? 0) + Math.sin(t * 0.012) * 0.02;
  }

  // Head: focused forward lean
  if (parts.head) {
    parts.head.rotation.x = (safeBase(parts.head, 'baseRotation')?.x ?? 0) + 0.06 + Math.sin(t * 0.003) * 0.02;
  }

  // Body: slight forward lean
  if (parts.body) {
    parts.body.rotation.x = (safeBase(parts.body, 'baseRotation')?.x ?? 0) + 0.05 + Math.sin(t * 0.003) * 0.02;
  }

  // Whetstone: brief pulse every ~3s to suggest spark
  if (parts.whetstone) {
    const bs = safeBase(parts.whetstone, 'baseScale');
    if (bs) {
      const sparkPhase = (t * 0.001) % 3;
      const sparkPulse = sparkPhase < 0.2 ? 1 + (0.15 * Math.sin(sparkPhase * Math.PI / 0.2)) : 1;
      parts.whetstone.scale.set(
        bs.x * sparkPulse,
        bs.y * sparkPulse,
        bs.z * sparkPulse,
      );
    }
  }
}

// ── Dispatch ─────────────────────────────────────────────

const ANIMATORS = {
  morning_sweep: animateSweep,
  coffee_sit: animateCoffee,
  evening_read: animateRead,
  night_sleep: animateSleep,
  pre_payday: animatePrePayday,
};

/**
 * Animate the companion for one frame.
 *
 * @param {THREE.Group} companionGroup - The group returned by createCompanion()
 * @param {string}      stateId        - Current FSM state ID
 * @param {number}      elapsedMs      - Raw performance.now() timestamp
 */
export function animateCompanionIdle(companionGroup, stateId, elapsedMs) {
  const meta = companionGroup?.userData?.companionMeta;
  if (!meta?.parts) return;

  const safeT = Number.isFinite(elapsedMs) ? elapsedMs : 0;
  const animate = ANIMATORS[stateId];
  if (animate) {
    animate(meta.parts, safeT);
  }
}
