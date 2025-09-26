// Entity creation and management
import * as THREE from 'three';
import { Entity, Vector3, RoadNetwork } from './types.ts';
import { getPositionAlongRoad, calculateRoadDirection } from './placement.ts';

let entityCounter = 0;

export const createCarEntity = (position: Vector3): Entity => {
  const geometry = new THREE.BoxGeometry(12, 6, 8);
  const material = new THREE.MeshBasicMaterial({ color: 0x0066cc });
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.position.set(position.x, position.y + 3, position.z);
  
  return {
    id: `car_${entityCounter++}`,
    mesh,
    position,
    type: 'car'
  };
};

export const createPedestrianEntity = (position: Vector3): Entity => {
  const geometry = new THREE.CylinderGeometry(1.0, 1.0, 3.0);
  const material = new THREE.MeshBasicMaterial({ color: 0xff3333 });
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.position.set(position.x, position.y + 1.5, position.z);
  mesh.rotation.y = Math.random() * Math.PI * 2;
  
  return {
    id: `pedestrian_${entityCounter++}`,
    mesh,
    position,
    type: 'pedestrian'
  };
};

export const placeEntityOnRoad = (
  entity: Entity,
  roads: RoadNetwork,
  roadType: 'main' | 'branch',
  distance: number
): void => {
  const position = getPositionAlongRoad(roads, roadType, distance);
  const road = roadType === 'main' ? roads.mainRoad : roads.branchRoad;
  const roadIndex = Math.floor((distance / road.length) * (road.points.length - 1));
  const direction = calculateRoadDirection(road.points, roadIndex);
  
  entity.position = position;
  entity.mesh.position.set(position.x, position.y + (entity.type === 'car' ? 0.9 : 1.5), position.z);
  
  if (entity.type === 'car') {
    const angle = Math.atan2(direction.x, direction.z);
    entity.mesh.rotation.y = angle;
  }
};

export const createInitialEntities = (roads: RoadNetwork): Entity[] => {
  const entities: Entity[] = [];
  
  // Place car on main road
  const carPosition = getPositionAlongRoad(roads, 'main', 200);
  const car = createCarEntity(carPosition);
  placeEntityOnRoad(car, roads, 'main', 200);
  entities.push(car);
  
  // Place pedestrian on main road  
  const pedestrianPosition = getPositionAlongRoad(roads, 'main', 300);
  const pedestrian = createPedestrianEntity(pedestrianPosition);
  placeEntityOnRoad(pedestrian, roads, 'main', 300);
  entities.push(pedestrian);
  
  return entities;
};

export const addEntityToScene = (entity: Entity, scene: THREE.Scene): void => {
  scene.add(entity.mesh);
};

export const removeEntityFromScene = (entity: Entity, scene: THREE.Scene): void => {
  scene.remove(entity.mesh);
  entity.mesh.geometry.dispose();
  if (entity.mesh.material instanceof THREE.Material) {
    entity.mesh.material.dispose();
  }
};