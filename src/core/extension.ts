import * as vscode from 'vscode';
import { CodeGuard } from './CodeGuard';

let monitor: CodeGuard;
let monitoringDisposables: vscode.Disposable[] = [];

export function activate(context: vscode.ExtensionContext) {
  console.log('🛡️ AI Code Guard Activated');
  
  // Initialize the comprehensive monitor
  monitor = new CodeGuard();
  const disposables = monitor.startMonitoring();
  monitoringDisposables.push(...disposables);
  
  // Register all commands
  const commandDisposables = [
    // Configuration commands
    vscode.commands.registerCommand('ai-code-guard.configure', () => {
      const configManager = require('../managers/ConfigManager').ConfigManager.getInstance(monitor.outputChannel);
      configManager.showConfigurationUI();
    }),
    
    vscode.commands.registerCommand('ai-code-guard.quickConfig', async () => {
      const modes = [
        { label: '📁📺 Both (Recommended)', value: 'both' },
        { label: '📁 File Watcher Only', value: 'fileWatcher' },
        { label: '📺 Terminal Only', value: 'terminal' },
        { label: '❌ Disabled', value: 'disabled' }
      ];
      
      const selected = await vscode.window.showQuickPick(modes, {
        placeHolder: 'Quick Config: Select monitoring mode'
      });
      
      if (selected) {
        const configManager = require('../managers/ConfigManager').ConfigManager.getInstance(monitor.outputChannel);
        await configManager.setMonitoringMode(selected.value as any);
        vscode.window.showInformationMessage(`Monitoring mode: ${selected.label}`);
      }
    }),

    // Core monitoring commands
    vscode.commands.registerCommand('ai-code-guard.testPatterns', () => {
      monitor.testPatterns();
      vscode.window.showInformationMessage('🧪 Comprehensive quality pattern test completed - check output channel');
    }),
    
    vscode.commands.registerCommand('ai-code-guard.enable', () => {
      monitor.enable();
    }),
    
    vscode.commands.registerCommand('ai-code-guard.disable', () => {
      monitor.disable();
    }),

    // File monitoring commands
    vscode.commands.registerCommand('ai-code-guard.enableFileMonitoring', () => {
      monitor.enableFileMonitoring();
    }),
    
    vscode.commands.registerCommand('ai-code-guard.disableFileMonitoring', () => {
      monitor.disableFileMonitoring();
    }),
    
    // Enhanced stats with file monitoring data
    vscode.commands.registerCommand('ai-code-guard.showStats', () => {
      const stats = monitor.getStats();
      const statsMessage = [
        `📊 AI Code Guard Statistics:`,
        ``,
        `🎯 **Conversation Monitoring:**`,
        `• Status: ${stats.enabled ? 'ENABLED' : 'DISABLED'}`,
        `• Active: ${stats.conversationMonitoring ? 'YES' : 'NO'}`,
        ``,
        `📁 **File Monitoring:**`,
        `• Status: ${stats.fileMonitoring ? 'ENABLED' : 'DISABLED'}`,
        `• Files Analyzed: ${stats.fileStats.filesAnalyzed}`,
        `• Quality Issues: ${stats.fileStats.detections}`,
        `• Interventions: ${stats.fileStats.interventions}`,
        `• Recent Analyses: ${stats.fileStats.recentAnalyses}`,
        ``,
        `🛡️ **Capabilities:**`,
        `• Real-time Typing: ${stats.capabilities.realtimeTyping ? '✅' : '❌'}`,
        `• Save Intervention: ${stats.capabilities.saveIntervention ? '✅' : '❌'}`,
        `• Critical Blocking: ${stats.capabilities.criticalBlocking ? '✅' : '❌'}`,
        `• Auto-Fix: ${stats.capabilities.autoFix ? '✅' : '❌'}`,
        `• Terminal Correction: ${stats.capabilities.terminalCorrection ? '✅' : '❌'}`
      ].join('\n');
      
      vscode.window.showInformationMessage(statsMessage, 'Show Details').then(selection => {
        if (selection === 'Show Details') {
          vscode.commands.executeCommand('ai-code-guard.showDetails');
        }
      });
    }),
    
    // Enhanced detailed report
    vscode.commands.registerCommand('ai-code-guard.showDetails', () => {
      const stats = monitor.getStats();
      const report = [
        `# 🛡️ AI Code Guard - Comprehensive Quality Report`,
        ``,
        `## System Status`,
        `- **Overall Monitoring**: ${stats.enabled ? '✅ ENABLED' : '❌ DISABLED'}`,
        `- **Conversation Monitoring**: ${stats.conversationMonitoring ? '✅ ACTIVE' : '❌ INACTIVE'}`,
        `- **File Quality Monitoring**: ${stats.fileMonitoring ? '✅ ACTIVE' : '❌ INACTIVE'}`,
        ``,
        `## Quality Enforcement Statistics`,
        `- **Quality Issues Detected**: ${stats.detectionCount}`,
        `- **File Quality Issues**: ${stats.fileStats.detections}`,
        `- **Implementation Interventions**: ${stats.fileStats.interventions}`,
        `- **Files Analyzed**: ${stats.fileStats.filesAnalyzed}`,
        `- **Recent Activity**: ${stats.fileStats.recentAnalyses} analyses in last hour`,
        ``,
        `## Monitoring Capabilities`,
        ``,
        `### 📺 AI Assistant Monitoring`,
        `- ✅ Real-time AI conversation analysis`,
        `- ✅ Implementation gap detection`,
        `- ✅ Terminal intervention (ESC + correction)`,
        `- ✅ Educational deflection prevention`,
        `- ✅ Scope reduction detection`,
        ``,
        `### 📁 Code Quality Monitoring`,
        `- ${stats.capabilities.realtimeTyping ? '✅' : '❌'} Real-time typing analysis`,
        `- ${stats.capabilities.saveIntervention ? '✅' : '❌'} Save intervention (blocks critical issues)`,
        `- ${stats.capabilities.criticalBlocking ? '✅' : '❌'} Critical issue blocking`,
        `- ${stats.capabilities.autoFix ? '✅' : '❌'} Automatic code corrections`,
        `- ✅ File focus quality checks`,
        ``,
        `### 🚨 Quality Enforcement Types`,
        `- **BLOCK**: Critical issues prevent file saving`,
        `- **CORRECT**: Active intervention with fix suggestions`,
        `- **WARNING**: Notification-based quality alerts`,
        `- **TERMINAL**: AI assistant conversation correction`,
        ``,
        `## Quality Patterns Monitored`,
        ``,
        `### Implementation Issues`,
        `- Scope reduction and simplification`,
        `- Educational deflection strategies`,
        `- Mock/stub/placeholder implementations`,
        `- Complexity avoidance patterns`,
        ``,
        `### Code Quality Issues`,
        `- TypeScript type safety violations`,
        `- Security vulnerability indicators`,
        `- Production readiness problems`,
        `- Implementation completeness`,
        ``,
        `## Available Commands`,
        `- \`Test Quality Patterns\` - Verify all systems`,
        `- \`Analyze Current File\` - Manual quality check`,
        `- \`Fix Code Issues\` - Show corrections`,
        `- \`Enable/Disable File Monitoring\` - Control file analysis`,
        `- \`Quality Enforcement\` - Force implementation standards`,
        ``,
        `## Research Foundation`,
        `- AI coding tools achieve 46-65% accuracy in implementation tasks`,
        `- 50% of AI-generated code contains production vulnerabilities`,
        `- 67% of developers report incomplete AI implementations as primary concern`,
        `- Real-time quality enforcement prevents technical debt accumulation`,
        ``,
        `## Performance Impact`,
        `- **Typing Analysis**: 2-second delay after typing stops`,
        `- **Analysis Throttling**: Maximum 1 analysis per second per file`,
        `- **Memory Usage**: Minimal (keeps last 10 analyses per file)`,
        `- **CPU Impact**: Low (pattern matching only)`,
        ``,
        `Generated: ${new Date().toLocaleString()}`
      ].join('\n');

      vscode.workspace.openTextDocument({
        content: report,
        language: 'markdown'
      }).then(doc => {
        vscode.window.showTextDocument(doc);
      });
    }),

    // Quality enforcement command
    vscode.commands.registerCommand('ai-code-guard.enforceQuality', () => {
      vscode.window.showInformationMessage(
        '🛡️ Quality Enforcement: Ensuring production-ready implementations',
        'Continue',
        'Cancel'
      ).then(selection => {
        if (selection === 'Continue') {
          const activeTerminal = vscode.window.activeTerminal;
          if (activeTerminal) {
            activeTerminal.sendText('QUALITY ENFORCEMENT: Provide complete, production-ready implementation with proper error handling and type safety.', true);
            vscode.window.showInformationMessage('🛡️ Quality enforcement directive sent');
          } else {
            vscode.window.showWarningMessage('⚠️ No active terminal found for quality enforcement');
          }
        }
      });
    }),

    // Enable intervention command
    vscode.commands.registerCommand('ai-code-guard.enableIntervention', () => {
      monitor.enableIntervention();
      vscode.window.showInformationMessage(
        '🛡️ Implementation enforcement enabled. AI Code Guard will actively ensure complete implementations.'
      );
    }),

    // Disable intervention command
    vscode.commands.registerCommand('ai-code-guard.disableIntervention', () => {
      monitor.disableIntervention();
      vscode.window.showInformationMessage(
        '👁️ Switched to monitoring mode. AI Code Guard will track but not intervene in quality issues.'
      );
    }),

    // Context menu integration
    vscode.commands.registerCommand('ai-code-guard.analyzeSelection', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor && editor.selection) {
        const selectedText = editor.document.getText(editor.selection);
        if (selectedText) {
          vscode.window.showInformationMessage(
            `Analyzing ${selectedText.length} characters...`,
            'Show Analysis'
          );
        }
      }
    }),

    // File monitoring commands (registered by FileWatcher)
    vscode.commands.registerCommand('ai-code-guard.analyzeCurrentFile', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        monitor.analyzeCurrentFile();
      } else {
        vscode.window.showWarningMessage('No active file to analyze.');
      }
    }),

    vscode.commands.registerCommand('ai-code-guard.fixCodeIssues', () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        monitor.showCodeFixSuggestions();
      } else {
        vscode.window.showWarningMessage('No active file to analyze.');
      }
    }),

    // Terminal monitoring (enhanced)
    vscode.window.onDidStartTerminalShellExecution?.(event => {
      console.log(`🛡️ Terminal activity detected: ${event.execution.commandLine?.value || 'unknown'}`);
      // Terminal monitoring is handled by ConversationWatcher
    })
  ];

  // Add all disposables to context
  [...commandDisposables, ...monitoringDisposables].forEach(disposable => {
    if (disposable) {
      context.subscriptions.push(disposable);
    }
  });

  // Enhanced status bar with file monitoring status
  const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  updateStatusBar(statusBarItem);
  statusBarItem.command = 'ai-code-guard.showStats';
  statusBarItem.show();
  context.subscriptions.push(statusBarItem);

  // Update status bar every 30 seconds
  const statusUpdateInterval = setInterval(() => {
    updateStatusBar(statusBarItem);
  }, 30000);
  
  context.subscriptions.push(new vscode.Disposable(() => {
    clearInterval(statusUpdateInterval);
  }));

  console.log('✅ AI Code Guard fully activated with comprehensive quality monitoring');
}

function updateStatusBar(statusBarItem: vscode.StatusBarItem): void {
  if (monitor) {
    const stats = monitor.getStats();
    const fileStatus = stats.fileMonitoring ? '📁' : '📁̶'; 
    const conversationStatus = stats.conversationMonitoring ? '📺' : '📺̶';
    
    statusBarItem.text = `🛡️ ${conversationStatus}${fileStatus}`;
    statusBarItem.tooltip = [
      'AI Code Guard',
      `Conversation: ${stats.conversationMonitoring ? 'Active' : 'Inactive'}`,
      `File Monitoring: ${stats.fileMonitoring ? 'Active' : 'Inactive'}`,
      `Recent: ${stats.fileStats.recentAnalyses} analyses`,
      'Click for stats'
    ].join('\n');
  }
}

export function deactivate() {
  console.log('🛡️ AI Code Guard deactivated');
  
  // Dispose of monitoring first
  monitoringDisposables.forEach(disposable => {
    try {
      disposable.dispose();
    } catch (error) {
      console.log(`Error disposing monitoring: ${error}`);
    }
  });
  
  // Then dispose of main monitor
  monitor?.dispose();
}
