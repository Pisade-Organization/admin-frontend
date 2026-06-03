import test from 'node:test';
import assert from 'node:assert/strict';

import { getCollectionState } from '../overview.helpers.ts';

test('getCollectionState marks request failures as error', () => {
  assert.deepEqual(getCollectionState(null), { kind: 'error', data: [] });
});

test('getCollectionState marks empty arrays as empty', () => {
  assert.deepEqual(getCollectionState([]), { kind: 'empty', data: [] });
});

test('getCollectionState marks non-empty arrays as success', () => {
  assert.deepEqual(getCollectionState([{ id: 1 }]), {
    kind: 'success',
    data: [{ id: 1 }],
  });
});
