import { useState, type ReactNode } from 'react'
import { GRADE_COLOR, GRADE_LABEL } from '../data/rewards'
import { shortLabel, toKey, todayKey } from '../lib/date'
import { useStore, type Coupon, type CouponStatus } from '../lib/store'

const TABS: { id: CouponStatus; label: string }[] = [
  { id: 'owned', label: '보유' },
  { id: 'requested', label: '요청 중' },
  { id: 'used', label: '사용 완료' },
]

export default function Coupons() {
  const { coupons } = useStore()
  const [tab, setTab] = useState<CouponStatus>('owned')
  const [using, setUsing] = useState<Coupon | null>(null)
  const list = coupons.filter((c) => c.status === tab).reverse()

  return (
    <main className="screen">
      <h1 className="title">내 쿠폰함</h1>
      <p className="muted small" style={{ margin: '-6px 0 0' }}>'쓸래요'를 누르면 관리자에게 알림이 가요</p>
      <div className="seg" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label} {coupons.filter((c) => c.status === t.id).length}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty">{tab === 'owned' ? '아직 쿠폰이 없어요. 상점에서 박스를 열어보세요!' : '비어 있어요'}</div>
      )}
      {list.map((c) => (
        <Ticket key={c.id} coupon={c} onUse={() => setUsing(c)} />
      ))}

      {using && <UseSheet coupon={using} onClose={() => setUsing(null)} />}
    </main>
  )
}

export function Ticket({ coupon, onUse, action }: { coupon: Coupon; onUse?: () => void; action?: ReactNode }) {
  const { rewardOf } = useStore()
  const r = rewardOf(coupon)
  if (!r) return null
  return (
    <div className="ticket" style={{ opacity: coupon.status === 'used' ? 0.6 : 1 }}>
      <div className="stub" style={{ background: GRADE_COLOR[r.grade] }}>
        <span style={{ fontSize: 11 }}>{GRADE_LABEL[r.grade]}</span>
        <span className="hand">{r.stub}</span>
      </div>
      <span className="notch" style={{ top: -8 }} />
      <span className="notch" style={{ bottom: -8 }} />
      <div style={{ flex: 1, padding: '14px 14px 12px', minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{r.name}</div>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.desc}</div>
        <div className="between" style={{ marginTop: 10 }}>
          <span className="muted" style={{ fontSize: 11 }}>
            {coupon.wantDate ? `${shortLabel(coupon.wantDate)} 사용${coupon.status === 'used' ? '' : ' 희망'}` : `받은 날 ${shortLabel(toKey(new Date(coupon.at)))}`}
          </span>
          {action ??
            (coupon.status === 'owned' ? (
              <button className="btn sm" onClick={onUse}>쓸래요</button>
            ) : coupon.status === 'requested' ? (
              <span className="chip solid" style={{ background: 'var(--note)' }}>관리자 확인 중</span>
            ) : (
              <span className="stamp" style={{ width: 40, height: 40, fontSize: 13 }}>사용</span>
            ))}
        </div>
      </div>
    </div>
  )
}

function UseSheet({ coupon, onClose }: { coupon: Coupon; onClose: () => void }) {
  const { requestCoupon, rewardOf } = useStore()
  const [date, setDate] = useState(todayKey())
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="쿠폰 쓰기" onClick={(e) => e.stopPropagation()}>
        <h2 className="hand" style={{ fontSize: 28, margin: 0 }}>{rewardOf(coupon)?.name} 쓸래요</h2>
        <label className="field">
          언제 쓰고 싶어요?
          <input type="date" value={date} min={todayKey()} onChange={(e) => setDate(e.target.value)} />
        </label>
        <div className="row">
          <button className="btn ghost" style={{ flex: 1 }} onClick={onClose}>취소</button>
          <button
            className="btn"
            style={{ flex: 2 }}
            disabled={!date}
            onClick={() => {
              requestCoupon(coupon.id, date).then(onClose, () => undefined)
            }}
          >
            관리자에게 요청
          </button>
        </div>
      </div>
    </div>
  )
}
