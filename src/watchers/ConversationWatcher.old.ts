import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { NotificationManager } from '../managers/NotificationManager';
import * as constants from '../constants';

interface TodoBailoutAnalysis {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  bailoutPatterns: string[];
  score: number;
}

export class ConversationWatcher {
  private projectsPath: string;
  private fileWatchers: fs.FSWatcher[] = [];
  private lastAnalyzedMessageCount = new Map<string, number>();
  private analysisTimeouts = new Map<string, NodeJS.Timeout>();
  private notificationManager: NotificationManager;
  
  // Prevent multiple interventions for the same session
  private interventionActive: boolean = false;
  private lastInterventionTime: number = 0;

  // Research-based patterns for AI implementation avoidance analysis
  private implementationAvoidancePatterns = {
    HIGH: [
      'analyze existing', 'research approach', 'plan implementation', 'design architecture',
      'set up basic structure', 'careful planning', 'understand requirements', 'study the codebase',
      'preliminary analysis', 'investigate current', 'evaluate options', 'determine best approach',
      'assess feasibility', 'gather requirements', 'create strategy', 'develop plan',
      
      // Mock/Stub/Placeholder patterns - CRITICAL IMPLEMENTATION AVOIDANCE
      'create mock', 'implement mock', 'mock implementation', 'mock service', 'mock auth',
      'mock data', 'basic mock', 'simple mock', 'create stub', 'implement stub',
      'stub implementation', 'stub service', 'stub function', 'stub component',
      'basic stub', 'simple stub', 'placeholder implementation', 'placeholder service',
      'placeholder function', 'placeholder component', 'temporary implementation',
      'temporary service', 'dummy implementation', 'dummy service', 'dummy data',
      'fake implementation', 'fake service', 'skeleton implementation', 'skeleton service',
      'basic skeleton',
      
      // "For now" patterns - scope reduction
      'for now', 'basic version for now', 'simple version for now', 'minimal for now',
      'quick implementation for now',
      
      // "Just" patterns - minimization
      'just create basic', 'just implement simple', 'just add basic', 'just make simple'
    ],
    MEDIUM: [
      'add proper error handling', 'enhance for production', 'write comprehensive tests',
      'optimize performance', 'improve documentation', 'refactor existing', 'add validation'
    ]
  };
  
  constructor() {
    this.projectsPath = path.join(os.homedir(), '.claude', 'projects');
    this.notificationManager = NotificationManager.getInstance();
  }
  
  public startMonitoring(): void {
    console.log('🎯 Starting AI Conversation Quality Watcher...');
    this.setupFileWatchers();
  }
  
  private setupFileWatchers(): void {
    try {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      
      if (!workspaceFolders || workspaceFolders.length === 0) {
        console.log('⚠️ No workspace folder found - monitoring ALL AI project directories');
        this.setupAllDirectoryWatchers();
        return;
      }

      const currentWorkspacePath = workspaceFolders[0].uri.fsPath;
      console.log(`🎯 Current workspace: ${currentWorkspacePath}`);
      
      const claudeProjectDirName = currentWorkspacePath.replace(/\//g, '-').replace(/\s+/g, '-');
      const claudeProjectPath = path.join(this.projectsPath, claudeProjectDirName);
      
      console.log(`🔍 Looking for AI project directory: ${claudeProjectDirName}`);
      
      if (!fs.existsSync(claudeProjectPath)) {
        console.log(`❌ AI project directory not found: ${claudeProjectPath}`);
        
        // Try fuzzy matching
        const availableDirs = fs.readdirSync(this.projectsPath);
        const baseName = currentWorkspacePath.split('/').pop() || '';
        const possibleMatches = availableDirs.filter(dir => 
          dir.toLowerCase().includes(baseName.toLowerCase().replace(/\s+/g, '-')) ||
          dir.toLowerCase().includes(baseName.toLowerCase().replace(/\s+/g, ''))
        );
        
        console.log(`📂 Available directories:`);
        availableDirs.forEach(dir => console.log(`   - ${dir}`));
        
        if (possibleMatches.length > 0) {
          console.log(`🔍 Possible matches for "${baseName}":`);
          possibleMatches.forEach(match => console.log(`   ✓ ${match}`));
          
          const matchedDir = possibleMatches[0];
          const matchedPath = path.join(this.projectsPath, matchedDir);
          console.log(`🎯 Using matched directory: ${matchedDir}`);
          this.setupSingleDirectoryWatcher(matchedPath, matchedDir);
          return;
        }
        
        console.log(`⚠️ Falling back to monitoring ALL directories`);
        this.setupAllDirectoryWatchers();
        return;
      }

      console.log(`✅ Found AI project directory: ${claudeProjectPath}`);
      this.setupSingleDirectoryWatcher(claudeProjectPath, claudeProjectDirName);
      
    } catch (error) {
      console.log(`Error setting up conversation watchers: ${error}`);
      this.setupAllDirectoryWatchers();
    }
  }

  private setupSingleDirectoryWatcher(claudeProjectPath: string, claudeProjectDirName: string): void {
    const files = fs.readdirSync(claudeProjectPath);
    const jsonlFiles = files.filter(f => f.endsWith('.jsonl'));
    
    if (jsonlFiles.length === 0) {
      console.log(`❌ No .jsonl conversation files found in ${claudeProjectDirName}`);
      return;
    }

    console.log(`📄 Found ${jsonlFiles.length} conversation file(s):`);
    jsonlFiles.forEach(file => {
      const filePath = path.join(claudeProjectPath, file);
      const stats = fs.statSync(filePath);
      console.log(`   📝 ${file} (modified: ${stats.mtime.toLocaleTimeString()})`);
    });

    const watcher = fs.watch(claudeProjectPath, (eventType, filename) => {
      if (filename?.endsWith('.jsonl')) {
        const filePath = path.join(claudeProjectPath, filename);
        console.log(`🔄 Conversation file updated: ${filename}`);
        this.scheduleAnalysis(filePath);
      }
    });
    
    this.fileWatchers.push(watcher);
    console.log(`🎯 Monitoring conversation files in: ${claudeProjectDirName}`);
  }

  private setupAllDirectoryWatchers(): void {
    try {
      const projectDirs = fs.readdirSync(this.projectsPath);
      console.log(`📁 Monitoring ALL ${projectDirs.length} AI project directories`);
      
      projectDirs.forEach(dir => {
        const dirPath = path.join(this.projectsPath, dir);
        
        if (fs.statSync(dirPath).isDirectory()) {
          const watcher = fs.watch(dirPath, (eventType, filename) => {
            if (filename?.endsWith('.jsonl')) {
              const filePath = path.join(dirPath, filename);
              console.log(`🔄 File change detected: ${filename} in ${dir}`);
              this.scheduleAnalysis(filePath);
            }
          });
          
          this.fileWatchers.push(watcher);
        }
      });
      
      console.log(`✅ AI conversation quality detection active for ALL projects`);
    } catch (error) {
      console.log(`Error setting up all directory watchers: ${error}`);
    }
  }
  
  private scheduleAnalysis(filePath: string): void {
    const existingTimeout = this.analysisTimeouts.get(filePath);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }
    
    const timeout = setTimeout(() => {
      this.performConversationAnalysis(filePath);
      this.analysisTimeouts.delete(filePath);
    }, 1000);
    
    this.analysisTimeouts.set(filePath, timeout);
  }
  
  private performConversationAnalysis(filePath: string): void {
    try {
      if (!fs.existsSync(filePath)) return;
      
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.trim().split('\n');
      const currentMessageCount = lines.length;
      const lastCount = this.lastAnalyzedMessageCount.get(filePath) || 0;
      
      if (currentMessageCount <= lastCount) return;
      
      console.log(`\n🔍 CONVERSATION QUALITY ANALYSIS: ${path.basename(filePath)}`);
      console.log(`   Messages: ${lastCount} → ${currentMessageCount} (+${currentMessageCount - lastCount})`);
      
      const newMessages = lines.slice(lastCount);
      this.lastAnalyzedMessageCount.set(filePath, currentMessageCount);
      
      newMessages.forEach((line, index) => {
        try {
          const message = JSON.parse(line);
          const messageNum = lastCount + index + 1;
          
          const toolUse = this.extractToolUse(message);
          
          if (toolUse) {
            console.log(`\n🔧 Message ${messageNum} - TOOL USE DETECTED:`);
            console.log(`   Tool: ${toolUse.tool} (${toolUse.confidence})`);
            
            // Smart implementation avoidance detection for TODO tools
            if (toolUse.tool === 'todowrite' || toolUse.tool === 'todoupdate' || toolUse.hasTodoContent) {
              const implementationAnalysis = this.analyzeImplementationAvoidanceContent(toolUse.result || '');
              
              if (implementationAnalysis.severity === 'HIGH') {
                console.log(`🚨 IMPLEMENTATION AVOIDANCE DETECTED!`);
                console.log(`   Patterns: ${implementationAnalysis.bailoutPatterns.join(', ')}`);
                
                this.triggerImplementationIntervention(implementationAnalysis.bailoutPatterns, toolUse.result || '', messageNum);
              } else if (implementationAnalysis.severity === 'MEDIUM') {
                console.log(`⚠️ Medium severity implementation issue detected: ${implementationAnalysis.bailoutPatterns.join(', ')}`);
              } else {
                console.log(`✅ Legitimate task organization detected`);
              }
            }
          }
          
        } catch (e: any) {
          vscode.window.showErrorMessage(`Error parsing conversation log: ${e.message}`);
        }
      });
      
    } catch (error: any) {
      vscode.window.showErrorMessage(`Conversation analysis error: ${error.message}`);
    }
  }

  private extractToolUse(message: any): { 
    tool: string, 
    result?: string, 
    confidence: string,
    hasTodoContent: boolean 
  } | null {
    if (!message.toolUseResult) return null;
    
    const result = typeof message.toolUseResult === 'string' 
      ? message.toolUseResult 
      : JSON.stringify(message.toolUseResult);
    
    let toolName = 'unknown';
    let confidence = 'low';
    
    // Enhanced tool name detection
    if (message.message?.tool_calls?.[0]?.function?.name) {
      toolName = message.message.tool_calls[0].function.name;
      confidence = 'high';
    } else if (message.message?.content?.[0]?.name) {
      toolName = message.message.content[0].name;
      confidence = 'high';
    }
    
    const hasTodoContent = this.detectTodoContent(result);
    
    if (hasTodoContent && toolName === 'unknown') {
      if (result.includes('newTodos') && result.includes('oldTodos')) {
        toolName = 'todowrite';
        confidence = 'medium';
      } else if (result.includes('☐') || result.includes('TODO:')) {
        toolName = 'todowrite';
        confidence = 'low';
      }
    }
    
    return { tool: toolName, result, confidence, hasTodoContent };
  }
  
  private detectTodoContent(text: string): boolean {
    const todoIndicators = ['newTodos', 'oldTodos', '☐', 'TODO:', 'pending', 'status":"pending', 'content":"'];
    return todoIndicators.some(indicator => text.includes(indicator));
  }

  private analyzeImplementationAvoidanceContent(todoContent: string): TodoBailoutAnalysis {
    const detectedPatterns: string[] = [];
    let score = 0;
    let severity: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

    // Check for HIGH severity implementation avoidance patterns
    for (const pattern of this.implementationAvoidancePatterns.HIGH) {
      const regex = new RegExp(pattern.replace(/\s+/g, '\\s*'), 'i');
      if (regex.test(todoContent.toLowerCase())) {
        detectedPatterns.push(pattern);
        score += 10;
        severity = 'HIGH';
      }
    }

    // Additional implementation avoidance word detection
    const avoidanceWords = ['mock', 'stub', 'placeholder', 'dummy', 'fake', 'skeleton', 'temporary', 'basic', 'simple', 'minimal', 'quick'];
    const contentLower = todoContent.toLowerCase();
    
    avoidanceWords.forEach(word => {
      if (contentLower.includes(word) && !detectedPatterns.includes(word)) {
        detectedPatterns.push(word);
        score += 8;
        severity = 'HIGH';
      }
    });

    // Scope reduction phrases
    const scopeReductionPhrases = ['for now', 'just', 'only', 'simply', 'basic version', 'quick version'];
    scopeReductionPhrases.forEach(phrase => {
      if (contentLower.includes(phrase)) {
        detectedPatterns.push(phrase);
        score += 12;
        severity = 'HIGH';
      }
    });

    // Check MEDIUM patterns if no HIGH found
    if (severity === 'LOW') {
      for (const pattern of this.implementationAvoidancePatterns.MEDIUM) {
        const regex = new RegExp(pattern.replace(/\s+/g, '\\s*'), 'i');
        if (regex.test(todoContent.toLowerCase())) {
        detectedPatterns.push(pattern);
        score += constants.MEDIUM_SEVERITY_PATTERN_SCORE;
        severity = 'MEDIUM';
      }
      }
    }

    return { severity, bailoutPatterns: detectedPatterns, score };
  }

  private triggerImplementationIntervention(avoidancePatterns: string[], todoContent: string, messageNum: number): void {
    // Prevent multiple interventions within 30 seconds
    const now = Date.now();
    if (this.interventionActive || (now - this.lastInterventionTime) < 30000) {
      console.log(`🛑 INTERVENTION SKIPPED - Already active or too recent`);
      return;
    }
    
    this.interventionActive = true;
    this.lastInterventionTime = now;
    
    console.log(`🛑 IMPLEMENTATION INTERVENTION TRIGGERED #${messageNum}`);
    console.log(`   Patterns: ${avoidancePatterns.join(', ')}`);
    
    const activeTerminal = vscode.window.activeTerminal;
    
    if (activeTerminal) {
      console.log(`🛑 SENDING INTERRUPT to: ${activeTerminal.name}`);
      // Send ASCII ESC key to interrupt AI assistant
      activeTerminal.sendText('\u001B', false); // ASCII 27 (ESC)
      
      setTimeout(() => {
        console.log(`📤 SENDING ENHANCED CORRECTION PROMPT`);
        const correctionPrompt = this.generateDetailedCorrectionMessage(avoidancePatterns, todoContent);
        
        console.log(`📤 Correction text: ${correctionPrompt}`);
        
        // Use ASCII Enter (CR) - the method that worked
        activeTerminal.sendText(correctionPrompt, false);
        activeTerminal.sendText('\u000D', false); // ASCII 13 (CR)
        
        // Queue the intervention complete notification
        this.notificationManager.queueNotification({
          type: 'intervention_complete',
          patterns: avoidancePatterns,
          messageNum: messageNum
        });
        
      }, 1500);
      
    } else {
      console.log(`❌ NO TERMINAL FOUND - Cannot intervene`);
      
      // Route fallback notification through NotificationManager
      this.notificationManager.queueNotification({
        type: 'todo_bailout',
        patterns: avoidancePatterns
      });
    }
    
    // Reset intervention lock after delay
    setTimeout(() => {
      this.interventionActive = false;
      console.log(`🔓 INTERVENTION LOCK RELEASED`);
    }, 5000);
  }

  /**
   * Generate detailed, specific correction messages based on detected patterns
   */
  private generateDetailedCorrectionMessage(avoidancePatterns: string[], todoContent: string): string {
    const patternCategories = this.categorizeAvoidancePatterns(avoidancePatterns);
    const suggestions = this.generateSpecificSuggestions(patternCategories, todoContent);
    
    const message = [
      `🛡️ QUALITY INTERVENTION: Implementation avoidance patterns detected - providing specific corrections:`,
      ``,
      `DETECTED ISSUES:`,
      ...patternCategories.map(cat => `• ${cat.category}: ${cat.patterns.join(', ')}`),
      ``,
      `REQUIRED ACTIONS:`,
      ...suggestions,
      ``,
      `QUALITY EXPECTATIONS:`,
      `• Provide working, production-ready code implementation`,
      `• Include proper error handling and edge cases`,
      `• Use appropriate TypeScript types (no 'as any')`,
      `• Add comprehensive input validation`,
      `• Implement security best practices`,
      `• Write complete functionality, not placeholders`,
      ``,
      `Generate the complete implementation NOW. No planning phases, no TODOs, no "you'll need to add" statements.`
    ].join('\n');
    
    return message;
  }

  /**
   * Categorize avoidance patterns for targeted feedback
   */
  private categorizeAvoidancePatterns(avoidancePatterns: string[]): Array<{category: string, patterns: string[]}> {
    const categories = new Map<string, string[]>();
    
    avoidancePatterns.forEach(pattern => {
      if (this.isMockStubPattern(pattern)) {
        this.addToCategory(categories, 'Mock/Stub/Placeholder Usage', pattern);
      } else if (this.isPlanningPattern(pattern)) {
        this.addToCategory(categories, 'Planning Instead of Implementation', pattern);
      } else if (this.isScopeReductionPattern(pattern)) {
        this.addToCategory(categories, 'Scope Reduction', pattern);
      } else if (this.isAnalysisPattern(pattern)) {
        this.addToCategory(categories, 'Analysis Avoidance', pattern);
      } else {
        this.addToCategory(categories, 'General Implementation Avoidance', pattern);
      }
    });
    
    return Array.from(categories.entries()).map(([category, patterns]) => ({ category, patterns }));
  }

  /**
   * Generate specific suggestions based on pattern categories
   */
  private generateSpecificSuggestions(categories: Array<{category: string, patterns: string[]}>, todoContent: string): string[] {
    const suggestions: string[] = [];
    
    categories.forEach(({ category, patterns }) => {
      switch (category) {
        case 'Mock/Stub/Placeholder Usage':
          suggestions.push(
            `• REPLACE all mocks/stubs/placeholders with actual implementation`,
            `• Write real business logic, not temporary functions`,
            `• Implement complete data processing, not dummy returns`
          );
          break;
          
        case 'Planning Instead of Implementation':
          suggestions.push(
            `• STOP planning - write the actual code implementation`,
            `• Convert your architectural ideas into working functions`,
            `• Implement the complete feature, not just the structure`
          );
          break;
          
        case 'Scope Reduction':
          suggestions.push(
            `• IMPLEMENT the full feature scope as requested`,
            `• Don't reduce to "basic" or "simple" versions`,
            `• Include all edge cases and error scenarios`
          );
          break;
          
        case 'Analysis Avoidance':
          suggestions.push(
            `• ANALYZE the actual requirements and implement solutions`,
            `• Research the proper approach AND implement it`,
            `• Provide working code that addresses the real problem`
          );
          break;
          
        default:
          suggestions.push(
            `• Address the specific avoidance: ${patterns.join(', ')}`,
            `• Provide complete, working implementation`
          );
      }
    });
    
    // Add specific suggestions based on TODO content analysis
    if (todoContent.includes('basic') || todoContent.includes('simple')) {
      suggestions.push(`• AVOID "basic" or "simple" implementations - build the full feature`);
    }
    
    if (todoContent.includes('for now')) {
      suggestions.push(`• ELIMINATE "for now" mentality - implement the complete solution`);
    }
    
    if (todoContent.includes('mock') || todoContent.includes('stub')) {
      suggestions.push(`• REPLACE all mocking with real integration and business logic`);
    }
    
    return suggestions;
  }

  // Pattern classification helpers
  private isMockStubPattern(pattern: string): boolean {
    return /mock|stub|placeholder|dummy|fake|skeleton|temporary/.test(pattern.toLowerCase());
  }

  private isPlanningPattern(pattern: string): boolean {
    return /plan|design|architecture|strategy|approach|analyze|research/.test(pattern.toLowerCase());
  }

  private isScopeReductionPattern(pattern: string): boolean {
    return /basic|simple|minimal|quick|for now|just/.test(pattern.toLowerCase());
  }

  private isAnalysisPattern(pattern: string): boolean {
    return /investigate|evaluate|assess|understand|study/.test(pattern.toLowerCase());
  }

  private addToCategory(categories: Map<string, string[]>, category: string, pattern: string): void {
    if (!categories.has(category)) {
      categories.set(category, []);
    }
    categories.get(category)!.push(pattern);
  }
  
  public dispose(): void {
    this.analysisTimeouts.forEach(timeout => clearTimeout(timeout));
    this.analysisTimeouts.clear();
    
    this.fileWatchers.forEach(watcher => {
      try {
        watcher.close();
      } catch (error) {
        console.log(`Error closing conversation watcher: ${error}`);
      }
    });
    console.log('🛑 AI Conversation Quality Watcher stopped');
  }
}
