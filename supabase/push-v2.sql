-- 푸시 알림 v2: DB가 받을 사람 목록과 키까지 담아서 함수에 보내요.
-- (함수가 DB를 직접 읽지 않아서 관리자 키가 필요 없어요)
-- SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 괜찮아요.

create or replace function notify_push() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  cfg jsonb := (select jsonb_object_agg(key, value) from app_config);
  rec jsonb := to_jsonb(new);
  subs jsonb;
  reward jsonb;
begin
  if cfg ->> 'push_url' is null then return new; end if;

  select jsonb_build_object(
    'user',  coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) filter (where p.role = 'user'), '[]'),
    'admin', coalesce(jsonb_agg(jsonb_build_object('endpoint', s.endpoint, 'p256dh', s.p256dh, 'auth', s.auth)) filter (where p.role = 'admin'), '[]')
  ) into subs
  from push_subscriptions s join profiles p on p.id = s.user_id;

  if tg_table_name = 'coupons' then
    select jsonb_build_object('name', name, 'grade', grade) into reward from rewards where id = rec ->> 'reward_id';
  end if;

  perform net.http_post(
    url := cfg ->> 'push_url',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-hook-secret', cfg ->> 'push_hook_secret'),
    body := jsonb_build_object(
      'table', tg_table_name,
      'type', tg_op,
      'record', rec,
      'old_record', case when tg_op = 'UPDATE' then to_jsonb(old) end,
      'reward', reward,
      'subs', subs,
      'vapid', jsonb_build_object('public', cfg ->> 'vapid_public', 'private', cfg ->> 'vapid_private', 'subject', cfg ->> 'vapid_subject')
    )
  );
  return new;
end $$;

-- 함수 Secrets 에 넣을 값 (HOOK_SECRET)
select value as "HOOK_SECRET 값" from app_config where key = 'push_hook_secret';
