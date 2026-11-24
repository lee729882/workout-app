// Supabase Edge Function "push": DB 트리거가 보낸 내용을 보고 상대방 휴대폰으로 알림을 보내요.
// - 대시보드 > Edge Functions > push > Code 에 이 파일을 통째로 붙여 넣고 Deploy
// - Edge Functions > Secrets 에 HOOK_SECRET 추가 (값: supabase/push-v2.sql 실행 결과)
// - Verify JWT 는 꺼둬요 (DB가 부르는 함수라 로그인 토큰이 없어요)
// DB를 직접 읽지 않아요. 받을 사람 목록과 키는 트리거가 같이 보내줘요.
import webpush from 'npm:web-push@3.6.7'

type Role = 'user' | 'admin'
interface Sub {
  endpoint: string
  p256dh: string
  auth: string
}
interface Msg {
  to: Role
  title: string
  body: string
  tag: string
}
interface Hook {
  table: string
  type: 'INSERT' | 'UPDATE'
  // deno-lint-ignore no-explicit-any
  record: any
  // deno-lint-ignore no-explicit-any
  old_record: any
  reward: { name: string; grade: string } | null
  subs: Record<Role, Sub[]>
  vapid: { public: string; private: string; subject: string }
}

const md = (d: string) => {
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

/** 받침이 있으면 '을', 없으면 '를' */
const eulReul = (w: string) => {
  const c = w.charCodeAt(w.length - 1)
  return c >= 0xac00 && c <= 0xd7a3 && (c - 0xac00) % 28 !== 0 ? '을' : '를'
}

const KIND: Record<string, string> = {
  upper: '상체',
  lower: '하체',
  cardio: '유산소',
  treadmill: '런닝머신',
  upperWalk: '상체+걷기',
  lowerWalk: '하체+걷기',
}

function messageFor({ table, type, record: rec, old_record: old, reward }: Hook): Msg | null {
  // 운동하는 날 밤 12시 알림 (daily_reminder 가 보내요)
  if (table === 'reminder') {
    const place = rec.place === 'parents' ? '본가' : '집'
    const detail = rec.reps ? `${rec.reps}회 × 3세트 · ${place} · 약 30분` : (rec.cardio?.[0] ?? `${place} · 30분`)
    return {
      to: 'user',
      title: `🏋️ 오늘은 ${KIND[rec.kind] ?? '운동'} 데이!`,
      body: rec.note ? `${detail}\n📌 ${rec.note}` : detail,
      tag: `reminder-${rec.date}`,
    }
  }

  if (table === 'workout_requests') {
    if (type === 'INSERT') {
      return {
        to: 'admin',
        title: '💪 운동 완료 요청이 왔어요',
        body: `${md(rec.date)} 운동 다 했대요${rec.memo ? ` — "${rec.memo}"` : ''}`,
        tag: `req-${rec.id}`,
      }
    }
    if (type === 'UPDATE' && old?.status === 'pending' && rec.status === 'approved') {
      return { to: 'user', title: '✅ 승인! +10P', body: rec.comment ? `관리자: ${rec.comment}` : `${md(rec.date)} 운동 도장 쾅!`, tag: `req-${rec.id}` }
    }
    if (type === 'UPDATE' && old?.status === 'pending' && rec.status === 'rejected') {
      return { to: 'user', title: '🙏 다시 해볼까요?', body: rec.comment ? `관리자: ${rec.comment}` : `${md(rec.date)} 요청이 반려됐어요`, tag: `req-${rec.id}` }
    }
  }

  if (table === 'coupons') {
    const name = reward?.name ?? '쿠폰'
    if (type === 'INSERT' && reward?.grade === 'legend') {
      return { to: 'admin', title: '🌟 전설 등장!', body: `운동러가 ${name}${eulReul(name)} 뽑았어요`, tag: `coupon-${rec.id}` }
    }
    if (type === 'UPDATE' && old?.status === 'owned' && rec.status === 'requested') {
      return { to: 'admin', title: '🎟️ 쿠폰 쓰고 싶대요', body: `${name}${rec.want_date ? ` · ${md(rec.want_date)}` : ''}`, tag: `coupon-${rec.id}` }
    }
    if (type === 'UPDATE' && old?.status === 'requested' && rec.status === 'used') {
      return { to: 'user', title: '🎉 쿠폰 수락!', body: `${name}${old.want_date ? ` · ${md(old.want_date)}` : ''} 확정`, tag: `coupon-${rec.id}` }
    }
    if (type === 'UPDATE' && old?.status === 'requested' && rec.status === 'owned') {
      return { to: 'user', title: '⏳ 쿠폰은 다음에', body: `${name} 요청이 보류됐어요. 쿠폰은 그대로 있어요`, tag: `coupon-${rec.id}` }
    }
  }

  if (table === 'point_ledger' && type === 'INSERT') {
    // 승인·박스·주간 보너스는 따로 알림이 가니, 관리자가 직접 준 포인트만
    const auto = /^(운동 완료|주 \d+회|랜덤박스|꽝)/.test(rec.reason)
    if (!auto && rec.amount !== 0) {
      return { to: 'user', title: rec.amount > 0 ? `🎁 보너스 +${rec.amount}P` : `포인트 ${rec.amount}P`, body: rec.reason, tag: `ledger-${rec.id}` }
    }
  }
  return null
}

Deno.serve(async (req) => {
  const secret = Deno.env.get('HOOK_SECRET')
  if (!secret) return new Response('HOOK_SECRET 이 설정되지 않았어요', { status: 500 })
  if (req.headers.get('x-hook-secret') !== secret) return new Response('forbidden', { status: 403 })

  const hook = (await req.json()) as Hook
  if (hook.table === 'ping') return new Response('pong')

  const msg = messageFor(hook)
  if (!msg) return new Response('skip')

  webpush.setVapidDetails(hook.vapid.subject, hook.vapid.public, hook.vapid.private)
  const payload = JSON.stringify({ title: msg.title, body: msg.body, tag: msg.tag, url: '/' })

  const results = await Promise.all(
    (hook.subs?.[msg.to] ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 })
        return 'ok'
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        console.error('push failed', code, String(e))
        return `fail ${code}`
      }
    }),
  )
  return new Response(JSON.stringify({ to: msg.to, results }), { headers: { 'Content-Type': 'application/json' } })
})
