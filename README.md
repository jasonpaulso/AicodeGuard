# 🛡️ AI Code Guard

**Real-time AI code quality monitoring and intervention system.**

A VS Code extension that monitors AI coding assistants and ensures they provide complete, production-ready implementations instead of planning, mock code, or educational deflection.

## 🚀 Quick Start

### Installation
```bash
# Clone and install
git clone <repository-url>
cd ai-code-guard
npm install
```

### Development
```bash
# Compile TypeScript
npm run compile

# Run tests
npm test

# Or use the comprehensive test runner
chmod +x test-runner.sh
./test-runner.sh
```

### VS Code Development
1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. Test the extension in the new VS Code window

## 🧪 Testing

The project includes a comprehensive test suite covering all core functionality:

### Test Coverage
- **PatternDetector**: Terminal and code pattern detection logic
- **ConversationWatcher**: AI conversation monitoring and intervention
- **InterventionEngine**: AI correction and quality enforcement
- **ConfigManager**: Configuration management and profiles
- **QualityAnalyzer**: Code quality analysis and reporting
- **ConversationAnalyzer**: TODO bailout pattern analysis

### Running Tests
```bash
# Standard test run
npm test

# With compilation check
npm run compile && npm test

# Comprehensive test runner (recommended)
./test-runner.sh
```

### Test Architecture
- **Framework**: Mocha + TypeScript
- **Assertions**: Node.js assert module
- **Mocking**: Sinon.js for VS Code API mocking
- **Structure**: One test file per source component

### Mock Strategy
Tests properly mock VS Code APIs and file system operations to ensure:
- ✅ Tests run without VS Code context
- ✅ File system operations are stubbed
- ✅ Terminal interactions are mocked
- ✅ Configuration APIs are simulated

## 🎯 Core Features

### 📺 AI Assistant Monitoring
- Real-time Claude Code conversation analysis
- Implementation gap detection (when AI avoids coding)
- Terminal intervention (ESC + correction messages)
- Educational deflection prevention

### 📁 Code Quality Monitoring  
- Real-time typing analysis (2-second delay after typing stops)
- Save intervention (blocks saves with critical issues)
- File focus analysis (when switching between files)
- Automatic code corrections (TypeScript, security, production issues)

### 🚨 Quality Enforcement
- **BLOCK**: Critical issues prevent file saving
- **SIGNAL_AI**: Active intervention with AI fix requests
- **WARNING**: Notification-based quality alerts
- **TERMINAL**: AI assistant conversation correction

## 📊 Detected Patterns

### AI Assistant Behavior
- Implementation refusal ("I cannot generate code")
- Educational positioning ("this will help you learn")
- Scope reduction ("basic implementation", "simple version")
- Complexity avoidance ("too complex", "beyond scope")
- Architectural deflection ("let's think about architecture first")

### Code Quality Issues
- **Security vulnerabilities** (`eval()`, `innerHTML`, injection risks)
- **TypeScript problems** (`as any`, type safety violations)
- **Production issues** (`console.log`, debug code, TODO comments)
- **Implementation quality** (placeholder functions, incomplete logic)

## ⚙️ Configuration

### Monitoring Modes
- **Both** (recommended): Monitor files + AI conversations
- **File Watcher Only**: Real-time code quality analysis
- **Terminal Only**: AI conversation monitoring
- **Disabled**: Turn off all monitoring

### Aggressiveness Levels
- **Zero-Tolerance**: Maximum protection, catches everything
- **Sophisticated** (recommended): Intelligent balanced monitoring
- **Light**: Minimal monitoring, only blatant security issues

### Access Configuration
- Command Palette: `AI Code Guard: Configure`
- Quick Config: `AI Code Guard: Quick Config`  
- Status Bar: Click the 🛡️ icon

## 🛠️ Available Commands

| Command | Description |
|---------|-------------|
| `Test Patterns` | Verify all monitoring systems |
| `Analyze Current File` | Manual quality analysis |
| `Fix Code Issues` | Show AI correction suggestions |
| `Show Statistics` | Monitoring statistics |
| `Quality Enforcement` | Force implementation standards |
| `Enable/Disable Monitoring` | Control system state |

## 📈 Research Foundation

Based on empirical research into AI coding assistant limitations:
- AI tools produce correct code only **46-65%** of the time
- **50%** of AI-generated code contains security vulnerabilities  
- **67%** of developers report incomplete implementations as primary concern
- Real-time intervention prevents technical debt accumulation

## 🏗️ Architecture

```
src/
├── core/
│   ├── extension.ts          # Main VS Code extension entry
│   ├── CodeGuard.ts          # Central monitoring coordinator
│   └── PatternDetector.ts    # Pattern matching engine
├── watchers/
│   ├── ConversationWatcher.ts # AI conversation monitoring
│   └── FileWatcher.ts        # Real-time file quality monitoring
├── analyzers/
│   ├── ConversationAnalyzer.ts # TODO bailout analysis
│   ├── InterventionEngine.ts  # AI intervention logic
│   └── QualityAnalyzer.ts    # Code quality reporting
├── managers/
│   ├── ConfigManager.ts      # Configuration management
│   └── NotificationManager.ts # User notification system
├── types/
│   └── common.ts            # Shared TypeScript interfaces
└── config/
    ├── patterns.json        # Detection pattern definitions
    └── conversation-patterns.json # Conversation analysis rules
```

## 📊 Performance Impact

- **Typing Analysis**: 2-second delay after typing stops
- **Analysis Throttling**: Maximum 1 analysis per second per file
- **Memory Usage**: Minimal (keeps last 10 analyses per file)
- **CPU Impact**: Low (pattern matching only)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-capability`
3. Add tests for new functionality
4. Ensure all tests pass: `./test-runner.sh`
5. Submit pull request

### Development Guidelines
- All new features must include comprehensive tests
- Mock VS Code APIs properly in tests
- Follow existing TypeScript patterns
- Update documentation for new commands/features

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 🙏 Acknowledgments

- Built for the developer community frustrated with AI planning instead of implementing
- Research-backed approach to AI assistant quality monitoring
- Inspired by the need for production-ready AI-generated code

---

**Stop the planning, start the coding!** 🚀