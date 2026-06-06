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
  or app_private.is_dining_invite_participant(id, (select auth.uid()))
);
