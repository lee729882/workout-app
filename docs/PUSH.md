# 푸시 알림 켜기 (처음 한 번, 약 5분)

## 어떤 알림이 오나요
| 언제 | 누구에게 | 알림 |
|---|---|---|
| 운동 완료 요청 | 관리자 | 💪 운동 완료 요청이 왔어요 |
| 승인 / 반려 | 운동러 | ✅ 승인! +10P / 🙏 다시 해볼까요? (관리자 한마디 포함) |
| 쿠폰 사용 요청 | 관리자 | 🎟️ 쿠폰 쓰고 싶대요 · 날짜 |
| 쿠폰 수락 / 보류 | 운동러 | 🎉 쿠폰 수락! / ⏳ 쿠폰은 다음에 |
| 전설 쿠폰 뽑음 | 관리자 | 🌟 전설 등장! |
| 관리자가 직접 준 포인트 | 운동러 | 🎁 보너스 +NP |

## 1. SQL 실행
SQL Editor에 `supabase/push-setup.secret.sql` 내용을 통째로 붙여 넣고 Run.
- 이 파일에는 알림용 비밀키가 들어 있어서 **GitHub에 안 올라가요.** 이 컴퓨터(`C:\KMJ\supabase`)에만 있어요.
- 마지막 결과에 `push_url`, `vapid_private` 등 5줄이 나오면 성공.

## 2. 알림 보내는 함수 배포
1. 왼쪽 메뉴 **Edge Functions** → **Deploy a new function** → **Via Editor**
2. 함수 이름: `push`
3. 기본 코드를 지우고 `supabase/functions/push/index.ts` 내용을 통째로 붙여 넣기
4. **Deploy function**
5. 배포된 `push` 함수 → **Details**(또는 Settings)에서 **Verify JWT / Enforce JWT verification** 을 **끄고** 저장
   - DB가 직접 부르는 함수라 로그인 토큰이 없어요. 대신 비밀 헤더로 확인해요.

## 3. Vercel에 공개키 넣기
Vercel → 프로젝트 → **Settings → Environment Variables** → Add
- Key: `VITE_VAPID_PUBLIC_KEY`
- Value: `C:\KMJ\.env` 맨 아래 `VITE_VAPID_PUBLIC_KEY=` 뒤의 값
- 저장 후 **Deployments → 최신 배포 ⋯ → Redeploy** (또는 다음 push 때 자동 반영)

## 4. 휴대폰에서 켜기
- **아이폰**: 반드시 **홈 화면 아이콘**으로 연 앱에서 → 오늘(관리자는 승인) 화면의 **🔔 알림 켜기 → 켜기 → 허용**
- **안드로이드**: 크롬이든 설치한 앱이든 → **켜기 → 허용**

두 사람 다 각자 켜야 해요. 켜지면 카드가 사라져요.

## 안 올 때
- Edge Functions → push → **Logs**에 `forbidden`이 보이면: 1번 SQL을 다시 실행
- `push failed`가 보이면: 로그 내용을 캡처해서 보내주세요
- 휴대폰 설정에서 오운완 알림이 꺼져 있지 않은지 확인
