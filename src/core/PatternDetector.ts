export interface PatternMatch {
  category: string;
  pattern: string;
  match: string;
  weight: number;
  source: 'code' | 'terminal';
}

export interface DetectionResult {
  patterns: PatternMatch[];
  severityScore: number;
  qualityLevel: 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
  hasDirectRefusal: boolean;
  hasEducationalDeflection: boolean;
  terminalPatterns: PatternMatch[];
  codePatterns: PatternMatch[];
}

// Enhanced patterns based on research findings
const TERMINAL_PATTERNS = {
  DIRECT_REFUSAL: [
    /I cannot generate code for you/i,
    /would be completing your work/i,
    /learn programming instead/i,
    /I won't write.*code/i,
    /that would be doing your homework/i,
    /cannot.*write.*code.*for.*you/i,
    /won't.*complete.*your.*work/i,
    /ensures you understand the system/i
  ],
  EDUCATIONAL_POSITIONING: [
    /this will help you learn/i,
    /good learning exercise/i,
    /I encourage you to/i,
    /figure out yourself/i,
    /research how to/i,
    /try.*implementing.*yourself/i,
    /learn.*by.*doing/i,
    /educational.*purposes/i,
    /so you can maintain it properly/i
  ],
  COMPLEXITY_AVOIDANCE: [
    /this is quite complex/i,
    /would require significant/i,
    /beyond the scope/i,
    /too complicated to/i,
    /challenging to implement/i,
    /quite.*complex.*to/i,
    /very.*difficult.*to/i,
    /extremely.*complex/i
  ],
  SCOPE_REDUCTION: [
    /let me provide a simpler/i,
    /here's a basic/i,
    /starting with a simple/i,
    /minimal implementation/i,
    /let.*me.*simplify/i,
    /I'll.*simplify/i,
    /simplified.*version/i,
    /basic.*approach/i,
    /simple.*solution/i,
    /rough.*implementation/i,
    /skeleton.*code/i,
    /placeholder.*implementation/i
  ],
  SIMPLIFICATION_LANGUAGE: [
    /simpl(e|er|ify|ified)/i,  // Catches: simple, simpler, simplify, simplified
    /basic.*approach/i,
    /minimal.*version/i,
    /rough.*sketch/i,
    /quick.*example/i,
    /straightforward.*way/i,
    /easy.*solution/i,
    /light.*implementation/i,
    /stripped.*down/i,
    /bare.*bones/i,
    /proof.*of.*concept/i,
    /for brevity/i,
    /to keep it simple/i
  ],
  RESPONSIBILITY_TRANSFER: [
    /you'll need to add/i,
    /adapt this to your/i,
    /depending on your requirements/i,
    /you should implement/i,
    /left as an exercise/i,
    /you.*will.*need.*to/i,
    /up.*to.*you.*to/i,
    /your.*responsibility.*to/i,
    /you.*can.*extend/i,
    /feel.*free.*to.*modify/i,
    /you'll need to add proper error handling/i,
    /adapt.*to.*your.*specific.*use case/i
  ],
  // NEW: Research pattern weights
  CONTEXT_DEFLECTION: [
    /without understanding your broader architecture/i,
    /insufficient context/i,
    /can only provide.*basic example/i,
    /depends on your specific/i,
    /need more information about/i,
    /unclear about your requirements/i,
    /without seeing your full/i,
    /varies by implementation/i,
    /specific to your use case/i,
    /hard to say without/i,
    /would need more details/i
  ],
  PRODUCTION_DEFLECTION: [
    /for production use/i,
    /you'll want to enhance this/i,
    /adapt.*to.*your.*specific/i,
    /production-ready.*requires/i,
    /you should enhance this for production/i,
    /this is not production ready/i,
    /not production ready/i,
    /you'll probably need to/i,
    /may require adjustments/i,
    /should work in most cases/i,
    /consider this a starting point/i
  ],
  PLANNING_LANGUAGE: [
    /careful planning/i,
    /step-by-step approach/i,
    /break.*down.*into.*phases/i,
    /analyze.*before.*implementing/i,
    /plan implementation/i,
    /design architecture/i,
    /preliminary analysis/i
  ],
  // NEW: Subagent patterns (modern AI workflows)
  SUBAGENT_DELEGATION: [
    /creating.*subagent/i,
    /delegating to.*agent/i,
    /spawning.*helper/i,
    /using.*specialized agent/i,
    /sub-task.*assigned/i,
    /breaking this into.*agents/i,
    /routing to.*specialist/i,
    /coordinating with.*subagent/i
  ],
  SUBAGENT_BAILOUTS: [
    /subagent.*couldn['']t complete/i,
    /delegated agent.*simplified/i,
    /sub-task.*too complex/i,
    /specialist.*provided basic/i,
    /helper.*partial implementation/i,
    /coordinator.*reduced scope/i
  ],
  // NEW: Time/quality excuses
  TIME_EXCUSES: [
    /for the sake of time/i,
    /to keep this brief/i,
    /in the interest of brevity/i,
    /due to space constraints/i,
    /to save time/i,
    /quickly thrown together/i,
    /rushed implementation/i
  ],
  PROGRESS_STALLING: [
    /let me think about this/i,
    /this is tricky/i,
    /hmm, this might be/i,
    /actually, let me/i,
    /on second thought/i,
    /perhaps a different approach/i,
    /maybe we should/i,
    /alternatively/i
  ]
};

const CODE_PATTERNS = {
  SECURITY_ISSUES: [
    /eval\(/g,
    /innerHTML\s*=/g,
    /document\.write/g,
    /dangerouslySetInnerHTML/
  ],
  TYPESCRIPT_BAILOUTS: [
    /as any/g,
    /@ts-ignore/g,
    /:\s*any[^a-zA-Z]/g,
    /Function\(\)/g,
    /any\[\]/g,
    /Record<string,\s*any>/g
  ],
  PRODUCTION_ISSUES: [
    /console\.log/g,
    /console\.warn/g,
    /debugger;/g,
    /alert\(/g,
    /TODO:/i,
    /FIXME:/i,
    /HACK:/i
  ],
  CODE_QUALITY_ISSUES: [
    /placeholder/i,
    /stub.*function/i,
    /mock.*implementation/i,
    /temporary.*solution/i,
    /quick.*fix/i,
    /not.*implemented/i,
    /TODO.*implement/i,
    /empty.*implementation/i
  ]
};

const TERMINAL_PATTERN_WEIGHTS = {
  DIRECT_REFUSAL: 25,
  EDUCATIONAL_POSITIONING: 20,
  SUBAGENT_BAILOUTS: 18,        // Subagent delegation failures
  COMPLEXITY_AVOIDANCE: 15,
  SCOPE_REDUCTION: 12,
  SUBAGENT_DELEGATION: 12,      // Potentially problematic delegation
  SIMPLIFICATION_LANGUAGE: 10,
  RESPONSIBILITY_TRANSFER: 8,
  // NEW: Research pattern weights
  CONTEXT_DEFLECTION: 22,
  PRODUCTION_DEFLECTION: 18,
  PLANNING_LANGUAGE: 15,
  TIME_EXCUSES: 5,              // Justifying shortcuts
  PROGRESS_STALLING: 4          // Hesitation patterns
};

const CODE_PATTERN_WEIGHTS = {
  SECURITY_ISSUES: 20,
  TYPESCRIPT_BAILOUTS: 15,
  PRODUCTION_ISSUES: 10,
  CODE_QUALITY_ISSUES: 8
};

export class PatternDetector {
  private static readonly QUALITY_THRESHOLDS = {
    EXCELLENT: 0,
    GOOD: 5,
    ACCEPTABLE: 15,
    POOR: 30,
    CRITICAL: 50
  };

  public detectPatterns(text: string, source: 'code' | 'terminal' | 'file' | 'auto' = 'auto'): DetectionResult {
    const detectedPatterns: PatternMatch[] = [];
    let severityScore = 0;

    const shouldCheckTerminal = source === 'terminal' || source === 'auto';
    const shouldCheckCode = source === 'code' || source === 'file' || source === 'terminal' || source === 'auto';

    if (shouldCheckTerminal) {
      Object.entries(TERMINAL_PATTERNS).forEach(([category, patterns]) => {
        patterns.forEach((pattern: RegExp) => {
          const matches = text.match(pattern);
          if (matches) {
            const weight = (TERMINAL_PATTERN_WEIGHTS as any)[category] || 3;
            detectedPatterns.push({
              category,
              pattern: pattern.source,
              match: matches[0],
              weight,
              source: 'terminal'
            });
            severityScore += weight;
          }
        });
      });
    }

    if (shouldCheckCode) {
      Object.entries(CODE_PATTERNS).forEach(([category, patterns]) => {
        patterns.forEach((pattern: RegExp) => {
          const matches = text.match(pattern);
          if (matches) {
            const weight = (CODE_PATTERN_WEIGHTS as any)[category] || 3;
            detectedPatterns.push({
              category,
              pattern: pattern.source,
              match: matches[0],
              weight,
              source: 'code'
            });
            severityScore += weight;
          }
        });
      });
    }

    const terminalPatterns = detectedPatterns.filter(p => p.source === 'terminal');
    const codePatterns = detectedPatterns.filter(p => p.source === 'code');

    if (detectedPatterns.length >= 3) {
      severityScore += 10;
    }

    const hasEducationalDeflection = terminalPatterns.some(p => p.category === 'EDUCATIONAL_POSITIONING');
    if (hasEducationalDeflection) {
      severityScore += 10;
    }

    const hasDirectRefusal = terminalPatterns.some(p => p.category === 'DIRECT_REFUSAL');
    const qualityLevel = this.calculateQualityLevel(severityScore);

    return {
      patterns: detectedPatterns,
      severityScore,
      qualityLevel,
      hasDirectRefusal,
      hasEducationalDeflection,
      terminalPatterns,
      codePatterns
    };
  }

  public hasDirectRefusal(text: string): boolean {
    return TERMINAL_PATTERNS.DIRECT_REFUSAL.some((pattern: RegExp) => pattern.test(text));
  }

  public hasEducationalPositioning(text: string): boolean {
    return TERMINAL_PATTERNS.EDUCATIONAL_POSITIONING.some((pattern: RegExp) => pattern.test(text));
  }

  public hasSecurityIssues(text: string): boolean {
    return CODE_PATTERNS.SECURITY_ISSUES.some((pattern: RegExp) => pattern.test(text));
  }

  public hasTypeScriptBailouts(text: string): boolean {
    return CODE_PATTERNS.TYPESCRIPT_BAILOUTS.some((pattern: RegExp) => pattern.test(text));
  }

  private calculateQualityLevel(severityScore: number): DetectionResult['qualityLevel'] {
    if (severityScore >= PatternDetector.QUALITY_THRESHOLDS.CRITICAL) return 'CRITICAL';
    if (severityScore >= PatternDetector.QUALITY_THRESHOLDS.POOR) return 'POOR';
    if (severityScore >= PatternDetector.QUALITY_THRESHOLDS.ACCEPTABLE) return 'ACCEPTABLE';
    if (severityScore >= PatternDetector.QUALITY_THRESHOLDS.GOOD) return 'GOOD';
    return 'EXCELLENT';
  }

  public getPatternStats(): { terminalPatterns: number; codePatterns: number } {
    const terminalCount = Object.values(TERMINAL_PATTERNS).flat().length;
    const codeCount = Object.values(CODE_PATTERNS).flat().length;
    
    return {
      terminalPatterns: terminalCount,
      codePatterns: codeCount
    };
  }
}