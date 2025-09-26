// Driving system for first-person car camera experience
import * as THREE from 'three';
import { RoadNetwork, RoadPath, Vector3, POCScene } from './types.ts';
import { ConnectedRoadNetwork, RoadSegment, findConnectedRoads, findNearestNetworkNode } from './road-graph.ts';

export interface DrivingState {
  isActive: boolean;
  speed: number; // km/h
  currentRoad: RoadPath | null;
  roadIndex: number; // Which road in the network
  pointIndex: number; // Which point along the road
  progress: number; // Progress between current and next point (0-1)
  direction: 1 | -1; // 1 for forward, -1 for backward
  lastIntersectionCheck: number;
  // New graph-based navigation
  connectedNetwork: ConnectedRoadNetwork | null;
  currentSegment: RoadSegment | null;
  currentNodeId: string | null;
}

export interface DrivingControls {
  camera: THREE.Camera;
  orbitControls: any;
  scene: THREE.Scene;
}

export const createDrivingState = (): DrivingState => ({
  isActive: false,
  speed: 20, // Default 20 km/h
  currentRoad: null,
  roadIndex: 0,
  pointIndex: 0,
  progress: 0,
  direction: 1,
  lastIntersectionCheck: 0,
  connectedNetwork: null,
  currentSegment: null,
  currentNodeId: null
});

export const findRandomRoadPosition = (roadNetwork: RoadNetwork): { road: RoadPath; roadIndex: number; pointIndex: number } => {
  // Get all roads with valid points
  const allRoads = [roadNetwork.mainRoad, roadNetwork.branchRoad, ...roadNetwork.dynamicRoads];
  const validRoads = allRoads.filter(road => road.points.length >= 2);
  
  if (validRoads.length === 0) {
    console.error('❌ No valid roads found for repositioning');
    return { road: roadNetwork.mainRoad, roadIndex: 0, pointIndex: 0 };
  }
  
  // Select random road
  const randomRoadIndex = Math.floor(Math.random() * validRoads.length);
  const selectedRoad = validRoads[randomRoadIndex];
  
  // Select random point on that road (avoid last point to ensure we can move forward)
  const randomPointIndex = Math.floor(Math.random() * (selectedRoad.points.length - 1));
  
  // Find the actual road index in the original array
  let actualRoadIndex = 0;
  if (selectedRoad === roadNetwork.mainRoad) actualRoadIndex = 0;
  else if (selectedRoad === roadNetwork.branchRoad) actualRoadIndex = 1;
  else actualRoadIndex = 2 + roadNetwork.dynamicRoads.indexOf(selectedRoad);
  
  console.log(`🎯 Random position selected: Road ${actualRoadIndex}, Point ${randomPointIndex}${selectedRoad.name ? ` (${selectedRoad.name})` : ''}`);
  
  return { road: selectedRoad, roadIndex: actualRoadIndex, pointIndex: randomPointIndex };
};

export const findNearestRoad = (position: Vector3, roadNetwork: RoadNetwork): { road: RoadPath; roadIndex: number; pointIndex: number } => {
  let nearestRoad = roadNetwork.mainRoad;
  let nearestRoadIndex = 0;
  let nearestPointIndex = 0;
  let minDistance = Infinity;
  
  // Check all roads
  const allRoads = [roadNetwork.mainRoad, roadNetwork.branchRoad, ...roadNetwork.dynamicRoads];
  
  allRoads.forEach((road, roadIdx) => {
    if (road.points.length < 2) return;
    
    road.points.forEach((point, pointIdx) => {
      const distance = Math.sqrt(
        Math.pow(position.x - point.x, 2) +
        Math.pow(position.z - point.z, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestRoad = road;
        nearestRoadIndex = roadIdx;
        nearestPointIndex = pointIdx;
      }
    });
  });
  
  return { road: nearestRoad, roadIndex: nearestRoadIndex, pointIndex: nearestPointIndex };
};

export const startDriving = (
  drivingState: DrivingState,
  controls: DrivingControls,
  roadNetwork: RoadNetwork
): void => {
  if (drivingState.isActive) {
    // Stop driving
    stopDriving(drivingState, controls);
    return;
  }
  
  console.log('🚗 Starting driving mode...');
  
  // Find nearest road to camera
  const cameraPosition = controls.camera.position;
  const nearest = findNearestRoad(cameraPosition, roadNetwork);
  
  if (!nearest.road || nearest.road.points.length < 2) {
    console.error('❌ No suitable road found for driving');
    return;
  }
  
  // Initialize driving state
  drivingState.isActive = true;
  drivingState.currentRoad = nearest.road;
  drivingState.roadIndex = nearest.roadIndex;
  drivingState.pointIndex = Math.max(0, Math.min(nearest.pointIndex, nearest.road.points.length - 2));
  drivingState.progress = 0;
  drivingState.direction = 1;
  drivingState.lastIntersectionCheck = Date.now();
  
  // Disable orbit controls
  if (controls.orbitControls) {
    controls.orbitControls.enabled = false;
  }
  
  // Position camera at car height and angle
  positionCameraOnRoad(drivingState, controls.camera);
  
  console.log(`✅ Driving started on road: ${drivingState.currentRoad.name || 'Unknown'}`);
  showNotification(`🚗 Starting drive${drivingState.currentRoad.name ? ` on ${drivingState.currentRoad.name}` : ''}`);
};

export const stopDriving = (drivingState: DrivingState, controls: DrivingControls): void => {
  console.log('🛑 Stopping driving mode...');
  
  drivingState.isActive = false;
  drivingState.currentRoad = null;
  
  // Re-enable orbit controls
  if (controls.orbitControls) {
    controls.orbitControls.enabled = true;
  }
  
  showNotification('🛑 Drive stopped');
  console.log('✅ Driving mode stopped');
};

export const repositionCar = (
  drivingState: DrivingState,
  controls: DrivingControls,
  roadNetwork: RoadNetwork
): void => {
  if (!drivingState.isActive) {
    console.log('⚠️ Cannot reposition - not in driving mode');
    return;
  }
  
  console.log('🎲 Repositioning car to random location...');
  
  // Find random road position
  const randomPosition = findRandomRoadPosition(roadNetwork);
  
  if (!randomPosition.road || randomPosition.road.points.length < 2) {
    console.error('❌ No suitable road found for repositioning');
    showNotification('❌ No suitable road found');
    return;
  }
  
  // Update driving state with new position
  drivingState.currentRoad = randomPosition.road;
  drivingState.roadIndex = randomPosition.roadIndex;
  drivingState.pointIndex = randomPosition.pointIndex;
  drivingState.progress = 0;
  drivingState.direction = 1; // Always start moving forward
  drivingState.lastIntersectionCheck = Date.now();
  
  // Position camera at new location
  positionCameraOnRoad(drivingState, controls.camera);
  
  const roadName = drivingState.currentRoad.name || 'Unknown road';
  console.log(`✅ Repositioned to: ${roadName}`);
  showNotification(`🎯 Repositioned${roadName !== 'Unknown road' ? ` on ${roadName}` : ''}`);
};

export const updateDriving = (
  drivingState: DrivingState,
  controls: DrivingControls,
  roadNetwork: RoadNetwork,
  deltaTime: number
): void => {
  if (!drivingState.isActive || !drivingState.currentRoad) return;
  
  // Convert speed from km/h to units per second
  const speedUnitsPerSecond = (drivingState.speed * 1000) / 3600; // km/h to m/s, assuming 1 unit = 1m
  const distanceToMove = speedUnitsPerSecond * deltaTime;
  
  // Calculate distance between current and next point
  const currentPoint = drivingState.currentRoad.points[drivingState.pointIndex];
  const nextPointIndex = drivingState.pointIndex + drivingState.direction;
  
  if (nextPointIndex < 0 || nextPointIndex >= drivingState.currentRoad.points.length) {
    // Reached end of road - handle turning around or finding intersection
    handleRoadEnd(drivingState, roadNetwork);
    return;
  }
  
  const nextPoint = drivingState.currentRoad.points[nextPointIndex];
  const segmentDistance = Math.sqrt(
    Math.pow(nextPoint.x - currentPoint.x, 2) +
    Math.pow(nextPoint.z - currentPoint.z, 2)
  );
  
  if (segmentDistance === 0) {
    // Skip zero-length segments
    drivingState.pointIndex = nextPointIndex;
    return;
  }
  
  // Update progress along current segment
  const progressIncrement = distanceToMove / segmentDistance;
  drivingState.progress += progressIncrement;
  
  // Check if we've completed this segment
  if (drivingState.progress >= 1.0) {
    drivingState.pointIndex = nextPointIndex;
    drivingState.progress = 0;
    
    // Check for intersections periodically
    const now = Date.now();
    if (now - drivingState.lastIntersectionCheck > 2000) { // Check every 2 seconds
      checkForIntersection(drivingState, roadNetwork);
      drivingState.lastIntersectionCheck = now;
    }
  }
  
  // Position camera
  positionCameraOnRoad(drivingState, controls.camera);
};

const positionCameraOnRoad = (drivingState: DrivingState, camera: THREE.Camera): void => {
  if (!drivingState.currentRoad) return;
  
  const currentPoint = drivingState.currentRoad.points[drivingState.pointIndex];
  const nextPointIndex = drivingState.pointIndex + drivingState.direction;
  
  if (nextPointIndex < 0 || nextPointIndex >= drivingState.currentRoad.points.length) return;
  
  const nextPoint = drivingState.currentRoad.points[nextPointIndex];
  
  // Interpolate position between current and next point
  const position = {
    x: currentPoint.x + (nextPoint.x - currentPoint.x) * drivingState.progress,
    y: currentPoint.y + (nextPoint.y - currentPoint.y) * drivingState.progress + 1.8, // Car height
    z: currentPoint.z + (nextPoint.z - currentPoint.z) * drivingState.progress
  };
  
  // Calculate forward direction
  const direction = {
    x: nextPoint.x - currentPoint.x,
    y: 0, // Keep camera level
    z: nextPoint.z - currentPoint.z
  };
  
  // Normalize direction
  const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
  if (length > 0) {
    direction.x /= length;
    direction.z /= length;
  }
  
  // Set camera position
  camera.position.set(position.x, position.y, position.z);
  
  // Set camera to look forward along the road
  const lookAtTarget = {
    x: position.x + direction.x * 10,
    y: position.y,
    z: position.z + direction.z * 10
  };
  
  camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
};

const handleRoadEnd = (drivingState: DrivingState, roadNetwork: RoadNetwork): void => {
  console.log('🔄 Reached end of road, turning around...');
  
  // Turn around
  drivingState.direction *= -1;
  drivingState.progress = 0;
  
  // Adjust point index for new direction
  if (drivingState.direction === -1) {
    drivingState.pointIndex = Math.max(0, drivingState.pointIndex - 1);
  } else {
    drivingState.pointIndex = Math.min(drivingState.currentRoad!.points.length - 2, drivingState.pointIndex + 1);
  }
  
  const roadName = drivingState.currentRoad?.name || 'Unknown road';
  showNotification(`🔄 Turning around on ${roadName}`);
};

const checkForIntersection = (drivingState: DrivingState, roadNetwork: RoadNetwork): void => {
  if (!drivingState.currentRoad) return;
  
  const currentPoint = drivingState.currentRoad.points[drivingState.pointIndex];
  const searchRadius = 25; // Increased search radius for better connectivity
  
  // Find nearby roads
  const allRoads = [roadNetwork.mainRoad, roadNetwork.branchRoad, ...roadNetwork.dynamicRoads];
  const nearbyRoads = allRoads.filter((road, index) => {
    if (road === drivingState.currentRoad) return false;
    if (road.points.length < 2) return false;
    
    // Check if any point on this road is close to current position
    return road.points.some(point => {
      const distance = Math.sqrt(
        Math.pow(point.x - currentPoint.x, 2) +
        Math.pow(point.z - currentPoint.z, 2)
      );
      return distance < searchRadius;
    });
  });
  
  if (nearbyRoads.length > 0 && Math.random() < 0.4) { // 40% chance to turn for better exploration
    const newRoad = nearbyRoads[Math.floor(Math.random() * nearbyRoads.length)];
    const turnDirection = Math.random() < 0.5 ? 'right' : 'left';
    
    // Find closest point on new road and ensure smooth transition
    let closestPoint = 0;
    let minDistance = Infinity;
    
    newRoad.points.forEach((point, index) => {
      const distance = Math.sqrt(
        Math.pow(point.x - currentPoint.x, 2) +
        Math.pow(point.z - currentPoint.z, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        closestPoint = index;
      }
    });
    
    // Ensure we don't start too close to the end of the new road
    if (closestPoint >= newRoad.points.length - 2) {
      closestPoint = Math.max(0, newRoad.points.length - 3);
    }
    
    // Switch to new road
    drivingState.currentRoad = newRoad;
    drivingState.pointIndex = Math.max(0, Math.min(closestPoint, newRoad.points.length - 2));
    drivingState.progress = 0;
    drivingState.direction = 1;
    
    const newRoadName = newRoad.name || 'Unknown road';
    console.log(`🔀 Turning ${turnDirection} onto ${newRoadName}`);
    showNotification(`🔀 Turning ${turnDirection} onto ${newRoadName}`);
  }
};

const showNotification = (message: string): void => {
  // Create notification element
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 15px 25px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    font-size: 18px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
    transition: opacity 0.3s ease;
  `;
  
  document.body.appendChild(notification);
  
  // Fade out and remove after 3 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (document.body.contains(notification)) {
        document.body.removeChild(notification);
      }
    }, 300);
  }, 2700);
};