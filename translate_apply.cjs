const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/pages/ApplyPage.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// Imports
content = content.replace(
  "import { Upload, Check, Loader2, User, FileText, Shield, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'",
  "import { Upload, Check, Loader2, User, FileText, Shield, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react'\nimport { useLanguage } from '../contexts/LanguageContext'"
);

// STEPS constant and Stepper
content = content.replace(
  "const STEPS = ['Personal Info', 'Licence & Vehicle', 'Documents', 'Review & Submit']\n\nfunction Stepper({ current }) {",
  "function Stepper({ current, steps }) {\n  const STEPS = steps;"
);

// UploadField
content = content.replace(
  "function UploadField({ label, required, file, onChange, accept = 'image/*,application/pdf' }) {",
  "function UploadField({ label, required, file, onChange, accept = 'image/*,application/pdf', t }) {"
);
content = content.replace(
  "<span className=\"upload-sub\">Click to replace</span>",
  "<span className=\"upload-sub\">{t('apply.docs.click_replace')}</span>"
);
content = content.replace(
  "<span className=\"upload-label\">Click to upload</span>\n            <span className=\"upload-sub\">JPG, PNG or PDF · Max 5MB</span>",
  "<span className=\"upload-label\">{t('apply.docs.click_upload')}</span>\n            <span className=\"upload-sub\">{t('apply.docs.limits')}</span>"
);

// ApplyPage component start
content = content.replace(
  "export function ApplyPage() {\n  const [step, setStep] = useState(0)",
  "export function ApplyPage() {\n  const { t } = useLanguage();\n  const STEPS = [t('apply.steps.0'), t('apply.steps.1'), t('apply.steps.2'), t('apply.steps.3')];\n  const [step, setStep] = useState(0)"
);

// Validation
content = content.replace(
  "if (!form.full_name.trim()) e.full_name = 'Required'\n      if (!form.email.trim() || !/\\S+@\\S+\\.\\S+/.test(form.email)) e.email = 'Valid email required'\n      if (!form.phone.trim() || form.phone.length < 10) e.phone = 'Valid phone required'\n      if (!form.address.trim()) e.address = 'Required'",
  "if (!form.full_name.trim()) e.full_name = t('apply.errors.required')\n      if (!form.email.trim() || !/\\S+@\\S+\\.\\S+/.test(form.email)) e.email = t('apply.errors.email')\n      if (!form.phone.trim() || form.phone.length < 10) e.phone = t('apply.errors.phone')\n      if (!form.address.trim()) e.address = t('apply.errors.required')"
);
content = content.replace(
  "if (!form.aadhaar_number.trim() || form.aadhaar_number.length < 12) e.aadhaar_number = '12-digit Aadhaar required'\n      if (!form.licence_number.trim()) e.licence_number = 'Required'\n      if (!form.licence_expiry) e.licence_expiry = 'Required'\n      if (form.vehicle_type === 'Other' && !form.vehicle_type_other.trim()) e.vehicle_type_other = 'Required'",
  "if (!form.aadhaar_number.trim() || form.aadhaar_number.length < 12) e.aadhaar_number = t('apply.errors.aadhaar')\n      if (!form.licence_number.trim()) e.licence_number = t('apply.errors.required')\n      if (!form.licence_expiry) e.licence_expiry = t('apply.errors.required')\n      if (form.vehicle_type === 'Other' && !form.vehicle_type_other.trim()) e.vehicle_type_other = t('apply.errors.required')"
);
content = content.replace(
  "if (!files.photo) e.photo = 'Passport photo required'\n      if (!files.aadhaar) e.aadhaar = 'Aadhaar document required'\n      if (!files.licence) e.licence = 'Driving licence required'",
  "if (!files.photo) e.photo = t('apply.errors.photo')\n      if (!files.aadhaar) e.aadhaar = t('apply.errors.doc_aadhaar')\n      if (!files.licence) e.licence = t('apply.errors.doc_licence')"
);
content = content.replace(
  "setErrors({ submit: err.message || 'Submission failed. Please try again.' })",
  "setErrors({ submit: err.message || t('apply.errors.submit') })"
);

// Submitted View
content = content.replace(
  "<span style={{ fontWeight: 700, fontSize: 16 }}>Smart Dhalao System</span>",
  "<span style={{ fontWeight: 700, fontSize: 16 }}>{t('app.brand')}</span>"
);
content = content.replace(
  "<h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>Application Submitted!</h1>\n            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>\n              Your application has been received. An officer will review your documents and contact you via email.\n            </p>\n            <div className=\"cred-box\" style={{ maxWidth: 280, margin: '0 auto' }}>\n              <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>Your Reference Number</p>",
  "<h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 12 }}>{t('apply.success.title')}</h1>\n            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>\n              {t('apply.success.desc')}\n            </p>\n            <div className=\"cred-box\" style={{ maxWidth: 280, margin: '0 auto' }}>\n              <p style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 4 }}>{t('apply.success.ref')}</p>"
);

// Header
content = content.replace(
  "<div style={{ fontWeight: 700, fontSize: 15 }}>Smart Dhalao System <span style={{fontSize: 10, background: 'var(--primary)', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>v2.1 (Fixed)</span></div>\n            <div style={{ fontSize: 11, opacity: 0.8 }}>Service Provider Recruitment Portal</div>\n          </div>\n        </div>\n        <div style={{ fontSize: 13, opacity: 0.85 }}>Already approved? <Link to=\"/login\" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>Officer Login</Link></div>",
  "<div style={{ fontWeight: 700, fontSize: 15 }}>{t('app.brand')} <span style={{fontSize: 10, background: 'var(--primary)', padding: '2px 6px', borderRadius: 4, marginLeft: 6}}>v2.1 (Fixed)</span></div>\n            <div style={{ fontSize: 11, opacity: 0.8 }}>{t('apply.provider_portal')}</div>\n          </div>\n        </div>\n        <div style={{ fontSize: 13, opacity: 0.85 }}>{t('apply.already_approved')} <Link to=\"/login\" style={{ color: 'white', fontWeight: 700, textDecoration: 'underline' }}>{t('apply.officer_login')}</Link></div>"
);

// Form Intro
content = content.replace(
  "<h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Apply as a Service Provider</h1>\n          <p style={{ color: 'var(--muted)', fontSize: 14 }}>Complete all steps to submit your application to MCD.</p>",
  "<h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>{t('apply.title')}</h1>\n          <p style={{ color: 'var(--muted)', fontSize: 14 }}>{t('apply.subtitle')}</p>"
);
content = content.replace("<Stepper current={step} />", "<Stepper current={step} steps={STEPS} />");

// Step 0
content = content.replace(
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Personal Information</h2>",
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('apply.personal.title')}</h2>"
);
content = content.replace(/<label className="form-label">Full Name <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.personal.full_name')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="Rajesh Kumar"/g, "placeholder={t('apply.personal.full_name_placeholder')}");
content = content.replace(/<label className="form-label">Email Address <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.personal.email')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="rajesh@example.com"/g, "placeholder={t('apply.personal.email_placeholder')}");
content = content.replace(/<label className="form-label">Phone Number <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.personal.phone')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="9876543210"/g, "placeholder={t('apply.personal.phone_placeholder')}");
content = content.replace(/<label className="form-label">Date of Birth<\/label>/g, "<label className=\"form-label\">{t('apply.personal.dob')}</label>");
content = content.replace(/<label className="form-label">Full Address <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.personal.address')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="House No, Street, Area, City, PIN"/g, "placeholder={t('apply.personal.address_placeholder')}");
content = content.replace(/<label className="form-label">Emergency Contact Name<\/label>/g, "<label className=\"form-label\">{t('apply.personal.emergency_name')}</label>");
content = content.replace(/<label className="form-label">Emergency Contact Phone<\/label>/g, "<label className=\"form-label\">{t('apply.personal.emergency_phone')}</label>");

// Step 1
content = content.replace(
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Licence & Vehicle Details</h2>",
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('apply.vehicle.title')}</h2>"
);
content = content.replace(/<label className="form-label">Aadhaar Number <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.vehicle.aadhaar')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="1234 5678 9012"/g, "placeholder={t('apply.vehicle.aadhaar_placeholder')}");
content = content.replace(/<label className="form-label">Driving Licence Number <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.vehicle.licence')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="DL-XXXXXXXXXX"/g, "placeholder={t('apply.vehicle.licence_placeholder')}");
content = content.replace(/<label className="form-label">Licence Expiry <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.vehicle.expiry')} <span className=\"form-required\">*</span></label>");
content = content.replace(/<label className="form-label">Vehicle Type<\/label>/g, "<label className=\"form-label\">{t('apply.vehicle.type')}</label>");
content = content.replace(
  "<option>Auto/Mini Truck</option>\n                    <option>Tractor</option>\n                    <option>Garbage Compactor</option>\n                    <option>Electric Vehicle</option>\n                    <option>Other</option>",
  "<option value=\"Auto/Mini Truck\">{t('apply.vehicle.types.auto')}</option>\n                    <option value=\"Tractor\">{t('apply.vehicle.types.tractor')}</option>\n                    <option value=\"Garbage Compactor\">{t('apply.vehicle.types.compactor')}</option>\n                    <option value=\"Electric Vehicle\">{t('apply.vehicle.types.ev')}</option>\n                    <option value=\"Other\">{t('apply.vehicle.types.other')}</option>"
);
content = content.replace(/<label className="form-label">Specify Vehicle Type <span className="form-required">\*<\/span><\/label>/g, "<label className=\"form-label\">{t('apply.vehicle.specify_type')} <span className=\"form-required\">*</span></label>");
content = content.replace(/placeholder="Enter vehicle type"/g, "placeholder={t('apply.vehicle.specify_placeholder')}");
content = content.replace(/<label className="form-label">Years of Experience<\/label>/g, "<label className=\"form-label\">{t('apply.vehicle.experience')}</label>");

// Step 2
content = content.replace(
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Upload Documents</h2>\n              <p style={{ fontSize: 13, color: 'var(--muted)' }}>Upload clear, legible copies of all required documents.</p>",
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{t('apply.docs.title')}</h2>\n              <p style={{ fontSize: 13, color: 'var(--muted)' }}>{t('apply.docs.desc')}</p>"
);
content = content.replace(/UploadField label="Passport Size Photo"/g, "UploadField t={t} label={t('apply.docs.photo')}");
content = content.replace(/UploadField label="Aadhaar Card"/g, "UploadField t={t} label={t('apply.docs.aadhaar')}");
content = content.replace(/UploadField label="Driving Licence"/g, "UploadField t={t} label={t('apply.docs.licence')}");
content = content.replace(/UploadField label="Police Verification"/g, "UploadField t={t} label={t('apply.docs.police')}");
content = content.replace(/UploadField label="Address Proof"/g, "UploadField t={t} label={t('apply.docs.address')}");

// Step 3
content = content.replace(
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>Review & Submit</h2>",
  "<h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 20 }}>{t('apply.review.title')}</h2>"
);
content = content.replace(
  "['Full Name', form.full_name], ['Email', form.email], ['Phone', form.phone],\n                  ['Date of Birth', form.date_of_birth], ['Aadhaar Number', form.aadhaar_number],\n                  ['Licence Number', form.licence_number], ['Vehicle Type', form.vehicle_type === 'Other' ? form.vehicle_type_other : form.vehicle_type],\n                  ['Experience', form.years_experience + ' years'],",
  "[t('apply.personal.full_name'), form.full_name], [t('apply.personal.email'), form.email], [t('apply.personal.phone'), form.phone],\n                  [t('apply.personal.dob'), form.date_of_birth], [t('apply.vehicle.aadhaar'), form.aadhaar_number],\n                  [t('apply.vehicle.licence'), form.licence_number], [t('apply.vehicle.type'), form.vehicle_type === 'Other' ? form.vehicle_type_other : form.vehicle_type],\n                  [t('apply.vehicle.experience'), form.years_experience + ' '],"
);
content = content.replace(
  "<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>Documents</span>\n                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>\n                    {Object.values(files).filter(Boolean).length} / 5 uploaded\n                  </span>",
  "<span style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{t('apply.review.documents')}</span>\n                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--success)' }}>\n                    {Object.values(files).filter(Boolean).length} / 5 {t('apply.review.uploaded')}\n                  </span>"
);
content = content.replace(
  "By submitting, you confirm that all information provided is accurate and truthful.",
  "{t('apply.review.confirm')}"
);

// Navigation
content = content.replace(
  "<ChevronLeft size={18} /> Previous",
  "<ChevronLeft size={18} /> {t('apply.nav.prev')}"
);
content = content.replace(
  "Next <ChevronRight size={18} />",
  "{t('apply.nav.next')} <ChevronRight size={18} />"
);
content = content.replace(
  "{submitting ? 'Submitting...' : 'Submit Application'}",
  "{submitting ? t('apply.nav.submitting') : t('apply.nav.submit')}"
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('ApplyPage translated successfully!');
