/**
 * Kinopticon Web Simulator Entry Point
 * 
 * Initializes the web-based driving simulator with:
 * - Three.js renderer
 * - ECS simulation core
 * - Debug infrastructure
 * - Web Components UI
 */

import { initializeRenderer } from './renderer';
import { initializeDebugSystem } from './debug';
import { initializeUI } from './ui';

/**
 * Main application entry point
 * Following the pattern: setup infrastructure, then start simulation
 */
async function main(): Promise<void> {
  console.log('🚗 Kinopticon Web Simulator Starting...');
  
  try {
    // Initialize core systems in order
    const canvas = document.getElementById('renderer') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    
    // Setup renderer first
    const renderer = await initializeRenderer(canvas);
    console.log('✅ Renderer initialized');
    
    // Setup debug infrastructure
    await initializeDebugSystem();
    console.log('✅ Debug system initialized');
    
    // Setup UI components
    initializeUI();
    console.log('✅ UI components initialized');
    
    // Simulation core will be integrated in Phase 1
    console.log('✅ Phase 0 complete - ready for simulation core');
    
    // Setup render loop
    startRenderLoop(renderer);
    console.log('✅ Render loop started');
    
  } catch (error) {
    console.error('❌ Failed to initialize Kinopticon:', error);
    
    // Display error to user
    document.body.innerHTML = `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
        color: white;
        background: #1a1a1a;
        font-family: monospace;
      ">
        <div>
          <h1>🚫 Kinopticon Failed to Start</h1>
          <p>Error: ${error instanceof Error ? error.message : String(error)}</p>
          <p>Check console for details</p>
        </div>
      </div>
    `;
  }
}

/**
 * Simple render loop - will be enhanced in Phase 1
 */
function startRenderLoop(rendererSystem: any): void {
  let lastTime = 0;
  let frameCount = 0;
  let fpsTime = 0;
  
  function render(time: number): void {
    const deltaTime = time - lastTime;
    lastTime = time;
    
    // Calculate FPS
    frameCount++;
    fpsTime += deltaTime;
    
    if (fpsTime >= 1000) {
      const fps = frameCount / (fpsTime / 1000);
      
      // Update dashboard
      const dashboard = document.querySelector('sim-dashboard') as any;
      if (dashboard) {
        dashboard.updateFPS(fps);
        dashboard.updateStatus('Running');
      }
      
      frameCount = 0;
      fpsTime = 0;
    }
    
    // Render the scene
    rendererSystem.render();
    
    requestAnimationFrame(render);
  }
  
  requestAnimationFrame(render);
}

// Start the application
main().catch(console.error);