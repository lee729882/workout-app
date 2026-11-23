// 운동러 = 돼지, 관리자 = 살짝 신. 나중에 진짜 사진으로 바꾸려면 이 컴포넌트만 <img>로 바꾸면 돼요.

export function Pig({ size = 110 }: { size?: number }) {
  return (
    <svg viewBox="0 0 110 92" width={size} height={(size * 92) / 110} role="img" aria-label="돼지" style={{ display: 'block', background: '#FDE8EC' }}>
      <path d="M30 30 L22 8 L46 22 Z" fill="#F4A7B6" stroke="#D97A8E" strokeWidth="2" strokeLinejoin="round" />
      <path d="M80 30 L88 8 L64 22 Z" fill="#F4A7B6" stroke="#D97A8E" strokeWidth="2" strokeLinejoin="round" />
      <ellipse cx="55" cy="52" rx="34" ry="30" fill="#F8C1CC" stroke="#D97A8E" strokeWidth="2" />
      <ellipse cx="55" cy="60" rx="15" ry="11" fill="#F29AAD" stroke="#D97A8E" strokeWidth="2" />
      <ellipse cx="50" cy="60" rx="2.6" ry="4" fill="#B5566C" />
      <ellipse cx="60" cy="60" rx="2.6" ry="4" fill="#B5566C" />
      <circle cx="42" cy="42" r="3.4" fill="#3B2F25" />
      <circle cx="68" cy="42" r="3.4" fill="#3B2F25" />
      <circle cx="43.2" cy="40.8" r="1.1" fill="#fff" />
      <circle cx="69.2" cy="40.8" r="1.1" fill="#fff" />
      <ellipse cx="32" cy="56" rx="6" ry="3.5" fill="#F27C95" opacity=".45" />
      <ellipse cx="78" cy="56" rx="6" ry="3.5" fill="#F27C95" opacity=".45" />
    </svg>
  )
}

export function God({ size = 110 }: { size?: number }) {
  return (
    <svg viewBox="0 0 110 92" width={size} height={(size * 92) / 110} role="img" aria-label="후광이 비치는 관리자" style={{ display: 'block', background: '#FFF4CF' }}>
      <g stroke="#F2C94C" strokeWidth="3" strokeLinecap="round" opacity=".8">
        <path d="M55 46 L55 4" /><path d="M55 46 L20 10" /><path d="M55 46 L90 10" />
        <path d="M55 46 L6 34" /><path d="M55 46 L104 34" /><path d="M55 46 L10 62" /><path d="M55 46 L100 62" />
      </g>
      <ellipse cx="55" cy="17" rx="19" ry="5.5" fill="none" stroke="#E0A800" strokeWidth="3.5" />
      <circle cx="55" cy="46" r="21" fill="#FBE3CB" stroke="#B98A5E" strokeWidth="2" />
      <path d="M45 44 q4 -4 8 0" fill="none" stroke="#3B2F25" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M57 44 q4 -4 8 0" fill="none" stroke="#3B2F25" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M49 53 q6 5 12 0" fill="none" stroke="#3B2F25" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M14 92 q6 -14 20 -12 q6 -10 21 -8 q15 -2 21 8 q14 -2 20 12 Z" fill="#fff" stroke="#E3D3B8" strokeWidth="2" />
    </svg>
  )
}
