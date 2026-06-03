import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeAvatarSrc } from '../avatar.ts';

test('normalizeAvatarSrc accepts absolute https URLs', () => {
  assert.equal(
    normalizeAvatarSrc('https://cdn.example.com/avatar.png'),
    'https://cdn.example.com/avatar.png',
  );
});

test('normalizeAvatarSrc trims whitespace around URLs', () => {
  assert.equal(
    normalizeAvatarSrc('  https://cdn.example.com/avatar.png  '),
    'https://cdn.example.com/avatar.png',
  );
});

test('normalizeAvatarSrc preserves local absolute paths', () => {
  assert.equal(normalizeAvatarSrc('/avatars/admin.png'), '/avatars/admin.png');
});

test('normalizeAvatarSrc rejects empty and invalid URLs', () => {
  assert.equal(normalizeAvatarSrc(''), null);
  assert.equal(normalizeAvatarSrc('not-a-url'), null);
  assert.equal(normalizeAvatarSrc('javascript:alert(1)'), null);
});
