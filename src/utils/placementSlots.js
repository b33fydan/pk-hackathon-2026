/**
 * Placement Slots — Named positions on the island where decorations can go.
 *
 * Positions are in pre-spread scene coordinates (spread factor applied by IslandScene).
 * All positions avoid: hero center, monster arc, lighthouse, banner, treasury, trees, rocks.
 */

export const PLACEMENT_SLOTS = [
  { id: 'dock_left', x: -2.8, z: 1.5, label: 'Dock Left' },
  { id: 'dock_right', x: 2.8, z: 1.5, label: 'Dock Right' },
  { id: 'garden_front', x: -0.5, z: 3.5, label: 'Garden Front' },
  { id: 'garden_side', x: 1.8, z: 3.2, label: 'Garden Side' },
  { id: 'tower_steps', x: -1.0, z: -0.2, label: 'Tower Steps' },
  { id: 'tower_back', x: -2.2, z: -1.5, label: 'Tower Back' },
  { id: 'hilltop', x: 0.5, z: -2.5, label: 'Hilltop' },
  { id: 'clearing', x: 2.0, z: -1.0, label: 'Clearing' },
  { id: 'shore_north', x: -3.0, z: 0.5, label: 'North Shore' },
  { id: 'shore_south', x: 3.0, z: 0, label: 'South Shore' },
  { id: 'path_corner', x: 1.2, z: 0.2, label: 'Path Corner' },
  { id: 'overlook', x: -0.2, z: -3.2, label: 'Overlook' },
];

/**
 * Get a slot by ID.
 */
export function getSlot(slotId) {
  return PLACEMENT_SLOTS.find((s) => s.id === slotId) || null;
}

/**
 * Get available slots (not occupied by existing decorations).
 * @param {Array} occupiedSlotIds - IDs of slots already in use
 * @returns {Array}
 */
export function getAvailableSlots(occupiedSlotIds) {
  const occupied = new Set(occupiedSlotIds || []);
  return PLACEMENT_SLOTS.filter((s) => !occupied.has(s.id));
}
