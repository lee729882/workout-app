import { useState, type ReactNode } from 'react'
import { God, Pig } from '../components/Avatars'
import { useStore, type Role } from '../lib/store'

export default function Login() {
  const { setRole } = useStore()
  const [who, setWho] = useState<Role>('user')
  const [pin, setPin] = useState('')

  // 임시 모드: 아무 4자리나 통과. Supabase 연결 후 진짜 로그인으로 바뀌어요.
  const ready = pin.length === 4

  return (
    <main className="screen" style={{ alignItems: 'center', paddingBottom: 'calc(28px + var(--safe-b))', minHeight: '100dvh' }}>
      <h1 className="title" style={{ fontSize: 44, textAlign: 'center' }}>오운완 다이어리</h1>
      <p className="muted small" style={{ margin: '-6px 0 0' }}>오늘 운동 완료, 우리 둘만의 기록장</p>

      <figure style={{ position: 'relative', margin: '10px 0 0', background: '#fff', padding: '10px 10px 0', boxShadow: '0 14px 26px -12px rgba(59,47,37,.5)', transform: 'rotate(-2deg)', width: 'min(322px, 100%)' }}>
        <span className="tape" style={{ top: -12, left: 24, transform: 'rotate(-8deg)' }} />
        <span className="tape" style={{ top: -10, right: 22, transform: 'rotate(9deg)', background: 'rgba(239,177,181,.8)' }} />
        <img
          src="/images/login-couple.webp"
          alt="둘이 나란히 걷는 겨울 산책 사진"
          style={{ display: 'block', width: '100%', aspectRatio: '4 / 3', objectFit: 'cover', objectPosition: '50% 62%' }}
        />
        <figcaption className="hand" style={{ fontSize: 21, padding: '8px 4px 10px', textAlign: 'center' }}>
          같이 걸으려면 체력부터!
        </figcaption>
      </figure>

      <div className="hand" style={{ fontSize: 22, marginTop: 8 }}>누가 왔나요?</div>
      <div className="row" style={{ gap: 22 }} role="radiogroup" aria-label="누구로 들어갈지 고르기">
        <ProfileButton label="운동러" selected={who === 'user'} onClick={() => setWho('user')} tilt={-4}>
          <Pig />
        </ProfileButton>
        <ProfileButton label="관리자 (신)" selected={who === 'admin'} onClick={() => setWho('admin')} tilt={5}>
          <God />
        </ProfileButton>
      </div>

      <label className="muted small" style={{ marginTop: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'relative' }}>
        비밀번호 4자리
        <span className="row" style={{ gap: 16 }} aria-hidden="true">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--brown)', background: i < pin.length ? 'var(--brown)' : 'transparent' }} />
          ))}
        </span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          maxLength={4}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
          style={{ position: 'absolute', inset: 0, opacity: 0 }}
        />
      </label>

      <button className="btn" style={{ width: '100%', marginTop: 'auto' }} disabled={!ready} onClick={() => setRole(who)}>
        들어가기
      </button>
      <p className="muted" style={{ fontSize: 12, margin: 0 }}>계정은 관리자가 만들어 줘요</p>
    </main>
  )
}

function ProfileButton(props: { label: string; selected: boolean; onClick: () => void; tilt: number; children: ReactNode }) {
  return (
    <button
      role="radio"
      aria-checked={props.selected}
      onClick={props.onClick}
      style={{
        background: '#fff',
        border: 0,
        padding: '8px 8px 6px',
        boxShadow: '0 10px 18px -8px rgba(59,47,37,.45)',
        transform: `rotate(${props.tilt}deg)`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        outline: props.selected ? '3px solid var(--brown)' : 'none',
        outlineOffset: 4,
      }}
    >
      {props.children}
      <span className="hand" style={{ fontSize: 19 }}>{props.label}</span>
    </button>
  )
}
