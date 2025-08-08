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
exports.FileWatcher = void 0;
const vscode = __importStar(require("vscode"));
const PatternDetector_1 = require("../core/PatternDetector");
const NotificationManager_1 = require("../managers/NotificationManager");
const QualityAnalyzer_1 = require("../analyzers/QualityAnalyzer");
const InterventionEngine_1 = require("../analyzers/InterventionEngine");
class FileWatcher {
    constructor(outputChannel) {
        // Analysis tracking
        this.fileAnalysisHistory = new Map();
        this.detectionCount = 0;
        this.aiInterventionCount = 0;
        this.lastAnalysisTime = new Map();
        this.isAnalyzing = false;
        // Configuration
        this.TYPING_DELAY = 2000;
        this.MIN_ANALYSIS_INTERVAL = 1000;
        this.outputChannel = outputChannel;
        this.patternDetector = new PatternDetector_1.PatternDetector();
        this.notificationManager = NotificationManager_1.NotificationManager.getInstance();
        this.qualityAnalyzer = new QualityAnalyzer_1.QualityAnalyzer();
        this.interventionEngine = new InterventionEngine_1.InterventionEngine(outputChannel);
    }
    startMonitoring() {
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
    handleTextChange(event) {
        if (!this.isCodeFile(event.document))
            return;
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        this.typingTimer = setTimeout(() => {
            this.performRealtimeAnalysis(event.document, 'TYPE');
        }, this.TYPING_DELAY);
    }
    async handlePreSave(document) {
        if (!this.isCodeFile(document))
            return [];
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
    handleFileSave(document) {
        if (!this.isCodeFile(document))
            return;
        this.outputChannel.appendLine(`💾 FILE SAVED: ${document.fileName}`);
        setTimeout(() => {
            this.performRealtimeAnalysis(document, 'SAVE');
        }, 500);
    }
    handleFileFocus(document) {
        if (!this.isCodeFile(document))
            return;
        this.performRealtimeAnalysis(document, 'FOCUS');
    }
    async performRealtimeAnalysis(document, triggerType) {
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
    async analyzeDocument(document, triggerType) {
        if (this.isAnalyzing)
            return null;
        this.isAnalyzing = true;
        try {
            const content = document.getText();
            if (!content.trim())
                return null;
            const detectionResult = this.patternDetector.analyzeCode(content);
            this.detectionCount++;
            const analysis = {
                filePath: document.fileName,
                timestamp: Date.now(),
                detectionResult,
                triggerType,
                interventionLevel: this.determineInterventionLevel(detectionResult, triggerType)
            };
            this.storeAnalysisHistory(analysis);
            return analysis;
        }
        catch (error) {
            this.outputChannel.appendLine(`❌ Analysis error: ${error}`);
            return null;
        }
        finally {
            this.isAnalyzing = false;
        }
    }
    async handleQualityDetection(analysis) {
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
    async requestAIFixes() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
        if (analysis && analysis.detectionResult.patterns.length > 0) {
            await this.interventionEngine.requestUserApprovedAIFix(analysis);
        }
        else {
            vscode.window.showInformationMessage('✅ No quality issues detected');
        }
    }
    async analyzeCurrentFile() {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }
        const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
        if (analysis) {
            const report = this.qualityAnalyzer.generateQualityReport(analysis);
            if (report.totalIssues > 0) {
                vscode.window.showInformationMessage(`🔍 Found ${report.totalIssues} issues (${report.criticalCount} critical, ${report.highCount} high)`);
            }
            else {
                vscode.window.showInformationMessage('✅ No quality issues detected');
            }
        }
    }
    async showDetailedQualityReport() {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        const analysis = await this.analyzeDocument(editor.document, 'MANUAL');
        if (analysis) {
            const report = this.qualityAnalyzer.generateQualityReport(analysis);
            const panel = vscode.window.createWebviewPanel('qualityReport', `Quality Report: ${report.file}`, vscode.ViewColumn.Beside, { enableScripts: false });
            panel.webview.html = `<h1>Quality Report</h1><pre>${report.aiInstruction}</pre>`;
        }
    }
    isCodeFile(document) {
        const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs'];
        return codeExtensions.some(ext => document.fileName.endsWith(ext));
    }
    determineInterventionLevel(result, triggerType) {
        if (result.qualityLevel === 'CRITICAL') {
            return triggerType === 'SAVE' ? 'BLOCK' : 'SIGNAL_AI';
        }
        else if (result.qualityLevel === 'POOR' || result.severityScore >= 25) {
            return 'SIGNAL_AI';
        }
        else if (result.severityScore >= 10) {
            return 'WARNING';
        }
        return 'NONE';
    }
    storeAnalysisHistory(analysis) {
        const history = this.fileAnalysisHistory.get(analysis.filePath) || [];
        history.push(analysis);
        if (history.length > 10) {
            history.shift();
        }
        this.fileAnalysisHistory.set(analysis.filePath, history);
    }
    queueWarningNotification(analysis) {
        const fileName = analysis.filePath.split('/').pop() || 'file';
        const notificationData = {
            type: 'tool_bailout',
            patterns: analysis.detectionResult.patterns.map((p) => p.category),
            severity: analysis.detectionResult.qualityLevel,
            description: `Quality issues in ${fileName} - consider requesting AI fixes`
        };
        this.notificationManager.queueNotification(notificationData);
    }
    getStats() {
        return {
            totalDetections: this.detectionCount,
            aiInterventions: this.aiInterventionCount,
            filesMonitored: this.fileAnalysisHistory.size,
            isAnalyzing: this.isAnalyzing
        };
    }
    dispose() {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
        }
        this.fileAnalysisHistory.clear();
        this.lastAnalysisTime.clear();
    }
}
exports.FileWatcher = FileWatcher;
//# sourceMappingURL=FileWatcher.js.map