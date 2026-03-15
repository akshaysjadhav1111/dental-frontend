import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatientsApi, getStatsApi, getTodayAppointmentsApi } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import { Users, UserPlus, Calendar, Bell, CreditCard, ClipboardList, Eye, Pencil, Trash2, Search, CheckCircle2, AlertTriangle, Clock, ArrowLeft, ArrowRight, Printer, Plus, RefreshCw, Activity, FileText, Stethoscope, Phone, Mail, MapPin, Loader2, XCircle, ChevronDown, Upload, X, Check, AlertCircle, Zap, Heart, Tag, Receipt, CreditCard as CardIcon, Folder, File, FileUp, Replace, RotateCcw, Droplets, Pill, Building2, CheckCheck, MinusCircle, UserCircle } from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function Dashboard() {
  const { doctor, token } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [stats, setStats] = useState({ total: 0, today: 0, followups: 0, activePatients: 0 });
  const [recentPatients, setRecentPatients] = useState([]);
  const [billingMap, setBillingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [appointmentCount, setAppointmentCount] = useState(0);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const [pRes, sRes, aRes] = await Promise.all([getPatientsApi(), getStatsApi(), getTodayAppointmentsApi()]);
      const sorted = pRes.data.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));
      const recent = sorted.slice(0, 6);
      setRecentPatients(recent);
      setStats(sRes.data);
      setAppointmentCount(aRes.data.length);
      const api = axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } });
      const billingResults = await Promise.allSettled(recent.map(p => api.get(`/patients/${p.id}/billing`)));
      const bmap = {};
      recent.forEach((p, i) => {
        if (billingResults[i].status === 'fulfilled') bmap[p.id] = billingResults[i].value.data;
      });
      setBillingMap(bmap);
    } catch { toast.error('Failed to load data'); }
    finally { setLoading(false); }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f5f6fa', fontFamily:"'Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes fadeUp    { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:translateY(0)} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes spin      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .stat-card:hover     { transform:translateY(-7px)!important; box-shadow:0 18px 40px rgba(1,93,103,0.28)!important; }
        .patient-row:hover   { background:#f0fefe!important; }
        .view-btn:hover      { background:#015D67!important; transform:scale(1.04)!important; }
        .action-btn:hover    { transform:translateY(-2px)!important; opacity:0.88; }
        .see-all:hover       { background:#015D67!important; color:#fff!important; border-color:#015D67!important; }
        .quick-btn:hover     { background:#f0fefe!important; transform:translateX(3px)!important; border-color:#87E4DB!important; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar  { width:5px; }
        ::-webkit-scrollbar-thumb { background:#00ACB1; border-radius:4px; }
      `}</style>

      <Sidebar activePath="/" />

      {/* MAIN */}
      <div style={{
        marginLeft: isMobile ? 0 : 240,
        flex: 1,
        padding: isMobile ? '0 0 32px' : '0 0 32px',
        position: 'relative',
        minHeight: '100vh',
        width: isMobile ? '100%' : undefined,
      }}>

        {/* TOP HEADER */}
        <div style={{
          display:'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent:'space-between', alignItems: isMobile ? 'stretch' : 'center',
          padding: isMobile ? '14px 12px 12px 12px' : '24px 28px 18px',
          gap: isMobile ? 12 : 12,
          background:'#fff',
          borderBottom:'1px solid #e5e7eb', marginBottom:20,
          position:'relative', zIndex:1,
          boxShadow:'0 1px 6px rgba(0,0,0,0.06)',
        }}>
          <div style={{ animation:'fadeUp 0.5s ease', paddingLeft: isMobile ? 58 : 0 }}>
            <div style={{ color:'#015D67', fontSize:12, fontWeight:700, marginBottom:2 }}>{greeting},</div>
            <div style={{ color:'#111', fontSize: isMobile ? 18 : 'clamp(19px,2.5vw,26px)', fontWeight:800, margin:'0 0 2px' }}>{doctor?.doctorName}</div>
            <div style={{ color:'#6b7280', fontSize:12, display:'flex', alignItems:'center', gap:5 }}>
              <Calendar size={13} color="#00ACB1" /> {new Date().toLocaleDateString('en-IN',{weekday:'long',year:'numeric',month:'long',day:'numeric'})}
            </div>
          </div>

          {/* ── TOP NAV BUTTONS ── */}
          {isMobile ? (
            /* ── MOBILE: single row, icon + label stacked ── */
            <div style={{ width:'100%', display:'flex', flexDirection:'row', gap:6, alignItems:'stretch', justifyContent:'center' }}>

              {/* Appts */}
              <div style={{ position:'relative', flex:1 }}>
                <button className="action-btn" onClick={() => navigate('/appointments')}
                  style={{...btnOutline, borderColor:'rgba(180,83,9,0.45)', color:'#b45309', width:'100%', height:54, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'6px 4px'}}>
                  <Calendar size={16} />
                  <span style={{fontSize:10, fontWeight:700, lineHeight:1}}>Appts</span>
                </button>
                {appointmentCount > 0 && <span style={badge}>{appointmentCount}</span>}
              </div>

              {/* Follow-ups */}
              <div style={{ position:'relative', flex:1 }}>
                <button className="action-btn" onClick={() => navigate('/followups')}
                  style={{...btnOutline, borderColor:'rgba(220,38,38,0.4)', color:'#dc2626', width:'100%', height:54, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'6px 4px'}}>
                  <Bell size={16} />
                  <span style={{fontSize:10, fontWeight:700, lineHeight:1}}>Follow-ups</span>
                </button>
                {stats.followups > 0 && <span style={badge}>{stats.followups}</span>}
              </div>

              {/* Payments */}
              <div style={{ flex:1 }}>
                <button className="action-btn" onClick={() => navigate('/payment-status')}
                  style={{...btnOutline, borderColor:'rgba(0,172,177,0.45)', color:'#00ACB1', width:'100%', height:54, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'6px 4px'}}>
                  <CreditCard size={16} />
                  <span style={{fontSize:10, fontWeight:700, lineHeight:1}}>Payments</span>
                </button>
              </div>

              {/* Patients */}
              <div style={{ flex:1 }}>
                <button className="action-btn" onClick={() => navigate('/patients')}
                  style={{...btnOutline, borderColor:'rgba(1,93,103,0.4)', color:'#015D67', width:'100%', height:54, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'6px 4px'}}>
                  <ClipboardList size={16} />
                  <span style={{fontSize:10, fontWeight:700, lineHeight:1}}>Patients</span>
                </button>
              </div>

              {/* Add New */}
              <div style={{ flex:1 }}>
                <button className="action-btn" onClick={() => navigate('/add-patient')}
                  style={{...btnPrimary, width:'100%', height:54, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'6px 4px', boxShadow:'0 4px 14px rgba(0,172,177,0.35)'}}>
                  <Plus size={16} />
                  <span style={{fontSize:10, fontWeight:700, lineHeight:1}}>Add New</span>
                </button>
              </div>

            </div>
          ) : (
            /* ── DESKTOP: single row ── */
            <div style={{ display:'flex', gap:8, alignItems:'center' }}>
              <div style={{position:'relative'}}>
                <button className="action-btn" onClick={() => navigate('/appointments')}
                  style={{...btnOutline, borderColor:'rgba(180,83,9,0.45)', color:'#b45309', width:148, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:13, padding:'0 18px'}}>
                  <Calendar size={15} /> Appointments
                </button>
                {appointmentCount > 0 && <span style={badge}>{appointmentCount}</span>}
              </div>
              <div style={{position:'relative'}}>
                <button className="action-btn" onClick={() => navigate('/followups')}
                  style={{...btnOutline, borderColor:'rgba(220,38,38,0.4)', color:'#dc2626', width:148, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:13, padding:'0 18px'}}>
                  <Bell size={15} /> Follow-ups
                </button>
                {stats.followups > 0 && <span style={badge}>{stats.followups}</span>}
              </div>
              <button className="action-btn" onClick={() => navigate('/payment-status')}
                style={{...btnOutline, borderColor:'rgba(0,172,177,0.45)', color:'#00ACB1', width:148, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:13, padding:'0 18px'}}>
                <CreditCard size={15} /> Payments
              </button>
              <button className="action-btn" onClick={() => navigate('/patients')}
                style={{...btnOutline, borderColor:'rgba(1,93,103,0.4)', color:'#015D67', width:148, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:13, padding:'0 18px'}}>
                <ClipboardList size={15} /> All Patients
              </button>
              <button className="action-btn" onClick={() => navigate('/add-patient')}
                style={{...btnPrimary, width:148, height:44, display:'flex', alignItems:'center', justifyContent:'center', gap:7, fontSize:13, padding:'0 18px'}}>
                <Plus size={15} /> New Patient
              </button>
            </div>
          )}
        </div>

        {/* ── STAT CARDS ── */}
        <div style={{
          display:'grid',
          gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)',
          gap: isMobile ? 8 : 14,
          padding: isMobile ? '0 10px 14px' : '0 28px 20px',
          position:'relative', zIndex:1,
        }}>
          {[
            {
              iconName:'users',
              label:'Total Patients',
              value: stats.total,
              sub: `${stats.activePatients} active`,
              grad:'linear-gradient(135deg,#015D67 0%,#00ACB1 100%)',
              glow:'rgba(0,172,177,0.38)',
              bar:'#87E4DB',
              darkText: false,
            },
            {
              iconName:'calendar',
              label:"Today's Visits",
              value: stats.today,
              sub: stats.today === 0 ? 'No visits yet' : `${stats.today} today`,
              grad:'linear-gradient(135deg,#00ACB1 0%,#87E4DB 100%)',
              glow:'rgba(0,172,177,0.28)',
              bar:'#CAF0C1',
              darkText: false,
            },
            {
              iconName:'bell',
              label:'Follow-ups Due',
              value: stats.followups,
              sub: stats.followups === 0 ? 'None pending' : `${stats.followups} due`,
              grad:'linear-gradient(135deg,#87E4DB 0%,#CAF0C1 100%)',
              glow:'rgba(135,228,219,0.38)',
              bar:'#015D67',
              darkText: true,
            },
            {
              iconName:'check',
              label:'Active Patients',
              value: stats.activePatients,
              sub: `${stats.total - stats.activePatients} inactive`,
              grad:'linear-gradient(135deg,#CAF0C1 0%,#87E4DB 100%)',
              glow:'rgba(135,228,219,0.45)',
              bar:'#015D67',
              darkText: true,
            },
          ].map((c,i) => {
            const sz = isMobile ? 15 : 16;
            const StatIcon = c.iconName==='users' ? Users : c.iconName==='calendar' ? Calendar : c.iconName==='bell' ? Bell : CheckCircle2;
            const textColor  = c.darkText ? '#015D67' : '#fff';
            const subColor   = c.darkText ? 'rgba(1,93,103,0.6)' : 'rgba(255,255,255,0.55)';
            const labelColor = c.darkText ? 'rgba(1,93,103,0.88)' : 'rgba(255,255,255,0.92)';
            return (
              <div key={c.label} className="stat-card" style={{
                background: c.grad,
                boxShadow: `0 4px 18px ${c.glow}`,
                animation: `fadeUp 0.5s ease ${i*0.1}s both`,
                borderRadius: 12,
                padding: isMobile ? '10px 9px' : '14px 16px',
                transition:'transform 0.25s ease, box-shadow 0.25s ease',
                border:'1px solid rgba(255,255,255,0.28)',
                cursor:'default',
              }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
                  <div style={{ background:'rgba(255,255,255,0.24)', borderRadius:7, width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <StatIcon size={sz} color={c.darkText ? '#015D67' : 'rgba(255,255,255,0.95)'} />
                  </div>
                  <div style={{ fontSize: isMobile ? 24 : 28, fontWeight:900, color:textColor, lineHeight:1 }}>
                    {loading ? <span style={{animation:'pulse 1s infinite', fontSize:18, color:textColor}}>—</span> : c.value}
                  </div>
                </div>
                <div style={{ color:labelColor, fontSize: isMobile ? 10 : 11, fontWeight:700, marginBottom:1 }}>{c.label}</div>
                <div style={{ color:subColor, fontSize:9, marginBottom:6 }}>{c.sub}</div>
                {/* Progress bar */}
                <div style={{ height:3, borderRadius:4, background:'rgba(255,255,255,0.28)', overflow:'hidden' }}>
                  <div style={{
                    height:'100%',
                    width: stats.total > 0 ? `${Math.min((c.value / Math.max(stats.total,1))*100, 100)}%` : '10%',
                    background: c.bar,
                    borderRadius:4,
                    transition:'width 1.2s ease',
                  }}/>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── BOTTOM SECTION ── */}
        <div style={{
          display:'flex',
          flexDirection: isMobile ? 'column' : 'row',
          gap:20,
          padding: isMobile ? '0 10px 24px' : '0 28px 32px',
          position:'relative', zIndex:1,
          alignItems:'flex-start',
        }}>

          {/* ── RECENT PATIENTS TABLE ── */}
          <div style={{...card, flex: isMobile ? undefined : 3, animation:'fadeUp 0.6s ease 0.3s both', minWidth:0, width: isMobile ? '100%' : undefined}}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <div style={{ fontSize:15, fontWeight:800, color:'#111', display:'inline-flex', alignItems:'center', gap:7 }}>
                <Users size={16} color="#00ACB1" /> Recent Patients
              </div>
              <button className="see-all" onClick={() => navigate('/patients')}
                style={{ background:'#f0fefe', color:'#015D67', border:'1.5px solid #87E4DB', padding:'6px 16px', borderRadius:8, cursor:'pointer', fontSize:12, fontWeight:700, transition:'all 0.2s' }}>
                See All →
              </button>
            </div>

            {loading ? (
              <p style={{ textAlign:'center', color:'#9ca3af', padding:'28px 0', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <Loader2 size={14} style={{animation:'spin 1s linear infinite', color:'#00ACB1'}} /> Loading...
              </p>
            ) : recentPatients.length === 0 ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{marginBottom:12,display:'flex',justifyContent:'center'}}><Stethoscope size={48} color="#d1d5db" /></div>
                <p style={{ color:'#9ca3af', fontSize:14, marginBottom:12 }}>No patients yet!</p>
                <button onClick={() => navigate('/add-patient')}
                  style={{ background:'linear-gradient(135deg,#015D67,#00ACB1)', color:'#fff', border:'none', padding:'10px 24px', borderRadius:10, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                  + Add First Patient
                </button>
              </div>
            ) : isMobile ? (
              /* ── Mobile card list ── */
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {recentPatients.map((p,i) => {
                  const b = billingMap[p.id];
                  const totalBilled = b?.totalBilled || 0;
                  const balance     = b?.balance     || 0;
                  const fullyPaid   = totalBilled > 0 && balance <= 0.01;
                  const noBilling   = !b || totalBilled === 0;
                  return (
                    <div key={p.id} className="patient-row"
                      onClick={() => navigate(`/patients/${p.id}`)}
                      style={{ background:'#fafafa', borderRadius:12, padding:'11px 13px', cursor:'pointer', transition:'all 0.18s', border:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                        <div style={{ width:28, height:28, borderRadius:'50%', background:'transparent', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, flexShrink:0 }}>{i+1}</div>
                        <div>
                          <div style={{ fontWeight:700, color:'#111', fontSize:13 }}>{p.name}</div>
                          <div style={{ color:'#9ca3af', fontSize:11 }}>{p.contactNumber} • {p.age} yrs</div>
                        </div>
                      </div>
                      {noBilling ? (
                        <span style={{ color:'#d1d5db', fontSize:11 }}>—</span>
                      ) : fullyPaid ? (
                        <div style={{ textAlign:'right' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                            <CheckCircle2 size={15} color='#015D67' />
                            <span style={{ color:'#015D67', fontWeight:800, fontSize:12 }}>₹{(b.totalPaid||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</span>
                          </div>
                          <div style={{ color:'#00ACB1', fontSize:9, fontWeight:700 }}>FULLY PAID</div>
                        </div>
                      ) : (
                        <div style={{ textAlign:'right' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:4, justifyContent:'flex-end' }}>
                            <AlertTriangle size={13} color='#dc2626' />
                            <span style={{ color:'#dc2626', fontWeight:800, fontSize:12 }}>₹{balance.toLocaleString('en-IN',{maximumFractionDigits:0})}</span>
                          </div>
                          <div style={{ color:'#fca5a5', fontSize:9, fontWeight:700 }}>REMAINING</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* ── Desktop table ── */
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f9fafb' }}>
                      {['#','Patient Name','Age','Contact','Payment','Action'].map(h=>(
                        <th key={h} style={{ textAlign:'left', padding:'9px 13px', color:'#6b7280', fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {recentPatients.map((p,i) => {
                      const b = billingMap[p.id];
                      const totalBilled = b?.totalBilled || 0;
                      const balance     = b?.balance     || 0;
                      const fullyPaid   = totalBilled > 0 && balance <= 0.01;
                      const noBilling   = !b || totalBilled === 0;
                      return (
                        <tr key={p.id} className="patient-row" onClick={() => navigate(`/patients/${p.id}`)}
                          style={{ cursor:'pointer', transition:'all 0.15s', borderBottom:'1px solid #f3f4f6' }}>
                          <td style={{ padding:'12px 13px' }}>
                            <div style={{ width:26, height:26, borderRadius:'50%', background:'transparent', color:'#9ca3af', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700 }}>{i+1}</div>
                          </td>
                          <td style={{ padding:'12px 13px' }}>
                            <div style={{ fontWeight:700, color:'#111', fontSize:13 }}>{p.name}</div>
                            <div style={{ color:'#9ca3af', fontSize:11 }}>{p.email || 'No email'}</div>
                          </td>
                          <td style={{ padding:'12px 13px' }}>
                            <span style={{ background:'#f0fefe', color:'#015D67', padding:'2px 9px', borderRadius:20, fontSize:11, fontWeight:600, border:'1px solid #87E4DB' }}>{p.age} yrs</span>
                          </td>
                          <td style={{ padding:'12px 13px', color:'#374151', fontSize:12 }}>{p.contactNumber}</td>
                          <td style={{ padding:'12px 13px' }}>
                            {noBilling ? (
                              <span style={{ color:'#d1d5db', fontSize:12 }}>— No billing</span>
                            ) : fullyPaid ? (
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <CheckCircle2 size={16} color='#015D67' />
                                <div>
                                  <div style={{ color:'#015D67', fontWeight:800, fontSize:13 }}>₹{(b.totalPaid||0).toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                                  <div style={{ color:'#00ACB1', fontSize:9, fontWeight:700 }}>FULLY PAID</div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                                <AlertTriangle size={14} color='#dc2626' />
                                <div>
                                  <div style={{ color:'#dc2626', fontWeight:800, fontSize:13 }}>₹{balance.toLocaleString('en-IN',{maximumFractionDigits:0})}</div>
                                  <div style={{ color:'#fca5a5', fontSize:9, fontWeight:700 }}>REMAINING</div>
                                </div>
                              </div>
                            )}
                          </td>
                          <td style={{ padding:'12px 13px' }}>
                            <button className="view-btn" onClick={e=>{e.stopPropagation();navigate(`/patients/${p.id}`);}}
                              style={{ background:'linear-gradient(135deg,#015D67,#00ACB1)', color:'#fff', border:'none', padding:'6px 13px', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600, transition:'all 0.2s' }}>
                              View →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display:'flex', flexDirection:'column', gap:14, flex: isMobile ? undefined : 1, width: isMobile ? '100%' : undefined, minWidth: isMobile ? undefined : 200, maxWidth: isMobile ? undefined : 260 }}>

            {/* Doctor image card */}
            {!isMobile && (
              <div style={{...card, padding:0, overflow:'hidden', animation:'fadeUp 0.6s ease 0.4s both'}}>
                <div style={{ position:'relative', height:178 }}>
                  <img src="/doctor-bg.jpg" alt="clinic" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.75)' }}/>
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(1,93,103,0.92) 0%,transparent 55%)' }}/>
                  <div style={{ position:'absolute', bottom:0, left:0, padding:16 }}>
                    <div style={{ color:'#87E4DB', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:4 }}>Our Promise</div>
                    <div style={{ color:'#fff', fontWeight:800, fontSize:15 }}>Excellence in Dental Care</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div style={{...card, animation:'fadeUp 0.6s ease 0.5s both', padding:16}}>
              <div style={{ fontSize:13, fontWeight:700, color:'#111', marginBottom:12, display:'inline-flex', alignItems:'center', gap:6 }}>
                <Zap size={13} color="#00ACB1" /> Quick Actions
              </div>
              {[
                { Icon:Calendar,      label:'Appointments',    path:'/appointments',   color:'#b45309' },
                { Icon:Bell,          label:'Follow-up List',  path:'/followups',      color:'#dc2626' },
                { Icon:CreditCard,    label:'Payment Status',  path:'/payment-status', color:'#00ACB1' },
                { Icon:UserPlus,      label:'Add New Patient', path:'/add-patient',    color:'#015D67' },
                { Icon:ClipboardList, label:'Patient Records', path:'/patients',       color:'#00ACB1' },
              ].map(a => (
                <button key={a.label} className="quick-btn" onClick={() => navigate(a.path)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 11px', background:'#fafafa', border:'1px solid #e5e7eb', borderLeft:`3px solid ${a.color}`, borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600, marginBottom:7, transition:'all 0.2s', color:'#374151' }}>
                  <a.Icon size={13} color={a.color} />
                  <span style={{ flex:1, textAlign:'left' }}>{a.label}</span>
                  <span style={{ opacity:0.4, fontSize:11, color:a.color }}>→</span>
                </button>
              ))}
            </div>

            {/* Today's Summary */}
            <div style={{...card, background:'linear-gradient(135deg,#015D67,#00ACB1)', animation:'fadeUp 0.6s ease 0.6s both', padding:16}}>
              <div style={{ color:'rgba(255,255,255,0.75)', fontSize:10, fontWeight:700, letterSpacing:2, textTransform:'uppercase', marginBottom:12, display:'inline-flex', alignItems:'center', gap:5 }}>
                <Activity size={10} /> Today's Summary
              </div>
              {[
                { label:"Today's Visits",  val: stats.today,          Icon:Calendar,     color:'#CAF0C1' },
                { label:'Follow-ups Due',  val: stats.followups,      Icon:Bell,         color:'#CAF0C1' },
                { label:'Active Patients', val: stats.activePatients, Icon:CheckCircle2, color:'#87E4DB' },
                { label:'Total Patients',  val: stats.total,          Icon:Users,        color:'#fff' },
              ].map(item => (
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:9, paddingBottom:9, borderBottom:'1px solid rgba(255,255,255,0.13)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <item.Icon size={12} color="rgba(255,255,255,0.7)" />
                    <span style={{ color:'rgba(255,255,255,0.72)', fontSize:11 }}>{item.label}</span>
                  </div>
                  <span style={{ color:item.color, fontWeight:800, fontSize:16 }}>{loading ? '—' : item.val}</span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

const card = {
  background:'#fff',
  border:'1px solid #e5e7eb',
  borderRadius:16,
  padding:20,
  boxShadow:'0 2px 12px rgba(0,0,0,0.05)',
};

const btnPrimary = {
  padding:'10px 20px',
  background:'linear-gradient(135deg,#015D67,#00ACB1)',
  color:'#fff',
  border:'none',
  borderRadius:10,
  fontWeight:700,
  fontSize:13,
  cursor:'pointer',
  boxShadow:'0 4px 16px rgba(0,172,177,0.4)',
  transition:'all 0.2s',
};

const btnOutline = {
  padding:'10px 18px',
  background:'#fff',
  color:'#374151',
  border:'1.5px solid #e5e7eb',
  borderRadius:10,
  fontWeight:700,
  fontSize:13,
  cursor:'pointer',
  transition:'all 0.2s',
};

const badge = {
  position:'absolute',
  top:'-7px',
  right:'-7px',
  background:'#ef4444',
  color:'#fff',
  fontSize:10,
  fontWeight:800,
  minWidth:18,
  height:18,
  borderRadius:'50%',
  display:'flex',
  alignItems:'center',
  justifyContent:'center',
  padding:'0 4px',
  border:'2px solid #f5f6fa',
  boxShadow:'0 2px 6px rgba(239,68,68,0.5)',
  zIndex:10,
};

const navLabel = {
  fontSize:9,
  fontWeight:600,
  color:'#6b7280',
  textAlign:'center',
  lineHeight:1,
  letterSpacing:'0.3px',
};