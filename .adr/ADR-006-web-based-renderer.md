# ADR-006: Web-Based Renderer with Three.js

## Status
Accepted

## Context
After attempting Unreal Engine integration, we encountered:
- Complex Blueprint API changes between UE versions
- Difficulty with LLM-assisted Blueprint development
- Path issues with special characters in usernames
- Heavy installation requirements for research participants
- Limited debugging capabilities from browser-based development environment

We need a rendering solution that:
- Works entirely in the browser
- Has stable, well-documented APIs
- Enables rapid development with LLM assistance
- Provides excellent debugging capabilities
- Requires zero installation for research participants

## Decision
We will replace Unreal Engine with a web-based rendering stack using Three.js for 3D graphics.

The rendering architecture will be:
- **Three.js** for WebGL rendering
- **Direct API usage** without React Three Fiber or other wrappers
- **Web Components** for UI elements
- **Canvas API** for 2D overlays
- **WebGPU** ready for future performance gains

## Consequences

### Positive
- Zero installation required - participants access via URL
- Cross-platform by default (Windows, Mac, Linux, tablets)
- Excellent debugging with browser DevTools
- Stable, mature API with extensive documentation
- Direct control over rendering pipeline
- Hot module replacement for rapid development
- Easy integration with web-based data collection
- Native support for screen recording and streaming

### Negative
- Lower graphical fidelity than Unreal Engine
- Need to implement own asset pipeline
- Limited to browser performance constraints
- No native C++ performance optimizations
- Must implement own physics integration

### Neutral
- Requires learning Three.js specifics
- Different asset formats (GLTF vs FBX)
- Need custom vehicle and environment models

## Alternatives Considered
1. **Babylon.js**: Heavier framework, less community support
2. **PlayCanvas**: Includes editor but less flexible
3. **Unity WebGL**: Large build sizes, poor performance
4. **Native WebGPU**: Too early, limited browser support
5. **Continue with Unreal**: Blueprint complexity and version issues

## Implementation Notes
```typescript
// Direct Three.js usage for maximum control
const renderer = new THREE.WebGLRenderer({ 
  antialias: true,
  powerPreference: "high-performance" 
});
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

// No framework overhead
renderer.render(scene, camera);
```

## Migration Path
1. Archive existing Unreal code with git tag
2. Remove Unreal dependencies from project
3. Setup Vite + Three.js development environment
4. Port existing ECS to browser environment
5. Implement Three.js renderer as thin layer over ECS

## References
- Three.js documentation: https://threejs.org/docs/
- WebGL best practices: https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/Best_practices
- Performance comparison: Native vs Web rendering

---
*Date: 2025-01-25*  
*Deciders: Development Team*  
*Technical Story: Renderer technology selection*  
*Supersedes: ADR-003 (Puerts Integration)*