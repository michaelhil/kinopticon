/**
 * System utilities for Kinopticon ECS
 *
 * Systems operate on entities with specific component combinations.
 * They implement the game logic and update entity state.
 */
import type { System, World } from '@types/index.ts';
/**
 * Creates a system with the given configuration
 */
export declare const createSystem: (config: {
    readonly name: string;
    readonly priority: number;
    readonly update: (world: World, deltaTime: number) => void;
}) => System;
/**
 * System builder for common patterns
 */
export declare class SystemBuilder {
    private name;
    private priority;
    private updateFn?;
    withName(name: string): SystemBuilder;
    withPriority(priority: number): SystemBuilder;
    withUpdate(updateFn: (world: World, deltaTime: number) => void): SystemBuilder;
    build(): System;
}
/**
 * Creates a new system builder
 */
export declare const system: () => SystemBuilder;
//# sourceMappingURL=system.d.ts.map