/**
 * Debug Overlay Component
 * 
 * Shows debug information and system status
 * Minimal implementation for Phase 0
 */

class DebugOverlay extends HTMLElement {
  private logElement: HTMLElement;
  private metricsElement: HTMLElement;
  private isVisible: boolean = false;
  
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    this.shadowRoot!.innerHTML = `
      <style>
        :host {
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: rgba(20, 20, 20, 0.95);
          color: #00ff00;
          padding: 12px;
          border-radius: 4px;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          max-width: 400px;
          max-height: 300px;
          overflow-y: auto;
          backdrop-filter: blur(4px);
          border: 1px solid #333;
          display: none;
        }
        
        :host(.visible) {
          display: block;
        }
        
        .header {
          color: #ffaa00;
          font-weight: bold;
          margin-bottom: 8px;
          border-bottom: 1px solid #444;
          padding-bottom: 4px;
        }
        
        .log-entry {
          margin: 2px 0;
          padding: 2px 0;
          border-bottom: 1px solid #222;
        }
        
        .error {
          color: #ff4444;
        }
        
        .warn {
          color: #ffaa00;
        }
        
        .info {
          color: #4488ff;
        }
      </style>
      
      <div class="header">Debug Console (Press F12)</div>
      <div id="metrics"></div>
      <div id="logs"></div>
    `;
    
    this.logElement = this.shadowRoot!.getElementById('logs')!;
    this.metricsElement = this.shadowRoot!.getElementById('metrics')!;
    
    // Toggle with F12
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  toggle(): void {
    this.isVisible = !this.isVisible;
    this.classList.toggle('visible', this.isVisible);
  }
  
  addLogEntry(level: string, message: string): void {
    const entry = document.createElement('div');
    entry.className = `log-entry ${level}`;
    entry.textContent = `[${new Date().toISOString()}] ${level.toUpperCase()}: ${message}`;
    
    this.logElement.appendChild(entry);
    
    // Keep only last 50 entries
    const entries = this.logElement.children;
    if (entries.length > 50) {
      entries[0].remove();
    }
    
    // Auto-scroll to bottom
    this.scrollTop = this.scrollHeight;
  }
  
  updateMetrics(metrics: Record<string, any>): void {
    this.metricsElement.innerHTML = Object.entries(metrics)
      .map(([key, value]) => `<div>${key}: ${value}</div>`)
      .join('');
  }
}

customElements.define('debug-overlay', DebugOverlay);