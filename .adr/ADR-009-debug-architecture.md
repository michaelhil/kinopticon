# ADR-009: File-Based Debug Architecture

## Status
Accepted

## Context
Debugging a browser-based simulator from a terminal environment presents challenges:
- Cannot directly access browser console
- Copy-pasting errors is tedious and error-prone
- Need real-time visibility into simulation state
- Require ability to control simulation from development environment
- Must support debugging without user intervention

Traditional approaches (browser DevTools, console.log) require manual intervention and don't integrate well with LLM-assisted development.

## Decision
Implement a **file-based debugging architecture** where:
- All browser logs stream to local files
- Commands are read from watched files
- State dumps are written to JSON files
- Telemetry streams to JSONL files
- Debug overlay shows real-time metrics

Architecture:
```
Browser <--> WebSocket <--> File System <--> Developer/LLM
```

## Consequences

### Positive
- **Zero copy-paste** - all logs automatically available
- **LLM-friendly** - can read/write debug files directly
- **Scriptable** - automate debug workflows
- **Persistent** - logs survive browser crashes
- **Searchable** - grep/analyze log files
- **Real-time** - file watchers for instant feedback
- **Non-intrusive** - no UI interaction needed

### Negative
- Additional complexity in development setup
- File I/O overhead (minimal with buffering)
- Requires WebSocket server during development
- Platform-specific file paths
- Storage space for log files

### Neutral
- Different debugging paradigm from traditional web dev
- Need to manage log rotation
- Requires file system permissions

## Implementation

### Log Collection System
```typescript
// browser-logger.ts
class FileLogger {
  private ws: WebSocket;
  private buffer: LogEntry[] = [];
  
  constructor() {
    this.ws = new WebSocket('ws://localhost:8090/logs');
    this.interceptConsole();
    this.captureErrors();
  }
  
  private interceptConsole() {
    const methods = ['log', 'error', 'warn', 'info', 'debug'];
    methods.forEach(method => {
      const original = console[method];
      console[method] = (...args) => {
        this.send({
          level: method,
          timestamp: Date.now(),
          message: args.map(formatArg).join(' '),
          stack: new Error().stack
        });
        original.apply(console, args);
      };
    });
  }
  
  private send(entry: LogEntry) {
    this.buffer.push(entry);
    if (this.ws.readyState === WebSocket.OPEN) {
      this.flush();
    }
  }
}
```

### File Structure
```
/tmp/kinopticon/           # Or configurable debug directory
├── commands.txt           # Developer writes commands here
├── logs/
│   ├── console.jsonl      # Streaming console output
│   ├── errors.jsonl       # Error-only log
│   ├── network.jsonl      # HTTP/WebSocket traffic
│   └── performance.jsonl  # Frame timing metrics
├── state/
│   ├── current.json       # Latest state snapshot
│   ├── history/           # Historical snapshots
│   └── ecs.json          # Entity component data
└── telemetry/
    ├── frames.jsonl       # Per-frame metrics
    └── events.jsonl       # User interactions
```

### Command System
```typescript
// command-watcher.ts
class CommandWatcher {
  constructor() {
    this.watchFile('/tmp/kinopticon/commands.txt');
  }
  
  private async processCommand(cmd: string) {
    const [command, ...args] = cmd.split(' ');
    
    switch(command) {
      case 'spawn':
        this.spawnVehicle(args);
        break;
      case 'pause':
        this.simulation.pause();
        break;
      case 'dump':
        this.dumpState();
        break;
      case 'profile':
        this.startProfiling(parseInt(args[0]));
        break;
    }
  }
}
```

### Debug Commands
```bash
# Developer writes to /tmp/kinopticon/commands.txt:
spawn vehicle red 0 0 0        # Spawn red vehicle at origin
set weather rain heavy          # Change weather
pause simulation               # Pause simulation
dump state                     # Export current state
profile start 1000             # Profile for 1 second
teleport player 100 0 50       # Move player vehicle
clear traffic                  # Remove all traffic
reload scenario highway        # Load new scenario
```

## Development Workflow
```bash
# Terminal 1: Main development
bun run dev

# Terminal 2: Log viewer
tail -f /tmp/kinopticon/logs/console.jsonl | jq

# Terminal 3: Error watcher
tail -f /tmp/kinopticon/logs/errors.jsonl | jq '.message'

# Terminal 4: Send commands
echo "spawn vehicle blue 10 0 0" >> /tmp/kinopticon/commands.txt

# LLM can directly:
- Read: /tmp/kinopticon/logs/errors.jsonl
- Write: /tmp/kinopticon/commands.txt
- Analyze: /tmp/kinopticon/state/current.json
```

## Alternatives Considered
1. **Chrome DevTools Protocol**: Complex, Chrome-specific
2. **Remote debugging**: Network latency, complex setup
3. **Embedded terminal**: Poor UX, limits screen space
4. **Cloud logging**: Internet dependency, privacy concerns
5. **Source maps only**: Doesn't capture runtime state

## References
- WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
- File System API: https://nodejs.org/api/fs.html
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/

---
*Date: 2025-01-25*  
*Deciders: Development Team*  
*Technical Story: Debug architecture for LLM-assisted development*