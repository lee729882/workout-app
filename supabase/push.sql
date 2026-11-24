-- 푸시 알림 (구조). 실제로 실행할 때는 비밀값이 채워진 supabase/push-setup.secret.sql 을 쓰세요.
-- (그 파일 = 이 파일 + 맨 아래 비밀값. GitHub에는 올라가지 않아요)

create extension if not exists pg_net;

-- 알림 받을 휴대폰 목록
create table if not exists push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
alter table push_subscriptions enable row level security;
drop policy if exists "own subs" on push_subscriptions;
create policy "own subs" on push_subscriptions for all
  using (user_id = auth.uid()) with check (user_id = auth.uid() and is_member());
grant select, insert, update, delete on push_subscriptions to authenticated;

-- 비밀 설정 (API로는 아무도 못 읽어요. 알림 함수만 읽어요)
create table if not exists app_config (
  key text primary key,
  value text not null
);
alter table app_config enable row level security;
revoke all on app_config from anon, authenticated;

-- 변경이 생기면 알림 함수(Edge Function 'push')를 불러요
create or replace function notify_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  fn_url text := (select value from app_config where key = 'push_url');
  secret text := (select value from app_config where key = 'push_hook_secret');
begin
  if fn_url is null then return new; end if;
  perform net.http_post(
    url := fn_url,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', secret),
    body := jsonb_build_object(
      'table', tg_table_name,
      'type', tg_op,
      'record', to_jsonb(new),
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) end
    )
  );
  return new;
end $$;

drop trigger if exists push_on_request on workout_requests;
create trigger push_on_request after insert or update of status on workout_requests
  for each row execute function notify_push();

drop trigger if exists push_on_coupon on coupons;
create trigger push_on_coupon after insert or update of status on coupons
  for each row execute function notify_push();

drop trigger if exists push_on_ledger on point_ledger;
create trigger push_on_ledger after insert on point_ledger
  for each row execute function notify_push();
