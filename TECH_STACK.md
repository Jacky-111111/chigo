# ChiGo Tech Stack

This document is the shared technical reference for all staged specs. Stage-specific requirements live in `specs/Stage*.md`.

## Product Platforms

- Stage 1-4 primary platform: responsive web app.
- Stage 5 mobile platform: Expo React Native app.
- Backend should be designed so core validation, data types, and business rules can be reused by web and mobile.

## Frontend

- Framework: Next.js `15.5.18` with App Router.
- Runtime UI: React `19.2.6` and React DOM `19.2.6`.
- Language: TypeScript `5.9.3`.
- Styling: Tailwind CSS `4.3.0` with `@tailwindcss/postcss` `4.3.0`.
- UI components: shadcn/ui-style composition or locally composed accessible components.
- UI primitives and utilities: `@radix-ui/react-slot` `1.2.4`, `class-variance-authority` `0.7.1`, `clsx` `2.1.1`, and `tailwind-merge` `3.6.0`.
- Icons: `lucide-react` `1.16.0`.
- Motion: `framer-motion` `12.40.0`, only when it improves clarity or interaction feedback.
- Forms: React Hook Form `7.62.0` with Zod `4.1.5` and `@hookform/resolvers` `5.2.1`, or server-action forms with Zod validation.
- Data validation: Zod schemas shared between client and server where possible.
- Visual design requirements: follow [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md).

## Package Version Policy

- Required package template: [PACKAGE_REQUIREMENTS.md](./PACKAGE_REQUIREMENTS.md).
- Node.js version: `22.x`.
- npm version: `10.9.2`.
- `package.json` must include `"packageManager": "npm@10.9.2"` and `"engines": { "node": "22.x" }`.
- Use exact package versions only. Do not use `latest`, `^`, `~`, wildcards, prerelease tags, or mixed major versions.
- The repository includes `.nvmrc` and `.npmrc` to keep local installs aligned.
- Vercel Project Settings should use Node.js `22.x`.
- Commit `package-lock.json` after the first install.
- Keep `next` and `eslint-config-next` on the same exact version.
- Keep `tailwindcss` and `@tailwindcss/postcss` on the same exact version.
- Keep React runtime packages and React type packages in the same major family.

## Backend

- Primary backend: Next.js Server Actions and Route Handlers.
- Server-side data access: Supabase server client using `@supabase/ssr` `0.7.0`.
- Client-side data access: `@supabase/supabase-js` `2.57.0` only for authenticated user session state and safe realtime subscriptions.
- API shape: keep mutation logic in server actions or service functions, not directly inside page components.

## Database

- Primary database: Supabase Postgres.
- Row Level Security: enabled on all user-owned or user-visible tables.
- IDs: UUID primary keys.
- Timestamps: `created_at`, `updated_at` where useful.
- Location data: start with latitude and longitude numeric columns; add PostGIS later only if needed.
- Migrations: SQL migrations checked into the repository once the app scaffold exists.

## Authentication

- Provider: Supabase Auth.
- Stage 1 methods: email/password and Google OAuth.
- Future methods: phone login and CMU Andrew login if feasible.
- Protected routes must redirect unauthenticated users to login.

## Storage

- Provider: Supabase Storage.
- Buckets:
  - `avatars`
  - `restaurant-photos`
  - `menu-images`
  - `meal-photos`
- Stage 1 can implement avatar upload later in the stage if it does not block the core invite flow.

## Deployment

- Hosting: Vercel.
- Database/Auth/Storage: Supabase project.
- Environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY` only for server-only admin scripts when absolutely needed
  - `NEXT_PUBLIC_APP_URL`
  - `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` if required by Supabase OAuth configuration
  - Future: `OPENAI_API_KEY`, `GOOGLE_MAPS_API_KEY`, `YELP_API_KEY`

## AI Providers

- Preferred initial provider: OpenAI.
- AI calls should sit behind small service functions, for example `analyzeMenuImage`, `translateDish`, `estimateMealNutrition`.
- Store AI outputs with model name, input metadata, confidence, and timestamp when the output affects user history.
- Never present AI nutrition estimates as medical advice.

## Maps and Restaurant Data

- Stage 1: use browser geolocation plus a seeded restaurants table around CMU.
- Stage 2+: add Google Maps and Yelp Fusion adapters.
- Restaurant data should be normalized into the local `restaurants` table before being used by invites.

## Realtime and Notifications

- Stage 1: polling or normal page refresh is acceptable.
- Stage 2-4: Supabase Realtime may be used for invite participant updates.
- Stage 5: Expo push notifications and in-app notifications.

## Testing

- Unit test runner: Vitest `3.2.4`.
- End-to-end test runner: Playwright `@playwright/test` `1.55.0`.
- Unit tests: validation schemas and service functions.
- Integration tests: server actions and database policies where practical.
- End-to-end tests: Playwright for the main user flows.
- Required Stage 1 E2E flows:
  - Sign up or sign in.
  - Complete onboarding/settings.
  - View nearby restaurants.
  - Create an instant dining invite.
  - Join and leave an invite from another account or test user.

## Code Organization Guidance

Suggested structure once the app is scaffolded:

```text
app/
  (auth)/
  (app)/
  api/
components/
lib/
  supabase/
  validations/
  services/
  utils/
db/
  migrations/
  seed/
types/
```

Keep stage-specific temporary mocks isolated under `db/seed` or `lib/mock-data` so they can be replaced by real integrations later.
