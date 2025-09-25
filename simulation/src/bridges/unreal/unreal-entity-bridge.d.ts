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
    readonly className: string;
}
export interface UnrealTransformComponent extends Component {
    readonly type: 'UnrealTransform';
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
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
export declare class UnrealEntityBridge {
    private entities;
    private actorToEntity;
    private syncMetrics;
    private lastSyncTime;
    private syncCount;
    constructor();
    /**
     * Register an entity with Unreal Engine actor
     */
    registerEntity(entity: Entity, actorId: string, actorType: string, className: string): void;
    /**
     * Update entity transform from ECS to Unreal
     */
    syncEntityToUnreal(entityId: string): boolean;
    /**
     * Update entity transform from Unreal to ECS
     */
    syncUnrealToEntity(actorId: string, transform: UnrealTransformData): boolean;
    /**
     * Get entity by Unreal actor ID
     */
    getEntityByActorId(actorId: string): Entity | null;
    /**
     * Get all entities managed by this bridge
     */
    getAllEntities(): Entity[];
    /**
     * Update sync metrics
     */
    updateMetrics(): void;
    /**
     * Get performance metrics
     */
    getMetrics(): UnrealSyncMetrics;
    /**
     * Call Unreal Engine function through Puerts bridge
     */
    private callUnrealFunction;
}
export interface UnrealTransformData {
    position: Vector3;
    rotation: Quaternion;
    scale: Vector3;
}
export declare let globalEntityBridge: UnrealEntityBridge | null;
/**
 * Initialize the entity bridge
 */
export declare const initializeEntityBridge: () => UnrealEntityBridge;
//# sourceMappingURL=unreal-entity-bridge.d.ts.map