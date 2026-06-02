alter table public.profiles
add column if not exists username_changed_at timestamptz;

create or replace function public.enforce_username_change_limit()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    new.username_changed_at = null;
    return new;
  end if;

  if new.username is distinct from old.username then
    if old.username_changed_at is not null
      and old.username_changed_at > now() - interval '30 days' then
      raise exception 'Username can only be changed once every 30 days.';
    end if;

    new.username_changed_at = now();
  else
    new.username_changed_at = old.username_changed_at;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_enforce_username_change_limit on public.profiles;
create trigger profiles_enforce_username_change_limit
before insert or update on public.profiles
for each row execute function public.enforce_username_change_limit();
