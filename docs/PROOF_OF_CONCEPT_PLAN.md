# Kinopticon Proof-of-Concept Plan

## Objective
Create a minimal browser-based demo that validates the core terrain generation and entity placement concepts using Three.js, demonstrating the foundation for the full AI-driven semantic entity system.

## Demo Requirements

### Visual Elements
- **Terrain**: 1km × 1km undulating heightmap-based terrain
- **Roads**: 2-lane main road crossing the terrain + 1 branch road at 500m mark
- **Entities**: Geometric shapes representing 1 car and 1 pedestrian (static)
- **Interactive Control**: Slider to add additional pedestrian symbols at random road positions

### Technical Constraints
- Pure Three.js (no additional rendering frameworks)
- TypeScript only (maintain existing code standards)
- Integrate with existing Vite development setup
- Use existing ECS pattern for entities
- Maximum file size: 200 lines per file, 30 lines per function

## Architecture Overview

```
Terrain Generator → Road Generator → Entity Placer → Interactive Controls → Three.js Renderer
      ↓                 ↓              ↓                ↓                    ↓
  HeightmapComp      GeometryComp   PlacementComp    ControlsComp      RenderSystem
```

## Implementation Strategy

### Phase 1: Terrain Foundation
**Files to Create:**
- `src/poc/terrain.ts` - Heightmap generation and geometry creation
- `src/poc/types.ts` - POC-specific type definitions

**Approach:**
- Generate 64×64 heightmap using simple noise function
- Create Three.js PlaneGeometry with vertex displacement
- Apply basic wireframe material for terrain visualization

**Key Functions:**
```typescript
generateHeightmap(size: number, amplitude: number): number[][]
createTerrainGeometry(heightmap: number[][]): THREE.BufferGeometry
```

### Phase 2: Road System
**Files to Create:**
- `src/poc/roads.ts` - Road path generation and geometry

**Approach:**
- Define road as sequence of 3D points following terrain
- Generate road geometry as extruded ribbon along path
- Create branch road at specified distance with angle

**Key Functions:**
```typescript
generateMainRoad(terrain: TerrainData, length: number): RoadPath
generateBranchRoad(mainRoad: RoadPath, branchPoint: number, angle: number): RoadPath
createRoadGeometry(path: RoadPath, width: number): THREE.BufferGeometry
```

### Phase 3: Entity Placement
**Files to Create:**
- `src/poc/entities.ts` - Basic entity creation and placement
- `src/poc/placement.ts` - Position calculation along roads

**Approach:**
- Create simple geometric shapes (box for car, cylinder for pedestrian)
- Calculate positions along road paths with terrain height sampling
- Use existing ECS pattern for entity management

**Key Functions:**
```typescript
createCarEntity(position: Vector3): Entity
createPedestrianEntity(position: Vector3): Entity
placeEntityOnRoad(entity: Entity, road: RoadPath, distance: number): void
```

### Phase 4: Interactive Controls
**Files to Create:**
- `src/poc/controls.ts` - Slider interface and event handling

**Approach:**
- Create HTML range slider for pedestrian count
- Generate random positions along road network
- Update Three.js scene dynamically

**Key Functions:**
```typescript
createPedestrianSlider(): HTMLElement
generateRandomRoadPosition(roads: RoadPath[]): Vector3
updatePedestrianCount(count: number): void
```

### Phase 5: Integration
**Files to Modify:**
- `src/poc/index.ts` - Main POC entry point
- `src/main.ts` - Add POC route
- `src/index.html` - Add POC page link

**Integration Points:**
- Extend existing renderer system for POC scene
- Use existing debug system for development
- Maintain existing file structure patterns

## Technical Specifications

### Terrain Generation
**Heightmap Algorithm:**
```
Simple Perlin-like noise:
height = amplitude * (sin(x * frequency) + sin(y * frequency) + sin((x+y) * frequency * 0.5))
```

**Geometry Details:**
- Size: 1000m × 1000m (world units)
- Resolution: 64×64 vertices (15.6m spacing)
- Height variation: 0-50m elevation change
- Material: Wireframe for performance and clarity

### Road Generation
**Path Algorithm:**
- Main road: Straight line across terrain with terrain-following height adjustment
- Branch road: 45° angle, 200m length, connects at 500m mark
- Width: 6m total (3m per lane)

**Geometry Details:**
- Road mesh: Extruded ribbon following terrain surface
- Surface offset: +0.5m above terrain to avoid z-fighting
- Material: Solid gray color

### Entity Representation
**Car Entity:**
- Geometry: THREE.BoxGeometry(4, 1.8, 2) - approximate car dimensions
- Material: Blue color
- Placement: Center of road, facing forward

**Pedestrian Entity:**
- Geometry: THREE.CylinderGeometry(0.3, 0.3, 1.7) - approximate person
- Material: Red color  
- Placement: Road shoulder, random facing direction

### Performance Targets
- Initial load: <1 second
- Slider response: <100ms for 50 additional entities
- Frame rate: Stable 60fps
- Memory usage: <50MB for complete scene

## File Structure
```
src/poc/
├── index.ts         # Main POC entry and scene setup
├── types.ts         # POC-specific type definitions  
├── terrain.ts       # Heightmap generation and terrain geometry
├── roads.ts         # Road path calculation and geometry
├── entities.ts      # Entity creation and management
├── placement.ts     # Position calculation utilities
└── controls.ts      # Interactive UI elements
```

## Development Workflow

### Setup Phase
1. Create POC directory structure
2. Set up TypeScript exports and imports
3. Extend existing Vite configuration for POC route
4. Add POC link to main HTML page

### Development Phase
1. **Terrain**: Generate and render basic heightmap terrain
2. **Roads**: Add road geometry following terrain surface
3. **Entities**: Place static car and pedestrian on roads
4. **Controls**: Implement slider for dynamic pedestrian addition
5. **Polish**: Adjust camera, lighting, and visual appearance

### Testing Phase
1. Verify terrain generation accuracy and performance
2. Test road placement and geometry correctness
3. Validate entity positioning along road paths
4. Confirm slider responsiveness and entity limits
5. Check cross-browser compatibility

## Success Criteria

### Visual Requirements
- ✅ 1km × 1km undulating terrain visible
- ✅ Main road crossing terrain with proper height following
- ✅ Branch road at 500m mark with 45° angle
- ✅ One car and one pedestrian visible on roads
- ✅ Slider interface for pedestrian count

### Technical Requirements  
- ✅ Pure TypeScript implementation
- ✅ Integration with existing Three.js renderer
- ✅ ECS pattern usage for entity management
- ✅ File size limits maintained (<200 lines per file)
- ✅ Performance targets met (60fps, <1s load)

### Functional Requirements
- ✅ Slider adds pedestrians at random road positions
- ✅ All entities properly positioned on road surface
- ✅ Terrain height calculation accurate for entity placement
- ✅ Interactive response within 100ms

## Future Extension Points

This POC establishes the foundation for:
- **OSM Integration**: Road paths from real-world data
- **AI Entity Resolution**: Semantic descriptions → entity placement
- **Advanced Terrain**: Vegetation, buildings, environmental details  
- **Dynamic Entities**: Moving vehicles and pedestrians
- **Multi-User Support**: Shared scenarios and real-time updates

## Risk Mitigation

### Technical Risks
- **Terrain Performance**: Use LOD if 64×64 resolution too expensive
- **Road Following**: Implement robust terrain height sampling
- **Entity Positioning**: Ensure entities don't clip through terrain
- **Browser Compatibility**: Test on major browsers and mobile

### Development Risks
- **Scope Creep**: Maintain minimal feature set for POC
- **Integration Issues**: Test with existing renderer early
- **Performance Problems**: Profile and optimize during development
- **File Size Limits**: Monitor line counts throughout development

---
*Version: 1.0.0*  
*Created: 2025-01-25*  
*Status: Ready for Implementation*