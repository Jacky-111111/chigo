# ChiGo Product Specs

Version: 2.0

This repository organizes ChiGo as staged, AI-coding-friendly specs. Each stage has its own `SPEC.md` with scope, data model, routes, implementation notes, and acceptance criteria.

All stages must follow the shared technical plan in [TECH_STACK.md](./TECH_STACK.md).

## Product Vision

ChiGo is an AI-powered dining companion for discovering food, understanding menus, managing nutrition, and making meals more social.

The first launch market is Carnegie Mellon University students in Pittsburgh. The initial product should stay narrow enough to validate one strong behavior: students can quickly find nearby restaurant meal plans and join each other.

## Core Pillars

- AI Menu Assistant
- Nutrition and Health
- Dining Social Network
- Dining Planning
- Restaurant Discovery

## Stage Specs

| Stage | Spec | Main Outcome |
| --- | --- | --- |
| 1 | [Stage 1 Spec](./specs/Stage1.md) | Auth, user settings, nearby restaurants, instant dining invites |
| 2 | [Stage 2 Spec](./specs/Stage2.md) | AI menu translation, dish explanation, restaurant detail enrichment |
| 3 | [Stage 3 Spec](./specs/Stage3.md) | Meal logging, nutrition estimates, dietary goals, weekly summaries |
| 4 | [Stage 4 Spec](./specs/Stage4.md) | Friends, group scheduling, open seats, calendar sharing |
| 5 | [Stage 5 Spec](./specs/Stage5.md) | Mobile app, notifications, real-time chat, reservations, broader launch |

## Stage Strategy

Stage 1 should be built first and treated as the web MVP. Later stages should not be started until the current stage has working acceptance criteria, basic tests, and production deployment.

Each stage should preserve reusable business logic so a future Expo mobile app can share validation schemas, data types, and service-layer behavior where practical.

## Product Principles

- Start with CMU-specific dining behavior before general consumer behavior.
- Prefer real user flows over broad feature coverage.
- Keep AI features useful and explainable, especially for menu and nutrition outputs.
- Do not require every user to be social; social features should support both public campus discovery and smaller friend-based coordination.
- Avoid building features that depend on unavailable third-party API access when a seeded or mockable version can validate the workflow first.
