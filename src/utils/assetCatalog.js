/**
 * Asset Catalog — Curated voxel decorations for the Expression Engine.
 *
 * Each builder returns a THREE.Group positioned at (x, 0, z).
 * The LLM/template picker selects from these by ID — it never generates meshes.
 */

import * as THREE from 'three';
import {
  createVoxel,
  createBoxMesh,
  getSharedMaterial,
} from './voxelBuilder';

// ── Lantern (warm, cozy) ────────────────────────────────

export function createLantern(x, z, color = '#fbbf24') {
  const group = new THREE.Group();
  // Base
  group.add(createBoxMesh(0, 0.08, 0, 0.18, 0.08, 0.18, '#78350F'));
  // Body (translucent warm glow)
  group.add(createBoxMesh(0, 0.30, 0, 0.14, 0.36, 0.14, color, {
    transparent: true,
    opacity: 0.7,
    emissive: color,
    emissiveIntensity: 0.3,
  }));
  // Cap
  group.add(createBoxMesh(0, 0.52, 0, 0.18, 0.06, 0.18, '#78350F'));
  // Handle
  group.add(createBoxMesh(0, 0.62, 0, 0.04, 0.12, 0.04, '#92400e'));
  // Light
  const light = new THREE.PointLight(color, 0.5, 3);
  light.position.set(0, 0.35, 0);
  group.add(light);
  group.position.set(x, 0, z);
  return group;
}

// ── Flower Cluster ───────────────────────────────────────

export function createFlower(x, z, color = '#f472b6') {
  const group = new THREE.Group();
  // Stem
  group.add(createBoxMesh(0, 0.18, 0, 0.04, 0.30, 0.04, '#166534'));
  // Petals (4 small boxes around center)
  const petalSize = 0.08;
  group.add(createVoxel(-0.08, 0.36, 0, color, petalSize));
  group.add(createVoxel(0.08, 0.36, 0, color, petalSize));
  group.add(createVoxel(0, 0.36, -0.08, color, petalSize));
  group.add(createVoxel(0, 0.36, 0.08, color, petalSize));
  // Center
  group.add(createVoxel(0, 0.36, 0, '#fbbf24', 0.06));
  group.position.set(x, 0, z);
  return group;
}

// ── Banner (small, celebratory) ──────────────────────────

export function createSmallBanner(x, z, color = '#ef4444') {
  const group = new THREE.Group();
  // Pole
  group.add(createBoxMesh(0, 0.35, 0, 0.06, 0.70, 0.06, '#92400e'));
  // Flag
  group.add(createBoxMesh(0.14, 0.55, 0, 0.22, 0.18, 0.03, color));
  group.position.set(x, 0, z);
  return group;
}

// ── Campfire ─────────────────────────────────────────────

export function createCampfire(x, z) {
  const group = new THREE.Group();
  // Stones ring
  const stoneColor = '#6b7280';
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    group.add(createVoxel(
      Math.cos(angle) * 0.16, 0.04, Math.sin(angle) * 0.16,
      stoneColor, 0.08,
    ));
  }
  // Logs
  group.add(createBoxMesh(-0.06, 0.06, 0, 0.20, 0.06, 0.06, '#78350F'));
  group.add(createBoxMesh(0.04, 0.06, -0.04, 0.06, 0.06, 0.18, '#92400e'));
  // Flames (emissive orange blocks)
  group.add(createBoxMesh(0, 0.16, 0, 0.08, 0.14, 0.08, '#f97316', {
    emissive: '#f97316',
    emissiveIntensity: 0.6,
  }));
  group.add(createBoxMesh(0.04, 0.24, 0.02, 0.05, 0.10, 0.05, '#fbbf24', {
    emissive: '#fbbf24',
    emissiveIntensity: 0.8,
  }));
  // Warm glow
  const light = new THREE.PointLight('#f97316', 0.6, 4);
  light.position.set(0, 0.25, 0);
  group.add(light);
  group.position.set(x, 0, z);
  return group;
}

// ── Coffee Mug ───────────────────────────────────────────

export function createCoffeeMug(x, z) {
  const group = new THREE.Group();
  group.add(createBoxMesh(0, 0.10, 0, 0.14, 0.18, 0.12, '#f5f5f4'));
  group.add(createVoxel(0.10, 0.10, 0, '#d6d3d1', 0.06)); // handle
  group.add(createBoxMesh(0, 0.20, 0, 0.10, 0.02, 0.08, '#78350F')); // coffee surface
  group.position.set(x, 0, z);
  return group;
}

// ── Plaque (wall mount / milestone) ──────────────────────

export function createPlaque(x, z, color = '#fbbf24') {
  const group = new THREE.Group();
  // Board
  group.add(createBoxMesh(0, 0.22, 0, 0.30, 0.22, 0.04, '#78350F'));
  // Nameplate
  group.add(createBoxMesh(0, 0.22, 0.03, 0.22, 0.14, 0.02, color));
  group.position.set(x, 0, z);
  return group;
}

// ── Trophy (achievement) ─────────────────────────────────

export function createTrophy(x, z, tier = 'bronze') {
  const colors = {
    bronze: '#b45309',
    silver: '#d1d5db',
    gold: '#fbbf24',
    platinum: '#7dd3fc',
    diamond: '#c084fc',
  };
  const color = colors[tier] || colors.bronze;
  const group = new THREE.Group();
  // Base
  group.add(createBoxMesh(0, 0.04, 0, 0.20, 0.06, 0.20, '#374151'));
  // Stem
  group.add(createBoxMesh(0, 0.16, 0, 0.08, 0.18, 0.08, color));
  // Cup
  group.add(createBoxMesh(0, 0.32, 0, 0.22, 0.14, 0.18, color));
  // Rim
  group.add(createBoxMesh(0, 0.40, 0, 0.24, 0.03, 0.20, color));
  group.position.set(x, 0, z);
  return group;
}

// ── Bird (perched) ───────────────────────────────────────

export function createBird(x, z, color = '#38bdf8') {
  const group = new THREE.Group();
  // Body
  group.add(createBoxMesh(0, 0.40, 0, 0.12, 0.10, 0.16, color));
  // Head
  group.add(createVoxel(0, 0.48, 0.06, color, 0.10));
  // Beak
  group.add(createVoxel(0, 0.47, 0.14, '#f97316', 0.04));
  // Tail
  group.add(createBoxMesh(0, 0.42, -0.12, 0.06, 0.04, 0.10, color));
  // Perch
  group.add(createBoxMesh(0, 0.30, 0, 0.04, 0.30, 0.04, '#92400e'));
  group.position.set(x, 0, z);
  return group;
}

// ── Shield (wall display) ────────────────────────────────

export function createShield(x, z, color = '#3b82f6') {
  const group = new THREE.Group();
  group.add(createBoxMesh(0, 0.28, 0, 0.22, 0.28, 0.06, color));
  group.add(createBoxMesh(0, 0.28, 0.04, 0.10, 0.10, 0.02, '#fbbf24')); // emblem
  group.position.set(x, 0, z);
  return group;
}

// ── Book Stack ───────────────────────────────────────────

export function createBookStack(x, z) {
  const group = new THREE.Group();
  group.add(createBoxMesh(0, 0.04, 0, 0.20, 0.06, 0.14, '#7c2d12'));
  group.add(createBoxMesh(0.02, 0.10, 0, 0.18, 0.06, 0.13, '#1e3a5f'));
  group.add(createBoxMesh(-0.01, 0.16, 0, 0.19, 0.06, 0.14, '#4c1d95'));
  group.position.set(x, 0, z);
  return group;
}

// ── Asset Registry ───────────────────────────────────────

export const ASSET_CATALOG = {
  lantern_warm: { builder: createLantern, args: ['#fbbf24'], label: 'Warm Lantern', rarity: 'common' },
  lantern_blue: { builder: createLantern, args: ['#60a5fa'], label: 'Blue Lantern', rarity: 'common' },
  lantern_rose: { builder: createLantern, args: ['#fb7185'], label: 'Rose Lantern', rarity: 'rare' },
  flower_pink: { builder: createFlower, args: ['#f472b6'], label: 'Pink Flower', rarity: 'common' },
  flower_gold: { builder: createFlower, args: ['#fbbf24'], label: 'Golden Flower', rarity: 'rare' },
  flower_blue: { builder: createFlower, args: ['#60a5fa'], label: 'Blue Flower', rarity: 'common' },
  banner_red: { builder: createSmallBanner, args: ['#ef4444'], label: 'Red Banner', rarity: 'common' },
  banner_gold: { builder: createSmallBanner, args: ['#fbbf24'], label: 'Gold Banner', rarity: 'rare' },
  campfire: { builder: createCampfire, args: [], label: 'Campfire', rarity: 'common' },
  coffee_mug: { builder: createCoffeeMug, args: [], label: 'Coffee Mug', rarity: 'common' },
  plaque_gold: { builder: createPlaque, args: ['#fbbf24'], label: 'Gold Plaque', rarity: 'rare' },
  plaque_bronze: { builder: createPlaque, args: ['#b45309'], label: 'Bronze Plaque', rarity: 'common' },
  trophy_bronze: { builder: createTrophy, args: ['bronze'], label: 'Bronze Trophy', rarity: 'common' },
  trophy_silver: { builder: createTrophy, args: ['silver'], label: 'Silver Trophy', rarity: 'rare' },
  trophy_gold: { builder: createTrophy, args: ['gold'], label: 'Gold Trophy', rarity: 'epic' },
  bird_blue: { builder: createBird, args: ['#38bdf8'], label: 'Blue Bird', rarity: 'common' },
  bird_gold: { builder: createBird, args: ['#fbbf24'], label: 'Gold Bird', rarity: 'rare' },
  shield_blue: { builder: createShield, args: ['#3b82f6'], label: 'Blue Shield', rarity: 'common' },
  shield_gold: { builder: createShield, args: ['#fbbf24'], label: 'Gold Shield', rarity: 'rare' },
  books: { builder: createBookStack, args: [], label: 'Book Stack', rarity: 'common' },
};

/**
 * Build a decoration mesh from catalog ID.
 * @param {string} assetId - Key from ASSET_CATALOG
 * @param {number} x
 * @param {number} z
 * @returns {THREE.Group|null}
 */
export function buildAsset(assetId, x, z) {
  const entry = ASSET_CATALOG[assetId];
  if (!entry) return null;
  return entry.builder(x, z, ...entry.args);
}
