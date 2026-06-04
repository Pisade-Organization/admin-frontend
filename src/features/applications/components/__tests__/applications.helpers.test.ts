import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildApplicationDetailHref,
  buildApplicationsHref,
  buildApplicationsReturnHref,
  getApplicationsFlashMessage,
} from '../applications.helpers.ts';

test('buildApplicationsHref preserves filters while replacing page', () => {
  assert.equal(
    buildApplicationsHref(
      { q: 'ann', sort: 'oldest', status: 'APPROVED', page: '4' },
      { page: '2' },
    ),
    '/applications?q=ann&sort=oldest&status=APPROVED&page=2',
  );
});

test('buildApplicationsHref removes success params by default', () => {
  assert.equal(
    buildApplicationsHref(
      {
        q: 'ann',
        sort: 'oldest',
        status: 'APPROVED',
        page: '4',
        success: 'approved',
      },
      {},
    ),
    '/applications?q=ann&sort=oldest&status=APPROVED&page=4',
  );
});

test('buildApplicationDetailHref preserves list state in the detail url', () => {
  assert.equal(
    buildApplicationDetailHref('tutor-1', {
      q: 'ann',
      sort: 'oldest',
      status: 'REVIEWING',
      page: '3',
    }),
    '/applications/tutor-1?q=ann&sort=oldest&status=REVIEWING&page=3',
  );
});

test('buildApplicationsReturnHref removes flash params while preserving filters', () => {
  assert.equal(
    buildApplicationsReturnHref({
      q: 'ann',
      sort: 'oldest',
      status: 'REVIEWING',
      page: '3',
      success: 'approved',
      error: 'Could%20not%20update%20tutor%20status',
    }),
    '/applications?q=ann&sort=oldest&status=REVIEWING&page=3',
  );
});

test('getApplicationsFlashMessage maps success and error params', () => {
  assert.deepEqual(getApplicationsFlashMessage({ success: 'approved' }), {
    tone: 'success',
    text: 'Tutor approved.',
  });

  assert.deepEqual(
    getApplicationsFlashMessage({ error: 'Could%20not%20update%20tutor%20status' }),
    {
      tone: 'error',
      text: 'Could not update tutor status',
    },
  );
});
