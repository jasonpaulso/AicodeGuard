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
exports.PatternDetector = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class PatternDetector {
    constructor() {
        this.patternConfig = this.loadPatterns();
        this.terminalPatterns = this.createRegexPatterns('terminal');
        this.codePatterns = this.createRegexPatterns('code');
    }
    loadPatterns() {
        try {
            const configPath = path.join(__dirname, '..', 'config', 'patterns.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
        catch (error) {
            console.error('Failed to load pattern configuration:', error);
            return {
                terminal: {
                    DIRECT_REFUSAL: ['I cannot generate code for you'],
                    EDUCATIONAL_POSITIONING: ['this will help you learn']
                },
                code: {
                    SECURITY_ISSUES: ['eval\\s*\\('],
                    TYPESCRIPT_BAILOUTS: [':\\s*any']
                },
                weights: {
                    DIRECT_REFUSAL: 20,
                    EDUCATIONAL_POSITIONING: 15,
                    SECURITY_ISSUES: 25,
                    TYPESCRIPT_BAILOUTS: 15
                }
            };
        }
    }
    createRegexPatterns(category) {
        const patterns = {};
        const categoryPatterns = this.patternConfig[category];
        for (const [key, stringPatterns] of Object.entries(categoryPatterns)) {
            patterns[key] = stringPatterns.map(pattern => new RegExp(pattern, 'i'));
        }
        return patterns;
    }
    analyzeText(text) {
        const allPatterns = [];
        // Analyze terminal patterns
        for (const [category, regexArray] of Object.entries(this.terminalPatterns)) {
            for (const regex of regexArray) {
                const match = text.match(regex);
                if (match) {
                    allPatterns.push({
                        category,
                        pattern: regex.source,
                        match: match[0],
                        weight: this.patternConfig.weights[category] || 1,
                        source: 'terminal'
                    });
                }
            }
        }
        // Analyze code patterns
        for (const [category, regexArray] of Object.entries(this.codePatterns)) {
            for (const regex of regexArray) {
                const match = text.match(regex);
                if (match) {
                    allPatterns.push({
                        category,
                        pattern: regex.source,
                        match: match[0],
                        weight: this.patternConfig.weights[category] || 1,
                        source: 'code'
                    });
                }
            }
        }
        return this.buildDetectionResult(allPatterns);
    }
    analyzeCode(code) {
        const codePatterns = [];
        for (const [category, regexArray] of Object.entries(this.codePatterns)) {
            for (const regex of regexArray) {
                const match = code.match(regex);
                if (match) {
                    codePatterns.push({
                        category,
                        pattern: regex.source,
                        match: match[0],
                        weight: this.patternConfig.weights[category] || 1,
                        source: 'code'
                    });
                }
            }
        }
        return this.buildDetectionResult(codePatterns);
    }
    buildDetectionResult(patterns) {
        const severityScore = patterns.reduce((sum, p) => sum + p.weight, 0);
        const terminalPatterns = patterns.filter(p => p.source === 'terminal');
        const codePatterns = patterns.filter(p => p.source === 'code');
        const hasDirectRefusal = terminalPatterns.some(p => p.category === 'DIRECT_REFUSAL');
        const hasEducationalDeflection = terminalPatterns.some(p => p.category === 'EDUCATIONAL_POSITIONING');
        let qualityLevel;
        if (severityScore >= 50) {
            qualityLevel = 'CRITICAL';
        }
        else if (severityScore >= 30) {
            qualityLevel = 'POOR';
        }
        else if (severityScore >= 15) {
            qualityLevel = 'ACCEPTABLE';
        }
        else if (severityScore >= 5) {
            qualityLevel = 'GOOD';
        }
        else {
            qualityLevel = 'EXCELLENT';
        }
        return {
            patterns,
            severityScore,
            qualityLevel,
            hasDirectRefusal,
            hasEducationalDeflection,
            terminalPatterns,
            codePatterns
        };
    }
}
exports.PatternDetector = PatternDetector;
//# sourceMappingURL=PatternDetector.js.map