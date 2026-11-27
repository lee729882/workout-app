// 계획 + 옮긴 기록 → "그날 실제로 하는 운동"
// 규칙(서버 move_workout 과 같아요): 같은 주(일~토) 안, 오늘 이후로, 하루에 운동 하나, 완료 요청 전까지만
import { PLAN_BY_DATE, isWorkout, type DayPlan } from '../data/plan'
import { fromKey, toKey, weekStart } from './date'

export interface WorkoutMove {
  from: string
  to: string
}

const HOME_CARDIO = PLAN_BY_DATE['2026-11-24']?.cardio ?? ['유산소 30분 이상 (유튜브 홈트 또는 밖에서 뛰다 걷기)']

const addDays = (key: string, n: number) => {
  const d = fromKey(key)
  d.setDate(d.getDate() + n)
  return toKey(d)
}

export const weekDays = (key: string) => {
  const start = weekStart(key)
  return Array.from({ length: 7 }, (_, i) => addDays(start, i))
}

/** 옮긴 운동을 그날 사정(근무, 본가 여부)에 맞게 바꿔요 */
function adapt(origin: DayPlan, target: DayPlan | undefined, date: string): DayPlan {
  const base: DayPlan = { ...origin, date, origin: origin.date, shift: target?.shift ?? origin.shift, movedTo: undefined }
  const atParents = target?.place === 'parents'
  if (origin.place !== 'parents' || atParents) return base
  // 본가 운동을 본가가 아닌 날로 옮기면 집에서 할 수 있는 걸로
  if (origin.kind === 'treadmill') return { ...base, kind: 'cardio', place: 'home', cardio: HOME_CARDIO, note: '본가가 아닌 날이라 집에서 유산소로 바꿨어요' }
  if (origin.kind === 'upperWalk') return { ...base, kind: 'upper', place: 'home', cardio: undefined, note: '본가가 아닌 날이라 근력만 해요 (밖에서 20분 걸으면 더 좋아요)' }
  if (origin.kind === 'lowerWalk') return { ...base, kind: 'lower', place: 'home', cardio: undefined, note: '본가가 아닌 날이라 근력만 해요 (밖에서 20분 걸으면 더 좋아요)' }
  return { ...base, place: 'home' }
}

export function buildSchedule(moves: WorkoutMove[]) {
  const toFrom = new Map(moves.map((m) => [m.to, m.from]))
  const fromTo = new Map(moves.map((m) => [m.from, m.to]))

  /** 그날 실제 계획. 옮겨 간 날은 쉬는 날(movedTo 표시), 옮겨 온 날은 그 운동 */
  const planOn = (date: string): DayPlan | undefined => {
    const base = PLAN_BY_DATE[date]
    const from = toFrom.get(date)
    if (from && PLAN_BY_DATE[from]) return adapt(PLAN_BY_DATE[from], base, date)
    if (base && isWorkout(base.kind) && fromTo.has(date)) {
      return { ...base, kind: 'rest', movedKind: base.kind, movedTo: fromTo.get(date), cardio: undefined, note: undefined }
    }
    return base
  }

  const hasWorkout = (date: string) => {
    const p = planOn(date)
    return !!p && isWorkout(p.kind)
  }

  /** after 다음 날부터 가장 가까운 운동일 */
  const nextWorkout = (after: string) => {
    for (let i = 1; i <= 62; i++) {
      const p = planOn(addDays(after, i))
      if (p && isWorkout(p.kind)) return p
    }
    return undefined
  }

  /**
   * plan(지금 보이는 운동)을 target 날로 옮길 수 있는지. 못 옮기면 이유를 돌려줘요.
   * target 이 원래 날짜면 되돌리기라서 날짜 제한이 없어요.
   */
  const whyNot = (plan: DayPlan, target: string, today: string): string | null => {
    const origin = plan.origin ?? plan.date
    if (target === plan.date) return '지금 날짜'
    if (target === origin) return null
    if (weekStart(target) !== weekStart(origin)) return '다른 주'
    if (target < today) return '지난 날'
    if (hasWorkout(target)) return '운동 있음'
    return null
  }

  return { planOn, hasWorkout, nextWorkout, whyNot }
}

export type Schedule = ReturnType<typeof buildSchedule>
