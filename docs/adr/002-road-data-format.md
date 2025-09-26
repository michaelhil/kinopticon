# ADR-002: Road Data Format - Hybrid Approach

## Status
Accepted

## Context
The Kinopticon project requires a robust road data format that can:
- Support realistic lane-based driving simulation
- Handle complex road geometries and intersections
- Maintain high performance for real-time 3D rendering
- Enable future compatibility with industry standards (OpenDRIVE)
- Import real-world data from OpenStreetMap

### Current Limitations
The proof-of-concept uses a simple point-based road representation with:
- No lane awareness (cars drive on "road center")
- Linear geometry only (causing jerky turns)
- No traffic rules or proper intersection handling
- Limited metadata about road properties
- Poor vertical profile handling

### Industry Analysis
We evaluated the OpenDRIVE standard (ASAM OpenDRIVE 1.7) which offers:
- **Pros**: Industry standard, comprehensive geometry support, detailed lane modeling, complex junction handling
- **Cons**: XML-based (parsing overhead), complex coordinate systems, steep implementation curve (3-6 months)

## Decision
We will implement a **hybrid approach** that creates our own optimized format while planning for OpenDRIVE compatibility:

1. **Phase 1**: Enhanced internal format with lane-level detail
2. **Phase 2**: OpenDRIVE import/export capability
3. **Phase 3**: Consider full OpenDRIVE adoption if needed

## Core Data Format

### Design Principles
- **Performance First**: Optimized for WebGL/Three.js rendering
- **Type-Safe**: Full TypeScript definitions
- **Self-Contained**: Each element has all required data
- **Extensible**: Can grow toward OpenDRIVE without breaking changes

### Key Structures

```typescript
// Core road representation
interface Road {
  id: string;
  geometry: GeometrySegment[];     // Horizontal alignment
  laneSections: LaneSection[];     // Lane configuration
  elevationProfile: ElevationProfile; // Vertical alignment
  trafficRules: TrafficRule[];     // Speed limits, restrictions
}

// Lane-level detail
interface Lane {
  id: number;                      // -n to -1 (right), 1 to n (left)
  type: LaneType;                  // driving, parking, sidewalk, etc.
  width: LaneWidth[];              // Variable width profile
  direction: 'forward' | 'backward' | 'bidirectional';
  roadMark?: RoadMarking;          // Visual markings
}

// Geometry with multiple curve types
interface GeometrySegment {
  type: 'line' | 'arc' | 'spiral' | 'spline';
  points: Vec3[];                  // Pre-computed for rendering
  parameters: GeometryParameters;  // Original parameters
}
```

## Implementation Strategy

### Phase 1: Core Format & Basic Lanes (2 weeks)
- New type system with full lane support
- Geometry engine for smooth curves
- Lane renderer with markings
- OSM import with lane inference

### Phase 2: Advanced Geometry (2 weeks)
- Arc and spline segments
- Elevation profiles
- Banking and superelevation

### Phase 3: Junctions & Traffic (2 weeks)
- Complex intersection geometry
- Traffic signals and signs
- Routing system

### Phase 4: Import/Export (2 weeks)
- OpenDRIVE parser
- OpenDRIVE exporter
- Enhanced OSM import

## Consequences

### Positive
- **Realistic Traffic**: Proper lane-based driving with lane changes
- **Smooth Geometry**: Curves, banking, realistic intersections
- **Performance**: Pre-cached boundaries, spatial indexing
- **Future-Proof**: Path to full OpenDRIVE compatibility
- **Multi-Modal**: Support for bikes, pedestrians, buses

### Negative
- **Complexity**: More complex than simple point arrays
- **Migration**: Requires rewrite of current rendering/driving systems
- **Testing**: More edge cases with lane connections

### Neutral
- Breaking changes from POC (acceptable as POC is not production)
- 8-week full implementation timeline
- New module structure required

## Technical Details

### Module Structure
```
src/core/road-format/
├── types.ts           # Type definitions
├── geometry/          # Geometry processing
├── lanes/            # Lane construction & rendering
├── junctions/        # Intersection handling
├── io/               # Import/export (OpenDRIVE, OSM)
└── routing/          # Navigation & pathfinding
```

### Performance Targets
- 60 FPS with 100km of roads
- < 100ms to load 10km² area  
- < 50MB memory for road network

### OSM Import Strategy
1. Parse OSM ways and nodes
2. Infer lane count from highway type
3. Generate lane geometry
4. Add traffic rules from tags
5. Create junction connections
6. Build spatial index

## References
- ASAM OpenDRIVE Specification v1.7
- OpenStreetMap Highway Tags
- Three.js Performance Best Practices
- TypeScript Strict Mode Guidelines

## Decision Makers
- Michael Hildebrandt (Project Lead)
- Claude (Technical Architect)

## Date
2025-09-26