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
exports.ConversationAnalyzer = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class ConversationAnalyzer {
    constructor() {
        this.patterns = this.loadPatterns();
    }
    loadPatterns() {
        try {
            const configPath = path.join(__dirname, '..', 'config', 'conversation-patterns.json');
            const configData = fs.readFileSync(configPath, 'utf8');
            return JSON.parse(configData);
        }
        catch (error) {
            console.error('Failed to load conversation patterns:', error);
            return {
                implementationAvoidance: {
                    HIGH: ['analyze existing', 'create mock', 'for now'],
                    MEDIUM: ['add proper error handling', 'enhance for production'],
                    LOW: ['basic implementation', 'simple approach']
                },
                weights: { HIGH: 15, MEDIUM: 10, LOW: 5 },
                interventionThreshold: 25
            };
        }
    }
    analyzeTodoBailoutPatterns(todoContent) {
        const content = todoContent.toLowerCase();
        let score = 0;
        const detectedPatterns = [];
        // Check each severity level
        for (const [severity, patterns] of Object.entries(this.patterns.implementationAvoidance)) {
            for (const pattern of patterns) {
                if (content.includes(pattern.toLowerCase())) {
                    score += this.patterns.weights[severity];
                    detectedPatterns.push(`${severity}: ${pattern}`);
                }
            }
        }
        let finalSeverity;
        if (score >= this.patterns.interventionThreshold) {
            finalSeverity = 'HIGH';
        }
        else if (score >= 15) {
            finalSeverity = 'MEDIUM';
        }
        else {
            finalSeverity = 'LOW';
        }
        return {
            severity: finalSeverity,
            bailoutPatterns: detectedPatterns,
            score
        };
    }
    shouldTriggerIntervention(analysis) {
        return analysis.severity === 'HIGH' && analysis.score >= this.patterns.interventionThreshold;
    }
}
exports.ConversationAnalyzer = ConversationAnalyzer;
//# sourceMappingURL=ConversationAnalyzer.js.map