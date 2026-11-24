export type Grade = 'common' | 'rare' | 'legend'

export interface Reward {
  id: string
  name: string
  desc: string
  grade: Grade
  /** 뽑힐 가중치 (합계 100 = %) */
  weight: number
  /** 쿠폰 왼쪽에 크게 적히는 말 */
  stub: string
  /** 꽝: 쿠폰 대신 포인트를 돌려줌 */
  refund?: number
}

export const BOX_PRICE = 30
/** 이 횟수째에는 레어 이상 확정 */
export const PITY = 10
export const POINTS_PER_WORKOUT = 10
export const WEEKLY_BONUS = 10
export const WEEKLY_GOAL = 3

// Supabase rewards 표와 같은 값이어야 해요 (supabase/rewards-v2.sql)
export const REWARDS: Reward[] = [
  { id: 'miss', name: '꽝', desc: '10P 돌려받기', grade: 'common', weight: 26, stub: '꽝', refund: 10 },
  { id: 'game30', name: '게임하기권 30분', desc: '짧게 한 판', grade: 'common', weight: 22, stub: '게임 30m' },
  { id: 'stream30', name: '방송하기권 30분', desc: '짧게 방송 30분', grade: 'common', weight: 22, stub: '방송 30m' },
  { id: 'game120', name: '게임하기권 2시간', desc: '눈치 안 보고 게임 2시간', grade: 'rare', weight: 12, stub: '게임 2h' },
  { id: 'stream', name: '방송하기권 2시간', desc: '하고 싶은 날 방송 2시간', grade: 'rare', weight: 12, stub: '방송 2h' },
  { id: 'date', name: '연차 데이트권', desc: '원하는 날 연차 쓰고 하루 종일 데이트', grade: 'legend', weight: 5, stub: '데이트' },
  { id: 'wish', name: '소원권', desc: '관리자가 들어줄 수 있는 소원 하나', grade: 'legend', weight: 1, stub: '소원' },
]

export const REWARD_BY_ID: Record<string, Reward> = Object.fromEntries(REWARDS.map((r) => [r.id, r]))

export const GRADE_LABEL: Record<Grade, string> = { common: '일반', rare: '레어', legend: '전설' }
export const GRADE_COLOR: Record<Grade, string> = { common: '#C9D9A6', rare: '#C9C9E8', legend: '#F6D77B' }

export function gradeOdds(grade: Grade) {
  return REWARDS.filter((r) => r.grade === grade).reduce((s, r) => s + r.weight, 0)
}

/** pity = 지금까지 레어 이상 없이 연 횟수 */
export function roll(pity: number, rand = Math.random): Reward {
  const guaranteed = pity + 1 >= PITY
  const pool = guaranteed ? REWARDS.filter((r) => r.grade !== 'common') : REWARDS
  const total = pool.reduce((s, r) => s + r.weight, 0)
  let x = rand() * total
  for (const r of pool) {
    x -= r.weight
    if (x < 0) return r
  }
  return pool[pool.length - 1]
}
