import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { SocketProvider } from './context/SocketContext.jsx'
import { LibraryProvider } from './context/LibraryContext.jsx'
import { OnboardingProvider } from './context/OnboardingContext.jsx'
import { WriteHeaderProvider } from './context/WriteHeaderContext.jsx'

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
