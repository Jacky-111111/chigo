# ChiGo Stage 4 Spec

Stage: Social Dining, Planning, and Realtime Group Chat

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Expand ChiGo from public campus invites into a fuller dining social network. Users should be able to add friends, create group meal plans, collect availability, coordinate in realtime group chat, and use CMU-specific open seat behavior.

## Dependencies

Stage 1 must be complete. Stage 2 and 3 can exist independently but should integrate where useful.

## Functional Requirements

### 1. Friend System

Users can:

- Search by username.
- Send friend requests.
- Accept or reject friend requests.
- Remove friends.
- View friend profiles.

Future optional methods:

- QR code add.
- Contact import.

### 2. Friend-Aware Invites

Dining invites from Stage 1 should support:

- `campus_public`.
- `friends_only`.
- `private_link`.

Users can invite selected friends to a meal plan.

### 3. CMU Open Seat Mode

Users can create a lightweight open seat post with:

- Current dining location.
- Number of available seats.
- Expiration time, default 45 minutes.
- Whether strangers are welcome.

Open seat posts are optimized for "I am already eating and have room."

### 4. Group Scheduling

Users can create a meal event with:

- Restaurant candidates.
- Date range.
- Time slots.
- Invited participants.
- Optional note.

Participants can mark availability. The app suggests the best time based on overlap.

### 5. Calendar Sharing

Users can:

- Add confirmed meal events to Google Calendar.
- Download or open an Apple Calendar compatible `.ics` link.

Full two-way calendar sync is not required.

### 6. Realtime Group Chat

Users can chat inside dining coordination contexts:

- Dining invite group chat.
- Meal plan group chat.

Chat should be lightweight and focused on coordination, not a general-purpose DM system.

Required chat behavior:

- A chat thread is created automatically for every dining invite and every meal plan.
- Only the host/creator and active participants can view or send messages.
- Messages appear in realtime for users viewing the same thread.
- Messages show sender display name, timestamp, and body.
- Empty chat states encourage users to ask practical coordination questions.
- Users can send text messages up to a reasonable limit, such as 1,000 characters.
- Users can delete their own messages, preferably using a soft-delete pattern.
- Leaving, declining, or being removed from a plan should remove future chat access unless the product explicitly keeps read-only history.

Implementation expectations:

- Use Supabase Realtime Postgres Changes for message insert events.
- Use server actions for message creation and deletion so auth and validation stay centralized.
- Use RLS policies to enforce participant-only read/write access.
- Keep the first version text-only. No images, voice, reactions, typing indicators, read receipts, or end-to-end encryption in Stage 4.

## Pages and Routes

| Route               | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `/friends`          | Friend list and requests                                         |
| `/users/[username]` | Public user profile                                              |
| `/open-seats`       | Active open seat posts                                           |
| `/plans`            | Group meal plans                                                 |
| `/plans/new`        | Create scheduled meal plan                                       |
| `/invites/[id]`     | Invite detail with embedded group chat                           |
| `/plans/[id]`       | Plan detail, availability, confirmation, and embedded group chat |

Chat does not need a standalone inbox in Stage 4. It should live inside the invite or meal plan detail page where coordination is happening.

## Data Model Additions

### `friendships`

| Column         | Type        | Notes                                        |
| -------------- | ----------- | -------------------------------------------- |
| `id`           | uuid        | Primary key                                  |
| `requester_id` | uuid        | References `profiles.id`                     |
| `addressee_id` | uuid        | References `profiles.id`                     |
| `status`       | text        | `pending`, `accepted`, `rejected`, `blocked` |
| `created_at`   | timestamptz | Default now                                  |
| `updated_at`   | timestamptz | Updated on status change                     |

### `open_seat_posts`

| Column              | Type        | Notes                                |
| ------------------- | ----------- | ------------------------------------ |
| `id`                | uuid        | Primary key                          |
| `host_id`           | uuid        | References `profiles.id`             |
| `restaurant_id`     | uuid        | Optional references `restaurants.id` |
| `location_label`    | text        | Required                             |
| `available_seats`   | int         | Required                             |
| `strangers_welcome` | boolean     | Default true                         |
| `status`            | text        | `open`, `closed`, `expired`          |
| `expires_at`        | timestamptz | Required                             |
| `created_at`        | timestamptz | Default now                          |

### `meal_plans`

| Column                    | Type        | Notes                                              |
| ------------------------- | ----------- | -------------------------------------------------- |
| `id`                      | uuid        | Primary key                                        |
| `creator_id`              | uuid        | References `profiles.id`                           |
| `title`                   | text        | Required                                           |
| `note`                    | text        | Optional                                           |
| `status`                  | text        | `collecting_availability`, `confirmed`, `canceled` |
| `confirmed_restaurant_id` | uuid        | Optional references `restaurants.id`               |
| `confirmed_start_at`      | timestamptz | Optional                                           |
| `created_at`              | timestamptz | Default now                                        |
| `updated_at`              | timestamptz | Updated on mutation                                |

### `meal_plan_participants`

| Column       | Type        | Notes                           |
| ------------ | ----------- | ------------------------------- |
| `plan_id`    | uuid        | References `meal_plans.id`      |
| `user_id`    | uuid        | References `profiles.id`        |
| `role`       | text        | `creator` or `participant`      |
| `status`     | text        | `invited`, `joined`, `declined` |
| `created_at` | timestamptz | Default now                     |

### `meal_plan_availability`

| Column         | Type        | Notes                      |
| -------------- | ----------- | -------------------------- |
| `id`           | uuid        | Primary key                |
| `plan_id`      | uuid        | References `meal_plans.id` |
| `user_id`      | uuid        | References `profiles.id`   |
| `start_at`     | timestamptz | Required                   |
| `end_at`       | timestamptz | Required                   |
| `availability` | text        | `yes`, `maybe`, `no`       |

### `chat_threads`

| Column             | Type        | Notes                                   |
| ------------------ | ----------- | --------------------------------------- |
| `id`               | uuid        | Primary key                             |
| `thread_type`      | text        | `dining_invite` or `meal_plan`          |
| `dining_invite_id` | uuid        | Optional references `dining_invites.id` |
| `meal_plan_id`     | uuid        | Optional references `meal_plans.id`     |
| `created_at`       | timestamptz | Default now                             |
| `updated_at`       | timestamptz | Updated on message activity             |

Constraints:

- Exactly one of `dining_invite_id` or `meal_plan_id` must be present.
- `thread_type` must match the populated parent reference.
- There should be at most one thread per dining invite and at most one thread per meal plan.

### `chat_messages`

| Column       | Type        | Notes                          |
| ------------ | ----------- | ------------------------------ |
| `id`         | uuid        | Primary key                    |
| `thread_id`  | uuid        | References `chat_threads.id`   |
| `sender_id`  | uuid        | References `profiles.id`       |
| `body`       | text        | Required, max 1,000 characters |
| `deleted_at` | timestamptz | Optional soft delete timestamp |
| `created_at` | timestamptz | Default now                    |
| `updated_at` | timestamptz | Updated on soft delete         |

### Chat RLS Rules

Chat privacy is part of the Stage 4 acceptance bar:

- A user can select a chat thread only if they can access the parent dining invite or meal plan.
- A user can select messages only for threads they can access.
- A user can insert a message only as themselves and only into a thread they can access.
- A user can soft-delete only their own messages.
- Non-participants must not be able to infer private plan chat content.

## Server Actions or API Operations

- `sendFriendRequest(username)`
- `respondToFriendRequest(friendshipId, response)`
- `removeFriend(userId)`
- `createOpenSeatPost(input)`
- `closeOpenSeatPost(postId)`
- `createMealPlan(input)`
- `submitMealPlanAvailability(input)`
- `confirmMealPlan(input)`
- `generateCalendarLink(mealPlanId)`
- `ensureDiningInviteChatThread(inviteId)`
- `ensureMealPlanChatThread(planId)`
- `listChatMessages(threadId)`
- `sendChatMessage(threadId, body)`
- `deleteOwnChatMessage(messageId)`

Client-side realtime subscriptions:

- `subscribeToChatMessages(threadId)`

The subscription should listen for inserts and updates on `chat_messages` scoped to the active thread. Initial history should come from a server-rendered or server-fetched query; realtime events should append or update the visible list.

## Non-Goals

Do not build these in Stage 4:

- Standalone direct messages unrelated to a dining invite or meal plan.
- Rich chat attachments, reactions, read receipts, typing indicators, voice messages, or moderation tooling beyond basic soft delete.
- Algorithmic friend matching.
- Native push notifications.
- Direct reservation API integration.
- Public social media-style feed.

## Acceptance Criteria

Stage 4 is complete when:

- Users can add and remove friends.
- Users can create friends-only dining invites.
- Users can post and close CMU open seat posts.
- Users can create a meal plan and invite friends.
- Participants can submit availability.
- The app suggests the best overlapping meal time.
- A confirmed plan can produce a calendar link.
- Dining invite participants can send and receive realtime group chat messages.
- Meal plan participants can send and receive realtime group chat messages.
- Chat access is limited to eligible participants by RLS, not only by UI checks.
- Users can soft-delete their own chat messages.
- Privacy rules prevent non-participants from viewing private plans.
