-- 업데이트 v3 (2026-11-24): 운동 계획을 DB에 넣기 + 밤 12시 알림 + 요청 삭제 + 상점 가중치
-- SQL Editor 에 통째로 붙여 넣고 Run. 여러 번 실행해도 괜찮아요.

-- 운동 계획 (자동 생성: node scripts/make-plan-sql.mjs)
alter table plan_days add column if not exists reps int;

insert into plan_days (date, shift, kind, place, reps, cardio, note) values
  ('2026-11-23', 'E', 'rest', null, null, null, null),
  ('2026-11-24', 'O', 'cardio', 'home', null, array['① 유튜브 ''30분 유산소 홈트'' 따라 하기', '② 밖에서 뛰다 걷기: 걷기 5분 → 뛰기 2분(8분 30초~9분 페이스) + 걷기 2분 × 5 → 걷기 5분'], '첫 운동! 15분만 하고 멈춰도 성공'),
  ('2026-11-25', 'N', 'upper', 'home', 10, null, null),
  ('2026-11-26', 'N', 'rest', null, null, null, null),
  ('2026-11-27', 'O', 'recovery', null, null, null, '나이트 회복'),
  ('2026-11-28', 'E', 'lower', 'home', 10, null, null),
  ('2026-11-29', 'E', 'rest', null, null, null, null),
  ('2026-11-30', 'O', 'treadmill', 'parents', null, array['걷기 5.0~5.5 · 경사 2% · 30분'], null),
  ('2026-12-01', 'O', 'upperWalk', 'parents', 10, array['걷기 5.0~5.5 · 경사 2~3% · 20분'], null),
  ('2026-12-02', 'N', 'rest', null, null, null, null),
  ('2026-12-03', 'N', 'rest', null, null, null, null),
  ('2026-12-04', 'O', 'recovery', 'parents', null, null, '나이트 회복'),
  ('2026-12-05', 'O', 'lowerWalk', 'parents', 10, array['걷기 5.5 · 경사 3% · 20분'], null),
  ('2026-12-06', 'D', 'rest', null, null, null, null),
  ('2026-12-07', 'E', 'upper', 'home', 10, null, null),
  ('2026-12-08', 'E', 'rest', null, null, null, null),
  ('2026-12-09', 'O', 'lower', 'home', 10, null, null),
  ('2026-12-10', 'N', 'rest', null, null, null, null),
  ('2026-12-11', 'N', 'rest', null, null, null, null),
  ('2026-12-12', 'O', 'recovery', 'parents', null, null, '나이트 회복'),
  ('2026-12-13', 'O', 'treadmill', 'parents', null, array['걷기 5.5 · 경사 3% · 30분 중 1분 살짝 뛰기(6.0~6.5) × 3번'], '처음으로 살짝 뛰어보는 날. 본가에 못 가면 집에서 유산소 30분(유튜브 또는 밖에서 뛰다 걷기)'),
  ('2026-12-14', 'D', 'rest', null, null, null, '이번 주부터 근력은 11회'),
  ('2026-12-15', 'D', 'rest', null, null, null, null),
  ('2026-12-16', 'E', 'upper', 'home', 11, null, null),
  ('2026-12-17', 'N', 'lower', 'home', 11, null, null),
  ('2026-12-18', 'N', 'rest', null, null, null, null),
  ('2026-12-19', 'm', 'recovery', 'parents', null, null, 'm 근무: 나이트 다음 날이라 쉬는 날로 잡음'),
  ('2026-12-20', 'V', 'treadmill', 'parents', null, array['걷기 5.5 · 30분 중 1분 살짝 뛰기 × 3번'], '본가에 못 가면 집에서 유산소 30분으로 대신'),
  ('2026-12-21', 'D', 'rest', null, null, null, null),
  ('2026-12-22', 'E', 'lower', 'home', 11, null, null),
  ('2026-12-23', 'E', 'rest', null, null, null, null),
  ('2026-12-24', 'V', 'upperWalk', 'parents', 12, array['걷기 5.5 · 1분 뛰기 × 2번 (선택) · 20분'], '오늘부터 근력은 12회'),
  ('2026-12-25', 'V', 'treadmill', 'parents', null, array['걷기 5.5 · 30분 중 1분 살짝 뛰기 × 5번'], '메리 크리스마스'),
  ('2026-12-26', 'E', 'rest', null, null, null, null),
  ('2026-12-27', 'E', 'rest', null, null, null, null),
  ('2026-12-28', 'O', 'lowerWalk', 'parents', 12, array['걷기 5.5 · 1분 뛰기 × 2번 · 20분'], null),
  ('2026-12-29', 'O', 'treadmill', 'parents', null, array['걷기 5.5 · 30분 중 1분 살짝 뛰기 × 5번'], null),
  ('2026-12-30', 'D', 'rest', null, null, null, null),
  ('2026-12-31', 'N', 'upper', 'home', 12, null, '올해 마지막 운동! 캘린더 체크 개수 세어보기')
on conflict (date) do update set
  shift = excluded.shift, kind = excluded.kind, place = excluded.place,
  reps = excluded.reps, cardio = excluded.cardio, note = excluded.note;

-- ───── 상점 가중치 (실제 확률 = 숫자 ÷ 합계) ─────
update rewards set weight = 50 where id = 'miss';
update rewards set weight = 25 where id in ('game30', 'stream30');
update rewards set weight = 15 where id in ('game120', 'stream');
update rewards set weight = 5 where id = 'date';
update rewards set weight = 1 where id = 'wish';

-- 상점 설정이 바뀌면 두 휴대폰에 바로 반영
do $$ begin
  alter publication supabase_realtime add table rewards;
exception when duplicate_object then null; end $$;

-- ───── 관리자가 요청 삭제 (승인된 건 포인트가 엮여 있어서 제외) ─────
grant delete on workout_requests to authenticated;
drop policy if exists "admin deletes" on workout_requests;
create policy "admin deletes" on workout_requests for delete
  using (my_role() = 'admin' and status <> 'approved');

-- ───── 운동하는 날 밤 12시(한국시간) 알림 ─────
create extension if not exists pg_cron;

create or replace function daily_reminder() returns void
language plpgsql security definer set search_path = public as $$
declare
  cfg jsonb := (select jsonb_object_agg(key, value) from app_config);
  d plan_days;
  subs jsonb;
begin
  select * into d from plan_days where date = (now() at time zone 'Asia/Seoul')::date;
  if d.date is null or d.kind in ('rest', 'recovery') or cfg ->> 'push_url' is null then return; end if;

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
      'record', to_jsonb(d),
      'subs', jsonb_build_object('user', subs, 'admin', '[]'::jsonb),
      'vapid', jsonb_build_object('public', cfg ->> 'vapid_public', 'private', cfg ->> 'vapid_private', 'subject', cfg ->> 'vapid_subject')
    )
  );
end $$;
revoke execute on function daily_reminder() from anon, authenticated, public;

-- 매일 15:00 UTC = 한국 00:00
do $$ begin
  perform cron.unschedule('daily-reminder');
exception when others then null; end $$;
select cron.schedule('daily-reminder', '0 15 * * *', 'select public.daily_reminder()');

-- 확인
select jobname, schedule from cron.job where jobname = 'daily-reminder';
