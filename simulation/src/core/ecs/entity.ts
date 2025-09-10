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
export const createEntity = (id?: EntityId): Entity => {
  const entityId = id ?? crypto.randomUUID();
  
  const entity: Entity = {
    id: entityId,
    components: new Map<string, Component>(),
  };
  
  return entity;
};

/**
 * Adds a component to an entity
 */
export const addComponent = <T extends Component>(
  entity: Entity,
  component: T
): Entity => {
  const components = new Map(entity.components);
  components.set(component.type, component);
  
  return {
    ...entity,
    components,
  };
};

/**
 * Removes a component from an entity
 */
export const removeComponent = (
  entity: Entity,
  componentType: string
): Entity => {
  const components = new Map(entity.components);
  components.delete(componentType);
  
  return {
    ...entity,
    components,
  };
};

/**
 * Gets a component from an entity
 */
export const getComponent = <T extends Component>(
  entity: Entity,
  componentType: string
): T | undefined => {
  return entity.components.get(componentType) as T | undefined;
};

/**
 * Checks if an entity has a component
 */
export const hasComponent = (
  entity: Entity,
  componentType: string
): boolean => {
  return entity.components.has(componentType);
};

/**
 * Checks if an entity has all specified components
 */
export const hasComponents = (
  entity: Entity,
  componentTypes: readonly string[]
): boolean => {
  return componentTypes.every(type => entity.components.has(type));
};