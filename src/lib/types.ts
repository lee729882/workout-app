import { REWARDS, type Reward } from '../data/rewards'

export type Role = 'user' | 'admin'
export type ReqStatus = 'pending' | 'approved' | 'rejected'
export type CouponStatus = 'owned' | 'requested' | 'used'

export interface WorkoutRequest {
  id: string
  date: string
  memo: string
  /** 보여줄 수 있는 사진 주소 (로컬: data URL, Supabase: 1시간짜리 서명 URL) */
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

export interface Data {
  requests: WorkoutRequest[]
  ledger: LedgerEntry[]
  coupons: Coupon[]
  /** 레어 이상 없이 연 횟수 */
  pity: number
  /** 날짜별로 체크한 동작 번호 */
  checks: Record<string, number[]>
  /** 상점 보상과 가중치 */
  rewards: Reward[]
}

export const EMPTY: Data = { requests: [], ledger: [], coupons: [], pity: 0, checks: {}, rewards: REWARDS }

/** 로컬 저장소와 Supabase 저장소가 똑같이 지키는 모양 */
export interface Backend extends Data {
  mode: 'local' | 'cloud'
  /** 처음 불러오기가 끝났는지 */
  ready: boolean
  role: Role | null
  /** 실패하면 사람에게 보여줄 문장을 돌려줘요 */
  signIn: (role: Role, pin: string) => Promise<string | null>
  signOut: () => Promise<void>
  toggleCheck: (date: string, idx: number) => void
  submitRequest: (date: string, memo: string, photo?: string) => Promise<void>
  review: (id: string, approve: boolean, comment: string) => Promise<void>
  openBox: () => Promise<Reward | null>
  requestCoupon: (id: string, wantDate: string) => Promise<void>
  resolveCoupon: (id: string, accept: boolean) => Promise<void>
  grant: (amount: number, reason: string) => Promise<void>
  /** 관리자: 대기/반려 요청 지우기 */
  deleteRequest: (id: string) => Promise<void>
  /** 관리자: 보상별 가중치 저장 */
  saveWeights: (weights: Record<string, number>) => Promise<void>
}

export const PIN_LENGTH = 6
