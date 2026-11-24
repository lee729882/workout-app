import { useState } from 'react'
import { God, Pig } from '../components/Avatars'
import InstallBanner from '../components/InstallBanner'
import PushCard from '../components/PushCard'
import { KIND_LABEL, PLAN_BY_DATE } from '../data/plan'
import { repsFor } from '../data/routines'
import { shortLabel, timeLabel, toKey } from '../lib/date'
import { useStore, type WorkoutRequest } from '../lib/store'
import { Ticket } from './Coupons'

export function AdminApprove() {
  const { requests, coupons, resolveCoupon } = useStore()
  const pending = requests.filter((r) => r.status === 'pending')
  const couponReqs = coupons.filter((c) => c.status === 'requested')

  return (
    <main className="screen">
      <InstallBanner />
      <PushCard who="admin" />
      <div className="row" style={{ gap: 10 }}>
        <span style={{ width: 44, height: 44, borderRadius: '50%', overflow: 'hidden', flex: 'none', boxShadow: '0 0 0 2px var(--butter)' }}>
          <God size={52} />
        </span>
        <span className="chip solid" style={{ background: 'var(--brown)', color: '#fff8ec' }}>관리자 모드</span>
      </div>
      <div className="row" style={{ gap: 10 }}>
        <h1 className="title" style={{ fontSize: 36 }}>확인해 주세요</h1>
        {pending.length > 0 && (
          <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--stamp)', color: '#fff', fontWeight: 700, fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {pending.length}
          </span>
        )}
      </div>

      {pending.length === 0 && couponReqs.length === 0 && <div className="card empty">지금은 확인할 게 없어요</div>}
      {pending.map((r) => (
        <RequestCard key={r.id} req={r} />
      ))}

      {couponReqs.length > 0 && <h2 className="hand" style={{ fontSize: 26, margin: '8px 0 0' }}>쿠폰 사용 요청</h2>}
      {couponReqs.map((c) => (
        <Ticket
          key={c.id}
          coupon={c}
          action={
            <span className="row" style={{ gap: 6 }}>
              <button className="btn sm ghost" onClick={() => resolveCoupon(c.id, false).catch(() => undefined)}>다음에</button>
              <button className="btn sm" onClick={() => resolveCoupon(c.id, true).catch(() => undefined)}>수락</button>
            </span>
          }
        />
      ))}
    </main>
  )
}

function RequestCard({ req }: { req: WorkoutRequest }) {
  const { review, checks } = useStore()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const decide = (approve: boolean) => {
    setBusy(true)
    review(req.id, approve, comment.trim()).catch(() => setBusy(false))
  }
  const plan = PLAN_BY_DATE[req.date]
  const done = (checks[req.date] ?? []).length
  const isStrength = plan && ['upper', 'lower', 'upperWalk', 'lowerWalk'].includes(plan.kind)

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <span className="tape" style={{ top: -11, left: 24, transform: 'rotate(-5deg)' }} />
      <div className="row">
        <span style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', flex: 'none' }}><Pig size={48} /></span>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700 }}>운동러가 완료를 요청했어요</div>
          <div className="muted" style={{ fontSize: 12 }}>{shortLabel(req.date)} · {timeLabel(req.createdAt)}</div>
        </div>
      </div>
      <div style={{ background: '#fff', padding: '8px 8px 0', boxShadow: '0 0 0 1.5px #efe4d2', transform: 'rotate(-1deg)' }}>
        {req.photo ? (
          <img src={req.photo} alt="인증 사진" style={{ display: 'block', width: '100%', maxHeight: 260, objectFit: 'cover' }} />
        ) : (
          <div className="empty small" style={{ padding: 20, background: 'var(--paper)' }}>사진 없이 보냈어요</div>
        )}
        <div className="hand" style={{ fontSize: 17, padding: '6px 2px 8px' }}>
          {plan ? KIND_LABEL[plan.kind] : ''}
          {isStrength ? ` ${repsFor(req.date)}회 × 3세트 · 체크 ${done}개` : ''}
        </div>
      </div>
      {req.memo && (
        <div className="hand" style={{ background: 'var(--paper-2)', borderRadius: '14px 14px 14px 4px', padding: '10px 14px', fontSize: 19 }}>{req.memo}</div>
      )}
      <label className="field">
        한마디 (선택)
        <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="오늘도 최고! 팔뚝 멋있다" />
      </label>
      <div className="row">
        <button className="btn ghost" style={{ flex: 1, fontSize: 15 }} disabled={busy} onClick={() => decide(false)}>다시 해볼까요</button>
        <button className="btn" style={{ flex: 1.4, fontSize: 15 }} disabled={busy} onClick={() => decide(true)}>승인하고 +10P</button>
      </div>
    </div>
  )
}

export function AdminPoints() {
  const { ledger, balance, grant } = useStore()
  const [amount, setAmount] = useState(10)
  const [reason, setReason] = useState('')

  return (
    <main className="screen">
      <h1 className="title">포인트</h1>
      <div className="card between">
        <span className="muted">운동러 잔액</span>
        <span className="hand" style={{ fontSize: 34 }}>{balance}P</span>
      </div>

      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="hand" style={{ fontSize: 22 }}>보너스 직접 주기</div>
        <div className="row">
          <button className="btn sm ghost" aria-label="10P 줄이기" onClick={() => setAmount((a) => a - 10)}>−10</button>
          <span className="hand" style={{ fontSize: 28, minWidth: 70, textAlign: 'center' }}>{amount > 0 ? '+' : ''}{amount}P</span>
          <button className="btn sm ghost" aria-label="10P 늘리기" onClick={() => setAmount((a) => a + 10)}>+10</button>
        </div>
        <label className="field">
          이유
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="예: 비 오는데 밖에서 뛰기 성공" />
        </label>
        <button
          className="btn"
          disabled={amount === 0 || !reason.trim()}
          onClick={() => {
            grant(amount, reason.trim()).then(() => setReason(''), () => undefined)
          }}
        >
          {amount >= 0 ? '지급하기' : '차감하기'}
        </button>
      </div>

      <h2 className="hand" style={{ fontSize: 24, margin: '6px 0 0' }}>내역</h2>
      <div className="card" style={{ padding: '4px 16px' }}>
        {ledger.length === 0 && <div className="empty">아직 내역이 없어요</div>}
        {[...ledger].reverse().map((e) => (
          <div key={e.id} className="between" style={{ padding: '10px 0', borderBottom: '1.5px dashed var(--line)' }}>
            <div>
              <div style={{ fontSize: 14 }}>{e.reason}</div>
              <div className="muted" style={{ fontSize: 11 }}>{shortLabel(toKey(new Date(e.at)))} {timeLabel(e.at)}</div>
            </div>
            <span className="hand" style={{ fontSize: 20, color: e.amount >= 0 ? 'var(--ink)' : 'var(--stamp)' }}>
              {e.amount > 0 ? '+' : ''}{e.amount}P
            </span>
          </div>
        ))}
      </div>
    </main>
  )
}
