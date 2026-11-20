import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRoomCode, normalizeRoomCode, parseRoomCommand } from './index.ts';

test('room creation and join use the same code alphabet', () => {
  assert.equal(normalizeRoomCode(' ab3d9xya '), 'AB3D9XYA');
  assert.equal(normalizeRoomCode('ABC0DEFI'), null);
  for (let index = 0; index < 100; index++) {
    const code = createRoomCode();
    assert.equal(normalizeRoomCode(code), code);
  }
});

test('room commands validate types, names, and message size', () => {
  assert.deepEqual(parseRoomCommand('{"type":"enter","name":"  Asha  "}'), { type: 'enter', name: 'Asha' });
  assert.deepEqual(parseRoomCommand('{"type":"lock","locked":false}'), { type: 'lock', locked: false });
  for (const message of ['{', 'null', '{"type":"start"}', '{"type":"lock","locked":"true"}',
    '{"type":"enter","name":" "}', JSON.stringify({ type: 'enter', name: 'a'.repeat(257) })]) {
    assert.equal(parseRoomCommand(message), null);
  }
  assert.equal(parseRoomCommand(new ArrayBuffer(8)), null);
});

test('effect choices require a valid suit, target, and match revision', () => {
  const parse = (command: object) => parseRoomCommand(JSON.stringify(command));
  const targetSeatId = '00000000-0000-4000-8000-000000000001';
  assert.deepEqual(parse({ type: 'play', revision: 8, cardId: 100, targetSeatId }),
    { type: 'play', revision: 8, cardId: 100, suit: undefined, targetSeatId });
  assert.equal(parse({ type: 'play', revision: 8, cardId: 100, suit: 'purple' }), null);
  assert.equal(parse({ type: 'play', revision: 8, cardId: 100, targetSeatId: 'other' }), null);
  assert.equal(parse({ type: 'respond-pounce', revision: 8, choice: 'pass' }), null);
  assert.equal(parse({ type: 'respond-pounce', revision: -1, choice: 'draw' }), null);
  assert.deepEqual(parse({ type: 'respond-pounce', revision: 8, choice: 'give' }),
    { type: 'respond-pounce', revision: 8, choice: 'give' });
});

test('only an explicit true flag enables Deep Draw', () => {
  assert.deepEqual(parseRoomCommand('{"type":"draw","revision":4,"deep":true}'),
    { type: 'draw', revision: 4, deep: true });
  assert.equal(parseRoomCommand('{"type":"draw","revision":4,"deep":"true"}'), null);
  assert.deepEqual(parseRoomCommand('{"type":"draw","revision":4}'), { type: 'draw', revision: 4 });
});
