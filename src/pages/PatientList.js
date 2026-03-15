import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatientsApi, deletePatientApi, searchPatientsApi } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import { Users, UserPlus, Calendar, Bell, CreditCard, ClipboardList, Eye, Pencil, Trash2, Search, CheckCircle2, AlertTriangle, Clock, ArrowLeft, ArrowRight, Printer, Plus, RefreshCw, Activity, FileText, Stethoscope, Phone, Mail, MapPin, Loader2, XCircle, ChevronDown, Upload, X, Check, AlertCircle, Zap, Heart, Tag, Receipt, CreditCard as CardIcon, Folder, File, FileUp, Replace, RotateCcw, Droplets, Pill, Building2, CheckCheck, MinusCircle, UserCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function PatientList() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMobile = useMobile();

  const [patients, setPatients]     = useState([]);
  const [visitData, setVisitData]   = useState({});
  const [billingData, setBillingData] = useState({});
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [searching, setSearching]   = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus]   = useState('all');

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getPatientsApi();
      setPatients(res.data);
      fetchVisitCounts(res.data);
    } catch { toast.error('Failed to load patients'); }
    finally { setLoading(false); }
  }, []);

  const fetchVisitCounts = async (patientList) => {
    const api = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } });
    const [visitResults, billingResults] = await Promise.all([
      Promise.allSettled(patientList.map(p => api.get(`/visits/patient/${p.id}`))),
      Promise.allSettled(patientList.map(p => api.get(`/patients/${p.id}/billing`))),
    ]);
    const vmap = {};
    const bmap = {};
    patientList.forEach((p, i) => {
      const visits = visitResults[i].status === 'fulfilled' ? visitResults[i].value.data : [];
      vmap[p.id] = { count: visits.length, lastVisit: visits.length > 0 ? visits[0].visitDate : null };
      const b = billingResults[i].status === 'fulfilled' ? billingResults[i].value.data : null;
      bmap[p.id] = b;
    });
    setVisitData(vmap);
    setBillingData(bmap);
  };

  useEffect(() => { fetchPatients(); }, [fetchPatients]);

  useEffect(() => {
    if (!search.trim()) { fetchPatients(); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchPatientsApi(search);
        setPatients(res.data);
      } catch { toast.error('Search failed'); }
      finally { setSearching(false); }
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const handleDelete = async (id) => {
    try {
      await deletePatientApi(id);
      toast.success('Patient deleted');
      setDeleteConfirm(null);
      fetchPatients();
    } catch { toast.error('Failed to delete patient'); }
  };

  const filtered = filterStatus === 'all' ? patients : patients.filter(p => p.status === filterStatus);
  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    inactive: patients.filter(p => p.status === 'inactive').length,
  };

  const pad = isMobile ? '0 10px 32px' : '0 28px 40px';

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif", background:'#f5f6fa', boxSizing:'border-box' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .row-hover:hover { background:#f0fefe!important; }
        .action-btn:hover{ opacity:0.8!important; }
        .filter-btn:hover{ background:#f0fefe!important; color:#00ACB1!important; border-color:#87E4DB!important; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:5px; }
        ::-webkit-scrollbar-thumb{ background:#00ACB1; border-radius:4px; }
        input::placeholder{ color:#9ca3af; }
      `}</style>

      <Sidebar activePath="/patients" />

      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:'100vh', width: isMobile ? '100%' : undefined }}>

        {/* TOP BAR */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: isMobile ? '12px 12px' : '20px 28px', background:'#fff', borderBottom:'1px solid #e5e7eb', marginBottom:16, gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ paddingLeft: isMobile ? 58 : 0, flex:1, minWidth:0 }}>
            <div style={{ color:'#111', fontSize: isMobile ? 15 : 20, fontWeight:800, display:'inline-flex', alignItems:'center', gap:8 }}><ClipboardList size={isMobile ? 26 : 22} color='#00ACB1' /> All Patients</div>
            <div style={{ color:'#6b7280', fontSize:12, marginTop:3 }}>Manage and view all registered patients</div>
          </div>
          <button onClick={() => navigate('/add-patient')} style={{ background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, padding: isMobile ? '9px 12px' : '11px 22px', cursor:'pointer', fontSize: isMobile ? 12 : 13, fontWeight:700, boxShadow:'0 3px 10px rgba(13,148,136,0.3)', display:'inline-flex', alignItems:'center', gap:6, flexShrink:0 }}>
            {isMobile ? <Plus size={16} /> : <><UserPlus size={14}/> New Patient</>}
          </button>
        </div>

        <div style={{ padding: pad }}>

          {/* STAT CARDS */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(3,1fr)' : 'repeat(3,auto)', gap: isMobile ? 8 : 14, marginBottom:16, animation:'fadeUp 0.3s ease' }}>
            {[
              { label:'Total',    value:stats.total,    icon:<Users size={20} />,        color:'#015D67', bg:'#f0fefe', border:'#87E4DB', accent:'#00ACB1' },
              { label:'Active',   value:stats.active,   icon:<CheckCircle2 size={20} />, color:'#015D67', bg:'#CAF0C1', border:'#87E4DB', accent:'#015D67' },
              { label:'Inactive', value:stats.inactive, icon:<MinusCircle size={18} />,  color:'#dc2626', bg:'#fef2f2', border:'#fecaca', accent:'#dc2626' },
            ].map((st,i) => (
              <div key={i} style={{ background:st.bg, border:`1.5px solid ${st.border}`, borderLeft:`4px solid ${st.accent}`, borderRadius:14, padding: isMobile ? '10px 11px' : '16px 20px', display:'flex', alignItems:'center', gap:8, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ background:'#fff', borderRadius:9, width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center', color:st.accent, boxShadow:`0 2px 6px ${st.border}88`, flexShrink:0 }}>{st.icon}</div>
                <div>
                  <div style={{ color:st.color, fontSize: isMobile ? 22 : 26, fontWeight:900, lineHeight:1 }}>{st.value}</div>
                  <div style={{ color:'#6b7280', fontSize:11, marginTop:3, fontWeight:500 }}>{st.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH + FILTER */}
          <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'center', animation:'fadeUp 0.32s ease' }}>
            <div style={{ position:'relative', flex:1, minWidth: isMobile ? '100%' : 230, display:'flex', alignItems:'center' }}>
              <span style={{ position:'absolute', left:11, pointerEvents:'none', color:'#9ca3af' }}><Search size={14} /></span>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search patients by name..."
                style={{ width:'100%', padding:'11px 13px 11px 36px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, color:'#111', fontSize:13, outline:'none' }}
              />
              {searching && <span style={{ position:'absolute', right:11, fontSize:12, color:'#00ACB1' }}>...</span>}
              {search && <span onClick={() => setSearch('')} style={{ position:'absolute', right:11, cursor:'pointer', color:'#9ca3af' }}><X size={13} /></span>}
            </div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {['all','active','inactive'].map(f => (
                <button key={f} className="filter-btn"
                  onClick={() => setFilterStatus(f)}
                  style={{ padding: isMobile ? '7px 11px' : '9px 15px', background: filterStatus===f ? '#f0fefe' : '#fff', border: filterStatus===f ? '1.5px solid #00ACB1' : '1px solid #e5e7eb', borderRadius:9, color: filterStatus===f ? '#00ACB1' : '#6b7280', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.2s' }}>
                  {f === 'all' ? <span style={{display:'inline-flex',alignItems:'center',gap:5}}><ClipboardList size={12} /> All</span> : f === 'active' ? <span style={{display:'inline-flex',alignItems:'center',gap:5}}><CheckCircle2 size={11} /> Active</span> : <span style={{display:'inline-flex',alignItems:'center',gap:5}}><MinusCircle size={11} /> Inactive</span>}
                </button>
              ))}
            </div>
          </div>

          {/* TABLE / CARDS */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow: isMobile ? 'visible' : 'hidden', animation:'fadeUp 0.38s ease', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'56px 20px', color:'#6b7280', fontSize:14 }}><span style={{display:'inline-flex',alignItems:'center',gap:7}}><Loader2 size={14} style={{animation:'spin 1s linear infinite'}} /> Loading patients...</span></div>
            ) : filtered.length === 0 ? (
              <div style={{ textAlign:'center', padding:'56px 20px' }}>
                <div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Stethoscope size={44} color="#d1d5db" /></div>
                <div style={{ color:'#111', fontSize:16, fontWeight:700, marginBottom:7 }}>{search ? `No results for "${search}"` : 'No patients yet'}</div>
                <div style={{ color:'#9ca3af', marginBottom:18, fontSize:13 }}>{search ? 'Try a different search' : 'Add your first patient'}</div>
                {!search && <button onClick={() => navigate('/add-patient')} style={{ background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', padding:'9px 22px', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13, display:'inline-flex', alignItems:'center', gap:6 }}><UserPlus size={14} /> Add First Patient</button>}
              </div>
            ) : isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px 10px' }}>
                {filtered.map((patient, idx) => (
                  <div key={patient.id} className="row-hover"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                    style={{ background:'#fafafa', border:'1px solid #e5e7eb', borderRadius:12, padding:'13px', cursor:'pointer', transition:'all 0.15s', animation:`fadeUp 0.3s ease ${idx*0.04}s both` }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:34, height:34, borderRadius:'50%', background: patient.gender === 'Female' ? '#fdf2f8' : '#f0fefe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #e5e7eb' }}>
                          <UserCircle size={18} color={patient.gender === 'Female' ? '#ec4899' : '#00ACB1'} />
                        </div>
                        <div>
                          <div style={{ color:'#111', fontWeight:700, fontSize:13 }}>{patient.name}</div>
                          <div style={{ color:'#9ca3af', fontSize:11 }}>{patient.contactNumber} • {patient.age} yrs</div>
                        </div>
                      </div>
                      <span style={{ background: patient.status==='active' ? '#f0fffe' : '#fef2f2', color: patient.status==='active' ? '#015D67' : '#dc2626', border:`1px solid ${patient.status==='active' ? '#CAF0C1' : '#fecaca'}`, padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700 }}>
                        {patient.status==='active' ? '● Active' : '● Inactive'}
                      </span>
                    </div>
                    <div style={{ display:'flex', justifyContent:'space-between', marginTop:9, paddingTop:9, borderTop:'1px solid #f3f4f6' }}>
                      <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap' }}>
                        {patient.bloodGroup && <span style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'1px 7px', borderRadius:20, fontSize:11, fontWeight:700 }}>🩸 {patient.bloodGroup}</span>}
                        <span style={{ color:'#6b7280', fontSize:11 }}>🩺 {visitData[patient.id]?.count ?? '—'} visits</span>
                        {(() => {
                          const b = billingData[patient.id];
                          if (!b || b.totalBilled === 0) return null;
                          if (b.balance > 0.01) return (
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <AlertTriangle size={13} color='#dc2626' />
                              <span style={{ color:'#dc2626', fontWeight:700, fontSize:12 }}>₹{b.balance.toLocaleString('en-IN',{maximumFractionDigits:0})} due</span>
                            </div>
                          );
                          return (
                            <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                              <CheckCircle2 size={13} color='#015D67' />
                              <span style={{ color:'#015D67', fontWeight:700, fontSize:12 }}>Paid</span>
                            </div>
                          );
                        })()}
                      </div>
                      <button className="action-btn"
                        onClick={e => { e.stopPropagation(); setDeleteConfirm(patient.id); }}
                        style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, padding:'4px 9px', cursor:'pointer' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f9fafb' }}>
                      {['#','Patient','Age','Contact','Blood Group','Visits','Last Visit','Status','Payment Status','Action'].map(h => (
                        <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'#6b7280', fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((patient, idx) => (
                      <tr key={patient.id} className="row-hover"
                        onClick={() => navigate(`/patients/${patient.id}`)}
                        style={{ borderBottom:'1px solid #f3f4f6', transition:'background 0.15s', cursor:'pointer', animation:`fadeUp 0.3s ease ${idx*0.03}s both` }}>
                        <td style={{ padding:'12px 14px' }}><div style={{ width:28, height:28, borderRadius:'50%', background:'#f0fefe', color:'#00ACB1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, border:'1px solid #87E4DB' }}>{idx+1}</div></td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                            <div style={{ width:36, height:36, borderRadius:'50%', background: patient.gender==='Female' ? '#fdf2f8' : '#f0fefe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #e5e7eb' }}><UserCircle size={18} color={patient.gender==='Female' ? '#ec4899' : '#00ACB1'} /></div>
                            <div>
                              <div style={{ color:'#111', fontWeight:700, fontSize:13 }}>{patient.name}</div>
                              <div style={{ color:'#9ca3af', fontSize:11 }}>{patient.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding:'12px 14px' }}><span style={{ color:'#111', fontWeight:600, fontSize:13 }}>{patient.age}</span><span style={{ color:'#9ca3af', fontSize:11 }}> yrs</span></td>
                        <td style={{ padding:'12px 14px', color:'#374151', fontSize:12 }}>{patient.contactNumber}</td>
                        <td style={{ padding:'12px 14px' }}>{patient.bloodGroup ? <span style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:700 }}>🩸 {patient.bloodGroup}</span> : <span style={{ color:'#d1d5db', fontSize:12 }}>N/A</span>}</td>
                        <td style={{ padding:'12px 14px' }}><span style={{ background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700 }}>🩺 {visitData[patient.id]?.count ?? '—'}</span></td>
                        <td style={{ padding:'12px 14px', fontSize:12 }}>{visitData[patient.id]?.lastVisit ? <span style={{ color:'#b45309', fontWeight:600 }}>📅 {new Date(visitData[patient.id].lastVisit).toLocaleDateString('en-IN')}</span> : <span style={{ color:'#d1d5db', fontSize:12 }}>No visits</span>}</td>
                        <td style={{ padding:'12px 14px' }}><span style={{ background: patient.status==='active' ? '#f0fffe' : '#fef2f2', color: patient.status==='active' ? '#015D67' : '#dc2626', border:`1px solid ${patient.status==='active' ? '#CAF0C1' : '#fecaca'}`, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:600 }}>{patient.status==='active' ? '● Active' : '● Inactive'}</span></td>
                        <td style={{ padding:'12px 14px' }}>
                          {(() => {
                            const b = billingData[patient.id];
                            const bal = b ? b.balance : 0;
                            const totalBilled = b ? b.totalBilled : 0;
                            const totalPaid = b ? b.totalPaid : 0;
                            if (!b || totalBilled === 0) return <span style={{ color:'#d1d5db', fontSize:12 }}>— No billing</span>;
                            if (bal > 0.01) return (
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <AlertTriangle size={14} color='#dc2626' />
                                <div>
                                  <div style={{ color:'#dc2626', fontWeight:800, fontSize:13 }}>₹{bal.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                                  <div style={{ color:'#fca5a5', fontSize:9, fontWeight:700 }}>REMAINING</div>
                                </div>
                              </div>
                            );
                            return (
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <CheckCircle2 size={15} color='#015D67' />
                                <div>
                                  <div style={{ color:'#015D67', fontWeight:800, fontSize:13 }}>₹{totalPaid.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                                  <div style={{ color:'#87E4DB', fontSize:9, fontWeight:700 }}>FULLY PAID</div>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding:'12px 14px' }}>
                          <div style={{ display:'flex', gap:7 }}>
                            <button className="action-btn" onClick={e => { e.stopPropagation(); navigate(`/patients/${patient.id}`); }} style={{ background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', borderRadius:7, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600, transition:'all 0.15s', whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:5 }}><Eye size={12} /> View</button>
                            <button className="action-btn" onClick={e => { e.stopPropagation(); setDeleteConfirm(patient.id); }} style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, padding:'6px 9px', cursor:'pointer', transition:'all 0.15s' }}><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {!loading && filtered.length > 0 && (
            <div style={{ color:'#9ca3af', fontSize:12, marginTop:10, textAlign:'right' }}>
              Showing {filtered.length} of {patients.length} patient{patients.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* DELETE MODAL */}
      {deleteConfirm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background:'#fff', border:'1px solid #fecaca', borderRadius:20, padding:'32px 28px', textAlign:'center', maxWidth:380, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ marginBottom:14, display:'flex', justifyContent:'center' }}><AlertTriangle size={44} color="#dc2626" /></div>
            <div style={{ color:'#111', fontSize:18, fontWeight:800, marginBottom:7 }}>Delete Patient?</div>
            <div style={{ color:'#6b7280', fontSize:13, marginBottom:24, lineHeight:1.6 }}>This will permanently delete the patient and all their visit records. This cannot be undone.</div>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ padding:'11px 26px', background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}><X size={13} /> Cancel</button>
              <button onClick={() => handleDelete(deleteConfirm)} style={{ padding:'11px 26px', background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', border:'none', borderRadius:10, fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:6 }}><Trash2 size={13} /> Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}