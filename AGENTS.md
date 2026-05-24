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

## Testing Guidelines
There is currently no automated test suite in this repository. Before opening a PR, run `npm run type-check`, `npm run lint`, and the relevant build command. When adding tests later, place them near the feature or under a dedicated `tests/` directory and name them after the target module, for example `events.store.spec.ts`.

## Commit & Pull Request Guidelines
Recent history uses lowercase prefixes such as `feature:` and `bugfix:` followed by a short summary, for example `feature: implement auth changes`. Keep commits focused and descriptive. PRs should include a concise summary, linked issue or ticket when available, screenshots for UI changes, and notes about environment or schema updates.

## Security & Configuration Tips
Copy `.env.example` into the environment file you need and fill in Supabase and Cloudinary keys. Do not commit secrets. Preserve the `esnext` build target in `vite.config.ts`; `src/main.ts` relies on top-level `await` during auth initialization.
