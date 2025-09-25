/**
 * World implementation for Kinopticon ECS
 *
 * The World manages all entities and provides query capabilities.
 * It maintains entity state and provides efficient access patterns.
 */
import type { EntityId, Entity, World, System } from '@types/index.ts';
/**
 * Creates a new simulation world
 */
export declare const createWorld: () => World & {
    addEntity: (entity: Entity) => void;
    removeEntity: (id: EntityId) => void;
    getEntity: (id: EntityId) => Entity | undefined;
    query: (componentTypes: readonly string[]) => readonly Entity[];
    update: (systems: readonly System[], deltaTime: number) => void;
};
//# sourceMappingURL=world.d.ts.map