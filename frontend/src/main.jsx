import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { i18nReady } from './i18n'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { WriteHeaderProvider } from './context/WriteHeaderContext.jsx'

// Çeviri dosyaları artık diline göre lazy yükleniyor (bkz. i18n/index.js) —
// uygulamayı bu tamamlanmadan render etmek, ilk açılışta bir an için ham
// çeviri anahtarlarının ("home.search.placeholder" gibi) görünmesine yol
// açardı. Gecikme tek seferlik ve küçük (birkaç küçük JSON dosyası).
i18nReady.then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <AuthProvider>
        <SocketProvider>
          <LibraryProvider>
            <OnboardingProvider>
              <WriteHeaderProvider>
                <App />
              </WriteHeaderProvider>
            </OnboardingProvider>
          </LibraryProvider>
        </SocketProvider>
      </AuthProvider>
    </StrictMode>,
  )
})
