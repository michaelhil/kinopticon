// Street name labels for OSM roads
import * as THREE from 'three';
import { RoadNetwork, RoadPath, Vector3 } from './types.ts';

export interface StreetLabel {
  mesh: THREE.Mesh;
  roadId: string;
  text: string;
}

export const createStreetLabels = (roadNetwork: RoadNetwork): StreetLabel[] => {
  const labels: StreetLabel[] = [];
  
  // Create labels for all roads that have names
  const allRoads = [roadNetwork.mainRoad, roadNetwork.branchRoad, ...roadNetwork.dynamicRoads];
  
  allRoads.forEach((road, index) => {
    if (road.name && road.points.length >= 2) {
      const label = createStreetLabel(road, `road-${index}`);
      if (label) {
        labels.push(label);
      }
    }
  });
  
  console.log(`🏷️ Created ${labels.length} street labels`);
  return labels;
};

const createStreetLabel = (road: RoadPath, roadId: string): StreetLabel | null => {
  if (!road.name || road.points.length < 2) return null;
  
  // Find the middle point of the road for label placement
  const midIndex = Math.floor(road.points.length / 2);
  const labelPosition = road.points[midIndex];
  
  // Check if this is Os Alle for special coloring
  const isOsAlle = road.name.toLowerCase().includes('os alle') || 
                   road.name.toLowerCase().includes('os allé') || 
                   road.name.toLowerCase() === 'os alle';
  
  // Create text geometry using TextGeometry (fallback to canvas-based approach)
  const label = createCanvasTextLabel(road.name, labelPosition, isOsAlle);
  
  return {
    mesh: label,
    roadId,
    text: road.name
  };
};

const createCanvasTextLabel = (text: string, position: Vector3, isOsAlle: boolean = false): THREE.Mesh => {
  // Create canvas for text rendering
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Could not get canvas context');
  
  // Set canvas size and font
  canvas.width = 512;
  canvas.height = 128;
  
  context.font = '48px Arial';
  
  // Special coloring for Os Alle
  if (isOsAlle) {
    context.fillStyle = 'red';
    context.strokeStyle = 'white';
    console.log('🔴 Creating red label for Os Alle:', text);
  } else {
    context.fillStyle = 'white';
    context.strokeStyle = 'black';
  }
  
  context.lineWidth = 6;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Clear canvas with transparent background
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw text with outline
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  
  // Create texture from canvas
  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  
  // Create material and geometry
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    alphaTest: 0.1,
    side: THREE.DoubleSide
  });
  
  const geometry = new THREE.PlaneGeometry(40, 10); // Bigger labels
  const mesh = new THREE.Mesh(geometry, material);
  
  // Position the label above the road
  mesh.position.set(position.x, position.y + 8, position.z);
  
  // Make label face the camera (billboard effect)
  mesh.lookAt(0, position.y + 8, 0);
  
  return mesh;
};

export const updateStreetLabelPositions = (
  labels: StreetLabel[],
  roadNetwork: RoadNetwork,
  camera: THREE.Camera
): void => {
  const allRoads = [roadNetwork.mainRoad, roadNetwork.branchRoad, ...roadNetwork.dynamicRoads];
  
  labels.forEach((label, index) => {
    if (index < allRoads.length) {
      const road = allRoads[index];
      if (road.points.length >= 2) {
        const midIndex = Math.floor(road.points.length / 2);
        const position = road.points[midIndex];
        
        // Update position
        label.mesh.position.set(position.x, position.y + 8, position.z);
        
        // Make label face camera (billboard effect)
        label.mesh.lookAt(camera.position);
      }
    }
  });
};

export const addLabelsToScene = (labels: StreetLabel[], scene: THREE.Scene): void => {
  labels.forEach(label => {
    scene.add(label.mesh);
  });
};

export const removeLabelsFromScene = (labels: StreetLabel[], scene: THREE.Scene): void => {
  labels.forEach(label => {
    scene.remove(label.mesh);
    label.mesh.geometry.dispose();
    if (label.mesh.material instanceof THREE.Material) {
      label.mesh.material.dispose();
      // Dispose texture if it exists
      if ('map' in label.mesh.material && label.mesh.material.map) {
        label.mesh.material.map.dispose();
      }
    }
  });
};