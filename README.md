# ChiGo

ChiGo is an AI-powered dining companion for students, starting with Carnegie Mellon University in Pittsburgh.

Stage 1 is the current implementation target: authentication, editable user settings, nearby restaurants, and instant dining invites.

## Local Setup

### 1. Use the Required Node Version

This project is pinned to Node.js `22.x` and npm `10.9.2`.

```bash
nvm use
node --version
npm --version
```

If `nvm use` does not work, install Node 22 first.

### 2. Install Dependencies

```bash
npm install
```

Dependencies are intentionally exact-pinned. Do not install packages with `latest`, `^`, or `~`.

### 3. Configure Environment Variables

Create a local env file:

```bash
cp .env.example .env.local
```

Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Without Supabase env vars, the app still renders the login page, but auth and protected app flows will not work.

### 4. Set Up Supabase

Create a Supabase project, then run the SQL files in this order:

```text
db/migrations/0001_stage1_schema.sql
db/seed/stage1_restaurants.sql
```

The migration creates Stage 1 tables, triggers, indexes, grants, and RLS policies. The seed file adds CMU-area restaurants.

In Supabase Auth settings, enable:

- Email/password auth
- Google OAuth, optional for local Stage 1 testing

For Google OAuth, set the callback URL to:

```text
http://localhost:3000/auth/callback
```

### 5. Start the Dev Server

```bash
npm run dev
```

Open:

[http://localhost:3000](http://localhost:3000)

If a local sandbox blocks binding to `localhost`, use:

```bash
npm run dev -- -H 127.0.0.1
```

Then open:

[http://127.0.0.1:3000](http://127.0.0.1:3000)

## Useful Commands

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
npm audit
```

Playwright e2e tests require Chromium:

```bash
npx playwright install chromium
```

If Playwright cannot launch Chromium inside a restricted sandbox, run the e2e command in a normal local terminal.

## Stage 1 Flow

After Supabase is configured:

1. Visit `/login`.
2. Create an account or sign in.
3. Complete `/onboarding`.
4. Browse `/restaurants`.
5. Create an invite from `/invites/new`.
6. View open invites at `/invites`.
7. Open an invite detail page to join, leave, or cancel.

## Docs

- [Product spec index](./SPEC.md)
- [Shared tech stack](./TECH_STACK.md)
- [Visual design system](./DESIGN_SYSTEM.md)
- [Package requirements](./PACKAGE_REQUIREMENTS.md)
- [Stage 1: Web MVP](./specs/Stage1.md)
- [Stage 2: AI menu assistant](./specs/Stage2.md)
- [Stage 3: Nutrition and meal journal](./specs/Stage3.md)
- [Stage 4: Social dining and planning](./specs/Stage4.md)
- [Stage 5: Mobile and scale](./specs/Stage5.md)

## Notes

- Keep package versions exact.
- Commit `package-lock.json` whenever dependencies change.
- Keep `next` and `eslint-config-next` on the same exact version.
- Keep `tailwindcss` and `@tailwindcss/postcss` on the same exact version.
- Do not commit `.env.local`, `.next`, `node_modules`, or Playwright reports.
