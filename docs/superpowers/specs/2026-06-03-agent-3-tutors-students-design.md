# Agent 3 Tutors And Students Design

**Date:** 2026-06-03

**Scope:** Admin `Tutors` and `Students` pages in `admin/`, plus the required backend admin endpoints in `backend/`.

## Goal

Bring the admin `Tutors` and `Students` surfaces up to the task-list acceptance standard by adding explicit success and error feedback, richer filtering, pagination, dedicated detail pages, real tutor avatars when present, and backend/frontend consistency for admin status actions.

## Current State

The admin app currently renders both pages as server components:

- `admin/src/features/tutors/components/TutorsPage.tsx`
- `admin/src/features/students/components/StudentsPage.tsx`

Current limitations:

- both pages only filter by `status`
- both pages always request `page=1` and `limit=100`
- request failures are swallowed into empty lists
- mutations redirect silently with no success or error feedback
- tutors do not use the shared avatar component and mostly fall back to initials
- there is a tutor detail backend endpoint, but no tutor detail page in the admin app
- there is no student detail backend endpoint for the admin app
- tutor status mutation permissions are inconsistent with the admin dashboard expectations

## Product Decisions

### Detail Navigation

Use dedicated detail routes, not drawers or modal overlays:

- `/tutors/[tutorId]`
- `/students/[studentId]`

Reasoning:

- the detail surfaces need space for wallet, lesson history, account state, and admin actions
- route-based detail pages preserve the simple server-rendered pattern already used by the admin app
- query params can preserve list context for back navigation

### List State Persistence

Preserve list context through query params:

- `status`
- `q`
- `page`

All list-page actions and detail-page back links must preserve the originating query string.

### Student Admin Actions

Student status actions remain:

- `Suspend` for `ACTIVE`
- `Reactivate` for `SUSPENDED`

`DEACTIVATED` remains visible as a status, but there is no new admin action added in this scope because the task list explicitly called for confirmation of product behavior rather than inventing new controls.

### Tutor Admin Actions

Tutor actions remain:

- `Suspend` for active/approved tutors
- `Re-approve` for suspended tutors
- ranking update for `STARTER`, `PRO`, `MASTER`

The admin UI should only expose actions that map to backend-accepted transitions.

## Frontend Design

### Tutors List Page

Update `admin/src/features/tutors/components/TutorsPage.tsx` to support:

- status filter
- search input `q`
- page query param
- explicit request error banner when tutor data cannot be loaded
- explicit empty state for “no tutors matched the current filters”
- top-level success/error flash messaging for status and ranking mutations
- pagination controls using backend `page` and `totalPages`
- real avatar rendering through the shared `Avatar` component when an avatar URL exists
- a `View details` link to `/tutors/[tutorId]`

Search behavior:

- backend-driven search against tutor name, email, and subject text
- empty or whitespace-only `q` behaves as no search filter

Mutation feedback behavior:

- server actions redirect back to the list route with `notice` or `error` query params
- the page renders those query params in a shared inline banner pattern

### Students List Page

Update `admin/src/features/students/components/StudentsPage.tsx` to support:

- status filter
- search input `q`
- page query param
- explicit request error banner when student data cannot be loaded
- explicit empty state for “no students matched the current filters”
- top-level success/error flash messaging for suspend/reactivate mutations
- pagination controls using backend `page` and `totalPages`
- a `View details` link to `/students/[studentId]`

Search behavior:

- backend-driven search against student name and email

Status presentation:

- render `ACTIVE`, `SUSPENDED`, and `DEACTIVATED` intentionally
- do not collapse `DEACTIVATED` into a generic inactive concept

### Tutor Detail Page

Add route:

- `admin/src/app/(dashboard)/tutors/[tutorId]/page.tsx`

Add detail component:

- `admin/src/features/tutors/components/TutorDetailPage.tsx`

Content:

- header with avatar, full name, email, tutor status, ranking
- subject and language summary
- wallet balance
- joined date
- tutor stats: rating, students count, lessons count
- onboarding-derived detail when available through the existing backend detail endpoint
- status action and ranking form with success/error feedback
- back link to `/tutors` preserving `status`, `q`, and `page`

If the tutor detail request fails:

- render a clear error state instead of redirecting or throwing the user into a generic app error screen

### Student Detail Page

Add route:

- `admin/src/app/(dashboard)/students/[studentId]/page.tsx`

Add detail component:

- `admin/src/features/students/components/StudentDetailPage.tsx`

Content:

- header with avatar, full name, email, account status
- wallet balance
- joined date
- lesson totals and completed totals
- spend totals
- recent lesson history
- account state summary, including last lesson timing
- suspend/reactivate action with success/error feedback
- back link to `/students` preserving `status`, `q`, and `page`

If the student detail request fails:

- render a clear error state instead of redirecting or throwing the user into a generic app error screen

### Shared UI Pattern

Add small shared admin UI helpers inside `admin/src/shared` for:

- flash banner rendering from query params
- empty-state card
- pagination controls

These should be intentionally small and used by both tutors and students to avoid copy-pasted list-state logic.

## Backend Design

### Tutor List Endpoint

Extend:

- `GET /v1/admin/tutors`

Add support for:

- `q`

Filter semantics:

- `status` keeps current behavior
- `q` matches tutor email, profile full name, and subject name

Response shape remains paginated:

- `tutors`
- `total`
- `page`
- `totalPages`

### Student List Endpoint

Extend:

- `GET /v1/admin/students`

Add support for:

- `q`

Filter semantics:

- `status` keeps current behavior
- `q` matches student email and profile full name

Response shape remains paginated:

- `students`
- `total`
- `page`
- `totalPages`

### Student Detail Endpoint

Add:

- `GET /v1/admin/students/:studentId`

Return enough data for the admin detail page:

- student identity and profile fields
- user/account status
- wallet balance
- joined date
- lesson aggregates
- recent lessons with status, schedule, price, tutor identity
- spend totals
- latest lesson timestamp

The endpoint should use the student record ID, matching the list payload and route design.

### Tutor Status Permission Consistency

The admin app currently calls:

- `PATCH /v1/admin/tutors/:tutorId/status`

That route currently requires `ADMIN` while the main admin controller allows `ADMIN` and `MANAGER`.

For this scope, align behavior explicitly rather than relying on accidental access:

- either keep the UI restricted to actions only known to work for `ADMIN`
- or expand backend authorization to match admin dashboard expectations

Recommended direction:

- allow `ADMIN` and `MANAGER` if product intent is that both roles can operate the admin dashboard

This needs to be implemented as a single consistent rule across tutor admin mutation paths, not as frontend guesswork.

## Data Flow

### List Pages

1. Read `status`, `q`, and `page` from `searchParams`
2. Call `fetchAdminApi` with those filters
3. Render one of:
   - error state
   - empty state
   - populated list
4. Render flash banner when `notice` or `error` query params are present
5. Mutations post via server actions
6. Server action redirects back to the originating list URL with result feedback in query params

### Detail Pages

1. Read route param plus list-context query params
2. Request tutor or student detail payload
3. Render detail or explicit error state
4. Mutations post via server actions
5. Server action redirects back to the same detail URL with result feedback in query params
6. Back link returns to the preserved list URL

## Error Handling

List and detail pages must distinguish:

- request failed
- request succeeded with zero matching results

Mutation failures must:

- keep the user on the relevant page
- show the backend error message when available

Mutation successes must:

- show a visible confirmation message
- revalidate affected routes before redirecting

## Testing Strategy

### Backend

Add or update tests for:

- tutor list search filter
- student list search filter
- student detail endpoint shape
- tutor permission rule for admin status updates, if authorization changes in scope

### Admin App

Because this app currently relies on build/manual verification more than automated UI tests, validate with:

- targeted component or route-level tests if the app already has a pattern worth following
- `npm run build` in `admin/`
- manual checks for:
  - tutor filtering
  - student filtering
  - pagination
  - tutor details navigation
  - student details navigation
  - suspend/reactivate/re-approve flows
  - ranking update feedback
  - error-state rendering

## Out Of Scope

- changing product policy for deactivated student actions beyond current visible-state handling
- introducing client-side state libraries or large form abstractions
- redesigning the full admin shell
- broader global admin error-state work outside tutors and students

## Acceptance Mapping

This design covers the Agent 3 task-list items as follows:

- tutor success/error feedback: list and detail flash banners
- tutor ranking feedback: list and detail flash banners
- tutor permission mismatch: backend authorization alignment decision
- tutor search/filtering: `status` + `q`
- tutor drill-down: dedicated tutor detail route
- tutor avatars: shared avatar usage
- tutor pagination: query-param paging controls
- student success/error feedback: list and detail flash banners
- student search/filtering: `status` + `q`
- student drill-down: dedicated student detail route
- student status mapping: explicit UI rendering of backend statuses
- student pagination: query-param paging controls
- deactivated student policy: intentionally left visible and unchanged unless product clarifies otherwise
