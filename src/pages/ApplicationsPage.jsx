import React, { useState, useEffect } from 'react'
import { supabase } from '../supabase/client'
import { useNavigate } from 'react-router-dom'
import { Search, Filter, ArrowRight, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function StatusBadge({ status }) {
  const map = {
    pending:  ['badge-pending',  <Clock size={11} />,       'Pending'],
    approved: ['badge-approved', <CheckCircle2 size={11} />, 'Approved'],
    rejected: ['badge-rejected', <XCircle size={11} />,      'Rejected'],
  }
  const [cls, icon, label] = map[status] ?? ['badge-pending', null, status]
  return <span className={`badge ${cls}`}>{icon}{label}</span>
}

export function ApplicationsPage() {
  const nav = useNavigate()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('driver_applications')
        .select('id, full_name, email, phone, vehicle_type, application_status, submitted_at, generated_driver_code')
        .order('submitted_at', { ascending: false })
      setApps(data ?? [])
      setLoading(false)
    }
    fetch()

    // Realtime: refresh when new application arrives
    const ch = supabase.channel('apps-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'driver_applications' }, fetch)
      .subscribe()
    return () => supabase.removeChannel(ch)
  }, [])

  const filtered = apps.filter(a => {
    const matchSearch = !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || a.application_status === filter
    return matchSearch && matchFilter
  })

  const filterBtns = [
    { key: 'all', label: 'All' },
    { key: 'pending', label: '● Pending' },
    { key: 'approved', label: '✓ Approved' },
    { key: 'rejected', label: '✗ Rejected' },
  ]

  return (
    <div className="page-content">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)' }}>Applications</h1>
        <p style={{ color: 'var(--muted)', fontSize: 14, marginTop: 4 }}>
          Review and manage all service provider applications.
        </p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 38, height: 40 }}
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {filterBtns.map(({ key, label }) => (
            <button
              key={key}
              className={`btn btn-sm ${filter === key ? 'btn-primary' : 'btn-outline'}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Vehicle</th>
                <th>Applied</th>
                <th>Status</th>
                <th>Service Provider Code</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 48, color: 'var(--muted)' }}>Loading applications...</td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9}>
                    <div className="empty-state">
                      <div className="empty-icon"><FileText size={28} color="var(--muted)" /></div>
                      <p style={{ fontSize: 15, fontWeight: 600 }}>No applications found</p>
                      <p style={{ fontSize: 13 }}>Share the application link for applicants to apply.</p>
                      <button className="btn btn-outline btn-sm" onClick={() => navigator.clipboard?.writeText(window.location.origin + '/apply')}>
                        Copy Application Link
                      </button>
                    </div>
                  </td>
                </tr>
              ) : filtered.map((app, i) => (
                <tr key={app.id} style={{ cursor: 'pointer' }} onClick={() => nav(`/applications/${app.id}`)}>
                  <td style={{ color: 'var(--muted)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{app.full_name}</td>
                  <td style={{ color: 'var(--muted)' }}>{app.email}</td>
                  <td style={{ color: 'var(--muted)' }}>{app.phone}</td>
                  <td><span className="tag">{app.vehicle_type}</span></td>
                  <td style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }}>{fmt(app.submitted_at)}</td>
                  <td><StatusBadge status={app.application_status} /></td>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 600, color: 'var(--primary)' }}>{app.generated_driver_code ?? '—'}</td>
                  <td><ArrowRight size={16} color="var(--muted)" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && filtered.length > 0 && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', fontSize: 13, color: 'var(--muted)' }}>
            Showing {filtered.length} of {apps.length} applications
          </div>
        )}
      </div>
    </div>
  )
}
