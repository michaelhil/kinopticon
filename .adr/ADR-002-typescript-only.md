# ADR-002: TypeScript-Only Codebase

## Status
Accepted

## Context
JavaScript's dynamic typing leads to runtime errors and makes large codebases difficult to maintain. For a complex simulation system with multiple developers, we need strong type safety and excellent tooling support.

## Decision
The Kinopticon codebase will be TypeScript-only. No JavaScript files are allowed except for essential configuration files (which must be explicitly approved).

This will be enforced through:
- Automated CI/CD checks
- Pre-commit hooks
- TypeScript strict mode
- `.gitignore` blocking `*.js` files

## Consequences

### Positive
- Complete type safety across the codebase
- Better IDE support and autocomplete
- Easier refactoring with confidence
- Self-documenting code through types
- Catches errors at compile time
- Better code navigation and understanding

### Negative  
- Slightly longer initial development time
- Learning curve for developers new to TypeScript
- Need to type third-party libraries
- Build step required (handled by Bun)

### Neutral
- All team members must know TypeScript
- Type definitions become part of the API contract

## Alternatives Considered
1. **Mixed TypeScript/JavaScript**: Would lead to gradual erosion of type safety
2. **JavaScript with JSDoc**: Less powerful type checking, worse tooling
3. **Flow**: Less mature ecosystem, worse tooling support

## References
- OpenRoad Governance Framework
- TypeScript best practices documentation

---
*Date: 2025-01-10*  
*Deciders: Development Team*  
*Technical Story: Establishing code quality standards*