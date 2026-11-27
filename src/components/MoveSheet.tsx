// 운동 날짜 옮기기: 같은 주 7일 중에서 고르기
import { useState } from 'react'
import { KIND_LABEL, SHIFT_COLOR, PLAN_BY_DATE, type DayPlan } from '../data/plan'
import { dow, fromKey, shortLabel } from '../lib/date'
import { weekDays } from '../lib/schedule'
import { useStore } from '../lib/store'
import { eul } from '../lib/text'
import { IconClose } from './Icons'

export default function MoveSheet({ plan, today, onClose }: { plan: DayPlan; today: string; onClose: () => void }) {
  const { planOn, whyNot, moveWorkout } = useStore()
  const [busy, setBusy] = useState(false)
  const origin = plan.origin ?? plan.date
  const days = weekDays(origin)

  const pick = async (target: string) => {
    const base = PLAN_BY_DATE[target]
    const back = target === origin
    const k = KIND_LABEL[plan.kind]
    const lines = [back ? `${k}${eul(k)} 원래 날짜 ${shortLabel(origin)}로 되돌릴까요?` : `${shortLabel(plan.date)} ${k} → ${shortLabel(target)}로 옮길까요?`]
    if (!back && base?.kind === 'recovery') lines.push('', '⚠️ 나이트 다음 회복하는 날이에요. 몸이 괜찮을 때만 옮겨주세요.')
    if (!back && PLAN_BY_DATE[origin]?.place === 'parents' && base?.place !== 'parents') {
      lines.push('', '본가가 아닌 날이라 집에서 할 수 있는 운동으로 바뀌어요.')
    }
    if (!window.confirm(lines.join('\n'))) return
    setBusy(true)
    try {
      await moveWorkout(origin, target)
      onClose()
    } catch {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="운동 날짜 옮기기" onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <h2 className="hand" style={{ fontSize: 28, margin: 0 }}>날짜 옮기기</h2>
          <button aria-label="닫기" onClick={onClose} style={{ background: 'none', border: 0, padding: 8 }}><IconClose /></button>
        </div>
        <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
          <b>{shortLabel(plan.date)} {KIND_LABEL[plan.kind]}</b>{eul(KIND_LABEL[plan.kind])} 같은 주 안에서 옮겨요. 하루에 운동은 하나만 할 수 있어요.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(0, 1fr))', gap: 4 }}>
          {days.map((d) => {
            const p = planOn(d)
            const why = whyNot(plan, d, today)
            const isCur = d === plan.date
            const back = d === origin && !isCur
            const label = isCur ? '지금' : back ? '원래' : p && why === '운동 있음' ? (p.kind === 'upperWalk' || p.kind === 'lowerWalk' ? '운동' : KIND_LABEL[p.kind].slice(0, 2)) : p?.kind === 'recovery' ? '회복' : ''
            return (
              <button
                key={d}
                disabled={!!why || busy}
                onClick={() => pick(d)}
                aria-label={`${shortLabel(d)}${why ? ` (${why})` : ''}`}
                style={{
                  height: 84,
                  borderRadius: 12,
                  border: 0,
                  padding: '6px 0',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 3,
                  background: isCur ? 'var(--brown)' : why ? 'transparent' : '#fff',
                  color: isCur ? '#fff8ec' : 'var(--ink)',
                  boxShadow: why ? 'none' : back ? 'inset 0 0 0 2px var(--brown)' : '0 6px 14px -8px rgba(59,47,37,.5)',
                  opacity: why && !isCur ? 0.4 : 1,
                }}
              >
                <span style={{ fontSize: 11, color: isCur ? '#fff8ec' : fromKey(d).getDay() === 0 ? 'var(--stamp)' : 'var(--muted)' }}>{dow(d)}</span>
                <span style={{ fontSize: 15, fontWeight: 700 }}>{fromKey(d).getDate()}</span>
                {p && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink)', background: SHIFT_COLOR[p.shift], borderRadius: 8, padding: '0 6px' }}>{p.shift}</span>}
                <span style={{ fontSize: 10 }}>{label}</span>
              </button>
            )
          })}
        </div>

        <div className="muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
          흐린 날은 고를 수 없어요: 지난 날 · 이미 운동이 있는 날
          {plan.origin && <><br />테두리 있는 <b>원래</b> 날을 누르면 되돌려요</>}
        </div>
        <button className="btn ghost" onClick={onClose}>닫기</button>
      </div>
    </div>
  )
}
