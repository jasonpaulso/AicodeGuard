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
const assert = __importStar(require("assert"));
const PatternDetector_1 = require("../src/core/PatternDetector");
suite('PatternDetector', () => {
    let patternDetector;
    setup(() => {
        patternDetector = new PatternDetector_1.PatternDetector();
    });
    test('should detect no patterns in clean text', () => {
        const text = 'This is a clean text with no bailout patterns.';
        const result = patternDetector.analyzeText(text);
        assert.strictEqual(result.patterns.length, 0);
        assert.strictEqual(result.severityScore, 0);
        assert.strictEqual(result.qualityLevel, 'EXCELLENT');
    });
    test('should detect direct refusal patterns', () => {
        const text = 'I cannot generate code for you.';
        const result = patternDetector.analyzeText(text);
        assert.ok(result.patterns.length > 0);
        assert.strictEqual(result.hasDirectRefusal, true);
    });
    test('should detect educational positioning patterns', () => {
        const text = 'This will help you learn.';
        const result = patternDetector.analyzeText(text);
        assert.ok(result.patterns.length > 0);
        assert.strictEqual(result.hasEducationalDeflection, true);
    });
    test('should detect security issues in code', () => {
        const code = 'eval("console.log(1)");';
        const result = patternDetector.analyzeCode(code);
        assert.ok(result.patterns.length > 0);
        assert.strictEqual(result.patterns[0].category, 'SECURITY_ISSUES');
    });
    test('should detect TypeScript bailouts in code', () => {
        const code = 'const x: any = {};';
        const result = patternDetector.analyzeCode(code);
        assert.ok(result.patterns.length > 0);
        assert.strictEqual(result.patterns[0].category, 'TYPESCRIPT_BAILOUTS');
    });
    test('should calculate severity score correctly', () => {
        const text = 'I cannot generate code for you. This will help you learn.';
        const result = patternDetector.analyzeText(text);
        assert.ok(result.patterns.length > 0);
        assert.ok(result.severityScore > 0);
    });
    test('should determine quality level correctly', () => {
        const code = 'eval("malicious code");';
        const result = patternDetector.analyzeCode(code);
        // eval() has weight 25, should be ACCEPTABLE (15-29 range)
        assert.strictEqual(result.qualityLevel, 'ACCEPTABLE');
        assert.strictEqual(result.severityScore, 25);
    });
});
//# sourceMappingURL=patternDetector.test.js.map