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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert = __importStar(require("assert"));
const PatternDetector_1 = require("../src/PatternDetector");
suite('PatternDetector', () => {
    let patternDetector;
    setup(() => {
        patternDetector = new PatternDetector_1.PatternDetector();
    });
    test('should detect no patterns in clean text', () => {
        const text = 'This is a clean text with no bailout patterns.';
        const result = patternDetector.detectPatterns(text);
        assert.strictEqual(result.patterns.length, 0);
        assert.strictEqual(result.severityScore, 0);
        assert.strictEqual(result.qualityLevel, 'EXCELLENT');
    });
    test('should detect direct refusal patterns', () => {
        const text = 'I cannot generate code for you.';
        const result = patternDetector.detectPatterns(text, 'terminal');
        assert.strictEqual(result.patterns.length, 1);
        assert.strictEqual(result.patterns[0].category, 'DIRECT_REFUSAL');
        assert.strictEqual(result.hasDirectRefusal, true);
    });
    test('should detect educational positioning patterns', () => {
        const text = 'This will help you learn.';
        const result = patternDetector.detectPatterns(text, 'terminal');
        assert.strictEqual(result.patterns.length, 1);
        assert.strictEqual(result.patterns[0].category, 'EDUCATIONAL_POSITIONING');
        assert.strictEqual(result.hasEducationalDeflection, true);
    });
    test('should detect security issues in code', () => {
        const text = 'eval("console.log(1)");';
        const result = patternDetector.detectPatterns(text, 'code');
        assert.strictEqual(result.patterns.length, 1);
        assert.strictEqual(result.patterns[0].category, 'SECURITY_VULNERABILITIES');
    });
    test('should detect TypeScript bailouts in code', () => {
        const text = 'const x: any = {};';
        const result = patternDetector.detectPatterns(text, 'code');
        assert.strictEqual(result.patterns.length, 1);
        assert.strictEqual(result.patterns[0].category, 'TYPE_SAFETY_ISSUES');
    });
    test('should calculate severity score correctly', () => {
        const text = 'I cannot generate code for you. This will help you learn.';
        const result = patternDetector.detectPatterns(text, 'terminal');
        assert.strictEqual(result.patterns.length, 2);
        assert.ok(result.severityScore > 0);
    });
    test('should determine quality level correctly', () => {
        const text = 'I cannot generate code for you. This will help you learn. eval("console.log(1)");';
        const result = patternDetector.detectPatterns(text, 'auto');
        assert.strictEqual(result.qualityLevel, 'REQUIRES_ATTENTION');
    });
});
//# sourceMappingURL=patternDetector.test.js.map