import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('./TutorsPage.tsx', import.meta.url), 'utf8');

test('restricted tutor cards expose an ellipsis restore action', () => {
  assert.match(source, /MoreHorizontal/);
  assert.match(source, /Change to approved/);
});
