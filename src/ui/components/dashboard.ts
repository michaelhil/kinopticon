/**
 * Simulation Dashboard Component
 * 
 * Displays simulation metrics (speed, FPS, etc.)
 * Native Web Component - no framework dependencies
 */

class SimulationDashboard extends HTMLElement {
  private fpsElement: HTMLElement;
  private speedElement: HTMLElement;
  private statusElement: HTMLElement;
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: fixed;
          top: 20px;
          left: 20px;
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 16px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          min-width: 200px;
          backdrop-filter: blur(4px);
        }
        
        .metric {
          margin: 4px 0;
          display: flex;
          justify-content: space-between;
        }
        
        .label {
          opacity: 0.8;
        }
        
        .value {
          font-weight: bold;
          color: #00ff88;
        }
        
        .status {
          color: #ffaa00;
          font-weight: bold;
        }
      </style>
      
      <div class="metric">
        <span class="label">FPS:</span>
        <span class="value" id="fps">--</span>
      </div>
      
      <div class="metric">
        <span class="label">Speed:</span>
        <span class="value" id="speed">0 km/h</span>
      </div>
      
      <div class="metric">
        <span class="label">Status:</span>
        <span class="status" id="status">Initializing</span>
      </div>
    `;
    
    this.fpsElement = this.shadowRoot!.getElementById('fps')!;
    this.speedElement = this.shadowRoot!.getElementById('speed')!;
    this.statusElement = this.shadowRoot!.getElementById('status')!;
  }
  
  updateFPS(fps: number): void {
    this.fpsElement.textContent = fps.toFixed(1);
  }
  
  updateSpeed(speed: number): void {
    this.speedElement.textContent = `${speed.toFixed(1)} km/h`;
  }
  
  updateStatus(status: string): void {
    this.statusElement.textContent = status;
  }
}

customElements.define('sim-dashboard', SimulationDashboard);