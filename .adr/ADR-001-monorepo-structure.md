# ADR-001: Use Monorepo Structure

## Status
Accepted

## Context
The Kinopticon driving simulator requires coordination between multiple subsystems:
- TypeScript simulation core
- Unreal Engine 5 visualization
- Physics calculations
- AI behavior systems
- Development tools

We need to decide how to organize these components for optimal development workflow.

## Decision
We will use a monorepo structure with all components in a single Git repository.

The repository structure will have clear module boundaries:
- `/simulation` - TypeScript simulation logic
- `/unreal` - Unreal Engine 5 project
- `/tools` - Development and build tools
- `/docs` - Documentation

## Consequences

### Positive
- Atomic commits across all subsystems
- Shared tooling and configuration
- Easier refactoring across boundaries
- Single source of truth for versions
- Simplified CI/CD pipeline

### Negative  
- Larger repository size (mitigated with Git LFS)
- All developers need full repository
- More complex initial setup
- Potential for tighter coupling

### Neutral
- Single issue tracking and PR process
- Unified versioning strategy

## Alternatives Considered
1. **Multi-repository with Git submodules**: More complex coordination, harder atomic commits
2. **Separate repositories with package publishing**: Version synchronization challenges
3. **Nx/Lerna style monorepo tools**: Additional complexity not needed for our scale

## References
- Phase 0 Foundation Plan
- Project structure discussion in initial requirements

---
*Date: 2025-01-10*  
*Deciders: Development Team*  
*Technical Story: Initial project setup*