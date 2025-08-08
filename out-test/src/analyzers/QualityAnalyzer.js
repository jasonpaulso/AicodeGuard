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
exports.QualityAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
class QualityAnalyzer {
    generateQualityReport(analysis) {
        const fileName = analysis.filePath.split('/').pop() || 'Unknown';
        const issues = this.extractDetailedIssues(analysis);
        const criticalCount = issues.filter(i => i.severity === 'CRITICAL').length;
        const highCount = issues.filter(i => i.severity === 'HIGH').length;
        return {
            file: fileName,
            totalIssues: issues.length,
            criticalCount,
            highCount,
            issues,
            aiInstruction: this.buildAIInstruction(issues, fileName)
        };
    }
    extractDetailedIssues(analysis) {
        const issues = [];
        const content = vscode.window.activeTextEditor?.document.getText() || '';
        const lines = content.split('\n');
        analysis.detectionResult.patterns.forEach(pattern => {
            const lineIndex = lines.findIndex(line => line.includes(pattern.match));
            const line = lineIndex >= 0 ? lineIndex + 1 : 1;
            const column = lineIndex >= 0 ? lines[lineIndex].indexOf(pattern.match) + 1 : 1;
            const issue = this.createIssueFromPattern(pattern.category, pattern.match, line, column);
            issues.push(issue);
        });
        return issues;
    }
    createIssueFromPattern(category, match, line, column) {
        const issueStrategies = {
            'SECURITY_ISSUES': () => ({
                line, column,
                category: 'SECURITY',
                severity: 'CRITICAL',
                pattern: match,
                problem: 'Security vulnerability detected - code execution risk',
                instruction: 'Replace with secure alternative that validates and sanitizes input',
                example: {
                    current: match,
                    suggested: match.includes('eval') ? 'JSON.parse(validatedInput)' : 'Use parameterized queries'
                }
            }),
            'TYPESCRIPT_BAILOUTS': () => ({
                line, column,
                category: 'TYPE_SAFETY',
                severity: 'HIGH',
                pattern: match,
                problem: 'Type safety violation - bypasses TypeScript checking',
                instruction: 'Define proper interface and use specific typing instead of any',
                example: {
                    current: match,
                    suggested: 'Define: interface ApiResponse { data: T[]; status: string; }'
                }
            }),
            'PRODUCTION_ISSUES': () => ({
                line, column,
                category: 'PRODUCTION',
                severity: 'MEDIUM',
                pattern: match,
                problem: 'Debug code in production - not suitable for deployment',
                instruction: 'Remove debug statements and replace with proper logging',
                example: {
                    current: match,
                    suggested: match.includes('console') ? 'logger.debug(...)' : 'Remove debugger statements'
                }
            }),
            'CODE_QUALITY_ISSUES': () => ({
                line, column,
                category: 'IMPLEMENTATION',
                severity: 'MEDIUM',
                pattern: match,
                problem: 'Incomplete implementation - placeholder code detected',
                instruction: 'Complete the implementation with proper business logic and error handling',
                example: {
                    current: match,
                    suggested: 'Implement full functionality with try/catch error handling'
                }
            })
        };
        const strategy = issueStrategies[category];
        if (strategy) {
            return strategy();
        }
        return {
            line, column,
            category: 'GENERAL',
            severity: 'LOW',
            pattern: match,
            problem: 'Code quality issue detected',
            instruction: 'Review and improve following best practices'
        };
    }
    buildAIInstruction(issues, fileName) {
        const critical = issues.filter(i => i.severity === 'CRITICAL');
        const high = issues.filter(i => i.severity === 'HIGH');
        const medium = issues.filter(i => i.severity === 'MEDIUM');
        let instruction = `CODE QUALITY ISSUES DETECTED in ${fileName}:\n\n`;
        instruction += this.formatIssueSection('🚨 CRITICAL SECURITY ISSUES', critical, true);
        instruction += this.formatIssueSection('⚠️ HIGH PRIORITY ISSUES', high, false);
        instruction += this.formatIssueSection('📋 MEDIUM PRIORITY ISSUES', medium, false);
        instruction += 'Please rewrite the affected sections with production-ready code that follows security and quality best practices.';
        return instruction;
    }
    formatIssueSection(title, issues, includeDetails) {
        if (issues.length === 0)
            return '';
        let section = `${title} (${issues.length}):\n`;
        issues.forEach(issue => {
            section += `Line ${issue.line}: ${issue.problem}\n`;
            if (includeDetails) {
                section += `Required: ${issue.instruction}\n`;
                if (issue.example) {
                    section += `Current: ${issue.example.current}\n`;
                    section += `Suggested: ${issue.example.suggested}\n`;
                }
            }
            else {
                section += `${issue.category} - ${issue.instruction}\n`;
            }
        });
        return section + '\n';
    }
}
exports.QualityAnalyzer = QualityAnalyzer;
//# sourceMappingURL=QualityAnalyzer.js.map