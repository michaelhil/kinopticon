/**
 * Core type definitions for Kinopticon simulation
 * 
 * This module exports all fundamental types used throughout the simulation.
 */

// Entity and Component types
export type EntityId = string;

export interface Component {
  readonly type: string;
}

export interface Entity {
  readonly id: EntityId;
  readonly components: Map<string, Component>;
}

// System types
export interface System {
  readonly name: string;
  readonly priority: number;
  update(world: World, deltaTime: number): void;
}

export interface World {
  readonly entities: ReadonlyMap<EntityId, Entity>;
  addEntity(entity: Entity): void;
  removeEntity(id: EntityId): void;
  getEntity(id: EntityId): Entity | undefined;
}

// Time types
export interface TimeManager {
  readonly currentTime: number;
  readonly deltaTime: number;
  advance(dt: number): void;
  reset(): void;
}

// Performance types
export interface PerformanceMetrics {
  frameTime: number;
  systemTimes: Map<string, number>;
  memoryUsage: number;
  entityCount: number;
}

// Re-export math types for convenience
export type { Vector3, Quaternion, Transform } from './math';
export { Vector3Utils, QuaternionUtils, TransformUtils } from './math';