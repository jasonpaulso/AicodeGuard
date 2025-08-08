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
const chai_1 = require("chai");
const vscode = __importStar(require("vscode"));
const ConfigManager_1 = require("../src/managers/ConfigManager");
const sinon = __importStar(require("sinon"));
// Mock VS Code's workspace.getConfiguration
const mockGetConfiguration = (section) => {
    return {
        get: (key, defaultValue) => {
            if (section === 'ai-code-guard') {
                switch (key) {
                    case 'monitoringMode': return 'both';
                    case 'aggressivenessLevel': return 'sophisticated';
                    case 'autoIntervention': return true;
                    case 'typingDelay': return 2000;
                    case 'interventionCooldown': return 30000;
                    case 'blockCriticalSaves': return true;
                    default: return defaultValue;
                }
            }
            return defaultValue;
        },
        update: async (key, value, configurationTarget) => {
            // Mock update operation
        }
    };
};
// Mock vscode.window.createOutputChannel
const mockOutputChannel = {
    appendLine: sinon.stub(),
    show: sinon.stub(),
    dispose: sinon.stub(),
};
// Assign mocks before importing ConfigManager to ensure it uses them
Object.defineProperty(vscode.workspace, 'getConfiguration', {
    value: mockGetConfiguration,
    writable: true,
});
Object.defineProperty(vscode.window, 'createOutputChannel', {
    value: sinon.stub().returns(mockOutputChannel),
    writable: true,
});
describe('ConfigManager', () => {
    let configManager;
    beforeEach(() => {
        configManager = ConfigManager_1.ConfigManager.getInstance(mockOutputChannel);
    });
    it('should return the same instance (singleton)', () => {
        const anotherInstance = ConfigManager_1.ConfigManager.getInstance(mockOutputChannel);
        (0, chai_1.expect)(configManager).to.equal(anotherInstance);
    });
    it('should load default configuration correctly', () => {
        const config = configManager.getConfig();
        (0, chai_1.expect)(config.monitoringMode).to.equal('both');
        (0, chai_1.expect)(config.aggressivenessLevel).to.equal('sophisticated');
        (0, chai_1.expect)(config.autoIntervention).to.be.true;
    });
    it('should return the current aggressiveness profile', () => {
        const profile = configManager.getCurrentProfile();
        (0, chai_1.expect)(profile.name).to.equal('Sophisticated');
        (0, chai_1.expect)(profile.thresholds.criticalScore).to.equal(50);
    });
    it('should return a specific aggressiveness profile', () => {
        const zeroToleranceProfile = configManager.getProfile('zero-tolerance');
        (0, chai_1.expect)(zeroToleranceProfile.name).to.equal('Zero-Tolerance');
        (0, chai_1.expect)(zeroToleranceProfile.thresholds.criticalScore).to.equal(15);
    });
    it('should correctly determine quality level', () => {
        // Sophisticated profile thresholds: critical: 50, poor: 30, warning: 15
        (0, chai_1.expect)(configManager.determineQualityLevel(60)).to.equal('CRITICAL');
        (0, chai_1.expect)(configManager.determineQualityLevel(40)).to.equal('POOR');
        (0, chai_1.expect)(configManager.determineQualityLevel(20)).to.equal('ACCEPTABLE');
        (0, chai_1.expect)(configManager.determineQualityLevel(10)).to.equal('GOOD');
        (0, chai_1.expect)(configManager.determineQualityLevel(3)).to.equal('EXCELLENT');
    });
    it('should correctly determine if file watcher is enabled', () => {
        configManager.setMonitoringMode('fileWatcher');
        (0, chai_1.expect)(configManager.isFileWatcherEnabled()).to.be.true;
        configManager.setMonitoringMode('both');
        (0, chai_1.expect)(configManager.isFileWatcherEnabled()).to.be.true;
        configManager.setMonitoringMode('terminal');
        (0, chai_1.expect)(configManager.isFileWatcherEnabled()).to.be.false;
    });
    it('should correctly determine if terminal monitoring is enabled', () => {
        configManager.setMonitoringMode('terminal');
        (0, chai_1.expect)(configManager.isTerminalMonitoringEnabled()).to.be.true;
        configManager.setMonitoringMode('both');
        (0, chai_1.expect)(configManager.isTerminalMonitoringEnabled()).to.be.true;
        configManager.setMonitoringMode('fileWatcher');
        (0, chai_1.expect)(configManager.isTerminalMonitoringEnabled()).to.be.false;
    });
    it('should correctly determine if auto intervention is enabled', async () => {
        // Default is true for sophisticated
        (0, chai_1.expect)(configManager.isAutoInterventionEnabled()).to.be.true;
        // Toggle it off
        await configManager.toggleAutoIntervention();
        (0, chai_1.expect)(configManager.isAutoInterventionEnabled()).to.be.false;
        // Toggle it back on
        await configManager.toggleAutoIntervention();
        (0, chai_1.expect)(configManager.isAutoInterventionEnabled()).to.be.true;
        // Test with a profile that has autoInterventionEnabled: false
        await configManager.setAggressivenessLevel('light');
        (0, chai_1.expect)(configManager.isAutoInterventionEnabled()).to.be.true; // Still true because config.autoIntervention is true
    });
    it('should correctly determine if saves should be blocked', async () => {
        // Default is true for sophisticated
        (0, chai_1.expect)(configManager.shouldBlockSaves()).to.be.true;
        // Set to light mode where blockSaves is false
        await configManager.setAggressivenessLevel('light');
        (0, chai_1.expect)(configManager.shouldBlockSaves()).to.be.false;
        // Set back to sophisticated
        await configManager.setAggressivenessLevel('sophisticated');
        (0, chai_1.expect)(configManager.shouldBlockSaves()).to.be.true;
    });
    it('should correctly determine if auto intervention should trigger based on score', async () => {
        await configManager.setAggressivenessLevel('sophisticated'); // Threshold: 30
        (0, chai_1.expect)(configManager.shouldAutoIntervene(29)).to.be.false;
        (0, chai_1.expect)(configManager.shouldAutoIntervene(30)).to.be.true;
        (0, chai_1.expect)(configManager.shouldAutoIntervene(50)).to.be.true;
        await configManager.setAggressivenessLevel('light'); // Threshold: 80
        (0, chai_1.expect)(configManager.shouldAutoIntervene(79)).to.be.false;
        (0, chai_1.expect)(configManager.shouldAutoIntervene(80)).to.be.true;
    });
    it('should correctly determine if a pattern is enabled', async () => {
        await configManager.setAggressivenessLevel('sophisticated');
        (0, chai_1.expect)(configManager.isPatternEnabled('securityIssues')).to.be.true;
        (0, chai_1.expect)(configManager.isPatternEnabled('typescriptBailouts')).to.be.true;
        await configManager.setAggressivenessLevel('light');
        (0, chai_1.expect)(configManager.isPatternEnabled('securityIssues')).to.be.true;
        (0, chai_1.expect)(configManager.isPatternEnabled('typescriptBailouts')).to.be.false;
    });
});
//# sourceMappingURL=configManager.test.js.map