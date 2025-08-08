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
exports.ConfigManager = void 0;
const vscode = __importStar(require("vscode"));
class ConfigManager {
    constructor(outputChannel) {
        this.aggressivenessProfiles = new Map();
        this.outputChannel = outputChannel;
        this.initializeProfiles();
        this.config = this.loadConfig();
    }
    static getInstance(outputChannel) {
        if (!ConfigManager.instance) {
            if (!outputChannel) {
                throw new Error('OutputChannel required for first initialization');
            }
            ConfigManager.instance = new ConfigManager(outputChannel);
        }
        return ConfigManager.instance;
    }
    initializeProfiles() {
        this.aggressivenessProfiles = new Map();
        // ZERO-TOLERANCE MODE - Catches everything, blocks aggressively
        this.aggressivenessProfiles.set('zero-tolerance', {
            name: 'Zero-Tolerance',
            description: 'Maximum protection - catches all issues, blocks saves, immediate intervention',
            thresholds: {
                criticalScore: 15, // Very low threshold for critical
                poorScore: 10, // Very low threshold for poor
                warningScore: 5, // Warn on minor issues
                autoInterventionScore: 10 // Intervene early
            },
            enabledPatterns: {
                securityIssues: true,
                typescriptBailouts: true,
                productionIssues: true,
                codeQualityIssues: true,
                terminalBailouts: true
            },
            interventionBehavior: {
                autoInterventionEnabled: true,
                blockSaves: true,
                showNotifications: true,
                detailedReports: true
            }
        });
        // SOPHISTICATED MODE - Current intelligent behavior
        this.aggressivenessProfiles.set('sophisticated', {
            name: 'Sophisticated',
            description: 'Intelligent monitoring - balanced protection with smart intervention',
            thresholds: {
                criticalScore: 50, // Current CRITICAL threshold
                poorScore: 30, // Current POOR threshold
                warningScore: 15, // Current WARNING threshold
                autoInterventionScore: 30 // Current auto-intervention threshold
            },
            enabledPatterns: {
                securityIssues: true,
                typescriptBailouts: true,
                productionIssues: true,
                codeQualityIssues: true,
                terminalBailouts: true
            },
            interventionBehavior: {
                autoInterventionEnabled: true,
                blockSaves: true, // Block critical saves
                showNotifications: true,
                detailedReports: true
            }
        });
        // LIGHT MODE - Only the most blatant issues
        this.aggressivenessProfiles.set('light', {
            name: 'Light',
            description: 'Minimal monitoring - only catches blatant security and critical issues',
            thresholds: {
                criticalScore: 80, // Very high threshold - only worst issues
                poorScore: 60, // High threshold
                warningScore: 40, // Only warn on significant issues
                autoInterventionScore: 80 // Only intervene on worst issues
            },
            enabledPatterns: {
                securityIssues: true, // Always catch security issues
                typescriptBailouts: false, // Skip TypeScript issues in light mode
                productionIssues: false, // Skip production issues
                codeQualityIssues: false, // Skip quality issues
                terminalBailouts: true // Catch terminal bailouts
            },
            interventionBehavior: {
                autoInterventionEnabled: true,
                blockSaves: false, // Don't block saves in light mode
                showNotifications: false, // Minimal notifications
                detailedReports: false
            }
        });
    }
    loadConfig() {
        const vscodeConfig = vscode.workspace.getConfiguration('ai-code-guard');
        return {
            monitoringMode: vscodeConfig.get('monitoringMode', 'both'),
            aggressivenessLevel: vscodeConfig.get('aggressivenessLevel', 'sophisticated'),
            autoIntervention: vscodeConfig.get('autoIntervention', true),
            typingDelay: vscodeConfig.get('typingDelay', 2000),
            interventionCooldown: vscodeConfig.get('interventionCooldown', 30000),
            blockCriticalSaves: vscodeConfig.get('blockCriticalSaves', true)
        };
    }
    async saveConfig() {
        const vscodeConfig = vscode.workspace.getConfiguration('ai-code-guard');
        await vscodeConfig.update('monitoringMode', this.config.monitoringMode, vscode.ConfigurationTarget.Global);
        await vscodeConfig.update('aggressivenessLevel', this.config.aggressivenessLevel, vscode.ConfigurationTarget.Global);
        await vscodeConfig.update('autoIntervention', this.config.autoIntervention, vscode.ConfigurationTarget.Global);
        await vscodeConfig.update('typingDelay', this.config.typingDelay, vscode.ConfigurationTarget.Global);
        await vscodeConfig.update('interventionCooldown', this.config.interventionCooldown, vscode.ConfigurationTarget.Global);
        await vscodeConfig.update('blockCriticalSaves', this.config.blockCriticalSaves, vscode.ConfigurationTarget.Global);
        this.outputChannel.appendLine(`⚙️ Configuration saved: ${this.config.monitoringMode} mode, ${this.config.aggressivenessLevel} aggressiveness`);
    }
    // Getters
    getConfig() {
        return { ...this.config };
    }
    getCurrentProfile() {
        return this.aggressivenessProfiles.get(this.config.aggressivenessLevel);
    }
    getProfile(level) {
        return this.aggressivenessProfiles.get(level);
    }
    getAllProfiles() {
        return Array.from(this.aggressivenessProfiles.values());
    }
    // Setters
    async setMonitoringMode(mode) {
        this.config.monitoringMode = mode;
        await this.saveConfig();
        this.outputChannel.appendLine(`🔄 Monitoring mode changed to: ${mode}`);
    }
    async setAggressivenessLevel(level) {
        this.config.aggressivenessLevel = level;
        await this.saveConfig();
        const profile = this.getCurrentProfile();
        this.outputChannel.appendLine(`🎯 Aggressiveness changed to: ${profile.name} - ${profile.description}`);
    }
    async toggleAutoIntervention() {
        this.config.autoIntervention = !this.config.autoIntervention;
        await this.saveConfig();
        vscode.window.showInformationMessage(`Auto-intervention ${this.config.autoIntervention ? 'enabled' : 'disabled'}.`);
    }
    // Convenience methods for checking current state
    isFileWatcherEnabled() {
        return this.config.monitoringMode === 'fileWatcher' || this.config.monitoringMode === 'both';
    }
    isTerminalMonitoringEnabled() {
        return this.config.monitoringMode === 'terminal' || this.config.monitoringMode === 'both';
    }
    isMonitoringEnabled() {
        return this.config.monitoringMode !== 'disabled';
    }
    isAutoInterventionEnabled() {
        return this.config.autoIntervention && this.getCurrentProfile().interventionBehavior.autoInterventionEnabled;
    }
    shouldBlockSaves() {
        return this.config.blockCriticalSaves && this.getCurrentProfile().interventionBehavior.blockSaves;
    }
    shouldShowNotifications() {
        return this.getCurrentProfile().interventionBehavior.showNotifications;
    }
    shouldShowDetailedReports() {
        return this.getCurrentProfile().interventionBehavior.detailedReports;
    }
    // Quality level determination based on current profile
    determineQualityLevel(severityScore) {
        const profile = this.getCurrentProfile();
        if (severityScore >= profile.thresholds.criticalScore)
            return 'CRITICAL';
        if (severityScore >= profile.thresholds.poorScore)
            return 'POOR';
        if (severityScore >= profile.thresholds.warningScore)
            return 'ACCEPTABLE';
        if (severityScore >= 5)
            return 'GOOD';
        return 'EXCELLENT';
    }
    shouldAutoIntervene(severityScore) {
        if (!this.isAutoInterventionEnabled())
            return false;
        const profile = this.getCurrentProfile();
        return severityScore >= profile.thresholds.autoInterventionScore;
    }
    isPatternEnabled(pattern) {
        return this.getCurrentProfile().enabledPatterns[pattern];
    }
    // Configuration UI
    async showConfigurationUI() {
        const currentProfile = this.getCurrentProfile();
        const quickPick = vscode.window.createQuickPick();
        quickPick.title = 'Claude Bailout Monitor Configuration';
        quickPick.placeholder = 'Select configuration option';
        quickPick.items = [
            {
                label: '🎯 Monitoring Mode',
                detail: `Current: ${this.config.monitoringMode}`,
                description: 'Change what to monitor (files, terminal, both, or disabled)'
            },
            {
                label: '⚡ Aggressiveness Level',
                detail: `Current: ${currentProfile.name}`,
                description: currentProfile.description
            },
            {
                label: '🛑 Auto-Intervention',
                detail: `Current: ${this.config.autoIntervention ? 'ENABLED' : 'DISABLED'}`,
                description: 'Toggle automatic terminal intervention'
            },
            {
                label: '📊 Show Current Status',
                description: 'Display detailed configuration status'
            }
        ];
        quickPick.onDidChangeSelection(async (selection) => {
            if (selection[0]) {
                quickPick.dispose();
                switch (selection[0].label) {
                    case '🎯 Monitoring Mode':
                        await this.showMonitoringModeSelector();
                        break;
                    case '⚡ Aggressiveness Level':
                        await this.showAggressivenessSelector();
                        break;
                    case '🛑 Auto-Intervention':
                        await this.toggleAutoIntervention();
                        break;
                    case '📊 Show Current Status':
                        await this.showDetailedStatus();
                        break;
                }
            }
        });
        quickPick.show();
    }
    async showMonitoringModeSelector() {
        const modes = [
            {
                label: '📁📺 Both (Recommended)',
                mode: 'both',
                description: 'Monitor files and terminal conversations'
            },
            {
                label: '📁 File Watcher Only',
                mode: 'fileWatcher',
                description: 'Only monitor file quality, no terminal intervention'
            },
            {
                label: '📺 Terminal Only',
                mode: 'terminal',
                description: 'Only monitor Claude conversations, no file analysis'
            },
            {
                label: '❌ Disabled',
                mode: 'disabled',
                description: 'Turn off all monitoring'
            }
        ];
        const selected = await vscode.window.showQuickPick(modes, {
            placeHolder: 'Select monitoring mode'
        });
        if (selected) {
            await this.setMonitoringMode(selected.mode);
            vscode.window.showInformationMessage(`Monitoring mode set to: ${selected.label}`);
        }
    }
    async showAggressivenessSelector() {
        const levels = [
            {
                label: '🚨 Zero-Tolerance',
                level: 'zero-tolerance',
                description: 'Maximum protection - catches everything, blocks aggressively'
            },
            {
                label: '🎯 Sophisticated (Recommended)',
                level: 'sophisticated',
                description: 'Intelligent monitoring with balanced protection'
            },
            {
                label: '🌙 Light',
                level: 'light',
                description: 'Minimal monitoring - only blatant security issues'
            }
        ];
        const selected = await vscode.window.showQuickPick(levels, {
            placeHolder: 'Select aggressiveness level'
        });
        if (selected) {
            await this.setAggressivenessLevel(selected.level);
            vscode.window.showInformationMessage(`Aggressiveness set to: ${selected.label}`);
        }
    }
    async showDetailedStatus() {
        const profile = this.getCurrentProfile();
        const report = [
            `# 🛡️ Claude Bailout Monitor Configuration`,
            ``,
            `## Current Settings`,
            `- **Monitoring Mode**: ${this.config.monitoringMode}`,
            `- **Aggressiveness**: ${profile.name}`,
            `- **Auto-Intervention**: ${this.config.autoIntervention ? '✅ ENABLED' : '❌ DISABLED'}`,
            `- **Block Saves**: ${this.shouldBlockSaves() ? '✅ YES' : '❌ NO'}`,
            ``,
            `## ${profile.name} Profile Details`,
            `${profile.description}`,
            ``,
            `### Thresholds`,
            `- **Critical Score**: ${profile.thresholds.criticalScore}+`,
            `- **Poor Score**: ${profile.thresholds.poorScore}+`,
            `- **Warning Score**: ${profile.thresholds.warningScore}+`,
            `- **Auto-Intervention**: ${profile.thresholds.autoInterventionScore}+`,
            ``,
            `### Enabled Patterns`,
            `- **Security Issues**: ${profile.enabledPatterns.securityIssues ? '✅' : '❌'}`,
            `- **TypeScript Bailouts**: ${profile.enabledPatterns.typescriptBailouts ? '✅' : '❌'}`,
            `- **Production Issues**: ${profile.enabledPatterns.productionIssues ? '✅' : '❌'}`,
            `- **Code Quality**: ${profile.enabledPatterns.codeQualityIssues ? '✅' : '❌'}`,
            `- **Terminal Bailouts**: ${profile.enabledPatterns.terminalBailouts ? '✅' : '❌'}`,
            ``,
            `### Behavior`,
            `- **Show Notifications**: ${profile.interventionBehavior.showNotifications ? '✅' : '❌'}`,
            `- **Detailed Reports**: ${profile.interventionBehavior.detailedReports ? '✅' : '❌'}`,
            ``,
            `## Active Monitoring`,
            `- **File Watcher**: ${this.isFileWatcherEnabled() ? '✅ ACTIVE' : '❌ INACTIVE'}`,
            `- **Terminal Monitor**: ${this.isTerminalMonitoringEnabled() ? '✅ ACTIVE' : '❌ INACTIVE'}`,
            ``,
            `---`,
            `*Use Command Palette: "AI Monitor: Configure" to change settings*`
        ].join('\n');
        const document = await vscode.workspace.openTextDocument({
            content: report,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(document);
    }
}
exports.ConfigManager = ConfigManager;
//# sourceMappingURL=ConfigManager.js.map