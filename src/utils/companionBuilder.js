/**
 * Companion Voxel Builder — Short FF-style chibi character with per-state props.
 *
 * The companion is visually distinct from the battle hero: shorter, softer,
 * oversized head, cozy tunic + rose scarf. Each FSM state attaches different
 * props (broom, mug, book, Z-sprites, sword) to the same base body.
 */

import * as THREE from 'three';
import {
  createBoxMesh,
  createVoxel,
  getSharedBoxGeometry,
  getSharedMaterial,
  rememberTransform,
} from './voxelBuilder';

// ── Palette ──────────────────────────────────────────────

const C = {
  skin: '#fcd34d',
  eyes: '#1e293b',
  eyesClosed: '#92400e',
  hair: '#166534',
  tunic: '#7dd3fc',
  legs: '#334155',
  scarf: '#fca5a5',
  broomHandle: '#92400e',
  broomBristles: '#a16207',
  mug: '#f5f5f4',
  mugHandle: '#d6d3d1',
  steam: '#f5f5f4',
  book: '#7c2d12',
  lanternBody: '#fbbf24',
  lanternLight: '#fbbf24',
  zSprite: '#93c5fd',
  sword: '#d1d5db',
  whetstone: '#9ca3af',
};

// ── Base Body ────────────────────────────────────────────

function createCompanionBase(sitting) {
  const parts = {};
  const group = new THREE.Group();

  const bodyY = sitting ? 0.48 : 0.78;
  const headY = sitting ? 1.05 : 1.35;
  const armY = sitting ? 0.48 : 0.78;
  const legY = sitting ? 0.12 : 0.20;
  const scarfY = sitting ? 0.78 : 1.08;

  // Legs
  parts.legLeft = rememberTransform(createBoxMesh(-0.15, legY, 0, 0.20, 0.30, 0.22, C.legs));
  parts.legRight = rememberTransform(createBoxMesh(0.15, legY, 0, 0.20, 0.30, 0.22, C.legs));

  if (sitting) {
    // Legs extend forward when sitting
    parts.legLeft.rotation.x = -0.9;
    parts.legRight.rotation.x = -0.9;
    parts.legLeft.userData.baseRotation = parts.legLeft.rotation.clone();
    parts.legRight.userData.baseRotation = parts.legRight.rotation.clone();
  }

  // Body (tunic)
  parts.body = rememberTransform(createBoxMesh(0, bodyY, 0, 0.55, 0.55, 0.40, C.tunic));

  // Scarf (signature accent)
  parts.scarf = rememberTransform(createBoxMesh(0, scarfY, 0.08, 0.38, 0.10, 0.22, C.scarf));

  // Head (oversized for chibi)
  parts.head = rememberTransform(createBoxMesh(0, headY, 0, 0.50, 0.48, 0.45, C.skin));

  // Eyes
  parts.eyeLeft = rememberTransform(createVoxel(-0.12, headY + 0.02, 0.22, C.eyes, 0.08));
  parts.eyeRight = rememberTransform(createVoxel(0.12, headY + 0.02, 0.22, C.eyes, 0.08));

  // Hair tufts (sprout silhouette)
  parts.hairCenter = rememberTransform(createVoxel(0, headY + 0.30, -0.02, C.hair, 0.16));
  parts.hairLeft = rememberTransform(createVoxel(-0.14, headY + 0.26, -0.04, C.hair, 0.12));
  parts.hairRight = rememberTransform(createVoxel(0.14, headY + 0.26, -0.04, C.hair, 0.12));

  // Arms
  parts.armLeft = rememberTransform(createBoxMesh(-0.38, armY, 0, 0.16, 0.38, 0.18, C.tunic));
  parts.armRight = rememberTransform(createBoxMesh(0.38, armY, 0, 0.16, 0.38, 0.18, C.tunic));

  // Add all to group
  Object.values(parts).forEach((part) => group.add(part));

  return { group, parts };
}

// ── Per-State Props ──────────────────────────────────────

function addSweepProps(group, parts) {
  // Broom: handle + bristles, attached at right arm position
  parts.broomHandle = rememberTransform(
    createBoxMesh(0.42, 0.55, 0.12, 0.08, 0.75, 0.08, C.broomHandle),
  );
  parts.broomBristles = rememberTransform(
    createBoxMesh(0.42, 0.14, 0.18, 0.20, 0.18, 0.14, C.broomBristles),
  );
  group.add(parts.broomHandle, parts.broomBristles);
}

function addCoffeeProps(group, parts) {
  // Mug in front of companion (sitting)
  parts.mug = rememberTransform(createBoxMesh(0.22, 0.52, 0.22, 0.16, 0.18, 0.14, C.mug));
  parts.mugHandle = rememberTransform(createVoxel(0.34, 0.54, 0.22, C.mugHandle, 0.06));
  group.add(parts.mug, parts.mugHandle);

  // Steam: 3 pre-created boxes that cycle upward in animation
  const steamMat = { transparent: true, opacity: 0.45 };
  parts.steam0 = rememberTransform(createBoxMesh(0.22, 0.72, 0.22, 0.06, 0.06, 0.06, C.steam, steamMat));
  parts.steam1 = rememberTransform(createBoxMesh(0.18, 0.82, 0.20, 0.05, 0.05, 0.05, C.steam, steamMat));
  parts.steam2 = rememberTransform(createBoxMesh(0.26, 0.92, 0.24, 0.04, 0.04, 0.04, C.steam, steamMat));
  group.add(parts.steam0, parts.steam1, parts.steam2);
}

function addReadProps(group, parts) {
  // Book in lap
  parts.book = rememberTransform(createBoxMesh(0, 0.38, 0.18, 0.30, 0.06, 0.22, C.book));
  group.add(parts.book);

  // Lantern beside companion
  parts.lanternBody = rememberTransform(createBoxMesh(-0.55, 0.25, 0.10, 0.14, 0.22, 0.14, C.lanternBody));
  group.add(parts.lanternBody);

  // Warm PointLight for lantern glow
  parts.lanternLight = new THREE.PointLight(C.lanternLight, 0.8, 4);
  parts.lanternLight.position.set(-0.55, 0.42, 0.10);
  group.add(parts.lanternLight);
}

function addSleepProps(group, parts) {
  // Replace open eyes with closed-eye lines
  if (parts.eyeLeft) parts.eyeLeft.visible = false;
  if (parts.eyeRight) parts.eyeRight.visible = false;

  parts.eyeClosedLeft = rememberTransform(
    createBoxMesh(-0.12, parts.head.userData.basePosition.y + 0.02, 0.22, 0.10, 0.03, 0.04, C.eyesClosed),
  );
  parts.eyeClosedRight = rememberTransform(
    createBoxMesh(0.12, parts.head.userData.basePosition.y + 0.02, 0.22, 0.10, 0.03, 0.04, C.eyesClosed),
  );
  group.add(parts.eyeClosedLeft, parts.eyeClosedRight);

  // Z-sprites: 3 boxes of decreasing size, will float upward in animation
  parts.z0 = rememberTransform(createBoxMesh(0.15, parts.head.userData.basePosition.y + 0.40, 0.10, 0.14, 0.14, 0.06, C.zSprite));
  parts.z1 = rememberTransform(createBoxMesh(0.28, parts.head.userData.basePosition.y + 0.55, 0.06, 0.11, 0.11, 0.05, C.zSprite));
  parts.z2 = rememberTransform(createBoxMesh(0.38, parts.head.userData.basePosition.y + 0.70, 0.02, 0.08, 0.08, 0.04, C.zSprite));
  group.add(parts.z0, parts.z1, parts.z2);
}

function addPrePaydayProps(group, parts) {
  // Whetstone on ground
  parts.whetstone = rememberTransform(
    createBoxMesh(0.10, 0.08, 0.28, 0.28, 0.08, 0.14, C.whetstone),
  );
  group.add(parts.whetstone);

  // Sword across lap
  parts.sword = rememberTransform(
    createBoxMesh(0, 0.46, 0.16, 0.14, 0.65, 0.10, C.sword),
  );
  parts.sword.rotation.z = 0.7;
  parts.sword.userData.baseRotation = parts.sword.rotation.clone();
  group.add(parts.sword);
}

// ── Main Factory ─────────────────────────────────────────

const SITTING_STATES = new Set(['coffee_sit', 'evening_read', 'night_sleep', 'pre_payday']);

const PROP_BUILDERS = {
  morning_sweep: addSweepProps,
  coffee_sit: addCoffeeProps,
  evening_read: addReadProps,
  night_sleep: addSleepProps,
  pre_payday: addPrePaydayProps,
};

/**
 * Create the companion voxel model for a given FSM state.
 *
 * @param {number} x       - World X position
 * @param {number} z       - World Z position
 * @param {string} stateId - FSM state ID from companionFSM.js
 * @returns {THREE.Group}  - Group with userData.companionMeta = { parts, stateId }
 */
export function createCompanion(x, z, stateId) {
  const sitting = SITTING_STATES.has(stateId);
  const { group, parts } = createCompanionBase(sitting);

  // Attach state-specific props
  const addProps = PROP_BUILDERS[stateId];
  if (addProps) {
    addProps(group, parts);
  }

  // Tag for animation system
  group.userData.companionMeta = { parts, stateId };
  group.position.set(x, 0, z);

  return group;
}
