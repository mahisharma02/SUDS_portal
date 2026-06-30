import React, { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter, Routes, Route, Navigate, NavLink, useNavigate } from 'react-router-dom'
import { supabase } from './supabase/client'
import { LayoutDashboard, Users, LogOut, FileText, Menu, X } from 'lucide-react'
import './index.css'

// Pages
import { LoginPage } from './pages/LoginPage'
import { ApplyPage } from './pages/ApplyPage'
import { DashboardPage } from './pages/DashboardPage'
import { ApplicationsPage } from './pages/ApplicationsPage'
import { ApplicationDetailPage } from './pages/ApplicationDetailPage'

export const AppContext = createContext(null)

function Sidebar({ officer, onLogout }) {
  const nav = useNavigate()
  const initials = officer?.email?.slice(0, 2).toUpperCase() ?? 'OF'

  const links = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/applications', icon: FileText, label: 'Applications' },
  ]

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">MCD</div>
        <div>
          <div className="brand-text">Dhalao System</div>
          <div className="brand-sub">Recruitment Portal</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div className="avatar" style={{ width: 36, height: 36, fontSize: 13 }}>{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{officer?.email}</div>
            <div style={{ fontSize: 11, color: 'var(--muted)' }}>Officer</div>
          </div>
        </div>
        <button className="btn btn-outline" style={{ width: '100%' }} onClick={onLogout}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </div>
  )
}

function OfficerLayout({ officer, onLogout }) {
  const nav = useNavigate()
  return (
    <div className="layout">
      <Sidebar officer={officer} onLogout={onLogout} />
      <div className="main">
        <Routes>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/applications" element={<ApplicationsPage />} />
          <Route path="/applications/:id" element={<ApplicationDetailPage officer={officer} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default function App() {
  const [officer, setOfficer] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const handleSession = async (sess) => {
      setOfficer(sess?.user ?? null)
    }

    supabase.auth.getSession().then(({ data }) => {
      handleSession(data.session).then(() => setLoading(false))
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      handleSession(session)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setOfficer(null)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--muted)' }}>
          <div style={{ width: 40, height: 40, background: 'var(--primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: 18, animation: 'pulse 1.5s ease-in-out infinite' }}>MCD</div>
          <p style={{ fontSize: 14 }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <AppContext.Provider value={{ officer }}>
      <BrowserRouter>
        <Routes>
          <Route path="/apply" element={<ApplyPage />} />
          <Route path="/login" element={!officer ? <LoginPage onLogin={setOfficer} /> : <Navigate to="/dashboard" replace />} />
          <Route path="/*" element={officer ? <OfficerLayout officer={officer} onLogout={handleLogout} /> : <Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AppContext.Provider>
  )
}
