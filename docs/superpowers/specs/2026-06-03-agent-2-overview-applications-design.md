# Agent 2 Overview And Applications Design

## Goal

Improve the admin `Overview` and `Applications` pages so they expose explicit loading-adjacent outcomes on the server-rendered UI: successful data, empty data, partial failure, request failure, and mutation feedback where applicable.

## Scope

- Update `Overview` to distinguish request failure from empty results per section.
- Preserve partial page usefulness when one Overview request fails.
- Align Overview labels with the current backend semantics instead of implied product definitions.
- Update `Applications` to show explicit empty and request-failure states.
- Add visible success and error feedback for approve, reject, and suspend actions.
- Add pagination UI for `Applications` using the existing backend paging contract.
- Preserve current query, sort, status, and page context through status mutations.

## Non-Goals

- Redefining product semantics for active users, platform revenue windows, or lesson flow windows.
- Reworking admin authentication and session enforcement across the app.
- Moving `/v1/admin/overview/highlights` or `/v1/admin/applications` behind auth in this change.
- Adding new backend audit metadata if the existing mutation endpoints do not already return it.

## Current Constraints

- `OverviewPage` currently collapses fetch failures into `null` or empty arrays, so the UI cannot distinguish "failed to load" from "no records".
- `HighlightSection` currently uses the public `/v1/admin/overview/highlights` endpoint while the rest of Overview uses authenticated admin endpoints.
- `ApplicationsPage` already receives `total`, `page`, and `totalPages` from the backend, but exposes no pagination controls.
- `ApplicationsPage` mutations redirect silently after server actions and do not expose success or failure feedback.

## Design

### Overview Data Model

Overview should stop normalizing failures into the same values used for empty results. Each independent section should retain a simple result state:

- `success` with data
- `empty` when the request succeeds but the relevant dataset has no records for the displayed window
- `error` when the request fails

This state can stay local to the page module. A lightweight section result wrapper is enough; no cross-app state abstraction is required in this task.

### Overview Rendering Behavior

`OverviewPage` should fetch these sources independently:

- stats
- revenue chart
- lesson flow chart
- highlights

Each section renders from its own state:

- Stat cards:
  show values when stats load successfully, otherwise render unavailable placeholders plus a visible inline error message for the stats section.
- Revenue Trend:
  show cards when data exists, show a no-data message when the request succeeds with no points, and show an error message when the request fails.
- Latest Insight:
  derive insights from stats only when stats are available; otherwise show a clear error-state message rather than a generic insight string.
- Lesson Flow:
  show rows when data exists, show a no-data row when the request succeeds with no points, and show an error row when the request fails.
- Highlights:
  preserve the section, but surface a visible section-level error message if the public request fails.

This keeps the page truthful under partial backend outages.

### Overview Copy And Semantics

UI copy should match what the backend actually computes today:

- `Platform Revenue` becomes `Platform Revenue (MTD)` because the backend uses the current month window.
- `Active Users` remains labeled with the actual rolling window, e.g. `Active Users (30d)`.
- Revenue Trend supporting text should stay aligned to the 30-day chart endpoint.
- Lesson Flow supporting text should keep the existing 7-day framing if that matches the current backend response.

Add code comments or a local follow-up note near the relevant fetchers for:

- product confirmation of metric definitions
- security/product review for the public `overview/highlights` endpoint

### Applications Fetch States

`ApplicationsPage` should render one of three top-level content outcomes:

- populated list
- explicit empty state when the request succeeds but there are zero results for the current filter
- explicit request-failure state when the fetch fails

The empty state should mention that no applications matched the current filters rather than implying the system has no applications at all.

### Applications Mutation Feedback

Approve, reject, and suspend actions should continue to use server actions, but the redirect target should carry user-visible feedback. A simple query-string flash pattern is sufficient:

- success message key for completed actions
- error message key for failed actions

On return, the page reads those params and renders a dismissible or inline banner near the header. The banner text should name the action outcome in plain language, for example:

- `Tutor approved`
- `Application rejected`
- `Tutor suspended`
- `Could not update tutor status`

Mutation redirects must preserve:

- `q`
- `sort`
- `status`
- `page`

This avoids dropping the admin back onto a different view after an action.

### Applications Pagination

Use the existing `page` and `totalPages` fields to render simple pagination controls:

- previous
- next
- current page indicator

Pagination links should preserve `q`, `sort`, and `status`. If there is only one page, controls can be hidden.

### Applications Audit Visibility

This task should not fabricate audit data. If the current mutation flow has no actor/timestamp payload, leave a follow-up note in code or local docs stating that audit visibility requires backend support.

## File-Level Impact

- `admin/src/features/overview/components/OverviewPage.tsx`
- `admin/src/features/overview/components/highlights-section/index.tsx`
- `admin/src/features/overview/components/highlights-section/highlightData.ts`
- `admin/src/features/applications/components/ApplicationsPage.tsx`
- `admin/src/features/applications/components/application-card.tsx`
- `admin/src/features/applications/components/applications.data.ts`
- small shared presentational additions if existing primitives do not already cover inline banners or empty states

## Testing

Prefer focused tests around pure helpers introduced for:

- applications pagination href construction
- applications flash message parsing
- overview section state derivation if extracted into testable helpers

If the current admin app test harness is limited, keep new logic in small pure functions so behavior can be verified without broad UI test setup. Manual verification should cover:

- Overview with all requests succeeding
- Overview with stats failure only
- Overview with revenue failure only
- Applications empty filtered result
- Applications fetch failure
- Applications approve/reject/suspend success banner
- Applications mutation failure banner
- Applications pagination preserving filters

## Risks

- Copy changes that expose actual metric windows may surface product-definition mismatches that require a later backend or PM decision.
- Query-string flash messages can accumulate stale params if not cleared by subsequent navigation patterns.
- Leaving public read endpoints in place preserves current behavior but also preserves the security review follow-up.
