// Supabase 모드: 두 휴대폰이 같은 데이터를 실시간으로 봐요.
import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { REWARD_BY_ID, type Grade, type Reward } from '../data/rewards'
import { ACCOUNT_EMAIL, supabase } from './supabase'
import { EMPTY, type Backend, type Coupon, type CouponStatus, type Data, type LedgerEntry, type ReqStatus, type Role, type WorkoutRequest } from './types'

interface ReqRow { id: string; date: string; memo: string; photo_path: string | null; status: ReqStatus; comment: string | null; created_at: string }
interface CouponRow { id: string; reward_id: string; status: CouponStatus; want_date: string | null; at: string }
interface CheckRow { date: string; items: number[] }
interface RewardRow { id: string; name: string; description: string; grade: Grade; weight: number; stub: string; refund: number | null }

function fail(e: unknown): never {
  const msg = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String((e as { message: unknown }).message) : '알 수 없는 오류'
  window.alert(`앗, 실패했어요: ${msg}`)
  throw e
}

export function useCloudBackend(): Backend {
  const sb = supabase!
  const [session, setSession] = useState<Session | null>(null)
  const [authChecked, setAuthChecked] = useState(false)
  const [role, setRole] = useState<Role | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [data, setData] = useState<Data>(EMPTY)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setAuthChecked(true)
    })
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [sb])

  const reload = useCallback(async () => {
    if (!session) return
    const [profile, reqs, ledger, coupons, pity, checks] = await Promise.all([
      sb.from('profiles').select('role').eq('id', session.user.id).maybeSingle(),
      sb.from('workout_requests').select('*').order('created_at'),
      sb.from('point_ledger').select('id, amount, reason, at').order('at'),
      sb.from('coupons').select('*').order('at'),
      sb.from('settings').select('value').eq('key', 'pity_count').maybeSingle(),
      sb.from('day_checks').select('*'),
    ])
    const err = [profile, reqs, ledger, coupons, pity, checks].find((r) => r.error)?.error
    if (err) {
      console.error(err)
      return
    }
    if (!profile.data) {
      window.alert('이 계정은 아직 프로필이 없어요. supabase/accounts.sql 을 실행했는지 확인해 주세요.')
      await sb.auth.signOut()
      return
    }
    setRole(profile.data.role as Role)

    const reqRows = (reqs.data ?? []) as ReqRow[]
    const paths = reqRows.map((r) => r.photo_path).filter((p): p is string => !!p)
    const signed = new Map<string, string>()
    if (paths.length) {
      const { data: urls } = await sb.storage.from('proofs').createSignedUrls(paths, 60 * 60)
      urls?.forEach((u) => u.path && u.signedUrl && signed.set(u.path, u.signedUrl))
    }

    setData({
      requests: reqRows.map<WorkoutRequest>((r) => ({
        id: r.id,
        date: r.date,
        memo: r.memo,
        photo: r.photo_path ? signed.get(r.photo_path) : undefined,
        status: r.status,
        createdAt: r.created_at,
        comment: r.comment ?? undefined,
      })),
      ledger: (ledger.data ?? []) as LedgerEntry[],
      coupons: ((coupons.data ?? []) as CouponRow[]).map<Coupon>((c) => ({
        id: c.id,
        rewardId: c.reward_id,
        status: c.status,
        wantDate: c.want_date ?? undefined,
        at: c.at,
      })),
      pity: (pity.data?.value as number | undefined) ?? 0,
      checks: Object.fromEntries(((checks.data ?? []) as CheckRow[]).map((c) => [c.date, c.items])),
    })
  }, [sb, session])

  // 로그인하면 불러오고, 누가 뭘 바꾸면 다시 불러와요
  useEffect(() => {
    if (!session) {
      setRole(null)
      setData(EMPTY)
      setLoaded(false)
      return
    }
    reload().finally(() => setLoaded(true))
    const later = () => {
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(reload, 300)
    }
    const ch = sb
      .channel('all-changes')
      .on('postgres_changes', { event: '*', schema: 'public' }, later)
      .subscribe()
    const onFocus = () => document.visibilityState === 'visible' && reload()
    document.addEventListener('visibilitychange', onFocus)
    return () => {
      sb.removeChannel(ch)
      document.removeEventListener('visibilitychange', onFocus)
    }
  }, [sb, session, reload])

  const ready = authChecked && (!session || loaded)

  const rpc = async (fn: string, args?: Record<string, unknown>) => {
    const { data: out, error } = await sb.rpc(fn, args)
    if (error) fail(error)
    await reload()
    return out as unknown
  }

  return {
    ...data,
    mode: 'cloud',
    ready,
    role: session ? role : null,

    signIn: async (r, pin) => {
      const email = ACCOUNT_EMAIL[r]
      if (!email) return '.env 에 계정 이메일이 없어요'
      const { error } = await sb.auth.signInWithPassword({ email, password: pin })
      return error ? '비밀번호가 맞지 않아요' : null
    },
    signOut: async () => {
      await sb.auth.signOut()
    },

    toggleCheck: (date, idx) => {
      const cur = data.checks[date] ?? []
      const items = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx]
      setData((d) => ({ ...d, checks: { ...d.checks, [date]: items } }))
      sb.from('day_checks')
        .upsert({ date, items })
        .then(({ error }) => error && console.error(error))
    },

    submitRequest: async (date, memo, photo) => {
      let photo_path: string | null = null
      if (photo) {
        const blob = await (await fetch(photo)).blob()
        photo_path = `${date}/${crypto.randomUUID()}.jpg`
        const up = await sb.storage.from('proofs').upload(photo_path, blob, { contentType: 'image/jpeg' })
        if (up.error) fail(up.error)
      }
      const { error } = await sb.from('workout_requests').insert({ date, memo, photo_path })
      if (error) fail(error.code === '23505' ? new Error('이 날은 이미 요청했어요') : error)
      await reload()
    },

    review: async (id, approve, comment) => {
      await rpc('review_request', { req_id: id, approve, note: comment })
    },

    openBox: async () => {
      const row = (await rpc('open_box')) as RewardRow | null
      if (!row) return null
      return (
        REWARD_BY_ID[row.id] ?? {
          id: row.id,
          name: row.name,
          desc: row.description,
          grade: row.grade,
          weight: row.weight,
          stub: row.stub,
          refund: row.refund ?? undefined,
        }
      ) satisfies Reward
    },

    requestCoupon: async (id, wantDate) => {
      await rpc('request_coupon', { coupon_id: id, want: wantDate })
    },

    resolveCoupon: async (id, accept) => {
      await rpc('resolve_coupon', { coupon_id: id, accept })
    },

    grant: async (amount, reason) => {
      const { error } = await sb.from('point_ledger').insert({ amount, reason })
      if (error) fail(error)
      await reload()
    },
  }
}
