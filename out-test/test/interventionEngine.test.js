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
const sinon = __importStar(require("sinon"));
const vscode = __importStar(require("vscode"));
const InterventionEngine_1 = require("../src/analyzers/InterventionEngine");
const QualityAnalyzer_1 = require("../src/analyzers/QualityAnalyzer");
// Mock VS Code APIs
const mockOutputChannel = {
    appendLine: sinon.stub(),
    show: sinon.stub(),
    dispose: sinon.stub(),
};
const mockTerminal = {
    sendText: sinon.stub(),
    show: sinon.stub(),
};
const mockWindow = {
    activeTerminal: mockTerminal,
    showWarningMessage: sinon.stub(),
    showErrorMessage: sinon.stub(),
    showInformationMessage: sinon.stub(),
    createWebviewPanel: sinon.stub().returns({
        webview: { html: '' },
        dispose: sinon.stub(),
    }),
};
// Mock QualityAnalyzer
class MockQualityAnalyzer extends QualityAnalyzer_1.QualityAnalyzer {
    generateQualityReport(analysis) {
        return {
            file: analysis.filePath,
            totalIssues: analysis.detectionResult.patterns.length,
            criticalCount: analysis.detectionResult.qualityLevel === 'CRITICAL' ? 1 : 0,
            highCount: analysis.detectionResult.qualityLevel === 'HIGH' ? 1 : 0,
            issues: [], // Simplified for test
            aiInstruction: `AI instruction for ${analysis.filePath} with level ${analysis.detectionResult.qualityLevel}`,
        };
    }
}
describe('InterventionEngine', () => {
    let interventionEngine;
    let sandbox;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Replace the real QualityAnalyzer with our mock
        sandbox.stub(InterventionEngine_1.InterventionEngine.prototype, 'qualityAnalyzer').value(new MockQualityAnalyzer());
        // Mock vscode.window
        Object.defineProperty(vscode, 'window', {
            value: mockWindow,
            writable: true,
        });
        interventionEngine = new InterventionEngine_1.InterventionEngine(mockOutputChannel);
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('should trigger AI intervention for CRITICAL quality level and no active intervention', () => {
        const analysis = {
            filePath: 'test.ts',
            timestamp: Date.now(),
            detectionResult: {
                qualityLevel: 'CRITICAL',
                score: 100,
                patterns: [{ category: 'SECURITY_ISSUES', match: 'eval(', pattern: 'eval', weight: 1, source: 'test' }],
            },
            triggerType: 'manual',
            interventionLevel: 'none'
        };
        (0, chai_1.expect)(interventionEngine.shouldTriggerAIIntervention(analysis)).to.be.true;
    });
    it('should not trigger AI intervention for non-CRITICAL quality level', () => {
        const analysis = {
            filePath: 'test.ts',
            timestamp: Date.now(),
            detectionResult: {
                qualityLevel: 'HIGH',
                score: 50,
                patterns: [],
            },
            triggerType: 'manual',
            interventionLevel: 'none'
        };
        (0, chai_1.expect)(interventionEngine.shouldTriggerAIIntervention(analysis)).to.be.false;
    });
    it('should not trigger AI intervention if an intervention is already active', async () => {
        const analysis = {
            filePath: 'test.ts',
            timestamp: Date.now(),
            detectionResult: {
                qualityLevel: 'CRITICAL',
                score: 100,
                patterns: [{ category: 'SECURITY_ISSUES', match: 'eval(', pattern: 'eval', weight: 1, source: 'test' }],
            },
            triggerType: 'manual',
            interventionLevel: 'none'
        };
        // Manually set intervention as active (simulating a previous intervention)
        await interventionEngine.performAutomaticAIIntervention(analysis);
        (0, chai_1.expect)(interventionEngine.shouldTriggerAIIntervention(analysis)).to.be.false;
    });
    it('should not trigger AI intervention if within cooldown period', async () => {
        const analysis = {
            filePath: 'test.ts',
            timestamp: Date.now(),
            detectionResult: {
                qualityLevel: 'CRITICAL',
                score: 100,
                patterns: [{ category: 'SECURITY_ISSUES', match: 'eval(', pattern: 'eval', weight: 1, source: 'test' }],
            },
            triggerType: 'manual',
            interventionLevel: 'none'
        };
        const clock = sinon.useFakeTimers();
        await interventionEngine.performAutomaticAIIntervention(analysis);
        clock.tick(10000); // Advance time by 10 seconds (less than 30s cooldown)
        (0, chai_1.expect)(interventionEngine.shouldTriggerAIIntervention(analysis)).to.be.false;
        clock.restore();
    });
    it('should send AI correction to terminal when performing automatic intervention', async () => {
        const analysis = {
            filePath: 'test.ts',
            timestamp: Date.now(),
            detectionResult: {
                qualityLevel: 'CRITICAL',
                score: 100,
                patterns: [{ category: 'SECURITY_ISSUES', match: 'eval(', pattern: 'eval', weight: 1, source: 'test' }],
            },
            triggerType: 'manual',
            interventionLevel: 'none'
        };
        const sendTextSpy = sandbox.spy(mockTerminal, 'sendText');
        await interventionEngine.performAutomaticAIIntervention(analysis);
        (0, chai_1.expect)(sendTextSpy.calledWith(`# AI Quality Issue Report for test.ts`)).to.be.true;
        (0, chai_1.expect)(sendTextSpy.calledWith(`echo "AI instruction for test.ts with level CRITICAL"`)).to.be.true;
    });
    it('should show critical issues block and request AI fix on user action', async () => {
        const report = {
            file: 'critical.ts',
            totalIssues: 1,
            criticalCount: 1,
            highCount: 0,
            issues: [],
            aiInstruction: 'Fix this critical issue',
        };
        const showErrorMessageStub = sandbox.stub(mockWindow, 'showErrorMessage');
        // Simulate user clicking 'Request AI Fix'
        showErrorMessageStub.returns(Promise.resolve('Request AI Fix'));
        const sendTextSpy = sandbox.spy(mockTerminal, 'sendText');
        await interventionEngine.showCriticalIssuesBlock(report);
        (0, chai_1.expect)(showErrorMessageStub.calledOnce).to.be.true;
        (0, chai_1.expect)(sendTextSpy.calledWith(`echo "Fix this critical issue"`)).to.be.true;
    });
    it('should show detailed quality report on user action', async () => {
        const report = {
            file: 'details.ts',
            totalIssues: 1,
            criticalCount: 0,
            highCount: 1,
            issues: [],
            aiInstruction: 'Show details',
        };
        const showWarningMessageStub = sandbox.stub(mockWindow, 'showWarningMessage');
        const createWebviewPanelStub = sandbox.stub(mockWindow, 'createWebviewPanel');
        // Simulate user clicking 'Show Details'
        showWarningMessageStub.returns(Promise.resolve('Show Details'));
        await interventionEngine.requestUserApprovedAIFix(report);
        (0, chai_1.expect)(showWarningMessageStub.calledOnce).to.be.true;
        (0, chai_1.expect)(createWebviewPanelStub.calledOnce).to.be.true;
    });
});
//# sourceMappingURL=interventionEngine.test.js.map