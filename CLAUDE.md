# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LW Portal 2.0 is a Vue 3 + TypeScript SPA for managing church content and users. Built with Vite, Pinia, PrimeVue 4, Tailwind CSS 4, Supabase (auth + database), and Cloudinary (media).

## Roadmap Sync Rule

Always keep `LW_Portal_2.0/roadmap.md` and `LW_App/Roadmap.md` in sync when adding new features, reprioritizing work, or marking features complete.

## Shared Groups Context

- Groups 2.0 is already partially delivered across the sibling Supabase repo, this portal repo, and `LW_App`.
- Supabase SQL is stored in the sibling `lwp/supabase/migrations` folder.
- Existing shared group backend includes:
  - `group_memberships`
  - `groups_public_view`
  - `groups_admin_view`
  - `group_memberships_view`
  - RPCs for join request, cancel, approve, decline, leave, remove, leader assignment, and leader edits
- Group feed backend also exists now:
  - `group_posts` — includes `is_pinned boolean not null default false`
  - `group_post_reactions`
  - `group_posts_view` — exposes `is_pinned`; ordered by `is_pinned DESC, created_at DESC`
  - post/reaction RPCs including `set_group_post_pinned(target_post_id, should_pin)`
- Portal feed moderation is implemented in `ConnectServeManageView` as a Feed tab (view, pin/unpin, delete).
- `LwpQuillViewer` component exists at `src/components/lwp-quill-viewer/LwpQuillViewer.vue` — use it anywhere read-only Quill Delta rendering is needed. The `quill` npm package (v2.0.3) is installed.
- Full technical state and handoff notes are in `LW_App/docs/groups-feed-handoff.md`.

## Groups-Specific Notes

- Connect & Serve admin member management should live on the dedicated manage screen, not in the CRUD modal.
- The modal is intentionally limited to create, edit, and delete of groups.
- Group deletion relies on backend cascade behavior for memberships.
- A prior Supabase permission issue was caused by `security_invoker = on` on views that joined `auth.users`; that was fixed by recreating the views without `security_invoker` in `20260606143000_fix_groups_view_permissions.sql`.
- Mobile group feed is intentionally full-screen. Portal moderation is secondary — it views and moderates, it does not author.
- Portal feed moderation lives in the Feed tab of `ConnectServeManageView`, not in the CRUD modal.

## Commands

```bash
npm run dev          # Vite dev server (development mode)
npm run stage        # Build to dist/stage (staging)
npm run prod         # Build to dist/prod (production)
npm run type-check   # vue-tsc type checking
npm run lint         # Oxlint then ESLint with auto-fix
npm run format       # Prettier on src/
```

## Architecture

The data flow is: **Component → Store → Service → Supabase**

- `src/services/` — all Supabase/external API calls; no state here
- `src/stores/` — Pinia stores; call services and own reactive state (status, data, pagination, filter, sort)
- `src/views/` — page components; call stores, never call services directly
- `src/components/` — reusable components prefixed `Lwp*` (auto-imported)
- `src/lib/` — third-party client initializations (Supabase, Cloudinary)
- `src/types/` — all TypeScript types, organized by entity/feature

**Authentication:** `auth.store.ts` exposes an `initialise()` method called in `main.ts` with top-level await before the Vue app mounts. Route guards check `meta.authed`. Only users with `SUPER_ADMIN` role can access the portal — this is enforced at the auth layer, not just the UI.

**CRITICAL — build target:** `vite.config.ts` must have `build.target: 'esnext'` to support top-level await in `main.ts`. Never downgrade this.

## Coding Conventions

- Always use `<script setup lang="ts">` in Vue components
- No `any` types — all data structures belong in `src/types/`
- **Component-first:** Before writing raw HTML (`<img>`, `<div>`, `<span>`) for a UI pattern, check if PrimeVue or an `Lwp*` component already covers it. Use PrimeVue `Avatar` (with `LwpImage` in its slot for Cloudinary images) instead of raw `<img>` + `<div>` avatar combos. Use `LwpImage` for any Cloudinary-backed image. Only use raw HTML when no existing component fits.
- Use path aliases for all imports:
  - `@` → `src/`
  - `@views` → `src/views/`
  - `@components` → `src/components/`
  - `@stores` → `src/stores/`
  - `@services` → `src/services/`
  - `@lib` → `src/lib/`
- Every async operation must have loading and error states using the `Status` enum; show `ProgressSpinner`/skeleton during loading, `Toast`/`Message` on error
- Use `SupabaseResponse<T>` as the generic return wrapper from service functions

## Tailwind CSS

**CRITICAL:** When using `@apply` in CSS files, never append `!important` at the end of the rule — that breaks the build. Use Tailwind's `!` prefix per-class instead:

```css
/* WRONG */
@apply p-4 text-lg !important;

/* CORRECT */
@apply !p-4 !text-lg;
```

When combining the important prefix with variants: `dark:!bg-surface-900`, `focus:!ring-primary-500` (variant first, then `!`, then utility).

Use `@layer components` for global PrimeVue component overrides.

## Design System / UI Standards

The portal has a shared visual language. When adding or restyling UI, match these standards rather than introducing one-off styles.

**Brand colour:** `primary` is mapped to Tailwind `sky` (see `main.ts`). Treat `primary-*` as the brand. Surface the brand on **interactive / active states** — row hover, active sort column, active paginator page, selected toggle option — not as large flat fills. Resting state uses neutral `surface-*` tokens.

**Elevated panel / card:** Top-level content surfaces (tables, calendar, and similar primary panels) share one card treatment:
`rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm bg-surface-0 dark:bg-surface-900` with `p-4` padding. Any loading placeholder (skeleton) for a carded surface must inherit the same card so there is no visual jump when data loads.

**Centralize component styling:** Global PrimeVue component appearance is standardized once in `src/assets/main.css` under `@layer components`. Do **not** restyle shared components (DataTable, Button, InputText, Paginator, Dialog) per-view — view files set props/layout/slots only, never duplicate global look-and-feel. Remember the Tailwind `@apply` rule above (per-class `!` prefix, variant-first; never a trailing `!important`).

- **Tables** are themed globally: card container, uppercase muted column headers, brand-tinted row hover, brand active-sort highlight, denser cells, subtle striping, sticky-header shadow, and a polished paginator (ghost buttons, brand-filled active page). Views just declare `<DataTable>` / `<Column>` + the `#header`/`#empty` slots. Loading uses `LwpSkeletonTable`, empty uses `LwpEmptyState`.
- **Calendar** (`LwpEventCalendar.vue`) is themed in its own component `<style>` block (FullCalendar is not a PrimeVue component) but follows the same card + brand-on-interaction language.

**PrimeVue 4 DataTable selectors** (for future global overrides): `.p-datatable` (root), `.p-datatable-header` (header slot), `.p-datatable-thead > tr > th`, `.p-datatable-column-title`, `.p-datatable-sort-icon`, `.p-datatable-column-sorted`, `.p-datatable-tbody > tr` + `td`, striped rows `.p-row-odd` / `.p-row-even`, hover root `.p-datatable-hoverable`, paginator `.p-paginator` / `.p-paginator-page` / `.p-paginator-page-selected` / `.p-paginator-current`.

## Environment Variables

Copy `.env.example` to `.env.development` / `.env.staging` / `.env.production` and populate:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_UPLOAD_PRESET
```
