/**
 * Debug Server
 * 
 * Handles WebSocket connections for browser log collection
 * Writes logs to files for LLM consumption
 */

import { writeFileSync, appendFileSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const DEBUG_DIR = resolve(process.cwd(), 'debug');
const LOGS_DIR = resolve(DEBUG_DIR, 'logs');
const STATE_DIR = resolve(DEBUG_DIR, 'state');

// Ensure directories exist
mkdirSync(DEBUG_DIR, { recursive: true });
mkdirSync(LOGS_DIR, { recursive: true });
mkdirSync(STATE_DIR, { recursive: true });

// Simple WebSocket server using Bun  
const server = Bun.serve({
  port: 8090,
  
  fetch(req, upgrader): Response {
    const url = new URL(req.url);
    
    if (url.pathname === '/logs') {
      // WebSocket upgrade
      if (upgrader.upgrade(req)) {
        return new Response(); // WebSocket upgrade handled
      }
      return new Response('WebSocket upgrade failed', { status: 400 });
    }
    
    // Serve status page
    if (url.pathname === '/') {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head><title>Kinopticon Debug Server</title></head>
        <body>
          <h1>🐛 Kinopticon Debug Server</h1>
          <p>Status: Running on port 8090</p>
          <p>WebSocket endpoint: ws://localhost:8090/logs</p>
          <p>Debug files: ${DEBUG_DIR}</p>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' },
      });
    }
    
    return new Response('Not Found', { status: 404 });
  },
  
  websocket: {
    open(): void {
      console.log('🔗 Browser connected to debug server');
    },
    
    message(_, message): void {
      const logEntry = JSON.parse(message as string);
      
      // Write to console.jsonl
      const logLine = JSON.stringify({
        ...logEntry,
        timestamp_iso: new Date(logEntry.timestamp).toISOString(),
      });
      
      appendFileSync(
        resolve(LOGS_DIR, 'console.jsonl'),
        logLine + '\n'
      );
      
      // Also write errors to separate file
      if (logEntry.level === 'error') {
        appendFileSync(
          resolve(LOGS_DIR, 'errors.jsonl'),
          logLine + '\n'
        );
      }
      
      // Log to server console for immediate feedback
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${logEntry.level.toUpperCase()}: ${logEntry.message}`);
    },
    
    close(): void {
      console.log('📡 Browser disconnected from debug server');
    },
  },
});

// Create initial files
writeFileSync(
  resolve(DEBUG_DIR, 'commands.txt'),
  '# Write commands here - one per line\n# Examples:\n# spawn vehicle red 0 0 0\n# set weather rain\n# pause simulation\n'
);

writeFileSync(
  resolve(STATE_DIR, 'current.json'),
  JSON.stringify({
    timestamp: Date.now(),
    status: 'server_started',
    message: 'Debug server initialized'
  }, null, 2)
);

console.log(`🐛 Kinopticon Debug Server running on http://localhost:8090`);
console.log(`📁 Debug files: ${DEBUG_DIR}`);
console.log(`📝 Commands file: ${resolve(DEBUG_DIR, 'commands.txt')}`);
console.log(`📊 Logs directory: ${LOGS_DIR}`);