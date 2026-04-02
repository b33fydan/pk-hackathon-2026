import * as THREE from 'three';
import { COLORS } from './constants';

const geometryCache = new Map();
const materialCache = new Map();
const SHADOW_CAST_MIN_DIMENSION = 0.5;

function normalizeValue(value) {
  if (value instanceof THREE.Color) {
    return value.getHexString();
  }

  return value;
}

export function getSharedBoxGeometry(width, height = width, depth = width) {
  const key = `${width}|${height}|${depth}`;

  if (!geometryCache.has(key)) {
    const geometry = new THREE.BoxGeometry(width, height, depth);
    geometry.userData.shared = true;
    geometryCache.set(key, geometry);
  }

  return geometryCache.get(key);
}

export function getSharedMaterial(color, overrides = {}) {
  const key = JSON.stringify([
    color,
    Object.entries(overrides)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([entryKey, value]) => [entryKey, normalizeValue(value)]),
  ]);

  if (!materialCache.has(key)) {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.8,
      metalness: 0.08,
      ...overrides,
    });
    material.userData.shared = true;
    materialCache.set(key, material);
  }

  return materialCache.get(key);
}

function shouldCastShadow(width, height = width, depth = width) {
  return Math.max(width, height, depth) >= SHADOW_CAST_MIN_DIMENSION;
}

function pickColor(palette, index) {
  if (Array.isArray(palette)) {
    return palette[index % palette.length];
  }

  return palette;
}

function offsetValue(seed, amplitude) {
  return Math.sin(seed * 1.73) * amplitude;
}

export function createVoxel(x, y, z, color, size = 1) {
  const voxel = new THREE.Mesh(
    getSharedBoxGeometry(size, size, size),
    getSharedMaterial(color),
  );

  voxel.position.set(x, y, z);
  voxel.castShadow = shouldCastShadow(size);
  voxel.receiveShadow = true;
  return voxel;
}

function createBoxMesh(x, y, z, width, height, depth, color, materialOptions = {}) {
  const mesh = new THREE.Mesh(
    getSharedBoxGeometry(width, height, depth),
    getSharedMaterial(color, materialOptions),
  );

  mesh.position.set(x, y, z);
  mesh.castShadow = shouldCastShadow(width, height, depth);
  mesh.receiveShadow = true;
  return mesh;
}

function rememberTransform(object) {
  object.userData.basePosition = object.position.clone();
  object.userData.baseRotation = object.rotation.clone();
  object.userData.baseScale = object.scale.clone();
  return object;
}

function createMonsterRoot(category, size) {
  const sizeMap = {
    small: 0.8,
    medium: 1.15,
    large: 1.45,
  };

  const group = new THREE.Group();
  const motionRoot = new THREE.Group();
  group.add(motionRoot);
  group.scale.setScalar(sizeMap[size] ?? sizeMap.small);
  group.userData.monsterMeta = {
    category,
    body: motionRoot,
    parts: {},
  };
  return { group, motionRoot, meta: group.userData.monsterMeta };
}

export function createGroup(meshes) {
  const group = new THREE.Group();
  meshes.forEach((mesh) => group.add(mesh));
  return group;
}

export function createTree(x, z, style = 'pine') {
  const trunk = new THREE.Mesh(
    getSharedBoxGeometry(0.45, 1.3, 0.45),
    getSharedMaterial(COLORS.wood),
  );
  trunk.position.set(0, 0.65, 0);

  const group = createGroup([trunk]);
  group.position.set(x, 0, z);

  if (style === 'oak') {
    group.add(createVoxel(0, 1.55, 0, pickColor(COLORS.leaf, 0), 1.15));
    group.add(createVoxel(-0.45, 1.35, 0.15, pickColor(COLORS.leaf, 1), 0.65));
    group.add(createVoxel(0.4, 1.35, -0.1, pickColor(COLORS.leaf, 2), 0.7));
  } else if (style === 'round') {
    group.add(createVoxel(0, 1.6, 0, pickColor(COLORS.leaf, 2), 1.2));
    group.add(createVoxel(0, 2.2, 0, pickColor(COLORS.leaf, 0), 0.7));
    group.add(createVoxel(-0.45, 1.8, 0.2, pickColor(COLORS.leaf, 1), 0.55));
    group.add(createVoxel(0.45, 1.8, -0.2, pickColor(COLORS.leaf, 1), 0.55));
  } else {
    group.add(createVoxel(0, 1.3, 0, pickColor(COLORS.leaf, 0), 1));
    group.add(createVoxel(0, 1.95, 0, pickColor(COLORS.leaf, 1), 0.75));
    group.add(createVoxel(0, 2.45, 0, pickColor(COLORS.leaf, 2), 0.55));
  }

  return group;
}

export function createBuilding(x, z, width, height, depth, color) {
  const group = new THREE.Group();

  for (let ix = 0; ix < width; ix += 1) {
    for (let iy = 0; iy < height; iy += 1) {
      for (let iz = 0; iz < depth; iz += 1) {
        const block = createVoxel(
          ix - (width - 1) / 2,
          iy + 0.5,
          iz - (depth - 1) / 2,
          color,
          0.95,
        );
        block.castShadow = false;
        group.add(block);
      }
    }
  }

  const roof = new THREE.Mesh(
    getSharedBoxGeometry(width + 0.25, 0.45, depth + 0.25),
    getSharedMaterial(COLORS.bronze),
  );
  roof.position.set(0, height + 0.55, 0);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  group.position.set(x, 0, z);
  return group;
}

export function createCharacter(x, z, armorColor, hasShield = false) {
  const group = new THREE.Group();

  group.add(createVoxel(-0.2, 0.35, 0, '#334155', 0.35));
  group.add(createVoxel(0.2, 0.35, 0, '#334155', 0.35));
  group.add(createVoxel(0, 0.95, 0, armorColor, 0.8));
  group.add(createVoxel(0, 1.65, 0, COLORS.hero.skin, 0.55));
  group.add(createVoxel(-0.55, 0.9, 0, armorColor, 0.24));
  group.add(createVoxel(0.55, 0.9, 0, armorColor, 0.24));

  const sword = new THREE.Mesh(
    getSharedBoxGeometry(0.18, 0.95, 0.18),
    getSharedMaterial(COLORS.silver),
  );
  sword.position.set(0.58, 0.75, 0);
  sword.rotation.z = -0.4;
  sword.castShadow = true;
  group.add(sword);

  if (hasShield) {
    const shield = new THREE.Mesh(
      getSharedBoxGeometry(0.18, 0.7, 0.55),
      getSharedMaterial(COLORS.bronze),
    );
    shield.position.set(-0.65, 0.9, 0);
    shield.castShadow = true;
    shield.receiveShadow = true;
    group.add(shield);
  }

  group.position.set(x, 0, z);
  return group;
}

export function createMonster(x, z, color, size = 'small', category = 'other') {
  const { group, motionRoot, meta } = createMonsterRoot(category, size);

  if (category === 'housing') {
    const torso = rememberTransform(createBoxMesh(0, 0.72, 0, 1.2, 1.2, 1, color));
    const head = rememberTransform(createVoxel(0, 1.5, 0.08, '#7f1d1d', 0.55));
    const armLeft = rememberTransform(createBoxMesh(-0.8, 0.78, 0, 0.32, 0.92, 0.32, '#b91c1c'));
    const armRight = rememberTransform(createBoxMesh(0.8, 0.78, 0, 0.32, 0.92, 0.32, '#b91c1c'));
    motionRoot.add(
      torso,
      head,
      armLeft,
      armRight,
      createVoxel(-0.34, 0.18, 0.12, '#7f1d1d', 0.34),
      createVoxel(0.34, 0.18, 0.12, '#7f1d1d', 0.34),
      createVoxel(-0.18, 1.55, 0.36, '#111827', 0.12),
      createVoxel(0.18, 1.55, 0.36, '#111827', 0.12),
      createVoxel(-0.44, 2.02, -0.08, '#fca5a5', 0.16),
      createVoxel(0.44, 2.02, -0.08, '#fca5a5', 0.16),
    );
    meta.parts = { head, armLeft, armRight };
  } else if (category === 'utilities') {
    const core = rememberTransform(createBoxMesh(0, 0.52, 0, 1.2, 0.78, 1.1, color));
    const cap = rememberTransform(createBoxMesh(0, 1.02, 0, 0.88, 0.5, 0.78, '#fde047'));
    const sparkLeft = rememberTransform(createVoxel(-0.62, 1.02, 0, '#fef08a', 0.18));
    const sparkRight = rememberTransform(createVoxel(0.62, 1.02, 0, '#fef08a', 0.18));
    const sparkTop = rememberTransform(createVoxel(0, 1.46, 0, '#fef08a', 0.18));
    motionRoot.add(
      core,
      cap,
      sparkLeft,
      sparkRight,
      sparkTop,
      createVoxel(-0.18, 0.78, 0.34, '#111827', 0.12),
      createVoxel(0.18, 0.78, 0.34, '#111827', 0.12),
    );
    meta.parts = { sparkLeft, sparkRight, sparkTop, core };
  } else if (category === 'phone') {
    const orb = rememberTransform(createBoxMesh(0, 0.92, 0, 1.05, 1.05, 0.9, color));
    const pupil = rememberTransform(createVoxel(0, 0.92, 0.52, '#f8fafc', 0.34));
    const iris = rememberTransform(createVoxel(0, 0.92, 0.66, '#111827', 0.16));
    const antenna = rememberTransform(createBoxMesh(0, 1.72, 0, 0.1, 0.52, 0.1, '#c4b5fd'));
    const antennaTip = rememberTransform(createVoxel(0, 2.02, 0, '#f472b6', 0.18));
    motionRoot.add(
      orb,
      pupil,
      iris,
      antenna,
      antennaTip,
      createVoxel(-0.52, 0.9, -0.08, '#7c3aed', 0.2),
      createVoxel(0.52, 0.9, -0.08, '#7c3aed', 0.2),
    );
    meta.parts = { iris, antennaTip };
  } else if (category === 'transport') {
    const body = rememberTransform(createBoxMesh(0, 0.88, 0, 0.9, 0.7, 1.05, color));
    const head = rememberTransform(createVoxel(0, 1.28, 0.22, '#fb923c', 0.42));
    const legs = [
      rememberTransform(createBoxMesh(-0.58, 0.42, 0.4, 0.12, 0.54, 0.12, '#7c2d12')),
      rememberTransform(createBoxMesh(0.58, 0.42, 0.4, 0.12, 0.54, 0.12, '#7c2d12')),
      rememberTransform(createBoxMesh(-0.72, 0.36, -0.1, 0.12, 0.46, 0.12, '#7c2d12')),
      rememberTransform(createBoxMesh(0.72, 0.36, -0.1, 0.12, 0.46, 0.12, '#7c2d12')),
      rememberTransform(createBoxMesh(-0.5, 0.28, -0.55, 0.12, 0.4, 0.12, '#7c2d12')),
      rememberTransform(createBoxMesh(0.5, 0.28, -0.55, 0.12, 0.4, 0.12, '#7c2d12')),
    ];
    motionRoot.add(
      body,
      head,
      ...legs,
      createVoxel(-0.14, 1.32, 0.46, '#111827', 0.12),
      createVoxel(0.14, 1.32, 0.46, '#111827', 0.12),
    );
    meta.parts = { head, legs };
  } else if (category === 'food') {
    const blob = rememberTransform(createBoxMesh(0, 0.56, 0, 1.18, 0.92, 1.08, color));
    const blobTop = rememberTransform(createBoxMesh(0, 1.02, 0, 0.82, 0.46, 0.78, '#4ade80'));
    const mouth = rememberTransform(createBoxMesh(0, 0.64, 0.5, 0.42, 0.08, 0.08, '#052e16'));
    motionRoot.add(
      blob,
      blobTop,
      mouth,
      createVoxel(-0.18, 0.88, 0.42, '#111827', 0.12),
      createVoxel(0.18, 0.88, 0.42, '#111827', 0.12),
    );
    meta.parts = { blob, blobTop, mouth };
  } else if (category === 'insurance') {
    const ghostBody = rememberTransform(
      createBoxMesh(0, 0.94, 0, 0.98, 1.34, 0.9, '#f8fafc', {
        transparent: true,
        opacity: 0.9,
      }),
    );
    const tailLeft = rememberTransform(createVoxel(-0.28, 0.2, 0, '#bfdbfe', 0.26));
    const tailCenter = rememberTransform(createVoxel(0, 0.14, 0, '#dbeafe', 0.34));
    const tailRight = rememberTransform(createVoxel(0.28, 0.2, 0, '#bfdbfe', 0.26));
    motionRoot.add(
      ghostBody,
      tailLeft,
      tailCenter,
      tailRight,
      createVoxel(-0.16, 1.06, 0.42, '#1e3a8a', 0.12),
      createVoxel(0.16, 1.06, 0.42, '#1e3a8a', 0.12),
      createVoxel(0, 0.7, 0.42, '#93c5fd', 0.2),
    );
    meta.parts = { ghostBody, tailLeft, tailCenter, tailRight };
  } else if (category === 'entertainment') {
    const impBody = rememberTransform(createBoxMesh(0, 0.66, 0, 0.88, 0.92, 0.82, color));
    const hornLeft = rememberTransform(createVoxel(-0.28, 1.36, 0, '#f9a8d4', 0.18));
    const hornRight = rememberTransform(createVoxel(0.28, 1.36, 0, '#f9a8d4', 0.18));
    const armLeft = rememberTransform(createBoxMesh(-0.52, 0.74, 0, 0.14, 0.54, 0.14, '#db2777'));
    const armRight = rememberTransform(createBoxMesh(0.52, 0.74, 0, 0.14, 0.54, 0.14, '#db2777'));
    motionRoot.add(
      impBody,
      hornLeft,
      hornRight,
      armLeft,
      armRight,
      createVoxel(-0.14, 0.82, 0.34, '#111827', 0.12),
      createVoxel(0.14, 0.82, 0.34, '#111827', 0.12),
      createVoxel(0, 0.44, 0.38, '#831843', 0.16),
    );
    meta.parts = { hornLeft, hornRight, armLeft, armRight };
  } else {
    const body = rememberTransform(createBoxMesh(0, 0.68, 0, 0.96, 1, 0.84, color));
    const earLeft = rememberTransform(createVoxel(-0.28, 1.34, 0, '#d1d5db', 0.16));
    const earRight = rememberTransform(createVoxel(0.28, 1.34, 0, '#d1d5db', 0.16));
    motionRoot.add(
      body,
      earLeft,
      earRight,
      createVoxel(-0.16, 0.9, 0.38, '#111827', 0.12),
      createVoxel(0.16, 0.9, 0.38, '#111827', 0.12),
      createVoxel(0, 0.48, 0.38, '#4b5563', 0.16),
      createVoxel(-0.26, 0.12, 0.12, '#9ca3af', 0.26),
      createVoxel(0.26, 0.12, 0.12, '#9ca3af', 0.26),
    );
    meta.parts = { earLeft, earRight };
  }

  group.position.set(x, 0, z);
  return group;
}

export function createRocks(x, z, count = 3) {
  const group = new THREE.Group();

  for (let index = 0; index < count; index += 1) {
    const rock = new THREE.Mesh(
      getSharedBoxGeometry(0.3 + index * 0.05, 0.25 + index * 0.04, 0.3),
      getSharedMaterial(pickColor(COLORS.stone, index)),
    );
    rock.position.set(
      offsetValue(index + x, 0.55),
      0.14 + index * 0.03,
      offsetValue(index + z + 5, 0.45),
    );
    rock.rotation.y = index * 0.25;
    rock.castShadow = true;
    rock.receiveShadow = true;
    group.add(rock);
  }

  group.position.set(x, 0, z);
  return group;
}

export function createLighthouse(x, z, config) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const { lanternColor, lanternIntensity, lanternRange, roofColor, glassColor, glassOpacity } = config;
  const S = 1;

  // Colors — mostly stone white with 2 red bands
  const STONE_LIGHT = '#F5F5F4';
  const STONE_MID = '#E7E5E4';
  const STONE_DARK = '#D6D3D1';
  const RED_BAND = '#DC2626';

  // === BASE (y 0-2): 3x3 wide foundation, dark stone ===
  for (let y = 0; y < 3; y++) {
    const color = y === 0 ? STONE_DARK : STONE_MID;
    for (let bx = -1; bx <= 1; bx++) {
      for (let bz = -1; bz <= 1; bz++) {
        group.add(createVoxel(bx * S, y * S, bz * S, color, S));
      }
    }
  }

  // === SHAFT (y 3-8): tall column, mostly white stone, 2 red bands ===
  // Cross shape (+) for the shaft — gives it a rounded/tapered feel
  const shaftPattern = [
    [0, -1], [0, 0], [0, 1], [-1, 0], [1, 0], // + shape
  ];
  for (let y = 3; y < 9; y++) {
    const isRedBand = y === 5 || y === 7;
    const color = isRedBand ? RED_BAND : STONE_LIGHT;
    for (const [bx, bz] of shaftPattern) {
      group.add(createVoxel(bx * S, y * S, bz * S, color, S));
    }
  }

  // === WALKWAY (y 9): wider ring, dark stone — the balcony ===
  for (let bx = -1; bx <= 1; bx++) {
    for (let bz = -1; bz <= 1; bz++) {
      group.add(createVoxel(bx * S, 9 * S, bz * S, STONE_DARK, S));
    }
  }

  // === LANTERN ROOM (y 10): glass walls with light inside ===
  const lanternY = 10 * S;
  // Center light block
  group.add(createVoxel(0, lanternY, 0, lanternColor, S));
  // Glass on 4 cardinal sides
  for (const [bx, bz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const glass = new THREE.Mesh(
      getSharedBoxGeometry(S, S, S),
      getSharedMaterial(glassColor, { transparent: true, opacity: glassOpacity }),
    );
    glass.position.set(bx * S, lanternY, bz * S);
    glass.receiveShadow = true;
    group.add(glass);
  }

  // === ROOF (y 11-12): pointed cap ===
  // Wider cap
  for (const [bx, bz] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) {
    group.add(createVoxel(bx * S, 11 * S, bz * S, roofColor, S));
  }
  // Peak
  group.add(createVoxel(0, 12 * S, 0, roofColor, S));

  // === POINT LIGHT (warm gold glow) ===
  const light = new THREE.PointLight(
    new THREE.Color(lanternColor).getHex(),
    lanternIntensity,
    lanternRange,
  );
  light.position.set(0, lanternY + 0.5, 0);
  group.add(light);

  return group;
}
