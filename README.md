# Kinopticon

A research-grade driving simulator focusing on human factors and multi-user scenarios.

## Overview

Kinopticon is a high-fidelity driving simulator designed for human factors research, driver training, and traffic scenario analysis. Built with TypeScript and Unreal Engine 5, it provides realistic vehicle dynamics, multi-user support, and comprehensive data collection capabilities.

## Architecture

- **Monorepo structure** with clear module separation
- **TypeScript-only** codebase for type safety
- **Unreal Engine 5** with Chaos Physics for visualization
- **Entity Component System** for flexible simulation
- **Puerts integration** for TypeScript in Unreal

## Quick Start

### Prerequisites

- Bun >= 1.0.0 (or Node.js >= 20.0.0)
- Unreal Engine 5.4+
- Git with LFS support
- Visual Studio 2022 (Windows) or Xcode (macOS)

### Installation

```bash
# Clone repository
git clone https://github.com/[org]/kinopticon.git
cd kinopticon

# Initialize Git LFS
git lfs install
git lfs pull

# Install dependencies
bun install

# Run setup script
bun run setup
```

### Development

```bash
# Run simulation core
bun run dev

# Run tests
bun test

# Check architecture compliance
bun run test:architecture

# Build for production
bun run build
```

## Project Structure

```
kinopticon/
├── simulation/     # TypeScript simulation core
├── unreal/        # Unreal Engine 5 project
├── tools/         # Development tools
├── docs/          # Documentation
└── .adr/          # Architecture decisions
```

## Documentation

- [Getting Started](docs/guides/getting-started.md)
- [Architecture Overview](docs/architecture/overview.md)
- [Development Guide](docs/guides/developer-setup.md)
- [API Reference](docs/api/index.md)

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for our development process and coding standards.

## License

Proprietary - See [LICENSE](LICENSE) for details.

## Team

Kinopticon is developed by the Human Factors research team.

---

*For detailed technical decisions, see our [Architecture Decision Records](.adr/)*