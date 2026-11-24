import { useState } from 'react'
import { God, Pig } from '../components/Avatars'
import InstallBanner from '../components/InstallBanner'
import PushCard from '../components/PushCard'
import { KIND_LABEL, PLAN_BY_DATE } from '../data/plan'
import { repsFor } from '../data/routines'
import { shortLabel, timeLabel, toKey } from '../lib/date'
import { useStore, type WorkoutRequest } from '../lib/store'
import { Ticket } from './Coupons'
import { IconTrash } from '../components/Icons'
import { GRADE_COLOR, GRADE_LABEL, percent, type Grade } from '../data/rewards'

/** 관리자: 상점 확률 조정 */
export function AdminShop() {
  const { rewards, saveWeights, mode } = useStore()
  const [draft, setDraft] = useState<Record<string, number>>(() => Object.fromEntries(rewards.map((r) => [r.id, r.weight])))
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)

  const preview = rewards.map((r) => ({ ...r, weight: draft[r.id] ?? r.weight }))
  const changed = rewards.some((r) => (draft[r.id] ?? r.weight) !== r.weight)
  const set = (id: string, v: number) => {
    setSaved(false)
    setDraft((d) => ({ ...d, [id]: Math.max(0, Math.min(999, Math.round(v))) }))
  }

  return (
    <main className="screen">
      <h1 className="title">상점 설정</h1>
      <p className="muted small" style={{ margin: '-6px 0 0', lineHeight: 1.5 }}>
        숫자끼리의 <b>비율</b>로 뽑아요. 합이 100일 필요는 없고, 오른쪽이 실제 확률이에요. 0으로 하면 안 나와요.
      </p>

      {(['legend', 'rare', 'common'] as Grade[]).map((g) => (
        <div key={g} className="card" style={{ padding: '10px 16px' }}>
          <span className="chip solid" style={{ background: GRADE_COLOR[g] }}>{GRADE_LABEL[g]}</span>
          {preview
            .filter((r) => r.grade === g)
            .map((r) => (
              <div key={r.id} className="row" style={{ padding: '10px 0 2px', gap: 8 }}>
                <span style={{ flex: 1, fontSize: 14 }}>{r.refund ? `꽝 (${r.refund}P 환급)` : r.name}</span>
                <button className="btn sm ghost" aria-label={`${r.name} 줄이기`} style={{ padding: '0 10px' }} onClick={() => set(r.id, r.weight - 1)}>−</button>
                <input
                  type="number"
                  inputMode="numeric"
                  aria-label={`${r.name} 가중치`}
                  value={r.weight}
                  onChange={(e) => set(r.id, Number(e.target.value) || 0)}
                  style={{ width: 52, height: 36, textAlign: 'center', borderRadius: 10, border: '1.5px solid var(--line-2)', fontSize: 15, background: '#fffdf8' }}
                />
                <button className="btn sm ghost" aria-label={`${r.name} 늘리기`} style={{ padding: '0 10px' }} onClick={() => set(r.id, r.weight + 1)}>+</button>
                <span style={{ width: 54, textAlign: 'right', fontWeight: 700, fontSize: 14 }}>{percent(r.weight, preview)}%</span>
              </div>
            ))}
        </div>
      ))}

      <button
        className="btn"
        disabled={!changed || busy || preview.every((r) => r.weight === 0)}
        onClick={async () => {
          setBusy(true)
          try {
            await saveWeights(draft)
            setSaved(true)
          } catch {
            /* 오류 창은 저장소에서 보여줘요 */
          } finally {
            setBusy(false)
          }
        }}
      >
        {busy ? '저장 중…' : saved && !changed ? '저장했어요 ✓' : '저장하기'}
      </button>
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>
        저장하면 운동러 상점에 바로 반영돼요.{mode === 'local' ? ' (임시 모드: 이 기기에만 저장)' : ''}
      </p>
    </main>
  )
}

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
  const { review, checks, deleteRequest } = useStore()
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const decide = (approve: boolean) => {
    setBusy(true)
    review(req.id, approve, comment.trim()).catch(() => setBusy(false))
  }
  const remove = () => {
    if (!window.confirm('이 요청을 지울까요? 포인트는 주지 않고, 운동러는 다시 요청할 수 있어요.')) return
    setBusy(true)
    deleteRequest(req.id).catch(() => setBusy(false))
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
        <button aria-label="요청 삭제" title="요청 삭제" disabled={busy} onClick={remove} style={{ background: 'none', border: 0, padding: 8, color: 'var(--muted)' }}>
          <IconTrash />
        </button>
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
