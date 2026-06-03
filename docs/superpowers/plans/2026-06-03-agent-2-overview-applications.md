# Agent 2 Overview And Applications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add truthful empty/error/partial-failure handling to Overview and add empty/error/success/pagination behavior to Applications without changing backend semantics.

**Architecture:** Keep state handling local to the affected feature modules. Extract small pure helpers for parsing flash params, building preserved query-string links, and deriving section state so behavior is testable without introducing a broad client-state layer.

**Tech Stack:** Next.js App Router, TypeScript, server components, server actions, Node `node:test`, ESLint

---

### Task 1: Add testable helper coverage for Applications and Overview state helpers

**Files:**
- Create: `admin/src/features/applications/components/applications.helpers.ts`
- Create: `admin/src/features/applications/components/__tests__/applications.helpers.test.ts`
- Create: `admin/src/features/overview/components/overview.helpers.ts`
- Create: `admin/src/features/overview/components/__tests__/overview.helpers.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildApplicationsHref,
  getApplicationsFlashMessage,
} from '../applications.helpers.ts';

test('buildApplicationsHref preserves filters while replacing page', () => {
  assert.equal(
    buildApplicationsHref({ q: 'ann', sort: 'oldest', status: 'APPROVED', page: '4' }, { page: '2' }),
    '/applications?q=ann&sort=oldest&status=APPROVED&page=2',
  );
});

test('getApplicationsFlashMessage maps success and error params', () => {
  assert.deepEqual(
    getApplicationsFlashMessage({ success: 'approved' }),
    { tone: 'success', text: 'Tutor approved.' },
  );
  assert.deepEqual(
    getApplicationsFlashMessage({ error: 'Could%20not%20update%20tutor%20status' }),
    { tone: 'error', text: 'Could not update tutor status' },
  );
});
```

```ts
import test from 'node:test';
import assert from 'node:assert/strict';

import { getCollectionState } from '../overview.helpers.ts';

test('getCollectionState marks request failures as error', () => {
  assert.deepEqual(getCollectionState(null), { kind: 'error', data: [] });
});

test('getCollectionState marks empty arrays as empty', () => {
  assert.deepEqual(getCollectionState([]), { kind: 'empty', data: [] });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts admin/src/features/overview/components/__tests__/overview.helpers.test.ts`
Expected: FAIL with module-not-found errors for the new helper files.

- [ ] **Step 3: Write minimal helper implementations**

```ts
export function buildApplicationsHref(...) { ... }
export function getApplicationsFlashMessage(...) { ... }
```

```ts
export function getCollectionState<T>(value: T[] | null) {
  if (value === null) return { kind: 'error', data: [] as T[] };
  if (value.length === 0) return { kind: 'empty', data: value };
  return { kind: 'success', data: value };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts admin/src/features/overview/components/__tests__/overview.helpers.test.ts`
Expected: PASS

### Task 2: Implement truthful section states on Overview

**Files:**
- Modify: `admin/src/features/overview/components/OverviewPage.tsx`
- Modify: `admin/src/features/overview/components/highlights-section/index.tsx`
- Modify: `admin/src/features/overview/components/highlights-section/highlightData.ts`
- Modify: `admin/src/features/overview/components/overview.helpers.ts`

- [ ] **Step 1: Write the failing helper tests for section-state edge cases**

```ts
test('getCollectionState marks non-empty arrays as success', () => {
  assert.deepEqual(getCollectionState([{ id: 1 }]), {
    kind: 'success',
    data: [{ id: 1 }],
  });
});
```

- [ ] **Step 2: Run the targeted overview helper test**

Run: `node --test admin/src/features/overview/components/__tests__/overview.helpers.test.ts`
Expected: FAIL until the helper handles non-empty values.

- [ ] **Step 3: Implement Overview rendering against explicit section states**

```tsx
const revenueState = getCollectionState(revenueChart);
const lessonState = getCollectionState(lessonsChart);
```

Render:
- stats error message when stats are unavailable
- revenue empty vs error copy
- lesson empty vs error copy
- highlight error banner if public highlight fetch fails
- updated labels `Platform Revenue (MTD)` and `Active Users (30d)`

- [ ] **Step 4: Run the overview helper test again**

Run: `node --test admin/src/features/overview/components/__tests__/overview.helpers.test.ts`
Expected: PASS

### Task 3: Implement Applications empty/error/success/pagination behavior

**Files:**
- Modify: `admin/src/features/applications/components/ApplicationsPage.tsx`
- Modify: `admin/src/features/applications/components/application-card.tsx`
- Modify: `admin/src/features/applications/components/applications.data.ts`
- Modify: `admin/src/features/applications/components/applications.helpers.ts`

- [ ] **Step 1: Expand the failing Applications helper tests**

```ts
test('buildApplicationsHref removes success params by default', () => {
  assert.equal(
    buildApplicationsHref(
      { q: 'ann', sort: 'oldest', status: 'APPROVED', page: '4', success: 'approved' },
      {},
    ),
    '/applications?q=ann&sort=oldest&status=APPROVED&page=4',
  );
});
```

- [ ] **Step 2: Run the targeted Applications helper test**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts`
Expected: FAIL until the helper strips transient flash params correctly.

- [ ] **Step 3: Implement Applications page behavior**

```tsx
const flash = getApplicationsFlashMessage(searchParams);
const paginationHref = buildApplicationsHref(searchParams, { page: String(page + 1) });
```

Render:
- inline success/error banner
- explicit fetch failure state
- explicit empty filtered-results state
- previous/next pagination controls

Update the server action to:
- preserve `q`, `sort`, `status`, `page`
- redirect with `success=approved|rejected|suspended`
- redirect with URL-encoded `error=<message>` on failure

- [ ] **Step 4: Run the Applications helper test again**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts`
Expected: PASS

### Task 4: Verify the admin app

**Files:**
- Verify only

- [ ] **Step 1: Run helper tests**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts admin/src/features/overview/components/__tests__/overview.helpers.test.ts`
Expected: PASS

- [ ] **Step 2: Run lint**

Run: `cd admin && npm run lint`
Expected: PASS

- [ ] **Step 3: Run production build**

Run: `cd admin && npm run build`
Expected: PASS
