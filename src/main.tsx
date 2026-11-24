import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles.css'
import App from './App.tsx'
import { StoreProvider } from './lib/store'
import { listenForInstall } from './lib/install'
import { registerSW } from 'virtual:pwa-register'

listenForInstall()
// 새 버전이 배포되면 알아서 받아서 새로고침해요. 한 시간마다 새 버전이 있는지도 확인해요.
registerSW({
  immediate: true,
  onRegisteredSW(_url, reg) {
    if (reg) setInterval(() => reg.update(), 60 * 60 * 1000)
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
