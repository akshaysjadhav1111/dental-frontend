import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatientApi } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import { Users, UserPlus, Calendar, Bell, CreditCard, ClipboardList, Eye, Pencil, Trash2, Search, CheckCircle2, AlertTriangle, Clock, ArrowLeft, ArrowRight, Printer, Plus, RefreshCw, Activity, FileText, Stethoscope, Phone, Mail, MapPin, Loader2, XCircle, ChevronDown, Upload, X, Check, AlertCircle, Zap, Heart, Tag, Receipt, CreditCard as CardIcon, Folder, File, FileUp, Replace, RotateCcw, Droplets, Pill, Building2, CheckCheck, MinusCircle, UserCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

const api = (token) => axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
});

const apiMultipart = (token) => axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${token}` }
});

const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMobile = useMobile();

  const [patient, setPatient] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showVisitModal, setShowVisitModal] = useState(false);
  const [editVisit, setEditVisit] = useState(null);
  const [printVisit, setPrintVisit] = useState(null);
  const [showVisitSelect, setShowVisitSelect] = useState(false);

  const [reports, setReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [uploadingReport, setUploadingReport] = useState(false);
  const [replaceTarget, setReplaceTarget] = useState(null);
  const replaceInputRef = useRef(null);

  // Billing state
  const [billing, setBilling] = useState(null);
  const [billingLoading, setBillingLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showEditBillingModal, setShowEditBillingModal] = useState(false);
  const [editBillingVisit, setEditBillingVisit] = useState(null);
  const [showDeleteBillingConfirm, setShowDeleteBillingConfirm] = useState(false);
  const [deleteBillingVisit, setDeleteBillingVisit] = useState(null);

  useEffect(() => { fetchAll(); }, [id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, vRes] = await Promise.all([
        getPatientApi(id),
        api(token).get(`/visits/patient/${id}`)
      ]);
      setPatient(pRes.data);
      setVisits(vRes.data);
    } catch (e) {
      toast.error('Failed to load patient data');
    } finally {
      setLoading(false);
    }
    // Run these after main data loads — don't block UI
    fetchReports();
    fetchBilling();
  };

  const fetchBilling = async () => {
    setBillingLoading(true);
    try {
      const res = await api(token).get(`/patients/${id}/billing`);
      setBilling(res.data);
    } catch { setBilling(null); }
    finally { setBillingLoading(false); }
  };

  const fetchReports = async () => {
    setReportsLoading(true);
    try {
      const res = await api(token).get(`/reports/list/${id}`);
      setReports(res.data);
    } catch { setReports([]); }
    finally { setReportsLoading(false); }
  };

  const doUpload = async (file, replacingFileName = null) => {
    const allowed = ['application/pdf','image/jpeg','image/png','image/jpg','image/webp'];
    if (!allowed.includes(file.type)) { toast.error('Only PDF and image files allowed!'); return; }
    if (file.size > 20 * 1024 * 1024) { toast.error('File too large! Max 20MB'); return; }
    setUploadingReport(true);
    try {
      if (replacingFileName) {
        await api(token).delete(`/reports/delete/${id}/${replacingFileName}`);
      }
      const formData = new FormData();
      formData.append('file', file);
      await apiMultipart(token).post(`/reports/upload/${id}`, formData);
      toast.success(replacingFileName ? 'Report replaced!' : 'Report uploaded!');
      fetchReports();
    } catch { toast.error('Upload failed. Please try again.'); }
    finally { setUploadingReport(false); setReplaceTarget(null); }
  };

  const handleUploadNew = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    await doUpload(file);
    e.target.value = '';
  };

  const handleReplaceFile = async (e) => {
    const file = e.target.files[0];
    if (!file || !replaceTarget) return;
    await doUpload(file, replaceTarget.fileName);
    e.target.value = '';
  };

  const handleDeleteReport = async (fileName, displayName) => {
    if (!window.confirm(`Delete report "${displayName}"?`)) return;
    try {
      await api(token).delete(`/reports/delete/${id}/${fileName}`);
      toast.success('Report deleted');
      fetchReports();
    } catch { toast.error('Failed to delete report'); }
  };

  const handleSaveVisit = async (visitData) => {
    try {
      if (editVisit) {
        await api(token).put(`/visits/${editVisit.id}`, visitData);
        toast.success('Visit updated!');
      } else {
        await api(token).post('/visits', { ...visitData, patientId: id, patientName: patient.name });
        toast.success('Visit added successfully! <CheckCheck size={56} />');
      }
      setShowVisitModal(false);
      setEditVisit(null);
      fetchAll();
    } catch (e) {
      toast.error('Failed to save visit');
    }
  };

  const handlePrintClick = () => {
    if (visits.length === 0) { setPrintVisit({}); return; }
    if (visits.length === 1) { setPrintVisit(visits[0]); return; }
    setShowVisitSelect(true);
  };

  const handleDeleteVisit = async (visitId) => {
    if (!window.confirm('Delete this visit record?')) return;
    try {
      await api(token).delete(`/visits/${visitId}`);
      toast.success('Visit deleted');
      fetchAll();
    } catch (e) { toast.error('Failed to delete'); }
  };

  if (loading) return (
    <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#f5f6fa', color:'#00ACB1', fontSize:16 }}>
      <span style={{display:"inline-flex",alignItems:"center",gap:8}}><Loader2 size={18} style={{animation:"spin 1s linear infinite"}} /> Loading patient data...</span>
    </div>
  );

  if (!patient) return (
    <div style={{ display:'flex', minHeight:'100vh', alignItems:'center', justifyContent:'center', background:'#f5f6fa', color:'#dc2626', fontSize:16 }}>
      <XCircle size={18} /> Patient not found
    </div>
  );

  const lastVisit = visits[0];
  const balance = billing ? billing.balance : 0;
  const hasBalance = balance > 0.01;

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif", background:'#f5f6fa', overflowX:'hidden' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .tab-btn:hover  { background:#f0fefe!important; color:#00ACB1!important; }
        .visit-card:hover { border-color:#87E4DB!important; transform:translateY(-2px); box-shadow:0 8px 20px rgba(0,0,0,0.08)!important; }
        .action-btn:hover { opacity:0.85!important; transform:translateY(-1px); }
        .report-card:hover { border-color:#87E4DB!important; transform:translateY(-2px); }
        .upload-zone:hover { border-color:#00ACB1!important; background:#f0fefe!important; }
        .bill-row:hover { background:#f0fefe!important; }
        .pay-btn:hover { transform:translateY(-1px); box-shadow:0 5px 14px rgba(16,185,129,0.25)!important; }
        .minp:focus { border-color:#00ACB1!important; box-shadow:0 0 0 3px rgba(13,148,136,0.1)!important; outline:none; }
        .minp::placeholder { color:#6b7280; }
        .minp option { background:#fff; color:#111; }
        .pinp:focus { border-color:#00ACB1!important; outline:none; }
        .pinp::placeholder { color:#9ca3af; }
        .pinp2:focus { border-color:#00ACB1!important; outline:none; }
        .pinp2::placeholder { color:#9ca3af; }
        .sib-inp:focus { border-color:#00ACB1!important; outline:none; }
        .sib-inp::placeholder { color:#9ca3af; }
        .ebm-inp:focus { border-color:#f59e0b!important; outline:none; }
        .ebm-inp::placeholder { color:#9ca3af; }
        * { box-sizing:border-box; }
        ::-webkit-scrollbar { width:5px; }
        ::-webkit-scrollbar-thumb { background:#00ACB1; border-radius:4px; }
      `}</style>

      <Sidebar activePath="/patients" />

      <div style={{
        marginLeft: isMobile ? 0 : 240,
        flex: 1,
        minHeight: '100vh',
        width: isMobile ? '100%' : undefined,
        overflowX: 'hidden',
      }}>

        {/* ── TOP BAR ── */}
        <div style={{
          background: '#fff',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          marginBottom: 16,
          padding: isMobile ? '12px 12px' : '20px 28px',
        }}>
          {isMobile ? (
            <>
              {/* Row 1: Patient name + ID */}
              <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft: 58, marginBottom:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ color:'#111', fontSize:15, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center"}}><UserCircle size={20} /></span> {patient.name}
                  </div>
                  <div style={{ color:'#6b7280', fontSize:11, marginTop:2 }}>
                    Patient ID: {patient.id?.slice(-8).toUpperCase()}
                  </div>
                </div>
              </div>
              {/* Row 2: Back + Print + Edit + Visit */}
              <div style={{ display:'grid', gridTemplateColumns:'auto 1fr 1fr 1fr', gap:8, alignItems:'center' }}>
                <button onClick={() => navigate('/patients')} style={s.backBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><ArrowLeft size={14} /> Back</span></button>
                <button onClick={handlePrintClick} style={{ ...s.printTopBtn, padding:'10px 6px', fontSize:12, textAlign:'center' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Printer size={14} /> Print</span></button>
                <button onClick={() => navigate(`/patients/${id}/edit`)} style={{ ...s.editPatientBtn, padding:'10px 6px', fontSize:12, textAlign:'center' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={13} /> Edit</span></button>
                <button onClick={() => { setEditVisit(null); setShowVisitModal(true); }} style={{ ...s.addVisitBtn, padding:'10px 6px', fontSize:12, textAlign:'center' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15} /> Visit</span></button>
              </div>
            </>
          ) : (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <button onClick={() => navigate('/patients')} style={s.backBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><ArrowLeft size={14} /> Back</span></button>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'#111', fontSize:19, fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  <span style={{display:"inline-flex",alignItems:"center",justifyContent:"center"}}><UserCircle size={20} /></span> {patient.name}
                </div>
                <div style={{ color:'#6b7280', fontSize:11, marginTop:2 }}>
                  Patient ID: {patient.id?.slice(-8).toUpperCase()}
                </div>
              </div>
              <div style={{ display:'flex', gap:10, flexShrink:0 }}>
                <button onClick={handlePrintClick} style={s.printTopBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Printer size={14} /> Print Prescription</span></button>
                <button onClick={() => navigate(`/patients/${id}/edit`)} style={s.editPatientBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={14} /> Edit Patient</span></button>
                <button onClick={() => { setEditVisit(null); setShowVisitModal(true); }} style={{...s.addVisitBtn, display:'inline-flex', alignItems:'center', gap:7}}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15} /> Add Visit</span></button>
              </div>
            </div>
          )}
        </div>

        <div style={{ padding: isMobile ? '0 12px 40px' : '0 28px 40px' }}>

          {/* ── HERO CARD ── */}
          <div style={{ ...s.heroCard, animation:'fadeUp 0.4s ease', flexDirection: isMobile ? 'column' : 'row' }}>
            <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
              <div style={s.avatarCircle}>
                {patient.gender === 'Female' ? <UserCircle size={20} /> : <UserCircle size={20} />}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:'#111', fontWeight:800, fontSize: isMobile ? 18 : 22, wordBreak:'break-word' }}>{patient.name}</div>
                <div style={{ color:'#6b7280', fontSize:13, marginTop:4 }}>
                  {patient.age} yrs &bull; {patient.gender} &bull; {patient.bloodGroup || 'N/A'}
                </div>
                <div style={{ marginTop:10, display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ ...s.badge, background: patient.status==='active' ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: patient.status==='active' ? '#00ACB1' : '#f87171', border:`1px solid ${patient.status==='active' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}` }}>
                    ● {patient.status==='active' ? 'Active' : 'Inactive'}
                  </span>
                  <span style={{ ...s.badge, background:'rgba(94,234,212,0.1)', color:'#00ACB1', border:'1px solid rgba(94,234,212,0.2)' }}>
                    <Calendar size={16} /> {visits.length} Visit{visits.length !== 1 ? 's' : ''}
                  </span>
                  {patient.nextFollowUp && (
                    <span style={{ ...s.badge, background:'rgba(251,191,36,0.15)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.3)' }}>
                      ⏰ {new Date(patient.nextFollowUp).toLocaleDateString('en-IN')}
                    </span>
                  )}
                  {/* BALANCE BADGE — red if owing */}
                  {billing && hasBalance && (
                    <span
                      onClick={() => setActiveTab('billing')}
                      style={{ ...s.badge, background:'#fef2f2', color:'#dc2626', border:'1px solid #fca5a5', cursor:'pointer' }}
                      title="Click to view billing"
                    >
                      <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CreditCard size={11} /> Due:</span> {fmt(balance)}
                    </span>
                  )}
                  {billing && !hasBalance && billing.totalBilled > 0 && (
                    <span style={{ ...s.badge, background:'#f0fefe', color:'#015D67', border:'1px solid #87E4DB' }}>
                      <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Fully Paid</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div style={{
              flex:1, minWidth:0,
              borderTop: isMobile ? '1px solid rgba(255,255,255,0.07)' : 'none',
              paddingTop: isMobile ? 16 : 0,
            }}>
              <InfoPill icon={<Phone size={16} />} label="Contact"    value={patient.contactNumber} />
              <InfoPill icon={<Mail size={16} />} label="Email"      value={patient.email || 'Not provided'} />
              <InfoPill icon={<MapPin size={16} />} label="Address"    value={patient.address || 'Not provided'} />
              <InfoPill icon={<Calendar size={16} />} label="Registered" value={patient.registeredAt ? new Date(patient.registeredAt).toLocaleDateString('en-IN') : 'N/A'} />
              {lastVisit && <InfoPill icon={<Stethoscope size={14} />} label="Last Visit" value={new Date(lastVisit.visitDate).toLocaleDateString('en-IN')} />}
            </div>
          </div>

          {/* ── SET INITIAL BILLING (shown when no billing exists yet) ── */}
          {billing !== null && billing.totalBilled === 0 && (
            <SetInitialBillingBar
              patient={patient}
              token={token}
              patientId={id}
              isMobile={isMobile}
              onSuccess={() => fetchAll()}
            />
          )}

          {/* ── BILLING MINI SUMMARY BAR (shown if there's any billing data) ── */}
          {billing && billing.totalBilled > 0 && (
            <div style={{
              margin:'16px 0 0',
              background:'#fff', border:'1px solid #e5e7eb',
              borderRadius:16, padding: isMobile ? '12px 14px' : '14px 24px',
              animation:'fadeUp 0.4s ease 0.1s both',
            }}>
              {/* Top row: amounts + buttons */}
              <div style={{ display:'flex', gap: isMobile ? 8 : 16, flexWrap:'wrap', alignItems:'center' }}>
                {[
                  { label:'Total Billed', value: fmt(billing.totalBilled), color:'#111', icon:'🧾' },
                  { label:'Total Paid',   value: fmt(billing.totalPaid),   color:'#015D67', icon:'✅' },
                  { label:'Balance Due',  value: fmt(billing.balance),     color: hasBalance ? '#dc2626' : '#015D67', icon: hasBalance ? '⚠️' : '🎉' },
                ].map((item, i) => (
                  <div key={i} style={{ flex:1, minWidth: isMobile ? 80 : 130, textAlign:'center' }}>
                    <div style={{ color:'#374151', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:4 }}>{item.icon} {item.label}</div>
                    <div style={{ color: item.color, fontWeight:800, fontSize: isMobile ? 16 : 20 }}>{item.value}</div>
                  </div>
                ))}
                  {/* Action buttons */}
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  <button
                    onClick={async () => {
                      try {
                        // Fetch FULL visit (not partial billing summary object)
                        const fullVisit = await api(token).get(`/visits/${billing.visits?.find(v => v.treatmentCost > 0)?.id || billing.visits?.[0]?.id}`);
                        setEditBillingVisit(fullVisit.data);
                        setShowEditBillingModal(true);
                      } catch { toast.error('Could not load visit data'); }
                    }}
                    style={{ background:'#f0fefe', color:'#015D67', border:'1px solid #87E4DB', borderRadius:9, padding: isMobile ? '7px 11px' : '9px 16px', cursor:'pointer', fontSize: isMobile ? 12 : 13, fontWeight:700, whiteSpace:'nowrap', transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:6 }}
                  >
                    <Pencil size={14} /> {isMobile ? '' : 'Edit Billing'}
                  </button>
                  <button
                    onClick={async () => {
                      try {
                        const visitId = billing.visits?.find(v => v.treatmentCost > 0)?.id || billing.visits?.[0]?.id;
                        const fullVisit = await api(token).get(`/visits/${visitId}`);
                        setDeleteBillingVisit(fullVisit.data);
                        setShowDeleteBillingConfirm(true);
                      } catch { toast.error('Could not load visit data'); }
                    }}
                    style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:9, padding: isMobile ? '7px 9px' : '9px 13px', cursor:'pointer', fontSize: isMobile ? 12 : 13, fontWeight:700, whiteSpace:'nowrap', transition:'all 0.2s', display:'inline-flex', alignItems:'center', gap:5 }}
                  >
                    <Trash2 size={14} /> {isMobile ? '' : 'Delete'}
                  </button>
                </div>
              </div>

              {/* Visit-wise billing rows (compact) */}
              {billing.visits && billing.visits.length > 1 && (
                <div style={{ marginTop:14, borderTop:'1px solid rgba(255,255,255,0.06)', paddingTop:12 }}>
                  <div style={{ color:'#9ca3af', fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:8 }}>Visit Breakdown</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                    {billing.visits.map((v, i) => {
                      if (!v.treatmentCost && !v.amountPaid) return null;
                      const vBal = (v.treatmentCost||0) - (v.amountPaid||0);
                      return (
                        <div key={v.id} style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', padding:'8px 12px', background:'#f3f4f6', borderRadius:10 }}>
                          <span style={{ color:'#9ca3af', fontSize:11, minWidth:60 }}>
                            {v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short'}) : `Visit ${i+1}`}
                          </span>
                          <span style={{ flex:1, color:'#374151', fontSize:12, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {v.treatment || v.diagnosis || 'Treatment'}
                          </span>
                          <span style={{ color:'#111', fontSize:13, fontWeight:700 }}>{fmt(v.treatmentCost||0)}</span>
                          <span style={{ color:'#015D67', fontSize:12, fontWeight:600 }}>Paid: {fmt(v.amountPaid||0)}</span>
                          <span style={{ color: vBal > 0.01 ? '#dc2626' : '#015D67', fontSize:12, fontWeight:700 }}>Due: {fmt(vBal)}</span>
                          {/* Per-visit edit/delete */}
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={async () => {
                              try {
                                const fullVisit = await api(token).get(`/visits/${v.id}`);
                                setEditBillingVisit(fullVisit.data); setShowEditBillingModal(true);
                              } catch { toast.error('Could not load visit'); }
                            }}
                              style={{ background:'rgba(251,191,36,0.1)', color:'#fbbf24', border:'1px solid rgba(251,191,36,0.2)', borderRadius:7, padding:'4px 10px', cursor:'pointer', fontSize:11, fontWeight:600 }}><Pencil size={14} /></button>
                            <button onClick={async () => {
                              try {
                                const fullVisit = await api(token).get(`/visits/${v.id}`);
                                setDeleteBillingVisit(fullVisit.data); setShowDeleteBillingConfirm(true);
                              } catch { toast.error('Could not load visit'); }
                            }}
                              style={{ background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)', borderRadius:7, padding:'4px 8px', cursor:'pointer', fontSize:11 }}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TABS ── */}
          <div style={{ display:'flex', gap:8, margin:'20px 0 16px', overflowX:'auto', paddingBottom:4, WebkitOverflowScrolling:'touch' }}>
            {[
              { key:'overview', label:<span style={{display:'inline-flex',alignItems:'center',gap:4}}><ClipboardList size={12} /> Overview</span> },
              { key:'visits',   label:<span style={{display:"inline-flex",alignItems:"center",gap:6}}><Stethoscope size={14} /> Visits ({visits.length})</span> },
              { key:'medical',  label:<span style={{display:"inline-flex",alignItems:"center",gap:6}}><Building2 size={14} /> Medical</span> },
              { key:'billing',  label:`Billing${hasBalance ? " ●" : ""}` },
              { key:'reports',  label:<span style={{display:"inline-flex",alignItems:"center",gap:6}}><Folder size={14} /> Reports ({reports.length})</span> },
            ].map(tab => (
              <button key={tab.key} className="tab-btn" onClick={() => setActiveTab(tab.key)}
                style={{ ...s.tabBtn, ...(activeTab===tab.key ? s.tabActive : {}), whiteSpace:'nowrap', flexShrink:0 }}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── TAB: OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div style={{ animation:'fadeUp 0.3s ease' }}>
              <div style={s.grid2}>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><Stethoscope size={14}/>Chief Complaint</span>} color="#5eead4">
                  <p style={s.cardText}>{patient.chiefComplaint || 'Not recorded'}</p>
                </InfoCard>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertTriangle size={16}/> Allergies</span>} color="#fbbf24">
                  <p style={s.cardText}>{patient.allergies || 'None reported'}</p>
                </InfoCard>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={14}/>Chronic Conditions</span>} color="#f87171">
                  {patient.chronicConditions?.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {patient.chronicConditions.map((c,i) => (
                        <span key={i} style={{ ...s.badge, background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)' }}>{c}</span>
                      ))}
                    </div>
                  ) : <p style={s.cardText}>None reported</p>}
                </InfoCard>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><Stethoscope size={14}/> Last Visit Summary</span>} color="#a78bfa">
                  {lastVisit ? (
                    <div>
                      <div style={{ color:'#6b7280', fontSize:12, marginBottom:8 }}>
                        {new Date(lastVisit.visitDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                      </div>
                      <div style={{ color:'#111', fontSize:13, fontWeight:500, marginBottom:5 }}><b>Diagnosis:</b> {lastVisit.diagnosis || 'N/A'}</div>
                      <div style={{ color:'#111', fontSize:13 }}><b>Treatment:</b> {lastVisit.treatment || 'N/A'}</div>
                    </div>
                  ) : <p style={s.cardText}>No visits yet</p>}
                </InfoCard>
              </div>
            </div>
          )}

          {/* ── TAB: VISITS ── */}
          {activeTab === 'visits' && (
            <div style={{ animation:'fadeUp 0.3s ease' }}>
              {visits.length === 0 ? (
                <div style={s.emptyBox}>
                  <div style={{ fontSize:48, marginBottom:16 }}><Stethoscope size={14} /></div>
                  <div style={{ color:'#111', fontSize:18, fontWeight:700, marginBottom:8 }}>No visits recorded yet</div>
                  <div style={{ color:'#9ca3af', marginBottom:20 }}>Add the first visit for this patient</div>
                  <button onClick={() => { setEditVisit(null); setShowVisitModal(true); }} style={{...s.addVisitBtn, display:'inline-flex', alignItems:'center', gap:7}}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15} /> Add First Visit</span></button>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
                  {visits.map((visit, idx) => (
                    <div key={visit.id} className="visit-card" style={{ ...s.visitCard, animation:`fadeUp 0.3s ease ${idx*0.05}s both` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:18, paddingBottom:16, borderBottom:'1px solid #f3f4f6', flexWrap:'wrap', gap:12 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                          <div style={s.visitNum}>{idx+1}</div>
                          <div>
                            <div style={{ color:'#111', fontWeight:700, fontSize:15 }}>
                              {new Date(visit.visitDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}
                            </div>
                            <div style={{ color:'#374151', fontSize:12 }}>
                              {new Date(visit.visitDate).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                          {visit.paymentStatus && (
                            <span style={{ ...s.badge,
                              background: visit.paymentStatus==='paid' ? 'rgba(16,185,129,0.15)' : visit.paymentStatus==='partial' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
                              color:      visit.paymentStatus==='paid' ? '#015D67'               : visit.paymentStatus==='partial' ? '#b45309'               : '#dc2626',
                              border:    `1px solid ${visit.paymentStatus==='paid' ? 'rgba(16,185,129,0.3)' : visit.paymentStatus==='partial' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
                            }}>
                              {visit.paymentStatus==='paid' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Paid</span> : visit.paymentStatus==='partial' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={12} /> Partial</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Clock size={12} /> Pending</span>}
                            </span>
                          )}
                          {visit.treatmentCost > 0 && (
                            <span style={{ ...s.badge, background:'rgba(94,234,212,0.1)', color:'#00ACB1', border:'1px solid rgba(94,234,212,0.2)' }}>
                              {fmt(visit.treatmentCost)}
                            </span>
                          )}
                          {visit.amountPaid > 0 && visit.paymentStatus !== 'paid' && (
                            <span style={{ ...s.badge, background:'rgba(16,185,129,0.1)', color:'#34d399', border:'1px solid rgba(52,211,153,0.2)', fontSize:11 }}>
                              Paid: {fmt(visit.amountPaid)}
                            </span>
                          )}
                          <button className="action-btn" onClick={() => { setEditVisit(visit); setShowVisitModal(true); }} style={s.editBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={13} /> Edit</span></button>
                          <button className="action-btn" onClick={() => setPrintVisit(visit)} style={s.printBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Printer size={14} /> Print</span></button>
                          <button className="action-btn" onClick={() => handleDeleteVisit(visit.id)} style={s.deleteBtn}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div style={s.visitGrid}>
                        <VisitField label="Symptoms"     value={visit.symptoms} />
                        <VisitField label="Diagnosis"    value={visit.diagnosis} />
                        <VisitField label="Treatment"    value={visit.treatment} />
                        <VisitField label="Doctor Notes" value={visit.doctorNotes} />
                        {visit.nextVisitDate && <VisitField label="Next Visit" value={new Date(visit.nextVisitDate).toLocaleDateString('en-IN')} highlight />}
                        {visit.followUpNotes && <VisitField label="Follow-up Notes" value={visit.followUpNotes} />}
                      </div>
                      {visit.prescriptions?.length > 0 && (
                        <div style={s.prescBox}>
                          <div style={{ color:'#015D67', fontWeight:700, fontSize:13, marginBottom:12, letterSpacing:'1px', textTransform:'uppercase' }}><Pill size={14} /> Prescriptions</div>
                          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                            {visit.prescriptions.map((p,i) => (
                              <div key={i} style={{ display:'flex', gap:12, flexWrap:'wrap', padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
                                <span style={{ color:'#111', fontWeight:700, minWidth:140 }}><Pill size={14} /> {p.medicineName}</span>
                                <span style={s.prescDetail}>{p.dosage}</span>
                                <span style={s.prescDetail}>{p.frequency}</span>
                                <span style={s.prescDetail}>{p.duration}</span>
                                <span style={{ ...s.prescDetail, color:'#9ca3af' }}>{p.instructions}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: MEDICAL INFO ── */}
          {activeTab === 'medical' && (
            <div style={{ animation:'fadeUp 0.3s ease' }}>
              <div style={s.grid2}>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><FileText size={14}/>Medical History</span>}   color="#60a5fa"><p style={s.cardText}>{patient.medicalHistory || 'No medical history recorded'}</p></InfoCard>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><Stethoscope size={14}/>Dental History</span>}    color="#5eead4"><p style={s.cardText}>{patient.dentalHistory || 'No dental history recorded'}</p></InfoCard>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertTriangle size={16}/> Allergies</span>}         color="#fbbf24"><p style={s.cardText}>{patient.allergies || 'None'}</p></InfoCard>
                <InfoCard title={<span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={14}/>Chronic Conditions</span>} color="#f87171">
                  {patient.chronicConditions?.length > 0 ? (
                    <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
                      {patient.chronicConditions.map((c,i) => (
                        <span key={i} style={{ ...s.badge, background:'rgba(248,113,113,0.15)', color:'#f87171', border:'1px solid rgba(248,113,113,0.3)' }}>{c}</span>
                      ))}
                    </div>
                  ) : <p style={s.cardText}>None</p>}
                </InfoCard>
              </div>
            </div>
          )}

          {/* ── TAB: BILLING ── */}
          {activeTab === 'billing' && (
            <div style={{ animation:'fadeUp 0.3s ease' }}>
              {billingLoading ? (
                <div style={{ textAlign:'center', padding:'60px 0', color:'#9ca3af' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Loader2 size={14} style={{animation:"spin 1s linear infinite"}} /> Loading billing...</span></div>
              ) : (
                <>
                  {/* Summary cards */}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:16, marginBottom:24 }}>
                    {[
                      { label:'Total Billed', value: fmt(billing?.totalBilled || 0), color:'#111', bg:'#f0fefe', border:'#87E4DB', icon:'🧾' },
                      { label:'Total Paid',   value: fmt(billing?.totalPaid   || 0), color:'#015D67', bg:'#CAF0C1', border:'#87E4DB', icon:'✅' },
                      { label:'Balance Due',  value: fmt(billing?.balance     || 0), color: hasBalance ? '#dc2626' : '#015D67', bg: hasBalance ? '#fef2f2' : '#CAF0C1', border: hasBalance ? '#fca5a5' : '#87E4DB', icon: hasBalance ? '⚠️' : '🎉' },
                    ].map((card, i) => (
                      <div key={i} style={{ background: card.bg, border:`1px solid ${card.border}`, borderRadius:16, padding:'22px 20px', textAlign:'center' }}>
                        <div style={{ fontSize:28, marginBottom:8 }}>{card.icon}</div>
                        <div style={{ color:'#6b7280', fontSize:11, textTransform:'uppercase', letterSpacing:'1.5px', marginBottom:8 }}>{card.label}</div>
                        <div style={{ color: card.color, fontWeight:900, fontSize:26 }}>{card.value}</div>
                      </div>
                    ))}
                  </div>

                  {/* Add payment button */}
                  <div style={{ display:'flex', justifyContent: isMobile ? 'stretch' : 'flex-end', marginBottom:20 }}>
                    <button
                      className="pay-btn"
                      onClick={() => setShowPaymentModal(true)}
                      style={{ flex: isMobile ? 1 : undefined, background:'linear-gradient(135deg,#015D67,#00ACB1)', color:'#fff', border:'none', borderRadius:12, padding:'13px 28px', cursor:'pointer', fontSize:15, fontWeight:700, boxShadow:'0 4px 16px rgba(0,172,177,0.35)', transition:'all 0.2s' }}
                    >
                      <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CreditCard size={15} /> Record New Payment</span>
                    </button>
                  </div>

                  {/* Per-visit breakdown table */}
                  {billing?.visits?.length > 0 ? (
                    <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, overflow:'hidden' }}>
                      <div style={{ padding:'18px 20px', borderBottom:'1px solid #f3f4f6', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ color:'#111', fontWeight:700, fontSize:15 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><ClipboardList size={15} /> Visit-wise Breakdown</span></div>
                        <div style={{ color:'#374151', fontSize:12 }}>{billing.visits.filter(v => (v.treatmentCost||0) > 0 || (v.amountPaid||0) > 0).length} visit{billing.visits.filter(v => (v.treatmentCost||0) > 0 || (v.amountPaid||0) > 0).length !== 1 ? 's' : ''}</div>
                      </div>
                      <div style={{ overflowX:'auto' }}>
                        <table style={{ width:'100%', borderCollapse:'collapse' }}>
                          <thead>
                            <tr>
                              {['#','Date','Treatment / Diagnosis','Billed','Paid','Balance','Status'].map(h => (
                                <th key={h} style={{ padding:'12px 16px', textAlign:'left', color:'#9ca3af', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', background:'#f9fafb', borderBottom:'1px solid #f3f4f6', whiteSpace:'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {billing.visits.filter(v => (v.treatmentCost || 0) > 0 || (v.amountPaid || 0) > 0).map((v, idx) => {
                              const st = v.paymentStatus;
                              const stColor  = st==='paid' ? '#015D67' : st==='partial' ? '#b45309' : '#dc2626';
                              const stBg     = st==='paid' ? 'rgba(16,185,129,0.15)' : st==='partial' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)';
                              const stBorder = st==='paid' ? 'rgba(16,185,129,0.3)' : st==='partial' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)';
                              return (
                                <tr key={v.id} className="bill-row" style={{ borderBottom:'1px solid rgba(255,255,255,0.05)', transition:'background 0.15s' }}>
                                  <td style={{ padding:'14px 16px' }}>
                                    <div style={{ width:28, height:28, borderRadius:'50%', background:'#f0fefe', color:'#015D67', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700 }}>{idx+1}</div>
                                  </td>
                                  <td style={{ padding:'14px 16px', color:'#111', fontSize:13, whiteSpace:'nowrap' }}>
                                    {v.visitDate ? new Date(v.visitDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'}
                                  </td>
                                  <td style={{ padding:'14px 16px' }}>
                                    <div style={{ color:'#111', fontSize:13, fontWeight:600 }}>{v.treatment || v.diagnosis || '—'}</div>
                                    {v.diagnosis && v.treatment && <div style={{ color:'#9ca3af', fontSize:11, marginTop:2 }}>{v.diagnosis}</div>}
                                  </td>
                                  <td style={{ padding:'14px 16px', color:'#111', fontWeight:700, whiteSpace:'nowrap' }}>{fmt(v.treatmentCost)}</td>
                                  <td style={{ padding:'14px 16px', color:'#015D67', fontWeight:700, whiteSpace:'nowrap' }}>{fmt(v.amountPaid)}</td>
                                  <td style={{ padding:'14px 16px', fontWeight:700, whiteSpace:'nowrap' }}>
                                    <span style={{ color: v.balance > 0.01 ? '#dc2626' : '#015D67', fontWeight:700 }}>{fmt(v.balance)}</span>
                                  </td>
                                  <td style={{ padding:'14px 16px' }}>
                                    <span style={{ background:stBg, color:stColor, border:`1px solid ${stBorder}`, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap' }}>
                                      {st==='paid' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Paid</span> : st==='partial' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={12} /> Partial</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Clock size={12} /> Pending</span>}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr style={{ background:'rgba(13,148,136,0.1)', borderTop:'2px solid rgba(94,234,212,0.2)' }}>
                              <td colSpan={3} style={{ padding:'14px 16px', color:'#111', fontWeight:800, fontSize:14 }}>TOTAL</td>
                              <td style={{ padding:'14px 16px', color:'#111', fontWeight:800, fontSize:15 }}>{fmt(billing.totalBilled)}</td>
                              <td style={{ padding:'14px 16px', color:'#015D67', fontWeight:800, fontSize:15 }}>{fmt(billing.totalPaid)}</td>
                              <td style={{ padding:'14px 16px', color: hasBalance ? '#dc2626' : '#015D67', fontWeight:800, fontSize:15 }}>{fmt(billing.balance)}</td>
                              <td style={{ padding:'14px 16px' }}>
                                <span style={{ background: hasBalance ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)', color: hasBalance ? '#dc2626' : '#015D67', border:`1px solid ${hasBalance ? '#fca5a5' : '#87E4DB'}`, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700 }}>
                                  {hasBalance ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertTriangle size={11} /> Balance Due</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Cleared</span>}
                                </span>
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign:'center', padding:'60px 20px', background:'#fafafa', borderRadius:20, border:'1px dashed rgba(255,255,255,0.1)' }}>
                      <div style={{ fontSize:52, marginBottom:12 }}><CreditCard size={20} /></div>
                      <div style={{ color:'#111', fontWeight:700, fontSize:16, marginBottom:6 }}>No billing records yet</div>
                      <div style={{ color:'#9ca3af', fontSize:13 }}>Add a visit with treatment cost to start tracking payments</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TAB: REPORTS ── */}
          {activeTab === 'reports' && (
            <div style={{ animation:'fadeUp 0.3s ease' }}>
              <input ref={replaceInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                onChange={handleReplaceFile} style={{ display:'none' }} />
              <label htmlFor="report-upload-new" className="upload-zone" style={{
                display:'block', border:'2px dashed #d1d5db', borderRadius:16,
                padding:'28px 24px', cursor: uploadingReport ? 'not-allowed' : 'pointer',
                background:'rgba(13,148,136,0.04)', textAlign:'center', marginBottom:24, transition:'all 0.2s',
              }}>
                <input id="report-upload-new" type="file" accept=".pdf,.jpg,.jpeg,.png,.webp"
                  onChange={handleUploadNew} style={{ display:'none' }} disabled={uploadingReport} />
                {uploadingReport ? (
                  <div><div style={{ fontSize:36, marginBottom:8, animation:'pulse 1s infinite' }}>⏳</div><div style={{ color:'#00ACB1', fontWeight:700, fontSize:15 }}>Uploading...</div></div>
                ) : (
                  <div><div style={{ fontSize:40, marginBottom:8 }}><Upload size={40} /></div><div style={{ color:'#111', fontWeight:700, fontSize:15, marginBottom:4 }}>Click to Upload Report</div><div style={{ color:'#374151', fontSize:12 }}>PDF, JPG, PNG, WEBP • Max 20MB</div></div>
                )}
              </label>
              {reportsLoading ? (
                <div style={{ textAlign:'center', padding:'40px 0', color:'#9ca3af' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Loader2 size={14} style={{animation:"spin 1s linear infinite"}} /> Loading reports...</span></div>
              ) : reports.length === 0 ? (
                <div style={{ textAlign:'center', padding:'50px 20px', background:'#fafafa', borderRadius:16, border:'1px dashed rgba(255,255,255,0.1)' }}>
                  <div style={{ fontSize:48, marginBottom:12 }}><Folder size={48} /></div>
                  <div style={{ color:'#111', fontWeight:700, fontSize:16, marginBottom:6 }}>No reports uploaded yet</div>
                  <div style={{ color:'#9ca3af', fontSize:13 }}>Upload X-rays, lab reports, or scan documents above</div>
                </div>
              ) : (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:16 }}>
                  {reports.map((report,i) => (
                    <div key={i} className="report-card" style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', transition:'all 0.2s', animation:`fadeUp 0.3s ease ${i*0.05}s both` }}>
                      <div style={{ height:150, background:'#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', overflow:'hidden', position:'relative' }}
                        onClick={() => window.open(`http://localhost:8080/api/reports/view/${id}/${report.fileName}`, '_blank')}>
                        {report.type === 'image' ? (
                          <img src={`http://localhost:8080/api/reports/view/${id}/${report.fileName}`} alt={report.displayName} style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} />
                        ) : (
                          <div style={{ textAlign:'center' }}>
                            <div style={{ fontSize:52 }}>{report.type==='pdf' ? <File size={52} /> : <File size={52} />}</div>
                            <div style={{ color:'#6b7280', fontSize:11, marginTop:4, textTransform:'uppercase', letterSpacing:1 }}>{report.type}</div>
                          </div>
                        )}
                        <div style={{ position:'absolute', inset:0, background:'rgba(13,148,136,0)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background='rgba(13,148,136,0.55)'; e.currentTarget.querySelector('span').style.opacity=1; }}
                          onMouseLeave={e => { e.currentTarget.style.background='rgba(13,148,136,0)'; e.currentTarget.querySelector('span').style.opacity=0; }}>
                          <span style={{ color:'#111', fontWeight:700, fontSize:14, opacity:0, transition:'opacity 0.2s' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Eye size={13} /> View</span></span>
                        </div>
                      </div>
                      <div style={{ padding:'12px 14px' }}>
                        <div style={{ color:'#111', fontSize:12, fontWeight:700, marginBottom:10, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={report.displayName}>{report.displayName}</div>
                        <div style={{ display:'flex', gap:6 }}>
                          <button onClick={() => window.open(`http://localhost:8080/api/reports/view/${id}/${report.fileName}`, '_blank')} style={{ flex:1, padding:'7px 0', background:'rgba(13,148,136,0.2)', color:'#00ACB1', border:'1px solid rgba(94,234,212,0.25)', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:600 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Eye size={13} /> View</span></button>
                          <button onClick={() => { setReplaceTarget({ fileName:report.fileName, displayName:report.displayName }); setTimeout(() => replaceInputRef.current?.click(), 50); }} style={{ flex:1, padding:'7px 0', background:'#f0fefe', color:'#015D67', border:'1px solid #87E4DB', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600 }}><RefreshCw size={14} /> Replace</button>
                          <button onClick={() => handleDeleteReport(report.fileName, report.displayName)} style={{ padding:'7px 10px', background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, cursor:'pointer', fontSize:11 }}><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* VISIT MODAL */}
      {showVisitModal && (
        <VisitModal visit={editVisit} onSave={handleSaveVisit} onClose={() => { setShowVisitModal(false); setEditVisit(null); }} />
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && (
        <PaymentModal
          patient={patient}
          billing={billing}
          token={token}
          patientId={id}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={() => { setShowPaymentModal(false); fetchAll(); }}
        />
      )}

      {/* VISIT SELECT MODAL */}
      {showVisitSelect && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:1500, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', border:'1px solid rgba(94,234,212,0.2)', borderRadius:20, padding:32, maxWidth:480, width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.5)' }}>
            <div style={{ color:'#111', fontWeight:800, fontSize:18, marginBottom:6 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Printer size={18} /> Select Visit to Print</span></div>
            <div style={{ color:'#6b7280', fontSize:13, marginBottom:24 }}>Choose which visit's prescription to print</div>
            <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:320, overflowY:'auto' }}>
              {visits.map((v,i) => (
                <button key={v.id} onClick={() => { setShowVisitSelect(false); setPrintVisit(v); }}
                  style={{ background:'#f9fafb', border:'1px solid rgba(94,234,212,0.15)', borderRadius:12, padding:'14px 18px', cursor:'pointer', textAlign:'left', color:'#111', transition:'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(13,148,136,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}>
                  <div style={{ fontWeight:700, fontSize:14 }}>Visit #{i+1} — {new Date(v.visitDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
                  <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>
                    {v.diagnosis ? `Diagnosis: ${v.diagnosis}` : v.symptoms ? `Symptoms: ${v.symptoms}` : 'No diagnosis recorded'}
                    {v.prescriptions?.length > 0 ? ` • ${v.prescriptions.length} medicine(s)` : ' • No medicines'}
                  </div>
                </button>
              ))}
            </div>
            <button onClick={() => setShowVisitSelect(false)} style={{ marginTop:20, width:'100%', padding:'11px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, color:'#374151', cursor:'pointer', fontSize:14, fontWeight:600 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><X size={14} /> Cancel</span></button>
          </div>
        </div>
      )}

      {/* PRINT MODAL */}
      {printVisit && (
        <PrintPrescriptionModal visit={printVisit} patient={patient} onClose={() => setPrintVisit(null)} />
      )}

      {/* EDIT BILLING MODAL */}
      {showEditBillingModal && editBillingVisit && (
        <EditBillingModal
          visit={editBillingVisit}
          token={token}
          onClose={() => { setShowEditBillingModal(false); setEditBillingVisit(null); }}
          onSuccess={() => {
            setShowEditBillingModal(false);
            setEditBillingVisit(null);
            // Small delay ensures backend syncPatientBilling completes before we refetch
            setTimeout(() => { fetchAll(); }, 400);
          }}
        />
      )}

      {/* DELETE BILLING CONFIRM */}
      {showDeleteBillingConfirm && deleteBillingVisit && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', border:'1px solid rgba(239,68,68,0.3)', borderRadius:24, padding:'36px 32px', textAlign:'center', maxWidth:420, width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
            <div style={{ fontSize:48, marginBottom:16 }}><Trash2 size={14} /></div>
            <div style={{ color:'#111', fontSize:20, fontWeight:800, marginBottom:8 }}>Delete Billing Entry?</div>
            <div style={{ color:'#6b7280', fontSize:14, marginBottom:8, lineHeight:1.6 }}>
              This will delete the billing record:
            </div>
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:12, padding:'12px 16px', marginBottom:24 }}>
              <div style={{ color:'#f87171', fontWeight:700 }}>
                Charged: {fmt(deleteBillingVisit.treatmentCost || 0)} &nbsp;|&nbsp; Paid: {fmt(deleteBillingVisit.amountPaid || 0)}
              </div>
              {(deleteBillingVisit.treatment || deleteBillingVisit.diagnosis) && (
                <div style={{ color:'#6b7280', fontSize:12, marginTop:4 }}>
                  {deleteBillingVisit.treatment || deleteBillingVisit.diagnosis}
                </div>
              )}
            </div>
            <div style={{ color:'#9ca3af', fontSize:13, marginBottom:24 }}>This action cannot be undone.</div>
            <div style={{ display:'flex', gap:12, justifyContent:'center' }}>
              <button
                onClick={() => { setShowDeleteBillingConfirm(false); setDeleteBillingVisit(null); }}
                style={{ padding:'12px 28px', background:'#fff', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}
              ><span style={{display:"inline-flex",alignItems:"center",gap:6}}><X size={14} /> Cancel</span></button>
              <button
                onClick={async () => {
                  try {
                    const apiInst = axios.create({ baseURL:'http://localhost:8080/api', headers:{ Authorization:`Bearer ${token}` } });
                    await apiInst.delete(`/visits/${deleteBillingVisit.id}`);
                    toast.success('Billing entry deleted');
                    setShowDeleteBillingConfirm(false);
                    setDeleteBillingVisit(null);
                    fetchAll();
                  } catch { toast.error('Failed to delete billing entry'); }
                }}
                style={{ padding:'12px 28px', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#111', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(239,68,68,0.4)' }}
              ><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Trash2 size={14} /> Yes, Delete</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment Modal ─────────────────────────────────────────────────
function PaymentModal({ patient, billing, token, patientId, onClose, onSuccess }) {
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  const balance = billing?.balance || 0;
  const hasBalance = balance > 0.01;

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) { toast.error('Please enter a valid amount'); return; }
    setLoading(true);
    try {
      const api = axios.create({ baseURL: 'http://localhost:8080/api', headers: { Authorization: `Bearer ${token}` } });
      await api.post(`/patients/${patientId}/billing/payment`, { amount: amt, note });
      toast.success(`Payment of ₹${amt} recorded!`);
      onSuccess();
    } catch {
      toast.error('Failed to record payment');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', border:'1px solid #CAF0C1', borderRadius:18, padding:'26px', maxWidth:440, width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
        <style>{`.pinp2:focus{border-color:rgba(16,185,129,0.6)!important;outline:none;}.pinp2::placeholder{color:#9ca3af;}`}</style>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:24 }}>
          <div>
            <div style={{ color:'#111', fontWeight:800, fontSize:20 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><CreditCard size={14} /> Record Payment</span></div>
            <div style={{ color:'#9ca3af', fontSize:13, marginTop:4 }}>for {patient.name}</div>
          </div>
          <button onClick={onClose} style={{ background:'#f9fafb', border:'none', color:'#374151', fontSize:20, borderRadius:8, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} /></button>
        </div>

        {/* Balance overview */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:24 }}>
          {[
            { label:'Billed', value: fmt(billing?.totalBilled || 0), color:'#00ACB1' },
            { label:'Paid',   value: fmt(billing?.totalPaid   || 0), color:'#00ACB1' },
            { label:'Due',    value: fmt(balance), color: hasBalance ? '#f87171' : '#00ACB1' },
          ].map((c, i) => (
            <div key={i} style={{ background:'#f9fafb', borderRadius:12, padding:'12px 10px', textAlign:'center' }}>
              <div style={{ color:'#9ca3af', fontSize:10, textTransform:'uppercase', letterSpacing:1, marginBottom:4 }}>{c.label}</div>
              <div style={{ color: c.color, fontWeight:800, fontSize:16 }}>{c.value}</div>
            </div>
          ))}
        </div>

        {/* Quick fill buttons */}
        {hasBalance && (
          <div style={{ marginBottom:16 }}>
            <div style={{ color:'#9ca3af', fontSize:11, marginBottom:8, textTransform:'uppercase', letterSpacing:1 }}>Quick Fill</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label:'Full Balance', val: balance },
                { label:'₹500', val: 500 },
                { label:'₹1000', val: 1000 },
                { label:'₹2000', val: 2000 },
              ].filter(q => q.val > 0 && q.val <= balance + 0.01).map((q, i) => (
                <button key={i} onClick={() => setAmount(String(q.val))}
                  style={{ background:'rgba(16,185,129,0.12)', color:'#00ACB1', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13, fontWeight:600 }}>
                  {q.label === 'Full Balance' ? `Full: ${fmt(q.val)}` : q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ color:'#374151', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', display:'block', marginBottom:6 }}>Amount Received (₹) *</label>
            <input
              className="pinp2"
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount..."
              min="1"
              style={{ width:'100%', padding:'14px 16px', background:'#f9fafb', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:'#111', fontSize:16, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
            />
          </div>
          <div>
            <label style={{ color:'#374151', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', display:'block', marginBottom:6 }}>Note (optional)</label>
            <input
              className="pinp2"
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="e.g. Cash payment, UPI..."
              style={{ width:'100%', padding:'12px 16px', background:'#f9fafb', border:'1.5px solid rgba(255,255,255,0.15)', borderRadius:12, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
            />
          </div>
        </div>

        <div style={{ display:'flex', gap:12, marginTop:24 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><X size={14} /> Cancel</span></button>
          <button onClick={handleSubmit} disabled={loading} style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#111', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, boxShadow:'0 4px 16px rgba(16,185,129,0.4)' }}>
            {loading ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Loader2 size={14} style={{animation:"spin 1s linear infinite"}} /> Recording...</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={15} /> Confirm Payment</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Set Initial Billing Bar ────────────────────────────────────────
function SetInitialBillingBar({ patient, token, patientId, isMobile, onSuccess }) {
  const [treatmentCost, setTreatmentCost] = React.useState('');
  const [amountPaid, setAmountPaid] = React.useState('');
  const [paymentNote, setPaymentNote] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const cost = parseFloat(treatmentCost) || 0;
  const paid = parseFloat(amountPaid) || 0;
  const balance = cost - paid;
  const payStatus = cost <= 0 ? null : paid >= cost - 0.001 ? 'paid' : paid > 0 ? 'partial' : 'pending';

  const handleSubmit = async () => {
    if (!cost || cost <= 0) { toast.error('Please enter a treatment cost'); return; }
    setLoading(true);
    try {
      const apiInst = axios.create({ baseURL: 'http://localhost:8080/api', headers: { Authorization: `Bearer ${token}` } });
      // Add a visit with just the billing info
      await apiInst.post('/visits', {
        patientId,
        patientName: patient.name,
        visitDate: new Date().toISOString(),
        symptoms: 'Billing entry',
        diagnosis: '',
        treatment: '',
        doctorNotes: paymentNote ? `Payment note: ${paymentNote}` : 'Billing added from patient profile',
        prescriptions: [],
        treatmentCost: cost,
        amountPaid: paid > 0 ? paid : null,
        paymentStatus: payStatus || 'pending',
      });
      toast.success('Billing information saved!');
      setTreatmentCost(''); setAmountPaid(''); setPaymentNote('');
      setExpanded(false);
      onSuccess();
    } catch { toast.error('Failed to save billing'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{
      margin: '16px 0 0',
      background: expanded ? '#f0fffe' : '#fafafa',
      border: expanded ? '1px solid #CAF0C1' : '1px dashed #e5e7eb',
      borderRadius: 16,
      overflow: 'hidden',
      animation: 'fadeUp 0.4s ease 0.1s both',
      transition: 'all 0.3s ease',
    }}>
      {/* Collapsed header — always visible */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display:'flex', alignItems:'center', gap:12, padding: isMobile ? '14px 16px' : '16px 24px', cursor:'pointer' }}
      >
        <div style={{ width:38, height:38, borderRadius:10, background:'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}><CreditCard size={20} /></div>
        <div style={{ flex:1 }}>
          <div style={{ color:'#015D67', fontWeight:700, fontSize: isMobile ? 13 : 14 }}>Set Payment Information</div>
          <div style={{ color:'#6b7280', fontSize:12, marginTop:2 }}>
            No billing added yet — tap to add treatment cost & payment received
          </div>
        </div>
        <span style={{ color:'#9ca3af', fontSize:18, transition:'transform 0.25s', transform: expanded ? 'rotate(180deg)' : 'none' }}>⌄</span>
      </div>

      {/* Expanded form */}
      {expanded && (
        <div style={{ padding: isMobile ? '0 16px 20px' : '0 24px 24px' }}>
          <div style={{ height:1, background:'#fff', marginBottom:18 }} />
          <style>{`.sib-inp:focus{border-color:rgba(16,185,129,0.6)!important;outline:none;}.sib-inp::placeholder{color:#9ca3af;}`}</style>

          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)', gap:14, marginBottom:16 }}>
            {/* Treatment Cost */}
            <div>
              <label style={{ color:'#374151', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', display:'block', marginBottom:6 }}>TREATMENT COST (₹) *</label>
              <input
                className="sib-inp"
                type="number" min="0"
                value={treatmentCost}
                onChange={e => setTreatmentCost(e.target.value)}
                placeholder="Total charge e.g. 1500"
                style={{ width:'100%', padding:'13px 14px', background:'#fff', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
              />
            </div>
            {/* Amount Paid */}
            <div>
              <label style={{ color:'#374151', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', display:'block', marginBottom:6 }}>AMOUNT PAID (₹)</label>
              <input
                className="sib-inp"
                type="number" min="0"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                placeholder="Amount received e.g. 500"
                style={{ width:'100%', padding:'13px 14px', background:'#fff', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
              />
            </div>
            {/* Payment Note */}
            <div>
              <label style={{ color:'#374151', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', display:'block', marginBottom:6 }}>PAYMENT NOTE</label>
              <input
                className="sib-inp"
                type="text"
                value={paymentNote}
                onChange={e => setPaymentNote(e.target.value)}
                placeholder="e.g. Cash, UPI, Advance..."
                style={{ width:'100%', padding:'13px 14px', background:'#fff', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:12, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
              />
            </div>
          </div>

          {/* Live preview */}
          {cost > 0 && (
            <div style={{ display:'flex', gap:16, padding:'12px 16px', background:'#f9fafb', borderRadius:12, flexWrap:'wrap', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:13 }}><span style={{ color:'#6b7280' }}>Charged: </span><span style={{ color:'#00ACB1', fontWeight:700 }}>{fmt(cost)}</span></div>
              <div style={{ fontSize:13 }}><span style={{ color:'#6b7280' }}>Paid: </span><span style={{ color:'#00ACB1', fontWeight:700 }}>{fmt(paid)}</span></div>
              <div style={{ fontSize:13 }}><span style={{ color:'#6b7280' }}>Balance: </span><span style={{ color: balance > 0 ? '#f87171' : '#00ACB1', fontWeight:700 }}>{fmt(balance)}</span></div>
              <span style={{ marginLeft:'auto',
                background: payStatus==='paid' ? 'rgba(16,185,129,0.15)' : payStatus==='partial' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
                color:       payStatus==='paid' ? '#00ACB1'               : payStatus==='partial' ? '#fbbf24'               : '#f87171',
                border:`1px solid ${payStatus==='paid' ? 'rgba(16,185,129,0.3)' : payStatus==='partial' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
                padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700,
              }}>
                {payStatus==='paid' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Fully Paid</span> : payStatus==='partial' ? '<span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={12} /> Partial</span> Payment' : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Clock size={12} /> Payment Pending</span>}
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', flexWrap:'wrap' }}>
            <button
              onClick={() => { setExpanded(false); setTreatmentCost(''); setAmountPaid(''); setPaymentNote(''); }}
              style={{ padding:'11px 22px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}
            ><span style={{display:"inline-flex",alignItems:"center",gap:6}}><X size={14} /> Cancel</span></button>
            <button
              onClick={handleSubmit}
              disabled={loading || !treatmentCost}
              style={{ padding:'11px 28px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#111', border:'none', borderRadius:12, fontSize:14, fontWeight:700, cursor: loading || !treatmentCost ? 'not-allowed' : 'pointer', opacity: loading || !treatmentCost ? 0.6 : 1, boxShadow:'0 4px 16px rgba(16,185,129,0.35)' }}
            >
              {loading ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Loader2 size={14} style={{animation:"spin 1s linear infinite"}} /> Saving...</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={15} /> Save Billing Info</span>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Edit Billing Modal ──────────────────────────────────────────────
function EditBillingModal({ visit, token, onClose, onSuccess }) {
  const originalCost = visit.treatmentCost || 0;
  const originalPaid = visit.amountPaid || 0;

  const [treatmentCost, setTreatmentCost] = React.useState(String(originalCost || ''));
  const [amountPaid, setAmountPaid] = React.useState(String(originalPaid || ''));
  const [extraAmount, setExtraAmount] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const cost = parseFloat(treatmentCost) || 0;
  const paid = parseFloat(amountPaid) || 0;
  const balance = cost - paid;
  const payStatus = cost <= 0 ? 'pending' : paid >= cost - 0.001 ? 'paid' : paid > 0 ? 'partial' : 'pending';

  // When doctor types in "Add Extra" box, auto-update the total
  const handleAddExtra = (val) => {
    setExtraAmount(val);
    const extra = parseFloat(val) || 0;
    setTreatmentCost(String(originalCost + extra));
  };

  const handleSave = async () => {
    if (!cost || cost <= 0) { toast.error('Treatment cost must be greater than 0'); return; }
    if (paid > cost) { toast.error('Amount paid cannot exceed treatment cost'); return; }
    setLoading(true);
    try {
      const apiInst = axios.create({ baseURL:'http://localhost:8080/api', headers:{ Authorization:`Bearer ${token}` } });
      // Only send clean Visit model fields — never spread billing.visits items
      // which contain computed fields like 'balance' that aren't in the model
      await apiInst.put(`/visits/${visit.id}`, {
        id:             visit.id,
        patientId:      visit.patientId,
        patientName:    visit.patientName,
        visitDate:      visit.visitDate,
        symptoms:       visit.symptoms       || '',
        diagnosis:      visit.diagnosis      || '',
        treatment:      visit.treatment      || '',
        doctorNotes:    visit.doctorNotes    || '',
        prescriptions:  visit.prescriptions  || [],
        nextVisitDate:  visit.nextVisitDate  || null,
        followUpNotes:  visit.followUpNotes  || '',
        treatmentCost:  cost,
        amountPaid:     paid,
        paymentStatus:  payStatus,
      });
      toast.success('Billing updated successfully!');
      // Small delay to let backend sync finish before refetch
      setTimeout(() => onSuccess(), 300);
    } catch (e) {
      console.error('Edit billing error:', e.response?.data || e.message);
      toast.error('Failed to update billing');
    }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:'#fff', border:'1px solid #fde68a', borderRadius:18, padding:26, maxWidth:500, width:'100%', boxShadow:'0 32px 80px rgba(0,0,0,0.6)' }}>
        <style>{`.ebm-inp:focus{border-color:rgba(251,191,36,0.6)!important;outline:none;}.ebm-inp::placeholder{color:#9ca3af;}`}</style>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <div style={{ color:'#111', fontWeight:800, fontSize:20 }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={14} /> Edit Billing</span></div>
            <div style={{ color:'#9ca3af', fontSize:13, marginTop:3 }}>
              {visit.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'}) : 'Billing Entry'}
            </div>
          </div>
          <button onClick={onClose} style={{ background:'#f9fafb', border:'none', color:'#374151', fontSize:20, borderRadius:8, width:36, height:36, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={14} /></button>
        </div>

        {/* ── TREATMENT COST SECTION ── */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
          <div style={{ color:'#111', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12 }}><Receipt size={14} /> Treatment Cost</div>

          {/* Current cost display */}
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ color:'#6b7280', fontSize:13 }}>Current total charge:</span>
            <span style={{ color:'#00ACB1', fontWeight:800, fontSize:20 }}>{fmt(originalCost)}</span>
          </div>

          {/* Add extra amount helper */}
          <div style={{ marginBottom:12 }}>
            <label style={{ color:'#111', fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:6 }}>
              <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={15} /> Add</span> Extra Amount (₹)
            </label>
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <input
                className="ebm-inp"
                type="number" min="0"
                value={extraAmount}
                onChange={e => handleAddExtra(e.target.value)}
                placeholder="e.g. 200  (leave blank if no change)"
                style={{ flex:1, padding:'11px 14px', background:'#fff', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
              />
              {extraAmount && parseFloat(extraAmount) > 0 && (
                <div style={{ color:'#fbbf24', fontSize:13, fontWeight:700, whiteSpace:'nowrap' }}>
                  + {fmt(parseFloat(extraAmount)||0)}
                </div>
              )}
            </div>
            <div style={{ color:'#9ca3af', fontSize:11, marginTop:5 }}>
              Doctor added more treatment? Enter only the extra amount here.
            </div>
          </div>

          {/* Or set manually */}
          <div>
            <label style={{ color:'#6b7280', fontSize:11, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:6 }}>
              <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={13} /> Or Set Total Manually (₹)</span>
            </label>
            <input
              className="ebm-inp"
              type="number" min="0"
              value={treatmentCost}
              onChange={e => { setTreatmentCost(e.target.value); setExtraAmount(''); }}
              placeholder={`Current: ${originalCost}`}
              style={{ width:'100%', padding:'11px 14px', background:'#fff', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
            />
          </div>
        </div>

        {/* ── AMOUNT PAID SECTION ── */}
        <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:'16px 18px', marginBottom:14 }}>
          <div style={{ color:'#111', fontSize:11, fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12, display:'flex', alignItems:'center', gap:6 }}><CheckCircle2 size={11} /> Amount Paid</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ color:'#6b7280', fontSize:13 }}>Currently paid:</span>
            <span style={{ color:'#00ACB1', fontWeight:800, fontSize:20 }}>{fmt(originalPaid)}</span>
          </div>
          <input
            className="ebm-inp"
            type="number" min="0"
            value={amountPaid}
            onChange={e => setAmountPaid(e.target.value)}
            placeholder={`Current: ${originalPaid} — update if more was paid`}
            style={{ width:'100%', padding:'11px 14px', background:'#fff', border:'1.5px solid rgba(255,255,255,0.12)', borderRadius:10, color:'#111', fontSize:14, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box', transition:'all 0.2s' }}
          />
        </div>

        {/* Live preview */}
        <div style={{ display:'flex', gap:14, padding:'12px 16px', background:'rgba(0,0,0,0.25)', borderRadius:12, flexWrap:'wrap', alignItems:'center', marginBottom:20 }}>
          <div style={{ fontSize:13 }}><span style={{ color:'#9ca3af' }}>Total: </span><span style={{ color:'#00ACB1', fontWeight:800 }}>{fmt(cost)}</span></div>
          <div style={{ fontSize:13 }}><span style={{ color:'#9ca3af' }}>Paid: </span><span style={{ color:'#00ACB1', fontWeight:800 }}>{fmt(paid)}</span></div>
          <div style={{ fontSize:13 }}><span style={{ color:'#9ca3af' }}>Balance: </span><span style={{ color: balance > 0.01 ? '#f87171' : '#00ACB1', fontWeight:800 }}>{fmt(balance)}</span></div>
          <span style={{ marginLeft:'auto',
            background: payStatus==='paid' ? 'rgba(16,185,129,0.15)' : payStatus==='partial' ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)',
            color:       payStatus==='paid' ? '#00ACB1'               : payStatus==='partial' ? '#fbbf24'               : '#f87171',
            border:`1px solid ${payStatus==='paid' ? 'rgba(16,185,129,0.3)' : payStatus==='partial' ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`,
            padding:'4px 14px', borderRadius:20, fontSize:12, fontWeight:700,
          }}>
            {payStatus==='paid' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Fully Paid</span> : payStatus==='partial' ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={12} /> Partial</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Clock size={12} /> Pending</span>}
          </span>
        </div>

        {/* Buttons */}
        <div style={{ display:'flex', gap:12 }}>
          <button onClick={onClose} style={{ flex:1, padding:'13px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:12, fontSize:14, fontWeight:600, cursor:'pointer' }}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><X size={14} /> Cancel</span></button>
          <button
            onClick={handleSave}
            disabled={loading || !treatmentCost}
            style={{ flex:2, padding:'13px', background:'linear-gradient(135deg,#f59e0b,#d97706)', color:'#111', border:'none', borderRadius:12, fontSize:15, fontWeight:700, cursor: loading||!treatmentCost ? 'not-allowed' : 'pointer', opacity: loading||!treatmentCost ? 0.6 : 1, boxShadow:'0 4px 16px rgba(245,158,11,0.4)' }}
          >
            {loading ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Loader2 size={14} style={{animation:"spin 1s linear infinite"}} /> Saving...</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={15} /> Save Changes</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sub Components ────────────────────────────────────────────────
function InfoPill({ icon, label, value }) {
  return (
    <div style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
      <span style={{ fontSize:16, minWidth:22, flexShrink:0 }}>{icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ color:'#9ca3af', fontSize:11, textTransform:'uppercase', letterSpacing:'1px' }}>{label}</div>
        <div style={{ color:'#111', fontSize:13, fontWeight:500, marginTop:2, wordBreak:'break-word' }}>{value}</div>
      </div>
    </div>
  );
}

function InfoCard({ title, color, children }) {
  return (
    <div style={{ background:'#fafafa', border:'1px solid #e5e7eb', borderRadius:16, padding:22, borderTop:`3px solid ${color}` }}>
      <div style={{ color:color, fontWeight:700, fontSize:14, marginBottom:14, letterSpacing:'0.5px' }}>{title}</div>
      {children}
    </div>
  );
}

function VisitField({ label, value, highlight }) {
  if (!value) return null;
  return (
    <div style={{ background: highlight ? '#fffbeb' : '#fafafa', borderRadius:10, padding:'10px 14px', border: highlight ? '1px solid #fde68a' : '1px solid #f3f4f6' }}>
      <div style={{ color:'#6b7280', fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>{label}</div>
      <div style={{ color: highlight ? '#dc2626' : '#111', fontSize:13, lineHeight:1.5, fontWeight:500 }}>{value}</div>
    </div>
  );
}

// ─── Visit Modal ────────────────────────────────────────────────────
function VisitModal({ visit, onSave, onClose }) {
  const [form, setForm] = useState({
    symptoms:      visit?.symptoms      || '',
    diagnosis:     visit?.diagnosis     || '',
    treatment:     visit?.treatment     || '',
    doctorNotes:   visit?.doctorNotes   || '',
    nextVisitDate: visit?.nextVisitDate ? visit.nextVisitDate.substring(0,10) : '',
    followUpNotes: visit?.followUpNotes || '',
    treatmentCost: visit?.treatmentCost || '',
    amountPaid:    visit?.amountPaid    || '',
    paymentStatus: visit?.paymentStatus || 'pending',
  });
  const [prescriptions, setPrescriptions] = useState(visit?.prescriptions || []);
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });
  const addPresc    = () => setPrescriptions([...prescriptions, { medicineName:'', dosage:'', frequency:'', duration:'', instructions:'' }]);
  const removePresc = (i) => setPrescriptions(prescriptions.filter((_,idx) => idx!==i));
  const updatePresc = (i, field, val) => { const u=[...prescriptions]; u[i][field]=val; setPrescriptions(u); };

  // Auto-compute status when amounts change
  const cost = parseFloat(form.treatmentCost) || 0;
  const paid = parseFloat(form.amountPaid) || 0;
  const visitBalance = cost - paid;

  const handleSubmit = async () => {
    if (!form.symptoms && !form.diagnosis) { toast.error('Please fill at least symptoms or diagnosis'); return; }
    setLoading(true);
    const payload = {
      ...form,
      treatmentCost: form.treatmentCost ? parseFloat(form.treatmentCost) : null,
      amountPaid:    form.amountPaid    ? parseFloat(form.amountPaid)    : null,
      nextVisitDate: form.nextVisitDate ? form.nextVisitDate+'T00:00:00' : null,
      prescriptions: prescriptions.filter(p => p.medicineName),
    };
    await onSave(payload);
    setLoading(false);
  };

  return (
    <div style={ms.overlay}>
      <div style={ms.modal}>
        <style>{`
          .minp:focus { border-color:#00ACB1!important; box-shadow:0 0 0 3px rgba(0,172,177,0.1)!important; outline:none; }
          .minp::placeholder { color:#6b7280; }
          .minp option { background:#015D67; color:#fff; }
        `}</style>
        <div style={ms.header}>
          <div style={{ color:'#111', fontWeight:800, fontSize:18 }}>{visit ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Pencil size={14} /> Edit Visit</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Plus size={14} /> Add New Visit</span>}</div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#6b7280', fontSize:22, cursor:'pointer' }}><X size={14} /></button>
        </div>
        <div style={ms.body}>
          <SectionHead><span style={{display:"inline-flex",alignItems:"center",gap:6}}><ClipboardList size={12}/>Visit Details</span></SectionHead>
          <div style={ms.grid2}>
            <ModalField label="Symptoms *"><textarea className="minp" name="symptoms"    value={form.symptoms}    onChange={handleChange} placeholder="Patient's complaints..." rows={3} style={ms.inp} /></ModalField>
            <ModalField label="Diagnosis" ><textarea className="minp" name="diagnosis"   value={form.diagnosis}   onChange={handleChange} placeholder="Your diagnosis..."     rows={3} style={ms.inp} /></ModalField>
            <ModalField label="Treatment Given"><textarea className="minp" name="treatment"   value={form.treatment}   onChange={handleChange} placeholder="Treatment given..."     rows={3} style={ms.inp} /></ModalField>
            <ModalField label="Doctor Notes"  ><textarea className="minp" name="doctorNotes" value={form.doctorNotes} onChange={handleChange} placeholder="Private notes..."       rows={3} style={ms.inp} /></ModalField>
          </div>

          <SectionHead>⏰ Follow-up</SectionHead>
          <div style={ms.grid2}>
            <ModalField label="Next Visit Date"><input className="minp" type="date" name="nextVisitDate" value={form.nextVisitDate} onChange={handleChange} style={ms.inp} /></ModalField>
            <ModalField label="Follow-up Notes"><textarea className="minp" name="followUpNotes" value={form.followUpNotes} onChange={handleChange} placeholder="Instructions for next visit..." rows={2} style={ms.inp} /></ModalField>
          </div>

          <SectionHead><Receipt size={14} /> Payment</SectionHead>
          <div style={ms.grid2}>
            <ModalField label="Treatment Cost (₹) — Total Charge">
              <input className="minp" type="number" name="treatmentCost" value={form.treatmentCost} onChange={handleChange} placeholder="0.00" min="0" style={ms.inp} />
            </ModalField>
            <ModalField label="Amount Paid Now (₹)">
              <input className="minp" type="number" name="amountPaid" value={form.amountPaid} onChange={handleChange} placeholder="0.00" min="0" style={ms.inp} />
            </ModalField>
          </div>
          {/* Live balance preview */}
          {cost > 0 && (
            <div style={{ display:'flex', gap:12, marginTop:10, padding:'12px 16px', background:'#fff', borderRadius:12, flexWrap:'wrap' }}>
              <div style={{ fontSize:13 }}><span style={{ color:'#9ca3af' }}>Charged: </span><span style={{ color:'#00ACB1', fontWeight:700 }}>{fmt(cost)}</span></div>
              <div style={{ fontSize:13 }}><span style={{ color:'#9ca3af' }}>Paid: </span><span style={{ color:'#00ACB1', fontWeight:700 }}>{fmt(paid)}</span></div>
              <div style={{ fontSize:13 }}><span style={{ color:'#9ca3af' }}>Balance: </span><span style={{ color: visitBalance > 0 ? '#f87171' : '#00ACB1', fontWeight:700 }}>{fmt(visitBalance)}</span></div>
              <div style={{ marginLeft:'auto' }}>
                <span style={{ background: visitBalance <= 0 ? 'rgba(16,185,129,0.15)' : paid > 0 ? 'rgba(251,191,36,0.12)' : 'rgba(239,68,68,0.12)', color: visitBalance <= 0 ? '#00ACB1' : paid > 0 ? '#fbbf24' : '#f87171', border:`1px solid ${visitBalance <= 0 ? 'rgba(16,185,129,0.3)' : paid > 0 ? 'rgba(251,191,36,0.3)' : 'rgba(239,68,68,0.3)'}`, padding:'3px 12px', borderRadius:20, fontSize:12, fontWeight:700 }}>
                  {visitBalance <= 0.001 ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={12} /> Paid</span> : paid > 0 ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><AlertCircle size={12} /> Partial</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Clock size={12} /> Pending</span>}
                </span>
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', margin:'24px 0 14px' }}>
            <SectionHead noMargin><Pill size={14} /> Prescriptions</SectionHead>
            <button onClick={addPresc} style={{ background:'rgba(13,148,136,0.2)', color:'#00ACB1', border:'1px solid rgba(94,234,212,0.3)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:13, fontWeight:600 }}>+ Add Medicine</button>
          </div>
          {prescriptions.length === 0 && <div style={{ color:'#6b7280', fontSize:13, textAlign:'center', padding:'16px 0', fontWeight:500 }}>No prescriptions added. Click "Add Medicine" to add.</div>}
          {prescriptions.map((p,i) => (
            <div key={i} style={ms.prescRow}>
              <div style={ms.prescGrid}>
                <input className="minp" placeholder="Medicine name *"               value={p.medicineName}  onChange={e => updatePresc(i,'medicineName', e.target.value)} style={ms.sinp} />
                <input className="minp" placeholder="Dosage (e.g. 500mg)"          value={p.dosage}        onChange={e => updatePresc(i,'dosage',       e.target.value)} style={ms.sinp} />
                <input className="minp" placeholder="Frequency (e.g. twice a day)" value={p.frequency}     onChange={e => updatePresc(i,'frequency',    e.target.value)} style={ms.sinp} />
                <input className="minp" placeholder="Duration (e.g. 5 days)"       value={p.duration}      onChange={e => updatePresc(i,'duration',     e.target.value)} style={ms.sinp} />
                <input className="minp" placeholder="Instructions (after meals)"    value={p.instructions}  onChange={e => updatePresc(i,'instructions', e.target.value)} style={ms.sinp} />
              </div>
              <button onClick={() => removePresc(i)} style={{ background:'rgba(239,68,68,0.15)', color:'#f87171', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', fontSize:14, marginLeft:8, alignSelf:'center' }}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
        <div style={ms.footer}>
          <button onClick={onClose} style={ms.cancelBtn}><span style={{display:"inline-flex",alignItems:"center",gap:6}}><X size={14} /> Cancel</span></button>
          <button onClick={handleSubmit} disabled={loading} style={ms.saveBtn}>{loading ? <span style={{display:"inline-flex",alignItems:"center",gap:6}}><Loader2 size={14} style={{animation:"spin 1s linear infinite"}} /> Saving...</span> : <span style={{display:"inline-flex",alignItems:"center",gap:6}}><CheckCircle2 size={15} /> Save Visit</span>}</button>
        </div>
      </div>
    </div>
  );
}

function SectionHead({ children, noMargin }) {
  return (
    <div style={{ color:'#015D67', fontWeight:800, fontSize:11, letterSpacing:'1.5px', textTransform:'uppercase', marginBottom:12, marginTop: noMargin ? 0 : 22, paddingBottom:7, borderBottom:'1.5px solid #87E4DB' }}>
      {children}
    </div>
  );
}

function ModalField({ label, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      <label style={{ color:'#111', fontSize:11, fontWeight:800, letterSpacing:'1px', textTransform:'uppercase' }}>{label}</label>
      {children}
    </div>
  );
}

const s = {
  backBtn:      { background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', padding:'8px 14px', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, flexShrink:0, display:'inline-flex', alignItems:'center', gap:6 },
  addVisitBtn:  { background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 3px 10px rgba(0,172,177,0.3)' },
  editPatientBtn:{ background:'#fff', color:'#111', border:'1.5px solid #e5e7eb', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:700 },
  printTopBtn:  { background:'linear-gradient(135deg,#015D67,#00ACB1)', color:'#fff', border:'none', borderRadius:10, padding:'10px 20px', cursor:'pointer', fontSize:13, fontWeight:700, boxShadow:'0 4px 14px rgba(0,172,177,0.35)' },
  heroCard:     { background:'#fff', border:'1px solid #e5e7eb', borderRadius:18, padding:18, display:'flex', gap:18, borderTop:'3px solid #00ACB1', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' },
  avatarCircle: { background:'#f0fefe', borderRadius:'50%', width:56, height:56, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #87E4DB', flexShrink:0 },
  badge:        { display:'inline-flex', alignItems:'center', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 },
  grid2:        { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:14 },
  cardText:     { color:'#111', fontSize:13, lineHeight:1.6, margin:0 },
  tabBtn:       { padding:'9px 16px', background:'#fff', border:'1px solid #e5e7eb', borderRadius:9, color:'#6b7280', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s' },
  tabActive:    { background:'#f0fefe', color:'#00ACB1', border:'1.5px solid #00ACB1' },
  emptyBox:     { textAlign:'center', padding:'56px 20px', background:'#fff', borderRadius:18, border:'1px dashed #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  visitCard:    { background:'#fff', border:'1px solid #e5e7eb', borderRadius:14, padding:14, transition:'all 0.18s', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' },
  visitNum:     { width:34, height:34, borderRadius:'50%', background:'transparent', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:13, border:'1px solid #87E4DB', flexShrink:0 },
  visitGrid:    { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:10, marginBottom:14 },
  prescBox:     { background:'#f0fefe', borderRadius:11, padding:14, border:'1px solid #87E4DB' },
  prescDetail:  { color:'#111', fontSize:12 },
  editBtn:      { background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s' },
  deleteBtn:    { background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, padding:'5px 9px', cursor:'pointer', fontSize:12, transition:'all 0.2s' },
  printBtn:     { background:'#f0fefe', color:'#015D67', border:'1px solid #87E4DB', borderRadius:7, padding:'5px 12px', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s' },
};

const ms = {
  overlay:   { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'16px' },
  modal:     { background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, width:'100%', maxWidth:760, boxShadow:'0 24px 60px rgba(0,0,0,0.15)', marginTop:16 },
  header:    { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid #e5e7eb', background:'#f9fafb' },
  body:      { padding:'18px 22px', maxHeight:'75vh', overflowY:'auto' },
  footer:    { display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 22px', borderTop:'1px solid #e5e7eb' },
  grid2:     { display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))', gap:14 },
  inp:       { padding:'11px 13px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:9, color:'#111', fontSize:13, fontWeight:500, outline:'none', transition:'all 0.2s', fontFamily:"'Segoe UI',sans-serif", width:'100%', boxSizing:'border-box', resize:'vertical', lineHeight:1.5 },
  sinp:      { padding:'9px 11px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:7, color:'#111', fontSize:12, fontWeight:500, outline:'none', flex:1, minWidth:90, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box' },
  prescRow:  { display:'flex', gap:7, marginBottom:7, background:'#fafafa', borderRadius:9, padding:9, flexWrap:'wrap', border:'1px solid #f3f4f6' },
  prescGrid: { display:'flex', flex:1, gap:7, flexWrap:'wrap' },
  saveBtn:   { padding:'11px 26px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 10px rgba(0,172,177,0.3)', display:'inline-flex', alignItems:'center', gap:6 },
  cancelBtn: { padding:'11px 22px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 },
};


// ─── Print Prescription Modal ──────────────────────────────────────
function PrintPrescriptionModal({ visit, patient, onClose }) {
  const [editMode, setEditMode] = useState(false);
  const [notes, setNotes] = useState(visit.doctorNotes || '');
  const [advice, setAdvice] = useState(visit.followUpNotes || '');
  const [prescriptions, setPrescriptions] = useState(visit.prescriptions?.length > 0 ? visit.prescriptions : []);

  const updatePresc = (i, field, val) => { const u = [...prescriptions]; u[i][field] = val; setPrescriptions(u); };
  const addPresc    = () => setPrescriptions([...prescriptions, { medicineName:'', dosage:'', frequency:'', duration:'', instructions:'' }]);
  const removePresc = (i) => setPrescriptions(prescriptions.filter((_,idx) => idx!==i));

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const date = visit?.visitDate
      ? new Date(visit.visitDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' })
      : new Date().toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' });
    const nextDate = visit.nextVisitDate ? new Date(visit.nextVisitDate).toLocaleDateString('en-IN', { day:'2-digit', month:'long', year:'numeric' }) : null;
    const rxRows = prescriptions.filter(p => p.medicineName).map((p,i) => `
      <tr>
        <td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;font-weight:600;color:#111;">${i+1}. ${p.medicineName}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;color:#374151;">${p.dosage||'—'}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;color:#374151;">${p.frequency||'—'}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;color:#374151;">${p.duration||'—'}</td>
        <td style="padding:9px 10px;border-bottom:1px solid #f3f4f6;color:#374151;">${p.instructions||'—'}</td>
      </tr>`).join('');

    printWindow.document.write(`<!DOCTYPE html><html><head><title>Prescription - ${patient.name}</title><style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Segoe UI',Arial,sans-serif;background:#fff;color:#111;}
      .page{max-width:740px;margin:0 auto;padding:28px;background:#fff;min-height:100vh;}
      .header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2.5px solid #015D67;padding-bottom:16px;margin-bottom:20px;}
      .clinic-name{font-size:22px;font-weight:900;color:#111;}
      .clinic-sub{font-size:12px;color:#00ACB1;font-weight:600;margin-top:2px;}
      .clinic-contact{font-size:11px;color:#374151;margin-top:5px;}
      .rx-symbol{font-size:44px;color:#00ACB1;font-weight:900;line-height:1;opacity:0.12;}
      .date-box{text-align:right;}
      .date-label{font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;}
      .date-val{font-size:13px;font-weight:700;color:#111;margin-top:2px;}
      .patient-box{background:#f0fefe;border-radius:8px;padding:12px 16px;margin-bottom:18px;border-left:4px solid #00ACB1;display:flex;gap:24px;flex-wrap:wrap;}
      .pfield{min-width:110px;}
      .pfield-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;}
      .pfield-val{font-size:13px;font-weight:700;color:#111;margin-top:2px;}
      .section{margin-bottom:16px;}
      .section-title{font-size:10px;font-weight:800;color:#015D67;text-transform:uppercase;letter-spacing:2px;margin-bottom:8px;padding-bottom:5px;border-bottom:1px solid #e5e7eb;}
      .clinical-grid{display:grid;grid-template-columns:1fr 1fr;gap:11px;margin-bottom:16px;}
      .cfield{background:#fafafa;border-radius:7px;padding:10px 12px;border:1px solid #e5e7eb;}
      .cfield-label{font-size:9px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;}
      .cfield-val{font-size:12px;color:#111;line-height:1.5;}
      table{width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;}
      .rx-header th{padding:9px 10px;font-size:10px;letter-spacing:1px;text-transform:uppercase;font-weight:700;text-align:left;background:#015D67;color:#fff;}
      td{padding:9px 10px;border-bottom:1px solid #f3f4f6;font-size:12px;color:#111;}
      td:first-child{font-weight:600;color:#111;}
      .footer{margin-top:28px;display:flex;justify-content:space-between;align-items:flex-end;padding-top:16px;border-top:2px solid #015D67;}
      .next-visit{background:#fffbeb;border-radius:7px;padding:8px 14px;border:1px solid #fde68a;font-size:12px;color:#111;}
      .sign-box{text-align:center;}
      .sign-line{width:150px;border-top:1px solid #111;margin:0 auto 5px;}
      .sign-name{font-size:12px;font-weight:700;color:#111;}
      .sign-deg{font-size:10px;color:#6b7280;}
      .notes-box{background:#f0fefe;border-radius:7px;padding:10px 14px;margin-top:12px;border-left:3px solid #00ACB1;font-size:12px;color:#111;line-height:1.6;}
      .allergy-warn{color:#dc2626;font-weight:700;}
      @media print{
        body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}
        .page{padding:20px;}
      }
    </style></head><body><div class="page">
      <div class="header"><div><div class="clinic-name">🦷 Sharnya Smile Care</div><div class="clinic-sub">Advanced Dental Clinic</div><div class="clinic-contact">Dr. Shantanu Sasne &nbsp;|&nbsp; BDS, MDS — Dental Surgeon</div></div>
      <div class="date-box"><div class="rx-symbol">Rx</div><div class="date-label">Date</div><div class="date-val">${date}</div></div></div>
      <div class="patient-box">
        <div class="pfield"><div class="pfield-label">Patient Name</div><div class="pfield-val">${patient.name}</div></div>
        <div class="pfield"><div class="pfield-label">Age / Gender</div><div class="pfield-val">${patient.age} yrs / ${patient.gender}</div></div>
        <div class="pfield"><div class="pfield-label">Contact</div><div class="pfield-val">${patient.contactNumber||'—'}</div></div>
        <div class="pfield"><div class="pfield-label">Blood Group</div><div class="pfield-val">${patient.bloodGroup||'—'}</div></div>
        ${patient.allergies ? `<div class="pfield"><div class="pfield-label"><AlertTriangle size={16} /> Allergies</div><div class="pfield-val allergy-warn">${patient.allergies}</div></div>` : ''}
        ${patient.address   ? `<div class="pfield"><div class="pfield-label">Address</div><div class="pfield-val">${patient.address}</div></div>` : ''}
      </div>
      ${(patient.medicalHistory||patient.chronicConditions?.length>0||patient.dentalHistory||patient.chiefComplaint)?`
      <div class="section"><div class="section-title">Medical Background</div><div class="clinical-grid">
        ${patient.medicalHistory?`<div class="cfield"><div class="cfield-label">Medical History</div><div class="cfield-val">${patient.medicalHistory}</div></div>`:''}
        ${patient.chronicConditions?.length>0?`<div class="cfield"><div class="cfield-label">Chronic Conditions</div><div class="cfield-val">${patient.chronicConditions.join(', ')}</div></div>`:''}
        ${patient.dentalHistory?`<div class="cfield"><div class="cfield-label">Dental History</div><div class="cfield-val">${patient.dentalHistory}</div></div>`:''}
        ${patient.chiefComplaint?`<div class="cfield"><div class="cfield-label">Chief Complaint</div><div class="cfield-val">${patient.chiefComplaint}</div></div>`:''}
      </div></div>`:''}
      ${(visit.symptoms||visit.diagnosis||visit.treatment)?`<div class="section"><div class="section-title">Clinical Details</div><div class="clinical-grid">
        ${visit.symptoms?`<div class="cfield"><div class="cfield-label">Symptoms</div><div class="cfield-val">${visit.symptoms}</div></div>`:''}
        ${visit.diagnosis?`<div class="cfield"><div class="cfield-label">Diagnosis</div><div class="cfield-val">${visit.diagnosis}</div></div>`:''}
        ${visit.treatment?`<div class="cfield"><div class="cfield-label">Treatment Given</div><div class="cfield-val">${visit.treatment}</div></div>`:''}
        ${notes?`<div class="cfield"><div class="cfield-label">Doctor Notes</div><div class="cfield-val">${notes}</div></div>`:''}
      </div></div>`:''}
      ${rxRows?`<div class="section"><div class="section-title"><Pill size={14} /> Prescription</div><table><thead class="rx-header"><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr></thead><tbody>${rxRows}</tbody></table></div>`:''}
      ${advice?`<div class="notes-box"><strong>📋 Advice / Instructions:</strong><br/>${advice}</div>`:''}
      <div class="footer"><div>${nextDate?`<div class="next-visit"><Calendar size={16} /> <strong>Next Visit:</strong> ${nextDate}</div>`:'<div></div>'}</div>
      <div class="sign-box"><div class="sign-line"></div><div style="font-size:10px;color:#6b7280;margin-bottom:3px;">Signature</div><div class="sign-name">Dr. Shantanu Sasne</div><div class="sign-deg">BDS, MDS — Dental Surgeon</div></div></div>
    </div></body></html>`);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  };

  return (
    <div style={pm.overlay}>
      <div style={pm.modal}>
        <style>{`
          .pinp:focus{border-color:#00ACB1!important;outline:none;}
          .pinp::placeholder{color:#9ca3af;}
          .rx-table th{padding:9px 11px;text-align:left;font-size:10px;font-weight:700;letter-spacing:1px;text-transform:uppercase;background:#015D67;color:#fff;}
          .rx-table td{padding:9px 11px;font-size:12px;border-bottom:1px solid #f0fefe;color:#374151;}
          .rx-table tr:last-child td{border-bottom:none;}
          .rx-table tr:nth-child(even) td{background:#f8fffe;}
        `}</style>

        {/* ── MODAL HEADER ── */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'14px 18px', background:'linear-gradient(135deg,#015D67,#00ACB1)', borderBottom:'none' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ background:'rgba(255,255,255,0.2)', borderRadius:8, padding:'6px 8px', display:'flex' }}>
              <Printer size={16} color="#fff" />
            </div>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:'#fff', lineHeight:1.2 }}>Print Prescription</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,0.75)', marginTop:1 }}>Preview & edit before printing</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setEditMode(!editMode)} style={{ background: editMode ? '#fff' : 'rgba(255,255,255,0.2)', color: editMode ? '#015D67' : '#fff', border: editMode ? 'none' : '1px solid rgba(255,255,255,0.4)', borderRadius:8, padding:'6px 14px', cursor:'pointer', fontSize:12, fontWeight:700, display:'inline-flex', alignItems:'center', gap:5 }}>
              {editMode ? <><CheckCircle2 size={13}/> Done</> : <><Pencil size={12}/> Edit</>}
            </button>
            <button onClick={onClose} style={{ background:'rgba(239,68,68,0.85)', color:'#fff', border:'none', borderRadius:8, padding:'6px 11px', cursor:'pointer', display:'flex', alignItems:'center' }}><X size={15}/></button>
          </div>
        </div>

        {/* ── PRESCRIPTION BODY ── */}
        <div style={{ padding:'0', maxHeight:'74vh', overflowY:'auto', background:'#fff' }}>

          {/* LETTERHEAD */}
          <div style={{ background:'#fff', borderBottom:'3px solid #015D67', padding:'18px 20px 14px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div>
                <div style={{ fontSize:20, fontWeight:900, color:'#015D67', letterSpacing:'-0.3px', lineHeight:1.1 }}>Sharnya Smile Care</div>
                <div style={{ fontSize:11, color:'#00ACB1', fontWeight:700, letterSpacing:'1.5px', textTransform:'uppercase', marginTop:3 }}>Advanced Dental Clinic</div>
                <div style={{ fontSize:11, color:'#6b7280', marginTop:5, display:'flex', flexDirection:'column', gap:2 }}>
                  <span>Dr. Shantanu Sasne — BDS, MDS (Oral Surgery)</span>
                  <span>Reg. No. MH-XXXXX &nbsp;|&nbsp; Dental Surgeon</span>
                </div>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <div style={{ fontSize:44, fontWeight:900, color:'#015D67', opacity:0.08, lineHeight:1, fontStyle:'italic' }}>Rx</div>
                <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginTop:2 }}>Date</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#111', marginTop:1 }}>
                  {visit?.visitDate ? new Date(visit.visitDate).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}) : new Date().toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'})}
                </div>
              </div>
            </div>
          </div>

          {/* PATIENT INFO STRIP */}
          <div style={{ background:'#f0fefe', borderBottom:'1px solid #CAF0C1', padding:'12px 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px 20px' }}>
              {[
                { label:'Patient Name', val: patient.name },
                { label:'Age / Gender',  val: `${patient.age} yrs / ${patient.gender}` },
                { label:'Contact',       val: patient.contactNumber || '—' },
                { label:'Blood Group',   val: patient.bloodGroup || '—' },
                ...(patient.allergies ? [{ label:'⚠ Allergies', val: patient.allergies, danger:true }] : []),
              ].map((f,i) => (
                <div key={i}>
                  <div style={{ fontSize:9, color:'#6b7280', textTransform:'uppercase', letterSpacing:'1px', fontWeight:700 }}>{f.label}</div>
                  <div style={{ fontSize:13, fontWeight:700, color: f.danger ? '#dc2626' : '#111', marginTop:2 }}>{f.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'16px 20px' }}>

            {/* CLINICAL DETAILS */}
            {(visit?.symptoms || visit?.diagnosis || visit?.treatment) && (
              <div style={{ marginBottom:16 }}>
                <div style={pm.sectionTitle}>Clinical Details</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  {visit?.symptoms  && <div style={pm.cfield}><div style={pm.clabel}>Symptoms</div><div style={pm.cval}>{visit.symptoms}</div></div>}
                  {visit?.diagnosis && <div style={pm.cfield}><div style={pm.clabel}>Diagnosis</div><div style={pm.cval}>{visit.diagnosis}</div></div>}
                  {visit?.treatment && <div style={{ ...pm.cfield, gridColumn:'1/-1' }}><div style={pm.clabel}>Treatment Given</div><div style={pm.cval}>{visit.treatment}</div></div>}
                </div>
              </div>
            )}

            {/* PRESCRIPTIONS */}
            <div style={{ marginBottom:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
                <div style={pm.sectionTitle}>Prescriptions</div>
                {editMode && <button onClick={addPresc} style={{ background:'#f0fefe', color:'#015D67', border:'1px solid #CAF0C1', borderRadius:7, padding:'4px 12px', cursor:'pointer', fontSize:11, fontWeight:700 }}>+ Add</button>}
              </div>
              {prescriptions.filter(p => p.medicineName||editMode).length === 0 ? (
                <div style={{ background:'#f9fafb', border:'1px dashed #e5e7eb', borderRadius:9, padding:'14px', textAlign:'center', color:'#9ca3af', fontSize:12 }}>
                  {editMode ? 'Click + Add to add prescriptions' : 'No prescriptions for this visit'}
                </div>
              ) : (
                <div style={{ border:'1px solid #e5e7eb', borderRadius:10, overflow:'hidden' }}>
                  <table className="rx-table" style={{ width:'100%', borderCollapse:'collapse' }}>
                    <thead><tr>
                      {['#','Medicine','Dosage','Frequency','Duration','Instructions', editMode?'':null].filter(h=>h!==null).map(h => <th key={h}>{h}</th>)}
                    </tr></thead>
                    <tbody>{prescriptions.map((p,i) => (
                      <tr key={i}>
                        {editMode ? (<>
                          <td style={{width:28,padding:'6px 8px',fontWeight:700,color:'#9ca3af'}}>{i+1}</td>
                          {['medicineName','dosage','frequency','duration','instructions'].map(f => (
                            <td key={f} style={{padding:'5px 6px'}}><input className="pinp" value={p[f]} onChange={e => updatePresc(i,f,e.target.value)} placeholder={f} style={{width:'100%',padding:'6px 8px',border:'1px solid #e5e7eb',borderRadius:6,fontSize:11,fontFamily:'inherit',boxSizing:'border-box'}}/></td>
                          ))}
                          <td style={{padding:'5px 6px'}}><button onClick={() => removePresc(i)} style={{background:'#fee2e2',color:'#dc2626',border:'none',borderRadius:6,padding:'5px 8px',cursor:'pointer'}}><X size={12}/></button></td>
                        </>) : (<>
                          <td style={{width:28,fontWeight:700,color:'#9ca3af',fontSize:11}}>{i+1}</td>
                          <td style={{fontWeight:700,color:'#015D67'}}>{p.medicineName}</td>
                          <td>{p.dosage||'—'}</td>
                          <td>{p.frequency||'—'}</td>
                          <td>{p.duration||'—'}</td>
                          <td>{p.instructions||'—'}</td>
                        </>)}
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DOCTOR NOTES */}
            <div style={{ marginBottom:16 }}>
              <div style={pm.sectionTitle}>Doctor Notes</div>
              {editMode ? (
                <textarea className="pinp" value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Doctor notes..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
              ) : notes ? (
                <div style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#374151', lineHeight:1.6 }}>{notes}</div>
              ) : <div style={{ color:'#d1d5db', fontSize:12 }}>No notes added</div>}
            </div>

            {/* ADVICE */}
            <div style={{ marginBottom:16 }}>
              <div style={pm.sectionTitle}>Advice / Instructions</div>
              {editMode ? (
                <textarea className="pinp" value={advice} onChange={e => setAdvice(e.target.value)} rows={2} placeholder="Advice for patient..." style={{width:'100%',padding:'10px 12px',border:'1.5px solid #e5e7eb',borderRadius:8,fontSize:12,resize:'vertical',fontFamily:'inherit',boxSizing:'border-box'}}/>
              ) : advice ? (
                <div style={{ background:'#f0fefe', border:'1px solid #CAF0C1', borderLeft:'3px solid #00ACB1', borderRadius:8, padding:'10px 13px', fontSize:12, color:'#374151', lineHeight:1.6 }}>{advice}</div>
              ) : <div style={{ color:'#d1d5db', fontSize:12 }}>No advice added</div>}
            </div>

            {/* FOOTER: NEXT VISIT + SIGNATURE */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', paddingTop:14, borderTop:'2px solid #015D67', marginTop:8 }}>
              <div>
                {visit?.nextVisitDate ? (
                  <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding:'8px 13px', fontSize:12 }}>
                    <div style={{ fontSize:9, color:'#9ca3af', textTransform:'uppercase', letterSpacing:1, marginBottom:2 }}>Next Visit</div>
                    <div style={{ fontWeight:700, color:'#b45309' }}>{new Date(visit.nextVisitDate).toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}</div>
                  </div>
                ) : <div/>}
              </div>
              {/* Signature box — bottom right */}
              <div style={{ textAlign:'center', minWidth:150 }}>
                <div style={{ height:40, borderBottom:'1.5px solid #374151', marginBottom:5, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                  <span style={{ fontSize:10, color:'#d1d5db', fontStyle:'italic' }}>— signature —</span>
                </div>
                <div style={{ fontSize:12, fontWeight:800, color:'#015D67' }}>Dr. Shantanu Sasne</div>
                <div style={{ fontSize:10, color:'#6b7280', marginTop:1 }}>BDS, MDS — Dental Surgeon</div>
              </div>
            </div>

          </div>
        </div>

        {/* ── FOOTER BUTTONS ── */}
        <div style={{ display:'flex', justifyContent:'flex-end', gap:10, padding:'12px 18px', borderTop:'1px solid #e5e7eb', background:'#f9fafb' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'#fff', color:'#374151', border:'1px solid #e5e7eb', borderRadius:9, fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}><X size={13}/> Close</button>
          <button onClick={handlePrint} style={{ padding:'9px 22px', background:'linear-gradient(135deg,#015D67,#00ACB1)', color:'#fff', border:'none', borderRadius:9, fontSize:13, fontWeight:700, cursor:'pointer', boxShadow:'0 3px 12px rgba(0,172,177,0.35)', display:'inline-flex', alignItems:'center', gap:6 }}><Printer size={14}/> Print / Save PDF</button>
        </div>

      </div>
    </div>
  );
}

const pm = {
  overlay:      { position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:2000, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'16px' },
  modal:        { background:'#fff', borderRadius:20, width:'100%', maxWidth:720, boxShadow:'0 32px 80px rgba(0,0,0,0.4)', marginTop:16, overflow:'hidden' },
  header:       { display:'flex', justifyContent:'space-between', alignItems:'center', padding:'20px 24px', background:'#f0fefe', borderBottom:'2px solid #00ACB1' },
  body:         { padding:'16px', maxHeight:'72vh', overflowY:'auto', background:'rgba(255,255,255,0.88)' },
  footer:       { display:'flex', justifyContent:'flex-end', gap:12, padding:'16px 24px', borderTop:'1px solid #e0f2f0', background:'#f9fffe' },
  clinicHeader: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:'3px solid #00ACB1', paddingBottom:16, marginBottom:20 },
  patientBox:   { background:'#f0fefe', borderRadius:10, padding:'14px 18px', marginBottom:20, borderLeft:'4px solid #00ACB1', display:'flex', gap:24, flexWrap:'wrap' },
  pfield:       { minWidth:120 },
  plabel:       { fontSize:10, color:'#888', textTransform:'uppercase', letterSpacing:1 },
  pval:         { fontSize:14, fontWeight:700, color:'#015D67', marginTop:2 },
  section:      { marginBottom:18 },
  sectionTitle: { fontSize:11, fontWeight:800, color:'#00ACB1', textTransform:'uppercase', letterSpacing:2, marginBottom:10, paddingBottom:6, borderBottom:'1px solid #e0f2f0' },
  cfield:       { background:'#fafafa', borderRadius:8, padding:'10px 12px', border:'1px solid #eee' },
  clabel:       { fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:1, marginBottom:3 },
  cval:         { fontSize:13, color:'#333', lineHeight:1.5 },
  editBtn:      { padding:'7px 16px', borderRadius:8, border:'1px solid #00ACB1', cursor:'pointer', fontSize:13, fontWeight:600, transition:'all 0.2s' },
  closeBtn:     { background:'#fee2e2', color:'#dc2626', border:'none', borderRadius:8, padding:'7px 14px', cursor:'pointer', fontSize:14, fontWeight:700 },
  cancelBtn:    { padding:'10px 22px', background:'#f3f4f6', color:'#666', border:'1px solid #ddd', borderRadius:10, fontSize:14, fontWeight:600, cursor:'pointer' },
  printBtn:     { padding:'10px 28px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#111', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:'pointer', boxShadow:'0 4px 16px rgba(13,148,136,0.4)' },
};