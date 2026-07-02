import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { Upload, Check, Loader2, User, FileText, Shield, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'
import { useLanguage } from '../contexts/LanguageContext'

function Stepper({ current, steps }) {
  const STEPS = steps;
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

function UploadField({ label, required, file, onChange, accept = 'image/*,application/pdf', t }) {
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
            <span className="upload-sub">{t('apply.docs.click_replace')}</span>
          </>
        ) : (
          <>
            <Upload size={20} color="var(--muted)" />
            <span className="upload-label">{t('apply.docs.click_upload')}</span>
            <span className="upload-sub">{t('apply.docs.limits')}</span>
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
  const { t } = useLanguage();
  const STEPS = [t('apply.steps.0'), t('apply.steps.1'), t('apply.steps.2'), t('apply.steps.3')];
  const [step, setStep] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(null)
  const [errors, setErrors] = useState({})

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', date_of_birth: '', address: '',
    aadhaar_number: '', licence_number: '', licence_expiry: '', vehicle_type: 'Auto/Mini Truck',
    vehicle_type_other: '',
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
      if (!form.full_name.trim()) e.full_name = t('apply.errors.required')
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = t('apply.errors.email')
      if (!form.phone.trim() || form.phone.length < 10) e.phone = t('apply.errors.phone')
      if (!form.address.trim()) e.address = t('apply.errors.required')
    }
    if (step === 1) {
      if (!form.aadhaar_number.trim() || form.aadhaar_number.length < 12) e.aadhaar_number = t('apply.errors.aadhaar')
      if (!form.licence_number.trim()) e.licence_number = t('apply.errors.required')
      if (!form.licence_expiry) e.licence_expiry = t('apply.errors.required')
      if (form.vehicle_type === 'Other' && !form.vehicle_type_other.trim()) e.vehicle_type_other = t('apply.errors.required')
    }
    if (step === 2) {
      if (!files.photo) e.photo = t('apply.errors.photo')
      if (!files.aadhaar) e.aadhaar = t('apply.errors.doc_aadhaar')
      if (!files.licence) e.licence = t('apply.errors.doc_licence')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const next = () => { if (validate()) setStep(s => s + 1) }
  const prev = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      // 1. Gather all session and auth data for debugging
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession()
      const { data: userData, error: userErr } = await supabase.auth.getUser()

      console.group('🚀 [SUBMISSION DEBUGGING]')
      console.log('--- AUTHENTICATION STATE ---')
      console.log('getSession():', sessionData?.session ? 'Session Exists' : 'No Session', sessionErr || '')
      console.log('getUser():', userData?.user ? `User: ${userData.user.id} (${userData.user.role})` : 'Anonymous (No User)', userErr || '')
      console.log('auth.uid():', userData?.user?.id || 'null')
      console.log('JWT:', sessionData?.session?.access_token || 'null')
      console.log('JWT decoded (if possible):', sessionData?.session?.access_token ? JSON.parse(atob(sessionData.session.access_token.split('.')[1])) : 'N/A')

      // Upload documents
      const [photo_url, aadhaar_url, licence_url, police_verification_url, address_proof_url] = await Promise.all([
        uploadFile(files.photo, 'photos'),
        uploadFile(files.aadhaar, 'aadhaar'),
        uploadFile(files.licence, 'licences'),
        uploadFile(files.police_verification, 'police'),
        uploadFile(files.address_proof, 'address'),
      ])

      // Generate ID client-side so we don't need to return it from DB
      const applicationId = crypto.randomUUID()

      const payload = {
        id: applicationId,
        ...form,
        vehicle_type: form.vehicle_type === 'Other' ? form.vehicle_type_other : form.vehicle_type,
        years_experience: Number(form.years_experience) || 0,
        photo_url, aadhaar_url, licence_url, police_verification_url, address_proof_url
      }
      delete payload.vehicle_type_other
      
      console.log('--- PAYLOAD GOING TO DB ---')
      console.log('Table: driver_applications')
      console.log('Payload:', JSON.stringify(payload, null, 2))

      // Insert application WITHOUT .select() to prevent SELECT RLS failure
      const { error } = await supabase.from('driver_applications').insert(payload)
      
      if (error) {
        console.error('--- SUPABASE ERROR OBJECT ---')
        console.error('code:', error.code)
        console.error('message:', error.message)
        console.error('details:', error.details)
        console.error('hint:', error.hint)
        console.error('Full Error Object:', JSON.stringify(error, null, 2))
        throw error
      }
      
      console.log('✅ SUCCESS! Inserted ID:', applicationId)
      console.groupEnd()
      
      setSubmitted(applicationId.slice(0, 8).toUpperCase())
    } catch (err) {
      console.groupEnd()
      setErrors({ submit: err.message || t('apply.errors.submit') })
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="apply-page">
        <header className="apply-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>MCD</div>
            <span style={{ fontWeight: 700, fontSize: 16 }}>{t('app.brand')}</span>
          </div>
        </header>
        <div className="apply-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 70px)' }}>
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ width: 80, height: 80, background: 'var(--success-light)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <CheckCircle2 size={44} color="var(--success)" />
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{t('apply.success.title')}</h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
              {t('apply.success.desc')}
            </p>
            <div className="cred-box" style={{ maxWidth: 280, margin: '0 auto' }}>
              <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{t('apply.success.ref')}</p>
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
            <div style={{ fontWeight: 700, fontSize: 15 }}>{t('app.brand')} <span style={{fontSize: 10, background: 'var(--primary)', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>v2.1 (Fixed)</span></div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>{t('apply.provider_portal')}</div>
          </div>
        </div>
        <div style={{ fontSize: 13, opacity: 0.85 }}>{t('apply.already_approved')} <Link to="/login" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>{t('apply.officer_login')}</Link></div>
      </header>

      <div className="apply-content">
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{t('apply.title')}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('apply.subtitle')}</p>
        </div>

        <Stepper current={step} steps={STEPS} />

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
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('apply.personal.title')}</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('apply.personal.full_name')} <span className="form-required">*</span></label>
                  <input className="form-input" placeholder={t('apply.personal.full_name_placeholder')} value={form.full_name} onChange={e => set('full_name', e.target.value)} />
                  {errors.full_name && <span className="form-error">{errors.full_name}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.personal.email')} <span className="form-required">*</span></label>
                  <input className="form-input" type="email" placeholder={t('apply.personal.email_placeholder')} value={form.email} onChange={e => set('email', e.target.value)} />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.personal.phone')} <span className="form-required">*</span></label>
                  <input className="form-input" type="tel" placeholder={t('apply.personal.phone_placeholder')} value={form.phone} onChange={e => set('phone', e.target.value)} />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.personal.dob')}</label>
                  <input className="form-input" type="date" value={form.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{t('apply.personal.address')} <span className="form-required">*</span></label>
                <textarea className="form-textarea" rows={3} placeholder={t('apply.personal.address_placeholder')} value={form.address} onChange={e => set('address', e.target.value)} />
                {errors.address && <span className="form-error">{errors.address}</span>}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('apply.personal.emergency_name')}</label>
                  <input className="form-input" placeholder="Name" value={form.emergency_contact_name} onChange={e => set('emergency_contact_name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.personal.emergency_phone')}</label>
                  <input className="form-input" placeholder="Phone" value={form.emergency_contact_phone} onChange={e => set('emergency_contact_phone', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 1: Licence */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('apply.vehicle.title')}</h2>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">{t('apply.vehicle.aadhaar')} <span className="form-required">*</span></label>
                  <input className="form-input" placeholder={t('apply.vehicle.aadhaar_placeholder')} maxLength={14} value={form.aadhaar_number} onChange={e => set('aadhaar_number', e.target.value.replace(/\D/g, '').slice(0, 12))} />
                  {errors.aadhaar_number && <span className="form-error">{errors.aadhaar_number}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.vehicle.licence')} <span className="form-required">*</span></label>
                  <input className="form-input" placeholder={t('apply.vehicle.licence_placeholder')} value={form.licence_number} onChange={e => set('licence_number', e.target.value)} />
                  {errors.licence_number && <span className="form-error">{errors.licence_number}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.vehicle.expiry')} <span className="form-required">*</span></label>
                  <input className="form-input" type="date" value={form.licence_expiry} onChange={e => set('licence_expiry', e.target.value)} />
                  {errors.licence_expiry && <span className="form-error">{errors.licence_expiry}</span>}
                </div>
                <div className="form-group">
                  <label className="form-label">{t('apply.vehicle.type')}</label>
                  <select className="form-select" value={form.vehicle_type} onChange={e => set('vehicle_type', e.target.value)}>
                    <option value="Auto/Mini Truck">{t('apply.vehicle.types.auto')}</option>
                    <option value="Tractor">{t('apply.vehicle.types.tractor')}</option>
                    <option value="Garbage Compactor">{t('apply.vehicle.types.compactor')}</option>
                    <option value="Electric Vehicle">{t('apply.vehicle.types.ev')}</option>
                    <option value="Other">{t('apply.vehicle.types.other')}</option>
                  </select>
                </div>
                {form.vehicle_type === 'Other' && (
                  <div className="form-group">
                    <label className="form-label">{t('apply.vehicle.specify_type')} <span className="form-required">*</span></label>
                    <input className="form-input" placeholder={t('apply.vehicle.specify_placeholder')} value={form.vehicle_type_other} onChange={e => set('vehicle_type_other', e.target.value)} />
                    {errors.vehicle_type_other && <span className="form-error">{errors.vehicle_type_other}</span>}
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">{t('apply.vehicle.experience')}</label>
                  <input className="form-input" type="number" min={0} max={40} value={form.years_experience} onChange={e => set('years_experience', e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Documents */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('apply.docs.title')}</h2>
              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('apply.docs.desc')}</p>
              <div className="form-grid">
                <UploadField t={t} label={t('apply.docs.photo')} required file={files.photo} onChange={v => setFile('photo', v)} accept="image/*" />
                <UploadField t={t} label={t('apply.docs.aadhaar')} required file={files.aadhaar} onChange={v => setFile('aadhaar', v)} />
                <UploadField t={t} label={t('apply.docs.licence')} required file={files.licence} onChange={v => setFile('licence', v)} />
                <UploadField t={t} label={t('apply.docs.police')} file={files.police_verification} onChange={v => setFile('police_verification', v)} />
                <UploadField t={t} label={t('apply.docs.address')} file={files.address_proof} onChange={v => setFile('address_proof', v)} />
              </div>
              {errors.photo && <span className="form-error">{errors.photo}</span>}
              {errors.aadhaar && <span className="form-error">{errors.aadhaar}</span>}
              {errors.licence && <span className="form-error">{errors.licence}</span>}
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>{t('apply.review.title')}</h2>
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  [t('apply.personal.full_name'), form.full_name], [t('apply.personal.email'), form.email], [t('apply.personal.phone'), form.phone],
                  [t('apply.personal.dob'), form.date_of_birth], [t('apply.vehicle.aadhaar'), form.aadhaar_number],
                  [t('apply.vehicle.licence'), form.licence_number], [t('apply.vehicle.type'), form.vehicle_type === 'Other' ? form.vehicle_type_other : form.vehicle_type],
                  [t('apply.vehicle.experience'), form.years_experience + ' '],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{value || '—'}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{t('apply.review.documents')}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>
                    {Object.values(files).filter(Boolean).length} / 5 {t('apply.review.uploaded')}
                  </span>
                </div>
              </div>
              <div className="alert alert-info" style={{ marginTop: 20 }}>
                <Shield size={15} style={{ flexShrink: 0 }} />
                {t('apply.review.confirm')}
              </div>
            </div>
          )}

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 12, marginTop: 32 }}>
            {step > 0 && (
              <button className="btn btn-outline" style={{ flex: 1, height: 48 }} onClick={prev}>
                <ChevronLeft size={18} /> {t('apply.nav.prev')}
              </button>
            )}
            {step < STEPS.length - 1 ? (
              <button className="btn btn-primary" style={{ flex: 2, height: 48 }} onClick={next}>
                {t('apply.nav.next')} <ChevronRight size={18} />
              </button>
            ) : (
              <button className="btn btn-success" style={{ flex: 2, height: 48 }} onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 size={18} className="spinner" /> : <CheckCircle2 size={18} />}
                {submitting ? t('apply.nav.submitting') : t('apply.nav.submit')}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
