// "홈 화면에 추가" 도우미
// - 안드로이드 크롬: 브라우저가 주는 설치 이벤트를 잡아뒀다가 버튼을 누르면 설치 창을 띄워요.
// - 아이폰 Safari: 자동 설치 기능이 없어서 공유 → 홈 화면에 추가 방법을 보여줘요.
// - 카카오톡 같은 앱 안 브라우저: 설치가 안 되니 Safari/크롬으로 열어줘요.
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((f) => f())

// 화면이 뜨기 전에 이벤트가 올 수 있어서 앱 시작할 때 바로 듣기 시작해요.
export function listenForInstall() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

const ua = () => navigator.userAgent

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export const isIOS = () => /iPhone|iPad|iPod/i.test(ua()) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
export const isAndroid = () => /Android/i.test(ua())
const inKakao = () => /KAKAOTALK/i.test(ua())
const inOtherInApp = () => /NAVER\(inapp|Instagram|FBAN|FBAV|Line\//i.test(ua())
/** 아이폰에서 Safari 가 아닌 브라우저(크롬, 네이버앱 등) */
const iosNotSafari = () => isIOS() && /CriOS|FxiOS|EdgiOS|Whale|NAVER/i.test(ua())

export type InstallMode =
  | 'installed' // 이미 앱으로 열림
  | 'prompt' // 버튼 한 번으로 설치 가능 (안드로이드 크롬 등)
  | 'ios' // 아이폰 Safari: 공유 → 홈 화면에 추가
  | 'open-external' // 앱 안 브라우저/다른 브라우저: Safari·크롬으로 열기
  | 'manual' // 그 밖의 경우: 브라우저 메뉴에서 설치

export function useInstall() {
  const [, force] = useState(0)
  useEffect(() => {
    const f = () => force((n) => n + 1)
    listeners.add(f)
    return () => {
      listeners.delete(f)
    }
  }, [])

  let mode: InstallMode
  if (isStandalone()) mode = 'installed'
  else if (inKakao() || inOtherInApp() || iosNotSafari()) mode = 'open-external'
  else if (deferred) mode = 'prompt'
  else if (isIOS()) mode = 'ios'
  else mode = 'manual'

  const install = async () => {
    if (!deferred) return false
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    deferred = null
    notify()
    return outcome === 'accepted'
  }

  return { mode, install }
}

/** 지금 주소를 Safari(아이폰) / 크롬(안드로이드)으로 열기 */
export function openInRealBrowser() {
  const url = window.location.href.split('?')[0]
  if (isAndroid()) {
    const noScheme = url.replace(/^https?:\/\//, '')
    window.location.href = `intent://${noScheme}#Intent;scheme=https;package=com.android.chrome;end`
  } else if (inKakao()) {
    window.location.href = `kakaotalk://web/openExternal?url=${encodeURIComponent(url)}`
  } else {
    // 아이폰 다른 앱: 자동으로 못 여니 주소를 복사해 둬요
    navigator.clipboard?.writeText(url).catch(() => undefined)
    return false
  }
  return true
}
