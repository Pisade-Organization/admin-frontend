# Left Sidebar Component Design

## Goal

Extract the existing left sidebar from the home page into a separate reusable component that is route-aware from the start.

## Scope

- Create a dedicated sidebar component in `components/layout/Sidebar.tsx`
- Move the current left-rail structure and styles into that component
- Replace action-style buttons with navigation links
- Make the component accept a typed navigation list and the active route
- Update the current page to consume the component

## Non-Goals

- Building the full dashboard route tree
- Adding icons, collapsible groups, or mobile drawer behavior
- Moving the whole app shell into a shared layout in this change

## Design

### Component boundary

`Sidebar` will be a presentational server component. It will receive:

- `items`: ordered navigation items with `label` and `href`
- `activeHref`: current route used to style the active item

This keeps route detection outside the component and avoids introducing client-only hooks for a simple navigation shell.

### Rendering behavior

- The header remains the existing "Admin / Pisade" block
- Navigation items render with `next/link`
- The active item uses a stronger background and foreground treatment
- Inactive items preserve the current muted style and hover behavior
- The footer workspace card remains inside the sidebar component

### Route awareness

For this first pass, the page will pass the current route explicitly. Since the app currently only renders `/`, the page can pass `"/"` now while the component API remains correct for future routes.

When more routes are added, the same API can be fed by route-specific pages or by a higher shared layout without changing the sidebar internals.

### File changes

- Add `components/layout/Sidebar.tsx`
- Update `app/page.tsx` to render `Sidebar`

## Testing

Add a focused component test if test infrastructure already exists. If no test setup exists, keep the component simple and defer test harness setup to a dedicated change.

## Risks

- If route matching becomes more complex later, exact href matching may need to evolve into segment-aware matching
- If the shell moves into `app/layout.tsx`, the parent ownership of `activeHref` will change, but the sidebar API can stay the same
