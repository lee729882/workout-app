import { PLAN, PLAN_BY_DATE, KIND_LABEL, isWorkout } from '../data/plan'
import { WEEKLY_GOAL } from '../data/rewards'
import { TIP, repsFor } from '../data/routines'
import { longLabel, shortLabel, todayKey, weekStart } from '../lib/date'
import { useStore } from '../lib/store'
import { DayCard, DayHeaderChips, RequestBar } from '../components/DayDetail'
import InstallBanner from '../components/InstallBanner'
import PushCard from '../components/PushCard'

export default function Today() {
  const { balance, requests } = useStore()
  const today = todayKey()
  const plan = PLAN_BY_DATE[today]
  const next = PLAN.find((p) => p.date > today && isWorkout(p.kind))

  const wk = weekStart(today)
  const doneThisWeek = requests.filter((r) => r.status === 'approved' && weekStart(r.date) === wk).length

  const headline = !plan
    ? '오늘은 계획이 없어요'
    : isWorkout(plan.kind)
      ? `오늘은 ${KIND_LABEL[plan.kind]} 데이!`
      : plan.kind === 'recovery'
        ? '오늘은 회복하는 날'
        : '오늘은 쉬는 날'

  return (
    <main className="screen">
      <InstallBanner />
      <PushCard who="user" />
      <div className="between" style={{ alignItems: 'flex-start' }}>
        <div>
          <div className="muted small">{longLabel(today)}</div>
          <h1 className="title" style={{ fontSize: 34, marginTop: 4 }}>{headline}</h1>
        </div>
        <div style={{ width: 66, height: 66, flex: 'none', borderRadius: '50%', background: 'var(--butter)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(8deg)', boxShadow: '0 4px 0 #d9b551' }}>
          <span style={{ fontSize: 10 }}>내 포인트</span>
          <span className="hand" style={{ fontSize: 24, lineHeight: 1 }}>{balance}P</span>
        </div>
      </div>

      {plan ? (
        <>
          <DayHeaderChips plan={plan} />
          <DayCard plan={plan} />
          {plan.note && <div className="note">📌 {plan.note}</div>}
          {isWorkout(plan.kind) && !plan.note && <div className="note">{TIP}</div>}
          <RequestBar plan={plan} today={today} />
        </>
      ) : (
        <div className="card empty">관리자가 새 달 계획을 넣으면 여기에 나와요.</div>
      )}

      <div className="between">
        <span style={{ fontSize: 14 }}>이번 주 운동</span>
        <div className="row" style={{ gap: 8 }}>
          {Array.from({ length: WEEKLY_GOAL }, (_, i) =>
            i < doneThisWeek ? (
              <span key={i} className="stamp" style={{ width: 30, height: 30, fontSize: 15, transform: 'rotate(-12deg)' }}>완</span>
            ) : (
              <span key={i} style={{ width: 30, height: 30, borderRadius: '50%', border: '2px dashed #c9b89e' }} />
            ),
          )}
          <span className="hand" style={{ fontSize: 20, marginLeft: 4 }}>{Math.min(doneThisWeek, WEEKLY_GOAL)} / {WEEKLY_GOAL}</span>
        </div>
      </div>

      {next && (!plan || !isWorkout(plan.kind)) && (
        <div className="card">
          <span className="tape" style={{ top: -10, right: 22, transform: 'rotate(5deg)', background: 'rgba(201,217,166,.85)' }} />
          <div className="muted small">다음 운동</div>
          <div className="hand" style={{ fontSize: 22, marginTop: 2 }}>
            {shortLabel(next.date)} {KIND_LABEL[next.kind]}
            {next.kind !== 'treadmill' && next.kind !== 'cardio' ? ` ${repsFor(next.date)}회 × 3세트` : ''}
          </div>
        </div>
      )}
    </main>
  )
}
