/**
 * World implementation for Kinopticon ECS
 * 
 * The World manages all entities and provides query capabilities.
 * It maintains entity state and provides efficient access patterns.
 */

import type { EntityId, Entity, World, System } from '@types/index.ts';
import { hasComponents } from './entity.ts';

/**
 * Creates a new simulation world
 */
export const createWorld = (): World & {
  addEntity: (entity: Entity) => void;
  removeEntity: (id: EntityId) => void;
  getEntity: (id: EntityId) => Entity | undefined;
  query: (componentTypes: readonly string[]) => readonly Entity[];
  update: (systems: readonly System[], deltaTime: number) => void;
} => {
  const entities = new Map<EntityId, Entity>();
  
  const world = {
    get entities(): ReadonlyMap<EntityId, Entity> {
      return entities;
    },
    
    addEntity: (entity: Entity): void => {
      entities.set(entity.id, entity);
    },
    
    removeEntity: (id: EntityId): void => {
      entities.delete(id);
    },
    
    getEntity: (id: EntityId): Entity | undefined => {
      return entities.get(id);
    },
    
    /**
     * Query entities that have all specified components
     */
    query: (componentTypes: readonly string[]): readonly Entity[] => {
      const results: Entity[] = [];
      
      for (const entity of entities.values()) {
        if (hasComponents(entity, componentTypes)) {
          results.push(entity);
        }
      }
      
      return results;
    },
    
    /**
     * Update the world with all systems
     */
    update: (systems: readonly System[], deltaTime: number): void => {
      // Sort systems by priority
      const sortedSystems = [...systems].sort((a, b) => a.priority - b.priority);
      
      // Run each system
      for (const system of sortedSystems) {
        system.update(world, deltaTime);
      }
    },
  };
  
  return world;
};