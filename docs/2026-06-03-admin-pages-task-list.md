# Admin Pages Task List

Created from the current audit of the `admin/` app and its supporting backend endpoints.

## Usage

- Split work by page or by the recommended agent groups at the end of this document.
- Treat each checkbox item as a discrete deliverable.
- Prefer fixing shared infrastructure once in the global section instead of re-solving it per page.

## Global / Shell

- [ ] Replace mocked mobile header user info with real authenticated admin data.
- [ ] Wire the bell / notification buttons to a real destination, or remove/disable them until notifications exist.
- [ ] Add a shared admin error-state pattern so failed API requests do not silently degrade into empty pages.
- [ ] Add an explicit unauthorized / missing-session state for the admin app if auth is not already enforced upstream.
- [ ] Define a shared convention for loading, empty, partial-failure, and mutation-error states across admin pages.

## Overview Page

- [ ] Add explicit error messaging for failed stats, revenue, and lessons requests instead of only showing generic unavailable content.
- [ ] Distinguish "no data" from "request failed" for each section.
- [ ] Review whether `HighlightSection` should stay public-backed while the rest of the page is admin-backed.
- [ ] Confirm the product definition for active users, platform revenue window, and lesson flow windows.
- [ ] Add acceptance checks for partial backend outages so one broken query does not make the page misleading.

## Applications Page

- [ ] Add a real empty state when no applications match the current filter.
- [ ] Add success and error feedback for approve, reject, and suspend actions.
- [ ] Review whether `/v1/admin/applications` should remain public or be moved behind admin auth.
- [ ] Add pagination UI for backend-supported paging.
- [ ] Add audit visibility after status changes so admins can see who changed what and when.
- [ ] Confirm whether search and sort should be persisted in redirects after mutations.

## Tutors Page

- [ ] Add success and error feedback for suspend / re-approve actions.
- [ ] Add success and error feedback for ranking updates.
- [ ] Resolve the permission mismatch between frontend expectations and backend route restrictions for tutor status updates.
- [ ] Add search and richer filtering beyond status.
- [ ] Add a tutor detail drill-down view using the existing backend detail endpoint.
- [ ] Use real avatars when present instead of relying mostly on initials.
- [ ] Add pagination UI instead of fixed first-page loading.

## Students Page

- [ ] Add success and error feedback for suspend / reactivate actions.
- [ ] Add search and richer filtering beyond status.
- [ ] Add a student detail drill-down view or modal for wallet, lesson history, and account state.
- [ ] Verify that all statuses shown in the UI map correctly to backend `UserStatus` values.
- [ ] Add pagination UI instead of fixed first-page loading.
- [ ] Confirm whether deactivated students should have different admin actions from suspended students.

## Transactions Page

- [ ] Add date range filters.
- [ ] Add status filters.
- [ ] Add search by reference, provider ref, wallet, and related user where possible.
- [ ] Add links from transaction rows to related tutor, student, or wallet entities.
- [ ] Decide whether finance operations need CSV export.
- [ ] Add explicit request-failure states instead of rendering zero-value cards plus an empty table.
- [ ] Confirm whether pending withdrawals need action controls or are intentionally read-only here.

## Resolve Disputes Page

- [ ] Show the actual report context or conversation preview, not only user cards and timestamps.
- [ ] Add confirmation before blocking a reported user.
- [ ] Add success and error feedback for dismiss and block actions.
- [ ] Add a resolved / history view so completed actions remain reviewable.
- [ ] Confirm whether blocked disputes should stay visible in a separate tab or archive.
- [ ] Add more dispute metadata if available, such as reason, last message time, or prior reports.

## Settings Page

- [ ] Add validation and inline error handling for discount code creation.
- [ ] Add confirmation before discount code deletion.
- [ ] Confirm whether discount codes should support edit / disable instead of only create / delete.
- [ ] Add richer audit log filtering beyond a single entity text field.
- [ ] Add pagination controls for audit log browsing.
- [ ] Add richer audit log presentation if available: actor role, target links, structured reason, and before/after context.

## Missing Lessons Page

- [ ] Create an admin `Lessons` page in the frontend.
- [ ] Add the page to admin navigation.
- [ ] Wire the page to existing backend lessons endpoints.
- [ ] Add filters for status, date, tutor, and student.
- [ ] Add a lesson detail view with payment, meeting, and dispute context where available.
- [ ] Decide whether lessons should live as a standalone page or under an operations grouping.

## Recommended Agent Split

### Agent 1

- [ ] Global / Shell

### Agent 2

- [ ] Overview Page
- [ ] Applications Page

### Agent 3

- [ ] Tutors Page
- [ ] Students Page

### Agent 4

- [ ] Transactions Page
- [ ] Settings Page

### Agent 5

- [ ] Resolve Disputes Page
- [ ] Missing Lessons Page

## Suggested Acceptance Standard

- [ ] Every page has explicit loading, empty, error, and success states where applicable.
- [ ] Every mutation has user-visible success and failure feedback.
- [ ] Every page with backend pagination exposes pagination in the UI.
- [ ] No production admin UI relies on mock user data.
- [ ] Route permissions are consistent between frontend expectations and backend enforcement.
