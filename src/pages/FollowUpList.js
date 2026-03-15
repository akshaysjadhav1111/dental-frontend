import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getFollowUpsApi, updateVisitApi } from '../services/api';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import {
  Users, UserPlus, Calendar, Bell, CreditCard, ClipboardList, Eye, Pencil,
  Trash2, Search, CheckCircle2, AlertTriangle, Clock, ArrowLeft, ArrowRight,
  Printer, Plus, RefreshCw, Activity, FileText, Stethoscope, Phone, Mail,
  MapPin, Loader2, XCircle, ChevronDown, Upload, X, Check, AlertCircle,
  Zap, Heart, Tag, Receipt, Folder, File, FileUp, Replace, RotateCcw,
  Droplets, Pill, Building2, CheckCheck, MinusCircle, UserCircle,
} from 'lucide-react';

export default function FollowUpList() {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => { fetchFollowUps(); }, []);

  const fetchFollowUps = async () => {
    setLoading(true);
    try {
      const res = await getFollowUpsApi();
      setFollowUps(res.data.sort((a, b) => new Date(a.nextVisitDate) - new Date(b.nextVisitDate)));
    } catch { toast.error('Failed to load follow-ups'); }
    finally { setLoading(false); }
  };

  const handleMarkDone = async (visit) => {
    if (!window.confirm(`Mark follow-up for "${visit.patientName}" as Done?`)) return;
    try {
      await updateVisitApi(visit.id, { ...visit, nextVisitDate: null, followUpNotes: 'Follow-up completed' });
      toast.success(`Done for ${visit.patientName}!`);
      fetchFollowUps();
    } catch { toast.error('Failed to update.'); }
  };

  const today = new Date(); today.setHours(0, 0, 0, 0);

  const getStatus = (dateStr) => {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    if (d < today) return 'overdue';
    if (d.getTime() === today.getTime()) return 'today';
    return 'upcoming';
  };

  const getDaysLabel = (dateStr) => {
    const d = new Date(dateStr); d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
    if (diff === 0) return { label: 'Today',                     color: '#dc2626', bg: '#fef2f2', border:'#fca5a5' };
    if (diff < 0)  return { label: `${Math.abs(diff)}d overdue`, color: '#dc2626', bg: '#fef2f2', border:'#fca5a5' };
    if (diff === 1) return { label: 'Tomorrow',                  color: '#015D67', bg: '#87E4DB', border:'#00ACB1' };
    return              { label: `In ${diff} days`,              color: '#015D67', bg: '#f0fefe', border:'#87E4DB' };
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const filteredFollowUps = followUps.filter(v => {
    const status = getStatus(v.nextVisitDate);
    const matchSearch = v.patientName?.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === 'all') return true;
    return status === filter;
  });

  const counts = {
    all:      followUps.length,
    today:    followUps.filter(v => getStatus(v.nextVisitDate) === 'today').length,
    overdue:  followUps.filter(v => getStatus(v.nextVisitDate) === 'overdue').length,
    upcoming: followUps.filter(v => getStatus(v.nextVisitDate) === 'upcoming').length,
  };

  const pad = isMobile ? '0 10px 24px' : '0 28px 32px';

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f6fa', fontFamily: "'Segoe UI',sans-serif", boxSizing: 'border-box' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin   { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .row-hover:hover  { background:#f0fefe!important; }
        .view-btn:hover   { background:#015D67!important; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:5px; }
        ::-webkit-scrollbar-thumb{ background:#00ACB1; border-radius:4px; }
        input::placeholder{ color:#9ca3af; }
      `}</style>

      <Sidebar activePath="/followups" />

      <div style={{ marginLeft: isMobile ? 0 : 240, flex: 1, minHeight: '100vh' }}>

        {/* TOP BAR */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: isMobile ? '12px 12px' : '22px 28px', background: '#fff', borderBottom: '1px solid #e5e7eb', marginBottom: 16, flexWrap: 'wrap', gap: 10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ paddingLeft: isMobile ? 58 : 0 }}>
            <div style={{ color: '#111', fontSize: isMobile ? 15 : 20, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bell size={isMobile ? 26 : 22} color="#00ACB1" />
              Follow-up Reminders
            </div>
            <div style={{ color: '#6b7280', fontSize: 12, marginTop: 3 }}>Patients scheduled for follow-up visits</div>
          </div>
          <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={13} color="#9ca3af" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ padding: '8px 8px 8px 30px', background: '#fff', border: '1.5px solid #e5e7eb', borderRadius: 9, color: '#111', fontSize: 12, outline: 'none', width: isMobile ? 130 : 170 }} />
            </div>
            <button onClick={() => fetchFollowUps()}
              style={{ padding: '8px 14px', background: '#f0fefe', border: '1px solid #87E4DB', color: '#00ACB1', borderRadius: 9, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        <div style={{ padding: pad }}>

          {/* SUMMARY CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 8 : 10, marginBottom: 14 }}>
            {[
              { key: 'all',      Icon: ClipboardList, label: 'Total',     textColor: '#fff',    grad: 'linear-gradient(135deg,#015D67,#00ACB1)', glow: 'rgba(0,172,177,0.35)',    border:'#87E4DB' },
              { key: 'today',    Icon: Calendar,      label: 'Due Today', textColor: '#015D67', grad: 'linear-gradient(135deg,#87E4DB,#00ACB1)', glow: 'rgba(0,172,177,0.28)',    border:'#00ACB1' },
              { key: 'overdue',  Icon: AlertTriangle, label: 'Overdue',   textColor: '#015D67', grad: 'linear-gradient(135deg,#CAF0C1,#87E4DB)', glow: 'rgba(135,228,219,0.38)',  border:'#87E4DB' },
              { key: 'upcoming', Icon: Clock,         label: 'Upcoming',  textColor: '#fff',    grad: 'linear-gradient(135deg,#00ACB1,#015D67)', glow: 'rgba(1,93,103,0.32)',     border:'#015D67' },
            ].map((c, i) => (
              <div key={c.key} onClick={() => setFilter(c.key)}
                style={{ background: c.grad, borderRadius: 12, padding: isMobile ? '11px' : '12px 15px', transition: 'all 0.2s ease', cursor: 'pointer', animation: `fadeUp 0.4s ease ${i * 0.07}s both`, border: filter === c.key ? `2px solid ${c.border}` : '1px solid transparent', boxShadow: filter === c.key ? `0 6px 20px ${c.glow}` : '0 2px 8px rgba(0,0,0,0.1)', transform: filter === c.key ? 'translateY(-3px)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <c.Icon size={isMobile ? 18 : 20} color={c.textColor} style={{ opacity:0.9 }} />
                <div>
                  <div style={{ fontSize: isMobile ? 20 : 26, fontWeight: 900, color: c.textColor, lineHeight: 1 }}>{counts[c.key]}</div>
                  <div style={{ color: c.textColor, fontSize: isMobile ? 10 : 11, fontWeight: 600, marginTop: 2, opacity:0.8 }}>{c.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* FILTER TABS */}
          <div style={{ display: 'flex', gap: 7, marginBottom: 14, flexWrap: 'wrap' }}>
            {[
              { key: 'all',      label: `All (${counts.all})`           },
              { key: 'today',    label: `Today (${counts.today})`       },
              { key: 'overdue',  label: `Overdue (${counts.overdue})`   },
              { key: 'upcoming', label: `Upcoming (${counts.upcoming})` },
            ].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                style={{ padding: isMobile ? '6px 13px' : '7px 16px', background: filter === f.key ? '#f0fefe' : '#fff', border: filter === f.key ? '1.5px solid #00ACB1' : '1px solid #e5e7eb', borderRadius: 20, color: filter === f.key ? '#00ACB1' : '#6b7280', cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 600, transition: 'all 0.2s' }}>
                {f.label}
              </button>
            ))}
          </div>

          {/* LIST */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 16, overflow: 'hidden', boxShadow:'0 2px 10px rgba(0,0,0,0.04)' }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '56px 0', color: '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Loader2 size={32} color="#00ACB1" style={{ animation: 'spin 1s linear infinite' }} />
                <div style={{ fontSize:13 }}>Loading follow-ups...</div>
              </div>
            ) : filteredFollowUps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '56px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
                  <CheckCheck size={48} color="#015D67" />
                </div>
                <div style={{ color: '#111', fontSize: 16, fontWeight: 700, marginBottom: 7 }}>
                  {filter === 'overdue' ? 'No overdue follow-ups!' : filter === 'today' ? 'No follow-ups today!' : 'No follow-ups found!'}
                </div>
                <div style={{ color: '#9ca3af', fontSize: 13 }}>
                  {filter === 'overdue' ? "You're all caught up" : 'Check back later'}
                </div>
              </div>
            ) : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {filteredFollowUps.map((v, i) => {
                  const statusInfo = getStatus(v.nextVisitDate);
                  const dayInfo = getDaysLabel(v.nextVisitDate);
                  return (
                    <div key={v.id} className="row-hover"
                      style={{ padding: '13px 14px', borderBottom: '1px solid #f3f4f6', borderLeft: `3px solid ${statusInfo === 'overdue' ? '#87E4DB' : statusInfo === 'today' ? '#00ACB1' : '#015D67'}`, transition: 'all 0.15s', animation: `fadeUp 0.4s ease ${i * 0.04}s both` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 7 }}>
                        <div>
                          <div style={{ fontWeight: 700, color: '#111', fontSize: 13 }}>{v.patientName}</div>
                          <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>Visit: {formatDate(v.visitDate)}</div>
                        </div>
                        <span style={{ background: dayInfo.bg, color: dayInfo.color, border: `1px solid ${dayInfo.border}`, padding: '3px 9px', borderRadius: 20, fontSize: 11, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>{dayInfo.label}</span>
                      </div>
                      <div style={{ color: '#374151', fontSize: 12, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Calendar size={12} color="#6b7280" /> {formatDate(v.nextVisitDate)}
                      </div>
                      {v.diagnosis && (
                        <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Stethoscope size={11} /> {v.diagnosis}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 7, marginTop: 7 }}>
                        <button className="view-btn" onClick={() => navigate(`/patients/${v.patientId}`)}
                          style={{ background: 'linear-gradient(135deg,#00ACB1,#015D67)', color: '#fff', border: 'none', padding: '6px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, flex: 1, transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => handleMarkDone(v)}
                          style={{ background: 'linear-gradient(135deg,#CAF0C1,#87E4DB)', color: '#015D67', border: '1.5px solid #87E4DB', padding: '6px 13px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                          <CheckCircle2 size={12} /> Done
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '46px 1.5fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr', gap: 8, padding: '12px 18px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                  {['#', 'Patient Name', 'Follow-up Date', 'Status', 'Diagnosis', 'Notes', 'Action'].map(h => (
                    <div key={h} style={{ color: '#6b7280', fontSize: 10, fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>
                {filteredFollowUps.map((v, i) => {
                  const statusInfo = getStatus(v.nextVisitDate);
                  const dayInfo = getDaysLabel(v.nextVisitDate);
                  return (
                    <div key={v.id} className="row-hover"
                      style={{ display: 'grid', gridTemplateColumns: '46px 1.5fr 1.2fr 1fr 1.2fr 1.2fr 1.5fr', gap: 8, padding: '14px 18px', borderBottom: '1px solid #f3f4f6', alignItems: 'center', transition: 'all 0.15s', cursor: 'pointer', animation: `fadeUp 0.4s ease ${i * 0.04}s both`, borderLeft: `3px solid ${statusInfo === 'overdue' ? '#87E4DB' : statusInfo === 'today' ? '#00ACB1' : '#015D67'}` }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#f0fefe', color: '#00ACB1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, border:'1px solid #87E4DB' }}>{i + 1}</div>
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, color: '#111', fontSize: 13 }}>{v.patientName}</div>
                        <div style={{ color: '#9ca3af', fontSize: 11, marginTop: 2 }}>Visit: {formatDate(v.visitDate)}</div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#374151', fontWeight: 600, fontSize: 13 }}>
                        <Calendar size={13} color="#6b7280" /> {formatDate(v.nextVisitDate)}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ background: dayInfo.bg, color: dayInfo.color, border: `1px solid ${dayInfo.border}`, padding: '3px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>{dayInfo.label}</span>
                      </div>
                      <div style={{ color: '#374151', fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.diagnosis || '—'}</div>
                      <div style={{ color: '#6b7280', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v.followUpNotes || '—'}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                        <button className="view-btn" onClick={() => navigate(`/patients/${v.patientId}`)}
                          style={{ background: 'linear-gradient(135deg,#00ACB1,#015D67)', color: '#fff', border: 'none', padding: '6px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.2s', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Eye size={12} /> View
                        </button>
                        <button onClick={() => handleMarkDone(v)}
                          style={{ background: 'linear-gradient(135deg,#CAF0C1,#87E4DB)', color: '#015D67', border: '1.5px solid #87E4DB', padding: '6px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <CheckCircle2 size={12} /> Done
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}