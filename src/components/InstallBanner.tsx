import { useState } from 'react'
import { isIOS, openInRealBrowser, useInstall } from '../lib/install'
import { IconClose } from './Icons'

const HIDE_KEY = 'oww.install.hidden'

function hiddenRecently() {
  try {
    const t = Number(localStorage.getItem(HIDE_KEY) ?? 0)
    return Date.now() - t < 3 * 24 * 60 * 60 * 1000 // 닫으면 3일 동안 안 보여요
  } catch {
    return false
  }
}

/** 홈 화면에 아직 안 깔았으면 보여주는 설치 카드. dismissible=false 면 닫기 버튼 없음 */
export default function InstallBanner({ dismissible = true }: { dismissible?: boolean }) {
  const { mode, install } = useInstall()
  const [hidden, setHidden] = useState(() => dismissible && hiddenRecently())
  const [guide, setGuide] = useState(false)
  const [copied, setCopied] = useState(false)

  if (mode === 'installed' || hidden) return null

  const hide = () => {
    setHidden(true)
    try {
      localStorage.setItem(HIDE_KEY, String(Date.now()))
    } catch {
      /* noop */
    }
  }

  const onClick = async () => {
    if (mode === 'prompt') await install()
    else if (mode === 'open-external') {
      if (!openInRealBrowser()) setCopied(true)
    } else setGuide(true)
  }

  const label =
    mode === 'prompt' ? '앱 설치하기' : mode === 'open-external' ? (isIOS() ? 'Safari로 열기' : '크롬으로 열기') : '설치 방법 보기'

  return (
    <>
      <div className="card row" style={{ gap: 12, padding: '12px 14px', background: '#fff', width: '100%' }}>
        <img src="/apple-touch-icon.png" alt="" width={44} height={44} style={{ borderRadius: 12, flex: 'none' }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>앱으로 설치하기</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {copied ? '주소를 복사했어요. Safari에 붙여 넣어 열어주세요' : mode === 'open-external' ? '여기서는 설치가 안 돼요' : '다음부터 아이콘 눌러서 바로 열려요'}
          </div>
        </div>
        <button className="btn sm" onClick={onClick}>{label}</button>
        {dismissible && (
          <button aria-label="설치 안내 닫기" onClick={hide} style={{ background: 'none', border: 0, padding: 4, color: 'var(--muted)' }}>
            <IconClose size={18} />
          </button>
        )}
      </div>
      {guide && <GuideSheet ios={mode === 'ios'} onClose={() => setGuide(false)} />}
    </>
  )
}

function GuideSheet({ ios, onClose }: { ios: boolean; onClose: () => void }) {
  return (
    <div className="sheet-bg" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label="홈 화면에 추가하는 방법" onClick={(e) => e.stopPropagation()}>
        <h2 className="hand" style={{ fontSize: 28, margin: 0 }}>홈 화면에 추가하기</h2>
        {ios ? (
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15, lineHeight: 1.5 }}>
            <li>
              화면 아래 <b>공유 버튼</b>을 눌러요{' '}
              <ShareIcon />
            </li>
            <li>
              목록을 아래로 내려서 <b>홈 화면에 추가</b>를 눌러요
            </li>
            <li>
              오른쪽 위 <b>추가</b>를 누르면 끝!
            </li>
          </ol>
        ) : (
          <ol style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 14, fontSize: 15, lineHeight: 1.5 }}>
            <li>
              브라우저 오른쪽 위 <b>⋮</b> 메뉴를 눌러요
            </li>
            <li>
              <b>앱 설치</b> 또는 <b>홈 화면에 추가</b>를 눌러요
            </li>
          </ol>
        )}
        {ios && (
          <div className="note" style={{ fontSize: 17 }}>
            공유 버튼이 안 보이면 화면을 살짝 위로 올려보세요. 꼭 <b>Safari</b>에서 해야 해요!
          </div>
        )}
        <button className="btn" onClick={onClose}>알겠어요</button>
      </div>
    </div>
  )
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2f7cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label="공유 아이콘" style={{ verticalAlign: '-4px' }}>
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  )
}
