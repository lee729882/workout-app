-- 오운완 다이어리 · Supabase 스키마
-- Supabase 대시보드 > SQL Editor 에 통째로 붙여 넣고 Run 하면 돼요. (처음 한 번만)

-- ───────────────────────── 테이블 ─────────────────────────

-- 사람: 운동러 1명 + 관리자 1명 (auth.users 와 1:1)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('user', 'admin')),
  nickname text not null
);

-- 날짜별 계획 (다음 단계: 관리자 일정 편집에서 사용)
create table plan_days (
  date date primary key,
  shift text not null,
  kind text not null,
  place text,
  cardio text[],
  note text
);

-- 운동 완료 요청
create table workout_requests (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  memo text not null default '',
  photo_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  comment text,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);
-- 같은 날짜에 대기/승인 요청은 하나만
create unique index one_active_request_per_day on workout_requests (date) where status in ('pending', 'approved');

-- 동작 체크 (운동러가 체크한 동작 번호)
create table day_checks (
  date date primary key,
  items int[] not null default '{}'
);

-- 포인트 내역 (잔액 = amount 합계)
create table point_ledger (
  id uuid primary key default gen_random_uuid(),
  amount int not null,
  reason text not null,
  request_id uuid references workout_requests on delete set null,
  at timestamptz not null default now()
);

-- 상점 보상
create table rewards (
  id text primary key,
  name text not null,
  description text not null default '',
  grade text not null check (grade in ('common', 'rare', 'legend')),
  weight int not null check (weight >= 0),
  stub text not null,
  refund int,
  active boolean not null default true
);

-- 보관함 쿠폰
create table coupons (
  id uuid primary key default gen_random_uuid(),
  reward_id text not null references rewards,
  status text not null default 'owned' check (status in ('owned', 'requested', 'used')),
  want_date date,
  at timestamptz not null default now()
);

-- 숫자 설정
create table settings (
  key text primary key,
  value int not null
);

insert into settings values
  ('box_price', 30),
  ('pity_limit', 10),
  ('pity_count', 0),
  ('points_per_workout', 10),
  ('weekly_goal', 3),
  ('weekly_bonus', 10);

insert into rewards (id, name, description, grade, weight, stub, refund) values
  ('miss',     '꽝',              '10P 돌려받기',                       'common', 26, '꽝',       10),
  ('game30',   '게임하기권 30분',  '짧게 한 판',                         'common', 22, '게임 30m', null),
  ('stream30', '방송하기권 30분',  '짧게 방송 30분',                     'common', 22, '방송 30m', null),
  ('game120',  '게임하기권 2시간', '눈치 안 보고 게임 2시간',              'rare',   12, '게임 2h',  null),
  ('stream',   '방송하기권 2시간', '하고 싶은 날 방송 2시간',              'rare',   12, '방송 2h',  null),
  ('date',     '연차 데이트권',    '원하는 날 연차 쓰고 하루 종일 데이트',    'legend',  5, '데이트',   null),
  ('wish',     '소원권',          '관리자가 들어줄 수 있는 소원 하나',       'legend',  1, '소원',     null);

-- ───────────────────────── 권한 ─────────────────────────
-- profiles 에 등록된 두 사람만 읽을 수 있어요.
-- 포인트가 움직이는 일(승인, 박스 열기, 쿠폰)은 아래 함수로만 할 수 있어요.

create function is_member() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid())
$$;

create function my_role() returns text language sql stable security definer set search_path = public as $$
  select role from profiles where id = auth.uid()
$$;

alter table profiles enable row level security;
alter table plan_days enable row level security;
alter table workout_requests enable row level security;
alter table day_checks enable row level security;
alter table point_ledger enable row level security;
alter table rewards enable row level security;
alter table coupons enable row level security;
alter table settings enable row level security;

create policy "members read" on profiles for select using (is_member());
create policy "members read" on plan_days for select using (is_member());
create policy "admin writes" on plan_days for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "members read" on workout_requests for select using (is_member());
create policy "user asks" on workout_requests for insert
  with check (my_role() = 'user' and status = 'pending' and comment is null and reviewed_at is null);
create policy "members read" on day_checks for select using (is_member());
create policy "user checks" on day_checks for insert with check (my_role() = 'user');
create policy "user rechecks" on day_checks for update using (my_role() = 'user');
create policy "members read" on point_ledger for select using (is_member());
create policy "admin grants" on point_ledger for insert with check (my_role() = 'admin' and request_id is null);
create policy "members read" on rewards for select using (is_member());
create policy "admin edits" on rewards for all using (my_role() = 'admin') with check (my_role() = 'admin');
create policy "members read" on coupons for select using (is_member());
create policy "members read" on settings for select using (is_member());

-- ───────────────────────── 함수 ─────────────────────────

-- 관리자: 운동 승인/반려
create function review_request(req_id uuid, approve boolean, note text default '')
returns void language plpgsql security definer set search_path = public as $$
declare
  q workout_requests;
  wk date;
  n int;
begin
  if my_role() is distinct from 'admin' then raise exception '관리자만 할 수 있어요'; end if;
  select * into q from workout_requests where id = req_id for update;
  if q.id is null or q.status <> 'pending' then raise exception '이미 처리된 요청이에요'; end if;

  update workout_requests
     set status = case when approve then 'approved' else 'rejected' end,
         comment = nullif(trim(note), ''),
         reviewed_at = now()
   where id = req_id;

  if approve then
    insert into point_ledger (amount, reason, request_id)
    values ((select value from settings where key = 'points_per_workout'),
            '운동 완료 ' || to_char(q.date, 'FMMM/FMDD'), req_id);

    wk := q.date - extract(dow from q.date)::int;  -- 그 주 일요일
    select count(distinct date) into n from workout_requests
     where status = 'approved' and date between wk and wk + 6;
    if n = (select value from settings where key = 'weekly_goal') then
      insert into point_ledger (amount, reason)
      values ((select value from settings where key = 'weekly_bonus'),
              '주 ' || n || '회 달성 보너스');
    end if;
  end if;
end $$;

-- 운동러: 랜덤박스 열기 → 나온 보상을 돌려줘요
create function open_box()
returns rewards language plpgsql security definer set search_path = public as $$
declare
  price int;
  lim int;
  cnt int;
  bal int;
  guaranteed boolean;
  total int;
  x double precision;
  r rewards;
begin
  if my_role() is distinct from 'user' then raise exception '운동러만 열 수 있어요'; end if;
  perform pg_advisory_xact_lock(7298821);  -- 동시에 두 번 열리지 않게

  select value into price from settings where key = 'box_price';
  select value into lim from settings where key = 'pity_limit';
  select value into cnt from settings where key = 'pity_count';
  select coalesce(sum(amount), 0) into bal from point_ledger;
  if bal < price then raise exception '포인트가 모자라요'; end if;

  guaranteed := cnt + 1 >= lim;
  select sum(weight) into total from rewards where active and (not guaranteed or grade <> 'common');
  x := random() * total;
  for r in select * from rewards where active and (not guaranteed or grade <> 'common') order by weight desc, id loop
    x := x - r.weight;
    exit when x < 0;
  end loop;

  insert into point_ledger (amount, reason) values (-price, '랜덤박스 열기');
  if r.refund is not null then
    insert into point_ledger (amount, reason) values (r.refund, '꽝! 포인트 돌려받기');
  else
    insert into coupons (reward_id) values (r.id);
  end if;
  update settings set value = case when r.grade = 'common' then cnt + 1 else 0 end where key = 'pity_count';
  return r;
end $$;

-- 운동러: 쿠폰 쓰고 싶다고 요청
create function request_coupon(coupon_id uuid, want date)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'user' then raise exception '운동러만 할 수 있어요'; end if;
  update coupons set status = 'requested', want_date = want where id = coupon_id and status = 'owned';
  if not found then raise exception '쓸 수 없는 쿠폰이에요'; end if;
end $$;

-- 관리자: 쿠폰 사용 수락/보류
create function resolve_coupon(coupon_id uuid, accept boolean)
returns void language plpgsql security definer set search_path = public as $$
begin
  if my_role() is distinct from 'admin' then raise exception '관리자만 할 수 있어요'; end if;
  update coupons
     set status = case when accept then 'used' else 'owned' end,
         want_date = case when accept then want_date else null end
   where id = coupon_id and status = 'requested';
  if not found then raise exception '이미 처리된 쿠폰이에요'; end if;
end $$;

-- 로그인한 사람만 API로 접근 (어떤 행을 볼 수 있는지는 위 RLS가 정해요)
-- 프로젝트 만들 때 "새 테이블에 자동으로 API 액세스 허용"을 꺼도 동작하게 직접 열어줘요.
grant usage on schema public to authenticated;
grant select on all tables in schema public to authenticated;
grant insert on workout_requests, point_ledger to authenticated;
grant insert, update on day_checks to authenticated;
grant insert, update, delete on plan_days, rewards to authenticated;
revoke all on all tables in schema public from anon;
revoke execute on function review_request, open_box, request_coupon, resolve_coupon from anon, public;
grant execute on function review_request, open_box, request_coupon, resolve_coupon, is_member, my_role to authenticated;

-- ───────────────────────── 실시간 · 사진 ─────────────────────────

alter publication supabase_realtime add table workout_requests, point_ledger, coupons, settings, day_checks;

insert into storage.buckets (id, name, public) values ('proofs', 'proofs', false) on conflict do nothing;
create policy "members read proofs" on storage.objects for select using (bucket_id = 'proofs' and public.is_member());
create policy "user uploads proofs" on storage.objects for insert with check (bucket_id = 'proofs' and public.my_role() = 'user');
