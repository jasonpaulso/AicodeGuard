import * as vscode from 'vscode';
import { PatternDetector, DetectionResult } from '../core/PatternDetector';
import { NotificationManager, BailoutNotificationData } from '../managers/NotificationManager';
import { FileAnalysis, QualityIssueReport } from '../types/common';
import { QualityAnalyzer } from '../analyzers/QualityAnalyzer';
import { InterventionEngine } from '../analyzers/InterventionEngine';

export class FileWatcher {
  private patternDetector: PatternDetector;
  private notificationManager: NotificationManager;
  private qualityAnalyzer: QualityAnalyzer;
  private interventionEngine: InterventionEngine;
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

  constructor(outputChannel: vscode.OutputChannel) {
    this.outputChannel = outputChannel;
    this.patternDetector = new PatternDetector();
    this.notificationManager = NotificationManager.getInstance();
    this.qualityAnalyzer = new QualityAnalyzer();
    this.interventionEngine = new InterventionEngine(outputChannel);
  }

  public startMonitoring(): vscode.Disposable[] {
    this.outputChannel.appendLine('🛡️ AI Code Guard - File monitoring activated');
    
    return [
      vscode.workspace.onDidChangeTextDocument(event => {
        this.handleTextChange(event);
      }),

      vscode.workspace.onWillSaveTextDocument(event => {
        event.waitUntil(this.handlePreSave(event.document));
      }),

      vscode.workspace.onDidSaveTextDocument(document => {
        this.handleFileSave(document);
      }),

      vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor) {
          this.handleFileFocus(editor.document);
        }
      }),

      vscode.commands.registerCommand('ai-code-guard.analyzeCurrentFile', () => {
        this.analyzeCurrentFile();
      }),

      vscode.commands.registerCommand('ai-code-guard.fixCodeIssues', () => {
        this.requestAIFixes();
      }),

      vscode.commands.registerCommand('ai-code-guard.showQualityReport', () => {
        this.showDetailedQualityReport();
      })
    ];
  }

  private handleTextChange(event: vscode.TextDocumentChangeEvent): void {
    if (!this.isCodeFile(event.document)) return;
    
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    this.typingTimer = setTimeout(() => {
      this.performRealtimeAnalysis(event.document, 'TYPE');
    }, this.TYPING_DELAY);
  }

  private async handlePreSave(document: vscode.TextDocument): Promise<vscode.TextEdit[]> {
    if (!this.isCodeFile(document)) return [];
    
    this.outputChannel.appendLine(`🔍 PRE-SAVE QUALITY CHECK: ${document.fileName}`);
    
    const analysis = await this.analyzeDocument(document, 'SAVE');
    
    if (analysis && analysis.detectionResult.qualityLevel === 'CRITICAL') {
      this.outputChannel.appendLine(`🚨 CRITICAL ISSUES DETECTED - BLOCKING SAVE`);
      
      const report = this.qualityAnalyzer.generateQualityReport(analysis);
      await this.interventionEngine.showCriticalIssuesBlock(report);
      
      throw new Error(`🚨 CRITICAL CODE ISSUES: ${report.criticalCount} issues must be fixed before saving.`);
    }
    
    return [];
  }

  private handleFileSave(document: vscode.TextDocument): void {
    if (!this.isCodeFile(document)) return;
    
    this.outputChannel.appendLine(`💾 FILE SAVED: ${document.fileName}`);
    
    setTimeout(() => {
      this.performRealtimeAnalysis(document, 'SAVE');
    }, 500);
  }

  private handleFileFocus(document: vscode.TextDocument): void {
    if (!this.isCodeFile(document)) return;
    this.performRealtimeAnalysis(document, 'FOCUS');
  }

  private async performRealtimeAnalysis(document: vscode.TextDocument, triggerType: FileAnalysis['triggerType']): Promise<void> {
    const filePath = document.fileName;
    const now = Date.now();
    const lastAnalysis = this.lastAnalysisTime.get(filePath) || 0;
    
    if (now - lastAnalysis < this.MIN_ANALYSIS_INTERVAL) {
      return;
    }
    
    this.lastAnalysisTime.set(filePath, now);
    
    const analysis = await this.analyzeDocument(document, triggerType);
    if (analysis) {
      await this.handleQualityDetection(analysis);
    }
  }

  private async analyzeDocument(document: vscode.TextDocument, triggerType: FileAnalysis['triggerType']): Promise<FileAnalysis | null> {
    if (this.isAnalyzing) return null;
    
    this.isAnalyzing = true;
    
    try {
      const content = document.getText();
      if (!content.trim()) return null;
      
      const detectionResult = this.patternDetector.analyzeCode(content);
      this.detectionCount++;
      
      const analysis: FileAnalysis = {
        filePath: document.fileName,
        timestamp: Date.now(),
        detectionResult,
        triggerType,
        interventionLevel: this.determineInterventionLevel(detectionResult, triggerType)
      };
      
      this.storeAnalysisHistory(analysis);
      
      return analysis;
      
    } catch (error) {
      this.outputChannel.appendLine(`❌ Analysis error: ${error}`);
      return null;
    } finally {
      this.isAnalyzing = false;
    }
  }

  private async handleQualityDetection(analysis: FileAnalysis): Promise<void> {
    const { interventionLevel } = analysis;
    
    if (this.interventionEngine.shouldTriggerAIIntervention(analysis)) {
      await this.interventionEngine.performAutomaticAIIntervention(analysis);
      return;
    }
    
    switch (interventionLevel) {
      case 'SIGNAL_AI':
        await this.interventionEngine.requestUserApprovedAIFix(analysis);
        break;
        
      case 'WARNING':
        this.queueWarningNotification(analysis);
        break;
    }
  }

  private async requestAIFixes(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
    if (analysis && analysis.detectionResult.patterns.length > 0) {
      await this.interventionEngine.requestUserApprovedAIFix(analysis);
    } else {
      vscode.window.showInformationMessage('✅ No quality issues detected');
    }
  }

  private async analyzeCurrentFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('No active editor');
      return;
    }

    const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
    if (analysis) {
      const report = this.qualityAnalyzer.generateQualityReport(analysis);
      
      if (report.totalIssues > 0) {
        vscode.window.showInformationMessage(
          `🔍 Found ${report.totalIssues} issues (${report.criticalCount} critical, ${report.highCount} high)`
        );
      } else {
        vscode.window.showInformationMessage('✅ No quality issues detected');
      }
    }
  }

  private async showDetailedQualityReport(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
    if (analysis) {
      const report = this.qualityAnalyzer.generateQualityReport(analysis);
      const panel = vscode.window.createWebviewPanel(
        'qualityReport',
        `Quality Report: ${report.file}`,
        vscode.ViewColumn.Beside,
        { enableScripts: false }
      );
      panel.webview.html = `<h1>Quality Report</h1><pre>${report.aiInstruction}</pre>`;
    }
  }

  private isCodeFile(document: vscode.TextDocument): boolean {
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs'];
    return codeExtensions.some(ext => document.fileName.endsWith(ext));
  }
  
  private determineInterventionLevel(result: DetectionResult, triggerType: FileAnalysis['triggerType']): FileAnalysis['interventionLevel'] {
    if (result.qualityLevel === 'CRITICAL') {
      return triggerType === 'SAVE' ? 'BLOCK' : 'SIGNAL_AI';
    } else if (result.qualityLevel === 'POOR' || result.severityScore >= 25) {
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
      history.shift();
    }
    
    this.fileAnalysisHistory.set(analysis.filePath, history);
  }
  
  private queueWarningNotification(analysis: FileAnalysis): void {
    const fileName = analysis.filePath.split('/').pop() || 'file';
    const notificationData: BailoutNotificationData = {
      type: 'tool_bailout',
      patterns: analysis.detectionResult.patterns.map((p: any) => p.category),
      severity: analysis.detectionResult.qualityLevel,
      description: `Quality issues in ${fileName} - consider requesting AI fixes`
    };
    
    this.notificationManager.queueNotification(notificationData);
  }

  public getStats(): any {
    return {
      totalDetections: this.detectionCount,
      aiInterventions: this.aiInterventionCount,
      filesMonitored: this.fileAnalysisHistory.size,
      isAnalyzing: this.isAnalyzing
    };
  }

  public dispose(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    this.fileAnalysisHistory.clear();
    this.lastAnalysisTime.clear();
  }
}