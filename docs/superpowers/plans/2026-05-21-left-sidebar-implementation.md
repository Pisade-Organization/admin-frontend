# Left Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the current left sidebar into a reusable, route-aware component and wire the home page to consume it.

**Architecture:** Keep the sidebar as a server-rendered presentational component in `components/layout/Sidebar.tsx`. The page owns the current route and navigation items, passing them into the sidebar so route awareness exists without introducing a client component.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS 4, `next/link`

---

### Task 1: Create the reusable sidebar component

**Files:**
- Create: `components/layout/Sidebar.tsx`

- [ ] **Step 1: Write the component file**

```tsx
import Link from "next/link";

type SidebarItem = {
  label: string;
  href: string;
};

type SidebarProps = {
  items: SidebarItem[];
  activeHref: string;
};

export default function Sidebar({ items, activeHref }: SidebarProps) {
  return (
    <aside className="flex h-screen w-[220px] shrink-0 flex-col border-r border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
          Admin
        </p>
        <h1 className="mt-2 text-lg font-semibold tracking-tight text-stone-950">
          Pisade
        </h1>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const isActive = item.href === activeHref;

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={[
                    "flex w-full items-center rounded-xl px-3 py-2 text-sm font-medium transition",
                    isActive
                      ? "bg-stone-950 text-white"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-950",
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-stone-200 px-5 py-4">
        <div className="rounded-2xl bg-stone-100 px-4 py-3">
          <p className="text-sm font-medium text-stone-950">Workspace</p>
          <p className="mt-1 text-xs leading-5 text-stone-500">
            Sidebar scaffold is ready for navigation modules.
          </p>
        </div>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Run lint on the new file**

Run: `npm run lint -- components/layout/Sidebar.tsx`
Expected: the file passes ESLint without errors

- [ ] **Step 3: Commit**

```bash
git add components/layout/Sidebar.tsx
git commit -m "feat: add reusable sidebar component"
```

### Task 2: Replace the inline sidebar in the home page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Update the page to consume the sidebar**

```tsx
import Sidebar from "@/components/layout/Sidebar";

const navigationItems = [
  { label: "Overview", href: "/" },
  { label: "Listings", href: "/listings" },
  { label: "Messages", href: "/messages" },
  { label: "Settings", href: "/settings" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <div className="flex min-h-screen">
        <Sidebar items={navigationItems} activeHref="/" />

        <main className="flex min-h-screen flex-1 flex-col p-8">
          <div className="rounded-[28px] border border-stone-200 bg-white p-8 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
            <div className="max-w-3xl">
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-stone-400">
                Main Content
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
                This area is ready for your dashboard content.
              </h2>
              <p className="mt-4 text-base leading-7 text-stone-600">
                The default starter design has been cleared. The layout now uses
                a 220px full-height sidebar on the left and a separate main
                content canvas on the right.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run lint for the updated page**

Run: `npm run lint -- app/page.tsx`
Expected: the page passes ESLint without errors

- [ ] **Step 3: Commit**

```bash
git add app/page.tsx
git commit -m "refactor: use shared sidebar in home page"
```

### Task 3: Verify the integrated shell

**Files:**
- Verify: `components/layout/Sidebar.tsx`
- Verify: `app/page.tsx`

- [ ] **Step 1: Run the project linter**

Run: `npm run lint`
Expected: ESLint exits with code 0

- [ ] **Step 2: Run a production build**

Run: `npm run build`
Expected: Next.js build completes successfully

- [ ] **Step 3: Commit**

```bash
git add components/layout/Sidebar.tsx app/page.tsx
git commit -m "chore: verify sidebar extraction"
```
