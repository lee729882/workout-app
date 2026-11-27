import type { DayPlan } from './plan'

export interface Move {
  name: string
  weight: string
  tip: string
  /** 유튜브 검색어 */
  video: string
  bothSides?: boolean
}

export const UPPER: Move[] = [
  { name: '아령 숄더 프레스', weight: '1kg', tip: '서서 아령을 귀 옆에 두고 머리 위로 밀어 올린 뒤 천천히 내리기. 배에 힘을 줘서 허리가 젖혀지지 않게.', video: '덤벨 숄더프레스 자세 초보' },
  { name: '아령 로우', weight: '2kg', tip: '무릎을 살짝 굽히고 엉덩이를 뒤로 빼서 상체를 45도 숙이기. 등을 편 채 아령을 배꼽 쪽으로 당기며 날개뼈 모으기.', video: '덤벨 벤트오버 로우 자세 초보' },
  { name: '아령 컬', weight: '2kg', tip: '팔꿈치를 옆구리에 붙이고 반동 없이 들어 올린 뒤 3초 동안 천천히 내리기.', video: '덤벨 컬 자세 초보' },
  { name: '머리 위로 팔 펴기', weight: '2kg 1개', tip: '아령 하나를 두 손으로 잡고 머리 위로. 팔꿈치는 귀 옆에 고정하고 머리 뒤로 내렸다 펴기. 의자에 앉아서 해도 OK.', video: '덤벨 오버헤드 트라이셉스 익스텐션 자세' },
  { name: '킥백', weight: '1kg', tip: '상체를 숙이고 팔꿈치를 옆구리 높이에 고정. 팔만 뒤로 쭉 펴고 1초 멈췄다 돌아오기.', video: '덤벨 킥백 자세 초보', bothSides: true },
]

export const LOWER: Move[] = [
  { name: '스쿼트', weight: '맨몸', tip: '발은 어깨너비, 발끝은 살짝 바깥. 의자에 앉듯 엉덩이를 뒤로 빼고, 무릎은 발끝 방향으로. 무게는 뒤꿈치에.', video: '맨몸 스쿼트 자세 초보 여자' },
  { name: '글루트 브릿지', weight: '맨몸', tip: '누워서 무릎 세우기. 뒤꿈치로 바닥을 밀어 엉덩이를 올리고, 위에서 1초 조이기. 허리를 과하게 꺾지 않기.', video: '글루트 브릿지 자세' },
  { name: '뒤로 런지', weight: '맨몸', tip: '한 발을 뒤로 크게 빼고 양 무릎이 90도가 될 때까지 내려갔다가 앞발로 밀고 돌아오기. 의자나 벽을 잡아도 OK.', video: '리버스 런지 자세 초보', bothSides: true },
  { name: '버드독', weight: '맨몸', tip: '네발 자세에서 반대쪽 팔과 다리를 쭉 뻗고 2초 버티기. 허리가 흔들리지 않게 천천히.', video: '버드독 운동 자세', bothSides: true },
]

// 근력만 하는 날(집)에 더하는 동작. 걷기와 같이 하는 날은 이미 40분이라 더하지 않아요.
// 체크는 동작 순서(번호)로 저장되니, 새 동작은 항상 맨 뒤에 붙여요.
export const UPPER_EXTRA: Move[] = [
  { name: '무릎 대고 푸쉬업', weight: '맨몸', tip: '무릎을 매트에 대고 손은 어깨보다 살짝 넓게. 머리부터 무릎까지 일직선을 유지하며 가슴을 내렸다 밀기. 힘들면 벽에 손을 대고 해도 OK.', video: '무릎 푸쉬업 자세 초보 여자' },
  { name: '사이드 레터럴 레이즈', weight: '1kg', tip: '팔꿈치를 살짝 굽히고 아령을 옆으로 어깨 높이까지만 들기. 어깨가 으쓱 올라가지 않게, 천천히 내리기.', video: '덤벨 사이드 레터럴 레이즈 자세 초보' },
]

export const LOWER_EXTRA: Move[] = [
  { name: '스모 스쿼트', weight: '맨몸', tip: '발을 어깨보다 넓게, 발끝은 바깥으로. 상체를 세운 채 무릎을 발끝 방향으로 벌리며 앉았다 일어나기.', video: '스모 스쿼트 자세 초보' },
  { name: '옆으로 누워 다리 들기', weight: '맨몸', tip: '옆으로 누워 골반을 세우고, 위쪽 다리를 천천히 들었다 내리기. 발끝은 정면, 몸이 뒤로 넘어가지 않게.', video: '사이드 레그레이즈 자세 초보', bothSides: true },
]

/** 이 날짜부터 동작을 늘려요 (그 전 기록은 그대로) */
export const EXTRA_FROM = '2026-11-26'

/** 기간별 횟수: 11/25~12/13 10회, 12/14~12/23 11회, 12/24~ 12회 */
export function repsFor(date: string): number {
  if (date <= '2026-12-13') return 10
  if (date <= '2026-12-23') return 11
  return 12
}

/** 옮긴 운동도 원래 계획 날짜 기준으로 횟수를 정해요 */
export const repsOf = (plan: DayPlan) => repsFor(plan.origin ?? plan.date)

export function movesFor(plan: DayPlan): Move[] {
  const more = (plan.origin ?? plan.date) >= EXTRA_FROM
  if (plan.kind === 'upper') return more ? [...UPPER, ...UPPER_EXTRA] : UPPER
  if (plan.kind === 'lower') return more ? [...LOWER, ...LOWER_EXTRA] : LOWER
  if (plan.kind === 'upperWalk') return UPPER
  if (plan.kind === 'lowerWalk') return LOWER
  return []
}

export const videoUrl = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`

export const TIP = '"이게 끝이야?" 싶을 만큼만! 땀이 살짝 나면 충분해요.'
