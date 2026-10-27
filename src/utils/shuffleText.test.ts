import test from 'node:test';
import assert from 'node:assert/strict';
import { getScrambledText } from './shuffleText';

test('getScrambledText returns targetText when progress is 1 or greater', () => {
  const target = 'ユノち、お誕生日おめでとう';
  const result = getScrambledText(target, 1.0, 42);
  assert.equal(result, target);

  const resultOver = getScrambledText(target, 1.5, 99);
  assert.equal(resultOver, target);
});

test('getScrambledText preserves spaces and newlines during scrambling', () => {
  const target = 'Line 1\nLine 2';
  const result = getScrambledText(target, 0.5, 12);
  assert.equal(result.includes('\n'), true);
  assert.equal(result.length, target.length);
});

test('getScrambledText progressively locks characters from left to right', () => {
  const target = 'ABCDEFG';
  const halfProgress = getScrambledText(target, 0.5, 7);
  // First 3 characters should be locked to 'ABC'
  assert.equal(halfProgress.startsWith('ABC'), true);
});
