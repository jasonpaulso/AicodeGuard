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
exports.NotificationManager = void 0;
const vscode = __importStar(require("vscode"));
class NotificationManager {
    constructor() {
        this.notificationQueue = [];
        this.isProcessing = false;
        // Configuration
        this.NOTIFICATION_DELAYS = {
            intervention_complete: 1000, // 1 second - Critical interventions (immediate feedback)
            tool_bailout: 3000, // 3 seconds - Medium issues  
            todo_bailout: 5000 // 5 seconds - Low priority
        };
        this.NOTIFICATIONS_ENABLED = true; // Master switch - ENABLED for production
    }
    static getInstance() {
        if (!NotificationManager.instance) {
            NotificationManager.instance = new NotificationManager();
        }
        return NotificationManager.instance;
    }
    queueNotification(data) {
        if (!this.NOTIFICATIONS_ENABLED) {
            console.log(`📢 NOTIFICATION DISABLED: ${data.type} - ${data.patterns.join(', ')}`);
            return;
        }
        const delay = this.NOTIFICATION_DELAYS[data.type] || 15000;
        this.notificationQueue.push({ data, delay });
        console.log(`📢 NOTIFICATION QUEUED: ${data.type} (delay: ${delay}ms)`);
        if (!this.isProcessing) {
            this.processQueue();
        }
    }
    async processQueue() {
        this.isProcessing = true;
        while (this.notificationQueue.length > 0) {
            const { data, delay } = this.notificationQueue.shift();
            await new Promise(resolve => {
                setTimeout(() => {
                    this.showNotification(data);
                    resolve(void 0);
                }, delay);
            });
        }
        this.isProcessing = false;
    }
    showNotification(data) {
        console.log(`📢 SHOWING NOTIFICATION: ${data.type}`);
        switch (data.type) {
            case 'intervention_complete':
                this.showInterventionComplete(data);
                break;
            case 'tool_bailout':
                this.showToolBailout(data);
                break;
            case 'todo_bailout':
                this.showTodoBailout(data);
                break;
        }
    }
    showInterventionComplete(data) {
        vscode.window.showInformationMessage(`🛡️ Quality Issue Addressed! Patterns: ${data.patterns.slice(0, 2).join(', ')}`, 'Show Details').then(selection => {
            if (selection === 'Show Details') {
                vscode.window.showInformationMessage(`Quality Issue Details:\n\nDetected patterns: ${data.patterns.join(', ')}\n\nCorrective action taken: Interrupted AI and requested complete implementation.`);
            }
        });
    }
    showToolBailout(data) {
        const icon = data.severity === 'HIGH' || data.severity === 'CRITICAL' ? '🚨' : '⚠️';
        vscode.window.showWarningMessage(`${icon} Quality Issue! ${data.tool || 'Implementation gap'} detected`, 'Show Details', 'Quality Enforcement', 'Ignore').then(selection => {
            if (selection === 'Show Details') {
                vscode.window.showInformationMessage(`Quality Issue Details:\n\nTool: ${data.tool}\nConfidence: ${data.confidence}\nSeverity: ${data.severity}\n\n${data.description}`);
            }
            else if (selection === 'Quality Enforcement') {
                vscode.commands.executeCommand('ai-code-guard.enforceQuality');
            }
        });
    }
    showTodoBailout(data) {
        vscode.window.showWarningMessage(`🎯 Implementation Issue Detected! Patterns: ${data.patterns.join(', ')}`, 'Request Complete Implementation').then(selection => {
            if (selection === 'Request Complete Implementation') {
                vscode.commands.executeCommand('ai-code-guard.enforceQuality');
            }
        });
    }
    clearQueue() {
        this.notificationQueue = [];
        console.log(`📢 NOTIFICATION QUEUE CLEARED`);
    }
    disableNotifications() {
        // This would require making NOTIFICATIONS_ENABLED mutable
        console.log(`📢 NOTIFICATIONS DISABLED`);
    }
}
exports.NotificationManager = NotificationManager;
//# sourceMappingURL=NotificationManager.js.map