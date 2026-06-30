import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/client'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, User, Phone, Mail, MapPin, CreditCard, Car,
  FileText, CheckCircle2, XCircle, Copy, Check, Loader2,
  Calendar, Clock, Shield, ExternalLink
} from 'lucide-react'

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function StatusBadge({ status }) {
  const map = {
    pending:  ['badge-pending',  'clock', '● Pending'],
    approved: ['badge-approved', null,    '✓ Approved'],
    rejected: ['badge-rejected', null,    '✗ Rejected'],
  }
  const [cls, , label] = map[status] ?? ['badge-pending', null, status]
  return <span className={`badge ${cls}`} style={{ fontSize: 13, padding: '4px 14px' }}>{label}</span>
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 36, height: 36, background: 'var(--bg)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'var(--muted)' }}>
        <Icon size={16} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value || '—'}</div>
      </div>
    </div>
  )
}

function DocCard({ label, url }) {
  if (!url) return (
    <div style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: 20, textAlign: 'center', color: 'var(--muted)' }}>
      <FileText size={20} style={{ marginBottom: 6 }} />
      <div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 11, marginTop: 2 }}>Not uploaded</div>
    </div>
  )
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{
      border: '1px solid var(--border)', borderRadius: 10, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8, cursor: 'pointer', background: 'var(--bg)',
      textDecoration: 'none', color: 'var(--text)', transition: 'border-color 0.15s'
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      {url.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
        <img src={url} alt={label} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
      ) : (
        <div style={{ height: 80, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-light)', borderRadius: 6 }}>
          <FileText size={32} color="var(--primary)" />
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{label}</span>
        <ExternalLink size={12} color="var(--muted)" />
      </div>
    </a>
  )
}

function CredentialsModal({ data, onClose }) {
  const [copied, setCopied] = useState(false)
  const copyAll = () => {
    const text = `Driver Credentials\nDriver Code: ${data.driverCode}\nEmail: ${data.email}\nPassword: ${data.tempPassword}`
    navigator.clipboard?.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={32} color="var(--success)" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Driver Approved!</h2>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>
            A Supabase account has been created. Share these credentials with <strong>{data.fullName}</strong>.
          </p>
        </div>

        <div className="cred-box" style={{ marginBottom: 20 }}>
          <div className="cred-row">
            <span className="cred-label">Driver Code</span>
            <span className="cred-value">{data.driverCode}</span>
          </div>
          <div style={{ borderBottom: '1px solid var(--border)' }} />
          <div className="cred-row">
            <span className="cred-label">Email Address</span>
            <span className="cred-value">{data.email}</span>
          </div>
          <div style={{ borderBottom: '1px solid var(--border)' }} />
          <div className="cred-row">
            <span className="cred-label">Temporary Password</span>
            <span className="cred-value" style={{ color: 'var(--primary)' }}>{data.tempPassword}</span>
          </div>
        </div>

        <div className="alert alert-info" style={{ marginBottom: 20, fontSize: 13 }}>
          <Shield size={15} style={{ flexShrink: 0 }} />
          The driver can log in immediately using these credentials in the Dhalao Driver App.
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={copyAll}>
            {copied ? <Check size={16} color="var(--success)" /> : <Copy size={16} />}
            {copied ? 'Copied!' : 'Copy Credentials'}
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function RejectModal({ onConfirm, onClose, loading }) {
  const [remarks, setRemarks] = useState('')
  return (
    <div className="modal-overlay">
      <div className="modal">
        <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, color: 'var(--text)' }}>Reject Application</h2>
        <p style={{ fontSize: 14, color: 'var(--muted)', marginBottom: 20 }}>
          Please provide a reason for rejection. This will be stored for records.
        </p>
        <div className="form-group" style={{ marginBottom: 24 }}>
          <label className="form-label">Rejection Remarks <span className="form-required">*</span></label>
          <textarea
            className="form-textarea"
            placeholder="e.g. Incomplete documents, invalid licence..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={4}
          />
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-outline" style={{ flex: 1 }} onClick={onClose} disabled={loading}>Cancel</button>
          <button className="btn btn-danger" style={{ flex: 1 }} onClick={() => onConfirm(remarks)} disabled={!remarks.trim() || loading}>
            {loading ? <Loader2 size={15} className="spinner" /> : <XCircle size={15} />}
            Confirm Reject
          </button>
        </div>
      </div>
    </div>
  )
}

export function ApplicationDetailPage({ officer }) {
  const { id } = useParams()
  const nav = useNavigate()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState('')
  const [credentials, setCredentials] = useState(null)
  const [showReject, setShowReject] = useState(false)

  const fetch = useCallback(async () => {
    const { data } = await supabase
      .from('driver_applications')
      .select('*')
      .eq('id', id)
      .single()
    setApp(data)
    setLoading(false)
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  const handleApprove = async () => {
    setActionLoading(true)
    setError('')
    try {
      const { data, error } = await supabase.functions.invoke('approve-driver', {
        body: { applicationId: id, approvedBy: officer?.email ?? 'Officer' }
      });
      
      if (error) {
        let msg = error.message;
        if (error.context && typeof error.context.text === 'function') {
          msg = await error.context.text();
        }
        throw new Error(msg);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || 'Approval failed on the backend');
      }
      
      setCredentials(data)
      await fetch()
    } catch (err) {
      setError(err.message || 'Approval failed. Please try again.')
    }
    setActionLoading(false)
  }

  const handleReject = async (remarks) => {
    setActionLoading(true)
    setError('')
    const { error: rpcErr } = await supabase.rpc('reject_driver_application', {
      p_application_id: id,
      p_remarks: remarks,
      p_rejected_by: officer?.email ?? 'Officer'
    })
    if (rpcErr) { setError(rpcErr.message); setActionLoading(false); return }
    setShowReject(false)
    await fetch()
    setActionLoading(false)
  }

  if (loading) return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
      <Loader2 size={24} className="spinner" />
    </div>
  )
  if (!app) return (
    <div className="page-content"><p>Application not found.</p></div>
  )

  const isPending = app.application_status === 'pending'

  return (
    <div className="page-content">
      {credentials && <CredentialsModal data={credentials} onClose={() => setCredentials(null)} />}
      {showReject && <RejectModal onConfirm={handleReject} onClose={() => setShowReject(false)} loading={actionLoading} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => nav('/applications')}>
          <ArrowLeft size={16} /> Back
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)' }}>{app.full_name}</h1>
          <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 2 }}>Application #{id.slice(0, 8).toUpperCase()}</div>
        </div>
        <StatusBadge status={app.application_status} />
      </div>

      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          <XCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {/* Action Buttons (only for pending) */}
      {isPending && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
          <button className="btn btn-success" style={{ flex: 1, height: 48, fontSize: 15 }} onClick={handleApprove} disabled={actionLoading}>
            {actionLoading ? <Loader2 size={18} className="spinner" /> : <CheckCircle2 size={18} />}
            Approve & Create Account
          </button>
          <button className="btn btn-danger btn-outline" style={{ height: 48, paddingInline: 24, fontSize: 15, background: 'transparent', color: 'var(--danger)', border: '1.5px solid var(--danger)' }} onClick={() => setShowReject(true)} disabled={actionLoading}>
            <XCircle size={18} /> Reject
          </button>
        </div>
      )}

      {/* Approval/Rejection result */}
      {app.application_status === 'approved' && (
        <div className="alert alert-success" style={{ marginBottom: 24 }}>
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>Approved by <strong>{app.approved_by}</strong> on {fmt(app.approved_at)}. Driver Code: <strong>{app.generated_driver_code}</strong></span>
        </div>
      )}
      {app.application_status === 'rejected' && (
        <div className="alert alert-error" style={{ marginBottom: 24 }}>
          <XCircle size={16} style={{ flexShrink: 0 }} />
          <span>Rejected by <strong>{app.approved_by}</strong>. Reason: {app.rejection_remarks}</span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Personal Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Personal Information</span>
          </div>
          <div className="card-body" style={{ padding: '0 24px' }}>
            <InfoRow icon={User}     label="Full Name"     value={app.full_name} />
            <InfoRow icon={Mail}     label="Email"         value={app.email} />
            <InfoRow icon={Phone}    label="Phone"         value={app.phone} />
            <InfoRow icon={Calendar} label="Date of Birth" value={fmt(app.date_of_birth)} />
            <InfoRow icon={MapPin}   label="Address"       value={app.address} />
          </div>
        </div>

        {/* Licence Info */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Licence & Vehicle</span>
          </div>
          <div className="card-body" style={{ padding: '0 24px' }}>
            <InfoRow icon={CreditCard} label="Aadhaar Number"   value={app.aadhaar_number} />
            <InfoRow icon={FileText}   label="Licence Number"   value={app.licence_number} />
            <InfoRow icon={Calendar}   label="Licence Expiry"   value={fmt(app.licence_expiry)} />
            <InfoRow icon={Car}        label="Vehicle Type"     value={app.vehicle_type} />
            <InfoRow icon={Clock}      label="Years Experience" value={app.years_experience ? `${app.years_experience} years` : null} />
          </div>
        </div>

        {/* Documents */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Uploaded Documents</span>
          </div>
          <div style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14 }}>
            <DocCard label="Passport Photo"      url={app.photo_url} />
            <DocCard label="Aadhaar Card"        url={app.aadhaar_url} />
            <DocCard label="Driving Licence"     url={app.licence_url} />
            <DocCard label="Police Verification" url={app.police_verification_url} />
            <DocCard label="Address Proof"       url={app.address_proof_url} />
          </div>
        </div>

        {/* Emergency Contact */}
        {(app.emergency_contact_name || app.emergency_contact_phone) && (
          <div className="card">
            <div className="card-header"><span className="card-title">Emergency Contact</span></div>
            <div className="card-body" style={{ padding: '0 24px' }}>
              <InfoRow icon={User}  label="Name"  value={app.emergency_contact_name} />
              <InfoRow icon={Phone} label="Phone" value={app.emergency_contact_phone} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
