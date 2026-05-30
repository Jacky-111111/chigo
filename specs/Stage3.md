# ChiGo Stage 3 Spec

Stage: Nutrition and Meal Journal

Shared tech stack: [../TECH_STACK.md](../TECH_STACK.md)

## Goal

Help users understand and track what they eat. Users should be able to log meals, upload meal photos, receive estimated nutrition, and review simple daily and weekly summaries.

## Dependencies

Stage 1 must be complete. Stage 2 is helpful but not strictly required.

## Functional Requirements

### 1. Meal Logging

Users can create a meal log with:

- Meal photo.
- Meal name.
- Restaurant, optional.
- Menu item, optional.
- Meal time.
- Notes.

Users can edit or delete their own meal logs.

### 2. Nutrition Estimation

For each meal, the system estimates:

- Calories.
- Protein.
- Fat.
- Carbohydrates.

Optional future fields:

- Fiber.
- Sodium.
- Sugar.
- Micronutrients.

Nutrition output must be labeled as an estimate.

### 3. Dietary Goals

Users can set:

- Daily calorie target, optional.
- Protein target, optional.
- General goal: `balanced`, `high_protein`, `weight_loss`, `maintenance`, or `custom`.

The app should not provide medical advice.

### 4. Daily Journal

Users can:

- View meals by day.
- See daily estimated total calories and macros.
- Add a meal manually if no photo is available.

### 5. Weekly Summary

Users can view:

- Number of meals logged.
- Average estimated daily calories.
- Macro trend.
- Most visited restaurants.
- Simple AI-generated insight based on logged meals.

## Pages and Routes

| Route | Purpose |
| --- | --- |
| `/meals` | Meal journal |
| `/meals/new` | Create meal log |
| `/meals/[id]` | Meal detail |
| `/nutrition` | Daily and weekly nutrition dashboard |
| `/settings/nutrition` | Nutrition goals |

## Data Model Additions

### `nutrition_goals`

| Column | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid | Primary key, references `profiles.id` |
| `daily_calorie_target` | int | Optional |
| `daily_protein_target_g` | int | Optional |
| `goal_type` | text | Optional |
| `custom_goal_note` | text | Optional |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on edit |

### `meal_logs`

| Column | Type | Notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `user_id` | uuid | References `profiles.id` |
| `restaurant_id` | uuid | Optional references `restaurants.id` |
| `menu_item_id` | uuid | Optional references `menu_items.id` |
| `meal_name` | text | Required |
| `photo_url` | text | Optional |
| `eaten_at` | timestamptz | Required |
| `notes` | text | Optional |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on edit |

### `meal_nutrition_estimates`

| Column | Type | Notes |
| --- | --- | --- |
| `meal_log_id` | uuid | Primary key, references `meal_logs.id` |
| `calories` | int | Optional |
| `protein_g` | numeric | Optional |
| `fat_g` | numeric | Optional |
| `carbs_g` | numeric | Optional |
| `confidence` | numeric | 0-1, optional |
| `ai_provider` | text | Optional |
| `ai_model` | text | Optional |
| `created_at` | timestamptz | Default now |
| `updated_at` | timestamptz | Updated on re-analysis |

## Server Actions or API Operations

- `createMealLog(input)`
- `updateMealLog(input)`
- `deleteMealLog(mealLogId)`
- `estimateMealNutrition(mealLogId)`
- `updateNutritionGoals(input)`
- `getDailyMealJournal(date)`
- `getWeeklyNutritionSummary(weekStartDate)`

## Non-Goals

Do not build these in Stage 3:

- Medical or clinical nutrition advice.
- Barcode scanning.
- Wearable device integration.
- Payment features.
- Full social feed.

## Acceptance Criteria

Stage 3 is complete when:

- A user can create, edit, and delete their own meal logs.
- A user can upload a meal photo and receive calorie/protein/fat/carb estimates.
- A user can set nutrition goals.
- The daily journal shows meals and estimated totals.
- The weekly summary shows useful aggregate stats.
- Users cannot view or edit another user's private meal logs.
- Nutrition estimates are clearly presented as approximate.
