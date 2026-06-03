import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildSettingsSearch,
  normalizeAuditPage,
  normalizeAuditValue,
  parseSettingsFlash,
  validateDiscountForm,
} from '../settings.helpers.ts';

test('parseSettingsFlash reads mutation results from search params', () => {
  assert.deepEqual(
    parseSettingsFlash({
      discountSuccess: 'created',
      discountMessage: 'Code created',
    }),
    { tone: 'success', message: 'Code created' },
  );
});

test('buildSettingsSearch preserves active audit filters and page', () => {
  assert.equal(
    buildSettingsSearch({
      entity: 'DISCOUNT_CODE',
      action: 'DELETE',
      actor: 'ops@example.com',
      page: '2',
    }),
    'entity=DISCOUNT_CODE&action=DELETE&actor=ops%40example.com&page=2',
  );
});

test('validateDiscountForm rejects missing code amount and expiry', () => {
  assert.deepEqual(
    validateDiscountForm({ code: '', amount: '', expiresAt: '' }),
    {
      code: 'Code is required',
      amount: 'Amount must be greater than 0',
      expiresAt: 'Expiry is required',
    },
  );
});

test('settings normalizers trim and default safely', () => {
  assert.equal(normalizeAuditValue(' discount_code '), 'discount_code');
  assert.equal(normalizeAuditValue(), 'ALL');
  assert.equal(normalizeAuditPage('5'), 5);
  assert.equal(normalizeAuditPage('-1'), 1);
});
