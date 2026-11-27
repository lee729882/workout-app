-- 업데이트 v5: 운동 날짜 옮기기 (같은 주 안, 오늘 이후로, 하루에 운동 하나)
-- SQL Editor 에 통째로 붙여 넣고 Run. 여러 번 실행해도 괜찮아요.

-- 옮긴 기록: from_date(원래 계획 날짜)의 운동을 to_date 에 해요
create table if not exists workout_moves (
  from_date date primary key,
  to_date date not null unique,
  moved_by uuid default auth.uid(),
  at timestamptz not null default now()
);
alter table workout_moves enable row level security;
drop policy if exists "members read" on workout_moves;
create policy "members read" on workout_moves for select using (is_member());
grant select on workout_moves to authenticated;

do $$ begin
  alter publication supabase_realtime add table workout_moves;
exception when duplicate_object then null; end $$;

-- 그날 실제로 하게 되는 운동이 있는지 (옮긴 것까지 따져서)
create or replace function has_workout_on(d date) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from workout_moves where to_date = d)
      or exists (
        select 1 from plan_days p
         where p.date = d and p.kind not in ('rest', 'recovery')
           and not exists (select 1 from workout_moves m where m.from_date = d)
      );
$$;

-- 운동 옮기기. dst 를 원래 날짜(src)로 주면 되돌리기
create or replace function move_workout(src date, dst date) returns void
language plpgsql security definer set search_path = public as $$
declare
  today date := (now() at time zone 'Asia/Seoul')::date;
  cur date;
begin
  if not is_member() then raise exception '로그인이 필요해요'; end if;
  if not exists (select 1 from plan_days where date = src and kind not in ('rest', 'recovery')) then
    raise exception '옮길 운동이 없어요';
  end if;

  cur := coalesce((select to_date from workout_moves where from_date = src), src);
  if exists (select 1 from workout_requests where date = cur and status in ('pending', 'approved')) then
    raise exception '이미 완료 요청한 운동은 옮길 수 없어요';
  end if;

  if dst = src then
    delete from workout_moves where from_date = src;
    return;
  end if;
  if dst = cur then return; end if;

  if dst - extract(dow from dst)::int <> src - extract(dow from src)::int then
    raise exception '같은 주(일~토) 안에서만 옮길 수 있어요';
  end if;
  if dst < today then raise exception '지난 날짜로는 옮길 수 없어요'; end if;
  if has_workout_on(dst) then raise exception '그날은 이미 운동이 있어요'; end if;

  insert into workout_moves (from_date, to_date) values (src, dst)
  on conflict (from_date) do update set to_date = excluded.to_date, moved_by = auth.uid(), at = now();
end $$;

revoke execute on function move_workout, has_workout_on from anon, public;
grant execute on function move_workout to authenticated;

-- ───── 알림: 옮기면 상대방에게 알려요 (누가 했는지·원래 운동도 같이 보내요) ─────
create or replace function notify_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cfg jsonb := (select jsonb_object_agg(key, value) from app_config);
  rec jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
  subs jsonb;
  reward jsonb;
  plan jsonb;
begin
  if cfg ->> 'push_url' is null then return coalesce(new, old); end if;

  select jsonb_build_object(
    'user',  coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) filter (where p.role = 'user'), '[]'),
    'admin', coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) filter (where p.role = 'admin'), '[]')
  ) into subs
  from push_subscriptions s join profiles p on p.id = s.user_id;

  if tg_table_name = 'coupons' then
    select jsonb_build_object('name', name, 'grade', grade) into reward from rewards where id = rec ->> 'reward_id';
  end if;
  if tg_table_name = 'workout_moves' then
    select to_jsonb(p) into plan from plan_days p where p.date = (rec ->> 'from_date')::date;
  end if;

  perform net.http_post(
    url := cfg ->> 'push_url',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', cfg ->> 'push_hook_secret'),
    body := jsonb_build_object(
      'table', tg_table_name,
      'type', tg_op,
      'record', rec,
      'old_record', case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end,
      'reward', reward,
      'plan', plan,
      'actor', (select role from profiles where id = auth.uid()),
      'subs', subs,
      'vapid', jsonb_build_object('public', cfg ->> 'vapid_public', 'private', cfg ->> 'vapid_private', 'subject', cfg ->> 'vapid_subject')
    )
  );
  return coalesce(new, old);
end $$;

drop trigger if exists push_on_move on workout_moves;
create trigger push_on_move after insert or update or delete on workout_moves
  for each row execute function notify_push();

-- ───── 밤 12시 알림: 옮긴 운동을 따라가요 ─────
create or replace function daily_reminder() returns void
language plpgsql security definer set search_path = public as $$
declare
  cfg jsonb := (select jsonb_object_agg(key, value) from app_config);
  today date := (now() at time zone 'Asia/Seoul')::date;
  d plan_days;
  subs jsonb;
begin
  select p.* into d from plan_days p
   where p.date = (select from_date from workout_moves where to_date = today)
      or (p.date = today and p.kind not in ('rest', 'recovery')
          and not exists (select 1 from workout_moves m where m.from_date = today))
   limit 1;
  if d.date is null or cfg ->> 'push_url' is null then return; end if;

  select coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)), '[]')
    into subs
    from push_subscriptions s join profiles p on p.id = s.user_id
   where p.role = 'user';

  perform net.http_post(
    url := cfg ->> 'push_url',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', cfg ->> 'push_hook_secret'),
    body := jsonb_build_object(
      'table', 'reminder',
      'type', 'INSERT',
      'record', to_jsonb(d) || jsonb_build_object('today', today),
      'subs', jsonb_build_object('user', subs, 'admin', '[]'::jsonb),
      'vapid', jsonb_build_object('public', cfg ->> 'vapid_public', 'private', cfg ->> 'vapid_private', 'subject', cfg ->> 'vapid_subject')
    )
  );
end $$;
revoke execute on function daily_reminder() from anon, authenticated, public;

select 'ok' as result;
