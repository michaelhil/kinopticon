/**
 * Kinopticon Simulation Engine
 * 
 * Main entry point for the TypeScript simulation core.
 * This is the foundation for the research-grade driving simulator.
 */

import { createWorld, createEntity, addComponent, system, createTimeManager } from '@core/index.ts';
import type { Component } from '@core/index.ts';

// Simple transform component for demo
interface Transform extends Component {
  readonly type: 'transform';
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

const createTransform = (x: number, y: number, z: number): Transform => ({
  type: 'transform',
  x,
  y,
  z,
});

/**
 * Main simulation entry point
 */
export const main = (): void => {
  console.log('🚗 Kinopticon Simulation Engine Starting...');
  
  // Create core systems
  const world = createWorld();
  const timeManager = createTimeManager();
  
  // Create a simple demo system
  const logSystem = system()
    .withName('log-system')
    .withPriority(100)
    .withUpdate((world, deltaTime) => {
      const entities = world.query(['transform']);
      console.log(`Frame: ${entities.length} entities, dt: ${deltaTime.toFixed(3)}ms`);
    })
    .build();
  
  // Create demo entities
  for (let i = 0; i < 3; i++) {
    const entity = createEntity(`entity-${i}`);
    const entityWithTransform = addComponent(entity, createTransform(i, 0, 0));
    world.addEntity(entityWithTransform);
  }
  
  // Run simulation loop (just a few frames for demo)
  let frame = 0;
  const maxFrames = 5;
  const targetDt = 16.67; // 60 FPS
  
  const runFrame = (): void => {
    timeManager.advance(targetDt);
    world.update([logSystem], targetDt);
    
    frame++;
    if (frame < maxFrames) {
      setTimeout(runFrame, targetDt);
    } else {
      console.log('✅ Kinopticon Simulation Engine Demo Complete');
    }
  };
  
  runFrame();
};

// Auto-run if this is the main module
if (import.meta.main) {
  main();
}