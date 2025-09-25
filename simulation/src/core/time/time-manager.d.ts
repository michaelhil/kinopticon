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
export declare const createTimeManager: (fixedTimestep?: number) => TimeManager & {
    advance: (dt: number) => void;
    reset: () => void;
};
/**
 * Fixed timestep manager for deterministic simulation
 */
export declare const createFixedTimeManager: (timestep: number) => TimeManager & {
    advance: (dt: number) => void;
    reset: () => void;
    shouldUpdate: (realDt: number) => boolean;
    getAccumulator: () => number;
};
//# sourceMappingURL=time-manager.d.ts.map