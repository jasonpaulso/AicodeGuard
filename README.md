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

# Run in development mode
# Press F5 in VS Code to launch Extension Development Host
```

### VS Code Development
1. Open project in VS Code
2. Press `F5` to launch Extension Development Host
3. The extension will automatically activate and start monitoring

## 🎯 Core Features

### 📺 AI Assistant Monitoring
- Real-time Claude Code conversation analysis
- Implementation gap detection (when AI avoids coding)
- Terminal intervention (ESC + correction messages)
- Educational deflection prevention
- **Subagent delegation detection**: Catches when AI creates subagents to avoid direct implementation

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

### 🤖 Subagent Detection
- **Delegation pattern recognition**: Detects when Claude creates or mentions subagents
- **Task handoff monitoring**: Catches "I'm creating a subagent to handle this"
- **Incomplete delegation alerts**: Identifies when subagents fail to deliver complete solutions
- **Multi-agent bailout prevention**: Stops AI from passing responsibility between agents

## 📊 Detected Patterns

### AI Assistant Behavior
- Implementation refusal ("I cannot generate code")
- Educational positioning ("this will help you learn")
- Scope reduction ("basic implementation", "simple version")
- Complexity avoidance ("too complex", "beyond scope")
- Architectural deflection ("let's think about architecture first")
- **Subagent creation**: "I'm creating a subagent to handle this complex task"
- **Delegation bailouts**: "The delegated agent will handle the implementation"

### Code Quality Issues
- **Security vulnerabilities** (`eval()`, `innerHTML`, injection risks)
- **TypeScript problems** (`as any`, type safety violations)
- **Production issues** (`console.log`, debug code, TODO comments)
- **Implementation quality** (placeholder functions, incomplete logic)

## 🚨 Alert Examples

### High Severity Tool Bailout
```
🚨🚨🚨 TOOL BAILOUT DETECTED! 🚨🚨🚨
File: a4a5b6ff-1c03-4945-86e1-3f8ff6a13e7e.jsonl
Message: 15
Tool: todowrite (medium confidence)  
Severity: HIGH
Description: Claude created a TODO list instead of implementing

📋 ENHANCED TODO ANALYSIS:
Total TODO items: 14
Tool: todowrite
Top TODO items:
1. Analyze existing project structure...
2. Create custom JWT utilities...
3. Implement user authentication middleware...
```

### Subagent Bailout Detection
```
🤖 SUBAGENT BAILOUT DETECTED! 🤖
Pattern: "I'm creating a subagent to handle this complex task"
Severity: HIGH
Description: Claude attempting to delegate instead of implementing

🔗 DELEGATION ANALYSIS:
- Responsibility transfer detected
- No actual implementation provided
- Subagent creation as avoidance mechanism
```

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

## 🔮 Roadmap

### ✅ Phase 1: Nuclear Override (COMPLETED)
- **Real intervention**: ✅ Interrupts Claude mid-response with ESC key
- **Override commands**: ✅ Sends corrective prompts automatically
- **Terminal integration**: ✅ Direct terminal command injection
- **Subagent blocking**: ✅ Prevents agent creation and forces direct implementation

### Phase 2: Advanced Intervention (In Progress)
- **Multi-terminal support**: Handle multiple Claude sessions simultaneously
- **Smart intervention timing**: Better detection of when Claude is actually responding vs. loading
- **Custom correction prompts**: User-configurable intervention messages
- **Intervention success tracking**: Measure how often corrections actually work

### Phase 3: Multi-AI Support (Future)
- **ChatGPT CLI monitoring**: Expand beyond Claude
- **Gemini integration**: Support Google's AI tools
- **Universal patterns**: Cross-AI bailout detection
- **Multi-agent orchestration blocking**: Prevent complex delegation chains across different AI tools

### Phase 4: Analytics Dashboard (Future)
- **Bailout statistics**: Track patterns over time
- **Performance metrics**: Measure intervention success rates
- **Custom patterns**: User-defined detection rules
- **Subagent usage analytics**: Track delegation attempts and success rates
- **Project-level reporting**: Bailout trends across different codebases

### Phase 5: Community Features (Future)
- **Pattern sharing**: Community-driven bailout database
- **Marketplace distribution**: VS Code marketplace release
- **Enterprise features**: Team monitoring and reporting
- **AI training feedback**: Send successful interventions back to improve AI behavior

## 📊 Performance Impact

- **Typing Analysis**: 2-second delay after typing stops
- **Analysis Throttling**: Maximum 1 analysis per second per file
- **Memory Usage**: Minimal (keeps last 10 analyses per file)
- **CPU Impact**: Low (pattern matching only)

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/new-capability`
3. Add functionality with proper error handling
4. Update documentation for new commands/features
5. Submit pull request

### Development Guidelines
- Follow existing TypeScript patterns
- Implement robust error handling
- Update documentation for new commands/features
- Test with real AI assistant interactions

## 📄 License

MIT License - Feel free to use and modify for your projects.

## 🙏 Acknowledgments

- Built for the developer community frustrated with AI planning instead of implementing
- Research-backed approach to AI assistant quality monitoring
- Inspired by the need for production-ready AI-generated code
- Special recognition for identifying subagent delegation as a new form of AI avoidance

---

**Stop the planning, start the coding!** 🚀