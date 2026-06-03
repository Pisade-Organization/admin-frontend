# Admin Shell Agent 1 Design

## Scope

This document covers the Agent 1 items from `admin/docs/2026-06-03-admin-pages-task-list.md`:

- Replace mocked mobile header user info with real authenticated admin data.
- Wire the bell / notification buttons to a real destination, or remove/disable them until notifications exist.
- Add a shared admin error-state pattern so failed API requests do not silently degrade into empty pages.
- Add an explicit unauthorized / missing-session state for the admin app if auth is not already enforced upstream.
- Define a shared convention for loading, empty, partial-failure, and mutation-error states across admin pages.

This pass is intentionally shell-focused. It provides the shared auth and state primitives that page-specific work can adopt without solving every page in this change.

## Current State

- The dashboard shell renders for any request and does not enforce a session at the layout boundary.
- `MobileDashboardHeader` uses `currentUserMock` rather than authenticated admin data.
- The notification bell has no destination or disabled state.
- Multiple pages suppress admin API failures with `catch(() => null)` or `catch(() => [])`, which makes real failures look like valid empty states.
- The admin app does not yet expose a shared UI convention for full-page errors, partial failures, empty states, or mutation feedback.

## Goals

- Redirect immediately when an admin session is missing or unusable.
- Resolve authenticated admin identity once at the dashboard layout layer and make it available to shell UI.
- Remove mock shell user data from production admin UI.
- Establish reusable shared components and type conventions for admin loading, empty, error, and partial-failure states.
- Make notification controls explicit by disabling them until a real destination exists.

## Non-Goals

- Rewriting every existing admin page to adopt the new state primitives in this change.
- Designing or implementing a real notifications feature.
- Introducing a full client-side state management layer for the admin app.
- Changing backend auth behavior beyond using the existing session token and surfaced API errors more explicitly.

## Architecture

### Dashboard Layout as Auth Boundary

The `(dashboard)` layout becomes the server-side gate for admin routes:

- Read the admin access token using the existing cookie/env lookup path.
- If no token is present, redirect before rendering dashboard UI.
- If the token exists, fetch the current admin profile through the admin API.
- If profile resolution fails because the session is unauthorized, redirect.
- If profile resolution succeeds, pass normalized identity data into shell components.

This keeps auth enforcement at the highest app-router boundary that owns admin pages and avoids client-side flashes of unauthorized UI.

### Shared Shell Session Data

Introduce a small server-safe admin shell model:

- `name`
- `email`
- `avatarSrc`

The layout resolves this model once and passes it to the mobile header. The shell consumes normalized data only; it does not know about backend response shape details.

### Shared Admin State Primitives

Add a small shared component set for consistent admin page states:

- `AdminPageErrorState`: for blocking request failures
- `AdminEmptyState`: for legitimate empty data states
- `AdminPartialFailureNotice`: for non-blocking failures when some page sections still render
- `AdminMutationStatus` or equivalent alert/toast helper: for success and failure feedback after mutations

These primitives define the visual and copy conventions. Page agents can adopt them incrementally while preserving page-specific content.

## Data and Error Contract

### Admin API Helper

Extend the admin API helper to distinguish auth failures from general request failures. The helper should surface structured errors rather than only generic `Error` instances.

Expected behavior:

- Missing token is detectable before a request is made.
- `401` and `403` responses are surfaced as auth/session failures.
- Other non-OK responses retain backend error messages when available.
- Page code can branch between unauthorized handling and ordinary request-failure UI.

### Session Redirect Rules

The dashboard layout redirects when:

- no admin token exists
- the current-admin profile request returns unauthorized
- the current-admin profile request returns forbidden

The redirect target should use the existing entry route for the admin app unless a dedicated sign-in route already exists in the repo.

## Notification Button Behavior

Because no notification destination currently exists in the admin app, both mobile bell buttons should become explicitly disabled:

- disabled button semantics
- accessible label indicating notifications are unavailable
- visual disabled styling matching the existing shell palette

This is preferable to a dead button because it communicates intentional absence rather than an incomplete interaction.

## UI State Convention

The convention introduced in this pass:

- Loading: page-level skeleton or loading copy owned by each page, with shared shell components available if needed later.
- Empty: use `AdminEmptyState` only when the request succeeded and returned no records.
- Request failure: use `AdminPageErrorState` when the primary page query fails and the page cannot truthfully render its core content.
- Partial failure: use `AdminPartialFailureNotice` when one section fails but enough data remains to render a useful page.
- Mutation success/failure: use the shared mutation feedback helper for approve/reject/suspend/delete/update actions.

The critical distinction is that empty states are valid data outcomes, not fallback behavior for request failures.

## Testing and Verification

Implementation should include:

- focused helper tests for auth/error classification where practical
- build verification for the admin app via `npm run build`

Manual verification targets:

- dashboard routes redirect when the admin token is absent
- mobile header shows real admin identity rather than mock data
- disabled notification buttons are visible and non-interactive
- shared state components render correctly in representative scenarios

## Risks and Follow-Up

- The exact backend endpoint for the current admin profile may need confirmation from existing admin routes or controllers.
- Some pages will continue using silent fallbacks until the page-specific agents adopt the new primitives.
- If there is no suitable existing redirect target, a dedicated login or landing route may need separate follow-up.
