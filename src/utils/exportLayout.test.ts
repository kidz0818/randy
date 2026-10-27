import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

export function resolveExportFontSizes(lightboardState: {
  titleSize?: number;
  bodySize?: number;
  nameSize?: number;
  charSize?: number;
  layout?: 'single-char-loop' | 'vertical-tower' | 'classic-board';
  greetingColumns?: 1 | 2;
}) {
  const topNameFSize = lightboardState.nameSize || 42;
  const singleColFSize = lightboardState.titleSize || 42;
  const dualColTitleFSize = lightboardState.titleSize || 42;
  const dualColBodyFSize = lightboardState.bodySize || 36;
  const singleCharFSize = lightboardState.charSize || 340;

  return {
    topNameFSize,
    singleColFSize,
    dualColTitleFSize,
    dualColBodyFSize,
    singleCharFSize,
  };
}

describe('Export Layout Font Size Resolution', () => {
  it('strictly preserves custom user font sizes without artificial capping', () => {
    const customState = {
      titleSize: 62,
      bodySize: 54,
      nameSize: 52,
      charSize: 420,
    };

    const resolved = resolveExportFontSizes(customState);
    assert.equal(resolved.topNameFSize, 52);
    assert.equal(resolved.singleColFSize, 62);
    assert.equal(resolved.dualColTitleFSize, 62);
    assert.equal(resolved.dualColBodyFSize, 54);
    assert.equal(resolved.singleCharFSize, 420);
  });

  it('provides high quality defaults when sizes are omitted', () => {
    const emptyState = {};
    const resolved = resolveExportFontSizes(emptyState);
    assert.equal(resolved.topNameFSize, 42);
    assert.equal(resolved.singleColFSize, 42);
    assert.equal(resolved.dualColTitleFSize, 42);
    assert.equal(resolved.dualColBodyFSize, 36);
    assert.equal(resolved.singleCharFSize, 340);
  });
});
