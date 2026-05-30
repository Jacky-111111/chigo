# ChiGo Package Requirements

Use this file when creating the first `package.json` for the web app. Do not use `latest`, caret ranges, or mixed major versions.

The app has not been scaffolded yet, so this repository intentionally keeps the package requirements as a template instead of a live `package.json`. When Stage 1 implementation starts, create `package.json` from this template, run `npm install`, and commit the generated `package-lock.json`.

## Runtime Requirements

- Node.js: `22.x`
- npm: `10.9.2`
- Package manager field: `npm@10.9.2`
- `.nvmrc`: `22`
- `.npmrc`: `save-exact=true` and `engine-strict=true`

## Required `package.json` Baseline

```json
{
  "name": "chigo",
  "version": "0.1.0",
  "private": true,
  "engines": {
    "node": "22.x"
  },
  "packageManager": "npm@10.9.2",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:e2e": "playwright test",
    "format": "prettier --check ."
  },
  "dependencies": {
    "@hookform/resolvers": "5.2.1",
    "@radix-ui/react-slot": "1.2.4",
    "@supabase/ssr": "0.7.0",
    "@supabase/supabase-js": "2.57.0",
    "class-variance-authority": "0.7.1",
    "clsx": "2.1.1",
    "framer-motion": "12.40.0",
    "lucide-react": "1.16.0",
    "next": "15.5.18",
    "react": "19.2.6",
    "react-dom": "19.2.6",
    "react-hook-form": "7.62.0",
    "tailwind-merge": "3.6.0",
    "zod": "4.1.5"
  },
  "devDependencies": {
    "@playwright/test": "1.55.0",
    "@tailwindcss/postcss": "4.3.0",
    "@types/node": "22.15.30",
    "@types/react": "19.2.15",
    "@types/react-dom": "19.2.3",
    "eslint": "9.39.4",
    "eslint-config-next": "15.5.18",
    "prettier": "3.6.2",
    "tailwindcss": "4.3.0",
    "typescript": "5.9.3",
    "vitest": "3.2.4"
  }
}
```

## Version Rules

- Install with `npm install --save-exact`.
- Commit `package-lock.json` after the first install.
- Keep `next` and `eslint-config-next` on the same version.
- Keep `react`, `react-dom`, `@types/react`, and `@types/react-dom` in the same major family.
- Keep `tailwindcss` and `@tailwindcss/postcss` on the same version.
- Do not run `npm install package@latest`.
- Do not use `^`, `~`, `latest`, `next`, `beta`, `canary`, or wildcard versions.
- If a new package is required, pin an exact version and update this file in the same change.

## Stage 1 Notes

Stage 1 should need the baseline packages above for:

- Next.js App Router, React, TypeScript, and Tailwind CSS.
- Supabase Auth, SSR session handling, and database access.
- Zod validation and React Hook Form settings/onboarding forms.
- shadcn-style primitives and utility classes.
- Playwright smoke tests and Vitest unit tests.

Framer Motion is available but should be used sparingly. ChiGo's first product surface should feel fast and practical, not animation-heavy.
