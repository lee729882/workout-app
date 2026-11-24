-- 두 계정을 만든 뒤(대시보드 > Authentication > Users > Add user) 실행하세요.
-- 아래 이메일 두 개를 Add user 할 때 넣은 이메일로 바꿔요. (.env 의 VITE_USER_EMAIL / VITE_ADMIN_EMAIL 과 같아야 해요)

insert into profiles (id, role, nickname)
select id, 'user', '운동러' from auth.users where email = 'pig@owoon.app';

insert into profiles (id, role, nickname)
select id, 'admin', '관리자' from auth.users where email = 'god@owoon.app';

-- 확인: 두 줄이 나오면 성공
select p.role, p.nickname, u.email from profiles p join auth.users u on u.id = p.id;
