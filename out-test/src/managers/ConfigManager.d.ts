import * as vscode from 'vscode';
export type MonitoringMode = 'fileWatcher' | 'terminal' | 'both' | 'disabled';
export type AggressivenessLevel = 'zero-tolerance' | 'sophisticated' | 'light';
export interface BailoutConfig {
    monitoringMode: MonitoringMode;
    aggressivenessLevel: AggressivenessLevel;
    autoIntervention: boolean;
    typingDelay: number;
    interventionCooldown: number;
    blockCriticalSaves: boolean;
}
export interface AggressivenessProfile {
    name: string;
    description: string;
    thresholds: {
        criticalScore: number;
        poorScore: number;
        warningScore: number;
        autoInterventionScore: number;
    };
    enabledPatterns: {
        securityIssues: boolean;
        typescriptBailouts: boolean;
        productionIssues: boolean;
        codeQualityIssues: boolean;
        terminalBailouts: boolean;
    };
    interventionBehavior: {
        autoInterventionEnabled: boolean;
        blockSaves: boolean;
        showNotifications: boolean;
        detailedReports: boolean;
    };
}
export declare class ConfigManager {
    private static instance;
    private config;
    private aggressivenessProfiles;
    private outputChannel;
    private constructor();
    static getInstance(outputChannel?: vscode.OutputChannel): ConfigManager;
    private initializeProfiles;
    private loadConfig;
    saveConfig(): Promise<void>;
    getConfig(): BailoutConfig;
    getCurrentProfile(): AggressivenessProfile;
    getProfile(level: AggressivenessLevel): AggressivenessProfile;
    getAllProfiles(): AggressivenessProfile[];
    setMonitoringMode(mode: MonitoringMode): Promise<void>;
    setAggressivenessLevel(level: AggressivenessLevel): Promise<void>;
    toggleAutoIntervention(): Promise<void>;
    isFileWatcherEnabled(): boolean;
    isTerminalMonitoringEnabled(): boolean;
    isMonitoringEnabled(): boolean;
    isAutoInterventionEnabled(): boolean;
    shouldBlockSaves(): boolean;
    shouldShowNotifications(): boolean;
    shouldShowDetailedReports(): boolean;
    determineQualityLevel(severityScore: number): 'EXCELLENT' | 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'CRITICAL';
    shouldAutoIntervene(severityScore: number): boolean;
    isPatternEnabled(pattern: keyof AggressivenessProfile['enabledPatterns']): boolean;
    showConfigurationUI(): Promise<void>;
    private showMonitoringModeSelector;
    private showAggressivenessSelector;
    private showDetailedStatus;
}
