// 하루치 운동 카드 + 완료 요청. 오늘 화면과 캘린더에서 같이 써요.
import { useRef, useState } from 'react'
import { KIND_LABEL, SHIFT_COLOR, isWorkout, type DayPlan } from '../data/plan'
import { movesFor, repsFor, videoUrl } from '../data/routines'
import { shrinkPhoto, useStore } from '../lib/store'
import { IconCamera, IconCheck, IconClose, IconPlay } from './Icons'

export function DayCard({ plan }: { plan: DayPlan }) {
  const { checks, toggleCheck } = useStore()
  const moves = movesFor(plan)
  const reps = repsFor(plan.date)
  const checked = checks[plan.date] ?? []
  const [open, setOpen] = useState<number | null>(null)

  if (!isWorkout(plan.kind)) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <span className="tape" style={{ top: -11, left: '50%', marginLeft: -42, transform: 'rotate(-3deg)' }} />
        <div className="hand" style={{ fontSize: 28 }}>{plan.kind === 'recovery' ? '회복하는 날' : '쉬는 날'}</div>
        <p className="muted small" style={{ margin: '6px 0 0' }}>{plan.note ?? '푹 쉬는 것도 운동이에요.'}</p>
      </div>
    )
  }

  return (
    <div className="card" style={{ paddingTop: 22 }}>
      <span className="tape" style={{ top: -11, left: '50%', marginLeft: -42, transform: 'rotate(-3deg)' }} />
      <div className="between" style={{ alignItems: 'baseline', marginBottom: 2 }}>
        <span className="hand" style={{ fontSize: 24 }}>
          {plan.kind === 'upper' || plan.kind === 'upperWalk' ? '상체 (팔뚝 집중)' : KIND_LABEL[plan.kind]}
        </span>
        {moves.length > 0 && <span className="muted small">{reps}회 × 3세트</span>}
      </div>

      {moves.map((m, i) => {
        const done = checked.includes(i)
        return (
          <div key={m.name}>
            <div className="move">
              <button className="check" aria-pressed={done} aria-label={`${m.name} 완료 체크`} onClick={() => toggleCheck(plan.date, i)}>
                {done && <IconCheck size={16} strokeWidth={3} />}
              </button>
              <button className={`move-name${done ? ' done' : ''}`} onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                {m.name}
                {m.bothSides && <span className="muted small"> (양쪽)</span>}
              </button>
              <span className="wt">{m.weight}</span>
            </div>
            {open === i && (
              <div className="small" style={{ background: 'var(--paper)', borderRadius: 10, padding: '10px 12px', margin: '0 0 8px', lineHeight: 1.5 }}>
                {m.tip}
                <div style={{ marginTop: 6 }}>
                  <a href={videoUrl(m.video)} target="_blank" rel="noreferrer" className="row" style={{ gap: 4, display: 'inline-flex' }}>
                    <IconPlay size={14} /> 자세 영상 보기
                  </a>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {plan.cardio && (
        <div style={{ marginTop: moves.length ? 10 : 6, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {moves.length > 0 && <div className="hand" style={{ fontSize: 20 }}>+ 런닝머신</div>}
          {plan.cardio.map((c) => (
            <div key={c} className="small" style={{ lineHeight: 1.5 }}>{c}</div>
          ))}
        </div>
      )}
    </div>
  )
}

export function DayHeaderChips({ plan }: { plan: DayPlan }) {
  return (
    <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
      <span className="chip solid" style={{ background: SHIFT_COLOR[plan.shift] }}>{plan.shift} 근무</span>
      {plan.place && <span className="chip">{plan.place === 'home' ? '집에서' : '본가'}</span>}
      {isWorkout(plan.kind) && <span className="chip">약 30분</span>}
    </div>
  )
}

/** 완료 요청 버튼 + 상태 */
export function RequestBar({ plan, today }: { plan: DayPlan; today: string }) {
  const { requestFor } = useStore()
  const [sheet, setSheet] = useState(false)
  const req = requestFor(plan.date)

  if (!isWorkout(plan.kind)) return null

  if (req?.status === 'approved') {
    return (
      <div className="card row" style={{ gap: 14 }}>
        <span className="stamp" style={{ width: 54, height: 54, fontSize: 18 }}>완료</span>
        <div>
          <div style={{ fontWeight: 700 }}>승인 완료! +10P</div>
          {req.comment && <div className="hand" style={{ fontSize: 19 }}>관리자: {req.comment}</div>}
        </div>
      </div>
    )
  }
  if (req?.status === 'pending') {
    return <div className="note" style={{ textAlign: 'center' }}>관리자 확인을 기다리는 중이에요</div>
  }
  if (plan.date > today) {
    return <p className="muted small" style={{ textAlign: 'center', margin: 0 }}>그날이 되면 완료 요청을 보낼 수 있어요</p>
  }

  return (
    <>
      {req?.status === 'rejected' && (
        <div className="note" style={{ background: '#fde2dc' }}>
          다시 해볼까요? {req.comment && <>— {req.comment}</>}
        </div>
      )}
      <button className="btn" onClick={() => setSheet(true)}>다 했어요! 확인 요청</button>
      {sheet && <RequestSheet plan={plan} onClose={() => setSheet(false)} />}
    </>
  )
}

function RequestSheet({ plan, onClose }: { plan: DayPlan; onClose: () => void }) {
  const { submitRequest } = useStore()
  const [memo, setMemo] = useState('')
  const [photo, setPhoto] = useState<string>()
  const [sending, setSending] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="완료 요청 보내기" onClick={(e) => e.stopPropagation()}>
        <div className="between">
          <h2 className="hand" style={{ fontSize: 28, margin: 0 }}>완료 요청 보내기</h2>
          <button aria-label="닫기" onClick={onClose} style={{ background: 'none', border: 0, padding: 8 }}><IconClose /></button>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          style={{ border: '2px dashed var(--line-2)', background: '#fffdf8', borderRadius: 12, minHeight: 160, padding: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 6, color: 'var(--muted)' }}
        >
          {photo ? <img src={photo} alt="첨부한 인증 사진" style={{ width: '100%', maxHeight: 280, objectFit: 'cover' }} /> : (<><IconCamera /> 인증 사진 붙이기 (선택)</>)}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0]
            if (f) setPhoto(await shrinkPhoto(f))
          }}
        />
        <label className="field">
          한마디 (선택)
          <textarea value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="팔이 덜덜 떨려요 ㅠ 그래도 다 했다!" />
        </label>
        <button
          className="btn"
          disabled={sending}
          onClick={async () => {
            setSending(true)
            try {
              await submitRequest(plan.date, memo.trim(), photo)
              onClose()
            } catch {
              setSending(false)
            }
          }}
        >
          {sending ? '보내는 중…' : '보내기'}
        </button>
      </div>
    </div>
  )
}
