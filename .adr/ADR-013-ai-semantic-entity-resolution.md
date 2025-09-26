# ADR-013: AI-Driven Semantic Entity Resolution

## Status
Accepted

## Context
Traditional simulation systems require hardcoded entity types ("pedestrian_group", "cyclist_group") which creates inflexibility and maintenance overhead. Each new entity type requires code changes, limiting the system's ability to handle novel scenarios or adapt to research needs.

The system needs to:
- Handle arbitrary semantic descriptions from users and LLMs
- Generate appropriate entity configurations without hardcoded types
- Adapt to new scenarios without code modifications
- Maintain compatibility with ECS component architecture
- Support real-time entity generation and modification

## Decision
Implement an **AI-Driven Semantic Entity Resolver** that dynamically interprets natural language descriptions and generates appropriate component configurations.

### Core Architecture
```
Semantic Input → AI Entity Resolver → Component Configuration → ECS Runtime
     ↓                    ↓                      ↓                ↓
"elderly couple    →  Context analysis    →  Components:      →  Simulation
waiting to cross      + Pattern matching     - AgentComponent     entities with
at zebra crossing"    + Template selection   - PlacementComp      behaviors
                      + Validation           - BehaviorComp
                                            - AppearanceComp
```

### Key Components

**1. Semantic Parser**
- Natural language processing for entity extraction
- Attribute identification (age, behavior, appearance)
- Relationship mapping (spatial, temporal, causal)
- Context understanding (cultural, environmental)

**2. Pattern Matcher**
- Component Pattern Library with common entity patterns
- Hierarchical pattern organization (generic → specific)
- Context-sensitive pattern selection
- Confidence scoring for pattern matches

**3. Component Generator** 
- Dynamic component creation from patterns
- Template instantiation with parameter filling
- Constraint satisfaction for component compatibility
- Physics validation for realistic behaviors

**4. Validation Engine**
- Semantic consistency checking
- Physical plausibility verification
- Safety constraint enforcement
- Performance impact assessment

**5. Learning System**
- Usage pattern analysis and improvement
- Success/failure feedback integration
- Domain-specific knowledge acquisition
- Cultural context learning

## Implementation Strategy

### Pattern Library Structure
```json
{
  "pattern_id": "elderly_pedestrians",
  "triggers": ["elderly", "senior", "older adult", "walking stick"],
  "component_template": {
    "AgentComponent": {
      "type": "pedestrian",
      "mobility": "reduced",
      "reaction_time": 2.5
    },
    "BehaviorComponent": {
      "caution_level": "high",
      "crossing_behavior": "wait_for_clear_gap"
    }
  }
}
```

### Resolution Process
1. **Semantic Analysis**: Parse description, extract tokens, identify context
2. **Pattern Matching**: Match tokens to patterns, rank by relevance
3. **Component Generation**: Combine patterns, apply modifications, resolve conflicts
4. **Validation**: Check constraints, verify compatibility, ensure safety

### AI Model Strategy
- **Hybrid Approach**: Local pattern matching + API fallback for complex cases
- **Performance Target**: <100ms resolution for real-time modifications
- **Reliability**: Fallback to generic patterns for resolution failures

## Consequences

### Positive
- **Ultimate Flexibility**: No hardcoded entity types, handles any semantic description
- **LLM Integration**: Perfect fit for natural language scenario generation
- **Extensibility**: New patterns added without code changes
- **Research Friendly**: Domain experts can describe scenarios in natural language
- **Self-Improving**: Learning system improves accuracy over time

### Negative
- **Complexity**: AI system adds significant architectural complexity
- **Performance**: Resolution process may impact real-time performance
- **Reliability**: AI decisions may be unpredictable or incorrect
- **Dependencies**: Requires AI/NLP capabilities and potential external APIs

### Neutral
- Pattern library maintenance and curation required
- Validation systems needed to ensure generated entities are safe/plausible
- Learning system requires usage data and feedback mechanisms

## Alternatives Considered

### Hardcoded Entity Types
- **Pros**: Simple, predictable, fast
- **Cons**: Inflexible, maintenance overhead, limited scenarios
- **Verdict**: Too restrictive for research-grade simulator

### Configuration-Based Entity Templates
- **Pros**: More flexible than hardcoded, no AI complexity
- **Cons**: Still requires predefined templates, limited natural language support
- **Verdict**: Insufficient for LLM integration goals

### Pure LLM Generation
- **Pros**: Ultimate flexibility, cutting-edge AI capabilities
- **Cons**: Expensive, slow, unreliable, network dependent
- **Verdict**: Too unreliable for real-time simulation

## Implementation Phases

### Phase 1: Basic Pattern System (Weeks 1-2)
- Component pattern library with 20-30 common patterns
- Simple semantic parser for basic entity descriptions
- Pattern matching with confidence scoring
- Component generation from templates

### Phase 2: Enhanced Resolution (Weeks 3-4)
- Context-aware pattern selection
- Multi-entity relationship handling
- Behavioral constraint satisfaction
- Cultural context integration

### Phase 3: Learning and Optimization (Weeks 5-6)
- Usage pattern learning
- User feedback integration
- Performance optimization
- Real-time resolution capabilities

### Phase 4: Advanced Integration (Week 7)
- OSM semantic enhancement
- Multi-user synchronization
- Research methodology integration
- Documentation and training

## Success Metrics
- Resolution accuracy: >90% for common scenarios
- Performance: <100ms resolution time
- Coverage: Handles 95% of research scenario descriptions
- Extensibility: New patterns addable without code changes
- User satisfaction: Researchers can describe scenarios naturally

## References
- Component-Based Architecture: ADR-011-component-based-map-architecture.md
- Multi-User Strategy: ADR-012-multi-user-map-strategy.md
- Natural Language Processing: Literature on semantic parsing and entity resolution
- ECS Patterns: Existing simulation/src/core/ecs/ implementation

---
*Date: 2025-01-25*  
*Deciders: Development Team*  
*Technical Story: AI-driven entity system for flexible scenario generation*