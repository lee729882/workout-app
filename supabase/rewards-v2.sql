-- 상점 보상 v2 (2026-11-24): 30분권 2종 / 2시간권 2종 / 연차 데이트 5% / 소원권 1% / 꽝 26%
-- SQL Editor 에 붙여 넣고 Run. 여러 번 실행해도 같은 결과예요.

insert into rewards (id, name, description, grade, weight, stub, refund) values
  ('miss',     '꽝',              '10P 돌려받기',                       'common', 26, '꽝',       10),
  ('game30',   '게임하기권 30분',  '짧게 한 판',                         'common', 22, '게임 30m', null),
  ('stream30', '방송하기권 30분',  '짧게 방송 30분',                     'common', 22, '방송 30m', null),
  ('game120',  '게임하기권 2시간', '눈치 안 보고 게임 2시간',              'rare',   12, '게임 2h',  null),
  ('stream',   '방송하기권 2시간', '하고 싶은 날 방송 2시간',              'rare',   12, '방송 2h',  null),
  ('date',     '연차 데이트권',    '원하는 날 연차 쓰고 하루 종일 데이트',    'legend',  5, '데이트',   null),
  ('wish',     '소원권',          '관리자가 들어줄 수 있는 소원 하나',       'legend',  1, '소원',     null)
on conflict (id) do update set
  name = excluded.name,
  description = excluded.description,
  grade = excluded.grade,
  weight = excluded.weight,
  stub = excluded.stub,
  refund = excluded.refund,
  active = true;

-- 확인: 합계 100 이면 OK
select grade, id, name, weight, sum(weight) over () as total from rewards where active order by weight desc;
