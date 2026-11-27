// 앱 데이터 저장소. .env 에 Supabase 정보가 있으면 클라우드, 없으면 이 기기에만 저장해요.
import { createContext, useContext, useMemo, type ReactNode } from 'react'
import { REWARD_BY_ID } from '../data/rewards'
import { useCloudBackend } from './cloudBackend'
import { useLocalBackend } from './localBackend'
import { CLOUD } from './supabase'
import { buildSchedule } from './schedule'
import type { Backend, Coupon } from './types'

// eslint-disable-next-line react-refresh/only-export-components
export * from './types'

// 앱이 켜져 있는 동안 CLOUD 값은 바뀌지 않으니 훅 순서가 항상 같아요.
const useBackend = CLOUD ? useCloudBackend : useLocalBackend

function useStoreValue() {
  const b = useBackend()
  const balance = useMemo(() => b.ledger.reduce((s, e) => s + e.amount, 0), [b.ledger])
  const schedule = useMemo(() => buildSchedule(b.moves), [b.moves])
  return {
    ...b,
    ...schedule,
    balance,
    requestFor: (date: string) => [...b.requests].reverse().find((r) => r.date === date),
    rewardOf: (c: Coupon) => b.rewards.find((r) => r.id === c.rewardId) ?? REWARD_BY_ID[c.rewardId],
  }
}

type Store = Backend & ReturnType<typeof useStoreValue>
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

/** 사진을 긴 변 기준으로 줄여서 용량을 아껴요 */
// eslint-disable-next-line react-refresh/only-export-components
export function shrinkPhoto(file: File, max = 1200): Promise<string> {
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
