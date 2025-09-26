// POC main entry point and scene setup
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { POCScene } from './types.ts';
import { createTerrain, createTerrainConfig } from './terrain.ts';
import { createRoadNetwork, createRoadConfig, createRoadGeometry, createRoadEdgeLines } from './roads.ts';
import { createInitialEntities, addEntityToScene } from './entities.ts';
import { 
  createControlState, 
  createAllSliders, 
  setupAllSliderListeners,
  addControlsToDOM,
  updateDrivingSystem
} from './controls.ts';
import { testOSMFetch } from './osm-test.ts';

export const createPOCScene = async (): Promise<POCScene> => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  
  const terrainConfig = createTerrainConfig();
  const terrain = await createTerrain(terrainConfig);
  
  const roadConfig = createRoadConfig();
  const roads = await createRoadNetwork(terrain, roadConfig);
  
  const entities = createInitialEntities(roads);
  
  return {
    terrain,
    roads,
    entities,
    scene
  };
};

export const setupPOCRenderer = (canvas: HTMLCanvasElement): THREE.WebGLRenderer => {
  const renderer = new THREE.WebGLRenderer({ 
    canvas, 
    antialias: true,
    powerPreference: 'high-performance'
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = false;
  
  return renderer;
};

export const setupPOCCamera = (): THREE.PerspectiveCamera => {
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    2000
  );
  
  // Position camera to see the full terrain and road clearly
  camera.position.set(-300, 200, 300);
  camera.lookAt(0, 0, 0);
  
  return camera;
};

export const addSceneObjects = (pocScene: POCScene): void => {
  const terrainMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x4a5d23,
    wireframe: true
  });
  const terrainMesh = new THREE.Mesh(pocScene.terrain.geometry, terrainMaterial);
  terrainMesh.rotation.x = -Math.PI / 2;
  pocScene.scene.add(terrainMesh);
  
  // Create proper road geometry
  const roadMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x555555,
    side: THREE.DoubleSide
  });
  
  // Main road
  const mainRoadGeometry = createRoadGeometry(pocScene.roads.mainRoad);
  const mainRoadMesh = new THREE.Mesh(mainRoadGeometry, roadMaterial);
  pocScene.scene.add(mainRoadMesh);
  createRoadEdgeLines(pocScene.roads.mainRoad, pocScene.scene);
  
  // Branch road
  const branchRoadGeometry = createRoadGeometry(pocScene.roads.branchRoad);
  const branchRoadMesh = new THREE.Mesh(branchRoadGeometry, roadMaterial);
  pocScene.scene.add(branchRoadMesh);
  createRoadEdgeLines(pocScene.roads.branchRoad, pocScene.scene);
  
  pocScene.entities.forEach(entity => {
    addEntityToScene(entity, pocScene.scene);
  });
  
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  pocScene.scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.position.set(100, 200, 100);
  directionalLight.lookAt(0, 0, 0);
  pocScene.scene.add(directionalLight);
};

export const initializePOC = async (canvas: HTMLCanvasElement): Promise<void> => {
  console.log('🏔️  Initializing Kinopticon POC...');
  
  const pocScene = await createPOCScene();
  const renderer = setupPOCRenderer(canvas);
  const camera = setupPOCCamera();
  
  // Setup camera controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.screenSpacePanning = false;
  controls.minDistance = 50;
  controls.maxDistance = 1500;
  controls.maxPolarAngle = Math.PI / 2.2; // Prevent camera from going below ground
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  };
  
  // Enable touch controls for mobile
  controls.touches = {
    ONE: THREE.TOUCH.ROTATE,
    TWO: THREE.TOUCH.DOLLY_PAN
  };
  
  addSceneObjects(pocScene);
  
  const controlState = createControlState();
  const sliderContainer = createAllSliders();
  setupAllSliderListeners(sliderContainer, controlState, pocScene, camera, controls);
  addControlsToDOM(sliderContainer);
  
  // Add instruction text
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: absolute;
    bottom: 20px;
    left: 20px;
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 10px;
    border-radius: 5px;
    font-family: Arial, sans-serif;
    font-size: 12px;
    z-index: 1000;
  `;
  instructions.innerHTML = `
    <strong>Camera Controls:</strong><br>
    Left Click + Drag: Rotate<br>
    Right Click + Drag: Pan<br>
    Scroll/Pinch: Zoom
  `;
  document.body.appendChild(instructions);
  
  let lastTime = performance.now();
  
  const animate = (): void => {
    const currentTime = performance.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;
    
    requestAnimationFrame(animate);
    controls.update(); // Update controls
    
    // Update street labels to always face camera (but not during driving mode)
    if (!controlState.drivingState.isActive) {
      controlState.streetLabels.forEach(label => {
        label.mesh.lookAt(camera.position);
      });
    }
    
    // Update driving system
    updateDrivingSystem(controlState, pocScene, camera, controls, deltaTime);
    
    renderer.render(pocScene.scene, camera);
  };
  
  const handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  
  window.addEventListener('resize', handleResize);
  animate();
  
  // Add debug functions to window
  (window as any).testOSMFetch = testOSMFetch;
  
  console.log('✅ POC initialized successfully');
};