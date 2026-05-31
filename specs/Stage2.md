# ChiGo Stage 2 Spec

Stage: AI Menu Assistant and Restaurant Enrichment

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Add ChiGo's first AI-powered food understanding experience. Users should be able to upload a menu image, understand unfamiliar dishes, and connect menu insights back to restaurants and invites.

## Dependencies

Stage 1 must be complete:

- Auth and profiles exist.
- Restaurants exist.
- Dining invite flow works.
- Supabase Storage is configured or ready to configure.

## Functional Requirements

### 1. Menu Image Upload

Users can:

- Upload a menu image from desktop or mobile browser.
- Associate the upload with a restaurant when available.
- See upload progress, failure states, and retry.

Storage:

- Store original images in the `menu-images` bucket.
- Store image metadata in Postgres.

### 2. OCR and Translation

The system should:

- Extract text from uploaded menu images.
- Detect source language.
- Translate menu items into the user's preferred language, default English.
- Preserve original text next to translated text.

Stage 2 can use one AI provider for OCR and translation. The provider must be wrapped in a service function so it can be replaced later.

### 3. Dish Explanation

For each recognized menu item, show:

- Original name.
- Translated name.
- Short description.
- Ingredient breakdown.
- Cooking method.
- Cuisine context.
- Dietary warnings when obvious, such as pork, shellfish, nuts, dairy, or spicy.

### 4. Personalized Dish Recommendation

If the user has dining preferences from Stage 1, the system should:

- Highlight dishes that match preferences.
- Warn about possible conflicts with allergies or dietary restrictions.
- Provide a short recommendation reason.

The app must label AI output as an estimate and allow users to report incorrect results.

### 5. Restaurant Detail Enrichment

Users should be able to open a restaurant detail page from the restaurant list.

Restaurant detail should show:

- Basic restaurant info from Stage 1.
- Active invites at that restaurant.
- Uploaded menu analyses linked to that restaurant.
- Optional external links to Google Maps, Yelp, or the restaurant website.

Stage 2 may add Yelp or Google Maps integration, but it should not block menu assistant delivery.

## Pages and Routes

Recommended routes:

| Route | Purpose |
| --- | --- |
| `/restaurants/[id]` | Restaurant detail |
| `/menus/new` | Upload and analyze menu |
| `/menus/[id]` | Menu analysis result |
| `/menus/[id]/items/[itemId]` | Optional dish detail |

## Data Model Additions

### `menu_uploads`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | References `profiles.id` |
| `restaurant_id` | uuid | Optional references `restaurants.id` |
| `image_url` | text | Required |
| `status` | text | `uploaded`, `processing`, `completed`, `failed` |
| `source_language` | text | Optional |
| `target_language` | text | Default `en` |
| `ai_provider` | text | Optional |
| `ai_model` | text | Optional |
| `error_message` | text | Optional |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on processing |

### `menu_items`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `menu_upload_id` | uuid | References `menu_uploads.id` |
| `original_name` | text | Required |
| `translated_name` | text | Optional |
| `description` | text | Optional |
| `ingredients` | text[] | Optional |
| `cooking_method` | text | Optional |
| `dietary_warnings` | text[] | Optional |
| `recommendation_score` | int | 0-100, optional |
| `recommendation_reason` | text | Optional |
| `confidence` | numeric | 0-1, optional |
| `sort_order` | int | Required |
| `created_at` | timestamptz | Default now |

### `menu_feedback`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | References `profiles.id` |
| `menu_item_id` | uuid | References `menu_items.id` |
| `feedback_type` | text | `incorrect_translation`, `wrong_ingredients`, `allergy_risk`, `other` |
| `note` | text | Optional |
| `created_at` | timestamptz | Default now |

## Server Actions or API Operations

- `createMenuUpload(input)`
- `analyzeMenuUpload(menuUploadId)`
- `getMenuAnalysis(menuUploadId)`
- `createMenuFeedback(input)`
- `getRestaurantDetail(restaurantId)`

## Non-Goals

Do not build these in Stage 2:

- Full nutrition tracking.
- AI-generated dish images unless menu analysis is already stable.
- Reservation booking.
- Friend matching.
- Native mobile app.

## Acceptance Criteria

Stage 2 is complete when:

- A signed-in user can upload a menu image.
- The system extracts menu text and returns translated/explained menu items.
- Menu result pages persist and can be revisited.
- Dish recommendations use the user's stored dietary preferences.
- Menu analysis can be linked to a restaurant.
- Restaurant detail pages show active invites and related menu analyses.
- Users can submit feedback on incorrect AI output.
- Failures show actionable retry states instead of blank pages.
- In-progress menu analysis shows progress feedback and allows retry after it appears stalled for a few minutes.
- Longer term, menu analysis should move from inline Server Actions to a background job or queue once upload volume grows.
