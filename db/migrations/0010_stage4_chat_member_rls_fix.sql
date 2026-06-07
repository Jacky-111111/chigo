create or replace function app_private.can_insert_chat_thread(
  target_thread_type text,
  target_dining_invite_id uuid,
  target_meal_plan_id uuid,
  actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_thread_type = 'friend_group'
    or (
      target_thread_type = 'dining_invite'
      and exists (
        select 1
        from public.dining_invites invite
        where invite.id = target_dining_invite_id
          and invite.host_id = actor_id
      )
    )
    or (
      target_thread_type = 'meal_plan'
      and exists (
        select 1
        from public.meal_plans plan
        where plan.id = target_meal_plan_id
          and plan.creator_id = actor_id
      )
    );
$$;

create or replace function app_private.can_insert_chat_thread_member(
  target_thread_id uuid,
  target_user_id uuid,
  target_role text,
  actor_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_threads thread
    where thread.id = target_thread_id
      and (
        (
          target_user_id = actor_id
          and target_role = 'owner'
          and thread.created_by = actor_id
        )
        or (
          thread.thread_type = 'friend_group'
          and target_role = 'member'
          and app_private.is_chat_thread_owner(thread.id, actor_id)
          and app_private.are_friends(actor_id, target_user_id)
        )
        or (
          thread.thread_type = 'dining_invite'
          and exists (
            select 1
            from public.dining_invites invite
            where invite.id = thread.dining_invite_id
              and (
                invite.host_id = actor_id
                or (
                  target_user_id = actor_id
                  and app_private.is_dining_invite_participant(invite.id, actor_id)
                )
              )
          )
        )
        or (
          thread.thread_type = 'meal_plan'
          and exists (
            select 1
            from public.meal_plans plan
            where plan.id = thread.meal_plan_id
              and (
                plan.creator_id = actor_id
                or (
                  target_user_id = actor_id
                  and app_private.is_meal_plan_participant(plan.id, actor_id)
                )
              )
          )
        )
      )
  );
$$;

drop policy if exists "Users can create eligible chat threads" on public.chat_threads;
create policy "Users can create eligible chat threads"
on public.chat_threads for insert
to authenticated
with check (
  created_by = (select auth.uid())
  and app_private.can_insert_chat_thread(
    thread_type,
    dining_invite_id,
    meal_plan_id,
    (select auth.uid())
  )
);

drop policy if exists "Eligible users can add chat members" on public.chat_thread_members;
create policy "Eligible users can add chat members"
on public.chat_thread_members for insert
to authenticated
with check (
  app_private.can_insert_chat_thread_member(
    thread_id,
    user_id,
    role,
    (select auth.uid())
  )
);
