// 랜덤박스 여는 연출: 두근두근 → 펑 → 등급별 결과
import type { CSSProperties } from 'react'
import { GRADE_COLOR, GRADE_LABEL, type Reward } from '../data/rewards'

export type Phase = 'shake' | 'burst' | 'result'

interface Theme {
  bg: string
  ink: string
  rays?: string
  stamp?: { text: string; color: string; size: number; bg: string }
  confetti?: boolean
  sparks?: string[]
  title: string
  line: string
}

function themeOf(r: Reward): Theme {
  if (r.refund) return { bg: '#E7DFD3', ink: '#5C4A3B', title: '랜덤박스 결과', line: `그래도 ${r.refund}P는 돌려받았어요` }
  if (r.id === 'wish')
    return {
      bg: '#1F1A2E',
      ink: '#F6D77B',
      rays: 'repeating-conic-gradient(from 0deg, rgba(246,215,123,.8) 0deg 6deg, rgba(221,179,242,.45) 6deg 12deg, transparent 12deg 18deg)',
      confetti: true,
      sparks: ['#FFFFFF', '#F6D77B', '#FFFFFF', '#DDB3F2'],
      title: '1%의 기적',
      line: '"그 소원, 들어주마"',
    }
  if (r.grade === 'legend')
    return {
      bg: '#2B2420',
      ink: '#F6D77B',
      rays: 'repeating-conic-gradient(from 0deg, rgba(246,215,123,.75) 0deg 7deg, transparent 7deg 14deg)',
      stamp: { text: '전설!', color: '#F6D77B', size: 128, bg: 'rgba(43,36,32,.6)' },
      confetti: true,
      title: '랜덤박스 결과',
      line: `${r.weight}%를 뚫었어요! 날짜 정해서 쓰세요`,
    }
  if (r.grade === 'rare')
    return {
      bg: '#EEEBF8',
      ink: '#5B4F9A',
      rays: 'repeating-conic-gradient(from 0deg, rgba(155,140,230,.6) 0deg 8deg, transparent 8deg 16deg)',
      stamp: { text: '레어!', color: '#6B5BC9', size: 112, bg: 'rgba(255,255,255,.7)' },
      sparks: ['#9B8CE6', '#FFFFFF', '#9B8CE6', '#FFFFFF'],
      title: '랜덤박스 결과',
      line: '쿠폰함에 넣었어요',
    }
  return {
    bg: '#F3F6EA',
    ink: '#5C6B3F',
    rays: 'repeating-conic-gradient(from 0deg, rgba(181,201,142,.55) 0deg 9deg, transparent 9deg 22deg)',
    stamp: { text: '일반', color: '#6E8A3A', size: 96, bg: 'rgba(255,255,255,.6)' },
    title: '랜덤박스 결과',
    line: '쿠폰함에 넣었어요',
  }
}

const CONF_COLORS = ['#F6D77B', '#EFB1B5', '#C9D9A6', '#C9C9E8', '#DDB3F2', '#FFFFFF', '#E0603A']
const CONFETTI = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  background: CONF_COLORS[i % CONF_COLORS.length],
  animationDelay: `${((i * 0.23) % 3).toFixed(2)}s`,
  animationDuration: `${(2.4 + (i % 5) * 0.35).toFixed(2)}s`,
}))
const SPARK_POS = [
  { left: '14%', top: '24%' },
  { left: '84%', top: '28%' },
  { left: '80%', top: '50%' },
  { left: '12%', top: '48%' },
]

const abs = (o: CSSProperties): CSSProperties => ({ position: 'absolute', ...o })

/** 뚜껑 없는 상자 (열린 상태) */
function OpenBox({ ribbon = '#E0603A', dull = false }: { ribbon?: string; dull?: boolean }) {
  return (
    <div aria-hidden="true" style={{ position: 'relative', width: 180, height: 110, filter: dull ? 'saturate(.5)' : undefined }}>
      <span style={abs({ left: 0, top: 10, width: 180, height: 100, background: '#B97B48', borderRadius: 6 })} />
      <span style={abs({ left: 78, top: 10, width: 24, height: 100, background: ribbon })} />
      <span style={abs({ left: 0, top: 6, width: 180, height: 12, background: '#7C4F2C', borderRadius: 4 })} />
    </div>
  )
}

function Lid({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={className} style={{ position: 'relative', width: 200, height: 40 }}>
      <span style={abs({ inset: 0, background: '#C98E5A', borderRadius: 8 })} />
      <span style={abs({ left: 87, top: 0, width: 26, height: 40, background: '#E0603A' })} />
      <span style={abs({ left: 60, top: -26, width: 36, height: 26, border: '6px solid #E0603A', borderRadius: '50%', transform: 'rotate(-24deg)' })} />
      <span style={abs({ left: 102, top: -30, width: 36, height: 26, border: '6px solid #E0603A', borderRadius: '50%', transform: 'rotate(14deg)' })} />
    </div>
  )
}

function SadPig() {
  return (
    <svg viewBox="0 0 110 92" width={132} height={110} role="img" aria-label="시무룩한 돼지">
      <path d="M30 30 L22 12 L46 22 Z" fill="#F4A7B6" stroke="#D97A8E" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 30 L88 12 L64 22 Z" fill="#F4A7B6" stroke="#D97A8E" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="55" cy="52" rx="34" ry="30" fill="#F8C1CC" stroke="#D97A8E" strokeWidth="2" />
      <ellipse cx="55" cy="62" rx="14" ry="10" fill="#F29AAD" stroke="#D97A8E" strokeWidth="2" />
      <ellipse cx="50" cy="62" rx="2.4" ry="3.6" fill="#B5566C" />
      <ellipse cx="60" cy="62" rx="2.4" ry="3.6" fill="#B5566C" />
      <path d="M36 40 q6 5 12 0" fill="none" stroke="#3B2F25" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M62 40 q6 5 12 0" fill="none" stroke="#3B2F25" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M76 46 q3 6 0 9 q-3 -3 0 -9z" fill="#7FB3E6" />
    </svg>
  )
}

function WishGod() {
  return (
    <svg viewBox="0 0 110 92" width={150} height={126} role="img" aria-label="소원을 들어주는 신">
      <ellipse cx="55" cy="17" rx="19" ry="5.5" fill="none" stroke="#F6D77B" strokeWidth="3.5" />
      <circle cx="55" cy="46" r="21" fill="#FBE3CB" stroke="#B98A5E" strokeWidth="2" />
      <path d="M45 44 q4 -4 8 0" fill="none" stroke="#3B2F25" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M57 44 q4 -4 8 0" fill="none" stroke="#3B2F25" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M47 52 q8 8 16 0" fill="#C8452B" stroke="#3B2F25" strokeWidth="2" strokeLinecap="round" />
      <path d="M14 92 q6 -14 20 -12 q6 -10 21 -8 q15 -2 21 8 q14 -2 20 12 Z" fill="#fff" stroke="#E3D3B8" strokeWidth="2" />
    </svg>
  )
}

export default function BoxOpening(props: {
  phase: Phase
  reward: Reward | null
  canAgain: boolean
  onClose: () => void
  onAgain: () => void
  onCoupons: () => void
}) {
  const { phase, reward } = props

  if (phase !== 'result' || !reward) {
    return (
      <div className="open-stage" style={{ background: '#3B2F25' }} role="status" aria-live="polite">
        <div className="open-inner" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 24 }}>
          {phase === 'shake' ? (
            <>
              <div className="hand" style={{ fontSize: 44, color: '#F6D77B' }}>두근두근…</div>
              <div className="shake-fast" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Lid />
                <OpenBox />
              </div>
            </>
          ) : (
            <>
              <span className="flash" style={abs({ left: '50%', top: '45%', width: 560, height: 560, margin: '-280px 0 0 -280px', borderRadius: '50%', background: 'radial-gradient(circle, #fff 0%, #FFF1A8 30%, rgba(255,241,168,0) 68%)' })} />
              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Lid className="lid-fly" />
                <OpenBox />
              </div>
              <div className="hand" style={{ position: 'relative', fontSize: 64, color: '#FFF1A8' }}>펑!</div>
            </>
          )}
        </div>
      </div>
    )
  }

  const t = themeOf(reward)
  const miss = !!reward.refund
  const legend = reward.grade === 'legend'

  return (
    <div className="open-stage" style={{ background: t.bg }} role="dialog" aria-modal="true" aria-label={`뽑기 결과: ${reward.name}`}>
      <div className="open-inner">
        {t.rays && <span className="rays" style={{ background: t.rays }} />}
        {t.confetti && CONFETTI.map((c, i) => <span key={i} className="conf" style={c} />)}
        {t.sparks?.map((color, i) => <span key={i} className="spark" style={{ ...SPARK_POS[i], background: color, animationDelay: `${i * 0.4}s` }} />)}

        <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: 'calc(40px + var(--safe-t)) 24px calc(28px + var(--safe-b))', gap: 18 }}>
          <div className="hand" style={{ fontSize: 22, color: t.ink }}>{t.title}</div>

          {/* 도장 / 신 / 먼지 */}
          <div style={{ height: 134, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {t.stamp && (
              <span className="big-stamp" style={{ width: t.stamp.size, height: t.stamp.size, border: `${legend ? 6 : 4}px solid ${t.stamp.color}`, color: t.stamp.color, fontSize: t.stamp.size * 0.32, background: t.stamp.bg }}>
                {t.stamp.text}
              </span>
            )}
            {reward.id === 'wish' && <WishGod />}
          </div>

          <div style={{ position: 'relative' }}>
            {miss && (
              <>
                <span className="puff" style={{ left: 30, top: -40, width: 46, height: 46, background: '#CFC4B4' }} />
                <span className="puff" style={{ left: 90, top: -60, width: 56, height: 56, background: '#D9CFC0', animationDelay: '.4s' }} />
                <span className="puff" style={{ left: 60, top: -80, width: 36, height: 36, background: '#CFC4B4', animationDelay: '.8s' }} />
              </>
            )}
            <OpenBox ribbon={legend ? '#F6D77B' : '#E0603A'} dull={miss} />
          </div>

          {miss ? (
            <>
              <SadPig />
              <div className="hand" style={{ fontSize: 56, color: t.ink, lineHeight: 1 }}>꽝!</div>
            </>
          ) : (
            <div
              className="ticket result-ticket"
              style={{
                width: '100%',
                maxWidth: 320,
                boxShadow:
                  reward.id === 'wish'
                    ? '0 0 0 3px #F6D77B, 0 0 0 7px #DDB3F2, 0 0 50px rgba(246,215,123,.7)'
                    : legend
                      ? '0 0 0 3px #F6D77B, 0 0 40px rgba(246,215,123,.6)'
                      : reward.grade === 'rare'
                        ? '0 0 0 3px #C9C9E8, 0 18px 30px -14px rgba(0,0,0,.45)'
                        : '0 18px 30px -14px rgba(0,0,0,.45)',
              }}
            >
              <div className="stub" style={{ background: GRADE_COLOR[reward.grade], borderRightColor: '#fff' }}>
                <span style={{ fontSize: 11 }}>{GRADE_LABEL[reward.grade]}</span>
                <span className="hand">{reward.stub}</span>
              </div>
              <span className="notch" style={{ top: -8, background: t.bg }} />
              <span className="notch" style={{ bottom: -8, background: t.bg }} />
              <div style={{ flex: 1, padding: '16px 14px', minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 17 }}>{reward.name}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{reward.desc}</div>
              </div>
            </div>
          )}

          <div className={reward.id === 'wish' ? 'hand' : undefined} style={{ fontSize: reward.id === 'wish' ? 24 : 15, color: legend ? '#F4ECDD' : t.ink, textAlign: 'center' }}>
            {reward.id === 'wish' ? <span style={{ color: '#F6D77B' }}>{t.line}</span> : t.line}
          </div>

          <div className="row" style={{ marginTop: 'auto', width: '100%', gap: 10 }}>
            {legend ? (
              <button className="btn" style={{ flex: 1, background: '#F6D77B', color: '#3B2F25' }} onClick={props.onCoupons}>
                {reward.id === 'wish' ? '소원 쓰러 가기' : '바로 쓰러 가기'}
              </button>
            ) : (
              <>
                <button className="btn ghost" style={{ flex: 1 }} onClick={miss ? props.onClose : props.onCoupons}>
                  {miss ? '닫기' : '쿠폰함 보기'}
                </button>
                <button className="btn" style={{ flex: 1.4 }} disabled={!props.canAgain} onClick={props.onAgain}>
                  한 번 더 (30P)
                </button>
              </>
            )}
          </div>
          {legend && (
            <button onClick={props.onClose} style={{ background: 'none', border: 0, color: '#D9CBB5', fontSize: 14, padding: 8 }}>
              닫기
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
