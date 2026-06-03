import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildTransactionsSearch,
  normalizeTransactionPage,
  normalizeTransactionStatus,
  normalizeTransactionType,
} from '../transactions.helpers.ts';

test('buildTransactionsSearch serializes active filters and page', () => {
  assert.equal(
    buildTransactionsSearch({
      type: 'WITHDRAW',
      status: 'PENDING',
      q: 'wallet-1',
      dateFrom: '2026-06-01',
      dateTo: '2026-06-03',
      page: '2',
    }),
    'type=WITHDRAW&status=PENDING&q=wallet-1&dateFrom=2026-06-01&dateTo=2026-06-03&page=2',
  );
});

test('buildTransactionsSearch drops blank and default values', () => {
  assert.equal(
    buildTransactionsSearch({
      type: 'ALL',
      status: 'ALL',
      q: '   ',
      page: '1',
    }),
    '',
  );
});

test('transaction search normalizers fall back safely', () => {
  assert.equal(normalizeTransactionType('PAYMENT'), 'PAYMENT');
  assert.equal(normalizeTransactionType('BAD'), 'ALL');
  assert.equal(normalizeTransactionStatus('FAILED'), 'FAILED');
  assert.equal(normalizeTransactionStatus('BAD'), 'ALL');
  assert.equal(normalizeTransactionPage('3'), 3);
  assert.equal(normalizeTransactionPage('0'), 1);
});
