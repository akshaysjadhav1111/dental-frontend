import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getPatientApi, updatePatientApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import { Users, UserPlus, Calendar, Bell, CreditCard, ClipboardList, Eye, Pencil, Trash2, Search, CheckCircle2, AlertTriangle, Clock, ArrowLeft, ArrowRight, Printer, Plus, RefreshCw, Activity, FileText, Stethoscope, Phone, Mail, MapPin, Loader2, XCircle, ChevronDown, Upload, X, Check, AlertCircle, Zap, Heart, Tag, Receipt, CreditCard as CardIcon, Folder, File, FileUp, Replace, RotateCcw, Droplets, Pill, Building2, CheckCheck, MinusCircle, UserCircle } from 'lucide-react';

export default function EditPatient() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMobile = useMobile();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [billing, setBilling] = useState(null);
  const [addingPayment, setAddingPayment] = useState(false);
  const [payForm, setPayForm] = useState({ amount: '', note: '' });

  const [form, setForm] = useState({
    name:'', age:'', gender:'', contactNumber:'',
    email:'', address:'', bloodGroup:'',
    medicalHistory:'', allergies:'', chronicConditions:'',
    chiefComplaint:'', dentalHistory:'', status:'active',
  });

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

  const loadBilling = async () => {
    try {
      const api = axios.create({ baseURL: 'http://localhost:8080/api', headers: { Authorization: `Bearer ${token}` } });
      const bRes = await api.get(`/patients/${id}/billing`);
      setBilling(bRes.data);
    } catch { setBilling(null); }
  };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await getPatientApi(id);
        const p = res.data;
        setForm({
          name: p.name || '', age: p.age || '', gender: p.gender || '',
          contactNumber: p.contactNumber || '', email: p.email || '', address: p.address || '',
          bloodGroup: p.bloodGroup || '', medicalHistory: p.medicalHistory || '',
          allergies: p.allergies || '',
          chronicConditions: Array.isArray(p.chronicConditions) ? p.chronicConditions.join(', ') : (p.chronicConditions || ''),
          chiefComplaint: p.chiefComplaint || '', dentalHistory: p.dentalHistory || '',
          status: p.status || 'active',
        });
        await loadBilling();
      } catch {
        toast.error('Failed to load patient data');
        navigate('/patients');
      } finally { setFetching(false); }
    };
    load();
  }, [id]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...form, age: parseInt(form.age),
        chronicConditions: form.chronicConditions ? form.chronicConditions.split(',').map(s => s.trim()).filter(Boolean) : [],
      };
      await updatePatientApi(id, payload);
      toast.success('Patient updated successfully!');
      navigate(`/patients/${id}`);
    } catch (err) {
      toast.error('Failed to update: ' + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleAddPayment = async () => {
    const amt = parseFloat(payForm.amount);
    if (!amt || amt <= 0) { toast.error('Please enter a valid amount'); return; }
    setAddingPayment(true);
    try {
      const api = axios.create({ baseURL: 'http://localhost:8080/api', headers: { Authorization: `Bearer ${token}` } });
      await api.post(`/patients/${id}/billing/payment`, { amount: amt, note: payForm.note });
      toast.success(`Payment of ₹${amt} recorded!`);
      await loadBilling();
      setPayForm({ amount: '', note: '' });
    } catch { toast.error('Failed to record payment'); }
    finally { setAddingPayment(false); }
  };

  if (fetching) return (
    <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#f5f6fa', color:'#00ACB1', fontSize:16 }}>
      <span style={{display:'inline-flex',alignItems:'center',gap:8}}><Loader2 size={18} style={{animation:'spin 1s linear infinite'}} /> Loading patient data...</span>
    </div>
  );

  const balance = billing?.balance || 0;
  const hasBalance = balance > 0.01;
  const pad = isMobile ? '0 10px 32px' : '0 28px 40px';

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif", background:'#f5f6fa', boxSizing:'border-box' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .input-field:focus { border-color:#00ACB1!important; box-shadow:0 0 0 3px rgba(13,148,136,0.1)!important; outline:none; }
        .input-field::placeholder { color:#6b7280; }
        .input-field option { background:#fff; color:#111; }
        select.input-field { color:#111; cursor:pointer; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:5px; }
        ::-webkit-scrollbar-thumb{ background:#00ACB1; border-radius:4px; }
      `}</style>

      <Sidebar activePath="/patients" />

      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:'100vh' }}>

        <div style={{ background:'#fff', borderBottom:'1px solid #e5e7eb', marginBottom:16, boxShadow:'0 1px 4px rgba(0,0,0,0.05)', padding: isMobile ? '12px 12px' : '20px 28px' }}>
          {isMobile ? (
            <>
              {/* Row 1: Title */}
              <div style={{ paddingLeft: 58, marginBottom: 10 }}>
                <div style={{ color:'#111', fontSize:15, fontWeight:800, display:'inline-flex', alignItems:'center', gap:8 }}><Pencil size={22} color='#00ACB1' /> Edit Patient</div>
                <div style={{ color:'#374151', fontSize:12, marginTop:2 }}>Update patient information</div>
              </div>
              {/* Row 2: Back button */}
              <button onClick={() => navigate(`/patients/${id}`)} style={{ background:'#f9fafb', color:'#111', border:'1px solid #e5e7eb', padding:'8px 14px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, display:'inline-flex', alignItems:'center', gap:6 }}><ArrowLeft size={13} /> Back</button>
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => navigate(`/patients/${id}`)} style={{ background:'#f9fafb', color:'#111', border:'1px solid #e5e7eb', padding:'8px 14px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0, display:'inline-flex', alignItems:'center', gap:6 }}><ArrowLeft size={13} /> Back</button>
              <div>
                <div style={{ color:'#111', fontSize:19, fontWeight:800, display:'inline-flex', alignItems:'center', gap:8 }}><Pencil size={16} color='#00ACB1' /> Edit Patient</div>
                <div style={{ color:'#374151', fontSize:12, marginTop:2 }}>Update patient information</div>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ padding: pad }}>

          {/* STATUS */}
          <div style={{ ...section, animation:'fadeUp 0.3s ease', borderTop:'3px solid #00ACB1' }}>
            <div style={secHead}>
              <div style={sIcon}><Zap size={16} color='#00ACB1' /></div>
              <div><div style={sTitle}>Patient Status</div><div style={sSub}>Active or inactive patient</div></div>
            </div>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
              {[
                { val:'active',   icon:<CheckCircle2 size={26} color='#015D67'/>, label:'Active',   desc:'Currently under treatment', activeColor:'#015D67', activeBg:'#f0fffe', activeBorder:'#CAF0C1' },
                { val:'inactive', icon:<MinusCircle size={22} color='#dc2626'/>,  label:'Inactive', desc:'Treatment completed or left', activeColor:'#dc2626', activeBg:'#fef2f2', activeBorder:'#fecaca' },
              ].map(s => (
                <div key={s.val} onClick={() => setForm({ ...form, status: s.val })}
                  style={{ position:'relative', flex:1, minWidth: isMobile ? '100%' : 170, maxWidth: isMobile ? '100%' : 240, padding:'18px', borderRadius:14, border:`2px solid ${form.status===s.val ? s.activeBorder : '#e5e7eb'}`, background: form.status===s.val ? s.activeBg : '#fafafa', cursor:'pointer', textAlign:'center', transition:'all 0.2s' }}>
                  <div style={{ marginBottom:7 }}>{s.icon}</div>
                  <div style={{ color: form.status===s.val ? s.activeColor : '#111', fontWeight:700, fontSize:14 }}>{s.label}</div>
                  <div style={{ color:'#374151', fontSize:11, marginTop:3 }}>{s.desc}</div>
                  {form.status===s.val && <div style={{ position:'absolute', top:9, right:9, width:18, height:18, borderRadius:'50%', background:s.activeColor, display:'flex', alignItems:'center', justifyContent:'center', color:'#fff' }}><Check size={11} /></div>}
                </div>
              ))}
            </div>
          </div>

          {/* BASIC INFO */}
          <div style={{ ...section, animation:'fadeUp 0.35s ease' }}>
            <div style={secHead}>
              <div style={sIcon}><UserCircle size={20} color='#00ACB1' /></div>
              <div><div style={sTitle}>Basic Information</div><div style={sSub}>Personal and contact details</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
              <Field label="Full Name *"><input className="input-field" type="text" name="name" value={form.name} onChange={handleChange} placeholder="Patient full name" required style={inp}/></Field>
              <Field label="Age *"><input className="input-field" type="number" name="age" value={form.age} onChange={handleChange} placeholder="Age in years" required style={inp}/></Field>
              <Field label="Gender">
                <select className="input-field" name="gender" value={form.gender} onChange={handleChange} style={inp}>
                  <option value="">Select gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </Field>
              <Field label="Blood Group">
                <select className="input-field" name="bloodGroup" value={form.bloodGroup} onChange={handleChange} style={inp}>
                  <option value="">Select blood group</option>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </Field>
              <Field label="Contact Number *"><input className="input-field" type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} placeholder="Phone number" required style={inp}/></Field>
              <Field label="Email Address"><input className="input-field" type="email" name="email" value={form.email} onChange={handleChange} placeholder="Email address" style={inp}/></Field>
              <Field label="Address" full><input className="input-field" type="text" name="address" value={form.address} onChange={handleChange} placeholder="Full address" style={inp}/></Field>
            </div>
          </div>

          {/* PAYMENT SECTION */}
          <div style={{ ...section, animation:'fadeUp 0.38s ease', borderTop:'3px solid #00ACB1' }}>
            <div style={secHead}>
              <div style={{ ...sIcon, background:'#f0fffe', border:'1px solid #CAF0C1' }}><CreditCard size={18} color='#015D67' /></div>
              <div><div style={sTitle}>Payment Status & Record Payment</div><div style={sSub}>View billing summary and record new payment</div></div>
            </div>

            {billing && billing.totalBilled > 0 ? (
              <>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:16 }}>
                  {[
                    { label:'Total Billed', value: fmt(billing.totalBilled), color:'#00ACB1', icon:'🧾', bg:'#f0fefe' },
                    { label:'Total Paid',   value: fmt(billing.totalPaid),   color:'#015D67', icon:'✅', bg:'#f0fffe' },
                    { label:'Balance Due',  value: fmt(billing.balance),     color: hasBalance ? '#dc2626' : '#015D67', icon: hasBalance ? '⚠️' : '🎉', bg: hasBalance ? '#fef2f2' : '#f0fffe' },
                  ].map((c,i) => (
                    <div key={i} style={{ background:c.bg, borderRadius:10, padding:'12px', textAlign:'center', border:'1px solid #e5e7eb' }}>
                      <div style={{ fontSize:18, marginBottom:4 }}>{c.icon}</div>
                      <div style={{ color:'#374151', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{c.label}</div>
                      <div style={{ color:c.color, fontWeight:800, fontSize:16 }}>{c.value}</div>
                    </div>
                  ))}
                </div>
                {hasBalance && (
                  <div style={{ marginBottom:12 }}>
                    <div style={{ color:'#374151', fontSize:11, fontWeight:600, marginBottom:7, textTransform:'uppercase', letterSpacing:1 }}>Quick Fill</div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                      {[{ label:`Full Due: ${fmt(balance)}`, val: balance }, { label:'₹500', val:500 }, { label:'₹1000', val:1000 }, { label:'₹2000', val:2000 }]
                        .filter(q => q.val <= balance + 0.01)
                        .map((q,i) => (
                          <button key={i} type="button" onClick={() => setPayForm({ ...payForm, amount: String(q.val) })}
                            style={{ background:'#f0fffe', color:'#015D67', border:'1px solid #CAF0C1', borderRadius:8, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                            {q.label}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ background:'#fafafa', borderRadius:10, padding:'11px 14px', marginBottom:14, color:'#374151', fontSize:12, textAlign:'center', border:'1px solid #e5e7eb' }}>
                <span style={{display:'inline-flex',alignItems:'center',gap:6}}><AlertCircle size={13} />No billing records yet. Payments will be tracked once visit costs are added.</span>
              </div>
            )}

            <div style={{ background:'#f0fffe', border:'1px solid #CAF0C1', borderRadius:12, padding:14 }}>
              <div style={{ color:'#015D67', fontWeight:800, fontSize:11, marginBottom:11, textTransform:'uppercase', letterSpacing:1, display:'inline-flex', alignItems:'center', gap:6 }}><Receipt size={13} /> Record New Payment</div>
              <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap:11, marginBottom:11 }}>
                <Field label="Amount Received (₹) *">
                  <input className="input-field" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} placeholder="Enter amount..." min="1" style={inp}/>
                </Field>
                <Field label="Payment Note">
                  <input className="input-field" type="text" value={payForm.note} onChange={e => setPayForm({ ...payForm, note: e.target.value })} placeholder="e.g. Cash, UPI, Cheque..." style={inp}/>
                </Field>
              </div>
              <button type="button" onClick={handleAddPayment} disabled={addingPayment || !payForm.amount}
                style={{ background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:9, padding:'10px 22px', cursor: addingPayment || !payForm.amount ? 'not-allowed' : 'pointer', fontSize:13, fontWeight:700, opacity: addingPayment || !payForm.amount ? 0.6 : 1, display:'inline-flex', alignItems:'center', gap:6 }}>
                {addingPayment ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}} /> Recording...</> : <><CheckCircle2 size={14} /> Confirm Payment</>}
              </button>
            </div>
          </div>

          {/* MEDICAL INFO */}
          <div style={{ ...section, animation:'fadeUp 0.4s ease' }}>
            <div style={secHead}>
              <div style={sIcon}><Building2 size={20} color='#00ACB1' /></div>
              <div><div style={sTitle}>Medical Information</div><div style={sSub}>Health background and dental concerns</div></div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(auto-fit,minmax(220px,1fr))', gap:10 }}>
              {[
                { label:'Medical History', name:'medicalHistory', ph:'Previous surgeries, treatments...' },
                { label:'Known Allergies', name:'allergies', ph:'Penicillin, latex, metals...' },
                { label:'Chronic Conditions', name:'chronicConditions', ph:'Diabetes, BP, Asthma... (comma separated)' },
                { label:'Chief Complaint', name:'chiefComplaint', ph:'Main reason for visit...' },
                { label:'Dental History', name:'dentalHistory', ph:'Previous dental treatments...' },
              ].map(f => (
                <Field key={f.name} label={f.label}>
                  <textarea className="input-field" name={f.name} value={form[f.name]} onChange={handleChange} placeholder={f.ph} rows={3} style={{ ...inp, resize:'vertical', minHeight:76, color:'#111', fontWeight:500 }}/>
                </Field>
              ))}
            </div>
          </div>

          <div style={{ display:'flex', gap:10, justifyContent: isMobile ? 'stretch' : 'flex-end', flexWrap:'wrap' }}>
            <button type="button" onClick={() => navigate(`/patients/${id}`)} style={{ flex: isMobile ? 1 : undefined, padding:'12px 22px', background:'#fff', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}><X size={13} /> Cancel</button>
            <button type="submit" disabled={loading} style={{ flex: isMobile ? 1 : undefined, padding:'12px 30px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow:'0 4px 16px rgba(13,148,136,0.35)', display:'inline-flex', alignItems:'center', justifyContent:'center', gap:6 }}>
              {loading ? <><Loader2 size={13} style={{animation:'spin 1s linear infinite'}} /> Saving...</> : <><CheckCircle2 size={14} /> Save Changes</>}
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