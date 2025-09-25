# ADR-012: Multi-User Map Sharing Strategy

## Status
Accepted

## Context
Multi-user driving simulations require shared maps between browser instances to ensure:
- Consistent collision detection and physics
- Synchronized traffic and environmental elements  
- Reproducible research scenarios
- Identical visual representation across participants

The system must support:
- 4-32 simultaneous users
- Real-time scenario modifications
- Research-grade reproducibility
- Various map sources (OSM, procedural, custom)
- Multi-modal transportation (cars, bikes, pedestrians)

Three main approaches were evaluated:
1. **Pure Procedural Generation**: Share seeds, generate locally
2. **OpenStreetMap (OSM) Based**: Pre-processed real-world data
3. **Hybrid**: OSM base + procedural scenarios

## Decision
Implement a **Hybrid Map Architecture** with:
- **OSM base maps** for real-world road networks (cached locally)
- **Procedural scenario layers** for traffic patterns and events
- **Chunked distribution** for performance optimization
- **Real-time synchronization** for dynamic elements

## Architecture

### Map Data Structure
```typescript
interface KinopticonMapSystem {
  // Static geometry (5-15MB, cached locally)
  base_map: {
    source: 'osm' | 'custom';
    data: CompressedMapData;
    version: string;
    cache_key: string;
  };
  
  // Dynamic scenarios (~1KB, shared as seeds)
  scenario: {
    seed: string;
    parameters: ScenarioParams;
    modifications: Override[];
  };
  
  // Real-time elements (WebSocket sync)
  dynamic_elements: {
    traffic_lights: TrafficLightState[];
    weather: WeatherState;
    obstacles: Obstacle[];
  };
}
```

### Distribution Strategy
1. **Base Maps**: HTTP download + local caching with service worker
2. **Scenarios**: WebSocket seed distribution with deterministic generation
3. **Dynamic Updates**: Real-time WebSocket synchronization
4. **Chunked Loading**: Progressive map loading based on proximity

### Performance Targets
- Initial map load: <10 seconds for 5km² urban area
- Scenario distribution: <500ms for full room
- Memory usage: <200MB per client for large maps
- Network bandwidth: <1MB/minute after initial load

## Consequences

### Positive
- **Research validity**: Real-world OSM road networks
- **Scenario flexibility**: Procedural traffic and events
- **Performance**: Cached base maps, minimal scenario data
- **Reproducibility**: Version-controlled maps + deterministic scenarios
- **Scalability**: Distributed generation reduces server load
- **Multi-modal**: OSM supports pedestrian/bike path data

### Negative
- **Complexity**: Two-layer map system to maintain
- **Storage**: Client-side caching requirements (~50-100MB)
- **Processing**: Local scenario generation adds CPU load
- **Network**: Initial OSM download can be large
- **Synchronization**: Complex state management for dynamic elements

### Neutral
- OSM data licensing requirements (ODbL)
- Need preprocessing pipeline for OSM→Three.js conversion
- Cache invalidation strategies required

## Implementation Phases

### Phase 2: Basic OSM Integration
- Simple intersection loader from OSM data
- Three.js geometry generation
- Local caching with IndexedDB

### Phase 3: Multi-User Foundation
- Map distribution protocol (chunked HTTP + WebSocket)
- Scenario seed sharing system
- Basic synchronization for dynamic elements

### Phase 7: Advanced Multi-User
- Full chunked loading with proximity culling
- Real-time scenario modification
- Multi-modal network support

## Technical Specifications

### Map Chunk Format
```typescript
interface MapChunk {
  id: ChunkId;                    // Geographic tile ID
  geometry: CompressedGeometry;   // Road meshes + collision
  metadata: {
    speed_limits: Record<RoadId, number>;
    lane_counts: Record<RoadId, number>;
    surface_types: Record<RoadId, SurfaceType>;
  };
  references: ChunkId[];          // Adjacent chunks
}
```

### Caching Strategy
- **Service Worker**: Intercept map requests, serve from cache
- **IndexedDB**: Store processed geometry data
- **Cache Headers**: HTTP ETags for version checking
- **Cleanup**: LRU eviction when storage limit reached

### Scenario Generation
```typescript
interface ScenarioGenerator {
  generateTrafficPattern(seed: string, density: number): Vehicle[];
  placeObstacles(seed: string, scenario: ScenarioType): Obstacle[];
  configureWeather(seed: string, conditions: WeatherType): WeatherState;
}
```

## Alternatives Considered

### Pure Procedural Generation
- **Pros**: Minimal bandwidth, infinite variety
- **Cons**: Poor research validity, determinism challenges
- **Verdict**: Insufficient for research-grade simulator

### Pure OSM Distribution  
- **Pros**: Maximum accuracy, simple implementation
- **Cons**: Large bandwidth, limited scenario control
- **Verdict**: Too rigid for research scenarios

### Server-Authoritative Maps
- **Pros**: Perfect consistency, centralized control
- **Cons**: High server load, bandwidth costs, latency
- **Verdict**: Doesn't scale to target user counts

## References
- OpenStreetMap: https://www.openstreetmap.org/
- OSM Data Processing: https://wiki.openstreetmap.org/wiki/Overpass_API
- Three.js Geometry: https://threejs.org/docs/#api/en/core/Geometry
- Service Worker Caching: https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API

---
*Date: 2025-01-25*  
*Deciders: Development Team*  
*Technical Story: Multi-user map architecture*