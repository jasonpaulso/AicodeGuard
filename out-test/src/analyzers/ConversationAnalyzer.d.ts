interface TodoBailoutAnalysis {
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    bailoutPatterns: string[];
    score: number;
}
export declare class ConversationAnalyzer {
    private patterns;
    constructor();
    private loadPatterns;
    analyzeTodoBailoutPatterns(todoContent: string): TodoBailoutAnalysis;
    shouldTriggerIntervention(analysis: TodoBailoutAnalysis): boolean;
}
export {};
