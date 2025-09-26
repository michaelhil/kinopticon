// Position calculation utilities
import { RoadNetwork, Vector3 } from './types.ts';

export const generateRandomRoadPosition = (roads: RoadNetwork): Vector3 => {
  // Include all roads: main, branch, and dynamic
  const allRoads = [roads.mainRoad, roads.branchRoad, ...roads.dynamicRoads];
  const selectedRoad = allRoads[Math.floor(Math.random() * allRoads.length)];
  
  if (selectedRoad.points.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }
  
  const randomIndex = Math.floor(Math.random() * selectedRoad.points.length);
  const roadPoint = selectedRoad.points[randomIndex];
  
  // Calculate road direction for proper shoulder positioning
  let direction: Vector3;
  if (randomIndex < selectedRoad.points.length - 1) {
    const nextPoint = selectedRoad.points[randomIndex + 1];
    direction = {
      x: nextPoint.x - roadPoint.x,
      y: 0,
      z: nextPoint.z - roadPoint.z
    };
  } else if (randomIndex > 0) {
    const prevPoint = selectedRoad.points[randomIndex - 1];
    direction = {
      x: roadPoint.x - prevPoint.x,
      y: 0,
      z: roadPoint.z - prevPoint.z
    };
  } else {
    direction = { x: 0, y: 0, z: 1 };
  }
  
  const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
  if (length > 0) {
    direction.x /= length;
    direction.z /= length;
  }
  
  // Get perpendicular direction for shoulder offset
  const perpendicular = { x: -direction.z, y: 0, z: direction.x };
  const shoulderOffset = (Math.random() - 0.5) * selectedRoad.width * 0.8;
  
  return {
    x: roadPoint.x + perpendicular.x * shoulderOffset,
    y: roadPoint.y + 2, // Slightly above road surface
    z: roadPoint.z + perpendicular.z * shoulderOffset
  };
};

export const getPositionAlongRoad = (
  roads: RoadNetwork,
  roadType: 'main' | 'branch',
  distance: number
): Vector3 => {
  const road = roadType === 'main' ? roads.mainRoad : roads.branchRoad;
  const normalizedDistance = Math.max(0, Math.min(1, distance / road.length));
  const targetIndex = Math.floor(normalizedDistance * (road.points.length - 1));
  
  if (targetIndex >= road.points.length) {
    return road.points[road.points.length - 1];
  }
  
  return road.points[targetIndex];
};

export const calculateRoadDirection = (
  points: Vector3[],
  index: number
): Vector3 => {
  if (points.length < 2) {
    return { x: 0, y: 0, z: 1 };
  }
  
  let direction: Vector3;
  
  if (index === 0) {
    const current = points[0];
    const next = points[1];
    direction = {
      x: next.x - current.x,
      y: 0,
      z: next.z - current.z
    };
  } else if (index === points.length - 1) {
    const prev = points[index - 1];
    const current = points[index];
    direction = {
      x: current.x - prev.x,
      y: 0,
      z: current.z - prev.z
    };
  } else {
    const prev = points[index - 1];
    const next = points[index + 1];
    direction = {
      x: next.x - prev.x,
      y: 0,
      z: next.z - prev.z
    };
  }
  
  const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
  if (length > 0) {
    direction.x /= length;
    direction.z /= length;
  }
  
  return direction;
};