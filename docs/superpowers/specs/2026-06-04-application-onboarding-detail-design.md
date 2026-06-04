# Application Onboarding Detail Design

## Goal

Add an admin application detail flow so clicking a tutor application card opens a dedicated review page that shows the tutor's onboarding submission in full detail across steps 1 through 9.

## Current State

- The admin applications list at `/applications` renders summary cards from `GET /v1/admin/applications`.
- Clicking a card does not navigate anywhere; the list is only useful for inline approve/reject actions.
- The existing admin tutor detail page shows only a condensed onboarding snapshot and is oriented toward ongoing tutor operations rather than application review.
- Tutor onboarding step endpoints already exist, but they are tutor-scoped and not suitable for admin review UI as-is.

## Scope

### In Scope

- Add a clickable admin application detail route at `/applications/[tutorId]`.
- Add a new admin backend endpoint that returns a full onboarding review payload for one tutor application.
- Render every onboarding step in a read-only review screen with explicit empty states.
- Preserve list filters and paging in the back link from the detail page.
- Keep approve/reject actions available from the detail page.

### Out of Scope

- Reworking the existing admin tutor detail page.
- Editing onboarding data from the admin UI.
- Changing tutor onboarding submission rules.
- Refactoring tutor-facing onboarding APIs into shared admin/tutor contracts.

## Architecture

The backend will expose one new admin read endpoint, `GET /v1/admin/applications/:tutorId`, that returns a normalized application detail payload built from the tutor record and its onboarding relations. The admin frontend will add one new server-rendered route and page component that fetches that payload and renders a review-focused page with one section per onboarding step.

The applications list will link each card to the new detail route while preserving current query, sort, status, and pagination parameters. Existing inline status actions on the list remain available for fast triage, while the detail page becomes the full-review destination.

## Backend Design

### Endpoint

- Add `GET /v1/admin/applications/:tutorId`.
- Return `404` if the tutor or onboarding record does not exist.
- Reuse the existing admin controller/service structure rather than introducing a separate module.

### Response Shape

The response should include:

- `id`, `userId`, `status`, `joinedAt`
- `fullName`, `email`, `avatarUrl`
- `subject`, `baseRate`
- `stats` summary for rating, students, and lessons
- `steps` object containing normalized data for steps 1 to 9

The `steps` object should be read-friendly and grouped by onboarding step, not raw database structure:

- `stepOne`: name, subject, languages
- `stepTwo`: avatar or profile photo
- `stepThree`: certification records
- `stepFour`: diploma or education records
- `stepFive`: catchy headline, intro, teaching experience, motivation copy
- `stepSix`: video URL, thumbnail URL
- `stepSeven`: timezone and availability rows
- `stepEight`: lesson price and payout details
- `stepNine`: document type and identity document files

### Normalization Rules

- Convert storage keys into public asset URLs using the existing admin asset URL helper.
- Keep arrays present even when empty so the admin page can render predictable sections.
- Prefer explicit `null` for singular missing values instead of omitted fields.
- Keep response names aligned with the UI sections so the page can stay simple.

## Admin Frontend Design

### Routing

- Add `/applications/[tutorId]` under the dashboard app router.
- Preserve `status`, `q`, `sort`, and `page` query params in the detail URL.
- Provide a back link that returns to the filtered applications list.

### Applications List Interaction

- Make the main card body clickable as the navigation affordance.
- Do not interfere with approve/reject buttons or the approved-state action menu.
- Avoid nesting interactive elements inside links; use a structure that keeps buttons/forms working normally.

### Detail Page Layout

The page should use the same admin visual language as existing detail pages:

- top header with back link, tutor identity, subject, status, and joined date
- compact stats row
- one read-only card section per onboarding step
- inline approve/reject controls when the tutor is still in `REVIEWING`

Each onboarding section should render a clear title and either:

- the available onboarding values, or
- a truthful empty-state message explaining that no data was submitted for that section

### Media Handling

- Avatar, video thumbnail, ID card, and passport assets should render as links or previews when URLs are available.
- Missing media should render a neutral empty state, not broken images.
- The page does not need upload or playback editing controls.

## Error Handling

- If the admin detail fetch fails, render a page-level failure state with a back link to applications.
- If a section has no data, keep the page rendering and show that section as empty.
- Existing approve/reject mutations should redirect back to the current detail URL with flash messaging, matching the admin app’s existing pattern.

## Testing Strategy

### Backend

- Add service-level coverage for the new admin application detail formatter or service method.
- Verify asset URL normalization and empty-array behavior.
- Verify missing tutor/onboarding behavior returns the expected error path.

### Admin Frontend

- Add targeted tests for any new URL helper logic used to preserve list state.
- Manually verify:
  - clicking an application card opens the detail page
  - back navigation preserves filters
  - reviewing tutors still show approve/reject actions
  - missing onboarding sections render empty states instead of failing

## Files Expected To Change

### Backend

- `backend/src/admin/admin.controller.ts`
- `backend/src/admin/admin.service.ts`
- optional backend admin test file(s) for the new detail formatter/service path

### Admin

- `admin/src/app/(dashboard)/applications/[tutorId]/page.tsx`
- `admin/src/features/applications/components/application-card.tsx`
- `admin/src/features/applications/components/applications.data.ts`
- new admin detail page component and any small helper/types it needs

## Open Decisions Resolved

- Use a dedicated applications detail page instead of expanding the tutor detail page.
- Use one admin-focused backend endpoint instead of composing nine tutor-facing step endpoints.
- Keep the admin page read-only for onboarding content in this change.
