import { useState, type CSSProperties } from 'react'
import { BOX_PRICE, GRADE_COLOR, GRADE_LABEL, PITY, REWARDS, gradeOdds, type Grade, type Reward } from '../data/rewards'
import { useStore } from '../lib/store'

export default function Shop() {
  const { balance, pity, openBox } = useStore()
  const [shaking, setShaking] = useState(false)
  const [result, setResult] = useState<Reward | null>(null)

  const open = () => {
    if (shaking) return
    setShaking(true)
    setTimeout(() => {
      setShaking(false)
      setResult(openBox())
    }, 900)
  }

  return (
    <main className="screen">
      <div className="between">
        <h1 className="title">포인트 상점</h1>
        <span className="chip solid" style={{ background: 'var(--butter)', fontSize: 14 }}>{balance}P</span>
      </div>

      <div className="card" style={{ background: '#e9d6b4', boxShadow: 'inset 0 0 0 2px #d8c09a', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 24 }}>
        <span className="tape" style={{ top: -11, left: 18, transform: 'rotate(-8deg)' }} />
        <span className="tape" style={{ top: -11, right: 18, transform: 'rotate(7deg)', background: 'rgba(239,177,181,.8)' }} />
        <GiftBox shaking={shaking} />
        <div className="hand" style={{ fontSize: 30 }}>두근두근 랜덤박스</div>
        <div className="small" style={{ color: 'var(--brown)' }}>한 번 여는 데 {BOX_PRICE}P</div>
        <button className="btn" style={{ width: '100%', marginTop: 6 }} disabled={balance < BOX_PRICE || shaking} onClick={open}>
          {shaking ? '두근두근…' : balance < BOX_PRICE ? `${BOX_PRICE - balance}P 더 모으면 열 수 있어요` : `${BOX_PRICE}P로 열어보기`}
        </button>
      </div>

      <div>
        <div className="between small" style={{ marginBottom: 8 }}>
          <span>레어 이상 확정까지</span>
          <span style={{ fontWeight: 700 }}>{pity} / {PITY}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${PITY}, minmax(0, 1fr))`, gap: 4 }}>
          {Array.from({ length: PITY }, (_, i) => (
            <span key={i} style={{ height: 12, borderRadius: 3, background: i < pity ? 'var(--brown)' : 'transparent', boxShadow: i < pity ? 'none' : 'inset 0 0 0 1.5px #c9b89e' }} />
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '6px 16px' }}>
        {(['common', 'rare', 'legend'] as Grade[]).map((g, i) => (
          <div key={g} className="row" style={{ padding: '10px 0', borderBottom: i < 2 ? '1.5px dashed var(--line)' : 0, gap: 12 }}>
            <span className="chip solid" style={{ background: GRADE_COLOR[g], minWidth: 70, justifyContent: 'center' }}>
              {GRADE_LABEL[g]} {gradeOdds(g)}%
            </span>
            <span style={{ fontSize: 14 }}>
              {REWARDS.filter((r) => r.grade === g).map((r) => (r.refund ? `꽝 (${r.refund}P 돌려받기)` : r.name)).join(' · ')}
            </span>
          </div>
        ))}
      </div>

      {result && (
        <div className="sheet-bg" style={{ alignItems: 'center' }} onClick={() => setResult(null)}>
          <div className="card reveal" role="dialog" aria-modal="true" aria-label="뽑기 결과" style={{ width: 'min(320px, 88vw)', textAlign: 'center', padding: '30px 20px 20px', display: 'flex', flexDirection: 'column', gap: 10 }} onClick={(e) => e.stopPropagation()}>
            <span className="tape" style={{ top: -11, left: '50%', marginLeft: -42 }} />
            <span className="chip solid" style={{ background: GRADE_COLOR[result.grade], alignSelf: 'center' }}>{GRADE_LABEL[result.grade]}</span>
            <div className="hand" style={{ fontSize: 38 }}>{result.refund ? '꽝!' : result.name}</div>
            <div className="muted small">{result.refund ? `${result.refund}P를 돌려받았어요` : '쿠폰함에 넣었어요'}</div>
            <button className="btn" onClick={() => setResult(null)}>좋아요</button>
          </div>
        </div>
      )}
    </main>
  )
}

function GiftBox({ shaking }: { shaking: boolean }) {
  const s = (o: CSSProperties): CSSProperties => ({ position: 'absolute', ...o })
  return (
    <div className={`box${shaking ? ' shaking' : ''}`} aria-hidden="true" style={{ position: 'relative', width: 170, height: 140, marginTop: 4 }}>
      <span style={s({ left: 4, top: 46, width: 162, height: 94, background: '#b97b48', borderRadius: 4 })} />
      <span style={s({ left: 74, top: 46, width: 22, height: 94, background: '#e0603a' })} />
      <span style={s({ left: -6, top: 18, width: 182, height: 34, background: '#c98e5a', borderRadius: 6, transform: 'rotate(-6deg)' })} />
      <span style={s({ left: 76, top: 16, width: 22, height: 36, background: '#e0603a', transform: 'rotate(-6deg)' })} />
      <span style={s({ left: 54, top: -6, width: 30, height: 22, border: '5px solid #e0603a', borderRadius: '50%', transform: 'rotate(-24deg)' })} />
      <span style={s({ left: 88, top: -10, width: 30, height: 22, border: '5px solid #e0603a', borderRadius: '50%', transform: 'rotate(14deg)' })} />
      <span className="hand" style={s({ left: 24, top: 62, fontSize: 46, color: '#fbf6ec', lineHeight: 1 })}>?</span>
      <span className="hand" style={s({ left: 118, top: 62, fontSize: 46, color: '#fbf6ec', lineHeight: 1 })}>!</span>
    </div>
  )
}
