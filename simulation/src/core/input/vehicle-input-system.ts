/**
 * Vehicle Input System
 * Processes vehicle input and applies to physics components
 */

import { System } from '../ecs/system';
import { World } from '../ecs/world';
import { Component } from '../../types';
import { Vector3 } from '../../types/math';

export interface VehicleInputState {
  readonly throttle: number;    // -1.0 to 1.0 (negative = reverse)
  readonly steering: number;    // -1.0 to 1.0 (negative = left)
  readonly brake: number;       // 0.0 to 1.0
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
  // Basic physics properties for proof of concept
  readonly mass: number;              // kg
  readonly maxSpeed: number;          // m/s
  readonly acceleration: number;      // m/s²
  readonly deceleration: number;      // m/s²
  readonly turnRadius: number;        // meters
  
  // Current state
  velocity: Vector3;
  angularVelocity: number;            // rad/s
  
  // Forces
  throttleForce: number;
  brakeForce: number;
  steeringAngle: number;              // radians
}

/**
 * Processes vehicle input and converts to physics forces
 */
export const createVehicleInputSystem = (): System => ({
  name: 'VehicleInputSystem',
  requiredComponents: ['VehicleInput', 'VehiclePhysics', 'UnrealTransform'] as const,
  
  update: (world: World, _deltaTime: number): void => {
    const entities = world.query(['VehicleInput', 'VehiclePhysics', 'UnrealTransform']);
    
    for (const entity of entities) {
      const inputComponent = entity.components.get('VehicleInput') as VehicleInputComponent;
      const physicsComponent = entity.components.get('VehiclePhysics') as VehiclePhysicsComponent;
      
      if (!inputComponent || !physicsComponent) continue;
      
      const input = inputComponent.currentInput;
      
      // Process throttle input
      const throttleInput = applyDeadzone(input.throttle, inputComponent.calibration.throttleDeadzone);
      const throttleForce = throttleInput * inputComponent.calibration.throttleSensitivity;
      
      // Process steering input
      const steeringInput = applyDeadzone(input.steering, inputComponent.calibration.steeringDeadzone);
      const steeringAngle = steeringInput * inputComponent.calibration.steeringSensitivity;
      
      // Process brake input
      const brakeInput = applyDeadzone(input.brake, inputComponent.calibration.brakeDeadzone);
      const brakeForce = brakeInput * physicsComponent.deceleration;
      
      // Update physics component
      const updatedPhysics: VehiclePhysicsComponent = {
        ...physicsComponent,
        throttleForce: throttleForce,
        brakeForce: brakeForce,
        steeringAngle: steeringAngle
      };
      
      entity.components.set('VehiclePhysics', updatedPhysics);
      
      // Log input processing (remove in production)
      if (Math.abs(throttleInput) > 0.1 || Math.abs(steeringInput) > 0.1 || Math.abs(brakeInput) > 0.1) {
        console.log(`Vehicle Input: T=${throttleInput.toFixed(2)}, S=${steeringInput.toFixed(2)}, B=${brakeInput.toFixed(2)}`);
      }
    }
  }
});

/**
 * Simple vehicle physics system for proof of concept
 */
export const createVehiclePhysicsSystem = (): System => ({
  name: 'VehiclePhysicsSystem',
  requiredComponents: ['VehiclePhysics', 'UnrealTransform'] as const,
  
  update: (world: World, deltaTime: number): void => {
    const entities = world.query(['VehiclePhysics', 'UnrealTransform']);
    
    for (const entity of entities) {
      const physicsComponent = entity.components.get('VehiclePhysics') as VehiclePhysicsComponent;
      const transformComponent = entity.components.get('UnrealTransform') as any;
      
      if (!physicsComponent || !transformComponent) continue;
      
      // Ultra-simple physics for proof of concept
      // Real physics will be handled by Unreal's Chaos Physics
      
      // Calculate acceleration from throttle and brake
      let acceleration = 0;
      if (Math.abs(physicsComponent.throttleForce) > Math.abs(physicsComponent.brakeForce)) {
        acceleration = physicsComponent.throttleForce * physicsComponent.acceleration;
      } else {
        acceleration = -physicsComponent.brakeForce;
      }
      
      // Apply handbrake (emergency brake)
      // This will be handled through input component when implemented
      
      // Update velocity (forward/backward only for now)
      const currentSpeed = Math.sqrt(
        physicsComponent.velocity.x ** 2 + 
        physicsComponent.velocity.y ** 2 + 
        physicsComponent.velocity.z ** 2
      );
      
      const newSpeed = Math.max(0, Math.min(physicsComponent.maxSpeed, currentSpeed + acceleration * deltaTime));
      
      // Simple forward movement (assuming vehicle faces Y direction)
      const forwardDirection = {
        x: Math.sin(transformComponent.rotation.z || 0),
        y: Math.cos(transformComponent.rotation.z || 0),
        z: 0
      };
      
      const newVelocity: Vector3 = {
        x: forwardDirection.x * newSpeed,
        y: forwardDirection.y * newSpeed,
        z: 0
      };
      
      // Calculate angular velocity from steering
      const angularVelocity = physicsComponent.steeringAngle * (newSpeed / physicsComponent.turnRadius);
      
      // Update position (basic integration)
      const newPosition: Vector3 = {
        x: transformComponent.position.x + newVelocity.x * deltaTime,
        y: transformComponent.position.y + newVelocity.y * deltaTime,
        z: transformComponent.position.z + newVelocity.z * deltaTime
      };
      
      // Update rotation from angular velocity
      const currentRotationZ = transformComponent.rotation.z || 0;
      const newRotationZ = currentRotationZ + angularVelocity * deltaTime;
      
      // Update components
      const updatedPhysics: VehiclePhysicsComponent = {
        ...physicsComponent,
        velocity: newVelocity,
        angularVelocity: angularVelocity
      };
      
      const updatedTransform = {
        ...transformComponent,
        position: newPosition,
        rotation: {
          ...transformComponent.rotation,
          z: newRotationZ
        },
        isDirty: true // Mark for sync to Unreal
      };
      
      entity.components.set('VehiclePhysics', updatedPhysics);
      entity.components.set('UnrealTransform', updatedTransform);
    }
  }
});

/**
 * Apply deadzone to input value
 */
const applyDeadzone = (value: number, deadzone: number): number => {
  if (Math.abs(value) < deadzone) {
    return 0;
  }
  
  // Scale the value to maintain smooth response outside deadzone
  const sign = Math.sign(value);
  const scaledValue = (Math.abs(value) - deadzone) / (1 - deadzone);
  return sign * Math.min(1, scaledValue);
};

/**
 * Create default vehicle input component
 */
export const createDefaultVehicleInputComponent = (): VehicleInputComponent => {
  const defaultInput: VehicleInputState = {
    throttle: 0,
    steering: 0,
    brake: 0,
    handbrake: false,
    timestamp: performance.now()
  };
  
  return {
    type: 'VehicleInput',
    currentInput: defaultInput,
    inputHistory: [],
    calibration: {
      steeringDeadzone: 0.05,
      throttleDeadzone: 0.1,
      brakeDeadzone: 0.1,
      steeringSensitivity: Math.PI / 4, // 45 degrees max steering
      throttleSensitivity: 1.0
    }
  };
};

/**
 * Create default vehicle physics component
 */
export const createDefaultVehiclePhysicsComponent = (): VehiclePhysicsComponent => ({
  type: 'VehiclePhysics',
  mass: 1500, // kg (typical car)
  maxSpeed: 50, // m/s (180 km/h)
  acceleration: 5, // m/s²
  deceleration: 8, // m/s²
  turnRadius: 10, // meters
  
  velocity: { x: 0, y: 0, z: 0 },
  angularVelocity: 0,
  
  throttleForce: 0,
  brakeForce: 0,
  steeringAngle: 0
});