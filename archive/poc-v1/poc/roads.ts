// Road path generation and geometry
import * as THREE from 'three';
import { RoadPath, RoadNetwork, RoadConfig, Vector3, TerrainData } from './types.ts';
import { sampleTerrainHeight } from './terrain.ts';

export const createRoadConfig = (): RoadConfig => ({
  width: 20,
  branchDistance: 500,
  branchAngle: 45,
  branchLength: 200
});

export const generateMainRoad = (terrain: TerrainData): RoadPath => {
  const points: Vector3[] = [];
  const segments = 20; // Fewer segments for debugging
  const startZ = -400;
  const endZ = 400;
  
  for (let i = 0; i <= segments; i++) {
    const z = startZ + (i / segments) * 800;
    const x = 0;
    const y = sampleTerrainHeight(terrain.heightmap, x, z, terrain.worldSize) + 3;
    
    points.push({ x, y, z });
  }
  
  console.log('Main road generated with', points.length, 'points');
  
  return {
    points,
    width: 20,
    length: 800
  };
};

export const generateBranchRoad = (
  mainRoad: RoadPath,
  terrain: TerrainData,
  config: RoadConfig
): RoadPath => {
  const branchStartIndex = Math.floor((config.branchDistance / terrain.worldSize) * mainRoad.points.length);
  const startPoint = mainRoad.points[branchStartIndex];
  
  const points: Vector3[] = [startPoint];
  const segments = 20;
  const angleRad = (config.branchAngle * Math.PI) / 180;
  
  for (let i = 1; i <= segments; i++) {
    const distance = (i / segments) * config.branchLength;
    const x = startPoint.x + distance * Math.sin(angleRad);
    const z = startPoint.z + distance * Math.cos(angleRad);
    const y = sampleTerrainHeight(terrain.heightmap, x, z, terrain.worldSize) + 5;
    
    points.push({ x, y, z });
  }
  
  return {
    points,
    width: 20,
    length: config.branchLength
  };
};

export const createRoadGeometry = (path: RoadPath): THREE.BufferGeometry => {
  console.log('Creating road geometry with', path.points.length, 'points');
  
  if (path.points.length < 2) {
    console.error('Not enough points to create road geometry');
    return new THREE.BufferGeometry();
  }
  
  const vertices: number[] = [];
  const indices: number[] = [];
  const normals: number[] = [];
  const uvs: number[] = [];
  
  const halfWidth = path.width / 2;
  
  // Generate vertices along the path
  for (let i = 0; i < path.points.length; i++) {
    const point = path.points[i];
    
    // Calculate direction vector
    let direction: Vector3;
    if (i === 0 && path.points.length > 1) {
      const next = path.points[1];
      direction = {
        x: next.x - point.x,
        y: 0,
        z: next.z - point.z
      };
    } else if (i === path.points.length - 1 && i > 0) {
      const prev = path.points[i - 1];
      direction = {
        x: point.x - prev.x,
        y: 0,
        z: point.z - prev.z
      };
    } else if (i > 0 && i < path.points.length - 1) {
      const prev = path.points[i - 1];
      const next = path.points[i + 1];
      direction = {
        x: next.x - prev.x,
        y: 0,
        z: next.z - prev.z
      };
    } else {
      direction = { x: 0, y: 0, z: 1 };
    }
    
    // Normalize direction
    const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
    if (length > 0) {
      direction.x /= length;
      direction.z /= length;
    }
    
    // Calculate perpendicular (right) vector
    const right = { x: -direction.z, y: 0, z: direction.x };
    
    // Add left vertex
    vertices.push(
      point.x + right.x * halfWidth,
      point.y + 0.5,
      point.z + right.z * halfWidth
    );
    
    // Add right vertex
    vertices.push(
      point.x - right.x * halfWidth,
      point.y + 0.5,
      point.z - right.z * halfWidth
    );
    
    // Add normals (pointing up)
    normals.push(0, 1, 0);
    normals.push(0, 1, 0);
    
    // Add UVs
    const v = i / (path.points.length - 1);
    uvs.push(0, v);
    uvs.push(1, v);
  }
  
  // Generate indices for triangles
  for (let i = 0; i < path.points.length - 1; i++) {
    const baseIndex = i * 2;
    
    // First triangle
    indices.push(baseIndex, baseIndex + 2, baseIndex + 1);
    
    // Second triangle
    indices.push(baseIndex + 1, baseIndex + 2, baseIndex + 3);
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  
  console.log('Road geometry created successfully with', vertices.length / 3, 'vertices');
  return geometry;
};

export const createRoadEdgeLines = (road: RoadPath, scene: THREE.Scene): void => {
  if (road.points.length < 2) return;
  
  const roadWidth = road.width || 10;
  const halfWidth = roadWidth / 2;
  
  const leftEdgePoints: THREE.Vector3[] = [];
  const rightEdgePoints: THREE.Vector3[] = [];
  
  // Calculate edge points for each segment
  for (let i = 0; i < road.points.length - 1; i++) {
    const current = road.points[i];
    const next = road.points[i + 1];
    
    // Calculate direction vector
    const dirX = next.x - current.x;
    const dirZ = next.z - current.z;
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
    
    if (length > 0) {
      // Normalize direction
      const normDirX = dirX / length;
      const normDirZ = dirZ / length;
      
      // Calculate perpendicular vector (90 degrees clockwise)
      const perpX = normDirZ;
      const perpZ = -normDirX;
      
      // Calculate edge points
      const leftX = current.x + perpX * halfWidth;
      const leftZ = current.z + perpZ * halfWidth;
      const rightX = current.x - perpX * halfWidth;
      const rightZ = current.z - perpZ * halfWidth;
      
      leftEdgePoints.push(new THREE.Vector3(leftX, current.y + 0.05, leftZ));
      rightEdgePoints.push(new THREE.Vector3(rightX, current.y + 0.05, rightZ));
    }
  }
  
  // Add the last point
  if (road.points.length >= 2) {
    const lastIdx = road.points.length - 1;
    const prevIdx = lastIdx - 1;
    const last = road.points[lastIdx];
    const prev = road.points[prevIdx];
    
    const dirX = last.x - prev.x;
    const dirZ = last.z - prev.z;
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
    
    if (length > 0) {
      const normDirX = dirX / length;
      const normDirZ = dirZ / length;
      const perpX = normDirZ;
      const perpZ = -normDirX;
      
      leftEdgePoints.push(new THREE.Vector3(
        last.x + perpX * halfWidth,
        last.y + 0.05,
        last.z + perpZ * halfWidth
      ));
      rightEdgePoints.push(new THREE.Vector3(
        last.x - perpX * halfWidth,
        last.y + 0.05,
        last.z - perpZ * halfWidth
      ));
    }
  }
  
  // Create line materials
  const edgeLineMaterial = new THREE.LineBasicMaterial({
    color: 0x000000,
    linewidth: 2
  });
  
  // Create left edge line
  if (leftEdgePoints.length >= 2) {
    const leftGeometry = new THREE.BufferGeometry().setFromPoints(leftEdgePoints);
    const leftLine = new THREE.Line(leftGeometry, edgeLineMaterial.clone());
    leftLine.userData = { isRoadEdgeLine: true };
    scene.add(leftLine);
  }
  
  // Create right edge line  
  if (rightEdgePoints.length >= 2) {
    const rightGeometry = new THREE.BufferGeometry().setFromPoints(rightEdgePoints);
    const rightLine = new THREE.Line(rightGeometry, edgeLineMaterial.clone());
    rightLine.userData = { isRoadEdgeLine: true };
    scene.add(rightLine);
  }
};

export const createRoadNetwork = async (
  terrain: TerrainData,
  config: RoadConfig
): Promise<RoadNetwork> => {
  const mainRoad = generateMainRoad(terrain);
  const branchRoad = generateBranchRoad(mainRoad, terrain, config);
  
  const allPoints = [...mainRoad.points, ...branchRoad.points];
  
  return {
    mainRoad,
    branchRoad,
    allPoints,
    dynamicRoads: []
  };
};

export const generateConnectedRoad = (
  existingRoads: RoadNetwork,
  terrain: TerrainData,
  length: number
): RoadPath => {
  // Select a random point from existing roads to connect to
  const allRoads = [existingRoads.mainRoad, existingRoads.branchRoad, ...existingRoads.dynamicRoads];
  const sourceRoad = allRoads[Math.floor(Math.random() * allRoads.length)];
  const connectionPointIndex = Math.floor(Math.random() * sourceRoad.points.length);
  const connectionPoint = sourceRoad.points[connectionPointIndex];
  
  // Calculate direction for new road - prefer perpendicular to existing road
  let baseDirection: Vector3;
  if (connectionPointIndex > 0 && connectionPointIndex < sourceRoad.points.length - 1) {
    const prev = sourceRoad.points[connectionPointIndex - 1];
    const next = sourceRoad.points[connectionPointIndex + 1];
    const roadDirection = {
      x: next.x - prev.x,
      y: 0,
      z: next.z - prev.z
    };
    const len = Math.sqrt(roadDirection.x * roadDirection.x + roadDirection.z * roadDirection.z);
    if (len > 0) {
      roadDirection.x /= len;
      roadDirection.z /= len;
    }
    // Perpendicular direction with some randomness
    const perpAngle = (Math.random() > 0.5 ? 1 : -1) * (Math.PI / 2 + (Math.random() - 0.5) * 0.5);
    baseDirection = {
      x: Math.cos(perpAngle) * roadDirection.x - Math.sin(perpAngle) * roadDirection.z,
      y: 0,
      z: Math.sin(perpAngle) * roadDirection.x + Math.cos(perpAngle) * roadDirection.z
    };
  } else {
    // Random direction if at road end
    const angle = Math.random() * Math.PI * 2;
    baseDirection = { x: Math.cos(angle), y: 0, z: Math.sin(angle) };
  }
  
  const points: Vector3[] = [connectionPoint];
  const segments = Math.floor(length / 40);
  
  for (let i = 1; i <= segments; i++) {
    const distance = (i / segments) * length;
    // Add slight curve variation
    const curveVariation = Math.sin(i * 0.2) * 0.1;
    const x = connectionPoint.x + distance * (baseDirection.x + curveVariation);
    const z = connectionPoint.z + distance * baseDirection.z;
    const y = sampleTerrainHeight(terrain.heightmap, x, z, terrain.worldSize) + 3;
    
    points.push({ x, y, z });
  }
  
  return {
    points,
    width: 20,
    length
  };
};