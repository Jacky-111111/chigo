insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'meal-images',
  'meal-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.nutrition_goals (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  daily_calorie_target int,
  daily_protein_target_g int,
  goal_type text,
  custom_goal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint nutrition_goals_calorie_target_check
    check (daily_calorie_target is null or daily_calorie_target between 500 and 8000),
  constraint nutrition_goals_protein_target_check
    check (daily_protein_target_g is null or daily_protein_target_g between 0 and 500),
  constraint nutrition_goals_goal_type_check
    check (goal_type is null or goal_type in ('balanced', 'high_protein', 'weight_loss', 'maintenance', 'custom')),
  constraint nutrition_goals_custom_note_length_check
    check (custom_goal_note is null or char_length(custom_goal_note) <= 240)
);

create table if not exists public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  menu_item_id uuid references public.menu_items(id) on delete set null,
  meal_name text not null,
  photo_url text,
  eaten_at timestamptz not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_logs_meal_name_length_check check (char_length(meal_name) between 1 and 120),
  constraint meal_logs_notes_length_check check (notes is null or char_length(notes) <= 500)
);

create table if not exists public.meal_nutrition_estimates (
  meal_log_id uuid primary key references public.meal_logs(id) on delete cascade,
  calories int,
  protein_g numeric,
  fat_g numeric,
  carbs_g numeric,
  confidence numeric,
  ai_provider text,
  ai_model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_nutrition_estimates_calories_check
    check (calories is null or calories between 0 and 10000),
  constraint meal_nutrition_estimates_protein_check
    check (protein_g is null or protein_g between 0 and 1000),
  constraint meal_nutrition_estimates_fat_check
    check (fat_g is null or fat_g between 0 and 1000),
  constraint meal_nutrition_estimates_carbs_check
    check (carbs_g is null or carbs_g between 0 and 1000),
  constraint meal_nutrition_estimates_confidence_check
    check (confidence is null or confidence between 0 and 1)
);

create index if not exists meal_logs_user_eaten_at_idx
  on public.meal_logs(user_id, eaten_at desc);

create index if not exists meal_logs_restaurant_id_idx
  on public.meal_logs(restaurant_id);

create index if not exists meal_logs_menu_item_id_idx
  on public.meal_logs(menu_item_id);

drop trigger if exists nutrition_goals_set_updated_at on public.nutrition_goals;
create trigger nutrition_goals_set_updated_at
before update on public.nutrition_goals
for each row execute function public.set_updated_at();

drop trigger if exists meal_logs_set_updated_at on public.meal_logs;
create trigger meal_logs_set_updated_at
before update on public.meal_logs
for each row execute function public.set_updated_at();

drop trigger if exists meal_nutrition_estimates_set_updated_at on public.meal_nutrition_estimates;
create trigger meal_nutrition_estimates_set_updated_at
before update on public.meal_nutrition_estimates
for each row execute function public.set_updated_at();

alter table public.nutrition_goals enable row level security;
alter table public.meal_logs enable row level security;
alter table public.meal_nutrition_estimates enable row level security;

drop policy if exists "Users can read own nutrition goals" on public.nutrition_goals;
create policy "Users can read own nutrition goals"
on public.nutrition_goals for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own nutrition goals" on public.nutrition_goals;
create policy "Users can insert own nutrition goals"
on public.nutrition_goals for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own nutrition goals" on public.nutrition_goals;
create policy "Users can update own nutrition goals"
on public.nutrition_goals for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can read own meal logs" on public.meal_logs;
create policy "Users can read own meal logs"
on public.meal_logs for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create own meal logs" on public.meal_logs;
create policy "Users can create own meal logs"
on public.meal_logs for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own meal logs" on public.meal_logs;
create policy "Users can update own meal logs"
on public.meal_logs for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can delete own meal logs" on public.meal_logs;
create policy "Users can delete own meal logs"
on public.meal_logs for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can read own meal nutrition estimates" on public.meal_nutrition_estimates;
create policy "Users can read own meal nutrition estimates"
on public.meal_nutrition_estimates for select
to authenticated
using (
  exists (
    select 1
    from public.meal_logs meal
    where meal.id = meal_nutrition_estimates.meal_log_id
      and meal.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can create estimates for own meal logs" on public.meal_nutrition_estimates;
create policy "Users can create estimates for own meal logs"
on public.meal_nutrition_estimates for insert
to authenticated
with check (
  exists (
    select 1
    from public.meal_logs meal
    where meal.id = meal_nutrition_estimates.meal_log_id
      and meal.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can update estimates for own meal logs" on public.meal_nutrition_estimates;
create policy "Users can update estimates for own meal logs"
on public.meal_nutrition_estimates for update
to authenticated
using (
  exists (
    select 1
    from public.meal_logs meal
    where meal.id = meal_nutrition_estimates.meal_log_id
      and meal.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.meal_logs meal
    where meal.id = meal_nutrition_estimates.meal_log_id
      and meal.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can delete estimates for own meal logs" on public.meal_nutrition_estimates;
create policy "Users can delete estimates for own meal logs"
on public.meal_nutrition_estimates for delete
to authenticated
using (
  exists (
    select 1
    from public.meal_logs meal
    where meal.id = meal_nutrition_estimates.meal_log_id
      and meal.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can upload own meal images" on storage.objects;
create policy "Users can upload own meal images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can read own meal images" on storage.objects;
create policy "Users can read own meal images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own meal images" on storage.objects;
create policy "Users can update own meal images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own meal images" on storage.objects;
create policy "Users can delete own meal images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'meal-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

grant select, insert, update on public.nutrition_goals to authenticated;
grant select, insert, update, delete on public.meal_logs to authenticated;
grant select, insert, update, delete on public.meal_nutrition_estimates to authenticated;
