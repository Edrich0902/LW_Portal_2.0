# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LW Portal 2.0 is a Vue 3 + TypeScript SPA for managing church content and users. Built with Vite, Pinia, PrimeVue 4, Tailwind CSS 4, Supabase (auth + database), and Cloudinary (media).

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
