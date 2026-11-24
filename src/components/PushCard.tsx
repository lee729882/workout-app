import { useEffect, useState } from 'react'
import { enablePush, pushState, type PushState } from '../lib/push'

/** 알림이 꺼져 있으면 보여주는 카드. 켜지면 사라져요 */
export default function PushCard({ who }: { who: 'user' | 'admin' }) {
  const [state, setState] = useState<PushState | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    pushState().then(setState, () => setState('unavailable'))
  }, [])

  if (!state || state === 'on' || state === 'unavailable') return null

  const desc =
    who === 'admin' ? '운동 완료 요청이나 쿠폰 요청이 오면 바로 알려줘요' : '승인되거나 보너스를 받으면 바로 알려줘요'

  return (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '14px 16px', background: '#fffdf8' }}>
      <div className="row" style={{ gap: 12 }}>
        <span aria-hidden="true" style={{ fontSize: 26 }}>🔔</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 14 }}>알림 켜기</div>
          <div className="muted" style={{ fontSize: 12 }}>
            {state === 'need-install'
              ? '아이폰은 홈 화면에 추가한 앱에서만 알림을 받을 수 있어요'
              : state === 'denied'
                ? '알림이 막혀 있어요. 휴대폰 설정 > 알림 에서 오운완을 허용해 주세요'
                : desc}
          </div>
        </div>
        {state === 'off' && (
          <button
            className="btn sm"
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              setErr(null)
              try {
                setState(await enablePush())
              } catch (e) {
                setErr(e instanceof Error ? e.message : '알림을 켜지 못했어요')
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? '켜는 중…' : '켜기'}
          </button>
        )}
      </div>
      {err && <div style={{ fontSize: 12, color: 'var(--stamp)' }}>{err}</div>}
    </div>
  )
}
