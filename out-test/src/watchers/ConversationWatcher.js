"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConversationWatcher = void 0;
const vscode = __importStar(require("vscode"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const NotificationManager_1 = require("../managers/NotificationManager");
const ConversationAnalyzer_1 = require("../analyzers/ConversationAnalyzer");
class ConversationWatcher {
    constructor() {
        this.fileWatchers = [];
        this.lastAnalyzedMessageCount = new Map();
        this.analysisTimeouts = new Map();
        // Prevent multiple interventions for the same session
        this.interventionActive = false;
        this.lastInterventionTime = 0;
        this.INTERVENTION_COOLDOWN = 60000; // 1 minute
        this.projectsPath = path.join(os.homedir(), 'Projects');
        this.notificationManager = NotificationManager_1.NotificationManager.getInstance();
        this.conversationAnalyzer = new ConversationAnalyzer_1.ConversationAnalyzer();
    }
    async startWatching() {
        if (!fs.existsSync(this.projectsPath)) {
            console.log(`📂 Projects directory not found: ${this.projectsPath}`);
            return;
        }
        await this.findAndWatchProjects();
    }
    async findAndWatchProjects() {
        try {
            const entries = fs.readdirSync(this.projectsPath);
            for (const entry of entries) {
                const projectPath = path.join(this.projectsPath, entry);
                const todoPath = path.join(projectPath, 'TODO.claude.md');
                if (fs.existsSync(todoPath)) {
                    this.watchTodoFile(todoPath);
                }
            }
        }
        catch (error) {
            console.error('Error finding projects:', error);
        }
    }
    watchTodoFile(filePath) {
        try {
            const watcher = fs.watch(filePath, (eventType) => {
                if (eventType === 'change') {
                    this.scheduleTodoAnalysis(filePath);
                }
            });
            this.fileWatchers.push(watcher);
            // Initial analysis
            this.scheduleTodoAnalysis(filePath);
        }
        catch (error) {
            console.error(`Error watching file ${filePath}:`, error);
        }
    }
    scheduleTodoAnalysis(filePath) {
        // Clear existing timeout for this file
        if (this.analysisTimeouts.has(filePath)) {
            clearTimeout(this.analysisTimeouts.get(filePath));
        }
        // Schedule new analysis after a brief delay
        const timeout = setTimeout(() => {
            this.analyzeTodoFile(filePath);
        }, 2000);
        this.analysisTimeouts.set(filePath, timeout);
    }
    async analyzeTodoFile(filePath) {
        try {
            if (!fs.existsSync(filePath))
                return;
            const content = fs.readFileSync(filePath, 'utf8');
            const messages = this.extractMessages(content);
            // Skip analysis if no new messages
            const currentMessageCount = messages.length;
            const lastCount = this.lastAnalyzedMessageCount.get(filePath) || 0;
            if (currentMessageCount <= lastCount)
                return;
            this.lastAnalyzedMessageCount.set(filePath, currentMessageCount);
            // Analyze recent messages for implementation avoidance
            const recentMessages = messages.slice(lastCount);
            const recentContent = recentMessages.join('\n');
            const analysis = this.conversationAnalyzer.analyzeTodoBailoutPatterns(recentContent);
            if (this.conversationAnalyzer.shouldTriggerIntervention(analysis) && this.canIntervene()) {
                await this.triggerIntervention(filePath, analysis);
            }
        }
        catch (error) {
            console.error(`Error analyzing TODO file ${filePath}:`, error);
        }
    }
    extractMessages(content) {
        // Simple message extraction - split by common patterns
        const messagePatterns = [
            /^##\s+/gm, // H2 headers
            /^###\s+/gm, // H3 headers
            /^\*\s+/gm, // Bullet points
            /^-\s+/gm, // Dash points
            /^\d+\.\s+/gm // Numbered lists
        ];
        let messages = [content];
        for (const pattern of messagePatterns) {
            const newMessages = [];
            for (const message of messages) {
                newMessages.push(...message.split(pattern));
            }
            messages = newMessages.filter(m => m.trim().length > 0);
        }
        return messages;
    }
    canIntervene() {
        if (this.interventionActive)
            return false;
        const timeSinceLastIntervention = Date.now() - this.lastInterventionTime;
        return timeSinceLastIntervention >= this.INTERVENTION_COOLDOWN;
    }
    async triggerIntervention(filePath, analysis) {
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
            const action = await vscode.window.showWarningMessage(message, 'Show Details', 'Ignore', 'Stop Monitoring');
            if (action === 'Show Details') {
                this.showAnalysisDetails(filePath, analysis);
            }
            else if (action === 'Stop Monitoring') {
                this.stopWatchingFile(filePath);
            }
        }
        finally {
            setTimeout(() => {
                this.interventionActive = false;
            }, 5000);
        }
    }
    showAnalysisDetails(filePath, analysis) {
        const projectName = path.basename(path.dirname(filePath));
        const details = `
# Implementation Avoidance Analysis - ${projectName}

**Severity:** ${analysis.severity}  
**Score:** ${analysis.score}/100

## Detected Patterns:
${analysis.bailoutPatterns.map((p) => `- ${p}`).join('\n')}

## Recommendation:
Consider requesting specific implementation instead of planning or mock code.
    `;
        const panel = vscode.window.createWebviewPanel('conversationAnalysis', `Conversation Analysis - ${projectName}`, vscode.ViewColumn.Beside, { enableScripts: false });
        panel.webview.html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 20px;">
        <pre>${details}</pre>
      </body>
      </html>
    `;
    }
    stopWatchingFile(filePath) {
        // Remove from analysis tracking
        this.lastAnalyzedMessageCount.delete(filePath);
        // Clear timeout
        if (this.analysisTimeouts.has(filePath)) {
            clearTimeout(this.analysisTimeouts.get(filePath));
            this.analysisTimeouts.delete(filePath);
        }
        // Note: We don't remove the file watcher here as it's referenced by path
        // The watcher will be cleaned up when dispose() is called
    }
    dispose() {
        // Close all file watchers
        this.fileWatchers.forEach(watcher => {
            try {
                watcher.close();
            }
            catch (error) {
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
    getStats() {
        return {
            watchedFiles: this.fileWatchers.length,
            trackedFiles: this.lastAnalyzedMessageCount.size,
            interventionActive: this.interventionActive,
            lastInterventionTime: this.lastInterventionTime
        };
    }
}
exports.ConversationWatcher = ConversationWatcher;
//# sourceMappingURL=ConversationWatcher.js.map