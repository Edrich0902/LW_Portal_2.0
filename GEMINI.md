# LW Portal 2.0 - Project Context

## Project Overview
LW Portal 2.0 is a modern web application built with **Vue 3** and **TypeScript**, serving as a portal for managing church-related content and users. It uses **Vite** as the build tool and leverages a suite of modern technologies for state management, UI, and backend services.

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

## Coding Conventions
1. **Composition API:** Always use `<script setup lang="ts">` in Vue components.
2. **Type Safety:** Ensure all data structures are typed in `src/types/`. Avoid `any`.
3. **State Management:** Use Pinia stores for shared state. Stores should handle side effects (like API calls) by calling services.
4. **Services Layer:** Abstract all Supabase and external API logic into dedicated service files in `src/services/`.
5. **UI Consistency:** Use PrimeVue components and Tailwind CSS for styling to maintain a consistent look and feel.
6. **Aliases:** Use defined path aliases for imports:
   - `@` -> `src/`
   - `@views` -> `src/views/`
   - `@components` -> `src/components/`
   - `@stores` -> `src/stores/`
   - `@services` -> `src/services/`
   - `@lib` -> `src/lib/`

## Authentication
Authentication is managed via Supabase. The `auth.store.ts` handles the login state and provides a `initialise` method called in `main.ts` before the app mounts. Routes are protected using `meta.authed` in `router/index.ts`.
