import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import {
  CreditCard,
  Receipt,
  Wallet,
  AlertTriangle,
  Clock,
  CheckCircle,
  Search,
  X,
  Eye,
  User,
  Users,
  Phone,
  ClipboardList,
  ChevronRight,
  Loader2,
  CheckCheck,
} from 'lucide-react';

const API_BASE = 'http://localhost:8080/api';

export default function PaymentStatus() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMobile = useMobile();

  const [patients, setPatients] = useState([]);
  const [billingMap, setBillingMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [payModal, setPayModal] = useState(null);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('');
  const [payLoading, setPayLoading] = useState(false);

  const fmt = (n) => `₹${(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
  const getApi = () => axios.create({ baseURL: API_BASE, headers: { Authorization: `Bearer ${token}` } });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const pRes = await getApi().get('/patients');
      const allPatients = pRes.data;
      const billingResults = await Promise.allSettled(
        allPatients.map(p => getApi().get(`/patients/${p.id}/billing`))
      );
      const bmap = {};
      allPatients.forEach((p, i) => {
        if (billingResults[i].status === 'fulfilled') bmap[p.id] = billingResults[i].value.data;
      });
      setPatients(allPatients);
      setBillingMap(bmap);
    } catch { toast.error('Failed to load payment data'); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handlePayment = async () => {
    const amt = parseFloat(payAmount);
    if (!amt || amt <= 0) { toast.error('Enter a valid amount'); return; }
    setPayLoading(true);
    try {
      await getApi().post(`/patients/${payModal.patient.id}/billing/payment`, { amount: amt, note: payNote });
      toast.success(`Payment of ${fmt(amt)} recorded for ${payModal.patient.name}!`);
      setPayModal(null); setPayAmount(''); setPayNote('');
      fetchAll();
    } catch { toast.error('Failed to record payment'); }
    finally { setPayLoading(false); }
  };

  const displayList = patients
    .map(p => {
      const b = billingMap[p.id];
      const totalBilled = b?.totalBilled || 0;
      const totalPaid   = b?.totalPaid   || 0;
      const balance     = b?.balance     || 0;
      let status = 'no-billing';
      if (totalBilled > 0) {
        if (balance <= 0.001) status = 'paid';
        else if (totalPaid > 0) status = 'partial';
        else status = 'pending';
      }
      return { patient: p, billing: b, totalBilled, totalPaid, balance, status };
    })
    .filter(item => {
      if (filter !== 'all' && item.status !== filter) return false;
      if (search.trim() && !item.patient.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort((a, b) => ({ pending:0, partial:1, paid:2, 'no-billing':3 }[a.status] - ({ pending:0, partial:1, paid:2, 'no-billing':3 }[b.status])));

  const summary = patients.reduce((acc, p) => {
    const b = billingMap[p.id];
    if (b) {
      acc.totalBilled += b.totalBilled || 0;
      acc.totalPaid   += b.totalPaid   || 0;
      acc.totalDue    += b.balance     || 0;
      if (b.totalBilled > 0) {
        if ((b.balance || 0) <= 0.001) acc.paid++;
        else if ((b.totalPaid || 0) > 0) acc.partial++;
        else acc.pending++;
      }
    }
    return acc;
  }, { totalBilled:0, totalPaid:0, totalDue:0, paid:0, partial:0, pending:0 });

  const cfg = {
    paid:         { label:'Paid',       color:'#015D67', bg:'#f0fffe', border:'#CAF0C1', Icon: CheckCircle  },
    partial:      { label:'Partial',    color:'#b45309', bg:'#fffbeb', border:'#fde68a', Icon: Clock        },
    pending:      { label:'Pending',    color:'#dc2626', bg:'#fef2f2', border:'#fecaca', Icon: AlertTriangle },
    'no-billing': { label:'No Billing', color:'#9ca3af', bg:'#fafafa', border:'#e5e7eb', Icon: ClipboardList },
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif", background:'#f5f6fa' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .rh:hover { background:#f0fefe!important; }
        .fb:hover { background:#f0fefe!important; color:#00ACB1!important; border-color:#87E4DB!important; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:5px; }
        ::-webkit-scrollbar-thumb{ background:#00ACB1; border-radius:4px; }
        input::placeholder{ color:#9ca3af; }
        .pinp:focus{ border-color:#00ACB1!important; box-shadow:0 0 0 3px rgba(16,185,129,0.1)!important; outline:none; }
        .pinp::placeholder{ color:#9ca3af; }
      `}</style>

      <Sidebar activePath="/payment-status" />

      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:'100vh' }}>

        {/* TOP BAR */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: isMobile ? '12px 12px 12px 12px' : '20px 28px', background:'#fff', borderBottom:'1px solid #e5e7eb', marginBottom:16, flexWrap:'wrap', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:11, paddingLeft: isMobile ? 58 : 0 }}>
            <CreditCard size={30} color="#00ACB1" />
            <div>
              <div style={{ color:'#111', fontSize: isMobile ? 17 : 20, fontWeight:800 }}>Payment Status</div>
              <div style={{ color:'#6b7280', fontSize:12, marginTop:3 }}>Track all patient payments and outstanding balances</div>
            </div>
          </div>
        </div>

        <div style={{ padding: isMobile ? '0 10px 28px' : '0 28px 40px' }}>

          {/* SUMMARY CARDS */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(6,1fr)', gap: isMobile ? 7 : 8, marginBottom:14, animation:'fadeUp 0.3s ease' }}>
            {[
              { label:'Total Billed',    value: fmt(summary.totalBilled), color:'#015D67', bg:'#f0fefe', border:'#87E4DB', Icon: Receipt       },
              { label:'Total Collected', value: fmt(summary.totalPaid),   color:'#015D67', bg:'#CAF0C1', border:'#87E4DB', Icon: Wallet        },
              { label:'Total Due',       value: fmt(summary.totalDue),    color: summary.totalDue>0?'#dc2626':'#015D67', bg: summary.totalDue>0?'#fef2f2':'#CAF0C1', border: summary.totalDue>0?'#fecaca':'#87E4DB', Icon: AlertTriangle },
              { label:'Pending',         value: summary.pending,           color:'#dc2626', bg:'#fef2f2', border:'#fecaca', Icon: Clock         },
              { label:'Partial',         value: summary.partial,           color:'#b45309', bg:'#fffbeb', border:'#fde68a', Icon: ChevronRight  },
              { label:'Fully Paid',      value: summary.paid,              color:'#015D67', bg:'#CAF0C1', border:'#87E4DB', Icon: CheckCircle   },
            ].map((c, i) => (
              <div key={i} style={{ background:c.bg, border:`1.5px solid ${c.border}`, borderLeft:`3px solid ${c.color}`, borderRadius:10, padding: isMobile ? '10px 10px' : '8px 9px', animation:`fadeUp 0.3s ease ${i*0.04}s both`, display:'flex', alignItems:'center', gap:7, boxShadow:'0 2px 5px rgba(0,0,0,0.04)' }}>
                <c.Icon size={14} color={c.color} strokeWidth={2} />
                <div>
                  <div style={{ color:c.color, fontSize: isMobile ? 13 : 14, fontWeight:900, lineHeight:1 }}>{c.value}</div>
                  <div style={{ color:'#374151', fontSize: isMobile ? 9 : 9, marginTop:2, textTransform:'uppercase', letterSpacing:0.6, whiteSpace:'nowrap', fontWeight:500 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* SEARCH + FILTER */}
          <div style={{ display:'flex', gap:9, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <div style={{ position:'relative', flex:1, minWidth: isMobile?'100%':210 }}>
              <Search size={14} color="#9ca3af" style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patient name..."
                style={{ width:'100%', padding:'10px 13px 10px 34px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, color:'#111', fontSize:13, outline:'none' }}/>
              {search && (
                <span onClick={() => setSearch('')} style={{ position:'absolute', right:11, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#9ca3af', display:'flex' }}>
                  <X size={14} />
                </span>
              )}
            </div>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {[
                { key:'all',     label:'All',     Icon: ClipboardList, count: patients.length,  activeColor:'#00ACB1', activeBg:'#f0fefe', activeBorder:'#87E4DB' },
                { key:'pending', label:'Pending', Icon: AlertTriangle, count: summary.pending,  activeColor:'#dc2626', activeBg:'#fef2f2', activeBorder:'#fecaca' },
                { key:'partial', label:'Partial', Icon: Clock,         count: summary.partial,  activeColor:'#b45309', activeBg:'#fffbeb', activeBorder:'#fde68a' },
                { key:'paid',    label:'Paid',    Icon: CheckCircle,   count: summary.paid,     activeColor:'#015D67', activeBg:'#f0fffe', activeBorder:'#CAF0C1' },
              ].map(f => {
                const isActive = filter === f.key;
                return (
                  <button key={f.key} className="fb" onClick={() => setFilter(f.key)}
                    style={{
                      padding: isMobile ? '7px 11px' : '9px 16px',
                      background: isActive ? f.activeBg : '#fff',
                      border: isActive ? `1.5px solid ${f.activeBorder}` : '1px solid #e5e7eb',
                      borderRadius: 9, color: isActive ? f.activeColor : '#6b7280',
                      cursor: 'pointer', fontSize: 12, fontWeight: isActive ? 700 : 600,
                      transition: 'all 0.2s', display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                    <f.Icon size={13} strokeWidth={2} />
                    {f.label}
                    <span style={{
                      background: isActive ? f.activeBorder : '#f3f4f6',
                      color: isActive ? f.activeColor : '#9ca3af',
                      borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700,
                    }}>{f.count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active filter banner */}
          {filter !== 'all' && (
            <div style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'9px 18px', marginBottom:8,
              background: filter==='pending' ? '#fef2f2' : filter==='partial' ? '#fffbeb' : '#f0fffe',
              border: filter==='pending' ? '1px solid #fecaca' : filter==='partial' ? '1px solid #fde68a' : '1px solid #CAF0C1',
              borderRadius:11, animation:'fadeUp 0.2s ease',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                {filter==='pending' ? <AlertTriangle size={16} color="#dc2626" /> : filter==='partial' ? <Clock size={16} color="#b45309" /> : <CheckCircle size={16} color="#015D67" />}
                <span style={{ color: filter==='pending' ? '#dc2626' : filter==='partial' ? '#b45309' : '#015D67', fontWeight:700, fontSize:13 }}>
                  Showing {filter==='pending' ? 'Pending' : filter==='partial' ? 'Partial' : 'Fully Paid'} patients
                </span>
                <span style={{ color:'#9ca3af', fontSize:12 }}>— {displayList.length} result{displayList.length !== 1 ? 's' : ''}</span>
              </div>
              <button onClick={() => setFilter('all')}
                style={{ background:'#fff', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:7, padding:'3px 11px', cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', gap:5 }}>
                <X size={11} /> Clear
              </button>
            </div>
          )}

          {/* TABLE */}
          <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:16, overflow:'hidden', animation:'fadeUp 0.4s ease', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ textAlign:'center', padding:'56px', color:'#6b7280', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
                <Loader2 size={18} color="#00ACB1" style={{ animation:'spin 1s linear infinite' }} />
                Loading payment data...
              </div>
            ) : displayList.length === 0 ? (
              <div style={{ textAlign:'center', padding:'56px 20px' }}>
                <div style={{ display:'flex', justifyContent:'center', marginBottom:11 }}>
                  {filter==='pending' ? <AlertTriangle size={44} color="#dc2626" /> : filter==='partial' ? <Clock size={44} color="#b45309" /> : filter==='paid' ? <CheckCircle size={44} color="#015D67" /> : <CreditCard size={44} color="#d1d5db" />}
                </div>
                <div style={{ color:'#111', fontSize:16, fontWeight:700, marginBottom:6 }}>
                  {filter==='pending' ? 'No pending payments!' : filter==='partial' ? 'No partial payments!' : filter==='paid' ? 'No fully paid patients yet' : 'No records found'}
                </div>
                <div style={{ color:'#9ca3af', marginBottom: filter!=='all' ? 13 : 0, fontSize:13 }}>
                  {filter==='pending' ? 'All patients are up to date' : filter==='partial' ? 'No one has made a partial payment' : 'Try a different filter or search term'}
                </div>
                {filter !== 'all' && (
                  <button onClick={() => setFilter('all')} style={{ background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:9, padding:'7px 18px', cursor:'pointer', fontSize:12, fontWeight:600 }}>
                    Show All Patients
                  </button>
                )}
              </div>
            ) : isMobile ? (
              <div style={{ display:'flex', flexDirection:'column', gap:8, padding:'10px' }}>
                {displayList.map(({ patient, billing, totalBilled, totalPaid, balance, status }, idx) => {
                  const c = cfg[status];
                  return (
                    <div key={patient.id} style={{ background:'#fafafa', border:`1.5px solid ${c.border}`, borderRadius:12, padding:13, animation:`fadeUp 0.3s ease ${idx*0.04}s both` }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:9 }}>
                        <div style={{ display:'flex', gap:9, alignItems:'center' }}>
                          <div style={{ width:34, height:34, borderRadius:'50%', background: patient.gender==='Female'?'#fdf2f8':'#f0fefe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #e5e7eb' }}>
                            <User size={16} color={patient.gender==='Female'?'#ec4899':'#00ACB1'} />
                          </div>
                          <div>
                            <div style={{ color:'#111', fontWeight:700, fontSize:13 }}>{patient.name}</div>
                            <div style={{ color:'#9ca3af', fontSize:11, display:'flex', alignItems:'center', gap:4 }}>
                              <Phone size={10} /> {patient.contactNumber} • {patient.age} yrs
                            </div>
                          </div>
                        </div>
                        <span style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}`, padding:'2px 9px', borderRadius:20, fontSize:10, fontWeight:700, display:'flex', alignItems:'center', gap:3 }}>
                          <c.Icon size={10} strokeWidth={2.5} />
                          {c.label}
                        </span>
                      </div>
                      {totalBilled > 0 && (
                        <div style={{ display:'flex', gap:11, marginBottom:9, flexWrap:'wrap', padding:'7px 9px', background:'#fff', borderRadius:7, border:'1px solid #e5e7eb' }}>
                          <div style={{ fontSize:11 }}><span style={{ color:'#6b7280' }}>Billed: </span><span style={{ color:'#00ACB1', fontWeight:700 }}>{fmt(totalBilled)}</span></div>
                          <div style={{ fontSize:11 }}><span style={{ color:'#6b7280' }}>Paid: </span><span style={{ color:'#015D67', fontWeight:700 }}>{fmt(totalPaid)}</span></div>
                          <div style={{ fontSize:11 }}><span style={{ color:'#6b7280' }}>Due: </span><span style={{ color: balance>0.01?'#dc2626':'#015D67', fontWeight:700 }}>{fmt(balance)}</span></div>
                        </div>
                      )}
                      <div style={{ display:'flex', gap:7 }}>
                        <button onClick={() => navigate(`/patients/${patient.id}`)} style={{ flex:1, padding:'7px', background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                          <Eye size={12} /> View
                        </button>
                        {(status==='pending'||status==='partial') && (
                          <button onClick={() => { setPayModal({ patient, billing }); setPayAmount(''); setPayNote(''); }}
                            style={{ flex:1, padding:'7px', background:'#f0fffe', color:'#015D67', border:'1px solid #CAF0C1', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:5 }}>
                            <CreditCard size={12} /> Pay Now
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead>
                    <tr style={{ background:'#f9fafb' }}>
                      {['#','Patient','Contact','Total Billed','Amount Paid','Balance Due','Status','Action'].map(h => (
                        <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'#6b7280', fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', borderBottom:'1px solid #e5e7eb', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {displayList.map(({ patient, billing, totalBilled, totalPaid, balance, status }, idx) => {
                      const c = cfg[status];
                      return (
                        <tr key={patient.id} className="rh" style={{ borderBottom:'1px solid #f3f4f6', transition:'background 0.15s', animation:`fadeUp 0.3s ease ${idx*0.03}s both` }}>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ width:26, height:26, borderRadius:'50%', background:'#f0fefe', color:'#00ACB1', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, border:'1px solid #87E4DB' }}>{idx+1}</div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:9 }}>
                              <div style={{ width:34, height:34, borderRadius:'50%', background: patient.gender==='Female'?'#fdf2f8':'#f0fefe', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:'1px solid #e5e7eb' }}>
                                <User size={16} color={patient.gender==='Female'?'#ec4899':'#00ACB1'} />
                              </div>
                              <div>
                                <div style={{ color:'#111', fontWeight:700, fontSize:13 }}>{patient.name}</div>
                                <div style={{ color:'#9ca3af', fontSize:11 }}>{patient.age} yrs • {patient.gender}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px', color:'#374151', fontSize:12, whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                              <Phone size={12} color="#9ca3af" />
                              {patient.contactNumber}
                            </div>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            {totalBilled>0 ? <span style={{ color:'#00ACB1', fontWeight:700, fontSize:13 }}>{fmt(totalBilled)}</span> : <span style={{ color:'#d1d5db', fontSize:12 }}>—</span>}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            {totalPaid>0 ? <span style={{ color:'#015D67', fontWeight:700, fontSize:13 }}>{fmt(totalPaid)}</span> : <span style={{ color:'#9ca3af', fontSize:12 }}>₹0</span>}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            {totalBilled>0
                              ? <span style={{ color: balance>0.01?'#dc2626':'#015D67', fontWeight:800, fontSize:14 }}>{fmt(balance)}</span>
                              : <span style={{ color:'#d1d5db', fontSize:12 }}>—</span>}
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <span style={{ background:c.bg, color:c.color, border:`1px solid ${c.border}`, padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, whiteSpace:'nowrap', display:'inline-flex', alignItems:'center', gap:4 }}>
                              <c.Icon size={11} strokeWidth={2.5} />
                              {c.label}
                            </span>
                          </td>
                          <td style={{ padding:'12px 14px' }}>
                            <div style={{ display:'flex', gap:7 }}>
                              <button onClick={() => navigate(`/patients/${patient.id}`)} style={{ background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', borderRadius:7, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
                                <Eye size={13} /> View
                              </button>
                              {(status==='pending'||status==='partial') && (
                                <button onClick={() => { setPayModal({ patient, billing }); setPayAmount(''); setPayNote(''); }}
                                  style={{ background:'#f0fffe', color:'#015D67', border:'1px solid #CAF0C1', borderRadius:7, padding:'6px 12px', cursor:'pointer', fontSize:12, fontWeight:600, whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:5 }}>
                                  <CreditCard size={13} /> Pay Now
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          {!loading && <div style={{ color:'#9ca3af', fontSize:12, marginTop:9, textAlign:'right' }}>Showing {displayList.length} of {patients.length} patients</div>}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {payModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.4)', backdropFilter:'blur(6px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div style={{ background:'#fff', border:'1px solid #CAF0C1', borderRadius:20, padding:28, maxWidth:420, width:'100%', boxShadow:'0 24px 60px rgba(0,0,0,0.15)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <CreditCard size={20} color="#015D67" />
                <div>
                  <div style={{ color:'#111', fontWeight:800, fontSize:18 }}>Record Payment</div>
                  <div style={{ color:'#6b7280', fontSize:12, marginTop:3 }}>for {payModal.patient.name}</div>
                </div>
              </div>
              <button onClick={() => setPayModal(null)} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', color:'#6b7280', borderRadius:7, width:34, height:34, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <X size={16} />
              </button>
            </div>
            {payModal.billing && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:9, marginBottom:16 }}>
                {[
                  { label:'Billed', value: fmt(payModal.billing.totalBilled||0), color:'#00ACB1', bg:'#f0fefe', border:'#87E4DB', Icon: Receipt      },
                  { label:'Paid',   value: fmt(payModal.billing.totalPaid||0),   color:'#015D67', bg:'#f0fffe', border:'#CAF0C1', Icon: Wallet       },
                  { label:'Due',    value: fmt(payModal.billing.balance||0),      color:'#dc2626', bg:'#fef2f2', border:'#fecaca', Icon: AlertTriangle },
                ].map((c,i) => (
                  <div key={i} style={{ background:c.bg, borderRadius:9, padding:'9px 7px', textAlign:'center', border:`1px solid ${c.border}` }}>
                    <div style={{ display:'flex', justifyContent:'center', marginBottom:3 }}><c.Icon size={13} color={c.color} /></div>
                    <div style={{ color:'#6b7280', fontSize:9, textTransform:'uppercase', letterSpacing:1, marginBottom:3 }}>{c.label}</div>
                    <div style={{ color:c.color, fontWeight:800, fontSize:13 }}>{c.value}</div>
                  </div>
                ))}
              </div>
            )}
            {payModal.billing && (payModal.billing.balance||0)>0.01 && (
              <div style={{ marginBottom:13 }}>
                <div style={{ color:'#6b7280', fontSize:10, marginBottom:7, textTransform:'uppercase', letterSpacing:1 }}>Quick Fill</div>
                <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
                  {[{label:`Full: ${fmt(payModal.billing.balance)}`, val:payModal.billing.balance},{label:'₹500',val:500},{label:'₹1000',val:1000},{label:'₹2000',val:2000}]
                    .filter(q => q.val <= (payModal.billing.balance||0)+0.01)
                    .map((q,i) => (
                      <button key={i} onClick={() => setPayAmount(String(q.val))}
                        style={{ background:'#f0fffe', color:'#015D67', border:'1px solid #CAF0C1', borderRadius:7, padding:'4px 11px', cursor:'pointer', fontSize:11, fontWeight:600 }}>
                        {q.label}
                      </button>
                    ))}
                </div>
              </div>
            )}
            <div style={{ display:'flex', flexDirection:'column', gap:11, marginBottom:18 }}>
              <div>
                <label style={{ color:'#374151', fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:5 }}>Amount (₹) *</label>
                <input className="pinp" type="number" value={payAmount} onChange={e => setPayAmount(e.target.value)} placeholder="Enter amount..." min="1"
                  style={{ width:'100%', padding:'12px 14px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, color:'#111', fontSize:15, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box' }}/>
              </div>
              <div>
                <label style={{ color:'#374151', fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', display:'block', marginBottom:5 }}>Note (optional)</label>
                <input className="pinp" type="text" value={payNote} onChange={e => setPayNote(e.target.value)} placeholder="e.g. Cash, UPI, Cheque..."
                  style={{ width:'100%', padding:'11px 14px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:10, color:'#111', fontSize:13, fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box' }}/>
              </div>
            </div>
            <div style={{ display:'flex', gap:10 }}>
              <button onClick={() => setPayModal(null)} style={{ flex:1, padding:'12px', background:'#f9fafb', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <X size={14} /> Cancel
              </button>
              <button onClick={handlePayment} disabled={payLoading||!payAmount}
                style={{ flex:2, padding:'12px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor:payLoading||!payAmount?'not-allowed':'pointer', opacity:payLoading||!payAmount?0.7:1, boxShadow:'0 3px 10px rgba(16,185,129,0.3)', display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                {payLoading
                  ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> Recording...</>
                  : <><CheckCheck size={14} /> Confirm Payment</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}