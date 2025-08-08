import * as vscode from 'vscode';
import { PatternDetector, DetectionResult } from './PatternDetector';
import { NotificationManager, BailoutNotificationData } from '../managers/NotificationManager';

interface FileAnalysis {
  filePath: string;
  timestamp: number;
  detectionResult: DetectionResult;
  triggerType: 'SAVE' | 'TYPE' | 'FOCUS' | 'MANUAL';
  interventionLevel: 'NONE' | 'WARNING' | 'SIGNAL_AI' | 'BLOCK';
}

interface QualityIssue {
  line: number;
  column: number;
  category: 'SECURITY' | 'TYPE_SAFETY' | 'PRODUCTION' | 'IMPLEMENTATION' | 'GENERAL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  pattern: string;      // What we detected
  problem: string;      // Why it's problematic  
  instruction: string;  // What AI should do
  example?: {
    current: string;
    suggested: string;
  };
}

interface QualityIssueReport {
  file: string;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  issues: QualityIssue[];
  aiInstruction: string;  // Formatted message for AI
}

export class FileWatcher {
  private patternDetector: PatternDetector;
  private notificationManager: NotificationManager;
  private outputChannel: vscode.OutputChannel;
  
  // Analysis tracking
  private fileAnalysisHistory: Map<string, FileAnalysis[]> = new Map();
  private detectionCount: number = 0;
  private aiInterventionCount: number = 0;
  
  // Real-time monitoring
  private typingTimer: NodeJS.Timeout | undefined;
  private lastAnalysisTime: Map<string, number> = new Map();
  private isAnalyzing: boolean = false;
  
  // Configuration
  private readonly TYPING_DELAY = 2000;
  private readonly MIN_ANALYSIS_INTERVAL = 1000;
  private readonly CRITICAL_PATTERNS_BLOCK = true;
  
  // AI intervention state
  private aiInterventionActive: boolean = false;
  private lastAIInterventionTime: number = 0;
  private readonly AI_INTERVENTION_COOLDOWN = 30000; // 30 seconds between AI corrections
  
  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.patternDetector = new PatternDetector();
    this.notificationManager = NotificationManager.getInstance();
  }

  /**
   * Start comprehensive file monitoring
   */
  public startMonitoring(): vscode.Disposable[] {
    this.outputChannel.appendLine('📁 Starting AI-Directed Code Quality Monitoring...');
    
    const disposables: vscode.Disposable[] = [];

    // 1. REAL-TIME TYPING ANALYSIS
    disposables.push(
      vscode.workspace.onDidChangeTextDocument(event => {
        this.handleTextChange(event);
      })
    );

    // 2. SAVE INTERVENTION (Critical - can block saves)
    disposables.push(
      vscode.workspace.onWillSaveTextDocument(event => {
        if (this.CRITICAL_PATTERNS_BLOCK) {
          event.waitUntil(this.handlePreSave(event.document));
        }
      })
    );

    // 3. POST-SAVE ANALYSIS
    disposables.push(
      vscode.workspace.onDidSaveTextDocument(document => {
        this.handleFileSave(document);
      })
    );

    // 4. FILE FOCUS ANALYSIS  
    disposables.push(
      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this.handleFileFocus(editor.document);
        }
      })
    );

    // 5. EDITOR COMMANDS INTEGRATION
    disposables.push(
      vscode.commands.registerCommand('ai-code-guard.analyzeCurrentFile', () => {
        this.analyzeCurrentFile();
      })
    );

    disposables.push(
      vscode.commands.registerCommand('ai-code-guard.fixCodeIssues', () => {
        this.requestAIFixes();
      })
    );

    disposables.push(
      vscode.commands.registerCommand('ai-code-guard.showQualityReport', () => {
        this.showDetailedQualityReport();
      })
    );

    this.outputChannel.appendLine('✅ AI-directed quality monitoring active:');
    this.outputChannel.appendLine('  📝 Real-time issue detection');
    this.outputChannel.appendLine('  🤖 Smart AI communication');
    this.outputChannel.appendLine('  💾 Critical issue blocking');
    this.outputChannel.appendLine('  🎯 Contextual fix requests');

    return disposables;
  }

  /**
   * Handle real-time text changes (typing)
   */
  private handleTextChange(event: vscode.TextDocumentChangeEvent): void {
    const document = event.document;
    
    if (!this.isCodeFile(document)) return;
    
    // Debounce typing analysis
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    this.typingTimer = setTimeout(() => {
      this.performRealtimeAnalysis(document, 'TYPE');
    }, this.TYPING_DELAY);
  }

  /**
   * Handle pre-save analysis (can block saves)
   */
  private async handlePreSave(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    if (!this.isCodeFile(document)) return [];
    
    this.outputChannel.appendLine(`🔍 PRE-SAVE QUALITY CHECK: ${document.fileName}`);
    
    const analysis = await this.analyzeDocument(document, 'SAVE');
    
    if (analysis && analysis.detectionResult.qualityLevel === 'REQUIRES_ATTENTION') {
      this.outputChannel.appendLine(`🚨 CRITICAL ISSUES DETECTED - BLOCKING SAVE`);
      
      const report = this.generateQualityReport(analysis);
      await this.showCriticalIssuesBlock(report);
      
      // Block the save
      throw new Error(`🚨 CRITICAL CODE ISSUES: ${report.criticalCount} issues must be fixed before saving.`);
    }
    
    return []; // Allow save to proceed
  }

  /**
   * Handle post-save analysis
   */
  private handleFileSave(document: vscode.TextDocument): void {
    if (!this.isCodeFile(document)) return;
    
    this.outputChannel.appendLine(`💾 POST-SAVE QUALITY CHECK: ${document.fileName}`);
    this.performRealtimeAnalysis(document, 'SAVE');
  }

  /**
   * Handle file focus (when switching files)
   */
  private handleFileFocus(document: vscode.TextDocument): void {
    if (!this.isCodeFile(document)) return;
    
    setTimeout(() => {
      this.performRealtimeAnalysis(document, 'FOCUS');
    }, 500);
  }

  /**
   * Perform real-time analysis with throttling
   */
  private async performRealtimeAnalysis(document: vscode.TextDocument, triggerType: FileAnalysis['triggerType']): Promise<void> {
    const filePath = document.uri.fsPath;
    const now = Date.now();
    const lastAnalysis = this.lastAnalysisTime.get(filePath) || 0;
    
    if (now - lastAnalysis < this.MIN_ANALYSIS_INTERVAL || this.isAnalyzing) {
      return;
    }
    
    this.lastAnalysisTime.set(filePath, now);
    
    const analysis = await this.analyzeDocument(document, triggerType);
    if (analysis) {
      await this.handleQualityDetection(analysis);
    }
  }

  /**
   * Analyze document for quality issues
   */
  private async analyzeDocument(document: vscode.TextDocument, triggerType: FileAnalysis['triggerType']): Promise<FileAnalysis | null> {
    this.isAnalyzing = true;
    
    try {
      const content = document.getText();
      const detectionResult = this.patternDetector.detectPatterns(content, 'file');
      
      if (detectionResult.severityScore > 0) {
        this.detectionCount++;
        
        const analysis: FileAnalysis = {
          filePath: document.uri.fsPath,
          timestamp: Date.now(),
          detectionResult,
          triggerType,
          interventionLevel: this.determineInterventionLevel(detectionResult, triggerType)
        };
        
        // Store analysis history
        this.storeAnalysisHistory(analysis);
        
        this.outputChannel.appendLine(`📊 QUALITY ANALYSIS #${this.detectionCount}: ${detectionResult.qualityLevel} (${detectionResult.severityScore}) - ${triggerType}`);
        
        return analysis;
      }
      
      return null;
    } finally {
      this.isAnalyzing = false;
    }
  }

  /**
   * Handle quality detection and trigger appropriate response
   */
  private async handleQualityDetection(analysis: FileAnalysis): Promise<void> {
    const { detectionResult, triggerType, interventionLevel } = analysis;
    
    // Check for automatic AI intervention
    if (this.shouldTriggerAIIntervention(analysis)) {
      await this.performAutomaticAIIntervention(analysis);
      return;
    }
    
    switch (interventionLevel) {
      case 'BLOCK':
        // Already handled in pre-save
        break;
        
      case 'SIGNAL_AI':
        await this.requestUserApprovedAIFix(analysis);
        break;
        
      case 'WARNING':
        this.queueWarningNotification(analysis);
        break;
        
      default:
        this.outputChannel.appendLine(`📝 Code quality: ${detectionResult.qualityLevel} (${detectionResult.severityScore})`);
    }
  }

  /**
   * Generate comprehensive quality report
   */
  private generateQualityReport(analysis: FileAnalysis): QualityIssueReport {
    const fileName = analysis.filePath.split('/').pop() || 'Unknown';
    const issues = this.extractDetailedIssues(analysis);
    
    const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
    const highCount = issues.filter(i => i.severity === 'HIGH').length;
    
    return {
      file: fileName,
      totalIssues: issues.length,
      criticalCount,
      highCount,
      issues,
      aiInstruction: this.buildAIInstruction(issues, fileName)
    };
  }

  /**
   * Extract detailed issues from detection result
   */
  private extractDetailedIssues(analysis: FileAnalysis): QualityIssue[] {
    const issues: QualityIssue[] = [];
    const content = vscode.window.activeTextEditor?.document.getText() || '';
    const lines = content.split('\n');
    
    analysis.detectionResult.patterns.forEach(pattern => {
      // Find line number for this pattern
      const lineIndex = lines.findIndex(line => line.includes(pattern.match));
      const line = lineIndex >= 0 ? lineIndex + 1 : 1;
      const column = lineIndex >= 0 ? lines[lineIndex].indexOf(pattern.match) + 1 : 1;
      
      let issue: QualityIssue;
      
      switch (pattern.category) {
        case 'SECURITY_ISSUES':
          issue = {
            line, column,
            category: 'SECURITY',
            severity: 'CRITICAL',
            pattern: pattern.match,
            problem: 'Security vulnerability detected - code execution risk',
            instruction: 'Replace with secure alternative that validates and sanitizes input',
            example: {
              current: pattern.match,
              suggested: pattern.match.includes('eval') ? 'JSON.parse(validatedInput)' : 'Use parameterized queries'
            }
          };
          break;
          
        case 'TYPESCRIPT_BAILOUTS':
          issue = {
            line, column,
            category: 'TYPE_SAFETY',
            severity: 'HIGH',
            pattern: pattern.match,
            problem: 'Type safety violation - bypasses TypeScript checking',
            instruction: 'Define proper interface and use specific typing instead of any',
            example: {
              current: pattern.match,
              suggested: 'Define: interface ApiResponse { data: T[]; status: string; }'
            }
          };
          break;
          
        case 'PRODUCTION_ISSUES':
          issue = {
            line, column,
            category: 'PRODUCTION',
            severity: 'MEDIUM',
            pattern: pattern.match,
            problem: 'Debug code in production - not suitable for deployment',
            instruction: 'Remove debug statements and replace with proper logging',
            example: {
              current: pattern.match,
              suggested: pattern.match.includes('console') ? 'logger.debug(...)' : 'Remove debugger statements'
            }
          };
          break;
          
        case 'CODE_QUALITY_ISSUES':
          issue = {
            line, column,
            category: 'IMPLEMENTATION',
            severity: 'MEDIUM',
            pattern: pattern.match,
            problem: 'Incomplete implementation - placeholder code detected',
            instruction: 'Complete the implementation with proper business logic and error handling',
            example: {
              current: pattern.match,
              suggested: 'Implement full functionality with try/catch error handling'
            }
          };
          break;
          
        default:
          issue = {
            line, column,
            category: 'GENERAL',
            severity: 'LOW',
            pattern: pattern.match,
            problem: 'Code quality issue detected',
            instruction: 'Review and improve following best practices'
          };
      }
      
      issues.push(issue);
    });
    
    return issues;
  }

  /**
   * Build AI instruction message
   */
  private buildAIInstruction(issues: QualityIssue[], fileName: string): string {
    const critical = issues.filter(i => i.severity === 'CRITICAL');
    const high = issues.filter(i => i.severity === 'HIGH');
    const medium = issues.filter(i => i.severity === 'MEDIUM');
    
    let instruction = `CODE QUALITY ISSUES DETECTED in ${fileName}:\n\n`;
    
    if (critical.length > 0) {
      instruction += `🚨 CRITICAL SECURITY ISSUES (${critical.length}):\n`;
      critical.forEach(issue => {
        instruction += `Line ${issue.line}: ${issue.problem}\n`;
        instruction += `Required: ${issue.instruction}\n`;
        if (issue.example) {
          instruction += `Current: ${issue.example.current}\n`;
          instruction += `Suggested: ${issue.example.suggested}\n`;
        }
        instruction += '\n';
      });
    }
    
    if (high.length > 0) {
      instruction += `⚠️ HIGH PRIORITY ISSUES (${high.length}):\n`;
      high.forEach(issue => {
        instruction += `Line ${issue.line}: ${issue.problem} - ${issue.instruction}\n`;
      });
      instruction += '\n';
    }
    
    if (medium.length > 0) {
      instruction += `📋 MEDIUM PRIORITY ISSUES (${medium.length}):\n`;
      medium.forEach(issue => {
        instruction += `Line ${issue.line}: ${issue.category} - ${issue.instruction}\n`;
      });
      instruction += '\n';
    }
    
    instruction += 'Please rewrite the affected sections with production-ready code that follows security and quality best practices.';
    
    return instruction;
  }

  /**
   * Request AI fixes with user approval
   */
  private async requestUserApprovedAIFix(analysis: FileAnalysis): Promise<void> {
    const report = this.generateQualityReport(analysis);
    
    const action = await vscode.window.showWarningMessage(
      `🔍 ${report.totalIssues} quality issues found in ${report.file}`,
      'Request AI Fix',
      'Show Details',
      'Ignore'
    );
    
    switch (action) {
      case 'Request AI Fix':
        await this.sendAICorrection(report);
        break;
        
      case 'Show Details':
        await this.showDetailedQualityReport(report);
        break;
        
      default:
        this.outputChannel.appendLine(`⏭️ User ignored ${report.totalIssues} quality issues`);
    }
  }

  /**
   * Send correction request to AI
   */
  private async sendAICorrection(report: QualityIssueReport): Promise<void> {
    const activeTerminal = vscode.window.activeTerminal;
    
    if (!activeTerminal) {
      vscode.window.showWarningMessage('⚠️ No active terminal found for AI communication');
      return;
    }
    
    this.aiInterventionCount++;
    this.outputChannel.appendLine(`🤖 AI CORRECTION REQUEST #${this.aiInterventionCount}`);
    this.outputChannel.appendLine(`   File: ${report.file}`);
    this.outputChannel.appendLine(`   Issues: ${report.totalIssues} (${report.criticalCount} critical)`);
    
    // Send correction message to terminal
    activeTerminal.sendText(report.aiInstruction, true);
    
    // Queue success notification
    this.notificationManager.queueNotification({
      type: 'intervention_complete',
      patterns: report.issues.map(i => i.category),
      description: `AI correction requested for ${report.totalIssues} issues`
    });
    
    // Wait and verify fixes
    setTimeout(() => {
      this.verifyAIFixes(report);
    }, 10000); // Check after 10 seconds
  }

  /**
   * Verify that AI actually fixed the issues
   */
  private async verifyAIFixes(originalReport: QualityIssueReport): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    
    this.outputChannel.appendLine(`🔍 VERIFYING AI FIXES for ${originalReport.file}...`);
    
    const newAnalysis = await this.analyzeDocument(editor.document, 'MANUAL');
    
    if (!newAnalysis || newAnalysis.detectionResult.severityScore === 0) {
      this.outputChannel.appendLine(`✅ AI FIXES VERIFIED - All issues resolved!`);
      vscode.window.showInformationMessage(`✅ AI successfully fixed all ${originalReport.totalIssues} quality issues!`);
    } else {
      const remainingIssues = newAnalysis.detectionResult.patterns.length;
      this.outputChannel.appendLine(`⚠️ AI FIXES INCOMPLETE - ${remainingIssues} issues remain`);
      
      if (remainingIssues < originalReport.totalIssues) {
        vscode.window.showInformationMessage(`🔄 AI fixed some issues. ${remainingIssues} remaining.`, 'Request Another Fix');
      } else {
        vscode.window.showWarningMessage(`🚨 AI didn't fix the issues. Manual intervention needed.`);
      }
    }
  }

  /**
   * Show critical issues blocking save
   */
  private async showCriticalIssuesBlock(report: QualityIssueReport): Promise<void> {
    const criticalSummary = report.issues
      .filter(i => i.severity === 'CRITICAL')
      .map(i => `Line ${i.line}: ${i.problem}`)
      .join('\n');
    
    await vscode.window.showErrorMessage(
      `🚨 SAVE BLOCKED: ${report.criticalCount} critical issues must be fixed first`,
      'Show Details'
    ).then(selection => {
      if (selection === 'Show Details') {
        this.showDetailedQualityReport(report);
      }
    });
  }

  /**
   * Show detailed quality report
   */
  private async showDetailedQualityReport(report?: QualityIssueReport): Promise<void> {
    if (!report) {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('No active file to analyze.');
        return;
      }
      
      const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
      if (!analysis) {
        vscode.window.showInformationMessage('✅ No quality issues detected!');
        return;
      }
      
      report = this.generateQualityReport(analysis);
    }
    
    const reportContent = this.generateDetailedReportMarkdown(report);
    
    const document = await vscode.workspace.openTextDocument({
      content: reportContent,
      language: 'markdown'
    });
    
    await vscode.window.showTextDocument(document, vscode.ViewColumn.Beside);
  }

  /**
   * Generate detailed markdown report
   */
  private generateDetailedReportMarkdown(report: QualityIssueReport): string {
    return [
      `# 🛡️ AI Code Guard - Quality Report`,
      ``,
      `**File:** ${report.file}`,
      `**Analysis Time:** ${new Date().toLocaleString()}`,
      `**Total Issues:** ${report.totalIssues}`,
      `**Critical:** ${report.criticalCount} | **High:** ${report.highCount}`,
      ``,
      `## 🚨 Issues Detected`,
      ``,
      ...report.issues.map(issue => [
        `### Line ${issue.line}: ${issue.category} - **${issue.severity}**`,
        ``,
        `**Problem:** ${issue.problem}`,
        `**Pattern:** \`${issue.pattern}\``,
        `**Required Action:** ${issue.instruction}`,
        ``,
        issue.example ? [
          `**Example Fix:**`,
          `\`\`\`typescript`,
          `// Current (problematic):`,
          issue.example.current,
          ``,
          `// Suggested fix:`,
          issue.example.suggested,
          `\`\`\``,
          ``
        ].join('\n') : '',
      ].join('\n')),
      ``,
      `## 🤖 AI Instruction`,
      ``,
      `\`\`\``,
      report.aiInstruction,
      `\`\`\``,
      ``,
      `## 📋 Next Steps`,
      ``,
      `1. **Copy the AI instruction above**`,
      `2. **Paste into your AI terminal (Claude, ChatGPT, etc.)**`,
      `3. **AI will provide specific fixes**`,
      `4. **Apply the fixes to your code**`,
      `5. **Save file to verify issues resolved**`,
      ``,
      `---`,
      `*Generated by AI Code Guard - Smart Quality Enforcement*`
    ].join('\n');
  }

  /**
   * Manual command to request AI fixes for current file
   */
  private async requestAIFixes(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file to analyze.');
      return;
    }
    
    const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
    if (!analysis) {
      vscode.window.showInformationMessage('✅ No quality issues detected!');
      return;
    }
    
    const report = this.generateQualityReport(analysis);
    await this.sendAICorrection(report);
  }

  /**
   * Analyze current file manually
   */
  private async analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active file to analyze.');
      return;
    }
    
    this.outputChannel.appendLine(`🔍 MANUAL QUALITY ANALYSIS: ${editor.document.fileName}`);
    
    const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
    if (analysis) {
      const report = this.generateQualityReport(analysis);
      vscode.window.showInformationMessage(
        `Analysis complete: ${report.totalIssues} issues found (${report.criticalCount} critical)`,
        'Show Report',
        'Request AI Fix'
      ).then(selection => {
        if (selection === 'Show Report') {
          this.showDetailedQualityReport(report);
        } else if (selection === 'Request AI Fix') {
          this.sendAICorrection(report);
        }
      });
    } else {
      vscode.window.showInformationMessage('✅ No quality issues detected!');
    }
  }

  /**
   * Check if automatic AI intervention should occur
   */
  private shouldTriggerAIIntervention(analysis: FileAnalysis): boolean {
    // Only auto-intervene for real-time scenarios
    if (analysis.triggerType !== 'TYPE' && analysis.triggerType !== 'SAVE') {
      return false;
    }
    
    // Check cooldown
    const now = Date.now();
    if (this.aiInterventionActive || (now - this.lastAIInterventionTime) < this.AI_INTERVENTION_COOLDOWN) {
      return false;
    }
    
    // Check if terminal is available
    if (!vscode.window.activeTerminal) {
      return false;
    }
    
    // Auto-intervene for REQUIRES_ATTENTION issues
    return analysis.detectionResult.qualityLevel === 'REQUIRES_ATTENTION';
  }

  /**
   * Perform automatic AI intervention
   */
  private async performAutomaticAIIntervention(analysis: FileAnalysis): Promise<void> {
    this.aiInterventionActive = true;
    this.lastAIInterventionTime = Date.now();
    
    const report = this.generateQualityReport(analysis);
    
    this.outputChannel.appendLine(`🤖 AUTOMATIC AI INTERVENTION`);
    this.outputChannel.appendLine(`   File: ${report.file}`);
    this.outputChannel.appendLine(`   Critical Issues: ${report.criticalCount}`);
    
    await this.sendAICorrection(report);
    
    // Reset lock
    setTimeout(() => {
      this.aiInterventionActive = false;
    }, 5000);
  }

  // Helper methods
  
  private isCodeFile(document: vscode.TextDocument): boolean {
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs'];
    return codeExtensions.some(ext => document.fileName.endsWith(ext));
  }
  
  private determineInterventionLevel(result: DetectionResult, triggerType: FileAnalysis['triggerType']): FileAnalysis['interventionLevel'] {
    if (result.qualityLevel === 'REQUIRES_ATTENTION') {
      return triggerType === 'SAVE' ? 'BLOCK' : 'SIGNAL_AI';
    } else if (result.qualityLevel === 'NEEDS_IMPROVEMENT' || result.severityScore >= 25) {
      return 'SIGNAL_AI';
    } else if (result.severityScore >= 10) {
      return 'WARNING';
    }
    return 'NONE';
  }
  
  private storeAnalysisHistory(analysis: FileAnalysis): void {
    const history = this.fileAnalysisHistory.get(analysis.filePath) || [];
    history.push(analysis);
    
    if (history.length > 10) {
      history.splice(0, history.length - 10);
    }
    
    this.fileAnalysisHistory.set(analysis.filePath, history);
  }
  
  private queueWarningNotification(analysis: FileAnalysis): void {
    const fileName = analysis.filePath.split('/').pop() || 'file';
    const notificationData: BailoutNotificationData = {
      type: 'tool_bailout',
      patterns: analysis.detectionResult.patterns.map(p => p.category),
      severity: analysis.detectionResult.qualityLevel,
      description: `Quality issues in ${fileName} - consider requesting AI fixes`
    };
    
    this.notificationManager.queueNotification(notificationData);
  }

  public getStats(): any {
    return {
      detectionCount: this.detectionCount,
      interventionCount: this.aiInterventionCount,
      filesAnalyzed: this.fileAnalysisHistory.size,
      recentAnalyses: Array.from(this.fileAnalysisHistory.values())
        .flat()
        .filter(a => Date.now() - a.timestamp < 3600000) // Last hour
        .length
    };
  }

  public dispose(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.fileAnalysisHistory.clear();
    this.lastAnalysisTime.clear();
    this.outputChannel.appendLine('🛑 AI-directed quality monitoring stopped');
  }
}
