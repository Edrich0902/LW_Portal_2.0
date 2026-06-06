# LW Portal 2.0 - Project Context

## Project Overview
LW Portal 2.0 is a modern web application built with **Vue 3** and **TypeScript**, serving as a portal for managing church-related content and users. It uses **Vite** as the build tool and leverages a suite of modern technologies for state management, UI, and backend services.

## Roadmap Sync Rule
- Always keep `LW_Portal_2.0/roadmap.md` and `LW_App/Roadmap.md` in sync when adding new features, reprioritizing work, or marking features complete.

## Shared Groups Context
- Groups 2.0 is already underway across the sibling Supabase migrations repo, this portal repo, and `LW_App`.
- Supabase schema work is stored in the sibling `lwp/supabase/migrations` directory.
- The current shared group backend already includes:
  - `group_memberships`
  - `groups_public_view`
  - `groups_admin_view`
  - `group_memberships_view`
  - membership and leader-management RPCs
- Group feed backend is also implemented with:
  - `group_posts`
  - `group_post_reactions`
  - `group_posts_view`
  - post and reaction RPCs
- Mobile handoff details for the feed live in `LW_App/docs/groups-feed-handoff.md`.

## Groups Implementation Notes
- Portal member management for Connect & Serve belongs on the dedicated manage screen, not inside the CRUD modal.
- The portal modal should stay limited to create/edit/delete behavior.
- Group deletion depends on backend cascade behavior for memberships.
- A previous `permission denied for table users` issue came from `security_invoker = on` on views that joined `auth.users`; the fix was applied in `20260606143000_fix_groups_view_permissions.sql`.
- The group feed is a full-screen mobile experience. Future portal work should treat moderation as secondary, not as the primary authoring surface.

### Core Technology Stack
- **Frontend Framework:** Vue 3 (Composition API)
- **Language:** TypeScript
- **Build Tool:** Vite 6
- **State Management:** Pinia 3
- **UI Components:** PrimeVue 4 (Aura Theme)
- **Styling:** Tailwind CSS 4
- **Backend-as-a-Service:** Supabase (Auth, Database)
- **Media Management:** Cloudinary
- **Icons:** PrimeIcons

## Architecture & Directory Structure
The project follows a modular structure organized by feature:

- `src/assets/`: Global styles (Tailwind) and static assets.
- `src/components/`: Reusable Vue components (Drawer, PageWrapper, LwpAvatar, etc.).
- `src/lib/`: Client initializations for third-party services (Supabase, Cloudinary).
- `src/router/`: Vue Router configuration with authentication guards.
- `src/services/`: API interaction logic, typically using `supabaseClient`.
- `src/stores/`: Pinia stores for application state (Auth, Announcements, Events, etc.).
- `src/types/`: TypeScript interfaces and types, organized by entity.
- `src/views/`: Main page components.

## Development Workflows

### Environment Setup
Copy `.env.example` to `.env` and provide the following:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_API_KEY`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

### Key Commands
- **Development:** `npm run dev` (runs Vite in development mode)
- **Build:**
  - Production: `npm run prod` (outputs to `dist/prod`)
  - Staging: `npm run stage` (outputs to `dist/stage`)
- **Type-Check:** `npm run type-check` (uses `vue-tsc`)
- **Linting:** `npm run lint` (runs ESLint and Oxlint)
- **Formatting:** `npm run format` (runs Prettier)

### Build Target & Top-Level Await
The project uses **top-level await** in `src/main.ts` to ensure authentication is initialized before the app mounts and the router is used. 
- **CRITICAL:** The `vite.config.ts` must have `build.target` set to `esnext` (or at least `es2022`) to support this during the build process.

## Coding Conventions
1. **Composition API:** Always use `<script setup lang="ts">` in Vue components.
2. **Type Safety:** Ensure all data structures are typed in `src/types/`. Avoid `any`.
3. **State Management:** Use Pinia stores for shared state. Stores should handle side effects (like API calls) by calling services.
4. **Services Layer:** Abstract all Supabase and external API logic into dedicated service files in `src/services/`.
5. **UI Consistency:** Use PrimeVue components and Tailwind CSS for styling to maintain a consistent look and feel.
6. **Component-First:** Before writing raw HTML elements (`<img>`, `<div>`, `<span>`) to implement a UI pattern, check whether PrimeVue or an existing `Lwp*` project component already covers it. For example: use PrimeVue `Avatar` (with `LwpImage` in its slot) instead of a raw `<img>` + `<div>` avatar combo; use `LwpImage` for any Cloudinary-backed image instead of a plain `<img src="...">`. Only fall back to raw HTML when no existing component fits.
7. **Aliases:** Use defined path aliases for imports:
   - `@` -> `src/`
   - `@views` -> `src/views/`
   - `@components` -> `src/components/`
   - `@stores` -> `src/stores/`
   - `@services` -> `src/services/`
   - `@lib` -> `src/lib/`

## Tailwind CSS & Styling
1. **CRITICAL: Utility Importance:** When using `@apply` in CSS files (like `src/assets/main.css`), **NEVER** use the trailing `!important` syntax (e.g., `@apply p-4 !important;` will fail).
   - **CORRECT:** Use the Tailwind important prefix `!` on each individual utility class (e.g., `@apply !p-4 !text-lg;`).
2. **Variant Order:** When combining the important prefix with variants, the `!` must come after the variant but before the utility (e.g., `dark:!bg-surface-900`, `focus:!ring-primary-500`).
3. **Component Overrides:** Use `@layer components` for global PrimeVue overrides to ensure correct cascade and build stability.

## Engineering Standards (UI/UX)
1. **Asynchronous Operations:** Every asynchronous operation (API calls, data fetching, file uploads) MUST have associated **Loading** and **Error** states.
   - **Loading States:** Use `ProgressSpinner` or Skeleton components to provide immediate visual feedback. Never leave the user wondering if the app is still working.
   - **Error States:** Implement graceful error handling. If an operation fails, notify the user via a `Toast` or an inline `Message` component.
2. **Data Integrity:** Dashboards and summary views should prioritize total data accuracy. If pagination is used in management views, dashboard-specific service methods should be created to fetch non-paginated aggregates when necessary.
3. **Interactive Feedback:** Use `hover` states, `active` states, and `ripple` effects to make the interface feel responsive and "alive." Ensure high contrast is maintained during interactions for accessibility.
4. **Mobile Responsiveness:** All views must be designed with a responsive mindset, utilizing Tailwind's grid and flex utilities to ensure usability across mobile, tablet, and desktop.

## Authentication
Authentication is managed via Supabase. The `auth.store.ts` handles the login state and provides a `initialise` method called in `main.ts` before the app mounts. Routes are protected using `meta.authed` in `router/index.ts`.
