import React, { useState, useRef } from 'react'
import { supabase } from '../supabase/client'
import { Upload, Check, Loader2, User, FileText, Shield, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'

const STEPS = ['Personal Info', 'Licence & Vehicle', 'Documents', 'Review & Submit']

function Stepper({ current }) {
  return (
    <div className="stepper">
      {STEPS.map((label, i) => {
        const state = i < current ? 'done' : i === current ? 'active' : 'pending'
        return (
          <React.Fragment key={i}>
            <div className="step">
              <div className={`step-circle ${state}`}>
                {state === 'done' ? <Check size={14} /> : i + 1}
              </div>
              <span className={`step-label ${state}`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`step-line ${i < current ? 'done' : ''}`} />}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function UploadField({ label, required, file, onChange, accept = 'image/*,application/pdf' }) {
  const ref = useRef()
  const hasFile = !!file
  return (
    <div className="form-group">
      <label className="form-label">{label}{required && <span className="form-required">*</span>}</label>
      <div className={`upload-zone ${hasFile ? 'has-file' : ''}`} onClick={() => ref.current?.click()}>
        <input ref={ref} type="file" accept={accept} style={{ display: 'none' }} onChange={e => onChange(e.target.files[0])} />
        {hasFile ? (
          <>
            <Check size={20} color="var(--success)" />
            <span className="upload-label" style={{ color: 'var(--success)' }}>{file.name}</span>
            <span className="upload-sub">Click to replace</span>
          </>
        ) : (
          <>
            <Upload size={20} color="var(--muted)" />
            <span className="upload-label">Click to upload</span>
            <span className="upload-sub">JPG, PNG or PDF · Max 5MB</span>
          </>
        )}
      </div>
    </div>
  )
}

async function uploadFile(file, folder) {
  if (!file) return null
  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage
    .from('driver-documents')
    .upload(path, file, { cacheControl: '3600', upsert: false })
  if (error) throw error
  const { data: urlData } = supabase.storage.from('driver-documents').getPublicUrl(path)
  return urlData.publicUrl
}

export function ApplyPage() {
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '', address: '',
    aadhaar_number: '', licence_number: '', licence_expiry: '', vehicle_type: 'Auto/Mini Truck',
    years_experience: 0, emergency_contact_name: '', emergency_contact_phone: ''
  })
  const [files, setFiles] = useState({
    photo: null, aadhaar: null, licence: null, police_verification: null, address_proof: null
  })

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const setFile = (k, v) => setFiles(f => ({ ...f, [k]: v }))

  const validate = () => {
    const e = {}
    if (step === 0) {
      if (!form.full_name.trim()) e.full_name = 'Required'
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required'
      if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Valid phone required'
      if (!form.address.trim()) e.address = 'Required'
    }
    if (step === 1) {
      if (!form.aadhaar_number.trim() || form.aadhaar_number.length < 12) e.aadhaar_number = '12-digit Aadhaar required'
      if (!form.licence_number.trim()) e.licence_number = 'Required'
      if (!form.licence_expiry) e.licence_expiry = 'Required'
    }
    if (step === 2) {
      if (!files.photo) e.photo = 'Passport photo required'
      if (!files.aadhaar) e.aadhaar = 'Aadhaar document required'
      if (!files.licence) e.licence = 'Driving licence required'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const prev = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // Upload documents
      const [photo_url, aadhaar_url, licence_url, police_verification_url, address_proof_url] = await Promise.all([
        uploadFile(files.photo, 'photos'),
        uploadFile(files.aadhaar, 'aadhaar'),
        uploadFile(files.licence, 'licences'),
        uploadFile(files.police_verification, 'police'),
        uploadFile(files.address_proof, 'address'),
      ])
      // Insert application
      const { data, error } = await supabase.from('driver_applications').insert({
        ...form,
        years_experience: Number(form.years_experience) || 0,
        photo_url, aadhaar_url, licence_url, police_verification_url, address_proof_url
      }).select('id').single()
      if (error) throw error
      setSubmitted(data.id.slice(0, 8).toUpperCase())
    } catch (err) {
      setErrors({ submit: err.message || 'Submission failed. Please try again.' })
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="apply-page">
        <header className="apply-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>MCD</div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>Smart Dhalao System</span>
          </div>
        </header>
        <div className="apply-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 80, height: 80, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={44} color="var(--success)" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Application Submitted!</h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
              Your application has been received. An officer will review your documents and contact you via email.
            </p>
            <div className="cred-box" style={{ maxWidth: 280, margin: '0 auto' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Your Reference Number</p>
              <p style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', fontFamily: 'monospace' }}>#{submitted}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="apply-page">
      <header className="apply-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>MCD</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15 }}>Smart Dhalao System</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>Driver Recruitment Portal</div>
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Already approved? <a href="/login" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>Officer Login</a></div>
      </header>

      <div className="apply-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Apply as a Driver</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Complete all steps to submit your application to MCD.</p>
        </div>

        <Stepper current={step} />

        <div className="apply-card">
          {errors.submit && (
            <div className="alert alert-error" style={{ marginBottom: 24 }}>
              <Shield size={16} style={{ flexShrink: 0 }} />
              {errors.submit}
            </div>
          )}

          {/* Step 0: Personal */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Personal Information</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Full Name <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="Rajesh Kumar" value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                  {errors.full_name && <span className="form-error">{errors.full_name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address <span className="form-required">*</span></label>
                  <input className="form-input" type="email" placeholder="rajesh@example.com" value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number <span className="form-required">*</span></label>
                  <input className="form-input" type="tel" placeholder="9876543210" value={form.phone} onChange={e => set('phone', e.target.value)} />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input className="form-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Full Address <span className="form-required">*</span></label>
                <textarea className="form-textarea" rows={3} placeholder="House No, Street, Area, City, PIN" value={form.address} onChange={e => set('address', e.target.value)} />
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name</label>
                  <input className="form-input" placeholder="Name" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Phone</label>
                  <input className="form-input" placeholder="Phone" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Licence */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Licence & Vehicle Details</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Aadhaar Number <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="1234 5678 9012" maxLength={14} value={form.aadhaar_number} onChange={e => set('aadhaar_number', e.target.value.replace(/\D/g, '').slice(0, 12))} />
                  {errors.aadhaar_number && <span className="form-error">{errors.aadhaar_number}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Driving Licence Number <span className="form-required">*</span></label>
                  <input className="form-input" placeholder="DL-XXXXXXXXXX" value={form.licence_number} onChange={e => set('licence_number', e.target.value)} />
                  {errors.licence_number && <span className="form-error">{errors.licence_number}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Licence Expiry <span className="form-required">*</span></label>
                  <input className="form-input" type="date" value={form.licence_expiry} onChange={e => set('licence_expiry', e.target.value)} />
                  {errors.licence_expiry && <span className="form-error">{errors.licence_expiry}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <select className="form-select" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                    <option>Auto/Mini Truck</option>
                    <option>Tractor</option>
                    <option>Garbage Compactor</option>
                    <option>Electric Vehicle</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Years of Experience</label>
                  <input className="form-input" type="number" min={0} max={40} value={form.years_experience} onChange={e => set('years_experience', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Upload Documents</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Upload clear, legible copies of all required documents.</p>
              <div className="form-grid">
                <UploadField label="Passport Size Photo" required file={files.photo} onChange={v => setFile('photo', v)} accept="image/*" />
                <UploadField label="Aadhaar Card" required file={files.aadhaar} onChange={v => setFile('aadhaar', v)} />
                <UploadField label="Driving Licence" required file={files.licence} onChange={v => setFile('licence', v)} />
                <UploadField label="Police Verification" file={files.police_verification} onChange={v => setFile('police_verification', v)} />
                <UploadField label="Address Proof" file={files.address_proof} onChange={v => setFile('address_proof', v)} />
              </div>
              {errors.photo && <span className="form-error">{errors.photo}</span>}
              {errors.aadhaar && <span className="form-error">{errors.aadhaar}</span>}
              {errors.licence && <span className="form-error">{errors.licence}</span>}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Review & Submit</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  ['Full Name', form.full_name], ['Email', form.email], ['Phone', form.phone],
                  ['Date of Birth', form.date_of_birth], ['Aadhaar Number', form.aadhaar_number],
                  ['Licence Number', form.licence_number], ['Vehicle Type', form.vehicle_type],
                  ['Experience', form.years_experience + ' years'],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value || '—'}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Documents</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                    {Object.values(files).filter(Boolean).length} / 5 uploaded
                  </span>
                </div>
              </div>
              <div className="alert alert-info" style={{ marginTop: 20 }}>
                <Shield size={15} style={{ flexShrink: 0 }} />
                By submitting, you confirm that all information provided is accurate and truthful.
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button className="btn btn-outline" style={{ flex: 1, height: 48 }} onClick={prev}>
                <ChevronLeft size={18} /> Previous
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }} onClick={next}>
                Next <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-success" style={{ flex: 2, height: 48 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 size={18} className="spinner" /> : <CheckCircle2 size={18} />}
                {submitting ? 'Submitting...' : 'Submit Application'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
