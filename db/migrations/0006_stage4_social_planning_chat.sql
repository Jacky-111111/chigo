alter table public.dining_invites
drop constraint if exists dining_invites_visibility_check;

alter table public.dining_invites
add constraint dining_invites_visibility_check
check (visibility in ('campus_public', 'friends_only', 'private_link'));

create table if not exists public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_not_self_check check (requester_id <> addressee_id),
  constraint friendships_status_check check (status in ('pending', 'accepted', 'rejected', 'blocked'))
);

create unique index if not exists friendships_pair_unique_idx
  on public.friendships(least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index if not exists friendships_requester_status_idx
  on public.friendships(requester_id, status);

create index if not exists friendships_addressee_status_idx
  on public.friendships(addressee_id, status);

create table if not exists public.open_seat_posts (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles(id) on delete cascade,
  restaurant_id uuid references public.restaurants(id) on delete set null,
  location_label text not null,
  available_seats int not null,
  strangers_welcome boolean not null default true,
  status text not null default 'open',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint open_seat_posts_available_seats_check check (available_seats between 1 and 12),
  constraint open_seat_posts_location_label_length_check check (char_length(location_label) between 1 and 120),
  constraint open_seat_posts_status_check check (status in ('open', 'closed', 'expired'))
);

create index if not exists open_seat_posts_feed_idx
  on public.open_seat_posts(status, expires_at desc);

create index if not exists open_seat_posts_host_idx
  on public.open_seat_posts(host_id, created_at desc);

create table if not exists public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  note text,
  status text not null default 'collecting_availability',
  confirmed_restaurant_id uuid references public.restaurants(id) on delete set null,
  confirmed_start_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plans_title_length_check check (char_length(title) between 1 and 120),
  constraint meal_plans_note_length_check check (note is null or char_length(note) <= 500),
  constraint meal_plans_status_check check (status in ('collecting_availability', 'confirmed', 'canceled'))
);

create table if not exists public.meal_plan_participants (
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'participant',
  status text not null default 'invited',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (plan_id, user_id),
  constraint meal_plan_participants_role_check check (role in ('creator', 'participant')),
  constraint meal_plan_participants_status_check check (status in ('invited', 'joined', 'declined'))
);

create index if not exists meal_plan_participants_user_status_idx
  on public.meal_plan_participants(user_id, status);

create table if not exists public.meal_plan_restaurant_candidates (
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  restaurant_id uuid not null references public.restaurants(id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (plan_id, restaurant_id)
);

create table if not exists public.meal_plan_time_slots (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  created_at timestamptz not null default now(),
  constraint meal_plan_time_slots_time_check check (end_at > start_at)
);

create index if not exists meal_plan_time_slots_plan_start_idx
  on public.meal_plan_time_slots(plan_id, start_at);

create table if not exists public.meal_plan_availability (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.meal_plans(id) on delete cascade,
  time_slot_id uuid not null references public.meal_plan_time_slots(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  availability text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint meal_plan_availability_value_check check (availability in ('yes', 'maybe', 'no')),
  unique (time_slot_id, user_id)
);

create index if not exists meal_plan_availability_plan_user_idx
  on public.meal_plan_availability(plan_id, user_id);

create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  thread_type text not null,
  title text,
  created_by uuid not null references public.profiles(id) on delete cascade,
  dining_invite_id uuid references public.dining_invites(id) on delete cascade,
  meal_plan_id uuid references public.meal_plans(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_threads_type_check check (thread_type in ('friend_group', 'dining_invite', 'meal_plan')),
  constraint chat_threads_parent_check check (
    (thread_type = 'friend_group' and dining_invite_id is null and meal_plan_id is null)
    or (thread_type = 'dining_invite' and dining_invite_id is not null and meal_plan_id is null)
    or (thread_type = 'meal_plan' and dining_invite_id is null and meal_plan_id is not null)
  ),
  constraint chat_threads_title_length_check check (title is null or char_length(title) <= 80)
);

create unique index if not exists chat_threads_dining_invite_unique_idx
  on public.chat_threads(dining_invite_id)
  where dining_invite_id is not null;

create unique index if not exists chat_threads_meal_plan_unique_idx
  on public.chat_threads(meal_plan_id)
  where meal_plan_id is not null;

create index if not exists chat_threads_updated_at_idx
  on public.chat_threads(updated_at desc);

create table if not exists public.chat_thread_members (
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (thread_id, user_id),
  constraint chat_thread_members_role_check check (role in ('owner', 'member')),
  constraint chat_thread_members_status_check check (status in ('active', 'left', 'removed'))
);

create index if not exists chat_thread_members_user_status_idx
  on public.chat_thread_members(user_id, status);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_messages_body_length_check check (char_length(body) between 1 and 1000)
);

create index if not exists chat_messages_thread_created_idx
  on public.chat_messages(thread_id, created_at);

create index if not exists chat_messages_sender_idx
  on public.chat_messages(sender_id, created_at desc);

drop trigger if exists friendships_set_updated_at on public.friendships;
create trigger friendships_set_updated_at
before update on public.friendships
for each row execute function public.set_updated_at();

drop trigger if exists open_seat_posts_set_updated_at on public.open_seat_posts;
create trigger open_seat_posts_set_updated_at
before update on public.open_seat_posts
for each row execute function public.set_updated_at();

drop trigger if exists meal_plans_set_updated_at on public.meal_plans;
create trigger meal_plans_set_updated_at
before update on public.meal_plans
for each row execute function public.set_updated_at();

drop trigger if exists meal_plan_participants_set_updated_at on public.meal_plan_participants;
create trigger meal_plan_participants_set_updated_at
before update on public.meal_plan_participants
for each row execute function public.set_updated_at();

drop trigger if exists meal_plan_availability_set_updated_at on public.meal_plan_availability;
create trigger meal_plan_availability_set_updated_at
before update on public.meal_plan_availability
for each row execute function public.set_updated_at();

drop trigger if exists chat_threads_set_updated_at on public.chat_threads;
create trigger chat_threads_set_updated_at
before update on public.chat_threads
for each row execute function public.set_updated_at();

drop trigger if exists chat_thread_members_set_updated_at on public.chat_thread_members;
create trigger chat_thread_members_set_updated_at
before update on public.chat_thread_members
for each row execute function public.set_updated_at();

drop trigger if exists chat_messages_set_updated_at on public.chat_messages;
create trigger chat_messages_set_updated_at
before update on public.chat_messages
for each row execute function public.set_updated_at();

create or replace function app_private.touch_chat_thread()
returns trigger
language plpgsql
security definer
set search_path = public, app_private
as $$
begin
  update public.chat_threads
  set updated_at = now()
  where id = new.thread_id;

  return new;
end;
$$;

drop trigger if exists chat_messages_touch_thread on public.chat_messages;
create trigger chat_messages_touch_thread
after insert or update on public.chat_messages
for each row execute function app_private.touch_chat_thread();

create or replace function app_private.are_friends(user_a uuid, user_b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.friendships friendship
    where friendship.status = 'accepted'
      and (
        (friendship.requester_id = user_a and friendship.addressee_id = user_b)
        or (friendship.requester_id = user_b and friendship.addressee_id = user_a)
      )
  );
$$;

create or replace function app_private.is_meal_plan_participant(target_plan_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.meal_plan_participants participant
    where participant.plan_id = target_plan_id
      and participant.user_id = target_user_id
      and participant.status in ('invited', 'joined')
  );
$$;

create or replace function app_private.is_chat_thread_member(target_thread_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_thread_members member
    where member.thread_id = target_thread_id
      and member.user_id = target_user_id
      and member.status = 'active'
  );
$$;

create or replace function app_private.is_chat_thread_owner(target_thread_id uuid, target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_thread_members member
    where member.thread_id = target_thread_id
      and member.user_id = target_user_id
      and member.role = 'owner'
      and member.status = 'active'
  );
$$;

alter table public.friendships enable row level security;
alter table public.open_seat_posts enable row level security;
alter table public.meal_plans enable row level security;
alter table public.meal_plan_participants enable row level security;
alter table public.meal_plan_restaurant_candidates enable row level security;
alter table public.meal_plan_time_slots enable row level security;
alter table public.meal_plan_availability enable row level security;
alter table public.chat_threads enable row level security;
alter table public.chat_thread_members enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Authenticated users can read visible invites" on public.dining_invites;
create policy "Authenticated users can read visible invites"
on public.dining_invites for select
to authenticated
using (
  visibility = 'campus_public'
  or host_id = (select auth.uid())
  or (
    visibility = 'friends_only'
    and app_private.are_friends(host_id, (select auth.uid()))
  )
  or exists (
    select 1
    from public.dining_invite_participants participant
    where participant.invite_id = dining_invites.id
      and participant.user_id = (select auth.uid())
      and participant.status = 'joined'
  )
);

drop policy if exists "Authenticated users can read campus public invites" on public.dining_invites;

drop policy if exists "Users can create own invites" on public.dining_invites;
create policy "Users can create own invites"
on public.dining_invites for insert
to authenticated
with check (
  host_id = (select auth.uid())
  and visibility in ('campus_public', 'friends_only', 'private_link')
);

drop policy if exists "Authenticated users can read visible invite participants" on public.dining_invite_participants;
create policy "Authenticated users can read visible invite participants"
on public.dining_invite_participants for select
to authenticated
using (
  exists (
    select 1
    from public.dining_invites invite
    where invite.id = dining_invite_participants.invite_id
  )
);

drop policy if exists "Users can join invites as themselves" on public.dining_invite_participants;
create policy "Users can join invites as themselves"
on public.dining_invite_participants for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'participant'
  and status = 'joined'
  and exists (
    select 1
    from public.dining_invites invite
    where invite.id = dining_invite_participants.invite_id
      and invite.status = 'open'
      and invite.expires_at > now()
  )
);

drop policy if exists "Users can read own friendships" on public.friendships;
create policy "Users can read own friendships"
on public.friendships for select
to authenticated
using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

drop policy if exists "Users can request friendships" on public.friendships;
create policy "Users can request friendships"
on public.friendships for insert
to authenticated
with check (
  requester_id = (select auth.uid())
  and addressee_id <> (select auth.uid())
  and status = 'pending'
);

drop policy if exists "Addressees can respond to friend requests" on public.friendships;
create policy "Addressees can respond to friend requests"
on public.friendships for update
to authenticated
using (addressee_id = (select auth.uid()))
with check (addressee_id = (select auth.uid()));

drop policy if exists "Users can remove own friendships" on public.friendships;
create policy "Users can remove own friendships"
on public.friendships for delete
to authenticated
using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

drop policy if exists "Authenticated users can read open seat posts" on public.open_seat_posts;
create policy "Authenticated users can read open seat posts"
on public.open_seat_posts for select
to authenticated
using (true);

drop policy if exists "Users can create own open seat posts" on public.open_seat_posts;
create policy "Users can create own open seat posts"
on public.open_seat_posts for insert
to authenticated
with check (host_id = (select auth.uid()));

drop policy if exists "Hosts can update own open seat posts" on public.open_seat_posts;
create policy "Hosts can update own open seat posts"
on public.open_seat_posts for update
to authenticated
using (host_id = (select auth.uid()))
with check (host_id = (select auth.uid()));

drop policy if exists "Participants can read meal plans" on public.meal_plans;
create policy "Participants can read meal plans"
on public.meal_plans for select
to authenticated
using (
  creator_id = (select auth.uid())
  or app_private.is_meal_plan_participant(id, (select auth.uid()))
);

drop policy if exists "Users can create own meal plans" on public.meal_plans;
create policy "Users can create own meal plans"
on public.meal_plans for insert
to authenticated
with check (creator_id = (select auth.uid()));

drop policy if exists "Creators can update own meal plans" on public.meal_plans;
create policy "Creators can update own meal plans"
on public.meal_plans for update
to authenticated
using (creator_id = (select auth.uid()))
with check (creator_id = (select auth.uid()));

drop policy if exists "Plan members can read participants" on public.meal_plan_participants;
create policy "Plan members can read participants"
on public.meal_plan_participants for select
to authenticated
using (app_private.is_meal_plan_participant(plan_id, (select auth.uid())));

drop policy if exists "Creators can invite plan participants" on public.meal_plan_participants;
create policy "Creators can invite plan participants"
on public.meal_plan_participants for insert
to authenticated
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_participants.plan_id
      and plan.creator_id = (select auth.uid())
  )
);

drop policy if exists "Participants can update own plan status" on public.meal_plan_participants;
create policy "Participants can update own plan status"
on public.meal_plan_participants for update
to authenticated
using (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_participants.plan_id
      and plan.creator_id = (select auth.uid())
  )
)
with check (
  user_id = (select auth.uid())
  or exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_participants.plan_id
      and plan.creator_id = (select auth.uid())
  )
);

drop policy if exists "Plan members can read restaurant candidates" on public.meal_plan_restaurant_candidates;
create policy "Plan members can read restaurant candidates"
on public.meal_plan_restaurant_candidates for select
to authenticated
using (app_private.is_meal_plan_participant(plan_id, (select auth.uid())));

drop policy if exists "Creators can manage restaurant candidates" on public.meal_plan_restaurant_candidates;
create policy "Creators can manage restaurant candidates"
on public.meal_plan_restaurant_candidates for all
to authenticated
using (
  exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_restaurant_candidates.plan_id
      and plan.creator_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_restaurant_candidates.plan_id
      and plan.creator_id = (select auth.uid())
  )
);

drop policy if exists "Plan members can read time slots" on public.meal_plan_time_slots;
create policy "Plan members can read time slots"
on public.meal_plan_time_slots for select
to authenticated
using (app_private.is_meal_plan_participant(plan_id, (select auth.uid())));

drop policy if exists "Creators can manage time slots" on public.meal_plan_time_slots;
create policy "Creators can manage time slots"
on public.meal_plan_time_slots for all
to authenticated
using (
  exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_time_slots.plan_id
      and plan.creator_id = (select auth.uid())
  )
)
with check (
  exists (
    select 1
    from public.meal_plans plan
    where plan.id = meal_plan_time_slots.plan_id
      and plan.creator_id = (select auth.uid())
  )
);

drop policy if exists "Plan members can read availability" on public.meal_plan_availability;
create policy "Plan members can read availability"
on public.meal_plan_availability for select
to authenticated
using (app_private.is_meal_plan_participant(plan_id, (select auth.uid())));

drop policy if exists "Participants can submit own availability" on public.meal_plan_availability;
create policy "Participants can submit own availability"
on public.meal_plan_availability for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and app_private.is_meal_plan_participant(plan_id, (select auth.uid()))
);

drop policy if exists "Participants can update own availability" on public.meal_plan_availability;
create policy "Participants can update own availability"
on public.meal_plan_availability for update
to authenticated
using (
  user_id = (select auth.uid())
  and app_private.is_meal_plan_participant(plan_id, (select auth.uid()))
)
with check (
  user_id = (select auth.uid())
  and app_private.is_meal_plan_participant(plan_id, (select auth.uid()))
);

drop policy if exists "Members can read chat threads" on public.chat_threads;
create policy "Members can read chat threads"
on public.chat_threads for select
to authenticated
using (
  created_by = (select auth.uid())
  or app_private.is_chat_thread_member(id, (select auth.uid()))
);

drop policy if exists "Users can create eligible chat threads" on public.chat_threads;
create policy "Users can create eligible chat threads"
on public.chat_threads for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and (
    thread_type = 'friend_group'
    or exists (
      select 1
      from public.dining_invites invite
      where invite.id = chat_threads.dining_invite_id
        and invite.host_id = (select auth.uid())
    )
    or exists (
      select 1
      from public.meal_plans plan
      where plan.id = chat_threads.meal_plan_id
        and plan.creator_id = (select auth.uid())
    )
  )
);

drop policy if exists "Owners can update chat threads" on public.chat_threads;
create policy "Owners can update chat threads"
on public.chat_threads for update
to authenticated
using (app_private.is_chat_thread_owner(id, (select auth.uid())))
with check (app_private.is_chat_thread_owner(id, (select auth.uid())));

drop policy if exists "Members can read chat memberships" on public.chat_thread_members;
create policy "Members can read chat memberships"
on public.chat_thread_members for select
to authenticated
using (app_private.is_chat_thread_member(thread_id, (select auth.uid())));

drop policy if exists "Eligible users can add chat members" on public.chat_thread_members;
create policy "Eligible users can add chat members"
on public.chat_thread_members for insert
to authenticated
with check (
  (
    user_id = (select auth.uid())
    and role = 'owner'
    and exists (
      select 1
      from public.chat_threads thread
      where thread.id = chat_thread_members.thread_id
        and thread.created_by = (select auth.uid())
    )
  )
  or exists (
    select 1
    from public.chat_threads thread
    where thread.id = chat_thread_members.thread_id
      and thread.thread_type = 'friend_group'
      and app_private.is_chat_thread_owner(thread.id, (select auth.uid()))
      and app_private.are_friends((select auth.uid()), chat_thread_members.user_id)
  )
  or exists (
    select 1
    from public.chat_threads thread
    join public.dining_invites invite on invite.id = thread.dining_invite_id
    where thread.id = chat_thread_members.thread_id
      and (
        invite.host_id = (select auth.uid())
        or (
          chat_thread_members.user_id = (select auth.uid())
          and exists (
            select 1
            from public.dining_invite_participants participant
            where participant.invite_id = invite.id
              and participant.user_id = (select auth.uid())
              and participant.status = 'joined'
          )
        )
      )
  )
  or exists (
    select 1
    from public.chat_threads thread
    join public.meal_plans plan on plan.id = thread.meal_plan_id
    where thread.id = chat_thread_members.thread_id
      and plan.creator_id = (select auth.uid())
  )
  or exists (
    select 1
    from public.chat_threads thread
    join public.meal_plans plan on plan.id = thread.meal_plan_id
    where thread.id = chat_thread_members.thread_id
      and chat_thread_members.user_id = (select auth.uid())
      and app_private.is_meal_plan_participant(plan.id, (select auth.uid()))
  )
);

drop policy if exists "Eligible users can update chat memberships" on public.chat_thread_members;
create policy "Eligible users can update chat memberships"
on public.chat_thread_members for update
to authenticated
using (
  user_id = (select auth.uid())
  or app_private.is_chat_thread_owner(thread_id, (select auth.uid()))
)
with check (
  user_id = (select auth.uid())
  or app_private.is_chat_thread_owner(thread_id, (select auth.uid()))
);

drop policy if exists "Members can read chat messages" on public.chat_messages;
create policy "Members can read chat messages"
on public.chat_messages for select
to authenticated
using (app_private.is_chat_thread_member(thread_id, (select auth.uid())));

drop policy if exists "Members can send chat messages" on public.chat_messages;
create policy "Members can send chat messages"
on public.chat_messages for insert
to authenticated
with check (
  sender_id = (select auth.uid())
  and app_private.is_chat_thread_member(thread_id, (select auth.uid()))
);

drop policy if exists "Users can soft delete own chat messages" on public.chat_messages;
create policy "Users can soft delete own chat messages"
on public.chat_messages for update
to authenticated
using (sender_id = (select auth.uid()))
with check (sender_id = (select auth.uid()));

grant select, insert, update, delete on public.friendships to authenticated;
grant select, insert, update on public.open_seat_posts to authenticated;
grant select, insert, update on public.meal_plans to authenticated;
grant select, insert, update on public.meal_plan_participants to authenticated;
grant select, insert, update, delete on public.meal_plan_restaurant_candidates to authenticated;
grant select, insert, update, delete on public.meal_plan_time_slots to authenticated;
grant select, insert, update on public.meal_plan_availability to authenticated;
grant select, insert, update on public.chat_threads to authenticated;
grant select, insert, update on public.chat_thread_members to authenticated;
grant select, insert, update on public.chat_messages to authenticated;

do $$
begin
  alter publication supabase_realtime add table public.chat_messages;
exception
  when duplicate_object then null;
  when undefined_object then null;
end $$;
