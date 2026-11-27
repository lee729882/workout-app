import { useState } from 'react'
import { KIND_LABEL, PLAN_BY_DATE, isWorkout, type DayPlan } from '../data/plan'
import { WEEKLY_GOAL } from '../data/rewards'
import { TIP, repsOf } from '../data/routines'
import { longLabel, shortLabel, todayKey, weekStart } from '../lib/date'
import { weekDays } from '../lib/schedule'
import { eul } from '../lib/text'
import { useStore } from '../lib/store'
import { DayCard, DayHeaderChips, RequestBar } from '../components/DayDetail'
import InstallBanner from '../components/InstallBanner'
import PushCard from '../components/PushCard'

export default function Today() {
  const { balance, requests, planOn, nextWorkout, whyNot, requestFor } = useStore()
  const today = todayKey()
  const plan = planOn(today)
  const next = nextWorkout(today)
  const todayHasWorkout = !!plan && isWorkout(plan.kind)

  const wk = weekStart(today)
  const doneThisWeek = new Set(requests.filter((r) => r.status === 'approved' && weekStart(r.date) === wk).map((r) => r.date)).size

  // 오늘 운동이 없으면: 이번 주에 못 한 운동 → 오늘 하기, 없으면 이번 주 남은 운동 → 미리 하기
  const free = (d: string) => {
    const p = planOn(d)
    const r = requestFor(d)
    return p && isWorkout(p.kind) && r?.status !== 'pending' && r?.status !== 'approved' && !whyNot(p, today, today) ? p : undefined
  }
  const week = weekDays(today)
  const missed = todayHasWorkout ? undefined : week.filter((d) => d < today).map(free).find(Boolean)
  const ahead = todayHasWorkout || missed ? undefined : week.filter((d) => d > today).map(free).find(Boolean)

  const headline = !plan
    ? '오늘은 계획이 없어요'
    : isWorkout(plan.kind)
      ? `오늘은 ${KIND_LABEL[plan.kind]} 데이!`
      : plan.movedTo
        ? '오늘 운동은 옮겼어요'
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

      {missed && <QuickMove plan={missed} today={today} title="못 한 운동이 있어요" action="오늘 하기" />}
      {ahead && <QuickMove plan={ahead} today={today} title="오늘 미리 할 수 있어요" action="미리 하기" />}

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

      {next && !todayHasWorkout && (
        <div className="card">
          <span className="tape" style={{ top: -10, right: 22, transform: 'rotate(5deg)', background: 'rgba(201,217,166,.85)' }} />
          <div className="muted small">다음 운동</div>
          <div className="hand" style={{ fontSize: 22, marginTop: 2 }}>
            {shortLabel(next.date)} {KIND_LABEL[next.kind]}
            {next.kind !== 'treadmill' && next.kind !== 'cardio' ? ` ${repsOf(next)}회 × 3세트` : ''}
          </div>
        </div>
      )}
    </main>
  )
}

function QuickMove({ plan, today, title, action }: { plan: DayPlan; today: string; title: string; action: string }) {
  const { moveWorkout } = useStore()
  const [busy, setBusy] = useState(false)
  const origin = plan.origin ?? plan.date
  const base = PLAN_BY_DATE[today]

  const go = async () => {
    const k = KIND_LABEL[plan.kind]
    const lines = [`${shortLabel(plan.date)} ${k}${eul(k)} 오늘 할까요?`]
    if (base?.kind === 'recovery') lines.push('', '⚠️ 오늘은 나이트 다음 회복하는 날이에요. 몸이 괜찮을 때만 해주세요.')
    if (PLAN_BY_DATE[origin]?.place === 'parents' && base?.place !== 'parents') lines.push('', '본가가 아닌 날이라 집에서 할 수 있는 운동으로 바뀌어요.')
    if (!window.confirm(lines.join('\n'))) return
    setBusy(true)
    moveWorkout(origin, today).catch(() => setBusy(false))
  }

  return (
    <div className="card row" style={{ gap: 12, padding: '12px 14px', background: '#fffdf8', boxShadow: '0 0 0 2px var(--butter), 0 12px 24px -14px rgba(59,47,37,.5)' }}>
      <span aria-hidden="true" style={{ fontSize: 24 }}>🔁</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
        <div className="muted" style={{ fontSize: 12 }}>
          {shortLabel(plan.date)} {KIND_LABEL[plan.kind]} · 같은 주라 옮길 수 있어요
        </div>
      </div>
      <button className="btn sm" disabled={busy} onClick={go}>{action}</button>
    </div>
  )
}
