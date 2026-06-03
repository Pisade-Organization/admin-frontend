# Agent 4 Admin Pages Design

**Scope:** Transactions page and Settings page in the admin app, including backend support needed to make the UI accurate and useful.

## Goals

- Replace silent request fallbacks with explicit empty and error states.
- Add usable filtering and pagination for transactions and audit logs.
- Improve discount-code mutations with validation, confirmation, and visible feedback.
- Keep finance operations read-only until there is an audited admin mutation flow for withdrawals.

## Transactions

The transactions page should remain a read-only operations view backed by `/v1/admin/finance/stats` and `/v1/admin/finance/transactions`. The backend query needs to grow beyond `type` so admins can filter by `status`, date range, and a free-text query that matches transaction identifiers and nearby finance metadata where possible. The response should also include related wallet, tutor, and student context when available so the frontend can link to existing admin entities instead of rendering opaque IDs.

The frontend should preserve the current server-rendered pattern. It should show distinct states for:

- stats loaded vs stats failed
- ledger loaded with rows
- ledger loaded with no matches
- ledger request failed

Pending withdrawals stay visible but read-only. This is the safest choice because there is no existing admin approval or rejection flow, and inventing one in the same pass would introduce unaudited finance mutations.

## Settings

The settings page should keep discount-code management and audit-log browsing on one screen, but both sections need stronger state handling.

Discount-code creation should validate code, amount, and expiry before sending the mutation. The server action should redirect with structured success or error query params so the page can show visible feedback after a submission. Deletion should require a user confirmation in the UI before the form posts. Existing filter params must survive both actions.

Audit logs need backend support for more than a single `entity` field. This pass should add `action`, `actor`, and pagination parameters while preserving the current route. The response should include `page` and `totalPages`, and the frontend should expose those filters plus clearer actor/target presentation.

## Error And State Conventions

These two pages should stop collapsing request failures into empty data. Each request should be represented as one of:

- success with data
- success with zero results
- failure with an error message

Mutation results should use query-string flash parameters because the pages are server components driven by form actions and redirects.

## Testing

- Backend: extend `src/admin/admin.service.spec.ts` to cover new transaction filters, related-entity enrichment, and richer audit-log filtering and pagination behavior.
- Admin frontend: add small helper-level tests using Node's built-in test runner for query-string builders, normalization, and flash-message parsing that support the new page behavior.
- Verification: run targeted backend Jest tests, frontend Node tests, and an admin production build.
