# Kinopticon Data Format Specification v2.0

## Overview
Kinopticon uses a hierarchical data format that separates OSM base data, semantic entity descriptions, and AI-resolved component configurations. This enables flexible scenario generation while maintaining compatibility with OpenStreetMap data.

## Format Philosophy
- **Semantic-First**: Natural language descriptions drive entity generation
- **Component-Native**: All runtime entities exist as ECS components  
- **OSM-Compatible**: Bidirectional translation with OpenStreetMap data
- **AI-Extensible**: No hardcoded entity types, AI resolves semantics to components
- **Multi-Format**: JSON for development, MessagePack for transmission, optimized runtime representation

## Core Data Structure

### Metadata Section
```json
{
  "metadata": {
    "scenario_id": "unique_scenario_identifier",
    "version": "2.0.0",
    "description": "Human-readable scenario description",
    "created_at": "2025-01-25T10:30:00Z",
    "coordinate_system": "EPSG:4326",
    "bounds": {
      "north": 60.1234,
      "south": 60.1134, 
      "east": 10.5678,
      "west": 10.5578
    },
    "ai_resolver_version": "1.2.3"
  }
}
```

### Context Section
Defines environmental and cultural parameters that influence entity generation:

```json
{
  "context": {
    "environment": {
      "country": "Norway",
      "region_type": "rural|urban|suburban",
      "season": "spring|summer|autumn|winter", 
      "month": "January|February|...|December",
      "time": "HH:MM",
      "weather": {
        "condition": "clear|overcast|rain|snow|fog",
        "temperature": -10,
        "visibility": 8000,
        "precipitation": "none|light_drizzle|heavy_rain"
      }
    },
    "cultural_context": {
      "driving_culture": "cautious_and_rule_following|aggressive|mixed",
      "pedestrian_behavior": "traffic_aware|jaywalking_common|extremely_cautious",
      "cyclist_infrastructure": "well_integrated|separate_lanes|road_sharing"
    },
    "traffic_baseline": {
      "density": "very_low|low|moderate|high|very_high",
      "vehicle_mix": {
        "passenger_cars": 0.75,
        "commercial_vehicles": 0.20,
        "agricultural_vehicles": 0.05
      },
      "speed_compliance": 0.85
    }
  }
}
```

### OSM Base Section
Contains entities imported from OpenStreetMap with component representation:

```json
{
  "osm_base": {
    "source": {
      "imported_at": "2025-01-25T10:30:00Z",
      "osm_version": "2025-01-20",
      "quality_score": 0.87,
      "coverage": "complete|partial|sparse"
    },
    "entities": [
      {
        "id": "road_001",
        "osm_id": "way/123456789",
        "type": "road",
        "components": {
          "OSMSourceComponent": {
            "original_tags": {
              "highway": "primary",
              "ref": "E6",
              "lanes": "2",
              "maxspeed": "90",
              "surface": "asphalt"
            },
            "changeset": 12345678,
            "version": 3,
            "last_modified": "2024-12-15T14:30:00Z"
          },
          "GeometryComponent": {
            "path_encoding": "polyline6",
            "path_data": "u{~vFswjMaHpHuEpEeP`PwE`EaHpH",
            "elevation_profile": [45, 47, 52, 48, 44],
            "cross_section": {
              "total_width": 8.5,
              "lane_width": 3.5,
              "shoulder_width": 0.75,
              "median_width": 0.0
            }
          },
          "TrafficComponent": {
            "speed_limit": 90,
            "lane_count": 2,
            "lane_directions": ["forward", "forward"],
            "access_restrictions": [],
            "turn_lanes": []
          },
          "ContextComponent": {
            "semantic_tags": ["major_highway", "primary_route", "truck_route"],
            "usage_patterns": ["commuter_traffic", "recreational_cycling"],
            "importance": "regional"
          }
        }
      }
    ]
  }
}
```

### Semantic Entities Section
Natural language entity descriptions for AI resolution:

```json
{
  "semantic_entities": [
    {
      "id": "crossing_situation_001",
      "semantic_description": "elderly couple waiting to cross at zebra crossing, woman using walking stick, both wearing winter coats, cautious behavior, checking both directions multiple times",
      "context_hints": {
        "location_reference": "crossing_001",
        "location_type": "pedestrian_crossing",
        "environmental_factors": ["november", "rural_norway", "morning"],
        "behavioral_traits": ["cautious", "patient", "safety_conscious"],
        "physical_characteristics": ["elderly", "mobility_aid", "weather_appropriate_clothing"]
      },
      "constraints": {
        "placement": {
          "anchor_entity": "crossing_001",
          "position": "waiting_area",
          "facing": "crossing_direction"
        },
        "safety": {
          "min_reaction_time": 2.5,
          "movement_speed": "reduced",
          "visibility": "moderate"
        },
        "behavior": {
          "patience_level": "high",
          "risk_tolerance": "very_low"
        }
      },
      "ai_resolution": {
        "timestamp": "2025-01-25T10:35:00Z",
        "confidence": 0.92,
        "resolver_version": "1.2.3",
        "alternative_interpretations": [
          {
            "description": "family_group_with_elderly",
            "confidence": 0.15
          }
        ],
        "generated_components": {
          "AgentComponent": {
            "agent_type": "pedestrian_group",
            "group_size": 2,
            "primary_age_range": [65, 80],
            "mobility_level": "reduced",
            "group_cohesion": "tight"
          },
          "BehaviorComponent": {
            "crossing_style": "extra_cautious",
            "wait_patience": 60,
            "look_pattern": "multiple_checks",
            "group_coordination": "synchronized",
            "decision_making": "consensus_based"
          },
          "PlacementComponent": {
            "anchor_entity": "crossing_001",
            "position": "waiting_area_east",
            "facing_direction": "crossing_direction",
            "formation": "side_by_side"
          },
          "AppearanceComponent": {
            "clothing": "winter_appropriate",
            "accessories": ["walking_stick", "warm_hat"],
            "visibility_level": "moderate",
            "distinctive_features": ["mobility_aid"]
          },
          "PhysicsComponent": {
            "movement_speed": [0.8, 1.2],
            "acceleration": "slow",
            "reaction_time": 2.5,
            "stability": "requires_support"
          }
        },
        "validation_results": {
          "semantic_consistency": "pass",
          "physical_plausibility": "pass",
          "safety_constraints": "pass",
          "performance_impact": "low"
        }
      }
    }
  ]
}
```

### AI Resolver Configuration
Controls how the semantic entity resolution system operates:

```json
{
  "ai_resolver_config": {
    "resolution_mode": "conservative|balanced|creative|experimental",
    "fallback_behavior": "use_generic_templates|request_clarification|skip_entity",
    "validation_level": "strict|moderate|lenient",
    "learning_enabled": true,
    "performance_targets": {
      "max_resolution_time": 100,
      "min_confidence_threshold": 0.7,
      "max_memory_usage": "50MB"
    },
    "cultural_adaptations": {
      "enabled": true,
      "priority": "local_context|scenario_context|global_defaults"
    }
  }
}
```

## Component Specifications

### Core Component Types

**OSMSourceComponent**: Maintains link to original OSM data
```json
{
  "original_tags": { "key": "value" },
  "osm_id": "way/123456789",
  "changeset": 12345678,
  "version": 3,
  "last_modified": "2024-12-15T14:30:00Z"
}
```

**GeometryComponent**: 3D spatial representation
```json
{
  "path_encoding": "polyline6|geojson|custom",
  "path_data": "encoded_path_string",
  "elevation_profile": [45, 47, 52],
  "bounding_box": {"min": [x,y,z], "max": [x,y,z]},
  "precision": 6
}
```

**BehaviorComponent**: Entity behavior patterns
```json
{
  "behavior_type": "pedestrian|cyclist|vehicle|static",
  "movement_pattern": "linear|waypoint|random|following",
  "interaction_rules": ["avoid_vehicles", "follow_traffic_signals"],
  "decision_factors": ["safety", "efficiency", "comfort"]
}
```

### Semantic Resolution Components

**AIGeneratedComponent**: Tracks AI resolution metadata
```json
{
  "generated_by": "ai_resolver_v1.2.3",
  "generation_timestamp": "2025-01-25T10:35:00Z",
  "source_description": "elderly couple waiting to cross",
  "confidence": 0.92,
  "validation_status": "passed",
  "human_reviewed": false
}
```

## Encoding Formats

### Path Encoding
**Polyline6**: Google Polyline Algorithm with 6 decimal precision
- Precision: ~10cm accuracy
- Compression: ~50% size reduction vs. raw coordinates
- Compatibility: Industry standard, widely supported

**Elevation Profiles**: Array of elevation values at regular intervals along path
- Sampling: Every 10-50 meters depending on terrain complexity
- Interpolation: Linear between sample points
- Units: Meters above sea level

### Binary Serialization
**MessagePack**: For network transmission and storage
- Size reduction: ~30% smaller than JSON
- Performance: ~2x faster parsing than JSON
- Type preservation: Maintains numeric types and binary data

## Validation Rules

### Semantic Consistency
- Entity descriptions must be internally consistent
- Behavioral traits must align with physical capabilities
- Environmental adaptations must match context

### Physical Plausibility
- Movement speeds within realistic ranges
- Spatial relationships must be geometrically valid
- Physics properties must be realistic

### Safety Constraints
- Minimum reaction times for different age groups
- Safe placement distances from traffic
- Visibility requirements for different weather conditions

### Performance Constraints
- Entity count limits based on simulation capacity
- Component complexity limits for real-time performance
- Memory usage limits for large scenarios

## Extension Mechanisms

### Custom Components
Researchers can define domain-specific components:
```json
{
  "CustomResearchComponent": {
    "component_type": "research_instrumentation",
    "data_collection_points": ["gaze_tracking", "stress_indicators"],
    "measurement_frequency": 60,
    "export_format": "csv|json|research_specific"
  }
}
```

### Cultural Adaptations
Context-specific modifications for different regions:
```json
{
  "cultural_adaptations": {
    "norway": {
      "pedestrian_behavior": "very_cautious",
      "cyclist_integration": "well_established",
      "traffic_compliance": "very_high"
    }
  }
}
```

### Pattern Library Extensions
New semantic patterns can be added to the AI resolver:
```json
{
  "custom_patterns": [
    {
      "pattern_id": "research_specific_behavior",
      "triggers": ["domain_specific_terms"],
      "component_template": { /* custom components */ }
    }
  ]
}
```

## Version Control and Migration

### Schema Versioning
- Semantic versioning for data format changes
- Backward compatibility for minor versions
- Migration tools for major version changes

### Entity Versioning
- Individual entity version tracking
- Change history for research reproducibility
- Rollback capabilities for experimental modifications

---
*Version: 2.0.0*  
*Last Updated: 2025-01-25*  
*Status: Active*