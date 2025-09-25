# ADR-003: Use Puerts for TypeScript-Unreal Integration

## Status
SUPERSEDED by ADR-006 (Web-Based Renderer)

## Context
The Kinopticon simulator needs to integrate TypeScript simulation logic with Unreal Engine 5 visualization. We need a robust way to run TypeScript code within the Unreal Engine context and communicate between the two systems.

## Decision
We will use Puerts (PUER TypeScript) as our TypeScript integration solution for Unreal Engine.

Puerts will be used for:
- Running TypeScript code within Unreal Engine
- Binding C++ classes to TypeScript
- Handling events between systems
- Managing game logic in TypeScript

## Consequences

### Positive
- Direct TypeScript execution in Unreal Engine
- Mature solution used in production games
- Good performance with V8 backend
- Automatic binding generation for reflected APIs
- Hot reload support for rapid development
- Access to all Blueprint-exposed functionality

### Negative  
- Additional dependency to maintain
- Learning curve for Puerts-specific patterns
- Potential version compatibility issues with UE updates
- Debugging across language boundaries can be complex

### Neutral
- Requires careful management of TypeScript files in UE project
- Need to maintain bindings for non-reflected C++ code

## Alternatives Considered
1. **External Process + IPC**: Higher latency, complex synchronization
2. **UnrealJS**: Less maintained, older architecture
3. **Pure C++ with TypeScript compilation**: Loss of runtime flexibility
4. **WebSocket communication**: Too much overhead for real-time simulation

## References
- Puerts documentation: https://puerts.github.io/
- Unreal Engine TypeScript integration analysis
- Phase 0 Foundation Plan

---
*Date: 2025-01-10*  
*Deciders: Development Team*  
*Technical Story: Unreal Engine integration strategy*