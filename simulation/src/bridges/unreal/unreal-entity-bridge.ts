/**
 * Unreal Entity Bridge
 * Synchronizes ECS entities with Unreal Engine actors
 */

import { Entity } from '../../core/ecs/entity';
import { Component } from '../../types';
import { Vector3, Quaternion } from '../../types/math';

export interface UnrealEntityComponent extends Component {
  readonly type: 'UnrealEntity';
  readonly unrealActorId: string;
  readonly actorType: 'Vehicle' | 'Static' | 'Environment' | 'Camera';
  readonly className: string; // Blueprint class name
}

export interface UnrealTransformComponent extends Component {
  readonly type: 'UnrealTransform';
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
  // Cache Unreal transform for performance
  lastSyncTime?: number;
  isDirty?: boolean;
}

export interface UnrealSyncMetrics {
  readonly entitiesSynced: number;
  readonly syncLatency: number;
  readonly syncFrequency: number;
  readonly failedSyncs: number;
}

/**
 * Manages synchronization between ECS entities and Unreal Engine actors
 */
export class UnrealEntityBridge {
  private entities: Map<string, Entity> = new Map();
  private actorToEntity: Map<string, string> = new Map();
  private syncMetrics: UnrealSyncMetrics;
  private lastSyncTime: number = 0;
  private syncCount: number = 0;

  constructor() {
    this.syncMetrics = {
      entitiesSynced: 0,
      syncLatency: 0,
      syncFrequency: 0,
      failedSyncs: 0
    };
  }

  /**
   * Register an entity with Unreal Engine actor
   */
  public registerEntity(entity: Entity, actorId: string, actorType: string, className: string): void {
    // Add Unreal components to entity
    const unrealComponent: UnrealEntityComponent = {
      type: 'UnrealEntity',
      unrealActorId: actorId,
      actorType: actorType as any,
      className: className
    };

    const transformComponent: UnrealTransformComponent = {
      type: 'UnrealTransform',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0, w: 1 },
      scale: { x: 1, y: 1, z: 1 },
      isDirty: false
    };

    entity.components.set('UnrealEntity', unrealComponent);
    entity.components.set('UnrealTransform', transformComponent);

    // Store mappings
    this.entities.set(entity.id, entity);
    this.actorToEntity.set(actorId, entity.id);

    console.log(`Registered entity ${entity.id} with Unreal actor ${actorId}`);
  }

  /**
   * Update entity transform from ECS to Unreal
   */
  public syncEntityToUnreal(entityId: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    const unrealComponent = entity.components.get('UnrealEntity') as UnrealEntityComponent;
    const transformComponent = entity.components.get('UnrealTransform') as UnrealTransformComponent;
    
    if (!unrealComponent || !transformComponent) return false;

    // Only sync if transform is dirty
    if (!transformComponent.isDirty) return true;

    try {
      // Call Unreal Engine to update actor transform
      this.callUnrealFunction('UpdateActorTransform', {
        actorId: unrealComponent.unrealActorId,
        position: transformComponent.position,
        rotation: transformComponent.rotation,
        scale: transformComponent.scale
      });

      // Mark as clean
      transformComponent.isDirty = false;
      transformComponent.lastSyncTime = performance.now();

      this.syncCount++;
      return true;
    } catch (error) {
      console.error(`Failed to sync entity ${entityId} to Unreal:`, error);
      this.syncMetrics = {
        ...this.syncMetrics,
        failedSyncs: this.syncMetrics.failedSyncs + 1
      };
      return false;
    }
  }

  /**
   * Update entity transform from Unreal to ECS
   */
  public syncUnrealToEntity(actorId: string, transform: UnrealTransformData): boolean {
    const entityId = this.actorToEntity.get(actorId);
    if (!entityId) return false;

    const entity = this.entities.get(entityId);
    if (!entity) return false;

    const transformComponent = entity.components.get('UnrealTransform') as UnrealTransformComponent;
    if (!transformComponent) return false;

    // Update transform from Unreal
    const updatedTransform: UnrealTransformComponent = {
      ...transformComponent,
      position: transform.position,
      rotation: transform.rotation,
      scale: transform.scale,
      lastSyncTime: performance.now(),
      isDirty: false
    };

    entity.components.set('UnrealTransform', updatedTransform);
    return true;
  }

  /**
   * Get entity by Unreal actor ID
   */
  public getEntityByActorId(actorId: string): Entity | null {
    const entityId = this.actorToEntity.get(actorId);
    return entityId ? this.entities.get(entityId) || null : null;
  }

  /**
   * Get all entities managed by this bridge
   */
  public getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  /**
   * Update sync metrics
   */
  public updateMetrics(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastSyncTime;
    
    this.syncMetrics = {
      entitiesSynced: this.entities.size,
      syncLatency: deltaTime,
      syncFrequency: deltaTime > 0 ? 1000 / deltaTime : 0,
      failedSyncs: this.syncMetrics.failedSyncs
    };

    this.lastSyncTime = currentTime;
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): UnrealSyncMetrics {
    return { ...this.syncMetrics };
  }

  /**
   * Call Unreal Engine function through Puerts bridge
   */
  private callUnrealFunction(functionName: string, parameters: any): void {
    try {
      // This will be replaced with actual Puerts calls when integrated
      if (typeof (globalThis as any).UnrealEngine !== 'undefined') {
        // Real Puerts call would be something like:
        // (globalThis as any).UnrealEngine.CallUFunction(functionName, parameters);
        console.log(`Unreal call: ${functionName}`, parameters);
      } else {
        // Development/testing mode - just log
        console.log(`[DEV] Unreal call: ${functionName}`, parameters);
      }
    } catch (error) {
      console.error(`Failed to call Unreal function ${functionName}:`, error);
    }
  }
}

export interface UnrealTransformData {
  position: Vector3;
  rotation: Quaternion;
  scale: Vector3;
}

// Global bridge instance
export let globalEntityBridge: UnrealEntityBridge | null = null;

/**
 * Initialize the entity bridge
 */
export const initializeEntityBridge = (): UnrealEntityBridge => {
  globalEntityBridge = new UnrealEntityBridge();
  return globalEntityBridge;
};