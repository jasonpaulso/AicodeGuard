export interface BailoutNotificationData {
    type: 'tool_bailout' | 'todo_bailout' | 'intervention_complete';
    patterns: string[];
    tool?: string;
    confidence?: string;
    severity?: string;
    description?: string;
    messageNum?: number;
}
export declare class NotificationManager {
    private static instance;
    private notificationQueue;
    private isProcessing;
    private readonly NOTIFICATION_DELAYS;
    private readonly NOTIFICATIONS_ENABLED;
    static getInstance(): NotificationManager;
    queueNotification(data: BailoutNotificationData): void;
    private processQueue;
    private showNotification;
    private showInterventionComplete;
    private showToolBailout;
    private showTodoBailout;
    clearQueue(): void;
    disableNotifications(): void;
}
