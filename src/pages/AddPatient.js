import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addPatientApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import { Users, UserPlus, Calendar, Bell, CreditCard, ClipboardList, Eye, Pencil, Trash2, Search, CheckCircle2, AlertTriangle, Clock, ArrowLeft, ArrowRight, Printer, Plus, RefreshCw, Activity, FileText, Stethoscope, Phone, Mail, MapPin, Loader2, XCircle, ChevronDown, Upload, X, Check, AlertCircle, Zap, Heart, Tag, Receipt, CreditCard as CardIcon, Folder, File, FileUp, Replace, RotateCcw, Droplets, Pill, Building2, CheckCheck, MinusCircle, UserCircle } from 'lucide-react';

export default function AddPatient() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
  const [form, setForm] = useState({
    name:'', age:'', gender:'', contactNumber:'',
    email:'', address:'', bloodGroup:'',
    medicalHistory:'', allergies:'', chronicConditions:'', description:'', chiefComplaint:'',
    initialTreatmentCost: '',
    initialAmountPaid: '',
    paymentNote: '',
    followUpDate: '',
  });

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePdf = e => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
      toast.success(`"${file.name}" selected!`);
    } else {
      toast.error('Please select a valid PDF file!');
    }
  };

  const cost = parseFloat(form.initialTreatmentCost) || 0;
  const paid = parseFloat(form.initialAmountPaid) || 0;
  const balance = cost - paid;
  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const payStatus = cost <= 0 ? null : paid >= cost - 0.001 ? 'paid' : paid > 0 ? 'partial' : 'pending';

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        name: form.name, age: form.age, gender: form.gender,
        contactNumber: form.contactNumber, email: form.email, address: form.address,
        bloodGroup: form.bloodGroup, medicalHistory: form.medicalHistory,
        allergies: form.allergies,
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
        chiefComplaint: form.description, dentalHistory: form.description, description: form.description,
      };
      const res = await addPatientApi(payload);
      const newPatientId = res.data.id;

      const hasVisitData = cost > 0 || form.followUpDate || form.description;
      if (hasVisitData) {
        try {
          await axios.post('http://localhost:8080/api/visits', {
            patientId: newPatientId,
            patientName: form.name,
            visitDate: new Date().toISOString(),
            symptoms: form.description || form.chiefComplaint || 'First visit / Registration',
            diagnosis: '', treatment: '',
            doctorNotes: form.paymentNote ? `Payment note: ${form.paymentNote}` : 'Patient registered today',
            prescriptions: [],
            treatmentCost: cost > 0 ? cost : null,
            amountPaid: paid > 0 ? paid : null,
            paymentStatus: payStatus || 'pending',
            nextVisitDate: form.followUpDate ? new Date(form.followUpDate).toISOString() : null,
            followUpNotes: form.followUpDate ? `Follow-up scheduled on registration` : null,
          }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        } catch (e) { console.warn('Auto visit creation failed:', e); }
      }
      toast.success('Patient added successfully!');
      navigate('/patients');
    } catch (err) {
      toast.error('Failed to add patient: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const pad = isMobile ? '0 10px 32px' : '0 28px 40px';

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif", background:'#f5f6fa', boxSizing:'border-box' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .input-field:focus { border-color:#00ACB1!important; box-shadow:0 0 0 3px rgba(13,148,136,0.1)!important; outline:none; }
        .input-field::placeholder { color:#6b7280; }
        .input-field option { background:#fff; color:#111; }
        select.input-field { color:#111; cursor:pointer; }
        .pdf-zone:hover { border-color:#00ACB1!important; background:#f0fefe!important; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:5px; }
        ::-webkit-scrollbar-thumb{ background:#00ACB1; border-radius:4px; }
      `}</style>

      <Sidebar activePath="/add-patient" />

      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:'100vh' }}>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: isMobile ? '12px 12px' : '22px 28px', background:'#fff', borderBottom:'1px solid #e5e7eb', marginBottom:16, flexWrap:'wrap', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ paddingLeft: isMobile ? 58 : 0 }}>
            <div style={{ color:'#111', fontSize: isMobile ? 15 : 20, fontWeight:800, display:'inline-flex', alignItems:'center', gap:8 }}><UserPlus size={isMobile ? 26 : 22} color='#00ACB1' /> Add New Patient</div>
            <div style={{ color:'#374151', fontSize:12, marginTop:3 }}>Fill in the details to register a new patient</div>
          </div>
          <button onClick={() => navigate('/patients')} style={{ background:'#f9fafb', color:'#111', border:'1px solid #e5e7eb', padding:'9px 16px', borderRadius:10, cursor:'pointer', fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6 }}><ArrowLeft size={13} /> Back</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: pad }}>

          {/* SECTION 1 — Basic Info */}
          <div style={{ ...section, animation:'fadeUp 0.4s ease 0.05s both' }}>
            <div style={secHead}>
              <div style={sIcon}><UserCircle size={22} color='#00ACB1' /></div>
              <div><div style={sTitle}>Basic Information</div><div style={sSub}>Patient's personal & contact details</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
              <Field label="Full Name *"><input className="input-field" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter full name" required style={inp}/></Field>
              <Field label="Age *"><input className="input-field" type="number" name="age" value={form.age} onChange={handleChange} placeholder="Age in years" required min="1" max="120" style={inp}/></Field>
              <Field label="Gender *">
                <select className="input-field" name="gender" value={form.gender} onChange={handleChange} required style={inp}>
                  <option value="" disabled>Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <select className="input-field" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} style={inp}>
                  <option value="" disabled>Select blood group</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Contact Number *"><input className="input-field" type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Enter phone number" required style={inp}/></Field>
              <Field label="Email Address"><input className="input-field" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Enter email address" style={inp}/></Field>
              <Field label="Follow-up Date">
                <input
                  className="input-field"
                  type="date"
                  name="followUpDate"
                  value={form.followUpDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  style={inp}
                />
                {form.followUpDate && (
                  <div style={{ marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                    <Bell size={11} color='#015D67' />
                    <span style={{ color:'#015D67', fontSize:11, fontWeight:600 }}>
                      Follow-up on {new Date(form.followUpDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                    </span>
                  </div>
                )}
              </Field>
              <Field label="Address" full><input className="input-field" type="text" name="address" value={form.address} onChange={handleChange} placeholder="Enter full address" style={inp}/></Field>
            </div>
          </div>

          {/* SECTION 2 — Payment */}
          <div style={{ ...section, animation:'fadeUp 0.4s ease 0.1s both', borderTop:'3px solid #00ACB1' }}>
            <div style={secHead}>
              <div style={{ ...sIcon, background:'#f0fffe', border:'1px solid #CAF0C1' }}><CreditCard size={18} color='#015D67' /></div>
              <div><div style={sTitle}>Payment Information</div><div style={sSub}>Initial treatment cost & payment received (optional)</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit,minmax(200px,1fr))', gap:14 }}>
              <Field label="Treatment Cost (₹)">
                <input className="input-field" type="number" name="initialTreatmentCost" value={form.initialTreatmentCost} onChange={handleChange} placeholder="Total charge e.g. 1500" min="0" style={inp}/>
              </Field>
              <Field label="Amount Paid Now (₹)">
                <input className="input-field" type="number" name="initialAmountPaid" value={form.initialAmountPaid} onChange={handleChange} placeholder="Amount received e.g. 500" min="0" style={inp}/>
              </Field>
              <Field label="Payment Note">
                <input className="input-field" type="text" name="paymentNote" value={form.paymentNote} onChange={handleChange} placeholder="e.g. Cash, UPI, Advance..." style={inp}/>
              </Field>
            </div>
            {cost > 0 && (
              <div style={{ display:'flex', gap:14, marginTop:12, padding:'12px 16px', background:'#f9fafb', borderRadius:10, flexWrap:'wrap', alignItems:'center', border:'1px solid #e5e7eb' }}>
                <div style={{ fontSize:12 }}><span style={{ color:'#374151', fontWeight:600 }}>Charged: </span><span style={{ color:'#00ACB1', fontWeight:700 }}>{fmt(cost)}</span></div>
                <div style={{ fontSize:12 }}><span style={{ color:'#374151', fontWeight:600 }}>Paid: </span><span style={{ color:'#015D67', fontWeight:700 }}>{fmt(paid)}</span></div>
                <div style={{ fontSize:12 }}><span style={{ color:'#374151', fontWeight:600 }}>Balance: </span><span style={{ color: balance > 0 ? '#dc2626' : '#015D67', fontWeight:700 }}>{fmt(balance)}</span></div>
                <span style={{ marginLeft:'auto', background: payStatus==='paid'?'#f0fffe':payStatus==='partial'?'#fffbeb':'#fef2f2', color: payStatus==='paid'?'#015D67':payStatus==='partial'?'#b45309':'#dc2626', border:`1px solid ${payStatus==='paid'?'#CAF0C1':payStatus==='partial'?'#fde68a':'#fecaca'}`, padding:'3px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                  {payStatus==='paid' ? 'Fully Paid' : payStatus==='partial' ? 'Partial Payment' : 'Payment Pending'}
                </span>
              </div>
            )}
          </div>

          {/* SECTION 3 — Medical Info */}
          <div style={{ ...section, animation:'fadeUp 0.4s ease 0.15s both' }}>
            <div style={secHead}>
              <div style={sIcon}><Building2 size={20} color='#00ACB1' /></div>
              <div><div style={sTitle}>Medical Information</div><div style={sSub}>Health background & dental concerns</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
              {[
                {label:'Medical History', name:'medicalHistory', ph:'Previous surgeries, treatments...'},
                {label:'Known Allergies', name:'allergies', ph:'Penicillin, latex, metals...'},
                {label:'Chronic Conditions', name:'chronicConditions', ph:'Diabetes, BP, Asthma...'},
                {label:'Chief Complaint / Description', name:'description', ph:'Main reason for visit, symptoms...'},
              ].map(f => (
                <Field key={f.name} label={f.label}>
                  <textarea className="input-field" name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} rows={3} style={{ ...inp, resize:'vertical', minHeight:76, color:'#111', fontWeight:500 }}/>
                </Field>
              ))}
            </div>
          </div>

          {/* SECTION 4 — Report Upload */}
          <div style={{ ...section, animation:'fadeUp 0.4s ease 0.2s both' }}>
            <div style={secHead}>
              <div style={sIcon}><File size={20} color='#00ACB1' /></div>
              <div><div style={sTitle}>Lab Report / Document</div><div style={sSub}>Upload PDF report (optional)</div></div>
            </div>
            <label htmlFor="pdf-upload" className="pdf-zone" style={{ display:'block', border:'2px dashed #d1d5db', borderRadius:14, padding: isMobile ? '20px 16px' : '30px 24px', cursor:'pointer', transition:'all 0.2s', background:'#fafafa', textAlign:'center' }}>
              <input id="pdf-upload" type="file" accept="application/pdf" onChange={handlePdf} style={{ display:'none' }}/>
              {pdfFile ? (
                <div><div style={{ marginBottom:8, color:'#00ACB1' }}><File size={36} /></div><div style={{ color:'#00ACB1', fontWeight:700, fontSize:14 }}>{pdfFile.name}</div><div style={{ color:'#9ca3af', fontSize:12, marginTop:4 }}>{(pdfFile.size/1024).toFixed(1)} KB — Click to change</div></div>
              ) : (
                <div><div style={{ marginBottom:8, color:'#9ca3af' }}><Folder size={40} /></div><div style={{ color:'#374151', fontWeight:600, fontSize:14 }}>Click to upload Lab Report PDF</div><div style={{ color:'#9ca3af', fontSize:12, marginTop:5 }}>Only PDF files • Max 10MB</div></div>
              )}
            </label>
          </div>

          {/* ACTIONS */}
          <div style={{ display:'flex', gap:10, justifyContent: isMobile ? 'stretch' : 'flex-end', animation:'fadeUp 0.4s ease 0.25s both', flexWrap:'wrap' }}>
            <button type="button" onClick={() => navigate('/patients')} style={{ flex: isMobile ? 1 : undefined, padding:'12px 22px', background:'#fff', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}><X size={13} /> Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: isMobile ? 1 : undefined, padding:'12px 30px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow:'0 4px 16px rgba(13,148,136,0.35)', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {loading ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}} /> Saving...</> : <><CheckCircle2 size={14} /> Save Patient</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6, gridColumn: full ? '1/-1' : undefined }}>
      <label style={{ color:'#111', fontSize:11, fontWeight:800, letterSpacing:'0.8px', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const section = { background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:16, marginBottom:12, boxShadow:'0 1px 6px rgba(0,0,0,0.04)' };
const secHead = { display:'flex', alignItems:'center', gap:12, marginBottom:18, paddingBottom:12, borderBottom:'1px solid #f3f4f6' };
const sIcon = { background:'#f0fefe', border:'1px solid #87E4DB', borderRadius:10, width:42, height:42, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 };
const sTitle = { color:'#111', fontWeight:800, fontSize:14 };
const sSub = { color:'#374151', fontSize:11, marginTop:2 };
const inp = { padding:'10px 12px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:9, color:'#111', fontSize:13, fontWeight:500, outline:'none', transition:'all 0.2s', fontFamily:"'Segoe UI',sans-serif", width:'100%', boxSizing:'border-box' };