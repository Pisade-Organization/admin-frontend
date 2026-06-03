# Admin Shell Agent 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a server-enforced admin session gate, replace mocked shell identity with live admin data, disable placeholder notification controls, and introduce shared admin page-state primitives for loading/empty/error conventions.

**Architecture:** The `(dashboard)` layout remains the shell boundary but becomes a server component that resolves the current admin identity from `GET /v1/me` and redirects when the session is missing or unauthorized. Shared request-error types and shell-state components live under `src/shared` so page-specific work can adopt them incrementally without duplicating patterns.

**Tech Stack:** Next.js App Router, React 19, TypeScript, server components, Tailwind CSS, Node test runner

---

### Task 1: Add failing helper tests for auth-aware admin API behavior

**Files:**
- Create: `admin/src/shared/lib/__tests__/adminApi.test.ts`
- Modify: `admin/src/shared/lib/adminApi.ts`

- [ ] **Step 1: Write the failing test**

```ts
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AdminApiError,
  createAdminApiError,
  getAdminShellUser,
  isAdminAuthError,
} from '@/shared/lib/adminApi';

test('marks 401 and 403 responses as auth errors', () => {
  const unauthorized = createAdminApiError({
    message: 'Unauthorized',
    status: 401,
    code: 'ADMIN_AUTH_REQUIRED',
  });
  const forbidden = createAdminApiError({
    message: 'Forbidden',
    status: 403,
    code: 'ADMIN_FORBIDDEN',
  });

  assert.equal(unauthorized instanceof AdminApiError, true);
  assert.equal(forbidden instanceof AdminApiError, true);
  assert.equal(isAdminAuthError(unauthorized), true);
  assert.equal(isAdminAuthError(forbidden), true);
});

test('returns null shell user when token is missing', async () => {
  const result = await getAdminShellUser({
    getAccessToken: async () => null,
    fetchProfile: async () => {
      throw new Error('should not be called');
    },
  });

  assert.equal(result, null);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd admin && node --test src/shared/lib/__tests__/adminApi.test.ts`
Expected: FAIL because `AdminApiError`, `createAdminApiError`, `isAdminAuthError`, and `getAdminShellUser` do not exist yet.

- [ ] **Step 3: Write minimal implementation**

Add the missing exports to `admin/src/shared/lib/adminApi.ts`:

```ts
export class AdminApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code: string,
  ) {
    super(message);
    this.name = 'AdminApiError';
  }
}

export function createAdminApiError(input: {
  message: string;
  status: number;
  code?: string;
}) {
  const code =
    input.code ??
    (input.status === 401
      ? 'ADMIN_AUTH_REQUIRED'
      : input.status === 403
        ? 'ADMIN_FORBIDDEN'
        : 'ADMIN_REQUEST_FAILED');

  return new AdminApiError(input.message, input.status, code);
}

export function isAdminAuthError(error: unknown) {
  return (
    error instanceof AdminApiError &&
    (error.status === 401 || error.status === 403)
  );
}

export async function getAdminShellUser(
  deps: {
    getAccessToken?: () => Promise<string | null>;
    fetchProfile?: () => Promise<AdminProfileResponse>;
  } = {},
) {
  const accessToken = await (deps.getAccessToken ?? getAdminAccessToken)();

  if (!accessToken) {
    return null;
  }

  const profile = await (deps.fetchProfile ?? (() => fetchAdminApi('/v1/me')))();
  return normalizeAdminShellUser(profile);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd admin && node --test src/shared/lib/__tests__/adminApi.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd admin
git add src/shared/lib/adminApi.ts src/shared/lib/__tests__/adminApi.test.ts
git commit -m "add admin shell api helpers"
```

### Task 2: Gate dashboard routes and pass live admin identity into shell components

**Files:**
- Modify: `admin/src/app/(dashboard)/layout.tsx`
- Modify: `admin/src/shared/components/layout/MobileDashboardHeader.tsx`
- Delete: `admin/src/shared/mocks/currentUser.ts`

- [ ] **Step 1: Write the failing test**

Manual failure target:

```txt
Open any dashboard route without an admin token.
Current behavior: dashboard shell still renders and mobile header shows Pisade Admin mock data.
Target behavior: route redirects before rendering shell; when token exists, real name/email/avatar render.
```

- [ ] **Step 2: Verify the failure**

Run: `cd admin && npm run build`
Expected: PASS build, but current runtime behavior still lacks redirect and uses mock shell data.

- [ ] **Step 3: Write minimal implementation**

In `admin/src/app/(dashboard)/layout.tsx`, convert the layout to an async server component:

```tsx
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import MobileDashboardHeader from '@/shared/components/layout/MobileDashboardHeader';
import Sidebar, { type SidebarItem } from '@/shared/components/layout/Sidebar';
import { getAdminShellUser } from '@/shared/lib/adminApi';

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const shellUser = await getAdminShellUser().catch((error) => {
    if (isAdminAuthError(error)) {
      redirect('/');
    }

    throw error;
  });

  if (!shellUser) {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <div className="flex min-h-screen flex-col md:flex-row">
        <MobileDashboardHeader items={navigationItems} user={shellUser} />
        <Sidebar items={navigationItems} />
        <main className="flex flex-1 flex-col p-4 md:min-h-screen md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
```

In `admin/src/shared/components/layout/MobileDashboardHeader.tsx`, replace `currentUserMock` usage with a `user` prop and render `user.avatarSrc`, `user.name`, and `user.email`.

- [ ] **Step 4: Run verification**

Run: `cd admin && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd admin
git add src/app/\(dashboard\)/layout.tsx src/shared/components/layout/MobileDashboardHeader.tsx
git rm src/shared/mocks/currentUser.ts
git commit -m "use real admin shell session data"
```

### Task 3: Introduce shared admin state primitives and disable notification controls

**Files:**
- Create: `admin/src/shared/components/admin-state/AdminStateCard.tsx`
- Create: `admin/src/shared/components/admin-state/AdminPageErrorState.tsx`
- Create: `admin/src/shared/components/admin-state/AdminEmptyState.tsx`
- Create: `admin/src/shared/components/admin-state/AdminPartialFailureNotice.tsx`
- Modify: `admin/src/shared/components/layout/MobileDashboardHeader.tsx`

- [ ] **Step 1: Write the failing test**

Manual failure target:

```txt
The admin app has no reusable request-state components and the bell buttons are interactive even though notifications do not exist.
```

- [ ] **Step 2: Verify the failure**

Run: `cd admin && npm run build`
Expected: PASS build, but no shared state primitives exist and bell buttons are still live controls.

- [ ] **Step 3: Write minimal implementation**

Add a shared admin state folder with a common card wrapper and focused components. Example base component:

```tsx
type AdminStateCardProps = {
  title: string;
  description: string;
  tone?: 'neutral' | 'danger' | 'warning';
  action?: ReactNode;
};

export default function AdminStateCard({
  title,
  description,
  tone = 'neutral',
  action,
}: AdminStateCardProps) {
  const toneClass =
    tone === 'danger'
      ? 'border-red-200 bg-red-50'
      : tone === 'warning'
        ? 'border-amber-200 bg-amber-50'
        : 'border-stone-200 bg-white';

  return (
    <div className={`rounded-[24px] border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${toneClass}`}>
      <h2 className="text-label-2 text-stone-950">{title}</h2>
      <p className="mt-2 text-body-3 text-stone-600">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
```

Then make both bell buttons in `MobileDashboardHeader`:

```tsx
<button
  type="button"
  disabled
  aria-disabled="true"
  aria-label="Notifications are not available yet"
  title="Notifications are not available yet"
  className="cursor-not-allowed rounded-[8px] p-2 opacity-50"
>
  <Bell className="h-5 w-5 text-white" />
</button>
```

- [ ] **Step 4: Run verification**

Run: `cd admin && npm run build`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd admin
git add src/shared/components/admin-state src/shared/components/layout/MobileDashboardHeader.tsx
git commit -m "add admin shared state components"
```

### Task 4: Finish verification for Agent 1 scope

**Files:**
- Verify only

- [ ] **Step 1: Run focused helper tests**

Run: `cd admin && node --test src/shared/lib/__tests__/adminApi.test.ts src/shared/lib/__tests__/avatar.test.ts`
Expected: PASS

- [ ] **Step 2: Run full production build**

Run: `cd admin && npm run build`
Expected: PASS

- [ ] **Step 3: Review changed files**

Run: `cd admin && git diff -- src/app/\(dashboard\)/layout.tsx src/shared/components/layout/MobileDashboardHeader.tsx src/shared/lib/adminApi.ts src/shared/components/admin-state src/shared/lib/__tests__/adminApi.test.ts`
Expected: Diff only shows Agent 1 scope changes.

- [ ] **Step 4: Commit final integration**

```bash
cd admin
git add src/app/\(dashboard\)/layout.tsx src/shared/components/layout/MobileDashboardHeader.tsx src/shared/lib/adminApi.ts src/shared/components/admin-state src/shared/lib/__tests__/adminApi.test.ts
git commit -m "finish admin shell agent 1 tasks"
```
