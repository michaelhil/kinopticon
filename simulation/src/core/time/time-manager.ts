/**
 * Time management system for Kinopticon
 * 
 * Provides precise timing control for deterministic simulation.
 * Supports fixed timestep and variable timestep modes.
 */

import type { TimeManager } from '@types/index.ts';

/**
 * Creates a time manager for simulation timing
 */
export const createTimeManager = (fixedTimestep?: number): TimeManager & {
  advance: (dt: number) => void;
  reset: () => void;
} => {
  let currentTime = 0;
  let lastDeltaTime = 0;
  
  return {
    get currentTime(): number {
      return currentTime;
    },
    
    get deltaTime(): number {
      return lastDeltaTime;
    },
    
    advance: (dt: number): void => {
      lastDeltaTime = fixedTimestep ?? dt;
      currentTime += lastDeltaTime;
    },
    
    reset: (): void => {
      currentTime = 0;
      lastDeltaTime = 0;
    },
  };
};

/**
 * Fixed timestep manager for deterministic simulation
 */
export const createFixedTimeManager = (timestep: number): TimeManager & {
  advance: (dt: number) => void;
  reset: () => void;
  shouldUpdate: (realDt: number) => boolean;
  getAccumulator: () => number;
} => {
  const baseManager = createTimeManager(timestep);
  let accumulator = 0;
  
  return {
    ...baseManager,
    
    shouldUpdate: (realDt: number): boolean => {
      accumulator += realDt;
      return accumulator >= timestep;
    },
    
    advance: (dt: number): void => {
      if (accumulator >= timestep) {
        baseManager.advance(timestep);
        accumulator -= timestep;
      }
    },
    
    getAccumulator: (): number => accumulator,
    
    reset: (): void => {
      baseManager.reset();
      accumulator = 0;
    },
  };
};