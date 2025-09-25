/**
 * Three.js Scene Setup
 * 
 * Initializes the WebGL renderer, scene, and camera.
 * Keeps it simple for Phase 0.
 */

import * as THREE from 'three';
import type { RendererConfig, RendererSystem } from './types';

const DEFAULT_CONFIG: RendererConfig = {
  antialias: true,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
  shadowMap: true,
  physicallyCorrectLights: true,
};

export async function initializeRenderer(
  canvas: HTMLCanvasElement,
  config: Partial<RendererConfig> = {}
): Promise<RendererSystem> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create WebGL renderer
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: finalConfig.antialias,
    powerPreference: 'high-performance',
  });
  
  renderer.setPixelRatio(finalConfig.pixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  
  if (finalConfig.shadowMap) {
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }
  
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue
  
  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75, // FOV
    window.innerWidth / window.innerHeight,
    0.1, // Near
    1000 // Far
  );
  camera.position.set(0, 5, 10);
  camera.lookAt(0, 0, 0);
  
  // Add basic lighting
  const ambientLight = new THREE.AmbientLight(0x404040, 0.3);
  scene.add(ambientLight);
  
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(50, 100, 50);
  directionalLight.castShadow = finalConfig.shadowMap;
  if (finalConfig.shadowMap) {
    directionalLight.shadow.mapSize.setScalar(2048);
  }
  scene.add(directionalLight);
  
  // Add placeholder cube for testing
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial({ color: 0xff6b6b });
  const cube = new THREE.Mesh(geometry, material);
  cube.castShadow = true;
  scene.add(cube);
  
  // Ground plane
  const groundGeometry = new THREE.PlaneGeometry(20, 20);
  const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x90ee90 });
  const ground = new THREE.Mesh(groundGeometry, groundMaterial);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);
  
  // Handle window resize
  const handleResize = (): void => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
  };
  
  window.addEventListener('resize', handleResize);
  
  return {
    renderer,
    scene,
    camera,
    render: (): void => {
      // Simple rotation for testing
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;
      
      renderer.render(scene, camera);
    },
    resize: handleResize,
    dispose: (): void => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
    },
  };
}