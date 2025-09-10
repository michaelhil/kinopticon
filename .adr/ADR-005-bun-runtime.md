# ADR-005: Use Bun as Primary Runtime

## Status
Accepted

## Context
The Kinopticon simulation requires a high-performance JavaScript/TypeScript runtime. We need fast execution, quick startup times, and good developer experience for our TypeScript-first codebase.

## Decision
We will use Bun as our primary runtime for the TypeScript simulation code.

Bun will be used for:
- Running TypeScript directly without compilation
- Package management (replacing npm/yarn)
- Test running
- Bundling when needed

Node.js compatibility will be maintained as a fallback.

## Consequences

### Positive
- Significantly faster than Node.js (up to 3x)
- Native TypeScript execution without build step
- Built-in test runner and bundler
- Faster package installation
- Better memory usage
- WebAssembly support for performance-critical code

### Negative  
- Newer ecosystem, potentially less stable
- Some npm packages may have compatibility issues
- Smaller community compared to Node.js
- Team learning curve

### Neutral
- Need to maintain Node.js compatibility as fallback
- Bun-specific optimizations may not transfer

## Alternatives Considered
1. **Node.js**: Slower performance, requires TypeScript compilation
2. **Deno**: Less npm compatibility, smaller ecosystem
3. **Native compilation (via AssemblyScript)**: Too restrictive for development

## References
- Bun documentation: https://bun.sh/
- Performance benchmarks comparing runtimes
- TypeScript execution strategy

---
*Date: 2025-01-10*  
*Deciders: Development Team*  
*Technical Story: Runtime environment selection*