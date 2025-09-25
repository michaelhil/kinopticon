/**
 * Entity Component System (ECS) module for Kinopticon
 *
 * Exports all ECS-related functionality including entities, components,
 * systems, and world management.
 */
export { createEntity, addComponent, removeComponent, getComponent, hasComponent, hasComponents, } from './entity.ts';
export { createWorld } from './world.ts';
export { createSystem, SystemBuilder, system } from './system.ts';
export type { EntityId, Component, Entity, System, World, } from '@types/index.ts';
//# sourceMappingURL=index.d.ts.map