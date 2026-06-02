# ChiGo Stage 5 Spec

Stage: Mobile, Notifications, Reservations, and Scale

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Turn ChiGo into a multi-platform dining companion that supports mobile-native usage, push notifications, reservations, and expansion beyond CMU. Persistent friend group chat and temporary dining coordination chat should already exist from Stage 4 and should be reused on mobile rather than redesigned here.

## Dependencies

Stages 1-4 should be stable on web before Stage 5 begins.

## Functional Requirements

### 1. Expo Mobile App

Build a mobile app that supports:

- Supabase Auth.
- Profile and settings.
- Nearby restaurants.
- Dining invites.
- Open seats.
- Meal plans.
- Stage 4 persistent friend group chat.
- Stage 4 temporary chat inside invites and meal plans.
- Meal logging.
- Menu upload from camera or photo library.

Mobile should reuse shared validation schemas and service logic where practical.

### 2. Push Notifications

Users can receive notifications for:

- Someone joined their invite.
- A friend invited them to a meal.
- A meal plan time was confirmed.
- An open seat nearby was posted by a friend.
- A new message arrived in a persistent friend group, invite, or meal plan chat.

Users must be able to control notification preferences.

### 3. Mobile Chat Experience

Stage 5 should bring the full Stage 4 chat experience to mobile:

- Persistent friend group chat should render in the Expo app.
- Invite and meal plan chat should render in the Expo app.
- Mobile should subscribe to the same Supabase Realtime message stream.
- Push notifications should deep-link to the relevant friend group, invite, or meal plan chat.
- Mobile message creation and deletion should use the same validation and access rules as web.

Do not create a separate mobile-only chat schema or a parallel messaging system.

### 4. Reservation Integration

Stage 5 should improve reservations:

- Start with OpenTable deep links if not already present.
- Add direct reservation API integration only if API access is available and reliable.
- Reservation details can be shared inside an invite or meal plan.

### 5. Multi-University Expansion

The app should support:

- Multiple universities.
- Campus-specific restaurant seeds.
- Campus-specific invite feeds.
- Public traveler mode for non-campus users.

### 6. Advanced Matching

Explore dining partner matching based on:

- Food preferences.
- Past meal behavior.
- Friend graph.
- Social preference.

Matching must be opt-in.

## Data Model Additions

### `user_devices`

| Column       | Type        | Notes                    |
| ------------ | ----------- | ------------------------ |
| `id`         | uuid        | Primary key              |
| `user_id`    | uuid        | References `profiles.id` |
| `platform`   | text        | `ios`, `android`, `web`  |
| `push_token` | text        | Required for mobile push |
| `created_at` | timestamptz | Default now              |
| `updated_at` | timestamptz | Updated on token refresh |

### `notification_preferences`

| Column                | Type        | Notes                                 |
| --------------------- | ----------- | ------------------------------------- |
| `user_id`             | uuid        | Primary key, references `profiles.id` |
| `invite_updates`      | boolean     | Default true                          |
| `friend_invites`      | boolean     | Default true                          |
| `open_seats`          | boolean     | Default true                          |
| `meal_plan_updates`   | boolean     | Default true                          |
| `chat_messages`       | boolean     | Default true                          |
| `nutrition_reminders` | boolean     | Default false                         |
| `updated_at`          | timestamptz | Updated on edit                       |

Chat tables are defined in Stage 4. Stage 5 may add notification delivery metadata if needed, but it should not redefine `chat_threads` or `chat_messages`.

### `campuses`

| Column       | Type        | Notes       |
| ------------ | ----------- | ----------- |
| `id`         | uuid        | Primary key |
| `name`       | text        | Required    |
| `city`       | text        | Required    |
| `state`      | text        | Optional    |
| `country`    | text        | Required    |
| `latitude`   | numeric     | Required    |
| `longitude`  | numeric     | Required    |
| `created_at` | timestamptz | Default now |

## Non-Goals

Do not start Stage 5 until the web app has retained users from earlier stages.

Avoid:

- Building complex matching before enough social behavior exists.
- Depending on direct reservation APIs without confirmed access.
- Turning ChiGo into a generic social network unrelated to dining.
- Rebuilding the Stage 4 chat system instead of reusing it across web and mobile.

## Acceptance Criteria

Stage 5 is complete when:

- The Expo app supports the core Stage 1 invite flow.
- Mobile users can receive and manage push notifications.
- Mobile users can use the existing Stage 4 persistent friend group chat and scoped invite or meal plan chat.
- Chat push notifications deep-link to the correct friend group, invite, or meal plan.
- Reservations can be shared via deep link or direct integration.
- The app can separate data and feeds by campus.
- Matching experiments are opt-in and measurable.
