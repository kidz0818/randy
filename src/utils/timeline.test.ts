import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateEffectiveDuration,
  calculateTotalRuntime,
  parseScriptText,
  parseJsonScript,
} from './timeline';
import { ChatMessage } from '../types/chat';

test('calculateEffectiveDuration handles speed multipliers correctly', () => {
  assert.equal(calculateEffectiveDuration(1.0, 1), 1.0);
  assert.equal(calculateEffectiveDuration(1.0, 2), 0.5);
  assert.equal(calculateEffectiveDuration(1.0, 0.5), 2.0);
  // Negative or zero fallback
  assert.equal(calculateEffectiveDuration(1.0, 0), 1.0);
});

test('calculateTotalRuntime accumulates intervals and tail buffer', () => {
  const messages: ChatMessage[] = [
    {
      id: '1',
      username: 'A',
      avatarUrl: '',
      type: 'normal',
      message: 'Hi',
      entranceEffect: 'slide-right',
      entranceDuration: 0.5,
      delayBeforeNext: 1.0,
    },
    {
      id: '2',
      username: 'B',
      avatarUrl: '',
      type: 'normal',
      message: 'Hello',
      entranceEffect: 'slide-right',
      entranceDuration: 0.5,
      delayBeforeNext: 1.5,
    },
  ];

  // At 1x: 1.0 + 1.5 + 2.0 buffer = 4.5s
  const runtime1x = calculateTotalRuntime(messages, 1);
  assert.equal(runtime1x, 4.5);

  // At 2x: (1.0 + 1.5 + 2.0) / 2 = 2.25s
  const runtime2x = calculateTotalRuntime(messages, 2);
  assert.equal(runtime2x, 2.25);
});

test('parseScriptText parses bracketed superchats and members', () => {
  const rawText = `
[Alice:SC5:$50] Great job!
[Bob:MEMBER] Let's go!
Simple viewer message
  `;

  const parsed = parseScriptText(rawText);
  assert.equal(parsed.length, 3);

  // Item 1
  assert.equal(parsed[0].username, 'Alice');
  assert.equal(parsed[0].type, 'superchat');
  assert.equal(parsed[0].scTier, 5);
  assert.equal(parsed[0].amount, '$50');
  assert.equal(parsed[0].message, 'Great job!');

  // Item 2
  assert.equal(parsed[1].username, 'Bob');
  assert.equal(parsed[1].type, 'member');
  assert.equal(parsed[1].badge?.type, 'member');
  assert.equal(parsed[1].message, "Let's go!");

  // Item 3
  assert.equal(parsed[2].username, 'Viewer');
  assert.equal(parsed[2].type, 'normal');
  assert.equal(parsed[2].message, 'Simple viewer message');
});

test('parseJsonScript handles JSON array and objects with messages', () => {
  const jsonArray = JSON.stringify([
    {
      username: 'StreamerFan',
      message: 'Great stream!',
      type: 'superchat',
      scTier: 5,
      amount: '$50.00',
    },
    {
      username: 'CatGirl',
      message: 'Meow meow',
      type: 'normal',
    },
  ]);

  const parsed1 = parseJsonScript(jsonArray);
  assert.equal(parsed1.length, 2);
  assert.equal(parsed1[0].username, 'StreamerFan');
  assert.equal(parsed1[0].scTier, 5);
  assert.equal(parsed1[0].amount, '$50.00');
  assert.equal(parsed1[1].username, 'CatGirl');

  // Object wrapper with messages
  const jsonObject = JSON.stringify({
    messages: [
      {
        username: 'VIP_Member',
        message: 'Hello everyone!',
        type: 'member',
      },
    ],
  });

  const parsed2 = parseJsonScript(jsonObject);
  assert.equal(parsed2.length, 1);
  assert.equal(parsed2[0].username, 'VIP_Member');
  assert.equal(parsed2[0].type, 'member');

  // Throws on invalid JSON
  assert.throws(() => parseJsonScript('invalid json syntax'));
});

