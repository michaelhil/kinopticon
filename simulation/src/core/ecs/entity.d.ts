/**
 * Entity implementation for Kinopticon ECS
 *
 * Entities are simple containers for components with unique IDs.
 * They follow the composition over inheritance pattern.
 */
import type { EntityId, Component, Entity } from '@types/index.ts';
/**
 * Creates a new entity with a unique ID
 */
export declare const createEntity: (id?: EntityId) => Entity;
/**
 * Adds a component to an entity
 */
export declare const addComponent: <T extends Component>(entity: Entity, component: T) => Entity;
/**
 * Removes a component from an entity
 */
export declare const removeComponent: (entity: Entity, componentType: string) => Entity;
/**
 * Gets a component from an entity
 */
export declare const getComponent: <T extends Component>(entity: Entity, componentType: string) => T | undefined;
/**
 * Checks if an entity has a component
 */
export declare const hasComponent: (entity: Entity, componentType: string) => boolean;
/**
 * Checks if an entity has all specified components
 */
export declare const hasComponents: (entity: Entity, componentTypes: readonly string[]) => boolean;
//# sourceMappingURL=entity.d.ts.map