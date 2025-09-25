# ADR-011: Code Organization and Maintainability Standards

## Status
Accepted

## Context
Large codebases become unmaintainable when:
- Files exceed 200-300 lines
- Functions exceed 50 lines
- Classes have too many responsibilities
- Deep nesting makes code hard to follow
- Dependencies are tightly coupled

We need strict standards to ensure:
- Code remains maintainable
- Functions have single responsibilities
- Files are focused and cohesive
- LLMs can easily understand and modify code
- New team members can quickly onboard

## Decision
Enforce strict code organization standards:

### File Size Limits
- **Maximum file size**: 200 lines (hard limit: 300)
- **Sweet spot**: 50-150 lines per file
- **Single responsibility** per file

### Function Standards  
- **Maximum function length**: 30 lines (hard limit: 50)
- **Sweet spot**: 5-20 lines
- **Cyclomatic complexity**: ≤ 5
- **Parameters**: ≤ 4 (use config objects for more)
- **Nesting depth**: ≤ 3 levels

### Module Organization
```typescript
// Each module gets its own directory with index
src/
  physics/
    world.ts        (50 lines - physics world setup)
    vehicle.ts      (150 lines - vehicle physics)
    collision.ts    (100 lines - collision detection)
    constants.ts    (30 lines - physics constants)
    index.ts        (10 lines - public exports)
```

## Consequences

### Positive
- **Easier testing** - small functions are simple to test
- **Better readability** - no scrolling through huge files
- **Clear responsibilities** - each file has one job
- **LLM-friendly** - fits in context windows
- **Faster compilation** - smaller compilation units
- **Easier code reviews** - manageable chunks
- **Simpler debugging** - isolated functionality

### Negative
- More files to manage
- Need good file naming conventions
- Import statements increase
- Initial setup takes longer

### Neutral
- Different from monolithic file approach
- Requires discipline to maintain
- Need tooling to enforce limits

## Implementation Standards

### File Organization Pattern
```typescript
// vehicle-controller.ts (max 150 lines)
import type { Vehicle, VehicleConfig } from './types.ts';
import { calculateForces } from './physics/forces.ts';
import { updatePosition } from './physics/position.ts';
import { applyInput } from './input/handler.ts';

// Single purpose: Vehicle control logic
export class VehicleController {
  constructor(private config: VehicleConfig) {}
  
  // Small, focused methods
  update(dt: number): void {
    const forces = this.calculateForces(dt);
    this.applyForces(forces, dt);
    this.updatePosition(dt);
  }
  
  private calculateForces(dt: number): Forces {
    // Max 20 lines
  }
  
  private applyForces(forces: Forces, dt: number): void {
    // Max 20 lines
  }
}
```

### Function Decomposition
```typescript
// ❌ BAD - Too long, does too much
function processVehicle(vehicle: Vehicle, input: Input, dt: number) {
  // 100+ lines of mixed concerns
  // Physics calculations
  // Input processing  
  // State updates
  // Event handling
}

// ✅ GOOD - Decomposed into small functions
function processVehicle(vehicle: Vehicle, input: Input, dt: number): void {
  const controlInput = processInput(input);
  const forces = calculateVehicleForces(vehicle, controlInput);
  applyForcesToVehicle(vehicle, forces, dt);
  updateVehicleState(vehicle, dt);
  emitVehicleEvents(vehicle);
}

function processInput(input: Input): ControlInput {
  // 10 lines - single responsibility
}

function calculateVehicleForces(vehicle: Vehicle, input: ControlInput): Forces {
  // 15 lines - just force calculation
}

function applyForcesToVehicle(vehicle: Vehicle, forces: Forces, dt: number): void {
  // 12 lines - apply physics
}
```

### Module Structure
```typescript
// Bad: monolithic file (500+ lines)
// src/physics.ts - Everything in one file

// Good: organized module
// src/physics/
//   ├── index.ts          (10 lines - exports)
//   ├── world.ts          (80 lines - world management)
//   ├── rigid-body.ts     (120 lines - rigid body)
//   ├── constraints.ts    (100 lines - constraints)
//   ├── collision/
//   │   ├── detection.ts  (150 lines)
//   │   ├── response.ts   (120 lines)
//   │   └── index.ts      (5 lines)
//   └── vehicle/
//       ├── suspension.ts  (80 lines)
//       ├── tires.ts       (150 lines)
//       ├── engine.ts      (100 lines)
//       └── index.ts       (5 lines)
```

### Enforcing Standards

#### ESLint Configuration
```json
{
  "rules": {
    "max-lines": ["error", {
      "max": 200,
      "skipBlankLines": true,
      "skipComments": true
    }],
    "max-lines-per-function": ["error", {
      "max": 30,
      "skipBlankLines": true
    }],
    "max-depth": ["error", 3],
    "max-params": ["error", 4],
    "complexity": ["error", 5]
  }
}
```

#### Pre-commit Hooks
```bash
#!/bin/bash
# .git/hooks/pre-commit

# Check file sizes
for file in $(git diff --cached --name-only | grep -E '\.(ts|js)$'); do
  lines=$(wc -l < "$file")
  if [ "$lines" -gt 300 ]; then
    echo "Error: $file has $lines lines (max: 300)"
    exit 1
  fi
done
```

### Refactoring Guidelines

When a file exceeds limits:
1. **Identify cohesive groups** of functions
2. **Extract to new files** with clear names
3. **Create directory** if multiple related files
4. **Add index.ts** for clean exports
5. **Update imports** in dependent files

When a function exceeds limits:
1. **Identify logical sections**
2. **Extract helper functions**
3. **Use early returns** to reduce nesting
4. **Consider strategy pattern** for complex logic
5. **Add unit tests** for each new function

## Examples

### Before Refactoring
```typescript
// renderer.ts (400+ lines)
export class Renderer {
  // 20+ methods
  // Multiple responsibilities
  // Hard to test
}
```

### After Refactoring
```typescript
// renderer/
//   ├── index.ts
//   ├── scene.ts (50 lines)
//   ├── camera.ts (80 lines)
//   ├── lights.ts (60 lines)
//   ├── meshes.ts (100 lines)
//   └── materials.ts (70 lines)
```

## References
- Clean Code by Robert C. Martin
- Code Complete by Steve McConnell
- Google TypeScript Style Guide
- Airbnb JavaScript Style Guide

---
*Date: 2025-01-25*  
*Deciders: Development Team*  
*Technical Story: Code organization and maintainability standards*