import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import { useNavigate } from 'react-router-dom'
import { FileText, Clock, CheckCircle2, XCircle, ArrowRight, TrendingUp, Users } from 'lucide-react'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

export function DashboardPage() {
  const nav = useNavigate()
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [driverCount, setDriverCount] = useState(0)

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: apps }, { count: drivers }] = await Promise.all([
        supabase.from('driver_applications').select('id, application_status, full_name, email, submitted_at').order('submitted_at', { ascending: false }).limit(100),
        supabase.from('drivers').select('id', { count: 'exact', head: true })
      ])
      const all = apps ?? []
      setStats({
        total: all.length,
        pending: all.filter(a => a.application_status === 'pending').length,
        approved: all.filter(a => a.application_status === 'approved').length,
        rejected: all.filter(a => a.application_status === 'rejected').length,
      })
      setRecent(all.slice(0, 8))
      setDriverCount(drivers ?? 0)
      setLoading(false)
    }
    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Applications', value: stats.total, icon: FileText, color: 'var(--primary)', bg: 'var(--primary-light)' },
    { label: 'Pending Review', value: stats.pending, icon: Clock, color: 'var(--warning)', bg: 'var(--warning-light)' },
    { label: 'Approved', value: stats.approved, icon: CheckCircle2, color: 'var(--success)', bg: 'var(--success-light)' },
    { label: 'Rejected', value: stats.rejected, icon: XCircle, color: 'var(--danger)', bg: 'var(--danger-light)' },
  ]

  return (
    <div className="page-content">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Dashboard</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>Overview of driver recruitment activity.</p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="stat-card">
            <div className="stat-icon" style={{ background: bg }}>
              <Icon size={22} color={color} />
            </div>
            <div>
              <div className="stat-value">{loading ? '—' : value}</div>
              <div className="stat-label">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Active Drivers Banner */}
      <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)', borderRadius: 16, padding: '20px 24px', marginBottom: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, color: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, background: 'rgba(255,255,255,0.2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: 28, fontWeight: 800, lineHeight: 1 }}>{driverCount}</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>Active Drivers in the System</div>
          </div>
        </div>
        <div style={{ fontSize: 12, opacity: 0.75 }}>Shared with Driver App →</div>
      </div>

      {/* Recent Applications */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Applications</span>
          <button className="btn btn-outline btn-sm" onClick={() => nav('/applications')}>
            View All <ArrowRight size={14} />
          </button>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Email</th>
                <th>Submitted</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>Loading...</td></tr>
              ) : recent.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--muted)' }}>No applications yet.</td></tr>
              ) : recent.map(app => (
                <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/applications/${app.id}`)}>
                  <td style={{ fontWeight: 600 }}>{app.full_name}</td>
                  <td style={{ color: 'var(--muted)' }}>{app.email}</td>
                  <td style={{ color: 'var(--muted)' }}>{fmt(app.submitted_at)}</td>
                  <td><StatusBadge status={app.application_status} /></td>
                  <td><ArrowRight size={15} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatusBadge({ status }) {
  const map = { pending: ['badge-pending', '● Pending'], approved: ['badge-approved', '✓ Approved'], rejected: ['badge-rejected', '✗ Rejected'] }
  const [cls, label] = map[status] ?? ['badge-pending', status]
  return <span className={`badge ${cls}`}>{label}</span>
}
