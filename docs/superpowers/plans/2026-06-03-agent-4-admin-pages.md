# Agent 4 Admin Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Transactions and Settings admin pages with real filtering, pagination, explicit request states, and visible mutation feedback, including backend support where the current contracts are too thin.

**Architecture:** Extend the Nest admin service/controller first so the frontend can rely on stable query contracts for transactions and audit logs. Then keep the admin app server-rendered, using small tested helpers for query-state management and redirect-based flash messaging instead of client-heavy state management.

**Tech Stack:** Next.js 16 server components and server actions, TypeScript, NestJS, Prisma, Jest, Node test runner.

---

### Task 1: Backend transaction query coverage

**Files:**
- Modify: `../backend/src/admin/admin.service.spec.ts`
- Test: `../backend/src/admin/admin.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('filters transactions by type, status, query, and date range', async () => {
  prismaMock.transaction.findMany.mockResolvedValue([]);
  prismaMock.transaction.count.mockResolvedValue(0);

  await service.getTransactions({
    type: 'WITHDRAW',
    status: 'PENDING',
    q: 'wallet-1',
    dateFrom: '2026-06-01',
    dateTo: '2026-06-03',
    limit: 25,
    page: 2,
  });

  expect(prismaMock.transaction.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        type: TransactionType.WITHDRAW,
        status: TransactionStatus.PENDING,
        createdAt: expect.objectContaining({
          gte: expect.any(Date),
          lte: expect.any(Date),
        }),
        OR: expect.any(Array),
      }),
      skip: 25,
      take: 25,
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- admin.service.spec.ts --runInBand`
Expected: FAIL because `getTransactions` still accepts positional args and does not build the richer filter object.

- [ ] **Step 3: Write minimal implementation**

```ts
type GetTransactionsParams = {
  type?: string;
  status?: string;
  q?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
  page?: number;
};
```

Add a query-normalization path in `../backend/src/admin/admin.service.ts` so `getTransactions` accepts a single params object and builds Prisma `where` input from it.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- admin.service.spec.ts --runInBand`
Expected: PASS for the new transaction filter test.

- [ ] **Step 5: Commit**

```bash
git add ../backend/src/admin/admin.service.spec.ts ../backend/src/admin/admin.service.ts ../backend/src/admin/admin.controller.ts
git commit -m "add admin transaction filters"
```

### Task 2: Backend finance row enrichment and audit-log filters

**Files:**
- Modify: `../backend/src/admin/admin.service.spec.ts`
- Modify: `../backend/src/admin/admin.service.ts`
- Modify: `../backend/src/admin/admin.controller.ts`
- Test: `../backend/src/admin/admin.service.spec.ts`

- [ ] **Step 1: Write the failing tests**

```ts
it('includes related wallet, tutor, and student context in transactions', async () => {
  prismaMock.transaction.findMany.mockResolvedValue([
    {
      id: 'txn-1',
      walletId: 'wallet-1',
      type: TransactionType.WITHDRAW,
      status: TransactionStatus.PENDING,
      amount: 1200,
      fee: 50,
      reference: 'ref-1',
      providerRef: 'provider-1',
      createdAt: new Date('2026-06-03T10:00:00.000Z'),
      wallet: {
        id: 'wallet-1',
        tutor: { id: 'tutor-1', user: { id: 'user-1', email: 'tutor@example.com', fullName: 'Tutor One', profile: null } },
        student: null,
      },
    },
  ]);
  prismaMock.transaction.count.mockResolvedValue(1);

  const result = await service.getTransactions({ page: 1, limit: 25 });

  expect(result.transactions[0].wallet).toEqual(
    expect.objectContaining({ id: 'wallet-1' }),
  );
  expect(result.transactions[0].relatedTutor).toEqual(
    expect.objectContaining({ id: 'tutor-1' }),
  );
});
```

```ts
it('filters audit logs by entity, action, actor, and page', async () => {
  prismaMock.auditLog.findMany.mockResolvedValue([]);
  prismaMock.auditLog.count.mockResolvedValue(0);

  await service.getAuditLogs({
    entity: 'DISCOUNT_CODE',
    action: 'DELETE',
    actor: 'ops@example.com',
    limit: 20,
    page: 3,
  });

  expect(prismaMock.auditLog.findMany).toHaveBeenCalledWith(
    expect.objectContaining({
      where: expect.objectContaining({
        entity: 'DISCOUNT_CODE',
        action: { contains: 'DELETE', mode: 'insensitive' },
      }),
      skip: 40,
      take: 20,
    }),
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- admin.service.spec.ts --runInBand`
Expected: FAIL because transactions are not enriched and audit logs only accept a single `entity` filter.

- [ ] **Step 3: Write minimal implementation**

```ts
include: {
  wallet: {
    include: {
      tutor: { include: { user: { include: { profile: true } } } },
      student: { include: { user: { include: { profile: true } } } },
    },
  },
}
```

Return `page` and `totalPages` from `getAuditLogs`, and update the controller query signature for the new params.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- admin.service.spec.ts --runInBand`
Expected: PASS for the new enrichment and audit-log tests.

- [ ] **Step 5: Commit**

```bash
git add ../backend/src/admin/admin.service.spec.ts ../backend/src/admin/admin.service.ts ../backend/src/admin/admin.controller.ts
git commit -m "enrich admin finance and audit responses"
```

### Task 3: Admin helper tests for query and flash state

**Files:**
- Create: `src/features/transactions/components/transactions.helpers.ts`
- Create: `src/features/transactions/components/__tests__/transactions.helpers.test.ts`
- Create: `src/features/settings/components/settings.helpers.ts`
- Create: `src/features/settings/components/__tests__/settings.helpers.test.ts`
- Test: `src/features/transactions/components/__tests__/transactions.helpers.test.ts`
- Test: `src/features/settings/components/__tests__/settings.helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
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
```

```ts
test('parseSettingsFlash reads mutation results from search params', () => {
  assert.deepEqual(
    parseSettingsFlash({
      discountSuccess: 'created',
      discountMessage: 'Code created',
    }),
    { tone: 'success', message: 'Code created' },
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/features/transactions/components/__tests__/transactions.helpers.test.ts src/features/settings/components/__tests__/settings.helpers.test.ts`
Expected: FAIL because the helper modules do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```ts
export function buildTransactionsSearch(input: TransactionsSearchInput) {
  const params = new URLSearchParams();
  // set only non-empty values
  return params.toString();
}
```

```ts
export function parseSettingsFlash(searchParams?: Record<string, string | undefined>) {
  // map redirect query params to a displayable flash object
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test src/features/transactions/components/__tests__/transactions.helpers.test.ts src/features/settings/components/__tests__/settings.helpers.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/components/transactions.helpers.ts src/features/transactions/components/__tests__/transactions.helpers.test.ts src/features/settings/components/settings.helpers.ts src/features/settings/components/__tests__/settings.helpers.test.ts
git commit -m "add admin page query helpers"
```

### Task 4: Transactions page implementation

**Files:**
- Modify: `src/features/transactions/components/TransactionsPage.tsx`
- Modify: `src/features/transactions/components/transactions.helpers.ts`
- Test: `src/features/transactions/components/__tests__/transactions.helpers.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
test('buildTransactionsSearch drops blank values and keeps pagination reset behavior', () => {
  assert.equal(
    buildTransactionsSearch({ type: 'ALL', status: 'ALL', q: '   ', page: '1' }),
    '',
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/features/transactions/components/__tests__/transactions.helpers.test.ts`
Expected: FAIL until the helper matches the page behavior.

- [ ] **Step 3: Write minimal implementation**

```tsx
const ledgerState = await fetchAdminApi<TransactionsPayload>(url)
  .then((data) => ({ kind: 'success' as const, data }))
  .catch((error) => ({ kind: 'error' as const, message: error instanceof Error ? error.message : 'Failed to load transactions' }));
```

Render:
- filter form with `type`, `status`, `q`, `dateFrom`, `dateTo`
- explicit ledger error box
- explicit empty state
- pagination links built from current filters
- related entity links when transaction context exists

- [ ] **Step 4: Run test and build verification**

Run: `node --test src/features/transactions/components/__tests__/transactions.helpers.test.ts`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/transactions/components/TransactionsPage.tsx src/features/transactions/components/transactions.helpers.ts src/features/transactions/components/__tests__/transactions.helpers.test.ts
git commit -m "upgrade admin transactions page"
```

### Task 5: Settings page implementation

**Files:**
- Modify: `src/features/settings/components/SettingsPage.tsx`
- Modify: `src/features/settings/components/settings.helpers.ts`
- Test: `src/features/settings/components/__tests__/settings.helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
test('validateDiscountForm rejects missing code amount and expiry', () => {
  assert.deepEqual(
    validateDiscountForm({ code: '', amount: '', expiresAt: '' }),
    { code: 'Code is required', amount: 'Amount must be greater than 0', expiresAt: 'Expiry is required' },
  );
});
```

```ts
test('buildSettingsSearch preserves filters across mutation redirects', () => {
  assert.equal(
    buildSettingsSearch({ entity: 'DISCOUNT_CODE', action: 'DELETE', actor: 'ops@example.com', page: '2' }),
    'entity=DISCOUNT_CODE&action=DELETE&actor=ops%40example.com&page=2',
  );
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test src/features/settings/components/__tests__/settings.helpers.test.ts`
Expected: FAIL because validation and search builders do not exist yet.

- [ ] **Step 3: Write minimal implementation**

```tsx
if (Object.keys(errors).length) {
  redirect(`/settings?${buildSettingsSearch(...)}&discountError=validation&discountMessage=${encodeURIComponent(message)}`);
}
```

Add:
- validation for create action
- error handling around create/delete API calls
- confirmation prompt on delete button
- flash banner rendering
- audit-log filter form with `entity`, `action`, `actor`
- audit-log pagination and richer actor/entity display

- [ ] **Step 4: Run test and build verification**

Run: `node --test src/features/settings/components/__tests__/settings.helpers.test.ts`
Expected: PASS

Run: `npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/features/settings/components/SettingsPage.tsx src/features/settings/components/settings.helpers.ts src/features/settings/components/__tests__/settings.helpers.test.ts
git commit -m "improve admin settings page states"
```

### Task 6: End-to-end verification for Agent 4 scope

**Files:**
- Modify: `docs/superpowers/plans/2026-06-03-agent-4-admin-pages.md`

- [ ] **Step 1: Run backend admin tests**

Run: `npm test -- admin.service.spec.ts --runInBand`
Workdir: `../backend`
Expected: PASS

- [ ] **Step 2: Run admin helper tests**

Run: `node --test src/features/transactions/components/__tests__/transactions.helpers.test.ts src/features/settings/components/__tests__/settings.helpers.test.ts`
Workdir: `.`
Expected: PASS

- [ ] **Step 3: Run admin production build**

Run: `npm run build`
Workdir: `.`
Expected: PASS

- [ ] **Step 4: Update plan checkboxes**

Mark completed tasks in this plan after verification output is clean.

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/plans/2026-06-03-agent-4-admin-pages.md
git commit -m "document agent 4 verification"
```
