// Interactive UI elements
import * as THREE from 'three';
import { Entity, RoadNetwork, POCScene, TerrainData } from './types.ts';
import { generateRandomRoadPosition } from './placement.ts';
import { createPedestrianEntity, createCarEntity, addEntityToScene, removeEntityFromScene } from './entities.ts';
import { generateConnectedRoad, createRoadGeometry, createRoadEdgeLines } from './roads.ts';
import { regenerateTerrainWithBumpiness, updateAllRoadsForTerrain } from './terrain.ts';
import { fetchOSMData, convertOSMToKinopticon, haldenBounds } from './osm.ts';
import { createStreetLabels, addLabelsToScene, removeLabelsFromScene, updateStreetLabelPositions, StreetLabel } from './labels.ts';
import { createGraphDrivingState, startGraphDriving, stopGraphDriving, updateGraphDriving, repositionGraphCar, GraphDrivingState, GraphDrivingControls } from './graph-driving.ts';
import { createDrivingState, startDriving, stopDriving, updateDriving, repositionCar, DrivingState, DrivingControls } from './driving.ts';
import { createConnectedRoadNetwork, convertNetworkToRoadPaths, ConnectedRoadNetwork } from './road-graph.ts';

export interface ControlState {
  pedestrianCount: number;
  dynamicPedestrians: Entity[];
  carCount: number;
  dynamicCars: Entity[];
  roadCount: number;
  dynamicRoads: THREE.Mesh[];
  roadLength: number;
  terrainBumpiness: number;
  osmMode: boolean;
  originalRoads: RoadNetwork | null;
  osmRoads: RoadNetwork | null;
  streetLabels: StreetLabel[];
  drivingState: DrivingState;
  graphDrivingState: GraphDrivingState;
  connectedNetwork: ConnectedRoadNetwork | null;
}

export const createControlState = (): ControlState => ({
  pedestrianCount: 0,
  dynamicPedestrians: [],
  carCount: 0,
  dynamicCars: [],
  roadCount: 0,
  dynamicRoads: [],
  roadLength: 200,
  terrainBumpiness: 50,
  osmMode: false,
  originalRoads: null,
  osmRoads: null,
  streetLabels: [],
  drivingState: createDrivingState(),
  graphDrivingState: createGraphDrivingState(),
  connectedNetwork: null
});

export const createAllSliders = (): HTMLElement => {
  const container = document.createElement('div');
  container.style.cssText = `
    position: absolute;
    top: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 15px;
    border-radius: 8px;
    font-family: Arial, sans-serif;
    z-index: 1000;
  `;
  
  // Pedestrian slider
  const pedContainer = document.createElement('div');
  pedContainer.style.cssText = 'margin-bottom: 12px;';
  
  const pedLabel = document.createElement('label');
  pedLabel.textContent = 'Pedestrians: ';
  pedLabel.style.cssText = 'display: inline-block; width: 100px; font-size: 14px;';
  
  const pedSlider = document.createElement('input');
  pedSlider.type = 'range';
  pedSlider.id = 'pedestrian-slider';
  pedSlider.min = '0';
  pedSlider.max = '500';
  pedSlider.value = '0';
  pedSlider.style.cssText = 'width: 150px; margin-right: 10px;';
  
  const pedValue = document.createElement('span');
  pedValue.id = 'pedestrian-value';
  pedValue.textContent = '0';
  pedValue.style.cssText = 'font-weight: bold; width: 30px; display: inline-block;';
  
  pedContainer.appendChild(pedLabel);
  pedContainer.appendChild(pedSlider);
  pedContainer.appendChild(pedValue);
  
  // Car slider
  const carContainer = document.createElement('div');
  carContainer.style.cssText = 'margin-bottom: 12px;';
  
  const carLabel = document.createElement('label');
  carLabel.textContent = 'Cars: ';
  carLabel.style.cssText = 'display: inline-block; width: 100px; font-size: 14px;';
  
  const carSlider = document.createElement('input');
  carSlider.type = 'range';
  carSlider.id = 'car-slider';
  carSlider.min = '0';
  carSlider.max = '300';
  carSlider.value = '0';
  carSlider.style.cssText = 'width: 150px; margin-right: 10px;';
  
  const carValue = document.createElement('span');
  carValue.id = 'car-value';
  carValue.textContent = '0';
  carValue.style.cssText = 'font-weight: bold; width: 30px; display: inline-block;';
  
  carContainer.appendChild(carLabel);
  carContainer.appendChild(carSlider);
  carContainer.appendChild(carValue);
  
  // Road slider
  const roadContainer = document.createElement('div');
  roadContainer.style.cssText = 'margin-bottom: 12px;';
  
  const roadLabel = document.createElement('label');
  roadLabel.textContent = 'Extra Roads: ';
  roadLabel.style.cssText = 'display: inline-block; width: 100px; font-size: 14px;';
  
  const roadSlider = document.createElement('input');
  roadSlider.type = 'range';
  roadSlider.id = 'road-slider';
  roadSlider.min = '0';
  roadSlider.max = '5';
  roadSlider.value = '0';
  roadSlider.style.cssText = 'width: 150px; margin-right: 10px;';
  
  const roadValue = document.createElement('span');
  roadValue.id = 'road-value';
  roadValue.textContent = '0';
  roadValue.style.cssText = 'font-weight: bold; width: 30px; display: inline-block;';
  
  roadContainer.appendChild(roadLabel);
  roadContainer.appendChild(roadSlider);
  roadContainer.appendChild(roadValue);
  
  // Road length slider
  const lengthContainer = document.createElement('div');
  
  const lengthLabel = document.createElement('label');
  lengthLabel.textContent = 'Road Length: ';
  lengthLabel.style.cssText = 'display: inline-block; width: 100px; font-size: 14px;';
  
  const lengthSlider = document.createElement('input');
  lengthSlider.type = 'range';
  lengthSlider.id = 'length-slider';
  lengthSlider.min = '100';
  lengthSlider.max = '400';
  lengthSlider.value = '200';
  lengthSlider.step = '50';
  lengthSlider.style.cssText = 'width: 150px; margin-right: 10px;';
  
  const lengthValue = document.createElement('span');
  lengthValue.id = 'length-value';
  lengthValue.textContent = '200m';
  lengthValue.style.cssText = 'font-weight: bold; width: 30px; display: inline-block;';
  
  lengthContainer.appendChild(lengthLabel);
  lengthContainer.appendChild(lengthSlider);
  lengthContainer.appendChild(lengthValue);
  
  // Terrain bumpiness slider
  const bumpContainer = document.createElement('div');
  
  const bumpLabel = document.createElement('label');
  bumpLabel.textContent = 'Terrain Bumps: ';
  bumpLabel.style.cssText = 'display: inline-block; width: 100px; font-size: 14px;';
  
  const bumpSlider = document.createElement('input');
  bumpSlider.type = 'range';
  bumpSlider.id = 'bump-slider';
  bumpSlider.min = '0';
  bumpSlider.max = '100';
  bumpSlider.value = '50';
  bumpSlider.step = '10';
  bumpSlider.style.cssText = 'width: 150px; margin-right: 10px;';
  
  const bumpValue = document.createElement('span');
  bumpValue.id = 'bump-value';
  bumpValue.textContent = '50';
  bumpValue.style.cssText = 'font-weight: bold; width: 30px; display: inline-block;';
  
  bumpContainer.appendChild(bumpLabel);
  bumpContainer.appendChild(bumpSlider);
  bumpContainer.appendChild(bumpValue);
  
  // OSM toggle button
  const osmContainer = document.createElement('div');
  osmContainer.style.cssText = 'margin-top: 20px; padding-top: 15px; border-top: 1px solid #444;';
  
  const osmButton = document.createElement('button');
  osmButton.id = 'osm-toggle';
  osmButton.textContent = 'Load Halden OSM Roads';
  osmButton.style.cssText = `
    background: #0066cc;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
  `;
  
  const osmStatus = document.createElement('div');
  osmStatus.id = 'osm-status';
  osmStatus.textContent = 'Using Procedural Roads';
  osmStatus.style.cssText = 'font-size: 11px; margin-top: 5px; color: #aaa;';
  
  osmContainer.appendChild(osmButton);
  osmContainer.appendChild(osmStatus);
  
  // Driving controls container
  const driveContainer = document.createElement('div');
  driveContainer.style.cssText = 'margin-top: 20px; padding-top: 15px; border-top: 1px solid #444;';
  
  // Drive button
  const driveButton = document.createElement('button');
  driveButton.id = 'drive-button';
  driveButton.textContent = 'Start Drive';
  driveButton.style.cssText = `
    background: #00cc66;
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: bold;
    cursor: pointer;
    width: 100%;
    margin-bottom: 10px;
  `;
  
  // Speed slider
  const speedContainer = document.createElement('div');
  speedContainer.style.cssText = 'margin-bottom: 12px;';
  
  const speedLabel = document.createElement('label');
  speedLabel.textContent = 'Speed: ';
  speedLabel.style.cssText = 'display: inline-block; width: 100px; font-size: 14px;';
  
  const speedSlider = document.createElement('input');
  speedSlider.type = 'range';
  speedSlider.id = 'speed-slider';
  speedSlider.min = '5';
  speedSlider.max = '80';
  speedSlider.value = '20';
  speedSlider.step = '5';
  speedSlider.style.cssText = 'width: 150px; margin-right: 10px;';
  
  const speedValue = document.createElement('span');
  speedValue.id = 'speed-value';
  speedValue.textContent = '20 km/h';
  speedValue.style.cssText = 'font-weight: bold; width: 60px; display: inline-block;';
  
  speedContainer.appendChild(speedLabel);
  speedContainer.appendChild(speedSlider);
  speedContainer.appendChild(speedValue);
  
  // Reposition button
  const repositionButton = document.createElement('button');
  repositionButton.id = 'reposition-button';
  repositionButton.textContent = 'Reposition';
  repositionButton.style.cssText = `
    background: #0099ff;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
    margin-top: 5px;
  `;
  
  driveContainer.appendChild(driveButton);
  driveContainer.appendChild(speedContainer);
  driveContainer.appendChild(repositionButton);
  
  // Line network toggle button
  const lineNetworkContainer = document.createElement('div');
  lineNetworkContainer.style.cssText = 'margin-top: 10px;';
  
  const lineNetworkButton = document.createElement('button');
  lineNetworkButton.id = 'line-network-toggle';
  lineNetworkButton.textContent = 'Show Line Network Only';
  lineNetworkButton.style.cssText = `
    background: #cc6600;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 12px;
    cursor: pointer;
    width: 100%;
  `;
  
  lineNetworkContainer.appendChild(lineNetworkButton);
  driveContainer.appendChild(lineNetworkContainer);
  
  container.appendChild(pedContainer);
  container.appendChild(carContainer);
  container.appendChild(roadContainer);
  container.appendChild(lengthContainer);
  container.appendChild(bumpContainer);
  container.appendChild(osmContainer);
  container.appendChild(driveContainer);
  
  return container;
};

export const updatePedestrianCount = (
  newCount: number,
  controlState: ControlState,
  pocScene: POCScene
): void => {
  const currentCount = controlState.dynamicPedestrians.length;
  
  if (newCount > currentCount) {
    for (let i = currentCount; i < newCount; i++) {
      const position = generateRandomRoadPosition(pocScene.roads);
      const pedestrian = createPedestrianEntity(position);
      addEntityToScene(pedestrian, pocScene.scene);
      controlState.dynamicPedestrians.push(pedestrian);
    }
  } else if (newCount < currentCount) {
    for (let i = currentCount - 1; i >= newCount; i--) {
      const pedestrian = controlState.dynamicPedestrians[i];
      removeEntityFromScene(pedestrian, pocScene.scene);
      controlState.dynamicPedestrians.pop();
    }
  }
  
  controlState.pedestrianCount = newCount;
};

export const updateCarCount = (
  newCount: number,
  controlState: ControlState,
  pocScene: POCScene
): void => {
  const currentCount = controlState.dynamicCars.length;
  
  if (newCount > currentCount) {
    for (let i = currentCount; i < newCount; i++) {
      const position = generateRandomRoadPosition(pocScene.roads);
      const car = createCarEntity(position);
      addEntityToScene(car, pocScene.scene);
      controlState.dynamicCars.push(car);
    }
  } else if (newCount < currentCount) {
    for (let i = currentCount - 1; i >= newCount; i--) {
      const car = controlState.dynamicCars[i];
      removeEntityFromScene(car, pocScene.scene);
      controlState.dynamicCars.pop();
    }
  }
  
  controlState.carCount = newCount;
};

export const updateRoadLengths = (
  newLength: number,
  controlState: ControlState,
  pocScene: POCScene
): void => {
  // Update each dynamic road's length
  for (let i = 0; i < pocScene.roads.dynamicRoads.length; i++) {
    const roadPath = pocScene.roads.dynamicRoads[i];
    if (roadPath.points.length < 2) continue;
    
    // Get the connection point (first point) and overall direction
    const startPoint = roadPath.points[0];
    const lastPoint = roadPath.points[roadPath.points.length - 1];
    
    // Calculate the overall direction from start to end
    const totalDx = lastPoint.x - startPoint.x;
    const totalDz = lastPoint.z - startPoint.z;
    const originalLength = Math.sqrt(totalDx * totalDx + totalDz * totalDz);
    
    // Normalize to get unit direction (preserves exact angle)
    const directionX = originalLength > 0 ? totalDx / originalLength : 0;
    const directionZ = originalLength > 0 ? totalDz / originalLength : 0;
    
    // Calculate scale factor to preserve any curves
    const scaleFactor = newLength / roadPath.length;
    
    // Rebuild the road with new length, preserving relative positions
    const segments = Math.floor(newLength / 40);
    const newPoints = [startPoint];
    
    for (let j = 1; j <= segments; j++) {
      const progress = j / segments;
      const distance = progress * newLength;
      
      // Simple linear extension along the original direction
      const x = startPoint.x + distance * directionX;
      const z = startPoint.z + distance * directionZ;
      const y = pocScene.terrain.heightmap 
        ? sampleTerrainHeight(pocScene.terrain.heightmap, x, z, pocScene.terrain.worldSize) + 3
        : startPoint.y;
      
      newPoints.push({ x, y, z });
    }
    
    // Update the road path
    roadPath.points = newPoints;
    roadPath.length = newLength;
    
    // Update the mesh geometry
    if (controlState.dynamicRoads[i]) {
      const mesh = controlState.dynamicRoads[i];
      pocScene.scene.remove(mesh);
      mesh.geometry.dispose();
      
      // Create new geometry with updated points
      const newGeometry = createRoadGeometry(roadPath);
      const newMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x777777,
        side: THREE.DoubleSide
      });
      const newMesh = new THREE.Mesh(newGeometry, newMaterial);
      
      pocScene.scene.add(newMesh);
      controlState.dynamicRoads[i] = newMesh;
    }
  }
  
  // Update allPoints array
  pocScene.roads.allPoints = [
    ...pocScene.roads.mainRoad.points,
    ...pocScene.roads.branchRoad.points
  ];
  
  for (const dynamicRoad of pocScene.roads.dynamicRoads) {
    pocScene.roads.allPoints.push(...dynamicRoad.points);
  }
};

// Helper function for terrain height sampling
const sampleTerrainHeight = (
  heightmap: number[][],
  worldX: number,
  worldZ: number,
  worldSize: number
): number => {
  const size = heightmap.length;
  const x = Math.floor((worldX + worldSize / 2) / worldSize * size);
  const z = Math.floor((worldZ + worldSize / 2) / worldSize * size);
  
  if (x >= 0 && x < size && z >= 0 && z < size && heightmap[x] && heightmap[x][z] !== undefined) {
    return heightmap[x][z];
  }
  return 0;
};

export const updateRoadCount = (
  newCount: number,
  controlState: ControlState,
  pocScene: POCScene
): void => {
  const currentCount = controlState.dynamicRoads.length;
  
  if (newCount > currentCount) {
    for (let i = currentCount; i < newCount; i++) {
      // Generate a connected road
      const newRoadPath = generateConnectedRoad(
        pocScene.roads,
        pocScene.terrain,
        controlState.roadLength
      );
      
      // Add the new road path to the network
      pocScene.roads.dynamicRoads.push(newRoadPath);
      pocScene.roads.allPoints.push(...newRoadPath.points);
      
      // Create geometry for the new road
      const roadGeometry = createRoadGeometry(newRoadPath);
      const roadMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x777777,
        side: THREE.DoubleSide
      });
      const roadMesh = new THREE.Mesh(roadGeometry, roadMaterial);
      
      pocScene.scene.add(roadMesh);
      controlState.dynamicRoads.push(roadMesh);
    }
  } else if (newCount < currentCount) {
    for (let i = currentCount - 1; i >= newCount; i--) {
      // Remove road from scene
      const road = controlState.dynamicRoads[i];
      pocScene.scene.remove(road);
      road.geometry.dispose();
      if (road.material instanceof THREE.Material) {
        road.material.dispose();
      }
      controlState.dynamicRoads.pop();
      
      // Remove road from network
      const removedPath = pocScene.roads.dynamicRoads.pop();
      if (removedPath) {
        // Remove points from allPoints array
        const pointsToRemove = removedPath.points.length;
        pocScene.roads.allPoints.splice(-pointsToRemove, pointsToRemove);
      }
    }
  }
  
  controlState.roadCount = newCount;
};

export const updateTerrainBumpiness = (
  newBumpiness: number,
  controlState: ControlState,
  pocScene: POCScene
): void => {
  console.log('🏔️ Updating terrain bumpiness to:', newBumpiness, 'OSM mode:', controlState.osmMode);
  
  // Update terrain heightmap and geometry
  regenerateTerrainWithBumpiness(pocScene.terrain, newBumpiness);
  
  // Update all roads to follow new terrain
  updateAllRoadsForTerrain(pocScene.roads, pocScene.terrain);
  
  // If in OSM mode, also update stored OSM roads
  if (controlState.osmMode && controlState.osmRoads) {
    updateAllRoadsForTerrain(controlState.osmRoads, pocScene.terrain);
  }
  
  // Clear all existing road meshes
  clearAllRoadMeshes(pocScene, controlState);
  
  if (controlState.osmMode) {
    // Recreate OSM road meshes with updated heights
    console.log('🗺️ Recreating OSM roads with new terrain heights');
    createOSMRoadMeshes(pocScene.roads, pocScene, controlState);
  } else {
    // Recreate procedural road meshes
    console.log('🛣️ Recreating procedural roads with new terrain heights');
    const roadMaterial = new THREE.MeshBasicMaterial({ 
      color: 0x555555,
      side: THREE.DoubleSide
    });
    
    // Add new road meshes
    if (pocScene.roads.mainRoad.points.length > 1) {
      const mainRoadGeometry = createRoadGeometry(pocScene.roads.mainRoad);
      const mainRoadMesh = new THREE.Mesh(mainRoadGeometry, roadMaterial);
      pocScene.scene.add(mainRoadMesh);
      createRoadEdgeLines(pocScene.roads.mainRoad, pocScene.scene);
    }
    
    if (pocScene.roads.branchRoad.points.length > 1) {
      const branchRoadGeometry = createRoadGeometry(pocScene.roads.branchRoad);
      const branchRoadMesh = new THREE.Mesh(branchRoadGeometry, roadMaterial);
      pocScene.scene.add(branchRoadMesh);
      createRoadEdgeLines(pocScene.roads.branchRoad, pocScene.scene);
    }
    
    // Update dynamic roads
    for (let i = 0; i < pocScene.roads.dynamicRoads.length; i++) {
      const roadPath = pocScene.roads.dynamicRoads[i];
      if (roadPath.points.length > 1) {
        const newGeometry = createRoadGeometry(roadPath);
        const dynamicMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x777777,
          side: THREE.DoubleSide
        });
        const newMesh = new THREE.Mesh(newGeometry, dynamicMaterial);
        
        pocScene.scene.add(newMesh);
        controlState.dynamicRoads.push(newMesh);
        createRoadEdgeLines(roadPath, pocScene.scene);
      }
    }
  }
  
  // Update entity positions to match new terrain
  const allEntities = [...controlState.dynamicPedestrians, ...controlState.dynamicCars];
  allEntities.forEach(entity => {
    const newHeight = sampleTerrainHeight(pocScene.terrain.heightmap, entity.position.x, entity.position.z, pocScene.terrain.worldSize);
    entity.position.y = newHeight + (entity.type === 'car' ? 3 : 2);
    entity.mesh.position.y = entity.position.y + (entity.type === 'car' ? 0.9 : 1.5);
  });
  
  
  console.log('✅ Terrain bumpiness update complete');
};

export const setupAllSliderListeners = (
  sliderContainer: HTMLElement,
  controlState: ControlState,
  pocScene: POCScene,
  camera?: THREE.Camera,
  orbitControls?: any
): void => {
  // Pedestrian slider
  const pedSlider = sliderContainer.querySelector('#pedestrian-slider') as HTMLInputElement;
  const pedValue = sliderContainer.querySelector('#pedestrian-value') as HTMLSpanElement;
  
  if (pedSlider && pedValue) {
    pedSlider.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const newCount = parseInt(target.value, 10);
      pedValue.textContent = newCount.toString();
      updatePedestrianCount(newCount, controlState, pocScene);
    });
  }
  
  // Car slider
  const carSlider = sliderContainer.querySelector('#car-slider') as HTMLInputElement;
  const carValue = sliderContainer.querySelector('#car-value') as HTMLSpanElement;
  
  if (carSlider && carValue) {
    carSlider.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const newCount = parseInt(target.value, 10);
      carValue.textContent = newCount.toString();
      updateCarCount(newCount, controlState, pocScene);
    });
  }
  
  // Road slider
  const roadSlider = sliderContainer.querySelector('#road-slider') as HTMLInputElement;
  const roadValue = sliderContainer.querySelector('#road-value') as HTMLSpanElement;
  
  if (roadSlider && roadValue) {
    roadSlider.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const newCount = parseInt(target.value, 10);
      roadValue.textContent = newCount.toString();
      updateRoadCount(newCount, controlState, pocScene);
    });
  }
  
  // Road length slider
  const lengthSlider = sliderContainer.querySelector('#length-slider') as HTMLInputElement;
  const lengthValue = sliderContainer.querySelector('#length-value') as HTMLSpanElement;
  
  if (lengthSlider && lengthValue) {
    lengthSlider.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const newLength = parseInt(target.value, 10);
      lengthValue.textContent = `${newLength}m`;
      controlState.roadLength = newLength;
      
      // Update lengths of existing dynamic roads
      updateRoadLengths(newLength, controlState, pocScene);
    });
  }
  
  // Terrain bumpiness slider
  const bumpSlider = sliderContainer.querySelector('#bump-slider') as HTMLInputElement;
  const bumpValue = sliderContainer.querySelector('#bump-value') as HTMLSpanElement;
  
  if (bumpSlider && bumpValue) {
    bumpSlider.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const newBumpiness = parseInt(target.value, 10);
      bumpValue.textContent = newBumpiness.toString();
      controlState.terrainBumpiness = newBumpiness;
      
      // Update terrain and all roads
      updateTerrainBumpiness(newBumpiness, controlState, pocScene);
    });
  }
  
  // OSM toggle button
  const osmButton = sliderContainer.querySelector('#osm-toggle') as HTMLButtonElement;
  const osmStatus = sliderContainer.querySelector('#osm-status') as HTMLDivElement;
  
  if (osmButton && osmStatus) {
    osmButton.addEventListener('click', async () => {
      console.log('🌍 OSM button clicked, mode:', controlState.osmMode);
      osmButton.disabled = true;
      osmButton.textContent = 'Loading...';
      osmStatus.textContent = 'Fetching OSM data...';
      
      try {
        await toggleOSMMode(controlState, pocScene, osmButton, osmStatus);
        console.log('✅ OSM toggle completed successfully');
      } catch (error) {
        console.error('❌ OSM toggle failed:', error);
        osmButton.textContent = 'Load Halden OSM Roads';
        osmStatus.textContent = 'Failed to load OSM data - check console';
        osmButton.disabled = false;
      }
    });
  }
  
  // Drive button
  const driveButton = sliderContainer.querySelector('#drive-button') as HTMLButtonElement;
  
  if (driveButton && camera && orbitControls) {
    driveButton.addEventListener('click', () => {
      const drivingControls: GraphDrivingControls = {
        camera,
        orbitControls,
        scene: pocScene.scene
      };
      
      if (controlState.graphDrivingState.isActive) {
        stopGraphDriving(controlState.graphDrivingState, drivingControls);
        driveButton.textContent = 'Start Drive';
        driveButton.style.background = '#00cc66';
      } else {
        if (controlState.connectedNetwork) {
          startGraphDriving(controlState.graphDrivingState, drivingControls, controlState.connectedNetwork);
          driveButton.textContent = 'Stop Drive';
          driveButton.style.background = '#cc0000';
        } else {
          console.error('❌ No connected road network available');
          alert('Please load OSM roads first to use the driving feature.');
        }
      }
    });
  }
  
  // Speed slider
  const speedSlider = sliderContainer.querySelector('#speed-slider') as HTMLInputElement;
  const speedValue = sliderContainer.querySelector('#speed-value') as HTMLSpanElement;
  
  if (speedSlider && speedValue) {
    speedSlider.addEventListener('input', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const speed = parseInt(target.value, 10);
      speedValue.textContent = `${speed} km/h`;
      controlState.graphDrivingState.speed = speed;
    });
  }
  
  // Reposition button
  const repositionButton = sliderContainer.querySelector('#reposition-button') as HTMLButtonElement;
  
  if (repositionButton && camera && orbitControls) {
    repositionButton.addEventListener('click', () => {
      if (controlState.connectedNetwork && controlState.graphDrivingState.isActive) {
        const graphControls: GraphDrivingControls = {
          camera,
          orbitControls,
          scene: pocScene.scene
        };
        repositionGraphCar(controlState.graphDrivingState, graphControls);
      } else {
        const drivingControls: DrivingControls = {
          camera,
          orbitControls,
          scene: pocScene.scene
        };
        repositionCar(controlState.drivingState, drivingControls, pocScene.roads);
      }
    });
  }
  
  // Line network toggle button
  const lineNetworkButton = sliderContainer.querySelector('#line-network-toggle') as HTMLButtonElement;
  
  if (lineNetworkButton) {
    let lineNetworkMode = false;
    lineNetworkButton.addEventListener('click', () => {
      lineNetworkMode = !lineNetworkMode;
      toggleLineNetworkMode(lineNetworkMode, controlState, pocScene, lineNetworkButton);
    });
  }
};

const toggleOSMMode = async (
  controlState: ControlState,
  pocScene: POCScene,
  button: HTMLButtonElement,
  status: HTMLDivElement
): Promise<void> => {
  if (!controlState.osmMode) {
    // Store original roads before switching to OSM
    if (!controlState.originalRoads) {
      controlState.originalRoads = {
        mainRoad: { ...pocScene.roads.mainRoad },
        branchRoad: { ...pocScene.roads.branchRoad },
        dynamicRoads: [...pocScene.roads.dynamicRoads],
        allPoints: [...pocScene.roads.allPoints]
      };
    }
    
    // Fetch OSM data for Halden, Norway
    status.textContent = 'Downloading road data...';
    const osmData = await fetchOSMData(haldenBounds);
    
    status.textContent = 'Creating connected road network...';
    const connectedNetwork = createConnectedRoadNetwork(osmData, haldenBounds, pocScene.terrain);
    controlState.connectedNetwork = connectedNetwork;
    
    status.textContent = 'Converting to 3D roads...';
    const roadPaths = convertNetworkToRoadPaths(connectedNetwork);
    
    // Create RoadNetwork structure from connected roads
    const osmRoads: RoadNetwork = {
      mainRoad: roadPaths[0] || { points: [], width: 20, length: 0 },
      branchRoad: roadPaths[1] || { points: [], width: 20, length: 0 },
      dynamicRoads: roadPaths.slice(2),
      allPoints: roadPaths.flatMap(road => road.points)
    };
    
    // Store OSM roads
    controlState.osmRoads = osmRoads;
    
    // Clear existing road meshes
    clearAllRoadMeshes(pocScene, controlState);
    
    // Replace roads with OSM data
    pocScene.roads.mainRoad = osmRoads.mainRoad;
    pocScene.roads.branchRoad = osmRoads.branchRoad;
    pocScene.roads.dynamicRoads = osmRoads.dynamicRoads;
    pocScene.roads.allPoints = osmRoads.allPoints;
    
    // Create meshes for OSM roads
    createOSMRoadMeshes(osmRoads, pocScene, controlState);
    
    // Update driving state with connected network
    controlState.drivingState.connectedNetwork = connectedNetwork;
    
    controlState.osmMode = true;
    button.textContent = 'Switch to Procedural Roads';
    status.textContent = `Using OSM Roads (${osmRoads.allPoints.length} points)`;
  } else {
    // Switch back to original procedural roads
    if (controlState.originalRoads) {
      // Clear OSM road meshes
      clearAllRoadMeshes(pocScene, controlState);
      
      // Restore original roads
      pocScene.roads.mainRoad = controlState.originalRoads.mainRoad;
      pocScene.roads.branchRoad = controlState.originalRoads.branchRoad;
      pocScene.roads.dynamicRoads = controlState.originalRoads.dynamicRoads;
      pocScene.roads.allPoints = controlState.originalRoads.allPoints;
      
      // Recreate procedural road meshes
      createProceduralRoadMeshes(controlState.originalRoads, pocScene, controlState);
      
      controlState.osmMode = false;
      button.textContent = 'Load Halden OSM Roads';
      status.textContent = 'Using Procedural Roads';
    }
  }
  
  button.disabled = false;
};

const clearAllRoadMeshes = (pocScene: POCScene, controlState: ControlState): void => {
  console.log('🧹 Clearing all road meshes...');
  
  // Remove street labels first
  if (controlState.streetLabels.length > 0) {
    console.log('🗑️ Removing', controlState.streetLabels.length, 'street labels');
    removeLabelsFromScene(controlState.streetLabels, pocScene.scene);
    controlState.streetLabels = [];
  }
  
  // Remove all road meshes from scene (including OSM roads with 0xaaaaaa color and red Os Alle)
  const roadMeshes = pocScene.scene.children.filter(child => 
    child instanceof THREE.Mesh && 
    child.material instanceof THREE.MeshBasicMaterial &&
    (child.material.color.getHex() === 0x555555 || 
     child.material.color.getHex() === 0x777777 ||
     child.material.color.getHex() === 0xaaaaaa || // Include OSM road color
     child.material.color.getHex() === 0xff0000) // Include red Os Alle color
  );
  
  // Remove road edge lines
  const roadEdgeLines = pocScene.scene.children.filter(child => 
    child instanceof THREE.Line && child.userData?.isRoadEdgeLine
  );
  
  console.log('🗑️ Found', roadMeshes.length, 'road meshes and', roadEdgeLines.length, 'road edge lines to remove');
  
  roadMeshes.forEach(mesh => {
    pocScene.scene.remove(mesh);
    if (mesh instanceof THREE.Mesh) {
      mesh.geometry.dispose();
      if (mesh.material instanceof THREE.Material) {
        mesh.material.dispose();
      }
    }
  });
  
  roadEdgeLines.forEach(line => {
    pocScene.scene.remove(line);
    if (line instanceof THREE.Line) {
      line.geometry.dispose();
      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
    }
  });
  
  // Clear dynamic road meshes
  console.log('🗑️ Clearing', controlState.dynamicRoads.length, 'dynamic road meshes');
  controlState.dynamicRoads.forEach(mesh => {
    pocScene.scene.remove(mesh);
    mesh.geometry.dispose();
    if (mesh.material instanceof THREE.Material) {
      mesh.material.dispose();
    }
  });
  controlState.dynamicRoads = [];
  
  console.log('✅ All road meshes and labels cleared');
};

const createOSMRoadMeshes = (osmRoads: RoadNetwork, pocScene: POCScene, controlState: ControlState): void => {
  const osmMaterial = new THREE.MeshBasicMaterial({ 
    color: 0xaaaaaa, // Light gray for OSM roads
    side: THREE.DoubleSide
  });
  
  const osAlleMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000, // Red for Os Alle
    side: THREE.DoubleSide
  });
  
  // Helper function to check if a road is Os Alle
  const isOsAlle = (roadName: string | undefined): boolean => {
    if (!roadName) return false;
    const name = roadName.toLowerCase();
    return name.includes('os alle') || name.includes('os allé') || name === 'os alle';
  };
  
  // Create main road mesh if it has points
  if (osmRoads.mainRoad.points.length > 1) {
    const material = isOsAlle(osmRoads.mainRoad.name) ? osAlleMaterial : osmMaterial;
    const mainGeometry = createRoadGeometry(osmRoads.mainRoad);
    const mainMesh = new THREE.Mesh(mainGeometry, material);
    pocScene.scene.add(mainMesh);
    
    // Add road edge lines
    createRoadEdgeLines(osmRoads.mainRoad, pocScene.scene);
    
    if (isOsAlle(osmRoads.mainRoad.name)) {
      console.log('🔴 Found Os Alle as main road!');
    }
  }
  
  // Create branch road mesh if it has points
  if (osmRoads.branchRoad.points.length > 1) {
    const material = isOsAlle(osmRoads.branchRoad.name) ? osAlleMaterial : osmMaterial;
    const branchGeometry = createRoadGeometry(osmRoads.branchRoad);
    const branchMesh = new THREE.Mesh(branchGeometry, material);
    pocScene.scene.add(branchMesh);
    
    // Add road edge lines
    createRoadEdgeLines(osmRoads.branchRoad, pocScene.scene);
    
    if (isOsAlle(osmRoads.branchRoad.name)) {
      console.log('🔴 Found Os Alle as branch road!');
    }
  }
  
  // Create dynamic road meshes
  let osAlleFound = false;
  osmRoads.dynamicRoads.forEach(road => {
    if (road.points.length > 1) {
      const isOsAlleRoad = isOsAlle(road.name);
      const material = isOsAlleRoad ? osAlleMaterial.clone() : osmMaterial.clone();
      const geometry = createRoadGeometry(road);
      const mesh = new THREE.Mesh(geometry, material);
      pocScene.scene.add(mesh);
      
      // Add road edge lines
      createRoadEdgeLines(road, pocScene.scene);
      
      if (isOsAlleRoad) {
        console.log('🔴 Found Os Alle in dynamic roads:', road.name);
        osAlleFound = true;
      }
    }
  });
  
  if (osAlleFound) {
    console.log('✅ Os Alle highlighted in red!');
  } else {
    console.log('⚠️ Os Alle not found in OSM data - checking all street names...');
    const allStreetNames = [
      osmRoads.mainRoad.name,
      osmRoads.branchRoad.name,
      ...osmRoads.dynamicRoads.map(road => road.name)
    ].filter(name => name);
    console.log('📋 Available street names:', allStreetNames);
  }
  
  // Create and add street labels
  console.log('🏷️ Creating street labels for OSM roads...');
  const streetLabels = createStreetLabels(osmRoads);
  addLabelsToScene(streetLabels, pocScene.scene);
  controlState.streetLabels = streetLabels;
  console.log(`✅ Added ${streetLabels.length} street labels to scene`);
};

const createProceduralRoadMeshes = (
  originalRoads: RoadNetwork, 
  pocScene: POCScene, 
  controlState: ControlState
): void => {
  const roadMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x555555,
    side: THREE.DoubleSide
  });
  
  // Recreate main and branch roads
  if (originalRoads.mainRoad.points.length > 1) {
    const mainGeometry = createRoadGeometry(originalRoads.mainRoad);
    const mainMesh = new THREE.Mesh(mainGeometry, roadMaterial);
    pocScene.scene.add(mainMesh);
    
    // Add road edge lines
    createRoadEdgeLines(originalRoads.mainRoad, pocScene.scene);
  }
  
  if (originalRoads.branchRoad.points.length > 1) {
    const branchGeometry = createRoadGeometry(originalRoads.branchRoad);
    const branchMesh = new THREE.Mesh(branchGeometry, roadMaterial);
    pocScene.scene.add(branchMesh);
    
    // Add road edge lines
    createRoadEdgeLines(originalRoads.branchRoad, pocScene.scene);
  }
  
  // Recreate dynamic roads
  originalRoads.dynamicRoads.forEach(road => {
    if (road.points.length > 1) {
      const dynamicMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x777777,
        side: THREE.DoubleSide
      });
      const geometry = createRoadGeometry(road);
      const mesh = new THREE.Mesh(geometry, dynamicMaterial);
      pocScene.scene.add(mesh);
      controlState.dynamicRoads.push(mesh);
      
      // Add road edge lines
      createRoadEdgeLines(road, pocScene.scene);
    }
  });
};


export const updateDrivingSystem = (
  controlState: ControlState,
  pocScene: POCScene,
  camera: THREE.Camera,
  orbitControls: any,
  deltaTime: number
): void => {
  if (controlState.connectedNetwork && controlState.graphDrivingState.isActive) {
    const graphControls: GraphDrivingControls = {
      camera,
      orbitControls,
      scene: pocScene.scene
    };
    updateGraphDriving(controlState.graphDrivingState, graphControls, deltaTime);
  } else if (controlState.drivingState.isActive) {
    const drivingControls: DrivingControls = {
      camera,
      orbitControls,
      scene: pocScene.scene
    };
    updateDriving(controlState.drivingState, drivingControls, pocScene.roads, deltaTime);
  }
  
  // Debug: Log driving state occasionally
  if (Math.random() < 0.005) { // Very occasional logging
    console.log(`🔧 Driving system update:`, {
      hasConnectedNetwork: !!controlState.connectedNetwork,
      graphDrivingActive: controlState.graphDrivingState.isActive,
      oldDrivingActive: controlState.drivingState.isActive,
      deltaTime: deltaTime.toFixed(3)
    });
  }
};

const toggleLineNetworkMode = (
  lineNetworkMode: boolean,
  controlState: ControlState,
  pocScene: POCScene,
  button: HTMLButtonElement
): void => {
  if (lineNetworkMode) {
    // Hide everything except road network lines
    button.textContent = 'Show Full Scene';
    button.style.background = '#006600';
    
    // Hide terrain
    const terrainMesh = pocScene.scene.children.find(child => 
      child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial && 
      child.material.color.getHex() === 0x4a5d23
    );
    if (terrainMesh) {
      terrainMesh.visible = false;
    }
    
    // Hide entities
    [...controlState.dynamicPedestrians, ...controlState.dynamicCars].forEach(entity => {
      entity.mesh.visible = false;
    });
    
    // Hide street labels
    controlState.streetLabels.forEach(label => {
      label.mesh.visible = false;
    });
    
    // Convert road meshes to simple lines
    convertRoadsToLines(pocScene, controlState);
    
    console.log('📏 Line network mode enabled');
  } else {
    // Show full scene
    button.textContent = 'Show Line Network Only';
    button.style.background = '#cc6600';
    
    // Show terrain
    const terrainMesh = pocScene.scene.children.find(child => 
      child instanceof THREE.Mesh && child.material instanceof THREE.MeshBasicMaterial && 
      child.material.color.getHex() === 0x4a5d23
    );
    if (terrainMesh) {
      terrainMesh.visible = true;
    }
    
    // Show entities
    [...controlState.dynamicPedestrians, ...controlState.dynamicCars].forEach(entity => {
      entity.mesh.visible = true;
    });
    
    // Show street labels
    controlState.streetLabels.forEach(label => {
      label.mesh.visible = true;
    });
    
    // Restore road meshes
    restoreRoadMeshes(pocScene, controlState);
    
    console.log('🏞️ Full scene mode enabled');
  }
};

const convertRoadsToLines = (pocScene: POCScene, controlState: ControlState): void => {
  // Remove existing road meshes temporarily
  const roadMeshesToHide = pocScene.scene.children.filter(child => 
    child instanceof THREE.Mesh && 
    child.material instanceof THREE.MeshBasicMaterial &&
    (child.material.color.getHex() === 0x555555 || 
     child.material.color.getHex() === 0x777777 ||
     child.material.color.getHex() === 0xaaaaaa ||
     child.material.color.getHex() === 0xff0000)
  );
  
  // Hide road edge lines too
  const roadEdgeLinesToHide = pocScene.scene.children.filter(child => 
    child instanceof THREE.Line && child.userData?.isRoadEdgeLine
  );
  
  roadMeshesToHide.forEach(mesh => {
    mesh.visible = false;
  });
  
  roadEdgeLinesToHide.forEach(line => {
    line.visible = false;
  });
  
  // Create line representations
  const lineMaterial = new THREE.LineBasicMaterial({ 
    color: 0x000000, 
    linewidth: 2 
  });
  
  // Add lines for current roads
  if (controlState.connectedNetwork) {
    // Use connected network for precise lines
    controlState.connectedNetwork.segments.forEach(segment => {
      if (segment.points.length >= 2) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        for (const point of segment.points) {
          positions.push(point.x, point.y, point.z);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const line = new THREE.Line(geometry, lineMaterial.clone());
        line.userData = { isRoadLine: true };
        pocScene.scene.add(line);
      }
    });
  } else {
    // Fallback to road paths
    const allRoads = [pocScene.roads.mainRoad, pocScene.roads.branchRoad, ...pocScene.roads.dynamicRoads];
    
    allRoads.forEach(road => {
      if (road.points.length >= 2) {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        
        for (const point of road.points) {
          positions.push(point.x, point.y, point.z);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        
        const line = new THREE.Line(geometry, lineMaterial.clone());
        line.userData = { isRoadLine: true };
        pocScene.scene.add(line);
      }
    });
  }
  
  console.log('📏 Converted roads to line network');
};

const restoreRoadMeshes = (pocScene: POCScene, controlState: ControlState): void => {
  // Remove line representations
  const linesToRemove = pocScene.scene.children.filter(child => 
    child instanceof THREE.Line && child.userData?.isRoadLine
  );
  
  linesToRemove.forEach(line => {
    pocScene.scene.remove(line);
    if (line instanceof THREE.Line) {
      line.geometry.dispose();
      if (line.material instanceof THREE.Material) {
        line.material.dispose();
      }
    }
  });
  
  // Show road meshes
  const roadMeshes = pocScene.scene.children.filter(child => 
    child instanceof THREE.Mesh && 
    child.material instanceof THREE.MeshBasicMaterial &&
    (child.material.color.getHex() === 0x555555 || 
     child.material.color.getHex() === 0x777777 ||
     child.material.color.getHex() === 0xaaaaaa ||
     child.material.color.getHex() === 0xff0000)
  );
  
  // Show road edge lines too
  const roadEdgeLines = pocScene.scene.children.filter(child => 
    child instanceof THREE.Line && child.userData?.isRoadEdgeLine
  );
  
  roadMeshes.forEach(mesh => {
    mesh.visible = true;
  });
  
  roadEdgeLines.forEach(line => {
    line.visible = true;
  });
  
  console.log('🛣️ Restored road meshes');
};


export const addControlsToDOM = (sliderContainer: HTMLElement): void => {
  document.body.appendChild(sliderContainer);
};