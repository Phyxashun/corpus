// FILE-PATH: tests/validator.test.ts

import { describe, expect, test } from 'bun:test';
import { validateDirectory, validateGlobInput } from '../src/utils/validator';

describe('validateDirectory', () => {
  test('rejects empty/whitespace-only input', () => {
    expect(validateDirectory('')).toBeDefined();
    expect(validateDirectory('   ')).toBeDefined();
  });

  test('rejects input containing spaces', () => {
    expect(validateDirectory('my folder')).toBeDefined();
  });

  test('rejects input containing illegal path characters', () => {
    for (const bad of ['a<b', 'a>b', 'a:b', 'a"b', 'a|b', 'a?b', 'a*b']) {
      expect(validateDirectory(bad)).toBeDefined();
    }
  });

  test('accepts a valid directory name', () => {
    expect(validateDirectory('ALL_REBUILT')).toBeUndefined();
  });
});

describe('validateGlobInput', () => {
  test('rejects empty/whitespace-only input', () => {
    expect(validateGlobInput('')).toBeDefined();
    expect(validateGlobInput('   ')).toBeDefined();
  });

  test('rejects glob lists with blank entries', () => {
    expect(validateGlobInput(',foo')).toBeDefined();
    expect(validateGlobInput('foo,,bar')).toBeDefined();
    expect(validateGlobInput('foo,')).toBeDefined();
  });

  test('accepts a valid glob list', () => {
    expect(validateGlobInput('**/*.ts,**/*.js')).toBeUndefined();
  });
});
