/**
 * Vehicle Input System
 * Processes vehicle input and applies to physics components
 */
import { System } from '../ecs/system';
import { Component } from '../../types';
import { Vector3 } from '../../types/math';
export interface VehicleInputState {
    readonly throttle: number;
    readonly steering: number;
    readonly brake: number;
    readonly handbrake: boolean;
    readonly timestamp: number;
}
export interface VehicleInputComponent extends Component {
    readonly type: 'VehicleInput';
    readonly currentInput: VehicleInputState;
    readonly inputHistory: VehicleInputState[];
    readonly calibration: {
        readonly steeringDeadzone: number;
        readonly throttleDeadzone: number;
        readonly brakeDeadzone: number;
        readonly steeringSensitivity: number;
        readonly throttleSensitivity: number;
    };
}
export interface VehiclePhysicsComponent extends Component {
    readonly type: 'VehiclePhysics';
    readonly mass: number;
    readonly maxSpeed: number;
    readonly acceleration: number;
    readonly deceleration: number;
    readonly turnRadius: number;
    velocity: Vector3;
    angularVelocity: number;
    throttleForce: number;
    brakeForce: number;
    steeringAngle: number;
}
/**
 * Processes vehicle input and converts to physics forces
 */
export declare const createVehicleInputSystem: () => System;
/**
 * Simple vehicle physics system for proof of concept
 */
export declare const createVehiclePhysicsSystem: () => System;
/**
 * Create default vehicle input component
 */
export declare const createDefaultVehicleInputComponent: () => VehicleInputComponent;
/**
 * Create default vehicle physics component
 */
export declare const createDefaultVehiclePhysicsComponent: () => VehiclePhysicsComponent;
//# sourceMappingURL=vehicle-input-system.d.ts.map