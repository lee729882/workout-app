import { useState, type ReactNode } from 'react'
import { IconCalendar, IconCheck, IconGift, IconHome, IconList, IconLogout, IconSliders, IconTicket } from './components/Icons'
import { useStore } from './lib/store'
import Login from './screens/Login'
import Today from './screens/Today'
import Calendar from './screens/Calendar'
import Shop from './screens/Shop'
import Coupons from './screens/Coupons'
import { AdminApprove, AdminPoints, AdminShop } from './screens/Admin'

type Tab = { id: string; label: string; icon: ReactNode; screen: ReactNode; badge?: number }

export default function App() {
  const store = useStore()
  const [tab, setTab] = useState('home')

  if (!store.ready) {
    return (
      <div className="app" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="hand" style={{ fontSize: 28 }}>불러오는 중…</span>
      </div>
    )
  }
  if (!store.role) return <div className="app"><Login /></div>

  const pendingReq = store.requests.filter((r) => r.status === 'pending').length
  const pendingCoupon = store.coupons.filter((c) => c.status === 'requested').length

  const tabs: Tab[] =
    store.role === 'user'
      ? [
          { id: 'home', label: '오늘', icon: <IconHome />, screen: <Today /> },
          { id: 'cal', label: '캘린더', icon: <IconCalendar />, screen: <Calendar /> },
          { id: 'shop', label: '상점', icon: <IconGift />, screen: <Shop onGoCoupons={() => setTab('coupon')} /> },
          { id: 'coupon', label: '쿠폰함', icon: <IconTicket />, screen: <Coupons /> },
        ]
      : [
          { id: 'home', label: '승인', icon: <IconCheck />, screen: <AdminApprove />, badge: pendingReq + pendingCoupon },
          { id: 'cal', label: '캘린더', icon: <IconCalendar />, screen: <Calendar /> },
          { id: 'shop', label: '상점 설정', icon: <IconSliders />, screen: <AdminShop /> },
          { id: 'points', label: '포인트', icon: <IconList />, screen: <AdminPoints /> },
        ]

  const current = tabs.find((t) => t.id === tab) ?? tabs[0]

  return (
    <div className="app">
      {current.screen}
      <nav className="tabs" aria-label="메뉴">
        {tabs.map((t) => (
          <button key={t.id} className="tab" aria-current={t.id === current.id ? 'page' : undefined} onClick={() => setTab(t.id)}>
            {t.icon}
            {t.label}
            {!!t.badge && <span className="badge">{t.badge}</span>}
          </button>
        ))}
        <button
          className="tab"
          onClick={() => {
            store.signOut()
            setTab('home')
          }}
        >
          <IconLogout />
          나가기
        </button>
      </nav>
    </div>
  )
}
