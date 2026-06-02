# ChiGo Stage 4 Spec

Stage: Social Dining, Planning, and Persistent Group Chat

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Expand ChiGo from public campus invites into a fuller dining social network. Users should be able to add friends, create persistent friend group chats, create group meal plans, collect availability, coordinate in realtime chat, and use CMU-specific open seat behavior.

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

Stage 4 should support two chat types:

- Persistent friend group chats.
- Temporary dining coordination chats.

Persistent friend group chats are the long-lived social layer of ChiGo. They should feel closer to an Instagram or WeChat group chat than a one-off comment thread. Users should have a fixed place to keep talking with the same friends between meals, which helps ChiGo become a friend and food social graph rather than only an invite tool.

Persistent friend group chat behavior:

- Users can create a named or unnamed group chat from accepted friends.
- A group chat must include the creator and at least one accepted friend.
- The creator starts as the group owner.
- Owners can rename the group.
- Owners can add accepted friends to the group.
- Owners can remove members from the group.
- Members can leave a group.
- Members can see the group in a dedicated chat list.
- Members can open the group and send text messages.
- Group chats persist after a meal invite or meal plan ends.

Temporary dining coordination chat behavior:

- A chat thread is created automatically for every dining invite and every meal plan.
- Only the host/creator and active participants can view or send messages.
- Temporary chat should be embedded on the invite or meal plan detail page.
- Temporary chat can remain readable after completion for eligible participants, but should not be promoted as the main long-term social space.

Shared chat behavior:

- Messages appear in realtime for users viewing the same thread.
- Messages show sender display name, timestamp, and body.
- Empty chat states should be contextual:
  - Friend group chats should encourage starting a casual food conversation.
  - Invite and meal plan chats should encourage practical coordination questions.
- Users can send text messages up to a reasonable limit, such as 1,000 characters.
- Users can delete their own messages, preferably using a soft-delete pattern.
- Leaving or being removed from a persistent friend group removes future access to that group.
- Leaving, declining, or being removed from a plan should remove future temporary chat access unless the product explicitly keeps read-only history.

Implementation expectations:

- Use Supabase Realtime Postgres Changes for message insert events.
- Use server actions for message creation and deletion so auth and validation stay centralized.
- Use RLS policies to enforce active-member-only read/write access.
- Keep the first version text-only. No images, voice, reactions, typing indicators, read receipts, or end-to-end encryption in Stage 4.

## Pages and Routes

| Route               | Purpose                                                    |
| ------------------- | ---------------------------------------------------------- |
| `/friends`          | Friend list and requests                                   |
| `/users/[username]` | Public user profile                                        |
| `/open-seats`       | Active open seat posts                                     |
| `/plans`            | Group meal plans                                           |
| `/plans/new`        | Create scheduled meal plan                                 |
| `/chats`            | Persistent friend group chat list                          |
| `/chats/new`        | Create a persistent friend group chat                      |
| `/chats/[id]`       | Persistent friend group chat detail                        |
| `/invites/[id]`     | Invite detail with embedded temporary group chat           |
| `/plans/[id]`       | Plan detail, availability, confirmation, and embedded chat |

Persistent friend group chat needs a standalone chat list in Stage 4. Temporary invite and meal plan chats should stay embedded inside the relevant detail page where coordination is happening.

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

| Column             | Type        | Notes                                           |
| ------------------ | ----------- | ----------------------------------------------- |
| `id`               | uuid        | Primary key                                     |
| `thread_type`      | text        | `friend_group`, `dining_invite`, or `meal_plan` |
| `title`            | text        | Optional, display can fall back to member names |
| `created_by`       | uuid        | References `profiles.id`                        |
| `dining_invite_id` | uuid        | Optional references `dining_invites.id`         |
| `meal_plan_id`     | uuid        | Optional references `meal_plans.id`             |
| `created_at`       | timestamptz | Default now                                     |
| `updated_at`       | timestamptz | Updated on message activity                     |

Constraints:

- `friend_group` threads must not have `dining_invite_id` or `meal_plan_id`.
- `dining_invite` threads must have `dining_invite_id` and no `meal_plan_id`.
- `meal_plan` threads must have `meal_plan_id` and no `dining_invite_id`.
- There should be at most one thread per dining invite and at most one thread per meal plan.

### `chat_thread_members`

| Column       | Type        | Notes                          |
| ------------ | ----------- | ------------------------------ |
| `thread_id`  | uuid        | References `chat_threads.id`   |
| `user_id`    | uuid        | References `profiles.id`       |
| `role`       | text        | `owner` or `member`            |
| `status`     | text        | `active`, `left`, or `removed` |
| `created_at` | timestamptz | Default now                    |
| `updated_at` | timestamptz | Updated on membership changes  |

Notes:

- Use a composite unique constraint on `thread_id` and `user_id`.
- Persistent friend group membership is managed directly through this table.
- Temporary dining invite and meal plan chat membership should be synchronized from the invite or plan participant list.
- Users should only be addable to a persistent friend group if they have an accepted friendship with the inviter.

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

- A user can select a chat thread only if they are an active member of that thread.
- A user can select chat membership rows only for threads where they are an active member.
- A user can select messages only for threads where they are an active member.
- A user can insert a message only as themselves and only into a thread where they are an active member.
- A user can soft-delete only their own messages.
- Only owners can add members, remove members, or rename a persistent friend group.
- Non-members must not be able to infer private group, invite, or plan chat content.

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
- `createFriendGroupChat(input)`
- `renameFriendGroupChat(threadId, title)`
- `addFriendGroupChatMembers(threadId, userIds)`
- `removeFriendGroupChatMember(threadId, userId)`
- `leaveFriendGroupChat(threadId)`
- `ensureDiningInviteChatThread(inviteId)`
- `ensureMealPlanChatThread(planId)`
- `listChatThreads()`
- `listChatMessages(threadId)`
- `sendChatMessage(threadId, body)`
- `deleteOwnChatMessage(messageId)`

Client-side realtime subscriptions:

- `subscribeToChatMessages(threadId)`

The subscription should listen for inserts and updates on `chat_messages` scoped to the active thread. Initial history should come from a server-rendered or server-fetched query; realtime events should append or update the visible list.

## Non-Goals

Do not build these in Stage 4:

- A separate one-to-one direct message product or separate DM data model.
- Rich chat attachments, reactions, read receipts, typing indicators, voice messages, or moderation tooling beyond basic soft delete.
- Algorithmic friend matching.
- Native push notifications.
- Direct reservation API integration.
- Public social media-style feed.

## Acceptance Criteria

Stage 4 is complete when:

- Users can add and remove friends.
- Users can create, rename, view, and leave persistent friend group chats.
- Persistent friend group owners can add accepted friends and remove members.
- Users can create friends-only dining invites.
- Users can post and close CMU open seat posts.
- Users can create a meal plan and invite friends.
- Participants can submit availability.
- The app suggests the best overlapping meal time.
- A confirmed plan can produce a calendar link.
- Persistent friend group members can send and receive realtime text messages.
- Dining invite participants can send and receive realtime group chat messages.
- Meal plan participants can send and receive realtime group chat messages.
- Chat access is limited to active members by RLS, not only by UI checks.
- Users can soft-delete their own chat messages.
- Privacy rules prevent non-members from viewing private friend groups, invite chats, and plan chats.
