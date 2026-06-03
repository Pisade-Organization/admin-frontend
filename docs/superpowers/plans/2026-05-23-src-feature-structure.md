# Src Feature Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the Next.js route tree under `src/app`, introduce `src/features` and `src/shared`, and keep route files limited to rendering/importing feature page components.

**Architecture:** The `app` layer remains a thin routing shell with layouts, redirects, and route entrypoints only. Page-specific UI moves into feature modules, while reusable primitives and layout pieces move into shared folders so future pages can grow without reintroducing route-local component sprawl.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, ESLint

---

### Task 1: Create the target `src` structure

**Files:**
- Create: `src/app/`
- Create: `src/features/`
- Create: `src/shared/`
- Modify: `tsconfig.json`

- [ ] **Step 1: Move the app router into `src/app`**
- [ ] **Step 2: Move shared UI into `src/shared/components`**
- [ ] **Step 3: Update the `@/*` path alias to point at `src/*`**

### Task 2: Create thin route entrypoints

**Files:**
- Modify: `src/app/(dashboard)/overview/page.tsx`
- Modify: `src/app/(dashboard)/tutors/page.tsx`
- Modify: `src/app/(dashboard)/students/page.tsx`
- Modify: `src/app/(dashboard)/applications/page.tsx`
- Modify: `src/app/(dashboard)/transactions/page.tsx`
- Modify: `src/app/(dashboard)/resolve-disputes/page.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx`
- Create: `src/features/*/components/*Page.tsx`

- [ ] **Step 1: Replace direct blank-page rendering in each route with feature imports**
- [ ] **Step 2: Add one feature page component per existing dashboard route**
- [ ] **Step 3: Keep layout and redirect behavior unchanged**

### Task 3: Verify the migration

**Files:**
- Test: `package.json`

- [ ] **Step 1: Run `npm run lint`**
- [ ] **Step 2: Fix any import or path issues from the move**
- [ ] **Step 3: Confirm the resulting structure matches the agreed boundary: `app` thin, `features` page-owned, `shared` cross-feature**
