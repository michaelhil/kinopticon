# Kinopticon Web Implementation Plan

## Overview
This document outlines the implementation plan for migrating Kinopticon from Unreal Engine to a web-based architecture using Three.js, Rapier physics, and vanilla TypeScript.

## Architecture Summary
- **Rendering**: Three.js with direct API usage (no framework wrapper)
- **UI**: Native Web Components (no React/Vue/Svelte)
- **Physics**: Rapier WASM in Web Worker
- **State**: Event-driven custom store (~50 lines)
- **Build**: Vite with TypeScript
- **Debug**: File-based logging and command system

## Core Principles
1. **Functional Core, Imperative Shell**: ECS remains purely functional
2. **Zero Framework Overhead**: No UI frameworks in render loop
3. **LLM-Native**: All APIs designed for AI integration
4. **File Size Limits**: Max 200 lines per file, 30 lines per function
5. **Performance First**: 60 FPS with 50+ vehicles

## Phase 0: Foundation (Days 1-2)

### Tasks
- [ ] Archive Unreal code with git tag
- [ ] Delete Unreal directories
- [ ] Setup Vite + TypeScript + Three.js
- [ ] Implement file-based logger
- [ ] Create debug file watchers
- [ ] Setup basic Web Components

### File Structure
```
kinopticon/
├── src/
│   ├── core/          # Existing ECS (unchanged)
│   ├── renderer/      # Three.js (new)
│   ├── debug/         # Logging system (new)
│   └── main.ts        # Entry point
├── server/
│   └── debug-server.ts # WebSocket for logs
└── debug/             # Log files (git-ignored)
```

## Phase 1: Core Migration (Week 1)

### Goals
- Port existing ECS to browser
- Create Three.js renderer
- Basic scene with camera
- Debug overlay component

### Deliverables
- Rotating cube using ECS
- FPS counter
- Console output to files

### File Organization
```
src/renderer/
├── index.ts       (10 lines - exports)
├── scene.ts       (50 lines - scene setup)
├── camera.ts      (30 lines - camera control)
├── mesh-pool.ts   (100 lines - object pooling)
└── render-loop.ts (50 lines - frame loop)
```

## Phase 2: Physics + Basic Maps (Week 2)

### Goals
- Initialize Rapier WASM
- Physics in Web Worker
- SharedArrayBuffer communication
- Basic OSM map loading
- Simple intersection geometry

### Deliverables
- Driveable box with physics
- Real road intersection from OSM
- Collision detection with road geometry

### Architecture
```typescript
// Physics runs in worker
workers/physics.worker.ts (150 lines)
src/physics/
├── index.ts        (10 lines)
├── world.ts        (50 lines)
├── bridge.ts       (80 lines - main/worker communication)
└── vehicle.ts      (150 lines - vehicle physics)

src/maps/
├── index.ts        (10 lines)
├── osm-loader.ts   (120 lines - basic OSM parsing)
├── geometry.ts     (100 lines - Three.js conversion)
└── cache.ts        (80 lines - IndexedDB caching)
```

## Phase 3: Input & Control (Week 3)

### Goals
- Keyboard input handler
- Gamepad support
- Command file watcher
- Input replay

### Deliverables
- WASD vehicle control
- Gamepad support
- Command system working

### File Structure
```
src/input/
├── index.ts        (10 lines)
├── keyboard.ts     (50 lines)
├── gamepad.ts      (80 lines)
└── commands.ts     (100 lines - file watcher)
```

## Phase 4: Environment (Week 4)

### Goals
- Procedural roads
- Basic terrain
- Skybox
- Traffic system

### Deliverables
- Driving on roads
- Multiple AI vehicles
- Day/night cycle

## Phase 5: LLM Integration (Week 5)

### Goals
- Observation API
- Natural language commands
- Behavior analysis
- WebSocket API

### Deliverables
- LLM can observe state
- Natural language control
- Semantic event stream

### API Structure
```
src/ai/
├── index.ts         (10 lines)
├── observer.ts      (100 lines - state observation)
├── commander.ts     (80 lines - command interpreter)
├── analyzer.ts      (120 lines - behavior analysis)
└── websocket.ts     (50 lines - external API)
```

## Phase 6: Optimization (Week 6)

### Goals
- Instanced rendering
- LOD system
- Spatial hashing
- Memory pooling

### Performance Targets
- 60 FPS with 50 vehicles
- <200MB memory usage
- <16ms frame time

## Phase 7: Multiplayer + Map Distribution (Week 7)

### Goals
- WebSocket server with room management
- Multi-user map distribution system
- State synchronization for vehicles and dynamic elements
- Shared scenario generation
- Lag compensation

### Deliverables
- 4 players in same session with shared OSM map
- Synchronized physics and traffic lights
- Scenario coordination system
- Chat and voice communication

### Map Distribution Architecture
```typescript
src/network/
├── map-distributor.ts (150 lines - chunked map sharing)
├── scenario-sync.ts   (100 lines - seed distribution)
├── room-manager.ts    (120 lines - session coordination)
└── state-sync.ts      (180 lines - vehicle/element sync)

server/
├── map-server.ts      (200 lines - OSM processing)
├── scenario-host.ts   (150 lines - research coordination)
└── rooms.ts           (100 lines - session management)
```

## Phase 8: Data & Analytics (Week 8)

### Goals
- Telemetry collection
- OPFS storage
- SQLite WASM
- Export functionality

### Deliverables
- Research-ready data
- Real-time dashboard
- CSV/JSON export

## Development Workflow

### Daily Development
```bash
# Terminal 1: Development server
bun run dev

# Terminal 2: Debug monitor
tail -f debug/logs/console.jsonl | jq

# Terminal 3: Command interface
echo "spawn vehicle" >> debug/commands.txt

# Terminal 4: State inspector
watch -n 1 'jq . debug/state/current.json'
```

### Code Standards Enforcement
```typescript
// Every file follows:
// - Max 200 lines
// - Functions max 30 lines
// - Single responsibility
// - Clear exports

// Example structure:
export function createVehicle(config: VehicleConfig): Vehicle {
  validateConfig(config);  // 10 lines
  const body = createBody(config);  // 15 lines
  const wheels = createWheels(config);  // 20 lines
  return assembleVehicle(body, wheels);  // 10 lines
}
```

## Testing Strategy

### Unit Tests
- Each module has tests
- Test files mirror source structure
- Use Vitest for speed

### Integration Tests
- Playwright for browser testing
- Test critical user flows
- Screenshot comparisons

### Performance Tests
- Automated FPS monitoring
- Memory leak detection
- Load testing with bots

## Documentation Requirements

### Code Documentation
- JSDoc for public APIs
- README in each module
- Architecture diagrams

### User Documentation
- Getting started guide
- API reference
- Research examples

## Success Criteria

| Metric | Target | Measurement |
|--------|--------|-------------|
| Performance | 60 FPS | Performance.now() |
| Load Time | <2s initial, <10s map | Lighthouse + custom |
| Bundle Size | <500KB | Vite analysis |
| Memory | <200MB | Chrome DevTools |
| Map Load | <10s for 5km² | Custom metrics |
| Multi-User Sync | <50ms latency | WebSocket timing |
| Code Quality | A | ESLint score |
| Test Coverage | >80% | Vitest coverage |

## Risk Mitigation

### Technical Risks
- **WebGL compatibility**: Fallback to WebGL1
- **SharedArrayBuffer**: Fallback to message passing  
- **WASM support**: Fallback to asm.js
- **OSM data size**: Implement progressive loading and LOD
- **Map sync failures**: Graceful degradation to single-user mode
- **IndexedDB storage limits**: Implement LRU cache eviction

### Development Risks
- **Scope creep**: Strict phase boundaries
- **Performance**: Profile early and often
- **Complexity**: Enforce file size limits

## Migration Checklist

### Pre-Migration
- [x] Document architecture decisions
- [x] Create implementation plan
- [ ] Setup development environment
- [ ] Archive Unreal code

### Phase 0 Checklist
- [ ] Delete Unreal directories
- [ ] Initialize Vite project
- [ ] Setup TypeScript config
- [ ] Add Three.js dependency
- [ ] Create debug infrastructure
- [ ] Implement logger
- [ ] Setup file watchers
- [ ] Create Web Components base
- [ ] Verify ECS compatibility
- [ ] Test debug pipeline

## References
- [Three.js Documentation](https://threejs.org/docs/)
- [Rapier Documentation](https://rapier.rs/docs/)
- [Web Components MDN](https://developer.mozilla.org/en-US/docs/Web/Web_Components)
- [Vite Documentation](https://vitejs.dev/)
- Architecture Decision Records: `.adr/`

---
*Last Updated: 2025-01-25*
*Version: 1.0.0*
*Status: Active*