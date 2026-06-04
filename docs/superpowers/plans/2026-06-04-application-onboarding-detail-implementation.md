# Application Onboarding Detail Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an admin application detail flow so clicking a tutor application card opens a dedicated page with full onboarding step details and review actions.

**Architecture:** Extend the backend admin surface with one new application-detail endpoint that returns a normalized onboarding snapshot for all nine steps. Then add an admin route and read-only detail page that consumes that payload, while preserving applications-list filters in navigation and keeping existing status actions intact.

**Tech Stack:** Next.js App Router 16, React 19, TypeScript, NestJS, Prisma, Node test runner in `admin`, Jest in `backend`

---

## File Map

### Backend

- Modify: `backend/src/admin/admin-public.controller.ts`
  - Add a public admin applications detail endpoint alongside the existing list endpoint.
- Modify: `backend/src/admin/admin.service.ts`
  - Add application-detail query logic and response formatting helpers.
- Modify: `backend/src/admin/admin.service.spec.ts`
  - Add service coverage for the new detail formatter/query path.

### Admin

- Modify: `admin/src/features/applications/components/applications.data.ts`
  - Add detail payload types and fetch helper for one application.
- Modify: `admin/src/features/applications/components/applications.helpers.ts`
  - Add URL builders for application detail and preserved back-navigation state.
- Modify: `admin/src/features/applications/components/__tests__/applications.helpers.test.ts`
  - Add failing helper tests for detail/back-link URL behavior.
- Modify: `admin/src/features/applications/components/application-card.tsx`
  - Make the card body navigate to the detail page without breaking action buttons.
- Create: `admin/src/features/applications/components/ApplicationDetailPage.tsx`
  - Render the dedicated onboarding review page.
- Create: `admin/src/app/(dashboard)/applications/[tutorId]/page.tsx`
  - Route entry that resolves search params and renders the detail page.

## Task 1: Add Backend Application Detail Contract

**Files:**
- Modify: `backend/src/admin/admin-public.controller.ts`
- Modify: `backend/src/admin/admin.service.ts`
- Modify: `backend/src/admin/admin.service.spec.ts`

- [ ] **Step 1: Write the failing backend service tests**

Add tests in `backend/src/admin/admin.service.spec.ts` that exercise the new detail response shape and missing-record behavior.

```ts
it('returns a normalized onboarding detail payload for one tutor application', async () => {
  prismaMock.tutor.findUnique.mockResolvedValue({
    id: 'tutor-1',
    userId: 'user-1',
    status: 'REVIEWING',
    joinedAt: new Date('2026-06-01T00:00:00.000Z'),
    baseRate: 0,
    user: {
      email: 'tutor@example.com',
      fullName: null,
      profile: { fullName: 'Ann Tutor', avatarUrl: null },
    },
    stats: { avgRating: 4.9, studentsCount: 12, lessonsCount: 120 },
    subjects: [{ subject: { name: 'Mathematics' } }],
    onboarding: {
      firstName: 'Ann',
      lastName: 'Tutor',
      subject: 'Mathematics',
      lessonPrice: 500,
      avatarKey: 'avatars/ann.jpg',
      languages: [{ language: { name: 'English' } }],
      certifications: [{ id: 'cert-1', title: 'TESOL', issuingOrganization: 'TESOL Org', issueDate: null, fileKey: null }],
      diplomas: [{ id: 'dip-1', degree: 'BACHELOR', school: 'Chula', fieldOfStudy: 'Math', startDate: null, endDate: null, fileKey: null }],
      availabilities: [{ id: 'slot-1', dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '11:00', timezone: 'Asia/Bangkok' }],
      catchyHeadline: 'Patient math tutor',
      introduceYourself: 'Hello',
      teachingExperience: '5 years',
      motivatePotentialStudents: 'Build confidence',
      videoKey: 'videos/ann.mp4',
      thumbnailKey: 'thumbs/ann.jpg',
      timezone: 'Asia/Bangkok',
      withdrawalMethod: 'BANK_ACCOUNT',
      withdrawalPhoneNumber: null,
      bankName: 'SCB',
      bankAccountNumber: '1234567890',
      documentType: 'PASSPORT',
      idCardKey: null,
      passportKey: 'docs/passport.pdf',
    },
  });

  const result = await service.getTutorApplicationById('tutor-1');

  expect(result.id).toBe('tutor-1');
  expect(result.steps.stepOne.fullName).toBe('Ann Tutor');
  expect(result.steps.stepThree.certifications).toHaveLength(1);
  expect(result.steps.stepSeven.availabilities).toHaveLength(1);
  expect(result.steps.stepNine.passportUrl).toContain('docs/passport.pdf');
});

it('throws when the tutor application cannot be found', async () => {
  prismaMock.tutor.findUnique.mockResolvedValue(null);

  await expect(service.getTutorApplicationById('missing')).rejects.toThrow();
});
```

- [ ] **Step 2: Run the backend service test to verify it fails**

Run: `cd backend && npm test -- admin/admin.service.spec.ts`

Expected: FAIL because `getTutorApplicationById` does not exist yet and the new payload is not implemented.

- [ ] **Step 3: Implement the minimal backend detail query and formatter**

Add a new public service method in `backend/src/admin/admin.service.ts`, plus small private formatter helpers for each onboarding section instead of one oversized inline mapper.

```ts
async getTutorApplicationById(tutorId: string) {
  const tutor = await this.prisma.tutor.findUnique({
    where: { id: tutorId },
    include: {
      user: { include: { profile: true } },
      stats: true,
      subjects: { include: { subject: true } },
      onboarding: {
        include: {
          languages: { include: { language: true } },
          certifications: true,
          diplomas: true,
          availabilities: true,
        },
      },
    },
  });

  if (!tutor || !tutor.onboarding) {
    throw new BadRequestException('Tutor application not found.');
  }

  return this.formatTutorApplicationDetail(tutor);
}

private formatTutorApplicationDetail(tutor: any) {
  const onboarding = tutor.onboarding;
  const fullName =
    tutor.user?.profile?.fullName ??
    tutor.user?.fullName ??
    [onboarding.firstName, onboarding.lastName].filter(Boolean).join(' ').trim() ??
    'Tutor';

  return {
    id: tutor.id,
    userId: tutor.userId,
    status: tutor.status,
    joinedAt: tutor.joinedAt,
    fullName,
    email: tutor.user?.email ?? null,
    avatarUrl: this.toAssetUrl(tutor.user?.profile?.avatarUrl ?? onboarding.avatarKey),
    subject: tutor.subjects?.[0]?.subject?.name ?? onboarding.subject ?? null,
    baseRate: tutor.baseRate > 0 ? tutor.baseRate : (onboarding.lessonPrice ?? 0),
    stats: {
      avgRating: tutor.stats?.avgRating ?? 0,
      studentsCount: tutor.stats?.studentsCount ?? 0,
      lessonsCount: tutor.stats?.lessonsCount ?? 0,
    },
    steps: {
      stepOne: this.formatApplicationStepOne(onboarding, fullName),
      stepTwo: this.formatApplicationStepTwo(onboarding),
      stepThree: this.formatApplicationStepThree(onboarding),
      stepFour: this.formatApplicationStepFour(onboarding),
      stepFive: this.formatApplicationStepFive(onboarding),
      stepSix: this.formatApplicationStepSix(onboarding),
      stepSeven: this.formatApplicationStepSeven(onboarding),
      stepEight: this.formatApplicationStepEight(onboarding),
      stepNine: this.formatApplicationStepNine(onboarding),
    },
  };
}
```

Add the controller route in `backend/src/admin/admin-public.controller.ts`.

```ts
@Public()
@Get('applications/:tutorId')
getTutorApplicationById(@Param('tutorId') tutorId: string) {
  return this.adminService.getTutorApplicationById(tutorId);
}
```

- [ ] **Step 4: Run the backend service test to verify it passes**

Run: `cd backend && npm test -- admin/admin.service.spec.ts`

Expected: PASS for the new detail tests and no regressions in existing `admin.service.spec.ts`.

- [ ] **Step 5: Commit**

```bash
git -C backend add src/admin/admin-public.controller.ts src/admin/admin.service.ts src/admin/admin.service.spec.ts
git -C backend commit -m "feat: add admin application detail endpoint"
```

## Task 2: Add Admin URL Helpers For Detail Navigation

**Files:**
- Modify: `admin/src/features/applications/components/applications.helpers.ts`
- Modify: `admin/src/features/applications/components/__tests__/applications.helpers.test.ts`

- [ ] **Step 1: Write the failing helper tests**

Extend `admin/src/features/applications/components/__tests__/applications.helpers.test.ts` with detail-path coverage.

```ts
import {
  buildApplicationDetailHref,
  buildApplicationsHref,
  buildApplicationsReturnHref,
  getApplicationsFlashMessage,
} from '../applications.helpers.ts';

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
      notice: 'Tutor approved.',
    } as never),
    '/applications?q=ann&sort=oldest&status=REVIEWING&page=3',
  );
});
```

- [ ] **Step 2: Run the helper tests to verify they fail**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts`

Expected: FAIL because the new helper exports do not exist yet.

- [ ] **Step 3: Implement the minimal helper functions**

Update `admin/src/features/applications/components/applications.helpers.ts`.

```ts
type ApplicationsRouteState = {
  q?: string;
  sort?: string;
  status?: string;
  page?: string;
  success?: string;
  error?: string;
  notice?: string;
};

export function buildApplicationDetailHref(
  tutorId: string,
  searchParams: ApplicationsRouteState,
) {
  const params = new URLSearchParams();

  if (searchParams.q?.trim()) params.set('q', searchParams.q.trim());
  if (searchParams.sort?.trim()) params.set('sort', searchParams.sort.trim());
  if (searchParams.status?.trim()) params.set('status', searchParams.status.trim());
  if (searchParams.page?.trim()) params.set('page', searchParams.page.trim());

  const query = params.toString();
  return query ? `/applications/${tutorId}?${query}` : `/applications/${tutorId}`;
}

export function buildApplicationsReturnHref(searchParams: ApplicationsRouteState) {
  return buildApplicationsHref(searchParams, {
    success: undefined,
    error: undefined,
    notice: undefined,
  } as Partial<ApplicationsRouteState>);
}
```

- [ ] **Step 4: Run the helper tests to verify they pass**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git -C admin add src/features/applications/components/applications.helpers.ts src/features/applications/components/__tests__/applications.helpers.test.ts
git -C admin commit -m "feat: add applications detail navigation helpers"
```

## Task 3: Make Application Cards Navigate To Detail

**Files:**
- Modify: `admin/src/features/applications/components/application-card.tsx`
- Modify: `admin/src/features/applications/components/ApplicationsPage.tsx`

- [ ] **Step 1: Add the failing API surface in the page and card components**

Update the call site in `ApplicationsPage.tsx` to pass a `detailHref`, and update the card prop types so TypeScript fails until the value is used.

```ts
<ApplicationCard
  key={application.id}
  application={application}
  currentUrl={currentUrl}
  detailHref={buildApplicationDetailHref(application.id, searchParams)}
  onUpdateStatus={updateTutorStatus}
/>
```

```ts
type ApplicationCardProps = {
  application: TutorApplicationCard;
  currentUrl: string;
  detailHref: string;
  onUpdateStatus: (formData: FormData) => Promise<void>;
};
```

- [ ] **Step 2: Run a focused build check to verify it fails**

Run: `cd admin && npm run build`

Expected: FAIL because `buildApplicationDetailHref` is newly required at the call site and the card layout has not been updated yet.

- [ ] **Step 3: Implement the clickable card body**

Use `Link` on the non-action content only so forms remain valid and interactive.

```tsx
import Link from 'next/link';

export default function ApplicationCard({
  application,
  currentUrl,
  detailHref,
  onUpdateStatus,
}: ApplicationCardProps) {
  const isProcessing = application.status === 'REVIEWING';
  const isApproved = application.status === 'APPROVED';

  return (
    <article className="flex flex-col gap-4 rounded-[24px] border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] lg:p-6">
      <Link href={detailHref} className="block rounded-[20px] transition hover:bg-neutral-25 focus:outline-none focus:ring-2 focus:ring-deep-royal-indigo-300">
        <div className="flex flex-col gap-4 p-1">
          {/* existing identity and stats content */}
        </div>
      </Link>

      {isProcessing ? (
        <div className="flex gap-3">
          {/* existing approve/reject forms */}
        </div>
      ) : null}
    </article>
  );
}
```

- [ ] **Step 4: Run the build check to verify it passes**

Run: `cd admin && npm run build`

Expected: PASS through the applications-list route compilation with no invalid nested interactive markup.

- [ ] **Step 5: Commit**

```bash
git -C admin add src/features/applications/components/ApplicationsPage.tsx src/features/applications/components/application-card.tsx
git -C admin commit -m "feat: link application cards to detail page"
```

## Task 4: Add Admin Detail Fetching And Route

**Files:**
- Modify: `admin/src/features/applications/components/applications.data.ts`
- Create: `admin/src/app/(dashboard)/applications/[tutorId]/page.tsx`

- [ ] **Step 1: Write the failing type and fetch surface**

Add the detail payload types and a new fetch helper declaration in `applications.data.ts`, then create the route file that calls it so the build fails until the function is implemented.

```ts
export type TutorApplicationDetail = {
  id: string;
  userId: string;
  status: TutorStatus;
  joinedAt: string;
  fullName: string;
  email: string | null;
  avatarUrl: string | null;
  subject: string | null;
  baseRate: number;
  stats: {
    avgRating: number;
    studentsCount: number;
    lessonsCount: number;
  };
  steps: {
    stepOne: { fullName: string; subject: string | null; languages: string[] };
    stepTwo: { avatarUrl: string | null };
    stepThree: { certifications: Array<Record<string, unknown>> };
    stepFour: { diplomas: Array<Record<string, unknown>> };
    stepFive: { catchyHeadline: string | null; introduceYourself: string | null; teachingExperience: string | null; motivatePotentialStudents: string | null };
    stepSix: { videoUrl: string | null; thumbnailUrl: string | null };
    stepSeven: { timezone: string | null; availabilities: Array<Record<string, unknown>> };
    stepEight: { lessonPrice: number; withdrawalMethod: string | null; withdrawalPhoneNumber: string | null; bankName: string | null; bankAccountNumber: string | null };
    stepNine: { documentType: string | null; idCardUrl: string | null; passportUrl: string | null };
  };
};

export async function getTutorApplicationDetail(tutorId: string): Promise<TutorApplicationDetail> {
  // implement in Step 3
}
```

```ts
import { ApplicationDetailPage } from '@/features/applications/components/ApplicationDetailPage';

type ApplicationDetailRouteProps = {
  params: Promise<{ tutorId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function Page({ params, searchParams }: ApplicationDetailRouteProps) {
  const { tutorId } = await params;
  const resolvedSearchParams = await searchParams;

  return (
    <ApplicationDetailPage
      tutorId={tutorId}
      searchParams={{
        q: typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : undefined,
        sort: typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : undefined,
        status: typeof resolvedSearchParams.status === 'string' ? resolvedSearchParams.status : undefined,
        page: typeof resolvedSearchParams.page === 'string' ? resolvedSearchParams.page : undefined,
        notice: typeof resolvedSearchParams.notice === 'string' ? resolvedSearchParams.notice : undefined,
        error: typeof resolvedSearchParams.error === 'string' ? resolvedSearchParams.error : undefined,
      }}
    />
  );
}
```

- [ ] **Step 2: Run a focused build check to verify it fails**

Run: `cd admin && npm run build`

Expected: FAIL because `ApplicationDetailPage` and `getTutorApplicationDetail` are not implemented yet.

- [ ] **Step 3: Implement the minimal public fetch helper**

Use the existing public fetch helper in `applications.data.ts`.

```ts
import { fetchPublicApi } from '@/shared/lib/adminApi';

export async function getTutorApplicationDetail(
  tutorId: string,
): Promise<TutorApplicationDetail> {
  return fetchPublicApi<TutorApplicationDetail>(`/v1/admin/applications/${tutorId}`);
}
```

- [ ] **Step 4: Run the build check again**

Run: `cd admin && npm run build`

Expected: FAIL only on the still-missing `ApplicationDetailPage`, proving the route and data surface are wired correctly.

- [ ] **Step 5: Commit**

```bash
git -C admin add src/features/applications/components/applications.data.ts 'src/app/(dashboard)/applications/[tutorId]/page.tsx'
git -C admin commit -m "feat: add applications detail route and data loader"
```

## Task 5: Build The Read-Only Onboarding Detail Page

**Files:**
- Create: `admin/src/features/applications/components/ApplicationDetailPage.tsx`
- Modify: `admin/src/features/applications/components/applications.data.ts`

- [ ] **Step 1: Write the component against the existing types so the build fails only on missing details**

Create the page component skeleton with imports and a minimal render path that references all step sections.

```tsx
type ApplicationDetailPageProps = {
  tutorId: string;
  searchParams: {
    q?: string;
    sort?: string;
    status?: string;
    page?: string;
    notice?: string;
    error?: string;
  };
};

export async function ApplicationDetailPage({
  tutorId,
  searchParams,
}: ApplicationDetailPageProps) {
  const data = await getTutorApplicationDetail(tutorId)
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: null,
      error: error.message || 'Unable to load application detail.',
    }));

  return <div>{/* render header, flash banner, sections */}</div>;
}
```

- [ ] **Step 2: Run the build check to verify it fails for incomplete render code**

Run: `cd admin && npm run build`

Expected: FAIL because the component still lacks the concrete section markup and helper usage.

- [ ] **Step 3: Implement the detail page**

Follow the existing `TutorDetailPage` structure, but keep the content review-focused and read-only.

```tsx
import Link from 'next/link';
import Avatar from '@/shared/components/base/Avatar';
import Typography from '@/shared/components/base/Typography';
import { getTutorApplicationDetail, formatCompactNumber, formatCurrency } from './applications.data';
import { buildApplicationsReturnHref } from './applications.helpers';
import { getAdminFlashMessage } from '@/shared/lib/adminPageState';

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-stone-200 bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
      <Typography variant={{ base: 'title-4' }} color="neutral-900">
        {title}
      </Typography>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function EmptyValue({ text }: { text: string }) {
  return (
    <Typography variant={{ base: 'body-3' }} color="neutral-500">
      {text}
    </Typography>
  );
}

export async function ApplicationDetailPage({ tutorId, searchParams }: ApplicationDetailPageProps) {
  const flashMessage = getAdminFlashMessage(searchParams);
  const backHref = buildApplicationsReturnHref(searchParams);
  const data = await getTutorApplicationDetail(tutorId)
    .then((result) => ({ result, error: null as string | null }))
    .catch((error: Error) => ({
      result: null,
      error: error.message || 'Unable to load application detail.',
    }));

  if (!data.result) {
    return (
      <div className="rounded-[24px] border border-rose-200 bg-rose-50 p-6">
        <Link href={backHref} className="text-label-3 text-deep-royal-indigo-500">
          Back to applications
        </Link>
        <Typography variant={{ base: 'title-4' }} color="rose-700" className="mt-3">
          Application detail could not be loaded.
        </Typography>
        <Typography variant={{ base: 'body-3' }} color="rose-700" className="mt-2">
          {data.error}
        </Typography>
      </div>
    );
  }

  const application = data.result;

  return (
    <div className="flex flex-col gap-4">
      {/* header, banner, summary stats, step 1-9 sections, reviewing actions */}
    </div>
  );
}
```

Render explicit empty states for:

- empty languages
- no certifications
- no diplomas
- missing video
- no availabilities
- missing payout details
- missing identity documents

- [ ] **Step 4: Run the full admin build to verify it passes**

Run: `cd admin && npm run build`

Expected: PASS with the new `/applications/[tutorId]` route compiled successfully.

- [ ] **Step 5: Commit**

```bash
git -C admin add src/features/applications/components/ApplicationDetailPage.tsx src/features/applications/components/applications.data.ts
git -C admin commit -m "feat: add applications onboarding detail page"
```

## Task 6: Final Verification

**Files:**
- No new files

- [ ] **Step 1: Run the targeted admin helper tests**

Run: `node --test admin/src/features/applications/components/__tests__/applications.helpers.test.ts`

Expected: PASS.

- [ ] **Step 2: Run the backend admin service tests**

Run: `cd backend && npm test -- admin/admin.service.spec.ts`

Expected: PASS.

- [ ] **Step 3: Run the admin production build**

Run: `cd admin && npm run build`

Expected: PASS.

- [ ] **Step 4: Review git status**

Run: `git -C admin status --short && git -C backend status --short`

Expected: only intended implementation changes remain.

