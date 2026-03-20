import { useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/auth/RequireAuth'
import SplashScreen from './components/SplashScreen'

// Login loads eagerly — it's the first thing users see
import Login from './pages/Login.jsx'

// All other pages are lazy-loaded — split into separate chunks
const Dashboard      = lazy(() => import('./pages/Dashboard.jsx'))
const Leads          = lazy(() => import('./pages/Leads.jsx'))
const LeadDetailPage = lazy(() => import('./pages/LeadDetailPage.jsx'))
const Agents         = lazy(() => import('./pages/Agents.jsx'))
const Reports        = lazy(() => import('./pages/Reports.jsx'))

function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#F1F5F9' }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid rgba(27,58,107,0.15)', borderTopColor: '#1B3A6B', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}

export default function App() {
  // Show splash once per browser session
  const [showSplash, setShowSplash] = useState(
    () => !sessionStorage.getItem('splashSeen')
  )

  function handleSplashDone() {
    sessionStorage.setItem('splashSeen', '1')
    setShowSplash(false)
  }

  return (
    <>
      {showSplash && <SplashScreen onDone={handleSplashDone} />}
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            <Route path="/dashboard" element={
              <RequireAuth><Dashboard /></RequireAuth>
            } />
            <Route path="/leads" element={
              <RequireAuth><Leads /></RequireAuth>
            } />
            <Route path="/leads/:id" element={
              <RequireAuth><LeadDetailPage /></RequireAuth>
            } />
            <Route path="/agents" element={
              <RequireAuth><Agents /></RequireAuth>
            } />
            <Route path="/reports" element={<Reports />} />

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
          </Suspense>
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}
