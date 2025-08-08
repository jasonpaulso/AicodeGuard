import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NotificationManager } from '../managers/NotificationManager';
import { ConversationAnalyzer } from '../analyzers/ConversationAnalyzer';
import * as constants from '../constants';

export class ConversationWatcher {
  private projectsPath: string;
  private fileWatchers: fs.FSWatcher[] = [];
  private lastAnalyzedMessageCount = new Map<string, number>();
  private analysisTimeouts = new Map<string, NodeJS.Timeout>();
  private notificationManager: NotificationManager;
  private conversationAnalyzer: ConversationAnalyzer;
  
  // Prevent multiple interventions for the same session
  private interventionActive: boolean = false;
  private lastInterventionTime: number = 0;
  private readonly INTERVENTION_COOLDOWN = 60000; // 1 minute

  constructor() {
    this.projectsPath = path.join(os.homedir(), 'Projects');
    this.notificationManager = NotificationManager.getInstance();
    this.conversationAnalyzer = new ConversationAnalyzer();
  }

  public async startWatching(): Promise<void> {
    if (!fs.existsSync(this.projectsPath)) {
      console.log(`📂 Projects directory not found: ${this.projectsPath}`);
      return;
    }

    await this.findAndWatchProjects();
  }

  private async findAndWatchProjects(): Promise<void> {
    try {
      const entries = fs.readdirSync(this.projectsPath);
      
      for (const entry of entries) {
        const projectPath = path.join(this.projectsPath, entry);
        const todoPath = path.join(projectPath, 'TODO.claude.md');
        
        if (fs.existsSync(todoPath)) {
          this.watchTodoFile(todoPath);
        }
      }
    } catch (error) {
      console.error('Error finding projects:', error);
    }
  }

  private watchTodoFile(filePath: string): void {
    try {
      const watcher = fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          this.scheduleTodoAnalysis(filePath);
        }
      });
      
      this.fileWatchers.push(watcher);
      
      // Initial analysis
      this.scheduleTodoAnalysis(filePath);
      
    } catch (error) {
      console.error(`Error watching file ${filePath}:`, error);
    }
  }

  private scheduleTodoAnalysis(filePath: string): void {
    // Clear existing timeout for this file
    if (this.analysisTimeouts.has(filePath)) {
      clearTimeout(this.analysisTimeouts.get(filePath)!);
    }
    
    // Schedule new analysis after a brief delay
    const timeout = setTimeout(() => {
      this.analyzeTodoFile(filePath);
    }, 2000);
    
    this.analysisTimeouts.set(filePath, timeout);
  }

  private async analyzeTodoFile(filePath: string): Promise<void> {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const messages = this.extractMessages(content);
      
      // Skip analysis if no new messages
      const currentMessageCount = messages.length;
      const lastCount = this.lastAnalyzedMessageCount.get(filePath) || 0;
      
      if (currentMessageCount <= lastCount) return;
      
      this.lastAnalyzedMessageCount.set(filePath, currentMessageCount);
      
      // Analyze recent messages for implementation avoidance
      const recentMessages = messages.slice(lastCount);
      const recentContent = recentMessages.join('\n');
      
      const analysis = this.conversationAnalyzer.analyzeTodoBailoutPatterns(recentContent);
      
      if (this.conversationAnalyzer.shouldTriggerIntervention(analysis) && this.canIntervene()) {
        await this.triggerIntervention(filePath, analysis);
      }
      
    } catch (error) {
      console.error(`Error analyzing TODO file ${filePath}:`, error);
    }
  }

  private extractMessages(content: string): string[] {
    // Simple message extraction - split by common patterns
    const messagePatterns = [
      /^##\s+/gm,  // H2 headers
      /^###\s+/gm, // H3 headers
      /^\*\s+/gm,  // Bullet points
      /^-\s+/gm,   // Dash points
      /^\d+\.\s+/gm // Numbered lists
    ];
    
    let messages = [content];
    
    for (const pattern of messagePatterns) {
      const newMessages: string[] = [];
      for (const message of messages) {
        newMessages.push(...message.split(pattern));
      }
      messages = newMessages.filter(m => m.trim().length > 0);
    }
    
    return messages;
  }

  private canIntervene(): boolean {
    if (this.interventionActive) return false;
    
    const timeSinceLastIntervention = Date.now() - this.lastInterventionTime;
    return timeSinceLastIntervention >= this.INTERVENTION_COOLDOWN;
  }

  private async triggerIntervention(filePath: string, analysis: any): Promise<void> {
    this.interventionActive = true;
    this.lastInterventionTime = Date.now();
    
    try {
      const projectName = path.basename(path.dirname(filePath));
      
      // Notify about implementation avoidance patterns
      this.notificationManager.queueNotification({
        type: 'tool_bailout',
        patterns: analysis.bailoutPatterns,
        severity: analysis.severity,
        description: `Implementation avoidance detected in ${projectName} (Score: ${analysis.score})`
      });
      
      // Show intervention message
      const message = `🚨 Implementation avoidance detected in ${projectName}!\nPatterns: ${analysis.bailoutPatterns.slice(0, 3).join(', ')}`;
      
      const action = await vscode.window.showWarningMessage(
        message,
        'Show Details',
        'Ignore',
        'Stop Monitoring'
      );
      
      if (action === 'Show Details') {
        this.showAnalysisDetails(filePath, analysis);
      } else if (action === 'Stop Monitoring') {
        this.stopWatchingFile(filePath);
      }
      
    } finally {
      setTimeout(() => {
        this.interventionActive = false;
      }, 5000);
    }
  }

  private showAnalysisDetails(filePath: string, analysis: any): void {
    const projectName = path.basename(path.dirname(filePath));
    const details = `
# Implementation Avoidance Analysis - ${projectName}

**Severity:** ${analysis.severity}  
**Score:** ${analysis.score}/100

## Detected Patterns:
${analysis.bailoutPatterns.map((p: string) => `- ${p}`).join('\n')}

## Recommendation:
Consider requesting specific implementation instead of planning or mock code.
    `;
    
    const panel = vscode.window.createWebviewPanel(
      'conversationAnalysis',
      `Conversation Analysis - ${projectName}`,
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    );
    
    panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px;">
        <pre>${details}</pre>
      </body>
      </html>
    `;
  }

  private stopWatchingFile(filePath: string): void {
    // Remove from analysis tracking
    this.lastAnalyzedMessageCount.delete(filePath);
    
    // Clear timeout
    if (this.analysisTimeouts.has(filePath)) {
      clearTimeout(this.analysisTimeouts.get(filePath)!);
      this.analysisTimeouts.delete(filePath);
    }
    
    // Note: We don't remove the file watcher here as it's referenced by path
    // The watcher will be cleaned up when dispose() is called
  }

  public dispose(): void {
    // Close all file watchers
    this.fileWatchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        console.error('Error closing watcher:', error);
      }
    });
    
    this.fileWatchers = [];
    
    // Clear all timeouts
    this.analysisTimeouts.forEach(timeout => clearTimeout(timeout));
    this.analysisTimeouts.clear();
    
    // Clear tracking data
    this.lastAnalyzedMessageCount.clear();
  }

  public getStats() {
    return {
      watchedFiles: this.fileWatchers.length,
      trackedFiles: this.lastAnalyzedMessageCount.size,
      interventionActive: this.interventionActive,
      lastInterventionTime: this.lastInterventionTime
    };
  }
}