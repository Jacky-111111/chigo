# ChiGo

ChiGo is an AI-powered dining companion for students, starting with Carnegie Mellon University in Pittsburgh.

Stage 2 is the current implementation target: authentication, editable user settings, nearby restaurants, instant dining invites, and the first AI menu assistant.

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

### 3. Start the Dev Server

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

## Environment Variables

Copy `.env.example` into `.env.local` and fill in the configured values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
OPENAI_API_KEY=
OPENAI_MENU_MODEL=gpt-4o-mini
OPENAI_MENU_TIMEOUT_MS=60000
```

Stage 2 menu analysis needs `OPENAI_API_KEY`. `OPENAI_MENU_MODEL` can be changed without code edits if the AI provider model changes later.
`OPENAI_MENU_TIMEOUT_MS` defaults to `60000` when omitted and is clamped between 10 and 120 seconds.

## Supabase Setup

Run the migrations in order:

```bash
db/migrations/0001_stage1_schema.sql
db/migrations/0002_stage2_menu_assistant.sql
db/migrations/0003_stage2_advisor_fixes.sql
db/migrations/0004_stage2_menu_image_normalization.sql
```

Then seed restaurants if needed:

```bash
db/seed/stage1_restaurants.sql
```

The Stage 2 migrations create the private `menu-images` storage bucket plus RLS policies for menu uploads, menu items, feedback, and owned image paths. HEIC/HEIF uploads are normalized to JPEG before storage and AI analysis.

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

## Stage 2 Flow

After Supabase and OpenAI are configured:

1. Visit `/menus`.
2. Upload a menu image from `/menus/new`.
3. Optionally link it to a restaurant.
4. Open `/menus/[id]` to review translations, dish explanations, dietary warnings, and personalized recommendations.
5. Submit feedback on incorrect AI output when needed.
6. Open `/restaurants/[id]` to see restaurant info, active invites, and linked menu analyses.

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
