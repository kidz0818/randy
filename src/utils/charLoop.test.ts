import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { segmentGreetingToChars, getNextLoopIndex } from './charLoop';

describe('charLoop utilities', () => {
  it('segments Japanese greeting into individual characters', () => {
    const tokens = segmentGreetingToChars(
      'ユノち、おめでとう',
      '素敵な一年',
      'randyseionn より'
    );
    assert.ok(tokens.length > 10);
    assert.equal(tokens[0].char, 'ユ');
    assert.equal(tokens[0].section, 'title');
    assert.equal(tokens[1].char, 'ノ');
    assert.equal(tokens[3].isPunctuation, true); // '、'
  });

  it('keeps latin words like randyseionn together if splitLatinWords is false', () => {
    const tokens = segmentGreetingToChars('A', 'B', 'randyseionn より', false);
    const senderTokens = tokens.filter((t) => t.section === 'sender');
    assert.equal(senderTokens[0].char, 'randyseionn');
    assert.equal(senderTokens[1].char, 'よ');
    assert.equal(senderTokens[2].char, 'り');
  });

  it('splits latin words letter by letter if splitLatinWords is true', () => {
    const tokens = segmentGreetingToChars('A', 'B', 'randy', true);
    const senderTokens = tokens.filter((t) => t.section === 'sender');
    assert.equal(senderTokens.length, 5);
    assert.equal(senderTokens[0].char, 'r');
    assert.equal(senderTokens[4].char, 'y');
  });

  it('correctly wraps loop indices', () => {
    assert.equal(getNextLoopIndex(0, 10, 1), 1);
    assert.equal(getNextLoopIndex(9, 10, 1), 0); // loop wrap
    assert.equal(getNextLoopIndex(0, 10, -1), 9); // backward wrap
  });
});
