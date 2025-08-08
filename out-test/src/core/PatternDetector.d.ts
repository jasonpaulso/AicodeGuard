export interface PatternMatch {
    category: string;
    pattern: string;
    match: string;
    weight: number;
    source: 'code' | 'terminal';
}
export type QualityLevel = 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
export interface PatternMatch {
    category: string;
    match: string;
    pattern: string;
    weight: number;
    source: 'terminal' | 'code';
}
export interface DetectionResult {
    qualityLevel: QualityLevel;
    score: number;
    patterns: PatternMatch[];
}
export declare class PatternDetector {
    private patternConfig;
    private terminalPatterns;
    private codePatterns;
    constructor();
    private loadPatterns;
    private createRegexPatterns;
    analyzeText(text: string): DetectionResult;
    analyzeCode(code: string): DetectionResult;
    private buildDetectionResult;
}
