# Agent 3 Tutors And Students Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the Agent 3 admin tasks by adding tutor/student search, pagination, detail pages, explicit request and mutation feedback, tutor avatar support, and the missing backend student detail plus search support.

**Architecture:** Extend the existing Nest admin service/controller endpoints first, with unit tests added before implementation for new filtering and student detail behavior. Then extend the Next admin app using the existing App Router server-component pattern, adding small shared helpers for notices, empty states, and pagination so tutor and student pages stay consistent without introducing new client-side state infrastructure.

**Tech Stack:** Next.js App Router, React server components, server actions, NestJS, Prisma, Jest, TypeScript

---

### Task 1: Backend Admin Search And Student Detail

**Files:**
- Modify: `backend/src/admin/admin.service.spec.ts`
- Modify: `backend/src/admin/admin.controller.ts`
- Modify: `backend/src/admin/admin.service.ts`

- [ ] Add failing admin service tests for tutor search, student search, and student detail response shape.
- [ ] Run: `cd backend && npm test -- admin/admin.service.spec.ts`
- [ ] Implement `q` support on `getTutors` and `getStudents`, and add `getStudentById` in `AdminService`.
- [ ] Expose `GET /v1/admin/students/:studentId` from `AdminController`.
- [ ] Re-run: `cd backend && npm test -- admin/admin.service.spec.ts`

### Task 2: Tutor Status Authorization Alignment

**Files:**
- Modify: `backend/src/tutors/tutors.controller.ts`

- [ ] Add a focused failing test only if there is already a practical controller authorization test pattern; otherwise keep this covered by code review and manual endpoint verification due current repo patterns.
- [ ] Align `PATCH /admin/tutors/:tutorId/status` authorization with the admin dashboard expectation chosen in the spec.
- [ ] Re-run relevant backend tests that touch admin/tutor behavior if any were added.

### Task 3: Shared Admin Page Helpers

**Files:**
- Create: `admin/src/shared/components/admin/AdminFlashBanner.tsx`
- Create: `admin/src/shared/components/admin/AdminEmptyState.tsx`
- Create: `admin/src/shared/components/admin/AdminPagination.tsx`
- Create: `admin/src/shared/lib/adminPageState.ts`

- [ ] Add small shared helpers for flash-message extraction/rendering, empty-state rendering, and pagination link generation.
- [ ] Keep helpers server-component friendly and query-string driven.

### Task 4: Tutors List Page

**Files:**
- Modify: `admin/src/features/tutors/components/TutorsPage.tsx`

- [ ] Add failing coverage only if the admin app already has a route/component test pattern that fits this page; otherwise proceed with build/manual verification because no page-test harness currently exists.
- [ ] Add query-param handling for `status`, `q`, and `page`.
- [ ] Replace silent fetch failure fallback with explicit request error UI.
- [ ] Add shared flash banner usage for status and ranking mutations.
- [ ] Add shared pagination controls and empty-state rendering.
- [ ] Switch tutor avatar display to the shared `Avatar` component.
- [ ] Add `View details` links that preserve current list context.

### Task 5: Students List Page

**Files:**
- Modify: `admin/src/features/students/components/StudentsPage.tsx`

- [ ] Add query-param handling for `status`, `q`, and `page`.
- [ ] Replace silent fetch failure fallback with explicit request error UI.
- [ ] Add shared flash banner usage for suspend/reactivate mutations.
- [ ] Add shared pagination controls and empty-state rendering.
- [ ] Add `View details` links that preserve current list context.
- [ ] Keep `DEACTIVATED` visible as a distinct rendered status with no invented new action.

### Task 6: Tutor Detail Page

**Files:**
- Create: `admin/src/app/(dashboard)/tutors/[tutorId]/page.tsx`
- Create: `admin/src/features/tutors/components/TutorDetailPage.tsx`

- [ ] Add the tutor detail route backed by the existing admin tutor detail endpoint.
- [ ] Render explicit detail error UI instead of collapsing into a generic framework error.
- [ ] Add ranking and status actions with redirect-based success/error feedback.
- [ ] Preserve list context in the back link and mutation redirect paths.

### Task 7: Student Detail Page

**Files:**
- Create: `admin/src/app/(dashboard)/students/[studentId]/page.tsx`
- Create: `admin/src/features/students/components/StudentDetailPage.tsx`

- [ ] Add the student detail route backed by the new admin student detail endpoint.
- [ ] Render wallet, totals, recent lesson history, and account state summary.
- [ ] Render explicit detail error UI instead of collapsing into a generic framework error.
- [ ] Add suspend/reactivate action with redirect-based success/error feedback.
- [ ] Preserve list context in the back link and mutation redirect paths.

### Task 8: Verification

**Files:**
- No code changes required unless verification finds defects.

- [ ] Run: `cd backend && npm test -- admin/admin.service.spec.ts`
- [ ] Run: `cd admin && npm run build`
- [ ] Run: `cd backend && npm run build`
- [ ] Review the Agent 3 task list and confirm each required item is addressed or explicitly out of scope by product decision.
- [ ] Report any remaining gaps rather than claiming completion without evidence.
