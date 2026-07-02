import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { Mail, Lock, Loader2, Shield } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

export function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { t } = useLanguage()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { data, error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    if (authErr) {
      setError(t('login.error_invalid'))
    } else {
      console.log('--- OFFICER LOGIN DEBUG ---');
      console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
      console.log('VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY?.substring(0, 10) + '...');
      console.log('loginResult:', { data, authErr });
      
      const { data: sessionData } = await supabase.auth.getSession();
      console.log('session:', sessionData.session);
      
      const { data: userData } = await supabase.auth.getUser();
      console.log('user:', userData.user);
      console.log('auth uid:', userData.user?.id);
      console.log('JWT metadata (user_metadata):', userData.user?.user_metadata);
      console.log('JWT metadata (app_metadata):', userData.user?.app_metadata);
      
      onLogin(data.user)
    }
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">MCD</div>
          <div>
            <div className="login-logo-text">{t('app.brand')}</div>
            <div className="login-logo-sub">{t('login.officer_portal')}</div>
          </div>
        </div>

        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{t('login.sign_in')}</h1>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{t('login.access_desc')}</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 20 }}>
            <Shield size={16} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="form-group">
            <label className="form-label">{t('login.email')}</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 40 }}
                type="email"
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('login.password')}</label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
              <input
                className="form-input"
                style={{ paddingLeft: 40 }}
                type="password"
                placeholder={t('login.password_placeholder')}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%', marginTop: 4 }} disabled={loading}>
            {loading ? <Loader2 size={18} className="spinner" /> : null}
            {loading ? t('login.signing_in') : t('login.sign_in')}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
          <p style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.6 }}>
            {t('login.not_officer')}{' '}
            <Link to="/apply" style={{ color: 'var(--primary)', fontWeight: 600 }}>{t('login.apply_here')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
