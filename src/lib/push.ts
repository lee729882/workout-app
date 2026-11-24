// 휴대폰 알림 켜기/끄기
import { isIOS, isStandalone } from './install'
import { supabase } from './supabase'

const VAPID = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined

export type PushState =
  | 'unavailable' // 이 브라우저는 알림 불가 / 설정 없음
  | 'need-install' // 아이폰: 홈 화면에 추가한 앱에서만 가능
  | 'denied' // 사용자가 거절함
  | 'off' // 켤 수 있음
  | 'on' // 켜져 있음

const supported = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function b64ToBytes(b64: string) {
  const pad = '='.repeat((4 - (b64.length % 4)) % 4)
  const raw = atob((b64 + pad).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

async function save(sub: PushSubscription) {
  const j = sub.toJSON()
  const { error } = await supabase!
    .from('push_subscriptions')
    .upsert({ endpoint: sub.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth }, { onConflict: 'endpoint' })
  if (error) throw error
}

export async function pushState(): Promise<PushState> {
  if (!supabase || !VAPID) return 'unavailable'
  if (isIOS() && !isStandalone()) return 'need-install'
  if (!supported()) return 'unavailable'
  if (Notification.permission === 'denied') return 'denied'
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub && Notification.permission === 'granted') {
    save(sub).catch(() => undefined) // 로그인한 계정에 다시 연결
    return 'on'
  }
  return 'off'
}

/** 버튼을 눌렀을 때만 불러야 해요 (아이폰 규칙) */
export async function enablePush(): Promise<PushState> {
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return perm === 'denied' ? 'denied' : 'off'
  const reg = await navigator.serviceWorker.ready
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64ToBytes(VAPID!) }))
  await save(sub)
  return 'on'
}

export async function disablePush(): Promise<PushState> {
  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.getSubscription()
  if (sub) {
    await supabase!.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
    await sub.unsubscribe()
  }
  return 'off'
}
