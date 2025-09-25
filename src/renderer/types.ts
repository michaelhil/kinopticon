/**
 * Renderer Types
 * 
 * Type definitions for the Three.js rendering system
 */

import * as THREE from 'three';

export interface RendererConfig {
  readonly antialias: boolean;
  readonly pixelRatio: number;
  readonly shadowMap: boolean;
  readonly physicallyCorrectLights: boolean;
}

export interface RendererSystem {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  render(): void;
  resize(width: number, height: number): void;
  dispose(): void;
}