# Kinopticon

**An open-source multi-modal mobility simulator for human factors research and traffic safety analysis**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)
![Unreal Engine](https://img.shields.io/badge/Unreal%20Engine-5.4+-orange.svg)
![Bun](https://img.shields.io/badge/Bun-1.0+-black.svg)

## 🎯 Vision

Kinopticon revolutionizes mobility research by providing an open, extensible, and scientifically rigorous simulation platform. Our vision is to democratize access to high-fidelity multi-modal transportation research tools, enabling researchers worldwide to advance traffic safety, human factors understanding, and sustainable mobility solutions.

**Core Principles:**
- **Open Science**: Transparent, reproducible research through open-source development
- **Multi-Modal**: Beyond cars - bikes, scooters, pedestrians, and autonomous vehicles
- **Human-Centered**: Designed by human factors researchers, for research excellence
- **Collaborative**: Multi-user scenarios reflecting real-world traffic complexity

## 🚀 Use Cases

### 🔬 Research Applications

**Human Factors Research**
- Driver attention and distraction studies
- Cognitive load assessment during complex maneuvers
- Age-related driving capability evaluation
- Interface design validation (HMI, ADAS, displays)
- Stress and fatigue impact on performance

**Traffic Safety Analysis**
- Accident reconstruction and prevention strategies
- Risk perception and hazard detection studies
- Safety technology effectiveness evaluation
- Vulnerable road user protection research
- Emergency response behavior analysis

**Behavioral Studies**
- Decision-making at intersections and merging scenarios
- Route choice and navigation behavior
- Social interaction effects in traffic
- Compliance with traffic rules and signage
- Learning and adaptation in novel traffic situations

### 🏫 Educational & Training

**Driver Education**
- Hazard perception training programs
- Defensive driving skill development
- Commercial vehicle operator training
- Emergency vehicle operation training
- Eco-driving behavior modification

**Research Training**
- Graduate student methodology development
- Standardized experimental protocol validation
- Cross-cultural driving behavior comparison
- Longitudinal behavior change studies

## 🔮 Future Features

### 🚲 Multi-Modal Transportation

**Vulnerable Road Users**
- **Bicycle Simulation**: Full physics-based cycling with balance dynamics, weather effects, and infrastructure interaction
- **E-Scooter Systems**: Micro-mobility behavior patterns, sharing system integration, and safety analysis
- **Pedestrian Modeling**: Realistic walking dynamics, crossing behaviors, and crowd simulation

**Mixed Traffic Scenarios**
- Complex urban intersections with all mobility modes
- Bike lane and shared space interaction studies
- Public transit integration (buses, trams, light rail)
- Delivery and logistics vehicle interactions

### 🤖 Autonomous Vehicle Integration

**AV Development Support**
- Sensor simulation (LiDAR, cameras, radar, ultrasonic)
- Algorithm testing in controlled environments
- Human-AV interaction studies (takeover scenarios, trust calibration)
- Mixed traffic with human-driven and autonomous vehicles
- Edge case scenario generation and validation

**Future Mobility Concepts**
- Platooning behavior and safety analysis
- Vehicle-to-Everything (V2X) communication simulation
- Dynamic route optimization and traffic flow management
- Shared autonomous vehicle systems

### 🌐 Multi-User & Networked Simulation

**Collaborative Research**
- **Real-time Multi-User**: Up to 32 simultaneous participants in shared scenarios
- **Distributed Studies**: Participants in different locations, synchronized experiences
- **Asymmetric Roles**: Mix of human drivers, AI agents, and researcher observers
- **Social Dynamics**: Group behavior, peer influence, and competitive scenarios

**Advanced Networking**
- **Low-latency Synchronization**: < 20ms for responsive multi-user interaction
- **Scenario Broadcasting**: Research coordinator controls shared environment
- **Data Aggregation**: Real-time collection from all participants
- **Remote Monitoring**: Researcher dashboards for live experiment oversight

### 🧠 Advanced Analytics & AI

**Behavioral Modeling**
- Machine learning-driven driver behavior prediction
- Personalized risk assessment algorithms
- Adaptive scenario generation based on participant performance
- Real-time intervention systems for safety and learning

**Physiological Integration**
- Eye tracking data fusion and analysis
- EEG/fNIRS cognitive load measurement
- Heart rate variability and stress indicators
- Multimodal data correlation and visualization

## 🎓 Benefits for Human Factors Researchers

### 📊 Scientific Rigor

**Experimental Control**
- Precise environmental control (weather, lighting, traffic density)
- Repeatable scenarios for cross-participant comparison
- Standardized metrics collection across studies
- Eliminated confounding variables present in field studies

**Data Quality & Quantity**
- High-frequency data capture (1000Hz+) for precise temporal analysis
- Complete scenario recording for post-hoc analysis
- Automated data validation and quality assurance
- Rich multimodal datasets (behavioral + physiological + environmental)

**Ethical Research**
- Safe exposure to dangerous scenarios (crash situations, extreme weather)
- No risk to participants or public during testing
- Reproducible conditions for longitudinal studies
- Controlled participant consent and data privacy

### 🔬 Research Innovation

**Novel Methodologies**
- Virtual reality integration for immersive experiences
- Mixed reality for hybrid simulation-real world studies
- Gamification elements for sustained participant engagement
- Adaptive difficulty for personalized research protocols

**Interdisciplinary Collaboration**
- Standardized data formats for cross-study comparison
- Open API for custom research tool integration
- Template scenarios for replicating published studies
- Community-driven scenario and protocol sharing

## 🛣️ Benefits for Traffic Safety Specialists

### 📈 Evidence-Based Policy

**Infrastructure Assessment**
- Virtual prototyping of road designs before construction
- Safety impact analysis of infrastructure modifications
- Cost-effective evaluation of multiple design alternatives
- Quantitative risk assessment for policy decisions

**Intervention Evaluation**
- Countermeasure effectiveness testing in controlled conditions
- Behavioral change program validation
- Training program efficacy measurement
- Technology adoption impact assessment

### 🎯 Targeted Safety Solutions

**Vulnerability Analysis**
- High-risk scenario identification and analysis
- Age-group specific safety research (elderly, young drivers)
- Condition-specific studies (medical conditions, medications)
- Cultural and regional driving behavior differences

**Proactive Safety**
- Predictive modeling for accident prevention
- Early warning system development and testing
- Driver assistance system optimization
- Emergency response protocol validation

## 🏗️ Architecture

- **TypeScript-First**: Comprehensive type safety for research reliability
- **Entity Component System**: Flexible, performant simulation architecture
- **Unreal Engine 5**: Photorealistic visuals with Chaos Physics
- **Open Source**: MIT licensed for maximum research impact
- **Cross-Platform**: Windows, macOS, and Linux support
- **Cloud-Ready**: Scalable deployment for large-scale studies

## 🚀 Quick Start

### Prerequisites

- Bun >= 1.0.0 (preferred) or Node.js >= 20.0.0
- Unreal Engine 5.4+
- Git with LFS support
- Visual Studio 2022 (Windows) or Xcode (macOS)

### Installation

```bash
# Clone repository
git clone https://github.com/your-org/kinopticon.git
cd kinopticon

# Initialize Git LFS for binary assets
git lfs install && git lfs pull

# Install dependencies
bun install

# Validate installation
bun run validate
```

### First Simulation

```bash
# Start the simulation core
bun run dev

# In another terminal, run basic scenario
bun run scenario:basic-highway

# View real-time metrics
open http://localhost:3000/dashboard
```

## 📁 Project Structure

```
kinopticon/
├── 🎮 simulation/          # TypeScript simulation core
│   ├── src/core/          # ECS framework & physics
│   ├── src/scenarios/     # Research scenario library
│   └── src/analytics/     # Data collection & analysis
├── 🎨 unreal/             # Unreal Engine 5 project  
│   ├── Content/Vehicles/  # Multi-modal vehicle assets
│   ├── Content/Maps/      # Environment and road networks
│   └── Plugins/Puerts/    # TypeScript integration
├── 🔧 tools/              # Development & research tools
├── 📚 docs/               # Comprehensive documentation
├── 🏛️ .adr/               # Architecture Decision Records
└── 🧪 examples/           # Getting started scenarios
```

## 🤝 Contributing

We welcome contributions from researchers, developers, and mobility experts worldwide! 

- **Research Scenarios**: Share validated experimental protocols
- **Vehicle Models**: Contribute realistic vehicle dynamics
- **Analysis Tools**: Build specialized measurement instruments
- **Documentation**: Help improve research accessibility

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

**Academic Use**: Freely available for research and educational purposes.
**Commercial Use**: Open source license allows commercial applications.
**Citation**: Please cite Kinopticon in your research publications.

## 🏆 Community & Support

- **Issue Tracking**: [GitHub Issues](https://github.com/your-org/kinopticon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/kinopticon/discussions)
- **Documentation**: Available in the `/docs` directory
- **Research Questions**: Use our [Research Question Template](.github/ISSUE_TEMPLATE/research_question.yml)

## 📚 Research & Publications

**Getting Started with Research:**
- [Research Methodology Guide](docs/research/methodology.md)
- [Data Collection Best Practices](docs/research/data-collection.md)
- [Statistical Analysis Templates](docs/research/analysis.md)
- [Publication Guidelines](docs/research/publications.md)

**Example Studies:**
- [Driver Distraction in Urban Environments](examples/studies/distraction-urban.md)
- [Elderly Driver Safety Assessment](examples/studies/elderly-safety.md)
- [Bicycle-Vehicle Interaction Analysis](examples/studies/bike-vehicle.md)

---

**🔬 Built by researchers, for researchers. Advancing mobility science through open collaboration.**

*For technical architecture details, see our [Architecture Decision Records](.adr/)*