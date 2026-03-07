export const COLORS = {
  grass: ['#4ade80', '#22c55e', '#16a34a'],
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
export const ISLAND_GRID_SIZE = 8;
export const WATER_SIZE = 14;
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
  position: [9, 8.25, 8.5],
  minDistance: 6.4,
  maxDistance: 24,
  minAzimuthAngle: -Infinity,
  maxAzimuthAngle: Infinity,
  minPolarAngle: Math.PI / 4.2,
  maxPolarAngle: Math.PI / 2.3,
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
