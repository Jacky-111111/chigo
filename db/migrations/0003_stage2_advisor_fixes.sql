create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create index if not exists dining_invites_host_id_idx
  on public.dining_invites(host_id);

create index if not exists dining_invites_restaurant_id_idx
  on public.dining_invites(restaurant_id);

create index if not exists dining_invite_participants_user_id_idx
  on public.dining_invite_participants(user_id);

create index if not exists menu_feedback_menu_item_id_idx
  on public.menu_feedback(menu_item_id);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = (select auth.uid()));

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

drop policy if exists "Users can read own dining preferences" on public.user_dining_preferences;
create policy "Users can read own dining preferences"
on public.user_dining_preferences for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can insert own dining preferences" on public.user_dining_preferences;
create policy "Users can insert own dining preferences"
on public.user_dining_preferences for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own dining preferences" on public.user_dining_preferences;
create policy "Users can update own dining preferences"
on public.user_dining_preferences for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

drop policy if exists "Users can create own invites" on public.dining_invites;
create policy "Users can create own invites"
on public.dining_invites for insert
to authenticated
with check (host_id = (select auth.uid()) and visibility = 'campus_public');

drop policy if exists "Hosts can update own invites" on public.dining_invites;
create policy "Hosts can update own invites"
on public.dining_invites for update
to authenticated
using (host_id = (select auth.uid()))
with check (host_id = (select auth.uid()));

drop policy if exists "Users can join invites as themselves" on public.dining_invite_participants;
create policy "Users can join invites as themselves"
on public.dining_invite_participants for insert
to authenticated
with check (user_id = (select auth.uid()) and role = 'participant' and status = 'joined');

drop policy if exists "Users can update own participant row" on public.dining_invite_participants;
create policy "Users can update own participant row"
on public.dining_invite_participants for update
to authenticated
using (user_id = (select auth.uid()) and role = 'participant')
with check (user_id = (select auth.uid()) and role = 'participant');

drop policy if exists "Users can read own menu uploads" on public.menu_uploads;
drop policy if exists "Authenticated users can read completed restaurant menu uploads" on public.menu_uploads;
create policy "Users can read accessible menu uploads"
on public.menu_uploads for select
to authenticated
using (
  user_id = (select auth.uid())
  or (status = 'completed' and restaurant_id is not null)
);

drop policy if exists "Users can create own menu uploads" on public.menu_uploads;
create policy "Users can create own menu uploads"
on public.menu_uploads for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "Users can update own menu uploads" on public.menu_uploads;
create policy "Users can update own menu uploads"
on public.menu_uploads for update
to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

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
        upload.user_id = (select auth.uid())
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
      and upload.user_id = (select auth.uid())
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
      and upload.user_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.menu_uploads upload
    where upload.id = menu_items.menu_upload_id
      and upload.user_id = (select auth.uid())
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
      and upload.user_id = (select auth.uid())
  )
);

drop policy if exists "Users can read own menu feedback" on public.menu_feedback;
create policy "Users can read own menu feedback"
on public.menu_feedback for select
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "Users can create feedback on accessible menu items" on public.menu_feedback;
create policy "Users can create feedback on accessible menu items"
on public.menu_feedback for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1
    from public.menu_items item
    join public.menu_uploads upload on upload.id = item.menu_upload_id
    where item.id = menu_feedback.menu_item_id
      and (
        upload.user_id = (select auth.uid())
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
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can read own menu images" on storage.objects;
create policy "Users can read own menu images"
on storage.objects for select
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own menu images" on storage.objects;
create policy "Users can update own menu images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
)
with check (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can delete own menu images" on storage.objects;
create policy "Users can delete own menu images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'menu-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
