// Supabase Edge Function "push": DB에 변화가 생기면 상대방 휴대폰으로 알림을 보내요.
// 대시보드 > Edge Functions > Deploy a new function > Via Editor 에 이 파일을 통째로 붙여 넣고,
// 이름은 push, "Verify JWT"는 끄고 배포해요. (요청은 DB 트리거만 보내고, 비밀 헤더로 확인해요)
import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.57.4'

type Role = 'user' | 'admin'
interface Msg {
  to: Role
  title: string
  body: string
  tag: string
  url?: string
}

const sb = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  { auth: { persistSession: false } },
)

const md = (d: string) => {
  const [, m, day] = d.split('-')
  return `${Number(m)}/${Number(day)}`
}

async function config() {
  const { data } = await sb.from('app_config').select('key, value')
  return Object.fromEntries((data ?? []).map((r) => [r.key, r.value])) as Record<string, string>
}

async function rewardName(id: string) {
  const { data } = await sb.from('rewards').select('name, grade').eq('id', id).maybeSingle()
  return data as { name: string; grade: string } | null
}

// deno-lint-ignore no-explicit-any
async function messageFor(table: string, type: string, rec: any, old: any): Promise<Msg | null> {
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
      return {
        to: 'user',
        title: '✅ 승인! +10P',
        body: rec.comment ? `관리자: ${rec.comment}` : `${md(rec.date)} 운동 도장 쾅!`,
        tag: `req-${rec.id}`,
      }
    }
    if (type === 'UPDATE' && old?.status === 'pending' && rec.status === 'rejected') {
      return {
        to: 'user',
        title: '🙏 다시 해볼까요?',
        body: rec.comment ? `관리자: ${rec.comment}` : `${md(rec.date)} 요청이 반려됐어요`,
        tag: `req-${rec.id}`,
      }
    }
  }

  if (table === 'coupons') {
    const r = await rewardName(rec.reward_id)
    const name = r?.name ?? '쿠폰'
    if (type === 'INSERT' && r?.grade === 'legend') {
      const last = name.charCodeAt(name.length - 1)
      const josa = last >= 0xac00 && last <= 0xd7a3 && (last - 0xac00) % 28 !== 0 ? '을' : '를'
      return { to: 'admin', title: '🌟 전설 등장!', body: `운동러가 ${name}${josa} 뽑았어요`, tag: `coupon-${rec.id}` }
    }
    if (type === 'UPDATE' && old?.status === 'owned' && rec.status === 'requested') {
      return {
        to: 'admin',
        title: '🎟️ 쿠폰 쓰고 싶대요',
        body: `${name}${rec.want_date ? ` · ${md(rec.want_date)}` : ''}`,
        tag: `coupon-${rec.id}`,
      }
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
      return {
        to: 'user',
        title: rec.amount > 0 ? `🎁 보너스 +${rec.amount}P` : `포인트 ${rec.amount}P`,
        body: rec.reason,
        tag: `ledger-${rec.id}`,
      }
    }
  }
  return null
}

Deno.serve(async (req) => {
  const cfg = await config()
  if (!cfg.push_hook_secret || req.headers.get('x-hook-secret') !== cfg.push_hook_secret) {
    return new Response('forbidden', { status: 403 })
  }

  const { table, type, record, old_record } = await req.json()
  const msg = await messageFor(table, type, record, old_record)
  if (!msg) return new Response('skip')

  webpush.setVapidDetails(cfg.vapid_subject, cfg.vapid_public, cfg.vapid_private)

  const { data: people } = await sb.from('profiles').select('id').eq('role', msg.to)
  const ids = (people ?? []).map((p) => p.id)
  if (!ids.length) return new Response('no target')
  const { data: subs } = await sb.from('push_subscriptions').select('*').in('user_id', ids)

  const payload = JSON.stringify({ title: msg.title, body: msg.body, tag: msg.tag, url: msg.url ?? '/' })
  let sent = 0
  await Promise.all(
    (subs ?? []).map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, payload, { TTL: 60 * 60 * 24 })
        sent++
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode
        // 앱을 지웠거나 알림을 끈 휴대폰은 목록에서 빼요
        if (code === 404 || code === 410) await sb.from('push_subscriptions').delete().eq('id', s.id)
        else console.error('push failed', code, e)
      }
    }),
  )
  return new Response(JSON.stringify({ sent }), { headers: { 'Content-Type': 'application/json' } })
})
