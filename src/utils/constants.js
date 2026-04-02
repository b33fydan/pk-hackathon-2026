export const COLORS = {
  grass: ['#4f8144', '#456f3c', '#365a2f'],
  water: '#3b82f6',
  wood: '#92400e',
  stone: '#9ca3af',
  leaf: ['#15803d', '#166534', '#14532d'],
  gold: '#fbbf24',
  silver: '#d1d5db',
  bronze: '#b45309',
  monster: {
    rent: '#ef4444',
    electric: '#eab308',
    phone: '#8b5cf6',
    insurance: '#f97316',
    generic: '#6b7280',
  },
  hero: {
    skin: '#fcd34d',
    base: '#60a5fa',
  },
};

export const SCENE_BACKGROUND = '#112615';
export const ISLAND_GRID_SIZE = 9;
export const WATER_SIZE = 15;
export const KINGDOM_LAYOUT = {
  shellMaxWidth: '110rem',
  shellWideMaxWidth: '118rem',
  panelMaxWidth: '34rem',
  desktopPanelBasis: 'clamp(22.5rem, 35vw, 32rem)',
  widePanelBasis: 'clamp(23rem, 32vw, 34rem)',
};
export const DAY_COUNT_OPTIONS = Array.from({ length: 28 }, (_, index) => index + 1);
export const KINGDOM_BANNER_OPTIONS = [
  { key: 'red', label: 'Red', color: '#ef4444', darkColor: '#7f1d1d' },
  { key: 'blue', label: 'Blue', color: '#3b82f6', darkColor: '#1e3a8a' },
  { key: 'green', label: 'Green', color: '#22c55e', darkColor: '#14532d' },
  { key: 'purple', label: 'Purple', color: '#8b5cf6', darkColor: '#4c1d95' },
  { key: 'gold', label: 'Gold', color: '#fbbf24', darkColor: '#78350f' },
  { key: 'black', label: 'Black', color: '#0f172a', darkColor: '#020617' },
];
export const KINGDOM_BANNER_MAP = Object.fromEntries(
  KINGDOM_BANNER_OPTIONS.map((option) => [option.key, option]),
);

export const CAMERA_CONFIG = {
  fov: 45,
  minDistance: 6.8,
  maxDistance: 28,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  minPolarAngle: Math.PI / 4.2,
  maxPolarAngle: Math.PI / 2.3,
  presets: {
    compact: {
      position: [10.8, 9.6, 10.7],
      target: [0, 0.18, 0.24],
    },
    desktop: {
      position: [11.7, 10.25, 11.55],
      target: [0, 0.12, 0.1],
    },
    wide: {
      position: [12.2, 10.6, 12.15],
      target: [0, 0.12, 0.08],
    },
  },
};

export function getCameraConfigForWidth(width) {
  const presetKey = width >= 1600 ? 'wide' : width >= 1280 ? 'desktop' : 'compact';
  const preset = CAMERA_CONFIG.presets[presetKey];

  return {
    fov: CAMERA_CONFIG.fov,
    minDistance: CAMERA_CONFIG.minDistance,
    maxDistance: CAMERA_CONFIG.maxDistance,
    minAzimuthAngle: CAMERA_CONFIG.minAzimuthAngle,
    maxAzimuthAngle: CAMERA_CONFIG.maxAzimuthAngle,
    minPolarAngle: CAMERA_CONFIG.minPolarAngle,
    maxPolarAngle: CAMERA_CONFIG.maxPolarAngle,
    ...preset,
  };
}

export const ISLAND_SCENE_CONFIG = {
  worldScale: 1.16,
  terrain: {
    topTileSize: 0.9,
    topTileHeightScale: 0.54,
    topTileYOffset: -0.455,
    underTileSize: 0.94,
    underTileYOffset: -1.28,
    waveA: 0.02,
    waveB: 0.014,
    checker: 0.002,
    plateauSize: ISLAND_GRID_SIZE - 0.18,
    plateauHeight: 0.82,
    plateauY: -0.63,
  },
  visualScale: {
    prop: 0.6,
    character: 0.6,
    monster: 0.54,
    building: 0.585,
  },
  groundOffsets: {
    hero: -0.18,
    monster: 0.09,
    structure: -0.2,
  },
  placement: {
    spread: 1.15,
    heroCenterX: 0,
    heroCenterZ: 2.05,
    treasury: [1.15, 1.3],
    banner: [-1.38, 3.08],
    monsterArc: {
      startAngle: Math.PI * 0.72,
      endAngle: Math.PI * 0.28,
      xRadius: 2.75,
      zRadius: 1.3,
      zOffset: 0.15,
    },
    baseDecor: {
      trees: [
        [-3.1, -2.7, 'pine'],
        [2.9, -2.1, 'round'],
      ],
      rocks: [3.15, 2.45, 4],
    },
  },
};

export const DEFAULT_HERO_POSITION = {
  x: ISLAND_SCENE_CONFIG.placement.heroCenterX,
  y: 0,
  z: ISLAND_SCENE_CONFIG.placement.heroCenterZ,
};

export const BILL_CATEGORY_OPTIONS = [
  {
    value: 'housing',
    label: 'Housing',
    icon: 'rent',
    emoji: '🏠',
    color: COLORS.monster.rent,
  },
  {
    value: 'utilities',
    label: 'Utilities',
    icon: 'electric',
    emoji: '⚡',
    color: COLORS.monster.electric,
  },
  {
    value: 'phone',
    label: 'Phone / Internet',
    icon: 'phone',
    emoji: '📱',
    color: COLORS.monster.phone,
  },
  {
    value: 'transport',
    label: 'Transportation',
    icon: 'insurance',
    emoji: '🚗',
    color: '#f97316',
  },
  {
    value: 'food',
    label: 'Food / Groceries',
    icon: 'generic',
    emoji: '🍔',
    color: '#22c55e',
  },
  {
    value: 'insurance',
    label: 'Health / Insurance',
    icon: 'insurance',
    emoji: '💊',
    color: '#38bdf8',
  },
  {
    value: 'entertainment',
    label: 'Entertainment',
    icon: 'generic',
    emoji: '🎮',
    color: '#ec4899',
  },
  {
    value: 'other',
    label: 'Other',
    icon: 'generic',
    emoji: '📋',
    color: COLORS.monster.generic,
  },
];

export const BILL_CATEGORY_MAP = Object.fromEntries(
  BILL_CATEGORY_OPTIONS.map((category) => [category.value, category]),
);

export const LIGHTHOUSE_CONFIG = {
  position: { x: -1.5, z: -0.5 },
  baseWidth: 3,
  height: 8,
  topWidth: 2,
  bodyColors: ['#D6D3D1', '#F5F5F4'],
  stripeColor: '#EF4444',
  lanternColor: '#FBBF24',
  lanternIntensity: 1.5,
  lanternRange: 20,
  roofColor: '#78350F',
  glassColor: '#FEF3C7',
  glassOpacity: 0.5,
};
