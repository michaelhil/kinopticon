// POC-specific type definitions
import * as THREE from 'three';

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface TerrainData {
  heightmap: number[][];
  size: number;
  worldSize: number;
  geometry: THREE.BufferGeometry;
}

export interface RoadPath {
  points: Vector3[];
  width: number;
  length: number;
  name?: string;
  highway?: string;
}

export interface RoadNetwork {
  mainRoad: RoadPath;
  branchRoad: RoadPath;
  allPoints: Vector3[];
  dynamicRoads: RoadPath[];
}

export interface Entity {
  id: string;
  mesh: THREE.Mesh;
  position: Vector3;
  type: 'car' | 'pedestrian';
}

export interface POCScene {
  terrain: TerrainData;
  roads: RoadNetwork;
  entities: Entity[];
  scene: THREE.Scene;
}

export interface HeightmapConfig {
  size: number;
  worldSize: number;
  amplitude: number;
  frequency: number;
}

export interface RoadConfig {
  width: number;
  branchDistance: number;
  branchAngle: number;
  branchLength: number;
}