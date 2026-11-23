const pad = (n: number) => String(n).padStart(2, '0')

export const toKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

export const fromKey = (key: string) => {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 오늘 날짜. 테스트할 때는 주소 뒤에 ?today=2026-12-16 을 붙이면 그 날로 보여요. */
export function todayKey(): string {
  const q = new URLSearchParams(window.location.search).get('today')
  if (q && /^\d{4}-\d{2}-\d{2}$/.test(q)) return q
  return toKey(new Date())
}

const DOW = ['일', '월', '화', '수', '목', '금', '토']

export const dow = (key: string) => DOW[fromKey(key).getDay()]

export const longLabel = (key: string) => {
  const d = fromKey(key)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 ${DOW[d.getDay()]}요일`
}

export const shortLabel = (key: string) => {
  const d = fromKey(key)
  return `${d.getMonth() + 1}/${d.getDate()} (${DOW[d.getDay()]})`
}

/** 그 주의 일요일 */
export const weekStart = (key: string) => {
  const d = fromKey(key)
  d.setDate(d.getDate() - d.getDay())
  return toKey(d)
}

export const timeLabel = (iso: string) => {
  const d = new Date(iso)
  const h = d.getHours()
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${pad(d.getMinutes())}`
}
