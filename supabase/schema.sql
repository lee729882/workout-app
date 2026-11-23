-- 오운완 다이어리 · Supabase 스키마 (초안)
-- 다음 단계에서 Supabase 프로젝트의 SQL Editor에 붙여 넣어 실행해요.

-- 사람: 운동러 1명 + 관리자 1명. auth.users 와 1:1
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null check (role in ('user', 'admin')),
  nickname text not null,
  avatar_url text
);

-- 날짜별 계획 (관리자가 매달 입력)
create table plan_days (
  date date primary key,
  shift text not null,             -- E N D O m V
  kind text not null,              -- rest recovery upper lower cardio treadmill upperWalk lowerWalk
  place text,                      -- home parents
  reps int,                        -- 근력 횟수 (10/11/12)
  cardio text[],                   -- 런닝머신/유산소 방법
  note text
);

-- 운동 완료 요청
create table workout_requests (
  id uuid primary key default gen_random_uuid(),
  date date not null references plan_days,
  memo text not null default '',
  photo_path text,                 -- storage 버킷 'proofs' 안의 경로
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  comment text,                    -- 관리자 한마디
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

-- 포인트 내역 (잔액 = amount 합계)
create table point_ledger (
  id uuid primary key default gen_random_uuid(),
  amount int not null,
  reason text not null,
  request_id uuid references workout_requests,
  at timestamptz not null default now()
);

-- 상점 보상 (관리자가 확률 수정)
create table rewards (
  id text primary key,
  name text not null,
  description text not null default '',
  grade text not null check (grade in ('common', 'rare', 'legend')),
  weight int not null,
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

-- 상점 설정 (천장 카운터 등)
create table settings (
  key text primary key,
  value jsonb not null
);
insert into settings values ('box_price', '30'), ('pity_limit', '10'), ('pity_count', '0');

insert into rewards (id, name, description, grade, weight, stub, refund) values
  ('game30',  '게임하기권 30분',  '짧게 한 판',                          'common', 45, '게임 30m', null),
  ('miss',    '꽝',              '10P 돌려받기',                        'common', 15, '꽝',       10),
  ('stream',  '방송하기권',       '하고 싶은 날 방송 한 번',               'rare',   15, '방송',     null),
  ('game120', '게임하기권 2시간', '눈치 안 보고 게임 2시간',               'rare',   15, '게임 2h',  null),
  ('date',    '연차 데이트권',    '원하는 날 연차 쓰고 하루 종일 데이트',     'legend', 10, '데이트',   null);

-- 보안: 두 사람만 읽고, 승인·포인트 지급은 관리자만.
-- (박스 열기와 승인은 포인트를 건드리므로 나중에 DB 함수(rpc)로 만들어서 조작을 막아요.)
alter table profiles enable row level security;
alter table plan_days enable row level security;
alter table workout_requests enable row level security;
alter table point_ledger enable row level security;
alter table rewards enable row level security;
alter table coupons enable row level security;
alter table settings enable row level security;

create function is_admin() returns boolean language sql stable as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

create policy "members read" on profiles for select using (auth.uid() is not null);
create policy "members read" on plan_days for select using (auth.uid() is not null);
create policy "admin writes" on plan_days for all using (is_admin()) with check (is_admin());
create policy "members read" on workout_requests for select using (auth.uid() is not null);
create policy "user creates" on workout_requests for insert with check (auth.uid() is not null and status = 'pending');
create policy "admin reviews" on workout_requests for update using (is_admin());
create policy "members read" on point_ledger for select using (auth.uid() is not null);
create policy "admin grants" on point_ledger for insert with check (is_admin());
create policy "members read" on rewards for select using (auth.uid() is not null);
create policy "admin edits" on rewards for all using (is_admin()) with check (is_admin());
create policy "members read" on coupons for select using (auth.uid() is not null);
create policy "members read" on settings for select using (auth.uid() is not null);
