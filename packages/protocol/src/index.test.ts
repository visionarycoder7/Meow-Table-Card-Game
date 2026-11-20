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
