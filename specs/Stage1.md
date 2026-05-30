# ChiGo Stage 1 Spec

Stage: Web MVP

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Build the first usable ChiGo web app for CMU students:

- Users can create an account and sign in.
- Users can edit their personal dining settings.
- Users can see nearby restaurants around CMU.
- Users can create and join immediate restaurant meal invitations.

This stage validates the core social dining behavior before building AI menu, nutrition, or complex planning features.

## Target Users

- Primary: Carnegie Mellon University students in Pittsburgh.
- Secondary: CMU-adjacent friends or visitors who want to join nearby meals.

## Core User Flow

1. A user visits ChiGo.
2. They sign up or log in.
3. They complete basic profile and dining preferences.
4. They allow location access or use the CMU default location.
5. They browse nearby restaurants.
6. They start an instant meal invite at a selected restaurant.
7. Other authenticated users can discover the invite and join.
8. The host can cancel the invite, and participants can leave.

## Functional Requirements

### 1. Authentication

Users must be able to:

- Sign up with email and password.
- Sign in with email and password.
- Sign in with Google OAuth if Supabase OAuth is configured.
- Sign out.
- Access protected app pages only after authentication.

Auth behavior:

- Unauthenticated users visiting protected pages are redirected to `/login`.
- Authenticated users without a completed profile are redirected to `/onboarding`.
- Authenticated users with a completed profile land on `/invites`.

### 2. Onboarding and Settings

Users must be able to create and edit:

- Username.
- Display name.
- University, default `Carnegie Mellon University`.
- Short bio.
- Instagram handle.
- Dietary restrictions.
- Allergies.
- Favorite cuisines.
- Typical meal times.
- Social preference: `open_to_invites`, `friends_only`, or `private`.

Validation:

- Username is required, unique, lowercase, 3-24 characters, letters/numbers/underscore only.
- Display name is required, 1-60 characters.
- Dietary fields can be empty.
- Instagram handle should be stored without `@`.

### 3. Nearby Restaurants

Stage 1 should use a seeded `restaurants` table with CMU/Pittsburgh restaurants. Do not require Yelp or Google Maps API for the first implementation.

Users must be able to:

- View a list of active seeded restaurants.
- See restaurant name, cuisine, address, distance, price level, and optional photo.
- Sort restaurants by distance from the user's current location.
- Fall back to CMU campus coordinates if browser location is denied.
- Open a map link for directions.
- Start an invite from a restaurant card.

Default fallback location:

- Name: Carnegie Mellon University
- Latitude: `40.4433`
- Longitude: `-79.9436`

### 4. Instant Dining Invites

Users must be able to create an invite with:

- Restaurant.
- Start time preset: `now`, `in_30_minutes`, `in_1_hour`, or custom time within the next 6 hours.
- Maximum group size, 2-8.
- Optional message.
- Visibility: `campus_public` for Stage 1.

Invite behavior:

- New invites default to `open`.
- Invites expire automatically after the configured start time plus 2 hours.
- Users cannot join their own invite as a participant because the host already counts as one seat.
- Users cannot join a full, canceled, expired, or completed invite.
- Users can leave an invite they joined.
- Hosts can cancel their own invite.
- The invite participant count includes the host.

### 5. Invite Discovery

Users must be able to:

- View open invites near CMU.
- See restaurant, host, start time, participant count, max group size, and message.
- Filter by `starting soon`, `open spots`, and `my invites`.
- Open invite detail.
- Join an invite with one click.

Stage 1 does not need direct messaging. After joining, show basic participant info and enough context to meet at the restaurant.

## Pages and Routes

Recommended app routes:

| Route | Purpose |
| --- | --- |
| `/` | Redirect based on auth/profile state |
| `/login` | Sign in and sign up |
| `/onboarding` | First-time profile setup |
| `/settings` | Edit profile and dining preferences |
| `/restaurants` | Nearby restaurant list |
| `/invites` | Active dining invite feed |
| `/invites/new` | Create invite, optionally with `restaurantId` query |
| `/invites/[id]` | Invite detail and join/leave/cancel actions |

## Data Model

Use Supabase Postgres with RLS enabled.

### `profiles`

Stores public and editable user profile data.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key, references `auth.users.id` |
| `username` | text | Unique, lowercase |
| `display_name` | text | Required |
| `university` | text | Default CMU |
| `bio` | text | Optional |
| `instagram_handle` | text | Optional |
| `avatar_url` | text | Optional |
| `profile_completed_at` | timestamptz | Null until onboarding complete |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on profile edit |

### `user_dining_preferences`

Stores preference fields that may grow over time.

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid | Primary key, references `profiles.id` |
| `dietary_restrictions` | text[] | Optional |
| `allergies` | text[] | Optional |
| `favorite_cuisines` | text[] | Optional |
| `typical_meal_times` | text[] | Example: breakfast, lunch, dinner, late_night |
| `social_preference` | text | `open_to_invites`, `friends_only`, `private` |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on edit |

### `restaurants`

Seeded local restaurant catalog for Stage 1.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `name` | text | Required |
| `cuisine` | text | Optional |
| `address` | text | Required |
| `latitude` | numeric | Required |
| `longitude` | numeric | Required |
| `price_level` | int | 1-4, optional |
| `photo_url` | text | Optional |
| `google_maps_url` | text | Optional |
| `is_active` | boolean | Default true |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on edit |

### `dining_invites`

Stores host-created meal invites.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `host_id` | uuid | References `profiles.id` |
| `restaurant_id` | uuid | References `restaurants.id` |
| `start_at` | timestamptz | Required |
| `expires_at` | timestamptz | Required |
| `max_participants` | int | 2-8 |
| `message` | text | Optional |
| `visibility` | text | Stage 1: `campus_public` |
| `status` | text | `open`, `full`, `canceled`, `completed`, `expired` |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on mutation |

### `dining_invite_participants`

Stores participant membership.

| Column | Type | Notes |
| --- | --- | --- |
| `invite_id` | uuid | References `dining_invites.id` |
| `user_id` | uuid | References `profiles.id` |
| `role` | text | `host` or `participant` |
| `status` | text | `joined` or `left` |
| `joined_at` | timestamptz | Default now |
| `left_at` | timestamptz | Optional |

Unique active membership:

- A user should have only one active `joined` row per invite.
- Host row should be created when the invite is created.

## Server Actions or API Operations

Recommended mutations:

- `completeOnboarding(input)`
- `updateSettings(input)`
- `createDiningInvite(input)`
- `joinDiningInvite(inviteId)`
- `leaveDiningInvite(inviteId)`
- `cancelDiningInvite(inviteId)`

Recommended queries:

- `getCurrentProfile()`
- `listNearbyRestaurants(location)`
- `listOpenInvites(location, filters)`
- `getInviteDetail(inviteId)`

## Authorization and RLS Requirements

- Users can read public profile fields for invite participants.
- Users can update only their own profile and dining preferences.
- Authenticated users can read active restaurants.
- Authenticated users can read `campus_public` invites.
- Only invite hosts can cancel their invites.
- Only authenticated users can join or leave invites as themselves.
- Users cannot mutate participant rows for other users.

## UI Requirements

The interface should follow [../DESIGN_SYSTEM.md](../DESIGN_SYSTEM.md). It should feel like a practical student utility with modern, appetizing food energy, not a marketing landing page.

Required screens:

- Login/signup form.
- Onboarding form.
- Settings form.
- Restaurant list with compact cards.
- Invite feed with status and participant count.
- Invite detail with join/leave/cancel states.
- Empty states for no restaurants, no invites, and location denied.
- Loading and error states for all server-backed views.

## Seed Data

Include at least 12 restaurants near CMU, such as:

- Everyday Noodles
- Bao
- Stack'd Oakland
- The Porch at Schenley
- Oishii Bento
- Sushi Fuku
- Roots Natural Kitchen
- Piada Italian Street Food
- Chipotle Mexican Grill
- Noodlehead
- Teppanyaki Kyoto
- Szechuan Spice

Seed data should include realistic coordinates, cuisine, address, and price level.

## Non-Goals

Do not build these in Stage 1:

- AI menu translation.
- Meal photo nutrition analysis.
- Friend graph.
- Direct messages.
- Push notifications.
- Calendar integration.
- Yelp or Google Maps API integration.
- Native mobile app.
- Reservation booking.

## Acceptance Criteria

Stage 1 is complete when:

- A new user can sign up, complete onboarding, and reach the invite feed.
- A returning user can sign in and edit settings.
- A user can view nearby seeded restaurants sorted by distance.
- A user can create an invite for a nearby restaurant within the next 6 hours.
- The host appears as the first participant.
- Another authenticated user can join and leave the invite.
- The host can cancel the invite.
- Full, canceled, and expired invites cannot be joined.
- Protected pages are inaccessible when signed out.
- Basic RLS policies prevent users from editing other users' data.
- The main flow works on mobile-width and desktop-width browsers.

## Suggested Implementation Order

1. Scaffold app, `package.json`, Supabase clients, environment variables, and base layout using [../PACKAGE_REQUIREMENTS.md](../PACKAGE_REQUIREMENTS.md).
2. Add auth pages and protected route handling.
3. Add profile and preferences tables with onboarding/settings UI.
4. Add restaurants table, seed data, and nearby restaurant list.
5. Add invite tables and create/join/leave/cancel mutations.
6. Add invite feed/detail UI.
7. Add RLS policies, validation tests, and E2E smoke tests.
