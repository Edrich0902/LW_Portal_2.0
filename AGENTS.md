# Repository Guidelines

## Project Structure & Module Organization
`src/` contains the application code. Use `src/views/` for route-level pages, `src/components/` for reusable UI, `src/stores/` for Pinia state, and `src/services/` for Supabase or other external calls. Keep the data flow `view -> store -> service`; views should not call services directly. Shared clients live in `src/lib/`, global styles and images in `src/assets/`, and TypeScript models in `src/types/`. Static files belong in `public/`.

## Build, Test, and Development Commands
Install dependencies with `npm install`.

- `npm run dev` starts the Vite dev server in development mode.
- `npm run build` runs `vue-tsc` and a production build.
- `npm run stage` builds with staging settings.
- `npm run prod` builds with production settings.
- `npm run preview` serves the built app locally.
- `npm run lint` runs Oxlint and ESLint with auto-fixes.
- `npm run format` applies Prettier to `src/`.

## Coding Style & Naming Conventions
Use TypeScript and Vue 3 with `<script setup lang="ts">`. Follow `.editorconfig`: 2-space indentation, LF endings, UTF-8, and a 100-character line width. Prettier enforces `singleQuote: true` and no semicolons. Name reusable components with the `Lwp` prefix, for example `LwpAvatar.vue`. Keep stores in feature folders such as `src/stores/events/events.store.ts`, and mirror that pattern for services and types. Prefer configured aliases like `@stores` and `@services` over long relative imports.

## Component-First Rule
Before writing raw HTML elements (`<img>`, `<div>`, `<span>`) to implement a UI pattern, always check whether PrimeVue or an existing `Lwp*` project component already covers it. Examples: use PrimeVue `Avatar` (with `LwpImage` in its slot for Cloudinary-backed images) instead of a raw `<img>` + `<div>` avatar combo; use `LwpImage` for any Cloudinary-backed image instead of a plain `<img src="...">`. Only fall back to raw HTML when no existing component fits.

## Testing Guidelines
There is currently no automated test suite in this repository. Before opening a PR, run `npm run type-check`, `npm run lint`, and the relevant build command. When adding tests later, place them near the feature or under a dedicated `tests/` directory and name them after the target module, for example `events.store.spec.ts`.

## Commit & Pull Request Guidelines
Recent history uses lowercase prefixes such as `feature:` and `bugfix:` followed by a short summary, for example `feature: implement auth changes`. Keep commits focused and descriptive. PRs should include a concise summary, linked issue or ticket when available, screenshots for UI changes, and notes about environment or schema updates.

## Security & Configuration Tips
Copy `.env.example` into the environment file you need and fill in Supabase and Cloudinary keys. Do not commit secrets. Preserve the `esnext` build target in `vite.config.ts`; `src/main.ts` relies on top-level `await` during auth initialization.

## Roadmap Sync Rule
Always keep `LW_Portal_2.0/roadmap.md` and `LW_App/Roadmap.md` in sync when adding new features, reprioritizing work, or marking features complete.

## Shared Platform Context
- Groups 2.0 is already in progress across the shared Supabase backend, this portal repo, and `LW_App`.
- Supabase SQL lives in the sibling `lwp/supabase/migrations` directory, not inside this repo.
- Current group backend contract already includes:
  - `group_memberships`
  - `groups_public_view`
  - `groups_admin_view`
  - `group_memberships_view`
  - group join/approve/decline/leave/remove/leader RPCs
- Group feed backend is also now implemented in Supabase with:
  - `group_posts`
  - `group_post_reactions`
  - `group_posts_view`
  - post/reaction RPCs
- The mobile feed handoff reference lives at `LW_App/docs/groups-feed-handoff.md`.

## Group Implementation Notes
- Portal group management was intentionally moved out of the modal into a dedicated management screen.
- The Connect & Serve modal should remain focused on create/edit/delete only.
- Group deletion is safe because membership rows cascade on delete via the backend schema.
- A prior permissions bug came from using `security_invoker = on` on views that joined `auth.users`; the fix was to recreate those views without `security_invoker` in the follow-up Supabase migration.
- Mobile group feed is full-screen, not embedded inside the group detail page. If portal moderation is added later, preserve that mobile-first feed design.
