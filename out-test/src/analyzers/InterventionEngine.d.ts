import * as vscode from 'vscode';
import { FileAnalysis, QualityIssueReport } from '../types/common';
export declare class InterventionEngine {
    private qualityAnalyzer;
    private outputChannel;
    private aiInterventionActive;
    private lastAIInterventionTime;
    constructor(outputChannel: vscode.OutputChannel);
    shouldTriggerAIIntervention(analysis: FileAnalysis): boolean;
    performAutomaticAIIntervention(analysis: FileAnalysis): Promise<void>;
    requestUserApprovedAIFix(analysis: FileAnalysis): Promise<void>;
    showCriticalIssuesBlock(report: QualityIssueReport): Promise<void>;
    private sendAICorrection;
    private showDetailedQualityReport;
    private generateDetailedReportMarkdown;
}
