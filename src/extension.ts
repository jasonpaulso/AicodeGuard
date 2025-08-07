import * as vscode from 'vscode';

// Research-backed bailout patterns
const BAILOUT_PATTERNS = {
    // Linguistic Deflection Patterns
    SIMPLIFICATION_LANGUAGE: [
        /simpler approach/i,
        /let['']s simplify/i,
        /basic implementation/i,
        /minimal implementation/i,
        /simplified version/i,
        /starting point/i,
        /for brevity/i,
        /to keep it simple/i,
        /straightforward approach/i,
        /quick example/i,
        /rough implementation/i
    ],

    // Responsibility Transfer Patterns
    RESPONSIBILITY_TRANSFER: [
        /you['']ll need to add/i,
        /adapt this to your/i,
        /depending on your requirements/i,
        /without understanding your/i,
        /you should implement/i,
        /left as an exercise/i,
        /specific to your use case/i,
        /you may want to/i,
        /consider adding/i,
        /might need to adjust/i
    ],

    // TypeScript/JavaScript Anti-patterns
    TYPESCRIPT_BAILOUTS: [
        /as any/g,
        /: any\s*[=;]/g,
        /any\[\]/g,
        /Record<string, any>/g,
        /\[key: string\]: any/g,
    ],

    // Code Quality Red Flags
    CODE_QUALITY_ISSUES: [
        /TODO.*implement/i,
        /FIXME/i,
        /placeholder/i,
        /stub.*function/i,
        /mock.*implementation/i,
        /console\.log\(/g,
        /return \{\}/g,
        /return \[\]/g,
    ],

    // Security Red Flags
    SECURITY_ISSUES: [
        /eval\(/g,
        /innerHTML\s*=/g,
        /localStorage\.setItem.*password/i,
        /sessionStorage\.setItem.*token/i
    ]
};

class BailoutMonitor {
    private outputBuffer: string = '';
    private detectionCount: number = 0;
    private isEnabled: boolean = true;

    analyzeTerminalOutput(data: string) {
        if (!this.isEnabled) return;

        this.outputBuffer += data;
        
        const detectedPatterns: Array<{category: string, pattern: string, matches: number}> = [];
        let severityScore = 0;

        // Check each pattern category
        Object.entries(BAILOUT_PATTERNS).forEach(([category, patterns]) => {
            patterns.forEach(pattern => {
                const matches = this.outputBuffer.match(pattern);
                if (matches) {
                    const weight = this.getPatternWeight(category);
                    detectedPatterns.push({
                        category,
                        pattern: pattern.source,
                        matches: matches.length
                    });
                    severityScore += weight * matches.length;
                }
            });
        });

        // Trigger warning if patterns detected
        if (detectedPatterns.length > 0 && severityScore >= 5) {
            this.detectionCount++;
            this.showBailoutWarning(detectedPatterns, severityScore);
        }

        // Keep buffer manageable
        if (this.outputBuffer.length > 10000) {
            this.outputBuffer = this.outputBuffer.slice(-5000);
        }
    }

    private getPatternWeight(category: string): number {
        const weights: Record<string, number> = {
            'SECURITY_ISSUES': 15,
            'TYPESCRIPT_BAILOUTS': 10,
            'CODE_QUALITY_ISSUES': 8,
            'RESPONSIBILITY_TRANSFER': 6,
            'SIMPLIFICATION_LANGUAGE': 5
        };
        return weights[category] || 3;
    }

    private showBailoutWarning(patterns: Array<{category: string, pattern: string, matches: number}>, severity: number) {
        const message = `🚫 AI Bailout Detected! Severity: ${severity} | Patterns: ${patterns.length}`;
        
        vscode.window.showWarningMessage(
            message,
            'Show Details',
            'Disable Monitoring'
        ).then(selection => {
            if (selection === 'Show Details') {
                this.showDetailedReport(patterns, severity);
            } else if (selection === 'Disable Monitoring') {
                this.isEnabled = false;
                vscode.window.showInformationMessage('Bailout monitoring disabled');
            }
        });

        // Log to output channel
        this.logDetection(patterns, severity);
    }

    private showDetailedReport(patterns: Array<{category: string, pattern: string, matches: number}>, severity: number) {
        const report = [
            `🚫 BAILOUT DETECTION REPORT`,
            ``,
            `Severity Score: ${severity}/100`,
            `Detection Count: ${this.detectionCount}`,
            ``,
            `Detected Patterns:`,
            ...patterns.map(p => `  • ${p.category}: /${p.pattern}/ (${p.matches} matches)`),
            ``,
            `Research shows AI coding tools produce correct code only 46-65% of the time.`,
            `This detection is based on patterns consistent with complexity avoidance.`
        ].join('\n');

        vscode.workspace.openTextDocument({
            content: report,
            language: 'plaintext'
        }).then(doc => {
            vscode.window.showTextDocument(doc);
        });
    }

    private logDetection(patterns: Array<{category: string, pattern: string, matches: number}>, severity: number) {
        const timestamp = new Date().toISOString();
        const logEntry = `${timestamp} | Severity: ${severity} | Patterns: ${patterns.length} | Count: ${this.detectionCount}`;
        console.log('Claude Bailout Monitor:', logEntry);
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
    }

    getStats() {
        return {
            detectionCount: this.detectionCount,
            enabled: this.isEnabled
        };
    }
}

let bailoutMonitor: BailoutMonitor;

export function activate(context: vscode.ExtensionContext) {
    console.log('🚀 Claude Bailout Monitor is now active!');
    
    bailoutMonitor = new BailoutMonitor();

    // Monitor terminal data
    const terminalDataDisposable = vscode.window.onDidWriteTerminalData(e => {
        bailoutMonitor.analyzeTerminalOutput(e.data);
    });

    // Register commands
    const enableCommand = vscode.commands.registerCommand('claudeBailoutMonitor.enable', () => {
        bailoutMonitor.enable();
        vscode.window.showInformationMessage('🚀 Claude Bailout Monitor enabled!');
    });

    const disableCommand = vscode.commands.registerCommand('claudeBailoutMonitor.disable', () => {
        bailoutMonitor.disable();
        vscode.window.showInformationMessage('⏸️ Claude Bailout Monitor disabled!');
    });

    const statsCommand = vscode.commands.registerCommand('claudeBailoutMonitor.showStats', () => {
        const stats = bailoutMonitor.getStats();
        vscode.window.showInformationMessage(
            `📊 Detection Stats: ${stats.detectionCount} bailouts detected | Status: ${stats.enabled ? 'Enabled' : 'Disabled'}`
        );
    });

    context.subscriptions.push(terminalDataDisposable, enableCommand, disableCommand, statsCommand);
    
    vscode.window.showInformationMessage('🚀 Claude Bailout Monitor is watching your terminal!');
}

export function deactivate() {
    console.log('Claude Bailout Monitor deactivated');
}
