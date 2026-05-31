insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'menu-images',
  'menu-images',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.menu_uploads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  image_url text not null,
  status text not null default 'uploaded',
  source_language text,
  target_language text not null default 'en',
  extracted_text text,
  ai_provider text,
  ai_model text,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint menu_uploads_status_check check (status in ('uploaded', 'processing', 'completed', 'failed')),
  constraint menu_uploads_target_language_check check (target_language ~ '^[a-z]{2}(-[A-Z]{2})?$')
);

create table if not exists public.menu_items (
  id uuid primary key default gen_random_uuid(),
  menu_upload_id uuid not null references public.menu_uploads(id) on delete cascade,
  original_name text not null,
  translated_name text,
  description text,
  ingredients text[] not null default '{}',
  cooking_method text,
  cuisine_context text,
  dietary_warnings text[] not null default '{}',
  recommendation_score int,
  recommendation_reason text,
  confidence numeric,
  sort_order int not null,
  created_at timestamptz not null default now(),
  constraint menu_items_recommendation_score_check
    check (recommendation_score is null or recommendation_score between 0 and 100),
  constraint menu_items_confidence_check
    check (confidence is null or confidence between 0 and 1)
);

create table if not exists public.menu_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  menu_item_id uuid not null references public.menu_items(id) on delete cascade,
  feedback_type text not null,
  note text,
  created_at timestamptz not null default now(),
  constraint menu_feedback_type_check
    check (feedback_type in ('incorrect_translation', 'wrong_ingredients', 'allergy_risk', 'other'))
);

create index if not exists menu_uploads_user_created_idx
  on public.menu_uploads(user_id, created_at desc);

create index if not exists menu_uploads_restaurant_completed_idx
  on public.menu_uploads(restaurant_id, updated_at desc)
  where status = 'completed';

create index if not exists menu_items_upload_sort_idx
  on public.menu_items(menu_upload_id, sort_order);

create index if not exists menu_feedback_user_item_idx
  on public.menu_feedback(user_id, menu_item_id);

drop trigger if exists menu_uploads_set_updated_at on public.menu_uploads;
create trigger menu_uploads_set_updated_at
before update on public.menu_uploads
for each row execute function public.set_updated_at();

alter table public.menu_uploads enable row level security;
alter table public.menu_items enable row level security;
alter table public.menu_feedback enable row level security;

drop policy if exists "Users can read own menu uploads" on public.menu_uploads;
create policy "Users can read own menu uploads"
on public.menu_uploads for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Authenticated users can read completed restaurant menu uploads" on public.menu_uploads;
create policy "Authenticated users can read completed restaurant menu uploads"
on public.menu_uploads for select
to authenticated
using (status = 'completed' and restaurant_id is not null);

drop policy if exists "Users can create own menu uploads" on public.menu_uploads;
create policy "Users can create own menu uploads"
on public.menu_uploads for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own menu uploads" on public.menu_uploads;
create policy "Users can update own menu uploads"
on public.menu_uploads for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read accessible menu items" on public.menu_items;
create policy "Users can read accessible menu items"
on public.menu_items for select
to authenticated
using (
  exists (
    select 1
    from public.menu_uploads upload
    where upload.id = menu_items.menu_upload_id
      and (
        upload.user_id = auth.uid()
        or (upload.status = 'completed' and upload.restaurant_id is not null)
      )
  )
);

drop policy if exists "Users can create menu items for own uploads" on public.menu_items;
create policy "Users can create menu items for own uploads"
on public.menu_items for insert
to authenticated
with check (
  exists (
    select 1
    from public.menu_uploads upload
    where upload.id = menu_items.menu_upload_id
      and upload.user_id = auth.uid()
  )
);

drop policy if exists "Users can update menu items for own uploads" on public.menu_items;
create policy "Users can update menu items for own uploads"
on public.menu_items for update
to authenticated
using (
  exists (
    select 1
    from public.menu_uploads upload
    where upload.id = menu_items.menu_upload_id
      and upload.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.menu_uploads upload
    where upload.id = menu_items.menu_upload_id
      and upload.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete menu items for own uploads" on public.menu_items;
create policy "Users can delete menu items for own uploads"
on public.menu_items for delete
to authenticated
using (
  exists (
    select 1
    from public.menu_uploads upload
    where upload.id = menu_items.menu_upload_id
      and upload.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own menu feedback" on public.menu_feedback;
create policy "Users can read own menu feedback"
on public.menu_feedback for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can create feedback on accessible menu items" on public.menu_feedback;
create policy "Users can create feedback on accessible menu items"
on public.menu_feedback for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.menu_items item
    join public.menu_uploads upload on upload.id = item.menu_upload_id
    where item.id = menu_feedback.menu_item_id
      and (
        upload.user_id = auth.uid()
        or (upload.status = 'completed' and upload.restaurant_id is not null)
      )
  )
);

drop policy if exists "Users can upload own menu images" on storage.objects;
create policy "Users can upload own menu images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can read own menu images" on storage.objects;
create policy "Users can read own menu images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update own menu images" on storage.objects;
create policy "Users can update own menu images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete own menu images" on storage.objects;
create policy "Users can delete own menu images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

grant select, insert, update on public.menu_uploads to authenticated;
grant select, insert, update, delete on public.menu_items to authenticated;
grant select, insert on public.menu_feedback to authenticated;
