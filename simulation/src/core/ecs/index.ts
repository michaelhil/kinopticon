/**
 * Entity Component System (ECS) module for Kinopticon
 * 
 * Exports all ECS-related functionality including entities, components,
 * systems, and world management.
 */

// Entity functions
export {
  createEntity,
  addComponent,
  removeComponent,
  getComponent,
  hasComponent,
  hasComponents,
} from './entity.ts';

// World management
export { createWorld } from './world.ts';

// System utilities
export { createSystem, SystemBuilder, system } from './system.ts';

// Re-export types for convenience
export type {
  EntityId,
  Component,
  Entity,
  System,
  World,
} from '@types/index.ts';