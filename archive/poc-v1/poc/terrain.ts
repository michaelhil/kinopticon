// Terrain generation with heightmap
import * as THREE from 'three';
import { TerrainData, HeightmapConfig, Vector3, RoadPath, RoadNetwork } from './types.ts';

export const createTerrainConfig = (): HeightmapConfig => ({
  size: 64,
  worldSize: 1000,
  amplitude: 50,
  frequency: 0.01
});

export const generateHeightmap = (config: HeightmapConfig): number[][] => {
  const { size, amplitude, frequency } = config;
  const heightmap: number[][] = [];
  
  for (let x = 0; x < size; x++) {
    heightmap[x] = [];
    for (let y = 0; y < size; y++) {
      const worldX = (x / size) * 1000;
      const worldY = (y / size) * 1000;
      
      const height = amplitude * (
        Math.sin(worldX * frequency) +
        Math.sin(worldY * frequency) +
        Math.sin((worldX + worldY) * frequency * 0.5)
      ) / 3;
      
      heightmap[x][y] = Math.max(0, height + 20);
    }
  }
  
  return heightmap;
};

export const createTerrainGeometry = (
  heightmap: number[][],
  config: HeightmapConfig
): THREE.BufferGeometry => {
  const { size, worldSize } = config;
  const geometry = new THREE.PlaneGeometry(worldSize, worldSize, size - 1, size - 1);
  const positions = geometry.attributes.position.array as Float32Array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = Math.floor((i / 3) % size);
    const y = Math.floor((i / 3) / size);
    if (heightmap[x] && heightmap[x][y] !== undefined) {
      positions[i + 2] = heightmap[x][y];
    }
  }
  
  geometry.computeVertexNormals();
  return geometry;
};

export const sampleTerrainHeight = (
  heightmap: number[][],
  worldX: number,
  worldZ: number,
  worldSize: number
): number => {
  const size = heightmap.length;
  const x = Math.floor((worldX + worldSize / 2) / worldSize * size);
  const z = Math.floor((worldZ + worldSize / 2) / worldSize * size);
  
  if (x >= 0 && x < size && z >= 0 && z < size) {
    return heightmap[x][z];
  }
  return 0;
};

export const createTerrain = async (config: HeightmapConfig): Promise<TerrainData> => {
  const heightmap = generateHeightmap(config);
  const geometry = createTerrainGeometry(heightmap, config);
  
  return {
    heightmap,
    size: config.size,
    worldSize: config.worldSize,
    geometry
  };
};

export const regenerateTerrainWithBumpiness = (
  terrain: TerrainData,
  bumpiness: number
): void => {
  const config: HeightmapConfig = {
    size: terrain.size,
    worldSize: terrain.worldSize,
    amplitude: bumpiness, // Use bumpiness directly as amplitude
    frequency: 0.01
  };
  
  // Generate new heightmap with adjusted bumpiness
  const newHeightmap = generateHeightmap(config);
  terrain.heightmap = newHeightmap;
  
  // Update the geometry
  const positions = terrain.geometry.attributes.position.array as Float32Array;
  
  for (let i = 0; i < positions.length; i += 3) {
    const x = Math.floor((i / 3) % terrain.size);
    const y = Math.floor((i / 3) / terrain.size);
    if (newHeightmap[x] && newHeightmap[x][y] !== undefined) {
      positions[i + 2] = newHeightmap[x][y];
    }
  }
  
  terrain.geometry.attributes.position.needsUpdate = true;
  terrain.geometry.computeVertexNormals();
};

export const updateAllRoadsForTerrain = (
  roads: RoadNetwork,
  terrain: TerrainData
): THREE.Mesh[] => {
  const updatedMeshes: THREE.Mesh[] = [];
  
  // Update main road heights
  updateRoadHeightsForTerrain(roads.mainRoad, terrain);
  
  // Update branch road heights
  updateRoadHeightsForTerrain(roads.branchRoad, terrain);
  
  // Update dynamic roads
  for (const dynamicRoad of roads.dynamicRoads) {
    updateRoadHeightsForTerrain(dynamicRoad, terrain);
  }
  
  return updatedMeshes;
};

const updateRoadHeightsForTerrain = (
  road: RoadPath,
  terrain: TerrainData
): void => {
  for (const point of road.points) {
    const newHeight = sampleTerrainHeight(terrain.heightmap, point.x, point.z, terrain.worldSize);
    point.y = newHeight + 3; // Keep road 3 units above terrain
  }
};