import * as assert from 'assert';
import { PatternDetector } from '../src/core/PatternDetector';

suite('PatternDetector', () => {
  let patternDetector: PatternDetector;

  setup(() => {
    patternDetector = new PatternDetector();
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
    assert.strictEqual(result.patterns[0]!.category, 'SECURITY_ISSUES');
  });

  test('should detect TypeScript bailouts in code', () => {
    const code = 'const x: any = {};';
    const result = patternDetector.analyzeCode(code);
    assert.ok(result.patterns.length > 0);
    assert.strictEqual(result.patterns[0]!.category, 'TYPESCRIPT_BAILOUTS');
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
    assert.ok(['POOR', 'CRITICAL'].includes(result.qualityLevel));
  });
});