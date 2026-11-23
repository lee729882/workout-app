// 앱 데이터 저장소.
// 지금은 이 기기의 localStorage에 저장하는 "임시 모드"예요.
// 다음 단계에서 같은 함수들을 Supabase로 바꾸면 두 휴대폰이 같은 데이터를 보게 돼요.
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { BOX_PRICE, POINTS_PER_WORKOUT, REWARD_BY_ID, WEEKLY_BONUS, WEEKLY_GOAL, roll, type Reward } from '../data/rewards'
import { shortLabel, weekStart } from './date'

export type Role = 'user' | 'admin'
export type ReqStatus = 'pending' | 'approved' | 'rejected'
export type CouponStatus = 'owned' | 'requested' | 'used'

export interface WorkoutRequest {
  id: string
  date: string
  memo: string
  photo?: string
  status: ReqStatus
  createdAt: string
  comment?: string
}

export interface LedgerEntry {
  id: string
  amount: number
  reason: string
  at: string
}

export interface Coupon {
  id: string
  rewardId: string
  status: CouponStatus
  wantDate?: string
  at: string
}

interface Data {
  requests: WorkoutRequest[]
  ledger: LedgerEntry[]
  coupons: Coupon[]
  /** 레어 이상 없이 연 횟수 */
  pity: number
  /** 날짜별로 체크한 동작 번호 */
  checks: Record<string, number[]>
}

const EMPTY: Data = { requests: [], ledger: [], coupons: [], pity: 0, checks: {} }
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

function useStoreValue() {
  const [data, setData] = useState<Data>(() => ({ ...EMPTY, ...load<Partial<Data>>(DATA_KEY, {}) }))
  const [role, setRoleState] = useState<Role | null>(() => load<Role | null>(ROLE_KEY, null))

  useEffect(() => {
    try {
      localStorage.setItem(DATA_KEY, JSON.stringify(data))
    } catch {
      /* 저장 공간이 꽉 찬 경우 등은 무시 */
    }
  }, [data])

  const setRole = useCallback((r: Role | null) => {
    setRoleState(r)
    try {
      if (r) localStorage.setItem(ROLE_KEY, JSON.stringify(r))
      else localStorage.removeItem(ROLE_KEY)
    } catch {
      /* noop */
    }
  }, [])

  const balance = useMemo(() => data.ledger.reduce((s, e) => s + e.amount, 0), [data.ledger])

  const requestFor = useCallback(
    (date: string) => [...data.requests].reverse().find((r) => r.date === date),
    [data.requests],
  )

  const toggleCheck = (date: string, idx: number) =>
    setData((d) => {
      const cur = d.checks[date] ?? []
      const next = cur.includes(idx) ? cur.filter((i) => i !== idx) : [...cur, idx]
      return { ...d, checks: { ...d.checks, [date]: next } }
    })

  const submitRequest = (date: string, memo: string, photo?: string) =>
    setData((d) => ({
      ...d,
      requests: [...d.requests, { id: uid(), date, memo, photo, status: 'pending', createdAt: now() }],
    }))

  const review = (id: string, approve: boolean, comment: string) =>
    setData((d) => {
      const req = d.requests.find((r) => r.id === id)
      if (!req || req.status !== 'pending') return d
      const requests = d.requests.map((r) =>
        r.id === id ? { ...r, status: (approve ? 'approved' : 'rejected') as ReqStatus, comment } : r,
      )
      if (!approve) return { ...d, requests }
      const ledger = [...d.ledger, { id: uid(), amount: POINTS_PER_WORKOUT, reason: `운동 완료 ${shortLabel(req.date)}`, at: now() }]
      const wk = weekStart(req.date)
      const doneThisWeek = requests.filter((r) => r.status === 'approved' && weekStart(r.date) === wk).length
      if (doneThisWeek === WEEKLY_GOAL) {
        ledger.push({ id: uid(), amount: WEEKLY_BONUS, reason: `주 ${WEEKLY_GOAL}회 달성 보너스`, at: now() })
      }
      return { ...d, requests, ledger }
    })

  /** 박스를 열고 나온 보상을 돌려줘요. 포인트가 모자라면 null */
  const openBox = (): Reward | null => {
    if (balance < BOX_PRICE) return null
    const reward = roll(data.pity)
    setData((d) => {
      const ledger = [...d.ledger, { id: uid(), amount: -BOX_PRICE, reason: '랜덤박스 열기', at: now() }]
      const coupons = [...d.coupons]
      if (reward.refund) ledger.push({ id: uid(), amount: reward.refund, reason: '꽝! 포인트 돌려받기', at: now() })
      else coupons.push({ id: uid(), rewardId: reward.id, status: 'owned', at: now() })
      return { ...d, ledger, coupons, pity: reward.grade === 'common' ? d.pity + 1 : 0 }
    })
    return reward
  }

  const requestCoupon = (id: string, wantDate: string) =>
    setData((d) => ({ ...d, coupons: d.coupons.map((c) => (c.id === id ? { ...c, status: 'requested', wantDate } : c)) }))

  const resolveCoupon = (id: string, accept: boolean) =>
    setData((d) => ({
      ...d,
      coupons: d.coupons.map((c) => (c.id === id ? { ...c, status: accept ? 'used' : 'owned', wantDate: accept ? c.wantDate : undefined } : c)),
    }))

  const grant = (amount: number, reason: string) =>
    setData((d) => ({ ...d, ledger: [...d.ledger, { id: uid(), amount, reason, at: now() }] }))

  return {
    ...data,
    role,
    setRole,
    balance,
    requestFor,
    toggleCheck,
    submitRequest,
    review,
    openBox,
    requestCoupon,
    resolveCoupon,
    grant,
    rewardOf: (c: Coupon) => REWARD_BY_ID[c.rewardId],
  }
}

type Store = ReturnType<typeof useStoreValue>
const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const value = useStoreValue()
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const s = useContext(Ctx)
  if (!s) throw new Error('StoreProvider 안에서만 쓸 수 있어요')
  return s
}

/** 사진을 짧은 변 기준으로 줄여서 저장 공간을 아껴요 */
// eslint-disable-next-line react-refresh/only-export-components
export function shrinkPhoto(file: File, max = 900): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height))
      const c = document.createElement('canvas')
      c.width = Math.round(img.width * scale)
      c.height = Math.round(img.height * scale)
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
      URL.revokeObjectURL(img.src)
      resolve(c.toDataURL('image/jpeg', 0.8))
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}
