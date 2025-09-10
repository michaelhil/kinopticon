/**
 * Unit tests for ECS system
 * 
 * Tests the core Entity Component System functionality to ensure
 * proper entity management and component operations.
 */

import { describe, it, expect } from 'bun:test';
import {
  createEntity,
  addComponent,
  removeComponent,
  getComponent,
  hasComponent,
  hasComponents,
  createWorld,
} from '@core/ecs/index.ts';
import type { Component } from '@core/index.ts';

// Test components
interface TestTransform extends Component {
  readonly type: 'transform';
  readonly x: number;
  readonly y: number;
}

interface TestVelocity extends Component {
  readonly type: 'velocity';
  readonly vx: number;
  readonly vy: number;
}

const createTestTransform = (x: number, y: number): TestTransform => ({
  type: 'transform',
  x,
  y,
});

const createTestVelocity = (vx: number, vy: number): TestVelocity => ({
  type: 'velocity',
  vx,
  vy,
});

describe('ECS Entity Tests', () => {
  it('should create entity with unique ID', () => {
    const entity1 = createEntity();
    const entity2 = createEntity();
    
    expect(entity1.id).toBeDefined();
    expect(entity2.id).toBeDefined();
    expect(entity1.id).not.toBe(entity2.id);
    expect(entity1.components.size).toBe(0);
  });

  it('should create entity with custom ID', () => {
    const customId = 'test-entity-123';
    const entity = createEntity(customId);
    
    expect(entity.id).toBe(customId);
  });

  it('should add component to entity', () => {
    const entity = createEntity();
    const transform = createTestTransform(10, 20);
    const entityWithComponent = addComponent(entity, transform);
    
    expect(entityWithComponent.components.size).toBe(1);
    expect(hasComponent(entityWithComponent, 'transform')).toBe(true);
    
    const retrieved = getComponent<TestTransform>(entityWithComponent, 'transform');
    expect(retrieved).toBeDefined();
    expect(retrieved?.x).toBe(10);
    expect(retrieved?.y).toBe(20);
  });

  it('should remove component from entity', () => {
    let entity = createEntity();
    entity = addComponent(entity, createTestTransform(10, 20));
    entity = addComponent(entity, createTestVelocity(5, -3));
    
    expect(entity.components.size).toBe(2);
    
    entity = removeComponent(entity, 'transform');
    
    expect(entity.components.size).toBe(1);
    expect(hasComponent(entity, 'transform')).toBe(false);
    expect(hasComponent(entity, 'velocity')).toBe(true);
  });

  it('should check for multiple components', () => {
    let entity = createEntity();
    entity = addComponent(entity, createTestTransform(0, 0));
    entity = addComponent(entity, createTestVelocity(1, 1));
    
    expect(hasComponents(entity, ['transform'])).toBe(true);
    expect(hasComponents(entity, ['velocity'])).toBe(true);
    expect(hasComponents(entity, ['transform', 'velocity'])).toBe(true);
    expect(hasComponents(entity, ['transform', 'velocity', 'nonexistent'])).toBe(false);
  });
});

describe('ECS World Tests', () => {
  it('should manage entities', () => {
    const world = createWorld();
    const entity = createEntity('test-entity');
    
    expect(world.entities.size).toBe(0);
    
    world.addEntity(entity);
    expect(world.entities.size).toBe(1);
    expect(world.getEntity('test-entity')).toBe(entity);
    
    world.removeEntity('test-entity');
    expect(world.entities.size).toBe(0);
    expect(world.getEntity('test-entity')).toBeUndefined();
  });

  it('should query entities by components', () => {
    const world = createWorld();
    
    // Create entities with different component combinations
    let entity1 = createEntity('entity1');
    entity1 = addComponent(entity1, createTestTransform(0, 0));
    world.addEntity(entity1);
    
    let entity2 = createEntity('entity2');
    entity2 = addComponent(entity2, createTestVelocity(1, 1));
    world.addEntity(entity2);
    
    let entity3 = createEntity('entity3');
    entity3 = addComponent(entity3, createTestTransform(10, 10));
    entity3 = addComponent(entity3, createTestVelocity(2, 2));
    world.addEntity(entity3);
    
    // Query tests
    const transformEntities = world.query(['transform']);
    expect(transformEntities).toHaveLength(2);
    expect(transformEntities.some(e => e.id === 'entity1')).toBe(true);
    expect(transformEntities.some(e => e.id === 'entity3')).toBe(true);
    
    const velocityEntities = world.query(['velocity']);
    expect(velocityEntities).toHaveLength(2);
    
    const bothComponents = world.query(['transform', 'velocity']);
    expect(bothComponents).toHaveLength(1);
    expect(bothComponents[0].id).toBe('entity3');
    
    const nonExistent = world.query(['nonexistent']);
    expect(nonExistent).toHaveLength(0);
  });
});