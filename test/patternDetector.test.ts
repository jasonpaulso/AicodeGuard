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
    // eval() has weight 25, should be ACCEPTABLE (15-29 range)
    assert.strictEqual(result.qualityLevel, 'ACCEPTABLE');
    assert.strictEqual(result.severityScore, 25);
  });

  test('should separate terminal and code patterns', () => {
    const mixedContent = 'I cannot generate code for you. eval("test");';
    const result = patternDetector.analyzeText(mixedContent);
    
    assert.ok(result.terminalPatterns.length > 0);
    assert.ok(result.codePatterns.length > 0);
    assert.ok(result.patterns.length >= 2);
  });

  test('should handle multiple patterns with cumulative scoring', () => {
    const code = 'eval("test"); const x: any = {}; console.log("debug");';
    const result = patternDetector.analyzeCode(code);
    
    assert.ok(result.patterns.length >= 3);
    assert.ok(result.severityScore > 40); // 25 + 15 + 10 = 50
    assert.strictEqual(result.qualityLevel, 'CRITICAL');
  });

  test('should detect architectural deflection patterns', () => {
    const text = "Let's start with the basics and think about architecture first.";
    const result = patternDetector.analyzeText(text);
    
    const hasArchitecturalDeflection = result.patterns.some(p => p.category === 'ARCHITECTURAL_DEFLECTION');
    assert.ok(hasArchitecturalDeflection);
  });

  test('should detect production issues', () => {
    const testCases = [
      'console.log("debug");',
      'debugger;',
      '// TODO: implement this',
      '// FIXME: broken logic'
    ];
    
    testCases.forEach(code => {
      const result = patternDetector.analyzeCode(code);
      assert.ok(result.patterns.length > 0, `Should detect pattern in: ${code}`);
      
      const hasProductionIssue = result.patterns.some(p => p.category === 'PRODUCTION_ISSUES');
      assert.ok(hasProductionIssue, `Should detect production issue in: ${code}`);
    });
  });

  test('should detect code quality issues', () => {
    const testCases = [
      'throw new Error("TODO: implement");',
      'return null; // TODO: fix this',
      '// TODO implement the real logic'
    ];
    
    testCases.forEach(code => {
      const result = patternDetector.analyzeCode(code);
      assert.ok(result.patterns.length > 0, `Should detect pattern in: ${code}`);
      
      const hasQualityIssue = result.patterns.some(p => p.category === 'CODE_QUALITY_ISSUES');
      assert.ok(hasQualityIssue, `Should detect quality issue in: ${code}`);
    });
  });

  test('should handle empty input gracefully', () => {
    const result1 = patternDetector.analyzeText('');
    const result2 = patternDetector.analyzeCode('');
    
    assert.strictEqual(result1.patterns.length, 0);
    assert.strictEqual(result1.severityScore, 0);
    assert.strictEqual(result1.qualityLevel, 'EXCELLENT');
    
    assert.strictEqual(result2.patterns.length, 0);
    assert.strictEqual(result2.severityScore, 0);
    assert.strictEqual(result2.qualityLevel, 'EXCELLENT');
  });

  test('should classify patterns by source correctly', () => {
    const terminalText = 'I cannot generate code for you.';
    const codeText = 'eval("test");';
    
    const terminalResult = patternDetector.analyzeText(terminalText);
    const codeResult = patternDetector.analyzeCode(codeText);
    
    assert.ok(terminalResult.patterns.every(p => p.source === 'terminal'));
    assert.ok(codeResult.patterns.every(p => p.source === 'code'));
  });

  test('should apply correct weights to different pattern categories', () => {
    // Security issues should have highest weight (25)
    const securityResult = patternDetector.analyzeCode('eval("test");');
    
    // Direct refusal should have high weight (20)
    const refusalResult = patternDetector.analyzeText('I cannot generate code for you.');
    
    // Production issues should have lower weight (10)
    const productionResult = patternDetector.analyzeCode('console.log("debug");');
    
    assert.ok(securityResult.severityScore > refusalResult.severityScore);
    assert.ok(refusalResult.severityScore > productionResult.severityScore);
  });
});