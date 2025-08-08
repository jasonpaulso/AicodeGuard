export declare class ConversationWatcher {
    private projectsPath;
    private fileWatchers;
    private lastAnalyzedMessageCount;
    private analysisTimeouts;
    private notificationManager;
    private conversationAnalyzer;
    private interventionActive;
    private lastInterventionTime;
    private readonly INTERVENTION_COOLDOWN;
    constructor();
    startWatching(): Promise<void>;
    private findAndWatchProjects;
    private watchTodoFile;
    private scheduleTodoAnalysis;
    private analyzeTodoFile;
    private extractMessages;
    private canIntervene;
    private triggerIntervention;
    private showAnalysisDetails;
    private stopWatchingFile;
    dispose(): void;
    getStats(): {
        watchedFiles: number;
        trackedFiles: number;
        interventionActive: boolean;
        lastInterventionTime: number;
    };
}
