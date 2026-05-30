create extension if not exists pgcrypto;

create schema if not exists app_private;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  display_name text not null,
  university text not null default 'Carnegie Mellon University',
  bio text,
  instagram_handle text,
  avatar_url text,
  profile_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_username_format check (username ~ '^[a-z0-9_]{3,24}$'),
  constraint profiles_display_name_length check (char_length(display_name) between 1 and 60)
);

create table if not exists public.user_dining_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  dietary_restrictions text[] not null default '{}',
  allergies text[] not null default '{}',
  favorite_cuisines text[] not null default '{}',
  typical_meal_times text[] not null default '{}',
  social_preference text not null default 'open_to_invites',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_dining_preferences_social_preference_check
    check (social_preference in ('open_to_invites', 'friends_only', 'private'))
);

create table if not exists public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  cuisine text,
  address text not null,
  latitude numeric not null,
  longitude numeric not null,
  price_level int,
  photo_url text,
  google_maps_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint restaurants_price_level_check check (price_level is null or price_level between 1 and 4)
);

create table if not exists public.dining_invites (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  start_at timestamptz not null,
  expires_at timestamptz not null,
  max_participants int not null,
  message text,
  visibility text not null default 'campus_public',
  status text not null default 'open',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint dining_invites_max_participants_check check (max_participants between 2 and 8),
  constraint dining_invites_visibility_check check (visibility in ('campus_public')),
  constraint dining_invites_status_check check (status in ('open', 'full', 'canceled', 'completed', 'expired')),
  constraint dining_invites_expiration_check check (expires_at > start_at)
);

create table if not exists public.dining_invite_participants (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null references public.dining_invites(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'participant',
  status text not null default 'joined',
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  constraint dining_invite_participants_role_check check (role in ('host', 'participant')),
  constraint dining_invite_participants_status_check check (status in ('joined', 'left'))
);

create unique index if not exists dining_invite_participants_one_active_membership
  on public.dining_invite_participants(invite_id, user_id)
  where status = 'joined';

create index if not exists restaurants_active_location_idx
  on public.restaurants(is_active, latitude, longitude);

create index if not exists dining_invites_feed_idx
  on public.dining_invites(status, visibility, expires_at, start_at);

create index if not exists dining_invite_participants_invite_status_idx
  on public.dining_invite_participants(invite_id, status);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists user_dining_preferences_set_updated_at on public.user_dining_preferences;
create trigger user_dining_preferences_set_updated_at
before update on public.user_dining_preferences
for each row execute function public.set_updated_at();

drop trigger if exists restaurants_set_updated_at on public.restaurants;
create trigger restaurants_set_updated_at
before update on public.restaurants
for each row execute function public.set_updated_at();

drop trigger if exists dining_invites_set_updated_at on public.dining_invites;
create trigger dining_invites_set_updated_at
before update on public.dining_invites
for each row execute function public.set_updated_at();

create or replace function app_private.add_host_participant()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  insert into public.dining_invite_participants (invite_id, user_id, role, status)
  values (new.id, new.host_id, 'host', 'joined')
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists dining_invites_add_host_participant on public.dining_invites;
create trigger dining_invites_add_host_participant
after insert on public.dining_invites
for each row execute function app_private.add_host_participant();

alter table public.profiles enable row level security;
alter table public.user_dining_preferences enable row level security;
alter table public.restaurants enable row level security;
alter table public.dining_invites enable row level security;
alter table public.dining_invite_participants enable row level security;

drop policy if exists "Profiles are readable by authenticated users" on public.profiles;
create policy "Profiles are readable by authenticated users"
on public.profiles for select
to authenticated
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "Users can read own dining preferences" on public.user_dining_preferences;
create policy "Users can read own dining preferences"
on public.user_dining_preferences for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can insert own dining preferences" on public.user_dining_preferences;
create policy "Users can insert own dining preferences"
on public.user_dining_preferences for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "Users can update own dining preferences" on public.user_dining_preferences;
create policy "Users can update own dining preferences"
on public.user_dining_preferences for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Authenticated users can read active restaurants" on public.restaurants;
create policy "Authenticated users can read active restaurants"
on public.restaurants for select
to authenticated
using (is_active = true);

drop policy if exists "Authenticated users can read campus public invites" on public.dining_invites;
create policy "Authenticated users can read campus public invites"
on public.dining_invites for select
to authenticated
using (visibility = 'campus_public');

drop policy if exists "Users can create own invites" on public.dining_invites;
create policy "Users can create own invites"
on public.dining_invites for insert
to authenticated
with check (host_id = auth.uid() and visibility = 'campus_public');

drop policy if exists "Hosts can update own invites" on public.dining_invites;
create policy "Hosts can update own invites"
on public.dining_invites for update
to authenticated
using (host_id = auth.uid())
with check (host_id = auth.uid());

drop policy if exists "Authenticated users can read visible invite participants" on public.dining_invite_participants;
create policy "Authenticated users can read visible invite participants"
on public.dining_invite_participants for select
to authenticated
using (
  exists (
    select 1
    from public.dining_invites invite
    where invite.id = dining_invite_participants.invite_id
      and invite.visibility = 'campus_public'
  )
);

drop policy if exists "Users can join invites as themselves" on public.dining_invite_participants;
create policy "Users can join invites as themselves"
on public.dining_invite_participants for insert
to authenticated
with check (user_id = auth.uid() and role = 'participant' and status = 'joined');

drop policy if exists "Users can update own participant row" on public.dining_invite_participants;
create policy "Users can update own participant row"
on public.dining_invite_participants for update
to authenticated
using (user_id = auth.uid() and role = 'participant')
with check (user_id = auth.uid() and role = 'participant');

grant usage on schema public to authenticated;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.user_dining_preferences to authenticated;
grant select on public.restaurants to authenticated;
grant select, insert, update on public.dining_invites to authenticated;
grant select, insert, update on public.dining_invite_participants to authenticated;
