create or replace function app_private.is_dining_invite_participant(
  target_invite_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dining_invite_participants participant
    where participant.invite_id = target_invite_id
      and participant.user_id = target_user_id
      and participant.status = 'joined'
  );
$$;

create or replace function app_private.can_read_dining_invite(
  target_invite_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dining_invites invite
    where invite.id = target_invite_id
      and (
        invite.visibility = 'campus_public'
        or invite.host_id = target_user_id
        or (
          invite.visibility = 'friends_only'
          and app_private.are_friends(invite.host_id, target_user_id)
        )
        or app_private.is_dining_invite_participant(invite.id, target_user_id)
      )
  );
$$;

create or replace function app_private.can_join_dining_invite(
  target_invite_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.dining_invites invite
    where invite.id = target_invite_id
      and invite.status = 'open'
      and invite.expires_at > now()
  );
$$;

drop policy if exists "Authenticated users can read visible invites" on public.dining_invites;
create policy "Authenticated users can read visible invites"
on public.dining_invites for select
to authenticated
using (
  app_private.can_read_dining_invite(id, (select auth.uid()))
);

drop policy if exists "Authenticated users can read visible invite participants" on public.dining_invite_participants;
create policy "Authenticated users can read visible invite participants"
on public.dining_invite_participants for select
to authenticated
using (
  app_private.can_read_dining_invite(invite_id, (select auth.uid()))
);

drop policy if exists "Users can join invites as themselves" on public.dining_invite_participants;
create policy "Users can join invites as themselves"
on public.dining_invite_participants for insert
to authenticated
with check (
  user_id = (select auth.uid())
  and role = 'participant'
  and status = 'joined'
  and app_private.can_join_dining_invite(invite_id)
);
