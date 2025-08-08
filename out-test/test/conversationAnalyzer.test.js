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
const ConversationAnalyzer_1 = require("../src/analyzers/ConversationAnalyzer");
const fs = __importStar(require("fs"));
describe('ConversationAnalyzer', () => {
    let analyzer;
    let readFileSyncStub;
    beforeEach(() => {
        // Stub fs.readFileSync to control the patterns loaded
        readFileSyncStub = sinon.stub(fs, 'readFileSync');
        readFileSyncStub.withArgs(sinon.match(/conversation-patterns\.json$/)).returns(JSON.stringify({
            implementationAvoidance: {
                HIGH: ["plan implementation", "create mock"],
                MEDIUM: ["add proper error handling"],
                LOW: ["basic implementation"]
            },
            weights: { HIGH: 15, MEDIUM: 10, LOW: 5 },
            interventionThreshold: 25
        }));
        analyzer = new ConversationAnalyzer_1.ConversationAnalyzer();
    });
    afterEach(() => {
        readFileSyncStub.restore();
    });
    it('should correctly analyze content with HIGH severity patterns', () => {
        const content = "Let's plan implementation and create mock objects.";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(30); // 15 (plan implementation) + 15 (create mock)
        (0, chai_1.expect)(analysis.severity).to.equal('HIGH');
        (0, chai_1.expect)(analysis.bailoutPatterns).to.include('HIGH: plan implementation');
        (0, chai_1.expect)(analysis.bailoutPatterns).to.include('HIGH: create mock');
    });
    it('should correctly analyze content with MEDIUM severity patterns', () => {
        const content = "You'll need to add proper error handling.";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(10); // 10 (add proper error handling)
        (0, chai_1.expect)(analysis.severity).to.equal('MEDIUM');
        (0, chai_1.expect)(analysis.bailoutPatterns).to.include('MEDIUM: add proper error handling');
    });
    it('should correctly analyze content with LOW severity patterns', () => {
        const content = "Here's a basic implementation for you.";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(5); // 5 (basic implementation)
        (0, chai_1.expect)(analysis.severity).to.equal('LOW');
        (0, chai_1.expect)(analysis.bailoutPatterns).to.include('LOW: basic implementation');
    });
    it('should handle content with mixed severity patterns', () => {
        const content = "Let's plan implementation and add proper error handling for a basic implementation.";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(30); // 15 (plan implementation) + 10 (error handling) + 5 (basic implementation)
        (0, chai_1.expect)(analysis.severity).to.equal('HIGH');
    });
    it('should return zero score for content with no bailout patterns', () => {
        const content = "This is a perfectly normal sentence with no issues.";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(0);
        (0, chai_1.expect)(analysis.severity).to.equal('LOW');
        (0, chai_1.expect)(analysis.bailoutPatterns).to.be.empty;
    });
    it('should handle empty content', () => {
        const content = "";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(0);
        (0, chai_1.expect)(analysis.severity).to.equal('LOW');
        (0, chai_1.expect)(analysis.bailoutPatterns).to.be.empty;
    });
    it('should handle patterns that are substrings of other words', () => {
        const content = "This is a planning meeting, not a plan implementation.";
        const analysis = analyzer.analyzeTodoBailoutPatterns(content);
        (0, chai_1.expect)(analysis.score).to.equal(15); // Should only match "plan implementation" once
        (0, chai_1.expect)(analysis.bailoutPatterns).to.include('HIGH: plan implementation');
    });
    it('should correctly determine intervention based on threshold', () => {
        const highScoreContent = "Plan implementation and create mock."; // Score 30
        const lowScoreContent = "Basic implementation."; // Score 5
        (0, chai_1.expect)(analyzer.shouldTriggerIntervention(analyzer.analyzeTodoBailoutPatterns(highScoreContent))).to.be.true;
        (0, chai_1.expect)(analyzer.shouldTriggerIntervention(analyzer.analyzeTodoBailoutPatterns(lowScoreContent))).to.be.false;
    });
});
//# sourceMappingURL=conversationAnalyzer.test.js.map