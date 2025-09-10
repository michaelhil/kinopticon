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
export const createSystem = (config: {
  readonly name: string;
  readonly priority: number;
  readonly update: (world: World, deltaTime: number) => void;
}): System => {
  return {
    name: config.name,
    priority: config.priority,
    update: config.update,
  };
};

/**
 * System builder for common patterns
 */
export class SystemBuilder {
  private name: string = '';
  private priority: number = 100;
  private updateFn?: (world: World, deltaTime: number) => void;
  
  withName(name: string): SystemBuilder {
    this.name = name;
    return this;
  }
  
  withPriority(priority: number): SystemBuilder {
    this.priority = priority;
    return this;
  }
  
  withUpdate(updateFn: (world: World, deltaTime: number) => void): SystemBuilder {
    this.updateFn = updateFn;
    return this;
  }
  
  build(): System {
    if (!this.name) {
      throw new Error('System name is required');
    }
    
    if (!this.updateFn) {
      throw new Error('System update function is required');
    }
    
    return createSystem({
      name: this.name,
      priority: this.priority,
      update: this.updateFn,
    });
  }
}

/**
 * Creates a new system builder
 */
export const system = (): SystemBuilder => new SystemBuilder();