import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  BILL_CATEGORY_MAP,
  COLORS,
  COMPANION_CONFIG,
  getCameraConfigForWidth,
  ISLAND_GRID_SIZE,
  ISLAND_SCENE_CONFIG,
  KINGDOM_BANNER_MAP,
  LIGHTHOUSE_CONFIG,
  SCENE_BACKGROUND,
  WATER_SIZE,
} from '../../utils/constants';
import {
  useFactStore,
  selectMonthsCompleted,
  selectSurplus,
  selectTotalBills,
} from '../../store/factStore';
import { useWorldStore } from '../../store/worldStore';
import { useProfileStore } from '../../store/profileStore';
import { useUiStore } from '../../store/uiStore';
import {
  getHeroTierByKey,
  getIslandStageForMonths,
} from '../../utils/progression';
import {
  createBuilding,
  createCharacter,
  createLighthouse,
  createMonster,
  createRocks,
  createTree,
  createVoxel,
  getSharedBoxGeometry,
  getSharedMaterial,
} from '../../utils/voxelBuilder';
import { soundManager } from '../../utils/soundManager';
import { getTimeLighting } from '../../utils/weatherSystem';
import { createCompanion } from '../../utils/companionBuilder';
import { animateCompanionIdle } from '../../utils/companionAnimations';
import { getCurrentCompanionState } from '../../utils/companionFSM';
import { buildAsset } from '../../utils/assetCatalog';
import { getSlot } from '../../utils/placementSlots';
import { assembleContext, pickDailyExpression, pruneExpired } from '../../utils/expressionPicker';
import { useBondStore } from '../../store/bondStore';

const HERO_GROUND_OFFSET = ISLAND_SCENE_CONFIG.groundOffsets.hero;
const MONSTER_GROUND_OFFSET = ISLAND_SCENE_CONFIG.groundOffsets.monster;
const STRUCTURE_GROUND_OFFSET = ISLAND_SCENE_CONFIG.groundOffsets.structure;
const HERO_CENTER = new THREE.Vector3(
  ISLAND_SCENE_CONFIG.placement.heroCenterX,
  HERO_GROUND_OFFSET,
  ISLAND_SCENE_CONFIG.placement.heroCenterZ,
);
const WORLD_SCALE = ISLAND_SCENE_CONFIG.worldScale;
const TOP_TERRAIN_TILE_SIZE = ISLAND_SCENE_CONFIG.terrain.topTileSize;
const TOP_TERRAIN_TILE_HEIGHT_SCALE = ISLAND_SCENE_CONFIG.terrain.topTileHeightScale;
const TOP_TERRAIN_Y_OFFSET = ISLAND_SCENE_CONFIG.terrain.topTileYOffset;
const UNDER_TERRAIN_TILE_SIZE = ISLAND_SCENE_CONFIG.terrain.underTileSize;
const UNDER_TERRAIN_Y_OFFSET = ISLAND_SCENE_CONFIG.terrain.underTileYOffset;
const TERRAIN_WAVE_A = ISLAND_SCENE_CONFIG.terrain.waveA;
const TERRAIN_WAVE_B = ISLAND_SCENE_CONFIG.terrain.waveB;
const TERRAIN_CHECKER = ISLAND_SCENE_CONFIG.terrain.checker;
const LANDSCAPE_PLATEAU_SIZE = ISLAND_SCENE_CONFIG.terrain.plateauSize;
const LANDSCAPE_PLATEAU_HEIGHT = ISLAND_SCENE_CONFIG.terrain.plateauHeight;
const LANDSCAPE_PLATEAU_Y = ISLAND_SCENE_CONFIG.terrain.plateauY;
const PROP_VISUAL_SCALE = ISLAND_SCENE_CONFIG.visualScale.prop;
const CHARACTER_VISUAL_SCALE = ISLAND_SCENE_CONFIG.visualScale.character;
const MONSTER_VISUAL_SCALE = ISLAND_SCENE_CONFIG.visualScale.monster;
const BUILDING_VISUAL_SCALE = ISLAND_SCENE_CONFIG.visualScale.building;
const SCENE_POSITION_SPREAD = ISLAND_SCENE_CONFIG.placement.spread;
const LOCAL_PROP_SCALE = PROP_VISUAL_SCALE / WORLD_SCALE;
const LOCAL_CHARACTER_SCALE = CHARACTER_VISUAL_SCALE / WORLD_SCALE;
const LOCAL_MONSTER_SCALE = MONSTER_VISUAL_SCALE / WORLD_SCALE;
const LOCAL_BUILDING_SCALE = BUILDING_VISUAL_SCALE / WORLD_SCALE;

function round(value) {
  return Number(value.toFixed(2));
}

function easeOutCubic(value) {
  return 1 - (1 - value) ** 3;
}

function easeOutBack(value) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * (value - 1) ** 3 + c1 * (value - 1) ** 2;
}

function spreadScenePosition(x, z, factor = SCENE_POSITION_SPREAD) {
  return [round(x * factor), round(z * factor)];
}

function getIslandHeight(x, z) {
  const waveA = (Math.sin(x * 0.8) + 1) * TERRAIN_WAVE_A;
  const waveB = (Math.cos(z * 0.75) + 1) * TERRAIN_WAVE_B;
  const checker = (x + z) % 2 === 0 ? TERRAIN_CHECKER : 0;
  return round(waveA + waveB + checker);
}

function getGrassShade(x, z) {
  const variation = Math.sin(x * 0.55 + z * 0.25) + Math.cos(z * 0.48 - x * 0.18) * 0.7;
  const normalized = THREE.MathUtils.clamp((variation + 1.7) / 3.4, 0, 0.999);
  return COLORS.grass[Math.floor(normalized * COLORS.grass.length)];
}

function disposeObject(object) {
  object.traverse((child) => {
    if ('geometry' in child && child.geometry && !child.geometry.userData?.shared) {
      child.geometry.dispose();
    }

    if ('material' in child && child.material) {
      if (Array.isArray(child.material)) {
        child.material.forEach((material) => {
          if (!material.userData?.shared) {
            material.dispose();
          }
        });
      } else {
        if (!child.material.userData?.shared) {
          child.material.dispose();
        }
      }
    }
  });
}

function clearGroup(group) {
  while (group.children.length) {
    const child = group.children[group.children.length - 1];
    group.remove(child);
    disposeObject(child);
  }
}

function scaleSceneProp(object, scale = LOCAL_PROP_SCALE) {
  object.scale.multiplyScalar(scale);
  return object;
}

function scaleSceneBuilding(object, scale = LOCAL_BUILDING_SCALE) {
  object.scale.multiplyScalar(scale);
  object.position.y += STRUCTURE_GROUND_OFFSET;
  return object;
}

function createQuestionBlock() {
  const group = new THREE.Group();
  group.add(createVoxel(0, 0.45, 0, '#facc15', 0.9));
  group.add(createVoxel(0, 1.05, 0, '#f59e0b', 0.3));
  group.add(createVoxel(0, 0.65, 0.48, '#111827', 0.14));
  group.add(createVoxel(0, 0.95, 0.48, '#111827', 0.14));
  group.add(createVoxel(0, 1.2, 0.48, '#111827', 0.14));
  group.add(createVoxel(0, 0.35, 0.48, '#111827', 0.14));
  return group;
}

function createGoldPile(amount) {
  const pile = new THREE.Group();
  const blockCount = Math.min(10, Math.max(3, Math.ceil(amount / 1250) + 2));

  for (let index = 0; index < blockCount; index += 1) {
    const ring = Math.floor(index / 4);
    const angle = (index / Math.max(blockCount, 1)) * Math.PI * 2;
    const radius = 0.35 + ring * 0.18;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius;
    const y = 0.18 + ring * 0.18;
    pile.add(createVoxel(x, y, z, '#fbbf24', 0.34));
  }

  pile.position.set(
    ISLAND_SCENE_CONFIG.placement.treasury[0],
    0,
    ISLAND_SCENE_CONFIG.placement.treasury[1],
  );
  return pile;
}

function createFlowerPatch(x, z, colors) {
  const patch = new THREE.Group();
  colors.forEach((color, index) => {
    const offset = index * 0.22;
    patch.add(createVoxel(offset - 0.25, 0.1, 0, '#166534', 0.12));
    patch.add(createVoxel(offset - 0.25, 0.28, 0, color, 0.2));
  });
  patch.position.set(x, 0, z);
  return patch;
}

function createPathSegment(x, z) {
  return createVoxel(x, -0.02, z, '#d6b37b', 0.38);
}

function createWell(x, z) {
  const group = new THREE.Group();
  group.add(createVoxel(0, 0.2, 0, '#94a3b8', 0.7));
  group.add(createVoxel(0, 0.55, 0, '#38bdf8', 0.35));
  group.add(createVoxel(-0.32, 0.7, 0, '#92400e', 0.12));
  group.add(createVoxel(0.32, 0.7, 0, '#92400e', 0.12));
  group.add(createVoxel(0, 1.02, 0, '#92400e', 0.5));
  group.position.set(x, 0, z);
  return group;
}

function createFenceLine(x, z, count, rotate = false) {
  const group = new THREE.Group();
  for (let index = 0; index < count; index += 1) {
    const post = createVoxel(0, 0.2, 0, '#92400e', 0.12);
    const rail = createVoxel(0, 0.28, 0, '#b45309', 0.16);
    const offset = index * 0.34;
    if (rotate) {
      post.position.z += offset;
      rail.scale.set(1, 0.8, 1.8);
      rail.position.z += offset;
    } else {
      post.position.x += offset;
      rail.scale.set(1.8, 0.8, 1);
      rail.position.x += offset;
    }
    group.add(post, rail);
  }
  group.position.set(x, 0, z);
  return group;
}

function createPond(x, z) {
  const pond = new THREE.Group();
  for (let ix = 0; ix < 3; ix += 1) {
    for (let iz = 0; iz < 2; iz += 1) {
      pond.add(createVoxel(ix * 0.36, 0.02, iz * 0.36, '#38bdf8', 0.34));
    }
  }
  pond.position.set(x, 0, z);
  return pond;
}

function createBridge(x, z) {
  const bridge = new THREE.Group();
  for (let index = 0; index < 4; index += 1) {
    bridge.add(createVoxel(index * 0.32, 0.08, 0, '#8b5e34', 0.28));
  }
  bridge.position.set(x, 0, z);
  return bridge;
}

function createFlag(x, z, color) {
  const group = new THREE.Group();
  group.add(createVoxel(0, 0.8, 0, '#92400e', 0.12));
  group.add(createVoxel(0.26, 1.1, 0, color, 0.3));
  group.position.set(x, 0, z);
  return group;
}

function createCloud(x, z) {
  const cloud = new THREE.Group();
  cloud.add(createVoxel(0, 4.6, 0, '#f8fafc', 0.42));
  cloud.add(createVoxel(0.34, 4.75, 0, '#f8fafc', 0.34));
  cloud.add(createVoxel(-0.32, 4.72, 0, '#f8fafc', 0.3));
  cloud.position.set(x, 0, z);
  return cloud;
}

function createFountain(x, z) {
  const group = new THREE.Group();
  group.add(createVoxel(0, 0.15, 0, '#94a3b8', 0.85));
  group.add(createVoxel(0, 0.55, 0, '#38bdf8', 0.22));
  group.add(createVoxel(0, 0.85, 0, '#38bdf8', 0.16));
  group.position.set(x, 0, z);
  return group;
}

function createMonsterSigil(color) {
  const group = new THREE.Group();
  const sigilMaterial = getSharedMaterial(color, {
    emissive: new THREE.Color(color),
    emissiveIntensity: 0.58,
    roughness: 0.36,
    metalness: 0.12,
  });
  const core = new THREE.Mesh(getSharedBoxGeometry(0.46, 0.46, 0.46), sigilMaterial);
  core.position.set(0, 2.62, 0);
  core.castShadow = false;
  core.receiveShadow = false;
  const sparkLeft = new THREE.Mesh(getSharedBoxGeometry(0.18, 0.18, 0.18), sigilMaterial);
  sparkLeft.position.set(-0.38, 2.3, 0);
  sparkLeft.castShadow = false;
  sparkLeft.receiveShadow = false;
  const sparkRight = sparkLeft.clone();
  sparkRight.position.x = 0.38;
  const beacon = new THREE.Mesh(
    getSharedBoxGeometry(0.6, 0.12, 0.6),
    getSharedMaterial('#0b1120', {
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.18,
      roughness: 0.5,
      metalness: 0.08,
    }),
  );
  beacon.position.set(0, 0.12, 0);
  beacon.castShadow = false;
  beacon.receiveShadow = false;
  group.add(core, sparkLeft, sparkRight, beacon);
  return group;
}

function createLandscapePlateau() {
  const topMaterial = getSharedMaterial(COLORS.grass[1], {
    roughness: 0.96,
    metalness: 0,
  });
  const sideMaterial = getSharedMaterial('#5b4527', {
    roughness: 0.92,
    metalness: 0.02,
  });
  const plateau = new THREE.Mesh(
    getSharedBoxGeometry(LANDSCAPE_PLATEAU_SIZE, LANDSCAPE_PLATEAU_HEIGHT, LANDSCAPE_PLATEAU_SIZE),
    [
      sideMaterial,
      sideMaterial,
      topMaterial,
      sideMaterial,
      sideMaterial,
      sideMaterial,
    ],
  );
  plateau.position.set(0, LANDSCAPE_PLATEAU_Y, 0);
  plateau.castShadow = false;
  plateau.receiveShadow = true;
  return plateau;
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Capture failed.'));
        return;
      }

      resolve(blob);
    }, 'image/png');
  });
}

function getMonsterSize(amount) {
  if (amount < 100) {
    return 'small';
  }

  if (amount <= 500) {
    return 'medium';
  }

  return 'large';
}

function getMonsterLayout(bills) {
  const { startAngle, endAngle, xRadius, zRadius, zOffset } = ISLAND_SCENE_CONFIG.placement.monsterArc;

  return bills.map((bill, index) => {
    const ratio = bills.length === 1 ? 0.5 : index / (bills.length - 1);
    const angle = startAngle + (endAngle - startAngle) * ratio;

    return {
      bill,
      position: new THREE.Vector3(
        Math.cos(angle) * xRadius,
        MONSTER_GROUND_OFFSET,
        Math.sin(angle) * zRadius + zOffset,
      ),
    };
  });
}

function createHeroForTier(armorTierKey) {
  const tier = getHeroTierByKey(armorTierKey);
  const hero = createCharacter(0, 0, tier.armorColor, tier.hasShield);

  const swordGem = createVoxel(0.58, 1.18, 0, tier.swordColor, 0.18);
  hero.add(swordGem);

  if (tier.capeColor) {
    const cape = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.95, 0.65),
      new THREE.MeshStandardMaterial({
        color: tier.capeColor,
        roughness: 0.7,
        metalness: 0.08,
      }),
    );
    cape.position.set(0, 0.95, -0.34);
    cape.castShadow = true;
    cape.receiveShadow = true;
    hero.add(cape);
  }

  if (tier.wings) {
    hero.add(createVoxel(-0.72, 1.2, -0.2, '#f8fafc', 0.28));
    hero.add(createVoxel(-0.94, 1.42, -0.25, '#e0f2fe', 0.22));
    hero.add(createVoxel(0.72, 1.2, -0.2, '#f8fafc', 0.28));
    hero.add(createVoxel(0.94, 1.42, -0.25, '#e0f2fe', 0.22));
  }

  return hero;
}

function createStageGroup(stage) {
  const group = new THREE.Group();

  if (stage === 1) {
    const [treeA1, treeA2] = spreadScenePosition(-3.1, -0.3);
    const [treeB1, treeB2] = spreadScenePosition(-2.4, 2.1);
    const [flowerX, flowerZ] = spreadScenePosition(-1.4, -2.3);
    group.add(scaleSceneProp(createTree(treeA1, treeA2, 'oak')));
    group.add(scaleSceneProp(createTree(treeB1, treeB2, 'pine')));
    group.add(scaleSceneProp(createFlowerPatch(flowerX, flowerZ, ['#f472b6', '#fde047', '#60a5fa'])));
  }

  if (stage === 2) {
    const [buildingX, buildingZ] = spreadScenePosition(-1.65, -1.15);
    const [pathAX, pathAZ] = spreadScenePosition(-0.3, -0.3);
    const [pathBX, pathBZ] = spreadScenePosition(-0.65, -0.62);
    const [pathCX, pathCZ] = spreadScenePosition(-1, -0.92);
    group.add(scaleSceneBuilding(createBuilding(buildingX, buildingZ, 2, 1, 2, '#d6c39c')));
    group.add(scaleSceneProp(createPathSegment(pathAX, pathAZ)));
    group.add(scaleSceneProp(createPathSegment(pathBX, pathBZ)));
    group.add(scaleSceneProp(createPathSegment(pathCX, pathCZ)));
  }

  if (stage === 3) {
    const [buildingX, buildingZ] = spreadScenePosition(1.85, -1.05);
    const [wellX, wellZ] = spreadScenePosition(0.15, -1.9);
    const [flowerX, flowerZ] = spreadScenePosition(2.7, -0.4);
    group.add(scaleSceneBuilding(createBuilding(buildingX, buildingZ, 2, 2, 2, '#ddd6fe')));
    group.add(scaleSceneProp(createWell(wellX, wellZ)));
    group.add(scaleSceneProp(createFlowerPatch(flowerX, flowerZ, ['#fb7185', '#facc15', '#86efac'])));
  }

  if (stage === 4) {
    const [buildingX, buildingZ] = spreadScenePosition(-2.45, 1.6);
    const [fenceX, fenceZ] = spreadScenePosition(-3.15, 0.8);
    const [pondX, pondZ] = spreadScenePosition(1.7, 1.8);
    group.add(scaleSceneBuilding(createBuilding(buildingX, buildingZ, 2, 2, 2, '#94a3b8')));
    group.add(scaleSceneProp(createFenceLine(fenceX, fenceZ, 4, true)));
    group.add(scaleSceneProp(createFenceLine(fenceX, fenceZ, 4, false)));
    group.add(scaleSceneProp(createPond(pondX, pondZ)));
  }

  if (stage === 5) {
    const [buildingAX, buildingAZ] = spreadScenePosition(0.05, -2.7);
    const [buildingBX, buildingBZ] = spreadScenePosition(1.65, -2.55);
    const [bridgeX, bridgeZ] = spreadScenePosition(-0.6, -2.9);
    const [flagX, flagZ] = spreadScenePosition(1.55, -3.05);
    group.add(scaleSceneBuilding(createBuilding(buildingAX, buildingAZ, 2, 4, 2, '#cbd5e1')));
    group.add(scaleSceneBuilding(createBuilding(buildingBX, buildingBZ, 1, 2, 1, '#94a3b8')));
    group.add(scaleSceneProp(createBridge(bridgeX, bridgeZ)));
    group.add(scaleSceneProp(createFlag(flagX, flagZ, '#fbbf24')));
  }

  if (stage === 6) {
    const [buildingX, buildingZ] = spreadScenePosition(2.45, 2.2);
    const [fountainX, fountainZ] = spreadScenePosition(-0.95, 2.35);
    const [cloudAX, cloudAZ] = spreadScenePosition(-1.8, -0.5);
    const [cloudBX, cloudBZ] = spreadScenePosition(2.1, 1.1);
    const [flagX, flagZ] = spreadScenePosition(2.9, 2.6);
    group.add(scaleSceneBuilding(createBuilding(buildingX, buildingZ, 2, 3, 2, '#e2e8f0')));
    group.add(scaleSceneProp(createFountain(fountainX, fountainZ)));
    group.add(scaleSceneProp(createCloud(cloudAX, cloudAZ)));
    group.add(scaleSceneProp(createCloud(cloudBX, cloudBZ)));
    group.add(scaleSceneProp(createFlag(flagX, flagZ, '#38bdf8')));
  }

  return group;
}

function createIslandBase() {
  const island = new THREE.Group();
  let voxelCount = 0;
  const terrainEntriesByShade = new Map(COLORS.grass.map((color) => [color, []]));
  const underEntries = [];
  const matrixDummy = new THREE.Object3D();

  for (let x = 0; x < ISLAND_GRID_SIZE; x += 1) {
    for (let z = 0; z < ISLAND_GRID_SIZE; z += 1) {
      const height = getIslandHeight(x, z);
      const worldX = x - (ISLAND_GRID_SIZE - 1) / 2;
      const worldZ = z - (ISLAND_GRID_SIZE - 1) / 2;
      const grassShade = getGrassShade(x, z);
      terrainEntriesByShade.get(grassShade).push({
        x: worldX,
        y: height + TOP_TERRAIN_Y_OFFSET,
        z: worldZ,
      });
      underEntries.push({
        x: worldX,
        y: UNDER_TERRAIN_Y_OFFSET,
        z: worldZ,
      });
      voxelCount += 2;
    }
  }

  COLORS.grass.forEach((grassShade) => {
    const entries = terrainEntriesByShade.get(grassShade) ?? [];
    if (!entries.length) {
      return;
    }

    const mesh = new THREE.InstancedMesh(
      getSharedBoxGeometry(TOP_TERRAIN_TILE_SIZE, TOP_TERRAIN_TILE_SIZE, TOP_TERRAIN_TILE_SIZE),
      getSharedMaterial(grassShade, {
        roughness: 0.96,
        metalness: 0,
      }),
      entries.length,
    );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    entries.forEach((entry, index) => {
      matrixDummy.position.set(entry.x, entry.y, entry.z);
      matrixDummy.scale.set(1, TOP_TERRAIN_TILE_HEIGHT_SCALE, 1);
      matrixDummy.updateMatrix();
      mesh.setMatrixAt(index, matrixDummy.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
    island.add(mesh);
  });

  const underMesh = new THREE.InstancedMesh(
    getSharedBoxGeometry(UNDER_TERRAIN_TILE_SIZE, UNDER_TERRAIN_TILE_SIZE, UNDER_TERRAIN_TILE_SIZE),
    getSharedMaterial('#4b3621', {
      roughness: 0.98,
      metalness: 0,
    }),
    underEntries.length,
  );
  underMesh.castShadow = false;
  underMesh.receiveShadow = true;

  underEntries.forEach((entry, index) => {
    matrixDummy.position.set(entry.x, entry.y, entry.z);
    matrixDummy.scale.set(1, 1, 1);
    matrixDummy.updateMatrix();
    underMesh.setMatrixAt(index, matrixDummy.matrix);
  });

  underMesh.instanceMatrix.needsUpdate = true;
  island.add(underMesh);

  const water = new THREE.Mesh(
    getSharedBoxGeometry(WATER_SIZE, 0.35, WATER_SIZE),
    new THREE.MeshPhongMaterial({
      color: COLORS.water,
      transparent: true,
      opacity: 0.55,
      shininess: 90,
    }),
  );
  water.position.set(0, -1.7, 0);
  water.castShadow = false;
  water.receiveShadow = true;
  island.add(water);
  island.add(createLandscapePlateau());

  ISLAND_SCENE_CONFIG.placement.baseDecor.trees.forEach(([x, z, style]) => {
    const [spreadX, spreadZ] = spreadScenePosition(x, z);
    island.add(scaleSceneProp(createTree(spreadX, spreadZ, style)));
  });
  const [rocksX, rocksZ, rocksCount] = ISLAND_SCENE_CONFIG.placement.baseDecor.rocks;
  const [spreadRocksX, spreadRocksZ] = spreadScenePosition(rocksX, rocksZ);
  island.add(scaleSceneProp(createRocks(spreadRocksX, spreadRocksZ, rocksCount)));

  // Lighthouse — always present, the kingdom's landmark (uses building scale, tallest structure)
  const [lhX, lhZ] = spreadScenePosition(LIGHTHOUSE_CONFIG.position.x, LIGHTHOUSE_CONFIG.position.z);
  const lighthouse = createLighthouse(lhX, lhZ, LIGHTHOUSE_CONFIG);
  lighthouse.scale.setScalar(LOCAL_BUILDING_SCALE);
  lighthouse.position.y = STRUCTURE_GROUND_OFFSET;
  island.add(lighthouse);

  return {
    island,
    summary: {
      gridSize: ISLAND_GRID_SIZE,
      worldScale: WORLD_SCALE,
      terrainTileSize: round(TOP_TERRAIN_TILE_SIZE * WORLD_SCALE),
      propVisualScale: round(PROP_VISUAL_SCALE),
      characterVisualScale: round(CHARACTER_VISUAL_SCALE),
      monsterVisualScale: round(MONSTER_VISUAL_SCALE),
      buildingVisualScale: round(BUILDING_VISUAL_SCALE),
      terrainTileHeightScale: round(TOP_TERRAIN_TILE_HEIGHT_SCALE),
      placementSpread: round(SCENE_POSITION_SPREAD),
      heroGroundOffset: round(HERO_GROUND_OFFSET),
      monsterGroundOffset: round(MONSTER_GROUND_OFFSET),
      terrainVoxels: voxelCount,
      decorations: ['trees', 'rocks'],
      landscapeFilled: true,
      water: true,
    },
  };
}

function createRuntimeState() {
  return {
    renderer: null,
    scene: null,
    camera: null,
    controls: null,
    summary: null,
    roots: {
      treasury: null,
      identity: null,
      growth: null,
      monsters: null,
      hero: null,
      particles: null,
      companion: null,
      decorations: null,
    },
    heroGroup: null,
    companionGroup: null,
    companionStateId: null,
    monsterEntries: new Map(),
    particleEntries: [],
    animations: [],
    lastFrameTime: null,
    currentStage: 0,
    destroyed: false,
    performance: {
      fpsEstimate: 0,
      avgFrameMs: 0,
      frameSamples: [],
    },
  };
}

function updatePerformanceEstimate(runtime, deltaMs) {
  const samples = runtime.performance.frameSamples;
  samples.push(deltaMs);

  if (samples.length > 45) {
    samples.shift();
  }

  const total = samples.reduce((sum, sample) => sum + sample, 0);
  const avgFrameMs = total / Math.max(samples.length, 1);
  runtime.performance.avgFrameMs = round(avgFrameMs);
  runtime.performance.fpsEstimate = round(1000 / Math.max(avgFrameMs, 1));
}

function projectWorldPoint(runtime, point) {
  if (!runtime.camera || !runtime.renderer) {
    return null;
  }

  const projected = point.clone().project(runtime.camera);

  return {
    ndc: projected.toArray().map(round),
    screen: [
      round(((projected.x + 1) / 2) * runtime.renderer.domElement.width),
      round(((1 - projected.y) / 2) * runtime.renderer.domElement.height),
    ],
    inFront: projected.z >= -1 && projected.z <= 1,
  };
}

function collectSceneMetrics(runtime) {
  const scene = runtime.scene;
  const renderer = runtime.renderer;

  if (!scene || !renderer) {
    return null;
  }

  let meshCount = 0;
  let instancedMeshCount = 0;
  let shadowCasterCount = 0;

  scene.traverse((child) => {
    if (child instanceof THREE.InstancedMesh) {
      meshCount += child.count;
      instancedMeshCount += 1;
      if (child.castShadow) {
        shadowCasterCount += child.count;
      }
      return;
    }

    if (child instanceof THREE.Mesh) {
      meshCount += 1;
      if (child.castShadow) {
        shadowCasterCount += 1;
      }
    }
  });

  return {
    fpsEstimate: runtime.performance.fpsEstimate,
    avgFrameMs: runtime.performance.avgFrameMs,
    drawCalls: renderer.info.render.calls,
    triangles: renderer.info.render.triangles,
    points: renderer.info.render.points,
    lines: renderer.info.render.lines,
    geometries: renderer.info.memory.geometries,
    textures: renderer.info.memory.textures,
    meshCount,
    instancedMeshCount,
    shadowCasterCount,
    pixelRatio: round(renderer.getPixelRatio()),
    currentStage: runtime.currentStage,
    rootChildCounts: {
      treasury: runtime.roots.treasury?.children.length ?? 0,
      identity: runtime.roots.identity?.children.length ?? 0,
      growth: runtime.roots.growth?.children.length ?? 0,
      monsters: runtime.roots.monsters?.children.length ?? 0,
      hero: runtime.roots.hero?.children.length ?? 0,
      particles: runtime.roots.particles?.children.length ?? 0,
    },
    rootTransforms: Object.fromEntries(
      Object.entries(runtime.roots).map(([key, group]) => [
        key,
        group
          ? {
              visible: group.visible,
              position: group.position.toArray().map(round),
              scale: group.scale.toArray().map(round),
            }
          : null,
      ]),
    ),
    growthScales: runtime.roots.growth?.children.map((child, index) => ({
      index,
      scale: child.scale.toArray().map(round),
      position: child.position.toArray().map(round),
    })) ?? [],
    monsters: [...runtime.monsterEntries.entries()].map(([id, entry]) => ({
      materialColor:
        entry.group.children[0]?.children
          ?.find((child) => 'material' in child && child.material)
          ?.material?.color
          ?.getHexString?.() ?? null,
      id,
      category: entry.bill.category,
      amount: entry.bill.amount,
      visible: entry.group.visible,
      basePosition: entry.basePosition.toArray().map(round),
      position: entry.group.position.toArray().map(round),
      scale: entry.group.scale.toArray().map(round),
      projected: projectWorldPoint(
        runtime,
        entry.group.getWorldPosition(new THREE.Vector3()).clone(),
      ),
      childCount: entry.group.children[0]?.children?.length ?? entry.group.children.length,
      sampleChildPositions:
        entry.group.children[0]?.children?.slice(0, 3).map((child) => child.position.toArray().map(round)) ?? [],
      sampleChildBasePositions:
        entry.group.children[0]?.children
          ?.slice(0, 3)
          .map((child) => child.userData?.basePosition?.toArray?.().map(round) ?? null) ?? [],
      materialOpacity:
        entry.group.children[0]?.children?.find((child) => 'material' in child && child.material)?.material?.opacity ?? null,
      materialTransparent:
        entry.group.children[0]?.children?.find((child) => 'material' in child && child.material)?.material?.transparent ?? null,
    })),
  };
}

function queueAnimation(runtime, config) {
  const duration = Math.max(1, config.duration ?? 1);

  return new Promise((resolve) => {
    runtime.animations.push({
      duration,
      delay: config.delay ?? 0,
      easing: config.easing ?? ((value) => value),
      onUpdate: config.onUpdate ?? (() => {}),
      onComplete: config.onComplete ?? (() => {}),
      resolve,
      elapsed: 0,
      completed: false,
    });
  });
}

function setGroupYPosition(group, nextY, fallbackY = 0) {
  group.position.y = Number.isFinite(nextY) ? nextY : fallbackY;
}

async function wait(runtime, duration) {
  await queueAnimation(runtime, {
    duration,
  });
}

function stepParticles(runtime, deltaSeconds) {
  runtime.particleEntries = runtime.particleEntries.filter((particle) => {
    particle.life -= deltaSeconds;

    if (particle.life <= 0) {
      runtime.roots.particles.remove(particle.mesh);
      disposeObject(particle.mesh);
      return false;
    }

    particle.velocity.y -= 4.8 * deltaSeconds;
    particle.mesh.position.addScaledVector(particle.velocity, deltaSeconds);
    particle.mesh.rotation.x += 4 * deltaSeconds;
    particle.mesh.rotation.y += 3 * deltaSeconds;
    return true;
  });
}

function stepAnimations(runtime, deltaMs) {
  runtime.animations = runtime.animations.filter((animation) => {
    animation.elapsed += deltaMs;

    if (animation.elapsed < animation.delay) {
      return true;
    }

    const progress = Math.min(1, (animation.elapsed - animation.delay) / animation.duration);
    animation.onUpdate(animation.easing(progress));

    if (progress >= 1 && !animation.completed) {
      animation.completed = true;
      animation.onComplete();
      animation.resolve();
      return false;
    }

    return true;
  });

  stepParticles(runtime, deltaMs / 1000);
}

function rebuildTreasury(runtime, state) {
  clearGroup(runtime.roots.treasury);

  if (!state.income && state.activeBills.length === 0) {
    runtime.roots.treasury.add(scaleSceneProp(createQuestionBlock()));
    return;
  }

  if (state.income > 0) {
    runtime.roots.treasury.add(scaleSceneProp(createGoldPile(state.income)));
  }
}

function rebuildIdentity(runtime, state) {
  clearGroup(runtime.roots.identity);
  runtime.roots.identity.add(scaleSceneProp(createFlag(...ISLAND_SCENE_CONFIG.placement.banner, state.bannerColorHex)));
}

function rebuildMonsters(runtime, bills) {
  clearGroup(runtime.roots.monsters);
  runtime.monsterEntries = new Map();

  getMonsterLayout(bills).forEach(({ bill, position }) => {
    const color = BILL_CATEGORY_MAP[bill.category]?.color ?? BILL_CATEGORY_MAP.other.color;
    const monster = scaleSceneProp(createMonster(0, 0, color, getMonsterSize(bill.amount), bill.category), LOCAL_MONSTER_SCALE);
    monster.add(createMonsterSigil(color));
    monster.position.copy(position);
    runtime.roots.monsters.add(monster);
    runtime.monsterEntries.set(bill.id, {
      bill,
      group: monster,
      basePosition: position.clone(),
    });
  });
}

function rebuildHero(runtime, state) {
  clearGroup(runtime.roots.hero);
  runtime.heroGroup = null;

  if (!state.heroVisible) {
    return;
  }

  const hero = createHeroForTier(state.armorTier);
  hero.scale.setScalar(LOCAL_CHARACTER_SCALE);
  hero.position.set(state.heroPosition.x, state.heroPosition.y + HERO_GROUND_OFFSET, state.heroPosition.z);
  runtime.roots.hero.add(hero);
  runtime.heroGroup = hero;
}

function rebuildCompanion(runtime, stateId) {
  clearGroup(runtime.roots.companion);
  runtime.companionGroup = null;
  runtime.companionStateId = null;

  if (!stateId) return;

  const [cx, cz] = spreadScenePosition(COMPANION_CONFIG.position.x, COMPANION_CONFIG.position.z);
  const companion = createCompanion(0, 0, stateId);
  companion.scale.setScalar(LOCAL_CHARACTER_SCALE);
  companion.position.set(cx, HERO_GROUND_OFFSET, cz);
  runtime.roots.companion.add(companion);
  runtime.companionGroup = companion;
  runtime.companionStateId = stateId;
}

function rebuildDecorations(runtime, decorations) {
  clearGroup(runtime.roots.decorations);

  if (!decorations || decorations.length === 0) return;

  decorations.forEach((deco) => {
    const slot = getSlot(deco.placement);
    if (!slot) return;

    const [sx, sz] = spreadScenePosition(slot.x, slot.z);
    const mesh = buildAsset(deco.artifact, 0, 0);
    if (!mesh) return;

    mesh.scale.setScalar(LOCAL_PROP_SCALE);
    mesh.position.set(sx, STRUCTURE_GROUND_OFFSET, sz);
    runtime.roots.decorations.add(mesh);
  });
}

function syncIslandGrowth(runtime, islandStage) {
  if (runtime.currentStage > islandStage) {
    clearGroup(runtime.roots.growth);
    runtime.currentStage = 0;
  }

  for (let stage = runtime.currentStage + 1; stage <= islandStage; stage += 1) {
    const stageGroup = createStageGroup(stage);
    stageGroup.scale.setScalar(runtime.currentStage === 0 ? 1 : 0.01);
    runtime.roots.growth.add(stageGroup);

    if (runtime.currentStage !== 0 || stage > 1) {
      queueAnimation(runtime, {
        duration: 640,
        easing: easeOutBack,
        onUpdate: (progress) => {
          const value = Math.max(0.01, progress);
          stageGroup.scale.setScalar(value);
        },
      });
    }
  }

  runtime.currentStage = islandStage;
}

function rebuildIdleScene(runtime, state) {
  rebuildTreasury(runtime, state);
  rebuildIdentity(runtime, state);
  rebuildMonsters(runtime, state.activeBills);
  rebuildHero(runtime, state);
  syncIslandGrowth(runtime, state.islandStage);
  rebuildCompanion(runtime, state.companionState);
  rebuildDecorations(runtime, state.decorations);
}

function setGroupOpacity(group, opacity) {
  group.traverse((child) => {
    if (!('material' in child) || !child.material) {
      return;
    }

    const nextMaterials = (Array.isArray(child.material) ? child.material : [child.material]).map((material) => {
      if (!material.userData?.shared) {
        return material;
      }

      const clone = material.clone();
      clone.userData = {
        ...material.userData,
        shared: false,
      };
      return clone;
    });

    if (Array.isArray(child.material)) {
      child.material = nextMaterials;
    } else {
      child.material = nextMaterials[0];
    }

    nextMaterials.forEach((material) => {
      material.transparent = true;
      material.opacity = opacity;
    });
  });
}

function animateMonsterIdle(entry, index, elapsedMs) {
  const wave = Math.sin(elapsedMs * 0.003 + index * 0.7);
  const safeWave = Number.isFinite(wave) ? wave : 0;
  const absWave = Math.abs(safeWave);
  const meta = entry.group.userData.monsterMeta ?? {};
  const parts = meta.parts ?? {};
  const baseY = Number.isFinite(entry.basePosition.y) ? entry.basePosition.y : MONSTER_GROUND_OFFSET;
  setGroupYPosition(entry.group, baseY, MONSTER_GROUND_OFFSET);
  entry.group.rotation.y = 0;

  if (meta.category === 'housing') {
    setGroupYPosition(entry.group, baseY + Math.max(0, safeWave) * 0.012, baseY);
    entry.group.rotation.y = Math.sin(elapsedMs * 0.0014 + index) * 0.04;
    if (parts.head?.userData.basePosition) {
      parts.head.position.y = parts.head.userData.basePosition.y + absWave * 0.04;
    }
    if (parts.armLeft?.userData.baseRotation) {
      parts.armLeft.rotation.z = parts.armLeft.userData.baseRotation.z + safeWave * 0.08;
    }
    if (parts.armRight?.userData.baseRotation) {
      parts.armRight.rotation.z = parts.armRight.userData.baseRotation.z - safeWave * 0.08;
    }
    return;
  }

  if (meta.category === 'utilities') {
    setGroupYPosition(entry.group, baseY + safeWave * 0.035, baseY);
    entry.group.rotation.y = Math.sin(elapsedMs * 0.0022 + index) * 0.14;
    ['sparkLeft', 'sparkRight', 'sparkTop'].forEach((key, sparkIndex) => {
      const spark = parts[key];
      if (!spark?.userData.baseScale) {
        return;
      }
      const pulse = 1 + Math.abs(Math.sin(elapsedMs * 0.007 + sparkIndex)) * 0.5;
      spark.scale.copy(spark.userData.baseScale).multiplyScalar(pulse);
    });
    return;
  }

  if (meta.category === 'phone') {
    setGroupYPosition(entry.group, baseY + safeWave * 0.02, baseY);
    entry.group.rotation.y = elapsedMs * 0.0012 + index * 0.45;
    if (parts.iris?.userData.basePosition) {
      parts.iris.position.x = parts.iris.userData.basePosition.x + Math.sin(elapsedMs * 0.0042) * 0.06;
    }
    if (parts.antennaTip?.userData.basePosition) {
      parts.antennaTip.position.y = parts.antennaTip.userData.basePosition.y + absWave * 0.08;
    }
    return;
  }

  if (meta.category === 'transport') {
    setGroupYPosition(entry.group, baseY + Math.max(0, safeWave) * 0.015, baseY);
    entry.group.rotation.y = Math.sin(elapsedMs * 0.0018 + index) * 0.08;
    (parts.legs ?? []).forEach((leg, legIndex) => {
      if (!leg?.userData.baseRotation) {
        return;
      }
      leg.rotation.z = leg.userData.baseRotation.z + Math.sin(elapsedMs * 0.006 + legIndex) * 0.18;
    });
    return;
  }

  if (meta.category === 'food') {
    setGroupYPosition(entry.group, baseY + safeWave * 0.02, baseY);
    if (parts.blob?.userData.baseScale) {
      parts.blob.scale.y = parts.blob.userData.baseScale.y - absWave * 0.14;
      parts.blob.scale.x = parts.blob.userData.baseScale.x + absWave * 0.08;
      parts.blob.scale.z = parts.blob.userData.baseScale.z + absWave * 0.08;
    }
    if (parts.blobTop?.userData.basePosition) {
      parts.blobTop.position.y = parts.blobTop.userData.basePosition.y + absWave * 0.06;
    }
    return;
  }

  if (meta.category === 'insurance') {
    setGroupYPosition(entry.group, baseY + safeWave * 0.025, baseY);
    entry.group.rotation.y = Math.sin(elapsedMs * 0.0015 + index) * 0.06;
    ['tailLeft', 'tailCenter', 'tailRight'].forEach((key, tailIndex) => {
      const tail = parts[key];
      if (!tail?.userData.basePosition) {
        return;
      }
      tail.position.y = tail.userData.basePosition.y + Math.sin(elapsedMs * 0.005 + tailIndex) * 0.06;
    });
    return;
  }

  if (meta.category === 'entertainment') {
    setGroupYPosition(entry.group, baseY + Math.max(0, safeWave) * 0.035, baseY);
    entry.group.rotation.y = Math.sin(elapsedMs * 0.0032 + index) * 0.24;
    ['hornLeft', 'hornRight'].forEach((key, hornIndex) => {
      const horn = parts[key];
      if (!horn?.userData.baseRotation) {
        return;
      }
      horn.rotation.z = horn.userData.baseRotation.z + Math.sin(elapsedMs * 0.008 + hornIndex) * 0.2;
    });
    return;
  }

  setGroupYPosition(entry.group, baseY + safeWave * 0.025, baseY);
  entry.group.rotation.y = Math.sin(elapsedMs * 0.0016 + index) * 0.1;
  ['earLeft', 'earRight'].forEach((key, earIndex) => {
    const ear = parts[key];
    if (!ear?.userData.baseRotation) {
      return;
    }
    ear.rotation.z = ear.userData.baseRotation.z + Math.sin(elapsedMs * 0.007 + earIndex) * 0.12;
  });
}

function updateIdleMotion(runtime, state, elapsedMs) {
  const safeElapsedMs = Number.isFinite(elapsedMs) ? elapsedMs : 0;

  if (state.battleAnimating) {
    return;
  }

  if (state.heroVisible && runtime.heroGroup) {
    runtime.heroGroup.position.y =
      state.heroPosition.y + HERO_GROUND_OFFSET + Math.sin(safeElapsedMs * 0.0032) * 0.018;
    runtime.heroGroup.rotation.y = Math.sin(safeElapsedMs * 0.0018) * 0.08;
  }

  let monsterIndex = 0;
  runtime.monsterEntries.forEach((entry) => {
    const currentIndex = monsterIndex;
    monsterIndex += 1;
    animateMonsterIdle(entry, currentIndex, safeElapsedMs);
  });

  // Companion idle animation
  if (runtime.companionGroup && runtime.companionStateId) {
    animateCompanionIdle(runtime.companionGroup, runtime.companionStateId, safeElapsedMs);
  }
}

function createParticleCube(color, size) {
  const particle = new THREE.Mesh(
    getSharedBoxGeometry(size, size, size),
    getSharedMaterial(color, {
      roughness: 0.4,
      metalness: 0.2,
      emissive: color,
      emissiveIntensity: 0.18,
    }),
  );
  particle.castShadow = false;
  particle.receiveShadow = false;
  return particle;
}

function spawnBurst(runtime, position, color, count = 12, size = 0.14) {
  for (let index = 0; index < count; index += 1) {
    const particle = createParticleCube(color, size + Math.random() * 0.05);
    particle.position.copy(position);
    runtime.roots.particles.add(particle);
    runtime.particleEntries.push({
      mesh: particle,
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 2.4 + 0.8,
        (Math.random() - 0.5) * 2,
      ),
      life: 0.55 + Math.random() * 0.4,
    });
  }
}

async function runMonsterDefeatAnimation(runtime, entry) {
  const { bill, group, basePosition } = entry;
  const category = bill.category;

  if (category === 'housing') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.45, 0)), '#7c2d12', 12, 0.15);
    await queueAnimation(runtime, {
      duration: 260,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        group.scale.y = Math.max(0.08, 1 - progress * 0.9);
        group.scale.x = 1 + progress * 0.18;
        group.scale.z = 1 + progress * 0.08;
        group.position.y = basePosition.y - progress * 0.12;
        group.rotation.z = progress * 0.35;
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  if (category === 'utilities') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.55, 0)), '#fde047', 10, 0.11);
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.4, 0)), '#38bdf8', 8, 0.08);
    await queueAnimation(runtime, {
      duration: 240,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        const flicker = Math.floor(progress * 14) % 2 === 0 ? 1 : 0.18;
        group.scale.setScalar(Math.max(0.08, 1 - progress * 0.82));
        group.position.y = basePosition.y + progress * 0.4;
        group.rotation.y = progress * 0.9;
        setGroupOpacity(group, Math.max(0.01, (1 - progress) * flicker));
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  if (category === 'phone') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.52, 0)), '#c084fc', 10, 0.1);
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.56, 0)), '#f8fafc', 4, 0.06);
    await queueAnimation(runtime, {
      duration: 250,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        group.position.y = basePosition.y + progress * 0.72;
        group.rotation.y = progress * 3.6;
        group.rotation.z = progress * 1.05;
        setGroupOpacity(group, Math.max(0.01, 1 - progress));
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  if (category === 'transport') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.48, 0)), '#fb923c', 12, 0.11);
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.2, 0)), '#7c2d12', 6, 0.08);
    await queueAnimation(runtime, {
      duration: 240,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        group.rotation.x = progress * 0.8;
        group.rotation.z = progress * 0.24;
        group.scale.y = Math.max(0.12, 1 - progress * 0.78);
        group.position.y = basePosition.y - progress * 0.04;
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  if (category === 'food') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.42, 0)), '#22c55e', 16, 0.11);
    await queueAnimation(runtime, {
      duration: 220,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        group.scale.y = Math.max(0.06, 1 - progress * 0.95);
        group.scale.x = 1 + progress * 0.25;
        group.scale.z = 1 + progress * 0.25;
        group.position.y = basePosition.y - progress * 0.15;
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  if (category === 'insurance') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.55, 0)), '#dbeafe', 10, 0.1);
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.4, 0)), '#60a5fa', 6, 0.08);
    await queueAnimation(runtime, {
      duration: 260,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        group.position.y = basePosition.y + progress * 0.9;
        group.scale.setScalar(1 - progress * 0.22);
        setGroupOpacity(group, Math.max(0.01, 1 - progress));
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  if (category === 'entertainment') {
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.5, 0)), '#f472b6', 12, 0.11);
    spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.62, 0)), '#facc15', 4, 0.07);
    await queueAnimation(runtime, {
      duration: 250,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        group.position.y = basePosition.y + Math.sin(progress * Math.PI) * 0.6;
        group.rotation.y = progress * 5;
        group.scale.setScalar(Math.max(0.08, 1 - progress * 0.84));
      },
      onComplete: () => {
        group.visible = false;
      },
    });
    return;
  }

  spawnBurst(runtime, basePosition.clone().add(new THREE.Vector3(0, 0.42, 0)), '#d1d5db', 10, 0.1);
  await queueAnimation(runtime, {
    duration: 220,
    easing: easeOutCubic,
    onUpdate: (progress) => {
      group.scale.setScalar(Math.max(0.01, 1 - progress));
      group.position.y = basePosition.y + progress * 0.75;
    },
    onComplete: () => {
      group.visible = false;
    },
  });
}

async function runPaydaySequence(runtime, sceneStateRef) {
  const gameStore = useWorldStore.getState();
  const budgetStore = useFactStore.getState();
  const state = sceneStateRef.current;
  const pendingBills = [...state.activeBills];

  gameStore.setBattleState({
    status: 'spawning',
    activeBillId: null,
    announcement: pendingBills.length ? 'Hero descends upon the island.' : 'A quiet payday settles the realm.',
    previewXp: gameStore.xp,
  });

  // Hide companion during battle (Epic 4 replaces this with transformation)
  if (runtime.roots.companion) {
    runtime.roots.companion.visible = false;
  }

  rebuildHero(runtime, {
    ...state,
    heroVisible: true,
    heroPosition: { x: HERO_CENTER.x, y: 4.8, z: HERO_CENTER.z },
  });

  const hero = runtime.heroGroup;

  if (!hero) {
    return;
  }

  hero.position.set(HERO_CENTER.x, HERO_CENTER.y + 4.8, HERO_CENTER.z);
  hero.rotation.set(0, 0, 0);

  await queueAnimation(runtime, {
    duration: 520,
    easing: easeOutBack,
    onUpdate: (progress) => {
      hero.position.set(HERO_CENTER.x, HERO_CENTER.y + 4.8 * (1 - progress), HERO_CENTER.z);
    },
  });

  spawnBurst(runtime, hero.position.clone().add(new THREE.Vector3(0, 0.2, 0)), '#f8fafc', 10, 0.1);
  soundManager.play('hero_spawn');
  await wait(runtime, 220);

  if (pendingBills.length === 0) {
    gameStore.setBattleState({
      status: 'victory',
      announcement: 'Peaceful payday complete.',
    });
    soundManager.play('victory');
    budgetStore.triggerPayday();
    const monthsCompleted = useFactStore.getState().history.length;
    gameStore.applyPaydayResults({
      xpGained: 0,
      billsSlain: 0,
      monthsCompleted,
    });
    await queueAnimation(runtime, {
      duration: 420,
      easing: easeOutBack,
      onUpdate: (progress) => {
        hero.position.y = HERO_CENTER.y + Math.sin(progress * Math.PI) * 0.45;
      },
      onComplete: () => {
        hero.position.copy(HERO_CENTER);
      },
    });
    await wait(runtime, 420);
    gameStore.resetBattle();
    if (runtime.roots.companion) runtime.roots.companion.visible = true;
    rebuildIdleScene(runtime, sceneStateRef.current);
    return;
  }

  let previewXp = gameStore.xp;

  for (const bill of pendingBills) {
    const entry = runtime.monsterEntries.get(bill.id);

    if (!entry || !entry.group.visible) {
      continue;
    }

    gameStore.setBattleState({
      status: 'fighting',
      activeBillId: bill.id,
      announcement: `Slaying ${bill.name}.`,
    });

    const startPosition = hero.position.clone();
    const targetPosition = entry.basePosition.clone().add(new THREE.Vector3(0, 0, 0.55));

    await queueAnimation(runtime, {
      duration: 460,
      easing: easeOutCubic,
      onUpdate: (progress) => {
        hero.position.lerpVectors(startPosition, targetPosition, progress);
        hero.rotation.y = progress * Math.PI * 2.2;
      },
      onComplete: () => {
        hero.rotation.y = 0;
      },
    });

    spawnBurst(runtime, entry.basePosition.clone().add(new THREE.Vector3(0, 0.6, 0)), '#ffffff', 6, 0.08);
    await runMonsterDefeatAnimation(runtime, entry);
    soundManager.play('monster_slay');

    previewXp += bill.amount;
    gameStore.setDisplayXp(previewXp);
    soundManager.play('xp_tick');
    const rewardId = `${bill.id}-${Date.now()}`;
    gameStore.pushFloatingReward({
      id: rewardId,
      text: `+$${bill.amount}`,
    });
    window.setTimeout(() => {
      useWorldStore.getState().dismissFloatingReward(rewardId);
    }, 1300);

    await wait(runtime, 160);
  }

  const totalXpGained = pendingBills.reduce((total, bill) => total + bill.amount, 0);
  const previousIslandStage = sceneStateRef.current.islandStage;

  gameStore.setBattleState({
    status: 'victory',
    activeBillId: null,
    announcement: 'PAYDAY COMPLETE',
  });

  await queueAnimation(runtime, {
    duration: 420,
    easing: easeOutCubic,
    onUpdate: (progress) => {
      hero.position.lerpVectors(hero.position.clone(), HERO_CENTER, progress);
      hero.position.y = HERO_CENTER.y + Math.sin(progress * Math.PI) * 0.55;
    },
    onComplete: () => {
      hero.position.copy(HERO_CENTER);
    },
  });

  budgetStore.triggerPayday();
  const monthsCompleted = useFactStore.getState().history.length;
  const result = gameStore.applyPaydayResults({
    xpGained: totalXpGained,
    billsSlain: pendingBills.length,
    monthsCompleted,
  });

  if (result.islandStage > previousIslandStage) {
    soundManager.play('island_grow');
  }

  soundManager.play('victory');

  if (result.leveledUp) {
    gameStore.setBattleState({
      status: 'levelup',
      announcement: `LEVEL UP! ${result.nextTier.label}`,
      pendingLevelUp: true,
    });
    soundManager.play('level_up');
    rebuildHero(runtime, {
      ...sceneStateRef.current,
      armorTier: result.nextTier.key,
      heroVisible: true,
      heroPosition: { x: HERO_CENTER.x, y: HERO_CENTER.y, z: HERO_CENTER.z },
    });
    spawnBurst(runtime, HERO_CENTER.clone().add(new THREE.Vector3(0, 1.1, 0)), '#fde047', 20, 0.1);
    await wait(runtime, 900);
  } else {
    await wait(runtime, 520);
  }

  gameStore.resetBattle();

  // Restore companion after battle
  if (runtime.roots.companion) {
    runtime.roots.companion.visible = true;
  }

  rebuildIdleScene(runtime, sceneStateRef.current);
}

export default function IslandScene() {
  const income = useFactStore((state) => state.income);
  const bills = useFactStore((state) => state.bills);
  const totalBills = useFactStore(selectTotalBills);
  const surplus = useFactStore(selectSurplus);
  const monthsCompleted = useFactStore(selectMonthsCompleted);

  const heroVisible = useWorldStore((state) => state.heroVisible);
  const heroPosition = useWorldStore((state) => state.heroPosition);
  const armorTier = useWorldStore((state) => state.armorTier);
  const islandStage = useWorldStore((state) => state.islandStage);
  const battle = useWorldStore((state) => state.battle);
  const companionState = useWorldStore((state) => state.companionState);
  const decorations = useWorldStore((state) => state.decorations);
  const kingdomName = useProfileStore((state) => state.kingdomName);
  const bannerColor = useProfileStore((state) => state.bannerColor);
  const setCaptureScene = useUiStore((state) => state.setCaptureScene);
  const bannerColorHex = KINGDOM_BANNER_MAP[bannerColor]?.color ?? KINGDOM_BANNER_MAP.gold.color;
  const bannerDarkHex = KINGDOM_BANNER_MAP[bannerColor]?.darkColor ?? KINGDOM_BANNER_MAP.gold.darkColor;

  const containerRef = useRef(null);
  const [sceneError, setSceneError] = useState('');
  const sceneStateRef = useRef({
    income,
    bills,
    activeBills: bills.filter((bill) => !bill.isPaid),
    totalBills,
    surplus,
    monthsCompleted,
    kingdomName,
    heroVisible,
    heroPosition,
    armorTier,
    islandStage,
    bannerColorHex,
    bannerDarkHex,
    battleAnimating: battle.isAnimating,
    activeBillId: battle.activeBillId,
    companionState,
    decorations,
  });
  const runtimeRef = useRef(createRuntimeState());

  sceneStateRef.current = {
    income,
    bills,
    activeBills: bills.filter((bill) => !bill.isPaid),
    totalBills,
    surplus,
    monthsCompleted,
    kingdomName,
    heroVisible,
    heroPosition,
    armorTier,
    islandStage,
    bannerColorHex,
    bannerDarkHex,
    battleAnimating: battle.isAnimating,
    activeBillId: battle.activeBillId,
    companionState,
    decorations,
  };

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return undefined;
    }

    runtimeRef.current = createRuntimeState();
    const runtime = runtimeRef.current;
    runtime.destroyed = false;

    let renderer;
    const viewportWidth = window.innerWidth || container.clientWidth;
    const sceneWidth = container.clientWidth || viewportWidth;
    const compactViewport = sceneWidth < 960;
    const cameraConfig = getCameraConfigForWidth(viewportWidth);
    const pixelRatioCap = compactViewport ? 1 : 1.2;
    const shadowMapSize = compactViewport ? 384 : 512;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !compactViewport && window.devicePixelRatio <= 1.5,
        alpha: false,
        powerPreference: 'high-performance',
      });
    } catch (error) {
      setSceneError('WebGL preview unavailable in this browser context.');
      return undefined;
    }

    setSceneError('');
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
    renderer.setClearColor(SCENE_BACKGROUND);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(SCENE_BACKGROUND, 20, 36);

    const camera = new THREE.PerspectiveCamera(cameraConfig.fov, 1, 0.1, 120);
    camera.position.set(...cameraConfig.position);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.enablePan = false;
    controls.target.set(...cameraConfig.target);
    controls.minDistance = cameraConfig.minDistance;
    controls.maxDistance = cameraConfig.maxDistance;
    controls.minAzimuthAngle = cameraConfig.minAzimuthAngle;
    controls.maxAzimuthAngle = cameraConfig.maxAzimuthAngle;
    controls.minPolarAngle = cameraConfig.minPolarAngle;
    controls.maxPolarAngle = cameraConfig.maxPolarAngle;
    controls.update();

    // Time-of-day lighting (updates every 60s)
    const timeLighting = getTimeLighting();
    scene.background = timeLighting.skyColor;

    const ambientLight = new THREE.AmbientLight('#c7f9cc', 1.8);
    scene.add(ambientLight);

    const sun = new THREE.DirectionalLight('#fff8d6', 2.8);
    sun.position.set(9, 14, 8);
    sun.castShadow = true;
    sun.shadow.mapSize.set(shadowMapSize, shadowMapSize);
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    scene.add(sun);

    const rim = new THREE.DirectionalLight('#93c5fd', 1.1);
    rim.position.set(-8, 6, -9);
    scene.add(rim);

    // Apply initial time lighting
    ambientLight.intensity = 1.2 + timeLighting.ambient;
    sun.color.copy(timeLighting.sunColor);

    // Update lighting every 60 seconds
    const timeLightingInterval = setInterval(() => {
      if (runtime.destroyed) return;
      const tl = getTimeLighting();
      scene.background.lerp(tl.skyColor, 0.3);
      ambientLight.intensity = 1.2 + tl.ambient;
      sun.color.lerp(tl.sunColor, 0.3);
    }, 60000);

    // Companion FSM tick — check state every 60 seconds
    const companionTickInterval = setInterval(() => {
      if (runtime.destroyed) return;
      const paydayDate = useProfileStore.getState().paydayDate;
      const nextState = getCurrentCompanionState(paydayDate);
      if (nextState !== runtime.companionStateId) {
        useWorldStore.getState().setCompanionState(nextState);
        sceneStateRef.current.companionState = nextState;
        rebuildCompanion(runtime, nextState);
      }
    }, 60000);

    const worldRoot = new THREE.Group();
    worldRoot.scale.setScalar(WORLD_SCALE);
    scene.add(worldRoot);

    const { island, summary } = createIslandBase();
    worldRoot.add(island);

    const treasuryRoot = new THREE.Group();
    const identityRoot = new THREE.Group();
    const growthRoot = new THREE.Group();
    const monstersRoot = new THREE.Group();
    const heroRoot = new THREE.Group();
    const particlesRoot = new THREE.Group();
    const companionRoot = new THREE.Group();
    const decorationsRoot = new THREE.Group();
    worldRoot.add(treasuryRoot, identityRoot, growthRoot, monstersRoot, heroRoot, particlesRoot, companionRoot, decorationsRoot);

    runtime.renderer = renderer;
    runtime.scene = scene;
    runtime.camera = camera;
    runtime.controls = controls;
    runtime.summary = summary;
    runtime.roots = {
      treasury: treasuryRoot,
      identity: identityRoot,
      growth: growthRoot,
      monsters: monstersRoot,
      hero: heroRoot,
      particles: particlesRoot,
      companion: companionRoot,
      decorations: decorationsRoot,
    };

    // Resolve initial companion state from FSM
    const initialPaydayDate = useProfileStore.getState().paydayDate;
    const initialCompanionState = getCurrentCompanionState(initialPaydayDate);
    useWorldStore.getState().setCompanionState(initialCompanionState);
    sceneStateRef.current.companionState = initialCompanionState;

    // Daily expression: prune expired, then pick today's decoration
    const worldState = useWorldStore.getState();
    const pruned = pruneExpired(worldState.decorations || []);
    if (pruned.length !== (worldState.decorations || []).length) {
      worldState.setDecorations(pruned);
    }
    const context = assembleContext({
      factState: useFactStore.getState(),
      profileState: useProfileStore.getState(),
      bondState: useBondStore.getState(),
      worldState: { ...worldState, decorations: pruned },
    });
    const expression = pickDailyExpression(context);
    if (expression) {
      useWorldStore.getState().addDecoration(expression);
      sceneStateRef.current.decorations = [...pruned, expression];
    } else {
      sceneStateRef.current.decorations = pruned;
    }

    rebuildIdleScene(runtime, sceneStateRef.current);

    const resize = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, pixelRatioCap));
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);
    resize();

    const hydrateSyncTimers = [0, 120, 320].map((delay) =>
      window.setTimeout(() => {
        if (runtime.destroyed) {
          return;
        }

        rebuildIdleScene(runtime, sceneStateRef.current);
        renderer.render(scene, camera);
      }, delay),
    );

    let animationFrameId = 0;

    const renderFrame = (timestamp) => {
      if (runtime.destroyed) {
        return;
      }

      if (runtime.lastFrameTime === null) {
        runtime.lastFrameTime = timestamp;
      }

      const deltaMs = Math.min(48, timestamp - runtime.lastFrameTime);
      runtime.lastFrameTime = timestamp;
      updatePerformanceEstimate(runtime, deltaMs);

      stepAnimations(runtime, deltaMs);
      updateIdleMotion(runtime, sceneStateRef.current, timestamp);
      controls.update();
      renderer.render(scene, camera);
      animationFrameId = window.requestAnimationFrame(renderFrame);
    };

    const renderGameToText = () =>
      JSON.stringify({
        screen: 'payday-kingdom-live',
        notes: 'Three.js world coordinates with X right, Y up, and Z depth.',
        camera: {
          position: camera.position.toArray().map(round),
          target: controls.target.toArray().map(round),
        },
        island: {
          ...summary,
          kingdomName: sceneStateRef.current.kingdomName,
          income: sceneStateRef.current.income,
          totalBills: sceneStateRef.current.totalBills,
          surplus: sceneStateRef.current.surplus,
          monthsCompleted: sceneStateRef.current.monthsCompleted,
          islandStage: sceneStateRef.current.islandStage,
          islandStageLabel: getIslandStageForMonths(sceneStateRef.current.monthsCompleted).label,
          bannerColor: sceneStateRef.current.bannerColorHex,
          heroVisible: sceneStateRef.current.heroVisible,
          heroTier: sceneStateRef.current.armorTier,
          battleAnimating: sceneStateRef.current.battleAnimating,
          monsters: sceneStateRef.current.activeBills.map((bill) => ({
            name: bill.name,
            amount: bill.amount,
            category: bill.category,
          })),
          showsQuestionBlock: !sceneStateRef.current.income && sceneStateRef.current.activeBills.length === 0,
        },
        canvas: {
          width: renderer.domElement.width,
          height: renderer.domElement.height,
        },
        performance: collectSceneMetrics(runtime),
      });

    const captureScene = async ({ title, subtitle, accentColor, accentDarkColor, filename } = {}) => {
      const currentWidth = container.clientWidth;
      const currentHeight = container.clientHeight;

      if (!currentWidth || !currentHeight) {
        throw new Error('Scene is not ready for capture.');
      }

      const originalPixelRatio = renderer.getPixelRatio();
      const originalSize = renderer.getSize(new THREE.Vector2());
      const capturePixelRatio = Math.min(Math.max(originalPixelRatio * 2, 2), 4);

      let sceneImage;
      try {
        renderer.setPixelRatio(capturePixelRatio);
        renderer.setSize(currentWidth, currentHeight, false);
        controls.update();
        renderer.render(scene, camera);

        const sceneDataUrl = renderer.domElement.toDataURL('image/png');
        sceneImage = await loadImage(sceneDataUrl);
      } finally {
        renderer.setPixelRatio(originalPixelRatio);
        renderer.setSize(originalSize.x, originalSize.y, false);
        controls.update();
        renderer.render(scene, camera);
      }

      if (document.fonts?.ready) {
        await document.fonts.ready;
      }

      const bannerHeight = Math.max(168, Math.round(sceneImage.height * 0.18));
      const captureCanvas = document.createElement('canvas');
      captureCanvas.width = sceneImage.width;
      captureCanvas.height = sceneImage.height + bannerHeight;
      const context = captureCanvas.getContext('2d');

      if (!context) {
        throw new Error('Capture canvas is unavailable.');
      }

      context.drawImage(sceneImage, 0, 0);
      context.fillStyle = '#07121b';
      context.fillRect(0, sceneImage.height, captureCanvas.width, bannerHeight);
      context.fillStyle = accentColor || sceneStateRef.current.bannerColorHex;
      context.fillRect(0, sceneImage.height, captureCanvas.width, 10);

      const glow = context.createLinearGradient(0, sceneImage.height, captureCanvas.width, captureCanvas.height);
      glow.addColorStop(0, accentColor || sceneStateRef.current.bannerColorHex);
      glow.addColorStop(1, accentDarkColor || sceneStateRef.current.bannerDarkHex);
      context.fillStyle = glow;
      context.fillRect(0, sceneImage.height + 10, captureCanvas.width, bannerHeight - 10);

      context.fillStyle = 'rgba(3, 7, 18, 0.82)';
      context.fillRect(0, sceneImage.height + 10, captureCanvas.width, bannerHeight - 10);

      context.fillStyle = '#f8fafc';
      context.font = '700 44px Inter, sans-serif';
      context.fillText(title || 'Payday Kingdom', 42, sceneImage.height + 68);

      context.fillStyle = '#fde68a';
      context.font = '16px "Press Start 2P", monospace';
      context.fillText('PAYDAY KINGDOM', 42, sceneImage.height + 36);

      context.fillStyle = '#e2e8f0';
      context.font = '600 24px Inter, sans-serif';
      context.fillText(subtitle || 'My kingdom keeps growing.', 42, sceneImage.height + 108);

      context.fillStyle = 'rgba(226, 232, 240, 0.8)';
      context.font = '500 20px Inter, sans-serif';
      context.textAlign = 'right';
      context.fillText('paydaykingdom.app', captureCanvas.width - 42, sceneImage.height + 104);
      context.textAlign = 'left';

      const blob = await canvasToBlob(captureCanvas);
      const objectUrl = URL.createObjectURL(blob);

      return {
        blob,
        objectUrl,
        filename: filename || `payday-kingdom-${Date.now()}.png`,
      };
    };

    const advanceTime = (ms) => {
      const steps = Math.max(1, Math.round(ms / (1000 / 60)));
      for (let index = 0; index < steps; index += 1) {
        stepAnimations(runtime, 1000 / 60);
        updateIdleMotion(runtime, sceneStateRef.current, performance.now());
        controls.update();
      }
      renderer.render(scene, camera);
    };

    window.render_game_to_text = renderGameToText;
    window.get_scene_debug_info = () => collectSceneMetrics(runtime);
    window.advanceTime = advanceTime;
    setCaptureScene(captureScene);

    animationFrameId = window.requestAnimationFrame(renderFrame);

    return () => {
      runtime.destroyed = true;
      clearInterval(timeLightingInterval);
      clearInterval(companionTickInterval);
      hydrateSyncTimers.forEach((timerId) => window.clearTimeout(timerId));
      window.cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      clearGroup(treasuryRoot);
      clearGroup(identityRoot);
      clearGroup(growthRoot);
      clearGroup(monstersRoot);
      clearGroup(heroRoot);
      clearGroup(particlesRoot);
      clearGroup(companionRoot);
      clearGroup(decorationsRoot);
      disposeObject(worldRoot);
      renderer.dispose();
      setCaptureScene(null);

      if (renderer.domElement.parentNode === container) {
        container.removeChild(renderer.domElement);
      }

      if (window.render_game_to_text === renderGameToText) {
        delete window.render_game_to_text;
      }

      if (window.advanceTime === advanceTime) {
        delete window.advanceTime;
      }

      if (window.get_scene_debug_info) {
        delete window.get_scene_debug_info;
      }

      runtimeRef.current = createRuntimeState();
    };
  }, []);

  useEffect(() => {
    const runtime = runtimeRef.current;

    if (!runtime.renderer || !runtime.scene || !runtime.camera) {
      return;
    }

    if (battle.isAnimating) {
      return;
    }

    rebuildIdleScene(runtime, sceneStateRef.current);
    runtime.renderer.render(runtime.scene, runtime.camera);
  }, [income, bills, heroVisible, heroPosition, armorTier, islandStage, bannerColorHex, bannerDarkHex, battle.isAnimating, companionState, decorations]);

  useEffect(() => {
    if (battle.status !== 'queued') {
      return undefined;
    }

    const runtime = runtimeRef.current;

    if (!runtime.renderer || runtime.destroyed) {
      return undefined;
    }

    let cancelled = false;

    const run = async () => {
      await runPaydaySequence(runtime, sceneStateRef);

      if (!cancelled && runtime.renderer && runtime.scene && runtime.camera) {
        runtime.renderer.render(runtime.scene, runtime.camera);
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [battle.runId, battle.status]);

  if (sceneError) {
    return (
      <div className="flex h-full w-full items-center justify-center px-6 text-center text-sm leading-7 text-emerald-100/80">
        {sceneError}
      </div>
    );
  }

  return <div ref={containerRef} className="h-full w-full" />;
}
