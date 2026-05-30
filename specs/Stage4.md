# ChiGo Stage 4 Spec

Stage: Social Dining and Planning

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Expand ChiGo from public campus invites into a fuller dining social network. Users should be able to add friends, create group meal plans, collect availability, and use CMU-specific open seat behavior.

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

## Pages and Routes

| Route | Purpose |
| --- | --- |
| `/friends` | Friend list and requests |
| `/users/[username]` | Public user profile |
| `/open-seats` | Active open seat posts |
| `/plans` | Group meal plans |
| `/plans/new` | Create scheduled meal plan |
| `/plans/[id]` | Plan detail and availability |

## Data Model Additions

### `friendships`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `requester_id` | uuid | References `profiles.id` |
| `addressee_id` | uuid | References `profiles.id` |
| `status` | text | `pending`, `accepted`, `rejected`, `blocked` |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on status change |

### `open_seat_posts`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `host_id` | uuid | References `profiles.id` |
| `restaurant_id` | uuid | Optional references `restaurants.id` |
| `location_label` | text | Required |
| `available_seats` | int | Required |
| `strangers_welcome` | boolean | Default true |
| `status` | text | `open`, `closed`, `expired` |
| `expires_at` | timestamptz | Required |
| `created_at` | timestamptz | Default now |

### `meal_plans`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `creator_id` | uuid | References `profiles.id` |
| `title` | text | Required |
| `note` | text | Optional |
| `status` | text | `collecting_availability`, `confirmed`, `canceled` |
| `confirmed_restaurant_id` | uuid | Optional references `restaurants.id` |
| `confirmed_start_at` | timestamptz | Optional |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on mutation |

### `meal_plan_participants`

| Column | Type | Notes |
| --- | --- | --- |
| `plan_id` | uuid | References `meal_plans.id` |
| `user_id` | uuid | References `profiles.id` |
| `role` | text | `creator` or `participant` |
| `status` | text | `invited`, `joined`, `declined` |
| `created_at` | timestamptz | Default now |

### `meal_plan_availability`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `plan_id` | uuid | References `meal_plans.id` |
| `user_id` | uuid | References `profiles.id` |
| `start_at` | timestamptz | Required |
| `end_at` | timestamptz | Required |
| `availability` | text | `yes`, `maybe`, `no` |

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

## Non-Goals

Do not build these in Stage 4:

- Real-time chat.
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
- Privacy rules prevent non-participants from viewing private plans.
