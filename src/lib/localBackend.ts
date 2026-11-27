// 임시 모드: 이 기기의 localStorage 에만 저장해요. (.env 가 없을 때)
import { useCallback, useEffect, useMemo, useState } from 'react'
import { BOX_PRICE, POINTS_PER_WORKOUT, WEEKLY_BONUS, WEEKLY_GOAL, roll } from '../data/rewards'
import { shortLabel, todayKey, weekStart } from './date'
import { buildSchedule } from './schedule'
import { EMPTY, PIN_LENGTH, type Backend, type Data, type ReqStatus, type Role } from './types'

const DATA_KEY = 'oww.data.v1'
const ROLE_KEY = 'oww.role'

const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
const now = () => new Date().toISOString()

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function save(key: string, value: unknown) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* 저장 공간이 꽉 찬 경우 등은 무시 */
  }
}

export function useLocalBackend(): Backend {
  const [data, setData] = useState<Data>(() => {
    const saved = load<Partial<Data>>(DATA_KEY, {})
    // 예전에 저장된 보상 목록은 쓰지 않고 가중치만 이어받아요
    const w = Object.fromEntries((saved.rewards ?? []).map((r) => [r.id, r.weight]))
    return { ...EMPTY, ...saved, rewards: EMPTY.rewards.map((r) => ({ ...r, weight: w[r.id] ?? r.weight })) }
  })
  const [role, setRole] = useState<Role | null>(() => load<Role | null>(ROLE_KEY, null))

  useEffect(() => save(DATA_KEY, data), [data])
  useEffect(() => save(ROLE_KEY, role), [role])

  const balance = useMemo(() => data.ledger.reduce((s, e) => s + e.amount, 0), [data.ledger])

  const signIn = useCallback(async (r: Role, pin: string) => {
    if (pin.length !== PIN_LENGTH) return `비밀번호 ${PIN_LENGTH}자리를 넣어주세요`
    setRole(r)
    return null
  }, [])

  return {
    ...data,
    mode: 'local',
    ready: true,
    role,
    signIn,
    signOut: async () => setRole(null),

    toggleCheck: (date, idx) =>
      setData((d) => {
        const cur = d.checks[date] ?? []
        const next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx]
        return { ...d, checks: { ...d.checks, [date]: next } }
      }),

    submitRequest: async (date, memo, photo) =>
      setData((d) => ({ ...d, requests: [...d.requests, { id: uid(), date, memo, photo, status: 'pending', createdAt: now() }] })),

    review: async (id, approve, comment) =>
      setData((d) => {
        const req = d.requests.find((r) => r.id === id)
        if (!req || req.status !== 'pending') return d
        const requests = d.requests.map((r) =>
          r.id === id ? { ...r, status: (approve ? 'approved' : 'rejected') as ReqStatus, comment: comment || undefined } : r,
        )
        if (!approve) return { ...d, requests }
        const ledger = [...d.ledger, { id: uid(), amount: POINTS_PER_WORKOUT, reason: `운동 완료 ${shortLabel(req.date)}`, at: now() }]
        const wk = weekStart(req.date)
        const days = new Set(requests.filter((r) => r.status === 'approved' && weekStart(r.date) === wk).map((r) => r.date))
        if (days.size === WEEKLY_GOAL) ledger.push({ id: uid(), amount: WEEKLY_BONUS, reason: `주 ${WEEKLY_GOAL}회 달성 보너스`, at: now() })
        return { ...d, requests, ledger }
      }),

    openBox: async () => {
      if (balance < BOX_PRICE) return null
      const reward = roll(data.pity, data.rewards)
      setData((d) => {
        const ledger = [...d.ledger, { id: uid(), amount: -BOX_PRICE, reason: '랜덤박스 열기', at: now() }]
        const coupons = [...d.coupons]
        if (reward.refund) ledger.push({ id: uid(), amount: reward.refund, reason: '꽝! 포인트 돌려받기', at: now() })
        else coupons.push({ id: uid(), rewardId: reward.id, status: 'owned', at: now() })
        return { ...d, ledger, coupons, pity: reward.grade === 'common' ? d.pity + 1 : 0 }
      })
      return reward
    },

    requestCoupon: async (id, wantDate) =>
      setData((d) => ({ ...d, coupons: d.coupons.map((c) => (c.id === id ? { ...c, status: 'requested', wantDate } : c)) })),

    resolveCoupon: async (id, accept) =>
      setData((d) => ({
        ...d,
        coupons: d.coupons.map((c) => (c.id === id ? { ...c, status: accept ? 'used' : 'owned', wantDate: accept ? c.wantDate : undefined } : c)),
      })),

    grant: async (amount, reason) => setData((d) => ({ ...d, ledger: [...d.ledger, { id: uid(), amount, reason, at: now() }] })),

    deleteRequest: async (id) =>
      setData((d) => ({ ...d, requests: d.requests.filter((r) => r.id !== id || r.status === 'approved') })),

    moveWorkout: async (from, to) => {
      const sched = buildSchedule(data.moves)
      const cur = data.moves.find((m) => m.from === from)?.to ?? from
      const plan = sched.planOn(cur)
      const busy = data.requests.some((r) => r.date === cur && (r.status === 'pending' || r.status === 'approved'))
      const why = !plan ? '옮길 운동이 없어요' : busy ? '이미 완료 요청한 운동은 옮길 수 없어요' : sched.whyNot(plan, to, todayKey())
      if (why) {
        window.alert(`앗, 옮길 수 없어요: ${why}`)
        throw new Error(why)
      }
      setData((d) => {
        const rest = d.moves.filter((m) => m.from !== from)
        return { ...d, moves: to === from ? rest : [...rest, { from, to }] }
      })
    },

    cancelCouponRequest: async (id) =>
      setData((d) => ({ ...d, coupons: d.coupons.map((c) => (c.id === id && c.status === 'requested' ? { ...c, status: 'owned', wantDate: undefined } : c)) })),

    deleteCoupon: async (id) => setData((d) => ({ ...d, coupons: d.coupons.filter((c) => c.id !== id) })),

    saveWeights: async (weights) =>
      setData((d) => ({ ...d, rewards: d.rewards.map((r) => ({ ...r, weight: weights[r.id] ?? r.weight })) })),
  }
}
