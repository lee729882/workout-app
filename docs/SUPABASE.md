# Supabase 연결하기 (처음 한 번, 약 10분)

## 1. 프로젝트 만들기
1. https://supabase.com 에 가입하고 **New project**를 눌러요.
2. 이름은 `workout-app`, 지역은 **Northeast Asia (Seoul)**, 플랜은 Free.
3. Database password는 아무거나 길게 만들고 따로 적어둬요. (앱에서는 안 써요)

## 2. 테이블 만들기
1. 왼쪽 메뉴 **SQL Editor** → **New query**
2. 이 저장소의 `supabase/schema.sql` 내용을 통째로 붙여 넣고 **Run**
3. "Success. No rows returned"가 나오면 성공

## 3. 회원가입 막기 (중요)
**Authentication → Sign In / Providers → Email**에서
- **Allow new users to sign up**: 끄기
- **Confirm email**: 끄기

이걸 꺼야 다른 사람이 마음대로 가입할 수 없어요.

## 4. 계정 두 개 만들기
**Authentication → Users → Add user → Create new user**를 두 번 해요.

| 누구 | Email (예시) | Password | Auto Confirm User |
|---|---|---|---|
| 운동러 | `pig@owoon.app` | 숫자 6자리 | 체크 |
| 관리자 | `god@owoon.app` | 숫자 6자리 | 체크 |

- 이메일은 진짜 메일 주소가 아니어도 돼요. 앱 안에 그대로 들어가니 개인 메일은 쓰지 않는 걸 추천해요.
- 비밀번호 6자리가 앱 로그인 화면의 숫자예요.

그다음 SQL Editor에서 `supabase/accounts.sql`을 실행해요. (이메일을 바꿨다면 파일 안 이메일도 같이 바꾸기) 마지막 줄 결과에 두 줄이 나오면 성공이에요.

## 5. 앱에 키 넣기
**Project Settings → API**에서 두 값을 복사해요.
- Project URL
- `anon` `public` key

`C:\KMJ\.env` 파일을 만들고(`.env.example` 복사) 값을 채워요.

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_USER_EMAIL=pig@owoon.app
VITE_ADMIN_EMAIL=god@owoon.app
```

`anon` 키는 앱에 들어가도 되는 공개용 키예요. **`service_role` 키는 절대 넣지 마세요.**

`npm run dev`를 다시 켜면 로그인 화면 아래 문구가 "계정은 관리자가 만들어 줘요"로 바뀌어요. 그러면 클라우드 모드예요.

## 무엇이 어디에 저장되나요
| 테이블 | 내용 |
|---|---|
| `workout_requests` | 완료 요청 (사진은 Storage `proofs` 버킷) |
| `point_ledger` | 포인트 내역. 잔액은 합계 |
| `coupons` | 쿠폰함 |
| `rewards` | 상점 보상과 확률 (여기서 숫자를 바꾸면 바로 반영) |
| `settings` | 박스 가격, 천장, 승인 포인트, 주간 보너스 |
| `day_checks` | 동작 체크 |

포인트가 움직이는 일(승인, 박스 열기, 쿠폰)은 DB 함수로만 할 수 있어서 앱을 조작해도 포인트를 마음대로 늘릴 수 없어요.
