export interface FileAnalysis {
  filePath: string;
  timestamp: number;
  detectionResult: import('../core/PatternDetector').DetectionResult;
  triggerType: 'SAVE' | 'TYPE' | 'FOCUS' | 'MANUAL';
  interventionLevel: 'NONE' | 'WARNING' | 'SIGNAL_AI' | 'BLOCK';
}

export interface QualityIssue {
  line: number;
  column: number;
  category: 'SECURITY' | 'TYPE_SAFETY' | 'PRODUCTION' | 'IMPLEMENTATION' | 'GENERAL';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  pattern: string;
  problem: string;
  instruction: string;
  example?: {
    current: string;
    suggested: string;
  };
}

export interface QualityIssueReport {
  file: string;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  issues: QualityIssue[];
  aiInstruction: string;
}