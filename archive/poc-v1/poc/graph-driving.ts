// Graph-based driving system with proper road network navigation
import * as THREE from 'three';
import { Vector3 } from './types.ts';
import { 
  ConnectedRoadNetwork, 
  RoadSegment, 
  RoadNode,
  getNextSegmentAtNode,
  findNearestNetworkNode,
  debugNetworkConnectivity
} from './road-graph.ts';

export interface GraphDrivingState {
  isActive: boolean;
  speed: number; // km/h
  
  // Graph-based navigation
  network: ConnectedRoadNetwork | null;
  currentSegment: RoadSegment | null;
  currentSegmentId: string | null;
  
  // Position on current segment
  segmentProgress: number; // 0-1 along current segment
  direction: 1 | -1; // 1 = start->end, -1 = end->start
  
  // Node navigation
  targetNodeId: string | null; // Node we're driving towards
  lastNodeId: string | null; // Node we came from
  
  // Timing
  lastIntersectionTime: number;
  
  // Mini-map
  miniMap: MiniMapState | null;
  routeHistory: Vector3[];
}

interface MiniMapState {
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  scale: number;
}

export interface GraphDrivingControls {
  camera: THREE.Camera;
  orbitControls: any;
  scene: THREE.Scene;
}

export const createGraphDrivingState = (): GraphDrivingState => ({
  isActive: false,
  speed: 20,
  network: null,
  currentSegment: null,
  currentSegmentId: null,
  segmentProgress: 0,
  direction: 1,
  targetNodeId: null,
  lastNodeId: null,
  lastIntersectionTime: 0,
  miniMap: null,
  routeHistory: []
});

export const startGraphDriving = (
  drivingState: GraphDrivingState,
  controls: GraphDrivingControls,
  network: ConnectedRoadNetwork
): void => {
  if (drivingState.isActive) {
    stopGraphDriving(drivingState, controls);
    return;
  }
  
  if (!network || network.segments.size === 0) {
    console.error('❌ No connected road network available');
    showNotification('❌ No road network available');
    return;
  }
  
  console.log('🚗 Starting graph-based driving...');
  debugNetworkConnectivity(network);
  
  drivingState.network = network;
  
  // Find nearest network node to camera
  const cameraPosition = controls.camera.position;
  console.log('🔍 Camera position:', cameraPosition);
  console.log('🗺️ Network has', network.nodes.size, 'nodes and', network.segments.size, 'segments');
  
  // Try with increasing search radius
  let nearestNode = findNearestNetworkNode(cameraPosition, network, 100);
  if (!nearestNode) {
    console.log('⚠️ No node found within 100 units, trying 300...');
    nearestNode = findNearestNetworkNode(cameraPosition, network, 300);
  }
  if (!nearestNode) {
    console.log('⚠️ No node found within 300 units, trying 1000...');
    nearestNode = findNearestNetworkNode(cameraPosition, network, 1000);
  }
  
  if (!nearestNode) {
    console.error('❌ No accessible road found near camera at any distance');
    console.log('📍 Available nodes sample:', Array.from(network.nodes.values()).slice(0, 3).map(n => ({ id: n.id, pos: n.position })));
    showNotification('❌ No accessible road found');
    return;
  }
  
  if (nearestNode.connectedRoads.length === 0) {
    console.error('❌ Found node but it has no connected roads:', nearestNode.id);
    showNotification('❌ No accessible road found');
    return;
  }
  
  console.log('✅ Found nearest node:', nearestNode.id, 'with', nearestNode.connectedRoads.length, 'connected roads');
  
  // Pick first connected road segment
  const firstSegmentId = nearestNode.connectedRoads[0];
  const firstSegment = network.segments.get(firstSegmentId);
  
  if (!firstSegment) {
    console.error('❌ Invalid road segment');
    return;
  }
  
  // Initialize driving state
  drivingState.isActive = true;
  drivingState.currentSegment = firstSegment;
  drivingState.currentSegmentId = firstSegmentId;
  
  // Determine direction and target node
  if (firstSegment.startNodeId === nearestNode.id) {
    drivingState.direction = 1; // Start -> End
    drivingState.targetNodeId = firstSegment.endNodeId;
    drivingState.lastNodeId = firstSegment.startNodeId;
  } else {
    drivingState.direction = -1; // End -> Start  
    drivingState.targetNodeId = firstSegment.startNodeId;
    drivingState.lastNodeId = firstSegment.endNodeId;
  }
  
  drivingState.segmentProgress = 0;
  drivingState.lastIntersectionTime = Date.now();
  
  // Disable orbit controls
  if (controls.orbitControls) {
    controls.orbitControls.enabled = false;
  }
  
  // Position camera
  positionCameraOnSegment(drivingState, controls.camera);
  
  // Create mini-map
  createMiniMap(drivingState);
  
  console.log(`✅ Started driving on segment: ${firstSegment.name || 'Unknown'}`);
  console.log(`🎯 Direction: ${drivingState.direction === 1 ? 'Start->End' : 'End->Start'}`);
  console.log(`📍 Target Node: ${drivingState.targetNodeId}`);
  console.log(`🛣️ Segment details:`, {
    segmentId: firstSegment.id,
    points: firstSegment.points.length,
    length: firstSegment.length.toFixed(2),
    startNode: firstSegment.startNodeId,
    endNode: firstSegment.endNodeId
  });
  console.log(`📍 First few points:`, firstSegment.points.slice(0, 3).map(p => `(${p.x.toFixed(1)}, ${p.z.toFixed(1)})`));
  
  showNotification(`🚗 Started driving${firstSegment.name ? ` on ${firstSegment.name}` : ''}`);
};

export const stopGraphDriving = (
  drivingState: GraphDrivingState,
  controls: GraphDrivingControls
): void => {
  console.log('🛑 Stopping graph-based driving...');
  
  drivingState.isActive = false;
  drivingState.network = null;
  drivingState.currentSegment = null;
  drivingState.currentSegmentId = null;
  
  // Remove mini-map
  removeMiniMap(drivingState);
  
  // Re-enable orbit controls
  if (controls.orbitControls) {
    controls.orbitControls.enabled = true;
  }
  
  showNotification('🛑 Drive stopped');
};

export const repositionGraphCar = (
  drivingState: GraphDrivingState,
  controls: GraphDrivingControls
): void => {
  if (!drivingState.isActive || !drivingState.network) {
    console.log('⚠️ Cannot reposition - not in driving mode or no network');
    return;
  }
  
  console.log('🎲 Repositioning to random network location...');
  
  // Get all segments with valid connections
  const validSegments = Array.from(drivingState.network.segments.values())
    .filter(segment => {
      const startNode = drivingState.network!.nodes.get(segment.startNodeId);
      const endNode = drivingState.network!.nodes.get(segment.endNodeId);
      return startNode && endNode && 
             (startNode.connectedRoads.length > 1 || endNode.connectedRoads.length > 1);
    });
  
  if (validSegments.length === 0) {
    console.error('❌ No valid segments for repositioning');
    showNotification('❌ No valid segments found');
    return;
  }
  
  // Select random segment
  const randomSegment = validSegments[Math.floor(Math.random() * validSegments.length)];
  const randomDirection = Math.random() < 0.5 ? 1 : -1;
  
  // Update driving state
  drivingState.currentSegment = randomSegment;
  drivingState.currentSegmentId = randomSegment.id;
  drivingState.direction = randomDirection;
  drivingState.segmentProgress = Math.random() * 0.5; // Start somewhere in first half
  
  if (randomDirection === 1) {
    drivingState.targetNodeId = randomSegment.endNodeId;
    drivingState.lastNodeId = randomSegment.startNodeId;
  } else {
    drivingState.targetNodeId = randomSegment.startNodeId;
    drivingState.lastNodeId = randomSegment.endNodeId;
  }
  
  drivingState.lastIntersectionTime = Date.now();
  
  // Position camera
  positionCameraOnSegment(drivingState, controls.camera);
  
  console.log(`✅ Repositioned to: ${randomSegment.name || 'Unknown road'}`);
  showNotification(`🎯 Repositioned${randomSegment.name ? ` on ${randomSegment.name}` : ''}`);
};

export const updateGraphDriving = (
  drivingState: GraphDrivingState,
  controls: GraphDrivingControls,
  deltaTime: number
): void => {
  if (!drivingState.isActive || !drivingState.currentSegment || !drivingState.network) {
    return;
  }
  
  // Convert speed to progress per second
  const speedUnitsPerSecond = (drivingState.speed * 1000) / 3600; // km/h to m/s
  const segmentLength = drivingState.currentSegment.length;
  const progressPerSecond = speedUnitsPerSecond / segmentLength;
  const deltaProgress = progressPerSecond * deltaTime * drivingState.direction;
  
  // Debug logging
  if (Math.random() < 0.01) { // Log occasionally to avoid spam
    console.log(`🚗 Driving update:`, {
      speed: drivingState.speed,
      deltaTime: deltaTime.toFixed(3),
      segmentLength: segmentLength.toFixed(1),
      progressPerSecond: progressPerSecond.toFixed(4),
      deltaProgress: deltaProgress.toFixed(4),
      currentProgress: drivingState.segmentProgress.toFixed(3)
    });
  }
  
  // Update progress along current segment
  drivingState.segmentProgress += deltaProgress;
  
  // Check if we've reached the end of current segment
  if (drivingState.segmentProgress >= 1.0 || drivingState.segmentProgress <= 0) {
    console.log(`🏁 Reached segment end: progress=${drivingState.segmentProgress.toFixed(3)}`);
    handleNodeReached(drivingState, controls);
  } else {
    // Normal driving along segment
    positionCameraOnSegment(drivingState, controls.camera);
    
    // Update mini-map with current position
    if (drivingState.miniMap) {
      const currentPos = controls.camera.position;
      updateMiniMap(drivingState, { x: currentPos.x, y: currentPos.y, z: currentPos.z });
    }
  }
};

const handleNodeReached = (
  drivingState: GraphDrivingState,
  controls: GraphDrivingControls
): void => {
  if (!drivingState.network || !drivingState.targetNodeId) return;
  
  console.log(`🏁 Reached node: ${drivingState.targetNodeId}`);
  
  const targetNode = drivingState.network.nodes.get(drivingState.targetNodeId);
  if (!targetNode) {
    console.error('❌ Invalid target node');
    return;
  }
  
  // Find next segment (exclude the one we came from)
  const possibleSegments = targetNode.connectedRoads
    .filter(segmentId => segmentId !== drivingState.currentSegmentId)
    .map(segmentId => drivingState.network!.segments.get(segmentId))
    .filter(segment => segment !== undefined) as RoadSegment[];
  
  if (possibleSegments.length === 0) {
    // Dead end - turn around
    console.log('🔄 Dead end reached, turning around...');
    drivingState.direction *= -1;
    drivingState.segmentProgress = Math.max(0, Math.min(1, 1 - drivingState.segmentProgress));
    
    // Swap target and last node
    const temp = drivingState.targetNodeId;
    drivingState.targetNodeId = drivingState.lastNodeId;
    drivingState.lastNodeId = temp;
    
    const roadName = drivingState.currentSegment?.name || 'Unknown road';
    showNotification(`🔄 Turning around on ${roadName}`);
    
    positionCameraOnSegment(drivingState, controls.camera);
    return;
  }
  
  // Select next segment (random for now, could be smarter)
  const nextSegment = possibleSegments[Math.floor(Math.random() * possibleSegments.length)];
  const currentRoadName = drivingState.currentSegment?.name || 'Unknown road';
  const nextRoadName = nextSegment.name || 'Unknown road';
  
  // Determine direction on next segment
  let newDirection: 1 | -1;
  let newTargetNodeId: string;
  
  if (nextSegment.startNodeId === drivingState.targetNodeId) {
    // Enter segment from start, go toward end
    newDirection = 1;
    newTargetNodeId = nextSegment.endNodeId;
  } else {
    // Enter segment from end, go toward start
    newDirection = -1;
    newTargetNodeId = nextSegment.startNodeId;
  }
  
  // Update driving state for next segment
  drivingState.currentSegment = nextSegment;
  drivingState.currentSegmentId = nextSegment.id;
  drivingState.lastNodeId = drivingState.targetNodeId;
  drivingState.targetNodeId = newTargetNodeId;
  drivingState.direction = newDirection;
  drivingState.segmentProgress = 0;
  drivingState.lastIntersectionTime = Date.now();
  
  // Show turn notification
  if (currentRoadName !== nextRoadName) {
    const turnDirection = Math.random() < 0.5 ? 'left' : 'right'; // Could calculate actual turn direction
    console.log(`🔀 Turning ${turnDirection} from "${currentRoadName}" to "${nextRoadName}"`);
    showNotification(`🔀 Turning ${turnDirection} onto ${nextRoadName}`);
  } else {
    console.log(`➡️ Continuing on ${nextRoadName}`);
    showNotification(`➡️ Continuing on ${nextRoadName}`);
  }
  
  positionCameraOnSegment(drivingState, controls.camera);
};

const positionCameraOnSegment = (
  drivingState: GraphDrivingState,
  camera: THREE.Camera
): void => {
  if (!drivingState.currentSegment) return;
  
  const segment = drivingState.currentSegment;
  const points = segment.points;
  
  if (points.length < 2) return;
  
  // Calculate position along segment
  let progress = drivingState.segmentProgress;
  if (drivingState.direction === -1) {
    progress = 1 - progress; // Reverse direction
  }
  
  // Find which two points we're between
  const segmentIndex = Math.min(Math.floor(progress * (points.length - 1)), points.length - 2);
  const localProgress = (progress * (points.length - 1)) - segmentIndex;
  
  const currentPoint = points[segmentIndex];
  const nextPoint = points[segmentIndex + 1];
  
  // Interpolate position
  const position = {
    x: currentPoint.x + (nextPoint.x - currentPoint.x) * localProgress,
    y: currentPoint.y + (nextPoint.y - currentPoint.y) * localProgress + 1.8, // Car height
    z: currentPoint.z + (nextPoint.z - currentPoint.z) * localProgress
  };
  
  // Calculate forward direction based on segment direction
  let forwardDirection: Vector3;
  
  if (drivingState.direction === 1) {
    // Moving from start to end of segment
    forwardDirection = {
      x: nextPoint.x - currentPoint.x,
      y: 0,
      z: nextPoint.z - currentPoint.z
    };
  } else {
    // Moving from end to start of segment
    forwardDirection = {
      x: currentPoint.x - nextPoint.x,
      y: 0,
      z: currentPoint.z - nextPoint.z
    };
  }
  
  // Normalize direction
  const length = Math.sqrt(forwardDirection.x * forwardDirection.x + forwardDirection.z * forwardDirection.z);
  if (length > 0) {
    forwardDirection.x /= length;
    forwardDirection.z /= length;
  } else {
    // Fallback direction if points are too close
    forwardDirection = { x: 0, y: 0, z: 1 };
  }
  
  // Set camera position
  camera.position.set(position.x, position.y, position.z);
  
  // Set camera to look in the forward direction
  const lookAtTarget = {
    x: position.x + forwardDirection.x * 10,
    y: position.y,
    z: position.z + forwardDirection.z * 10
  };
  
  camera.lookAt(lookAtTarget.x, lookAtTarget.y, lookAtTarget.z);
  
  // Debug direction occasionally
  if (Math.random() < 0.01) {
    console.log(`🧭 Camera direction:`, {
      segmentIndex,
      progress: progress.toFixed(3),
      direction: drivingState.direction,
      forwardDir: `(${forwardDirection.x.toFixed(2)}, ${forwardDirection.z.toFixed(2)})`,
      currentPoint: `(${currentPoint.x.toFixed(1)}, ${currentPoint.z.toFixed(1)})`,
      nextPoint: `(${nextPoint.x.toFixed(1)}, ${nextPoint.z.toFixed(1)})`
    });
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

const createMiniMap = (drivingState: GraphDrivingState): void => {
  if (!drivingState.network) return;
  
  // Create canvas element
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  canvas.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    border: 3px solid #333;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.9);
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  `;
  
  const context = canvas.getContext('2d')!;
  
  // Calculate bounds from network
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  
  for (const segment of drivingState.network.segments.values()) {
    for (const point of segment.points) {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    }
  }
  
  // Add padding
  const padding = (maxX - minX) * 0.1;
  minX -= padding;
  maxX += padding;
  minZ -= padding;
  maxZ += padding;
  
  const bounds = { minX, maxX, minZ, maxZ };
  const scale = Math.min(canvas.width / (maxX - minX), canvas.height / (maxZ - minZ));
  
  drivingState.miniMap = {
    canvas,
    context,
    bounds,
    scale
  };
  
  // Add to DOM
  document.body.appendChild(canvas);
  
  // Draw initial road network
  drawRoadNetwork(drivingState);
  
  console.log('🗺️ Mini-map created');
};

const removeMiniMap = (drivingState: GraphDrivingState): void => {
  if (drivingState.miniMap) {
    if (document.body.contains(drivingState.miniMap.canvas)) {
      document.body.removeChild(drivingState.miniMap.canvas);
    }
    drivingState.miniMap = null;
    drivingState.routeHistory = [];
    console.log('🗺️ Mini-map removed');
  }
};

const drawRoadNetwork = (drivingState: GraphDrivingState): void => {
  if (!drivingState.miniMap || !drivingState.network) return;
  
  const { context, bounds, scale, canvas } = drivingState.miniMap;
  
  // Clear canvas
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw white background
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Function to convert world coordinates to canvas coordinates
  const worldToCanvas = (worldX: number, worldZ: number) => ({
    x: (worldX - bounds.minX) * scale,
    y: canvas.height - (worldZ - bounds.minZ) * scale
  });
  
  // Draw all road segments
  context.strokeStyle = '#cccccc';
  context.lineWidth = 1;
  
  for (const segment of drivingState.network.segments.values()) {
    if (segment.points.length < 2) continue;
    
    context.beginPath();
    const firstPoint = worldToCanvas(segment.points[0].x, segment.points[0].z);
    context.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < segment.points.length; i++) {
      const point = worldToCanvas(segment.points[i].x, segment.points[i].z);
      context.lineTo(point.x, point.y);
    }
    
    context.stroke();
  }
  
  // Highlight current segment
  if (drivingState.currentSegment) {
    context.strokeStyle = '#0066ff';
    context.lineWidth = 3;
    context.beginPath();
    
    const firstPoint = worldToCanvas(drivingState.currentSegment.points[0].x, drivingState.currentSegment.points[0].z);
    context.moveTo(firstPoint.x, firstPoint.y);
    
    for (let i = 1; i < drivingState.currentSegment.points.length; i++) {
      const point = worldToCanvas(drivingState.currentSegment.points[i].x, drivingState.currentSegment.points[i].z);
      context.lineTo(point.x, point.y);
    }
    
    context.stroke();
  }
};

const updateMiniMap = (drivingState: GraphDrivingState, currentPosition: Vector3): void => {
  if (!drivingState.miniMap) return;
  
  // Add current position to route history
  drivingState.routeHistory.push({ ...currentPosition });
  
  // Limit history to prevent memory issues
  if (drivingState.routeHistory.length > 500) {
    drivingState.routeHistory = drivingState.routeHistory.slice(-400);
  }
  
  // Redraw the network
  drawRoadNetwork(drivingState);
  
  const { context, bounds, scale, canvas } = drivingState.miniMap;
  
  // Function to convert world coordinates to canvas coordinates
  const worldToCanvas = (worldX: number, worldZ: number) => ({
    x: (worldX - bounds.minX) * scale,
    y: canvas.height - (worldZ - bounds.minZ) * scale
  });
  
  // Draw route history as a trail
  if (drivingState.routeHistory.length > 1) {
    context.strokeStyle = '#ff6600';
    context.lineWidth = 2;
    context.beginPath();
    
    const firstPos = worldToCanvas(drivingState.routeHistory[0].x, drivingState.routeHistory[0].z);
    context.moveTo(firstPos.x, firstPos.y);
    
    for (let i = 1; i < drivingState.routeHistory.length; i++) {
      const pos = worldToCanvas(drivingState.routeHistory[i].x, drivingState.routeHistory[i].z);
      context.lineTo(pos.x, pos.y);
    }
    
    context.stroke();
  }
  
  // Draw current position as a dot
  const currentPos = worldToCanvas(currentPosition.x, currentPosition.z);
  context.fillStyle = '#ff0000';
  context.beginPath();
  context.arc(currentPos.x, currentPos.y, 4, 0, Math.PI * 2);
  context.fill();
  
  // Draw direction arrow
  if (drivingState.currentSegment && drivingState.currentSegment.points.length >= 2) {
    const segment = drivingState.currentSegment;
    const progress = drivingState.segmentProgress;
    const direction = drivingState.direction;
    
    let adjustedProgress = progress;
    if (direction === -1) {
      adjustedProgress = 1 - progress;
    }
    
    const segmentIndex = Math.min(Math.floor(adjustedProgress * (segment.points.length - 1)), segment.points.length - 2);
    const currentPoint = segment.points[segmentIndex];
    const nextPoint = segment.points[segmentIndex + 1];
    
    let dirX: number, dirZ: number;
    if (direction === 1) {
      dirX = nextPoint.x - currentPoint.x;
      dirZ = nextPoint.z - currentPoint.z;
    } else {
      dirX = currentPoint.x - nextPoint.x;
      dirZ = currentPoint.z - nextPoint.z;
    }
    
    const length = Math.sqrt(dirX * dirX + dirZ * dirZ);
    if (length > 0) {
      dirX /= length;
      dirZ /= length;
      
      // Draw arrow
      context.strokeStyle = '#ff0000';
      context.lineWidth = 2;
      context.beginPath();
      
      const arrowLength = 10;
      const arrowEndX = currentPos.x + dirX * arrowLength;
      const arrowEndY = currentPos.y - dirZ * arrowLength; // Note: canvas Y is flipped
      
      context.moveTo(currentPos.x, currentPos.y);
      context.lineTo(arrowEndX, arrowEndY);
      
      // Arrow head
      const arrowHeadLength = 4;
      const angle = Math.atan2(-dirZ, dirX);
      
      context.lineTo(
        arrowEndX - arrowHeadLength * Math.cos(angle - Math.PI / 6),
        arrowEndY - arrowHeadLength * Math.sin(angle - Math.PI / 6)
      );
      
      context.moveTo(arrowEndX, arrowEndY);
      context.lineTo(
        arrowEndX - arrowHeadLength * Math.cos(angle + Math.PI / 6),
        arrowEndY - arrowHeadLength * Math.sin(angle + Math.PI / 6)
      );
      
      context.stroke();
    }
  }
};