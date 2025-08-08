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
exports.InterventionEngine = void 0;
const vscode = __importStar(require("vscode"));
const QualityAnalyzer_1 = require("./QualityAnalyzer");
class InterventionEngine {
    constructor(outputChannel) {
        this.aiInterventionActive = false;
        this.lastAIInterventionTime = 0;
        this.outputChannel = outputChannel;
        this.qualityAnalyzer = new QualityAnalyzer_1.QualityAnalyzer();
    }
    shouldTriggerAIIntervention(analysis) {
        if (this.aiInterventionActive) {
            return false;
        }
        const cooldownPeriod = 30000; // 30 seconds
        if (Date.now() - this.lastAIInterventionTime < cooldownPeriod) {
            return false;
        }
        if (!vscode.window.activeTerminal) {
            return false;
        }
        return analysis.detectionResult.qualityLevel === 'CRITICAL';
    }
    async performAutomaticAIIntervention(analysis) {
        this.aiInterventionActive = true;
        this.lastAIInterventionTime = Date.now();
        try {
            const report = this.qualityAnalyzer.generateQualityReport(analysis);
            await this.sendAICorrection(report);
            setTimeout(() => {
                this.aiInterventionActive = false;
            }, 5000);
        }
        catch (error) {
            this.outputChannel.appendLine(`❌ AI intervention failed: ${error}`);
            this.aiInterventionActive = false;
        }
    }
    async requestUserApprovedAIFix(analysis) {
        const report = this.qualityAnalyzer.generateQualityReport(analysis);
        const action = await vscode.window.showWarningMessage(`🔍 ${report.totalIssues} quality issues found in ${report.file}`, 'Request AI Fix', 'Show Details', 'Ignore');
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
    async showCriticalIssuesBlock(report) {
        const message = `🚨 CRITICAL CODE ISSUES (${report.criticalCount}) - Save blocked until fixed`;
        const action = await vscode.window.showErrorMessage(message, { modal: true }, 'Request AI Fix', 'Show Details');
        if (action === 'Request AI Fix') {
            await this.sendAICorrection(report);
        }
        else if (action === 'Show Details') {
            await this.showDetailedQualityReport(report);
        }
    }
    async sendAICorrection(report) {
        this.outputChannel.appendLine(`🤖 SENDING AI CORRECTION REQUEST for ${report.file}`);
        this.outputChannel.appendLine(report.aiInstruction);
        const terminal = vscode.window.activeTerminal;
        if (terminal) {
            terminal.sendText(`# AI Quality Issue Report for ${report.file}`, true);
            terminal.sendText(`echo "${report.aiInstruction.replace(/"/g, '\\"')}"`, true);
            terminal.show();
        }
        vscode.window.showInformationMessage(`🤖 AI correction requested for ${report.totalIssues} issues`);
    }
    async showDetailedQualityReport(report) {
        const panel = vscode.window.createWebviewPanel('qualityReport', `Quality Report: ${report.file}`, vscode.ViewColumn.Beside, { enableScripts: false });
        panel.webview.html = this.generateDetailedReportMarkdown(report);
    }
    generateDetailedReportMarkdown(report) {
        return `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
        .critical { background: #ffe6e6; border-left: 4px solid #ff4444; }
        .high { background: #fff4e6; border-left: 4px solid #ff8800; }
        .medium { background: #e6f3ff; border-left: 4px solid #0088ff; }
        .issue { margin: 10px 0; padding: 15px; border-radius: 5px; }
        .line { font-weight: bold; color: #666; }
    </style>
</head>
<body>
    <h1>🔍 Quality Report: ${report.file}</h1>
    <p><strong>Total Issues:</strong> ${report.totalIssues} (Critical: ${report.criticalCount}, High: ${report.highCount})</p>
    
    ${report.issues.map(issue => `
        <div class="issue ${issue.severity.toLowerCase()}">
            <div class="line">Line ${issue.line}: ${issue.category}</div>
            <p><strong>Problem:</strong> ${issue.problem}</p>
            <p><strong>Solution:</strong> ${issue.instruction}</p>
            ${issue.example ? `
                <p><strong>Current:</strong> <code>${issue.example.current}</code></p>
                <p><strong>Suggested:</strong> <code>${issue.example.suggested}</code></p>
            ` : ''}
        </div>
    `).join('')}
</body>
</html>`;
    }
}
exports.InterventionEngine = InterventionEngine;
//# sourceMappingURL=InterventionEngine.js.map