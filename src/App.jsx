import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import RequireAuth from './components/auth/RequireAuth'
import SplashScreen from './components/SplashScreen'

import Login          from './pages/Login.jsx'
import Dashboard      from './pages/Dashboard.jsx'
import Leads          from './pages/Leads.jsx'
import LeadDetailPage from './pages/LeadDetailPage.jsx'
import Agents         from './pages/Agents.jsx'
import Reports        from './pages/Reports.jsx'

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
        </BrowserRouter>
      </AuthProvider>
    </>
  )
}
