import { useRef, useState, type CSSProperties } from 'react'
import BoxOpening, { type Phase } from '../components/BoxOpening'
import { BOX_PRICE, GRADE_COLOR, GRADE_LABEL, PITY, REWARD_BY_ID, gradeOdds, percent, type Grade, type Reward } from '../data/rewards'
import { useStore } from '../lib/store'

const SHAKE_MS = 1100
const BURST_MS = 450
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms))
const buzz = (pattern: number[]) => {
  try {
    navigator.vibrate?.(pattern)
  } catch {
    /* 아이폰은 진동을 지원하지 않아요 */
  }
}

/** 연출 미리보기: 주소 뒤에 ?box=wish 처럼 붙이면 그 결과 화면만 보여줘요 (포인트는 안 써요) */
const previewReward = () => {
  const id = new URLSearchParams(window.location.search).get('box')
  return id ? (REWARD_BY_ID[id] ?? null) : null
}

export default function Shop({ onGoCoupons }: { onGoCoupons?: () => void }) {
  const { balance, pity, openBox, rewards } = useStore()
  const [phase, setPhase] = useState<Phase | null>(() => (previewReward() ? 'result' : null))
  const [result, setResult] = useState<Reward | null>(previewReward)

  const busy = useRef(false)

  const open = async () => {
    if (busy.current) return
    busy.current = true
    setResult(null)
    setPhase('shake')
    buzz([40, 60, 40, 60, 40, 60, 80])
    try {
      const [reward] = await Promise.all([openBox(), wait(SHAKE_MS)])
      if (!reward) {
        setPhase(null)
        return
      }
      setPhase('burst')
      buzz([60])
      await wait(BURST_MS)
      setResult(reward)
      setPhase('result')
      if (reward.grade === 'legend') buzz([120, 60, 120, 60, 400])
      else if (reward.grade === 'rare') buzz([80, 50, 80])
    } catch {
      setPhase(null)
    } finally {
      busy.current = false
    }
  }

  const close = () => {
    setPhase(null)
    setResult(null)
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
        <GiftBox />
        <div className="hand" style={{ fontSize: 30 }}>두근두근 랜덤박스</div>
        <div className="small" style={{ color: 'var(--brown)' }}>한 번 여는 데 {BOX_PRICE}P · 꽝이어도 10P는 돌려받아요</div>
        <button className="btn" style={{ width: '100%', marginTop: 6 }} disabled={balance < BOX_PRICE || !!phase} onClick={open}>
          {balance < BOX_PRICE ? `${BOX_PRICE - balance}P 더 모으면 열 수 있어요` : `${BOX_PRICE}P로 열어보기`}
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
        {(['legend', 'rare', 'common'] as Grade[]).map((g) => (
          <div key={g} style={{ padding: '10px 0', borderBottom: g !== 'common' ? '1.5px dashed var(--line)' : 0 }}>
            <span className="chip solid" style={{ background: GRADE_COLOR[g] }}>
              {GRADE_LABEL[g]} {gradeOdds(g, rewards)}%
            </span>
            {rewards
              .filter((r) => r.grade === g)
              .map((r) => (
                <div key={r.id} className="between" style={{ fontSize: 14, padding: '6px 2px 0' }}>
                  <span>{r.refund ? `꽝 (${r.refund}P 돌려받기)` : r.name}</span>
                  <span style={{ fontWeight: 700 }}>{percent(r.weight, rewards)}%</span>
                </div>
              ))}
          </div>
        ))}
      </div>

      {phase && (
        <BoxOpening
          phase={phase}
          reward={result}
          canAgain={balance >= BOX_PRICE}
          onClose={close}
          onAgain={() => {
            close()
            setTimeout(open, 50)
          }}
          onCoupons={() => {
            close()
            onGoCoupons?.()
          }}
        />
      )}
    </main>
  )
}

function GiftBox() {
  const s = (o: CSSProperties): CSSProperties => ({ position: 'absolute', ...o })
  return (
    <div className="box" aria-hidden="true" style={{ position: 'relative', width: 170, height: 140, marginTop: 4, animation: 'thump 1.6s ease-in-out infinite' }}>
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
