import { FileAnalysis, QualityIssue, QualityIssueReport } from '../types/common';
export declare class QualityAnalyzer {
    generateQualityReport(analysis: FileAnalysis): QualityIssueReport;
    extractDetailedIssues(analysis: FileAnalysis): QualityIssue[];
    private createIssueFromPattern;
    buildAIInstruction(issues: QualityIssue[], fileName: string): string;
    private formatIssueSection;
}
