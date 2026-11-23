import { useMemo, useState } from 'react'
import { KIND_SHORT, PLAN, PLAN_BY_DATE, SHIFT_COLOR, isWorkout } from '../data/plan'
import { fromKey, longLabel, toKey, todayKey } from '../lib/date'
import { useStore } from '../lib/store'
import { DayCard, DayHeaderChips, RequestBar } from '../components/DayDetail'

const MONTHS = [
  { y: 2026, m: 11 },
  { y: 2026, m: 12 },
]

export default function Calendar() {
  const { requestFor } = useStore()
  const today = todayKey()
  const [mi, setMi] = useState(() => (today.startsWith('2026-11') ? 0 : 1))
  const [sel, setSel] = useState<string | null>(null)
  const { y, m } = MONTHS[mi]

  const cells = useMemo(() => {
    const first = new Date(y, m - 1, 1)
    const start = new Date(first)
    start.setDate(1 - first.getDay())
    const out: { key: string; inMonth: boolean }[] = []
    for (let i = 0; i < 42; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      out.push({ key: toKey(d), inMonth: d.getMonth() === m - 1 })
    }
    // 마지막 줄이 통째로 다음 달이면 빼기
    return out.slice(0, out[35].inMonth ? 42 : 35)
  }, [y, m])

  const monthPlans = PLAN.filter((p) => p.date.startsWith(`${y}-${String(m).padStart(2, '0')}`) && isWorkout(p.kind))
  const stamped = monthPlans.filter((p) => requestFor(p.date)?.status === 'approved').length
  const selPlan = sel ? PLAN_BY_DATE[sel] : undefined

  return (
    <main className="screen" style={{ paddingLeft: 14, paddingRight: 14, gap: 12 }}>
      <div className="between" style={{ alignItems: 'flex-end', padding: '0 6px' }}>
        <div>
          <div className="muted small">{y}</div>
          <div className="row" style={{ gap: 4 }}>
            <button aria-label="이전 달" disabled={mi === 0} onClick={() => setMi(mi - 1)} style={navBtn}>‹</button>
            <h1 className="title" style={{ fontSize: 46 }}>{m}월</h1>
            <button aria-label="다음 달" disabled={mi === MONTHS.length - 1} onClick={() => setMi(mi + 1)} style={navBtn}>›</button>
          </div>
        </div>
        <div className="muted small" style={{ textAlign: 'right' }}>
          완료 도장
          <div><span className="hand" style={{ fontSize: 30, color: 'var(--stamp)' }}>{stamped}</span> / {monthPlans.length}</div>
        </div>
      </div>

      <div className="cal-head">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <span key={d} style={i === 0 ? { color: 'var(--stamp)' } : undefined}>{d}</span>
        ))}
      </div>
      <div className="cal">
        {cells.map(({ key, inMonth }) => {
          const p = PLAN_BY_DATE[key]
          const req = requestFor(key)
          const work = p && isWorkout(p.kind)
          const cls = ['cell', work && 'work', !inMonth && 'out', key === today && 'today', key === sel && 'sel'].filter(Boolean).join(' ')
          const day = fromKey(key)
          return (
            <button key={key} className={cls} disabled={!p} onClick={() => setSel(key)} aria-label={p ? longLabel(key) : undefined}>
              <span className="num" style={day.getDay() === 0 ? { color: 'var(--stamp)' } : undefined}>{day.getDate()}</span>
              {p && <span className="shift" style={{ background: SHIFT_COLOR[p.shift] }}>{p.shift}</span>}
              {p && <span className={`lab${work ? '' : ' rest'}`}>{KIND_SHORT[p.kind]}</span>}
              {req?.status === 'approved' && <span className="stamp">완료</span>}
              {req?.status === 'pending' && <span className="wait">확인 중</span>}
            </button>
          )
        })}
      </div>

      <div className="row muted" style={{ flexWrap: 'wrap', gap: 6, fontSize: 11, padding: '0 4px' }}>
        <span className="chip" style={{ background: 'var(--workday)', boxShadow: 'none', fontSize: 11 }}>운동하는 날</span>
        {(['E', 'N', 'O', 'D', 'V', 'm'] as const).map((s) => (
          <span key={s} className="chip solid" style={{ background: SHIFT_COLOR[s], fontSize: 11 }}>{s}</span>
        ))}
        <span style={{ marginLeft: 'auto' }}>날짜를 누르면 자세히 보여요</span>
      </div>

      {selPlan && (
        <div className="sheet-bg" onClick={() => setSel(null)}>
          <div className="sheet" role="dialog" aria-modal="true" aria-label={longLabel(selPlan.date)} onClick={(e) => e.stopPropagation()}>
            <div className="between">
              <h2 className="hand" style={{ fontSize: 28, margin: 0 }}>{longLabel(selPlan.date)}</h2>
              <button className="btn sm ghost" onClick={() => setSel(null)}>닫기</button>
            </div>
            <DayHeaderChips plan={selPlan} />
            <DayCard plan={selPlan} />
            {selPlan.note && <div className="note">📌 {selPlan.note}</div>}
            <RequestBar plan={selPlan} today={today} />
          </div>
        </div>
      )}
    </main>
  )
}

const navBtn = { background: 'none', border: 0, fontSize: 28, color: 'var(--brown)', width: 36, height: 44 } as const
