# LW Portal 2.0 — Agent Guide

Vue 3 + TypeScript admin portal for Lewende Woord Paarl. Platform context: see `../AGENTS.md`. Roadmap: `../roadmap.md`.

**Stack:** Vite 6, Pinia 3, PrimeVue 4 (Aura), Tailwind CSS 4, Supabase, Cloudinary.

## Project Structure

- `src/views/` — route-level pages
- `src/components/` — reusable UI (`Lwp*` prefix, auto-imported)
- `src/stores/` — Pinia state
- `src/services/` — Supabase / external API calls (no state)
- `src/lib/` — Supabase and Cloudinary clients
- `src/types/` — TypeScript models by entity

**Data flow:** `view → store → service → Supabase`. Views must not call services directly.

## Commands

```bash
npm install
npm run dev          # Vite dev server
npm run stage        # build to dist/stage
npm run prod         # build to dist/prod
npm run type-check   # vue-tsc
npm run lint         # Oxlint + ESLint (auto-fix)
npm run format       # Prettier on src/
```

## Authentication

- `auth.store.ts` exposes `initialise()` — called in `main.ts` with top-level await before mount
- Route guards use `meta.authed`
- Only `SUPER_ADMIN` users can access the portal (enforced at auth layer)

**CRITICAL:** `vite.config.ts` must keep `build.target: 'esnext'` for top-level await in `main.ts`.

## Coding Conventions

- `<script setup lang="ts">` in all Vue components
- No `any` — types belong in `src/types/`
- Path aliases: `@`, `@views`, `@components`, `@stores`, `@services`, `@lib`
- Every async operation needs loading + error states (`Status` enum, `ProgressSpinner`/skeleton, `Toast`/`Message`)
- Services return `SupabaseResponse<T>`

### Component-first rule

Before raw HTML (`<img>`, `<div>`, `<span>`), check PrimeVue or existing `Lwp*` components:

- Cloudinary images → `LwpImage`
- Avatars → PrimeVue `Avatar` with `LwpImage` in slot, or initials fallback
- Read-only Quill → `LwpQuillViewer`
- Tables → global-themed `DataTable`; loading → `LwpSkeletonTable`; empty → `LwpEmptyState`

## Tailwind CSS

Never append `!important` after `@apply` — use per-class `!` prefix: `@apply !p-4 !text-lg`.
Variant + important: `dark:!bg-surface-900`, `focus:!ring-primary-500`.
Global PrimeVue overrides live in `src/assets/main.css` under `@layer components` — do not restyle shared components per-view.

## Design System

- Brand colour: `primary` = Tailwind `sky` — use on interactive/active states, not large flat fills
- Card panels: `rounded-xl border border-surface-200 dark:border-surface-700 shadow-sm bg-surface-0 dark:bg-surface-900 p-4`
- Calendar (`LwpEventCalendar.vue`) uses its own `<style>` block (FullCalendar) but follows the same language

## Environment

Copy `.env.example` → `.env.development` / `.env.staging` / `.env.production`:

```
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
VITE_CLOUDINARY_CLOUD_NAME
VITE_CLOUDINARY_API_KEY
VITE_CLOUDINARY_UPLOAD_PRESET
```

## Groups & Feed

Full contract and UX decisions: `../LW_App/docs/groups-feed-handoff.md`.

Key portal rules:

- Connect & Serve CRUD modal: create/edit/delete only — member management lives on the dedicated manage screen (`/connect-serve/:id/manage`)
- Manage screen has **Members** and **Feed** tabs; portal moderates feed, does not author
- Group deletion relies on backend cascade for memberships

## Events

Non-obvious calendar/RSVP behaviour: `docs/events.md`.

## Testing

No automated test suite yet. Before PR: `npm run type-check`, `npm run lint`, relevant build command.
