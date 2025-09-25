# ADR-010: LLM-Friendly Architecture and Integration Points

## Status
Accepted

## Context
Kinopticon must support AI integration for:
- Automated scenario generation
- Driver behavior analysis
- Real-time safety monitoring
- Research assistance
- Natural language control
- Pattern recognition

LLMs need to:
- Observe simulation state in understandable format
- Control simulation through natural language
- Analyze driver behavior patterns
- Generate research insights
- Assist with debugging and development

## Decision
Design the entire architecture to be **LLM-native** with:
- Structured, self-describing data formats
- Natural language command interface
- Semantic event streams
- SQL-queryable state
- File-based integration for development LLMs
- WebSocket API for runtime LLMs

## Consequences

### Positive
- **Natural interaction** - LLMs understand scene context
- **Research automation** - AI can run experiments
- **Pattern detection** - Automatic insight discovery
- **Safety monitoring** - Real-time risk assessment
- **Development speed** - LLM assists with coding
- **Debugging aid** - AI helps identify issues

### Negative
- Additional API surface to maintain
- Structured data overhead
- Need to handle LLM response latency
- Potential for misinterpretation
- Security considerations for command execution

### Neutral
- New paradigm for simulator control
- Need documentation for LLM prompts
- Requires prompt engineering expertise

## Architecture

### Observation API
```typescript
interface LLMObservationAPI {
  // Natural language scene description
  describeScene(): string;
  // Returns: "The red sedan is traveling at 65 km/h in the right lane,
  //          approaching a yellow traffic light that will turn red in 2 seconds.
  //          A pedestrian is waiting at the crosswalk."
  
  // Structured state with semantic labels
  getState(): SemanticState;
  // Returns: {
  //   "vehicles": [
  //     {
  //       "id": "player",
  //       "type": "sedan",
  //       "color": "red",
  //       "speed_kmh": 65,
  //       "lane": "right",
  //       "distance_to_intersection": 50
  //     }
  //   ],
  //   "traffic_lights": [...],
  //   "pedestrians": [...]
  // }
  
  // High-level events
  streamEvents(): AsyncIterator<SemanticEvent>;
  // Emits: {
  //   "type": "NEAR_MISS",
  //   "severity": "high",
  //   "description": "Vehicle A came within 1.5m of Vehicle B",
  //   "timestamp": 1234567890
  // }
  
  // SQL queries for complex analysis
  query(sql: string): QueryResult;
  // "SELECT COUNT(*) as violations FROM events 
  //  WHERE type = 'SPEED_VIOLATION' AND timestamp > NOW() - INTERVAL '5 minutes'"
}
```

### Command API
```typescript
interface LLMCommandAPI {
  // Natural language commands
  execute(command: string): Promise<CommandResult>;
  
  // Examples:
  // "Make the blue car brake suddenly"
  // "Add heavy rain to the environment"
  // "Create a traffic jam 200 meters ahead"
  // "Spawn a pedestrian crossing from the left"
  // "Change the time to sunset"
  
  // Structured commands for precision
  executeStructured(cmd: StructuredCommand): Promise<CommandResult>;
  // {
  //   "action": "spawn_vehicle",
  //   "parameters": {
  //     "type": "truck",
  //     "position": [100, 0, 0],
  //     "behavior": "aggressive"
  //   }
  // }
}
```

### Analysis API
```typescript
interface LLMAnalysisAPI {
  // Behavior pattern detection
  analyzeDriverBehavior(timeRange: TimeRange): BehaviorProfile;
  // Returns: {
  //   "risk_level": "moderate",
  //   "patterns": [
  //     "Late braking at intersections",
  //     "Frequent lane changes without signaling"
  //   ],
  //   "recommendations": [
  //     "Increase following distance",
  //     "Use turn signals consistently"
  //   ]
  // }
  
  // Predictive modeling
  predictNextAction(context: Context): Prediction;
  // Returns: {
  //   "likely_action": "brake",
  //   "confidence": 0.85,
  //   "reasoning": "Approaching red light with current speed"
  // }
  
  // Safety assessment
  assessSafety(): SafetyMetrics;
  // Returns: {
  //   "overall_risk": "low",
  //   "specific_risks": [
  //     {
  //       "type": "intersection_collision",
  //       "probability": 0.15,
  //       "mitigation": "Reduce speed before intersection"
  //     }
  //   ]
  // }
}
```

### Integration Methods

#### Development-Time Integration (File-Based)
```typescript
// LLM reads state from files
const state = JSON.parse(fs.readFileSync('/tmp/kinopticon/state/current.json'));

// LLM writes commands to file
fs.appendFileSync('/tmp/kinopticon/commands.txt', 'spawn vehicle red 0 0 0\n');

// LLM analyzes logs
const errors = fs.readFileSync('/tmp/kinopticon/logs/errors.jsonl')
  .split('\n')
  .map(line => JSON.parse(line));
```

#### Runtime Integration (WebSocket)
```typescript
// LLM connects via WebSocket
const ws = new WebSocket('ws://localhost:8091/llm');

// Subscribe to state updates
ws.send(JSON.stringify({
  type: 'subscribe',
  topics: ['state', 'events', 'metrics']
}));

// Send commands
ws.send(JSON.stringify({
  type: 'command',
  natural_language: 'Create a challenging merge scenario'
}));
```

### Prompt Engineering Guidelines
```typescript
// System prompt for simulation control
const SYSTEM_PROMPT = `
You are controlling a driving simulator for research purposes.
You can observe the current state and issue commands.

Available commands:
- spawn [vehicle_type] [color] [x] [y] [z]
- set weather [clear|rain|fog|snow] [intensity]
- set time [hour]
- pause/resume simulation
- teleport [vehicle_id] [x] [y] [z]

Current state format:
- vehicles: Array of vehicle objects with position, speed, heading
- environment: Weather, time, lighting conditions
- events: Recent events like collisions, violations

Respond with JSON commands that are safe and realistic.
`;
```

## Use Cases

### Research Automation
```python
# LLM runs automated experiment
for density in [10, 20, 30, 40]:
    send_command(f"set traffic_density {density}")
    send_command("reset metrics")
    wait(60)  # Run for 60 seconds
    metrics = get_metrics()
    analyze_results(metrics)
```

### Real-Time Coaching
```typescript
// LLM monitors and provides feedback
on('semantic_event', (event) => {
  if (event.type === 'UNSAFE_FOLLOWING_DISTANCE') {
    displayMessage('Increase following distance for safety');
  }
});
```

### Scenario Generation
```typescript
// LLM creates dynamic scenarios
const scenario = await llm.generate({
  prompt: "Create a scenario that tests emergency braking",
  constraints: {
    duration: 60,
    difficulty: "moderate",
    weather: "clear"
  }
});
```

## References
- OpenAI API: https://platform.openai.com/docs/
- Anthropic Claude API: https://docs.anthropic.com/
- WebSocket Protocol: https://datatracker.ietf.org/doc/html/rfc6455
- JSON Schema: https://json-schema.org/

---
*Date: 2025-01-25*  
*Deciders: Development Team*  
*Technical Story: LLM integration architecture*