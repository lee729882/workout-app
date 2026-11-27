// 12월 운동 캘린더 (2026.11.23 ~ 12.31) — PDF를 그대로 옮긴 데이터

export type Shift = 'E' | 'N' | 'D' | 'O' | 'm' | 'V'
export type Kind = 'rest' | 'recovery' | 'upper' | 'lower' | 'cardio' | 'treadmill' | 'upperWalk' | 'lowerWalk'
export type Place = 'home' | 'parents'

export interface DayPlan {
  date: string // YYYY-MM-DD
  shift: Shift
  kind: Kind
  place?: Place
  /** 런닝머신/유산소 방법 */
  cardio?: string[]
  /** 📌 메모 */
  note?: string
  /** 다른 날에서 옮겨 온 운동이면 원래 계획 날짜 (횟수는 이 날짜 기준) */
  origin?: string
  /** 이 날 운동을 다른 날로 옮겼으면 그 날짜 */
  movedTo?: string
  /** 옮겨 간 운동의 종류 (캘린더 표시용) */
  movedKind?: Kind
}

const d = (date: string, shift: Shift, kind: Kind, extra: Partial<DayPlan> = {}): DayPlan => ({
  date: `2026-${date}`,
  shift,
  kind,
  ...extra,
})

export const PLAN: DayPlan[] = [
  d('11-23', 'E', 'rest'),
  d('11-24', 'O', 'cardio', {
    place: 'home',
    cardio: [
      "① 유튜브 '30분 유산소 홈트' 따라 하기",
      '② 밖에서 뛰다 걷기: 걷기 5분 → 뛰기 2분(8분 30초~9분 페이스) + 걷기 2분 × 5 → 걷기 5분',
    ],
    note: '첫 운동! 15분만 하고 멈춰도 성공',
  }),
  d('11-25', 'N', 'upper', { place: 'home' }),
  d('11-26', 'N', 'rest'),
  d('11-27', 'O', 'recovery', { note: '나이트 회복' }),
  d('11-28', 'E', 'lower', { place: 'home' }),
  d('11-29', 'E', 'rest'),
  d('11-30', 'O', 'treadmill', { place: 'parents', cardio: ['걷기 5.0~5.5 · 경사 2% · 30분'] }),
  d('12-01', 'O', 'upperWalk', { place: 'parents', cardio: ['걷기 5.0~5.5 · 경사 2~3% · 20분'] }),
  d('12-02', 'N', 'rest'),
  d('12-03', 'N', 'rest'),
  d('12-04', 'O', 'recovery', { place: 'parents', note: '나이트 회복' }),
  d('12-05', 'O', 'lowerWalk', { place: 'parents', cardio: ['걷기 5.5 · 경사 3% · 20분'] }),
  d('12-06', 'D', 'rest'),
  d('12-07', 'E', 'upper', { place: 'home' }),
  d('12-08', 'E', 'rest'),
  d('12-09', 'O', 'lower', { place: 'home' }),
  d('12-10', 'N', 'rest'),
  d('12-11', 'N', 'rest'),
  d('12-12', 'O', 'recovery', { place: 'parents', note: '나이트 회복' }),
  d('12-13', 'O', 'treadmill', {
    place: 'parents',
    cardio: ['걷기 5.5 · 경사 3% · 30분 중 1분 살짝 뛰기(6.0~6.5) × 3번'],
    note: '처음으로 살짝 뛰어보는 날. 본가에 못 가면 집에서 유산소 30분(유튜브 또는 밖에서 뛰다 걷기)',
  }),
  d('12-14', 'D', 'rest', { note: '이번 주부터 근력은 11회' }),
  d('12-15', 'D', 'rest'),
  d('12-16', 'E', 'upper', { place: 'home' }),
  d('12-17', 'N', 'lower', { place: 'home' }),
  d('12-18', 'N', 'rest'),
  d('12-19', 'm', 'recovery', { place: 'parents', note: 'm 근무: 나이트 다음 날이라 쉬는 날로 잡음' }),
  d('12-20', 'V', 'treadmill', {
    place: 'parents',
    cardio: ['걷기 5.5 · 30분 중 1분 살짝 뛰기 × 3번'],
    note: '본가에 못 가면 집에서 유산소 30분으로 대신',
  }),
  d('12-21', 'D', 'rest'),
  d('12-22', 'E', 'lower', { place: 'home' }),
  d('12-23', 'E', 'rest'),
  d('12-24', 'V', 'upperWalk', {
    place: 'parents',
    cardio: ['걷기 5.5 · 1분 뛰기 × 2번 (선택) · 20분'],
    note: '오늘부터 근력은 12회',
  }),
  d('12-25', 'V', 'treadmill', { place: 'parents', cardio: ['걷기 5.5 · 30분 중 1분 살짝 뛰기 × 5번'], note: '메리 크리스마스' }),
  d('12-26', 'E', 'rest'),
  d('12-27', 'E', 'rest'),
  d('12-28', 'O', 'lowerWalk', { place: 'parents', cardio: ['걷기 5.5 · 1분 뛰기 × 2번 · 20분'] }),
  d('12-29', 'O', 'treadmill', { place: 'parents', cardio: ['걷기 5.5 · 30분 중 1분 살짝 뛰기 × 5번'] }),
  d('12-30', 'D', 'rest'),
  d('12-31', 'N', 'upper', { place: 'home', note: '올해 마지막 운동! 캘린더 체크 개수 세어보기' }),
]

export const PLAN_BY_DATE: Record<string, DayPlan> = Object.fromEntries(PLAN.map((p) => [p.date, p]))

export const isWorkout = (k: Kind) => k !== 'rest' && k !== 'recovery'

export const KIND_LABEL: Record<Kind, string> = {
  rest: '쉬는 날',
  recovery: '회복',
  upper: '상체',
  lower: '하체',
  cardio: '유산소',
  treadmill: '런닝머신',
  upperWalk: '상체+걷기',
  lowerWalk: '하체+걷기',
}

export const KIND_SHORT: Record<Kind, string> = {
  rest: '',
  recovery: '회복',
  upper: '상체',
  lower: '하체',
  cardio: '유산소',
  treadmill: '런닝',
  upperWalk: '근력걷기',
  lowerWalk: '근력걷기',
}

export const SHIFT_COLOR: Record<Shift, string> = {
  E: '#EFB1B5',
  N: '#CFC6CF',
  O: '#C9D9A6',
  D: '#C9C9E8',
  m: '#9FB0D6',
  V: '#DDB3F2',
}
