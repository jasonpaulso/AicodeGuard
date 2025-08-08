import * as vscode from 'vscode';
export declare class CodeGuard {
    private conversationWatcher;
    private notificationManager;
    private fileWatcher;
    private configManager;
    outputChannel: vscode.OutputChannel;
    private detectionCount;
    private isEnabled;
    private fileMonitoringEnabled;
    private interventionEnabled;
    constructor();
    /**
     * Start comprehensive monitoring for AI quality issues and code problems
     */
    startMonitoring(): Promise<vscode.Disposable[]>;
    /**
     * Test both monitoring systems
     */
    testPatterns(): boolean;
    /**
     * Show comprehensive system capabilities
     */
    private showCapabilities;
    /**
     * Analyze current file manually
     */
    analyzeCurrentFile(): void;
    /**
     * Show code fix suggestions
     */
    showCodeFixSuggestions(): void;
    enable(): void;
    disable(): void;
    enableFileMonitoring(): void;
    disableFileMonitoring(): void;
    enableIntervention(): void;
    disableIntervention(): void;
    getStats(): any;
    dispose(): void;
}
