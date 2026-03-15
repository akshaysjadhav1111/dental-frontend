import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getPatientsApi } from '../services/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import Sidebar, { useMobile } from '../components/Sidebar';
import {
  CalendarDays,
  Phone,
  User,
  Stethoscope,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  UserSearch,
  UserPlus,
  Save,
  X,
} from 'lucide-react';

const API_BASE = 'https://dental-backend-production-23c5.up.railway.app/api';
const apicall = (token) => axios.create({
  baseURL: API_BASE,
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
});

export default function TodayAppointments() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const isMobile = useMobile();
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editAppt, setEditAppt] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => { fetchAll(); }, [selectedDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [aRes, pRes] = await Promise.all([
        apicall(token).get(`/appointments/date/${selectedDate}`),
        getPatientsApi(),
      ]);
      setAppointments(aRes.data);
      setPatients(pRes.data);
    } catch { toast.error('Failed to load appointments'); }
    finally { setLoading(false); }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await apicall(token).patch(`/appointments/${id}/status`, { status });
      toast.success(`Marked as ${status}!`);
      fetchAll();
    } catch { toast.error('Failed to update status'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this appointment?')) return;
    try {
      await apicall(token).delete(`/appointments/${id}`);
      toast.success('Appointment deleted');
      fetchAll();
    } catch { toast.error('Failed to delete'); }
  };

  const handleSave = async (data) => {
    try {
      if (editAppt) {
        await apicall(token).put(`/appointments/${editAppt.id}`, data);
        toast.success('Appointment updated!');
      } else {
        await apicall(token).post('/appointments', data);
        toast.success('Appointment booked!');
      }
      setShowModal(false);
      setEditAppt(null);
      fetchAll();
    } catch { toast.error('Failed to save appointment'); }
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const isToday = selectedDate === todayStr;

  const counts = {
    scheduled: appointments.filter(a => a.status === 'scheduled').length,
    completed: appointments.filter(a => a.status === 'completed').length,
    cancelled: appointments.filter(a => a.status === 'cancelled').length,
  };

  const pad = isMobile ? '0 10px 28px' : '0 28px 40px';

  const statusIcon = (status) => {
    if (status === 'completed') return <CheckCircle size={12} strokeWidth={2.5} />;
    if (status === 'cancelled') return <XCircle size={12} strokeWidth={2.5} />;
    return <Clock size={12} strokeWidth={2.5} />;
  };

  const statusLabel = (status) => {
    if (status === 'completed') return 'Completed';
    if (status === 'cancelled') return 'Cancelled';
    return 'Scheduled';
  };

  return (
    <div style={{ display:'flex', minHeight:'100vh', fontFamily:"'Segoe UI',sans-serif", background:'#f5f6fa', boxSizing:'border-box' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        .appt-card:hover  { border-color:#87E4DB!important; transform:translateY(-1px); box-shadow:0 4px 16px rgba(0,0,0,0.08)!important; }
        .status-btn:hover { opacity:0.85!important; }
        *{ box-sizing:border-box; }
        ::-webkit-scrollbar{ width:5px; }
        ::-webkit-scrollbar-thumb{ background:#00ACB1; border-radius:4px; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor:pointer; }
      `}</style>

      <Sidebar activePath="/appointments" />

      <div style={{ marginLeft: isMobile ? 0 : 240, flex:1, minHeight:'100vh' }}>

        {/* TOP BAR */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding: isMobile ? '12px 12px 12px 12px' : '20px 28px', background:'#fff', borderBottom:'1px solid #e5e7eb', marginBottom:16, flexWrap:'wrap', gap:10, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, paddingLeft: isMobile ? 58 : 0 }}>
            <CalendarDays size={22} color="#00ACB1" />
            <div>
              <div style={{ color:'#111', fontSize: isMobile ? 15 : 20, fontWeight:800 }}>Appointments</div>
              <div style={{ color:'#6b7280', fontSize:12, marginTop:3 }}>
                {isToday ? "Today's appointments" : `${new Date(selectedDate).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' })}`}
              </div>
            </div>
          </div>
          <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', width: isMobile ? '100%' : undefined }}>
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              style={{ padding:'8px 11px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:9, color:'#111', fontSize:12, outline:'none', cursor:'pointer', flex: isMobile ? 1 : undefined }}/>
            <button onClick={() => setSelectedDate(todayStr)} style={{ padding:'8px 13px', background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', borderRadius:9, cursor:'pointer', fontSize:12, fontWeight:600 }}>Today</button>
            <button onClick={() => { setEditAppt(null); setShowModal(true); }} style={{ background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, padding: isMobile ? '8px 14px' : '10px 18px', cursor:'pointer', fontSize: isMobile ? 12 : 13, fontWeight:700, boxShadow:'0 3px 10px rgba(13,148,136,0.3)', display:'flex', alignItems:'center', gap:6, whiteSpace:'nowrap' }}>
              <Plus size={14} /> {isMobile ? 'Book' : 'Book Appointment'}
            </button>
          </div>
        </div>

        <div style={{ padding: pad }}>

          {/* STAT PILLS */}
          <div style={{ display:'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4,auto)', gap: isMobile ? 8 : 9, marginBottom:16, animation:'fadeUp 0.3s ease' }}>
            {[
              { label:'Total',     value: appointments.length, color:'#015D67', bg:'#f0fefe',  border:'#87E4DB',  Icon: CalendarDays },
              { label:'Scheduled', value: counts.scheduled,    color:'#b45309', bg:'#fffbeb',  border:'#fde68a',  Icon: Clock        },
              { label:'Completed', value: counts.completed,    color:'#015D67', bg:'#CAF0C1',  border:'#87E4DB',  Icon: CheckCircle  },
              { label:'Cancelled', value: counts.cancelled,    color:'#dc2626', bg:'#fef2f2',  border:'#fecaca',  Icon: XCircle      },
            ].map(st => (
              <div key={st.label} style={{ background:st.bg, border:`1.5px solid ${st.border}`, borderLeft:`4px solid ${st.color}`, borderRadius:11, padding: isMobile ? '9px 12px' : '11px 18px', display:'flex', gap:7, alignItems:'center', boxShadow:'0 2px 6px rgba(0,0,0,0.05)' }}>
                <st.Icon size={14} color={st.color} />
                <span style={{ color:st.color, fontWeight:900, fontSize: isMobile ? 17 : 22 }}>{st.value}</span>
                <span style={{ color:'#374151', fontSize: isMobile ? 11 : 12, fontWeight:500 }}>{st.label}</span>
              </div>
            ))}
          </div>

          {/* APPOINTMENTS */}
          {loading ? (
            <div style={{ textAlign:'center', padding:'56px 20px', color:'#6b7280', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', gap:9 }}>
              <Loader2 size={18} color="#00ACB1" style={{ animation:'spin 1s linear infinite' }} />
              Loading appointments...
            </div>
          ) : appointments.length === 0 ? (
            <div style={{ textAlign:'center', padding:'56px 20px', background:'#fff', borderRadius:16, border:'1px dashed #e5e7eb', boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
              <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
                <CalendarDays size={44} color="#d1d5db" />
              </div>
              <div style={{ color:'#111', fontSize:16, fontWeight:700, marginBottom:7 }}>No appointments {isToday ? 'today' : 'on this date'}</div>
              <div style={{ color:'#9ca3af', marginBottom:18, fontSize:13 }}>Book an appointment to get started</div>
              <button onClick={() => { setEditAppt(null); setShowModal(true); }} style={{ background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, padding:'10px 22px', cursor:'pointer', fontSize:13, fontWeight:700, display:'inline-flex', alignItems:'center', gap:7 }}>
                <Plus size={14} /> Book Appointment
              </button>
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {appointments.map((appt, idx) => (
                <div key={appt.id} className="appt-card"
                  style={{ background:'#fff', border:'1px solid #e5e7eb', borderLeft:`4px solid ${appt.status==='completed' ? '#015D67' : appt.status==='cancelled' ? '#dc2626' : '#f59e0b'}`, borderRadius:14, padding: isMobile ? '12px' : '18px 22px', display:'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent:'space-between', alignItems: isMobile ? 'flex-start' : 'flex-start', gap: isMobile ? 10 : 18, transition:'all 0.18s', animation:`fadeUp 0.3s ease ${idx*0.05}s both`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>

                  <div style={{ display:'flex', gap:14, alignItems:'flex-start', flex:1, width:'100%' }}>
                    {/* Time box */}
                    <div style={{ background:'#fffbeb', border:'1px solid #fde68a', borderRadius:8, padding: isMobile ? '5px 8px' : '6px 10px', textAlign:'center', minWidth: isMobile ? 48 : 56, flexShrink:0 }}>
                      <div style={{ color:'#b45309', fontWeight:800, fontSize: isMobile ? 13 : 15 }}>{appt.appointmentTime}</div>
                      <div style={{ color:'#9ca3af', fontSize:8, marginTop:1 }}>TIME</div>
                    </div>
                    {/* Info */}
                    <div style={{ flex:1 }}>
                      <div style={{ color:'#111', fontWeight:700, fontSize: isMobile ? 13 : 15 }}>{appt.patientName}</div>
                      <div style={{ color:'#6b7280', fontSize:12, marginTop:2, display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
                        <Phone size={11} color="#9ca3af" /> {appt.patientContact}
                        {appt.patientAge && (
                          <span style={{ display:'flex', alignItems:'center', gap:4, marginLeft:5 }}>
                            <User size={11} color="#9ca3af" /> {appt.patientAge} yrs
                          </span>
                        )}
                      </div>
                      {appt.reason && (
                        <div style={{ color:'#374151', fontSize:12, marginTop:5, display:'flex', alignItems:'center', gap:5 }}>
                          <Stethoscope size={12} color="#9ca3af" /> {appt.reason}
                        </div>
                      )}
                      {appt.notes && (
                        <div style={{ color:'#9ca3af', fontSize:11, marginTop:3, fontStyle:'italic', display:'flex', alignItems:'center', gap:5 }}>
                          <FileText size={11} color="#d1d5db" /> {appt.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: status + actions */}
                  <div style={{ display:'flex', flexDirection: isMobile ? 'row' : 'column', alignItems: isMobile ? 'center' : 'flex-end', gap:7, flexWrap:'wrap', width: isMobile ? '100%' : undefined }}>
                    <span style={{ padding:'4px 12px', borderRadius:20, fontSize:11, fontWeight:700, display:'inline-flex', alignItems:'center', gap:4, background: appt.status==='completed' ? '#f0fffe' : appt.status==='cancelled' ? '#fef2f2' : '#fffbeb', color: appt.status==='completed' ? '#015D67' : appt.status==='cancelled' ? '#dc2626' : '#b45309', border:`1px solid ${appt.status==='completed' ? '#CAF0C1' : appt.status==='cancelled' ? '#fecaca' : '#fde68a'}` }}>
                      {statusIcon(appt.status)} {statusLabel(appt.status)}
                    </span>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {appt.status === 'scheduled' && (
                        <>
                          <button className="status-btn" onClick={() => handleStatusChange(appt.id,'completed')} style={{ background:'#f0fffe', color:'#015D67', border:'1px solid #CAF0C1', borderRadius:7, padding:'5px 11px', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all 0.15s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                            <CheckCircle size={12} /> Done
                          </button>
                          <button className="status-btn" onClick={() => handleStatusChange(appt.id,'cancelled')} style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, padding:'5px 11px', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all 0.15s', whiteSpace:'nowrap', display:'flex', alignItems:'center', gap:4 }}>
                            <XCircle size={12} /> Cancel
                          </button>
                        </>
                      )}
                      {appt.patientId && (
                        <button className="status-btn" onClick={() => navigate(`/patients/${appt.patientId}`)} style={{ background:'#f0fefe', color:'#00ACB1', border:'1px solid #87E4DB', borderRadius:7, padding:'5px 11px', cursor:'pointer', fontSize:11, fontWeight:600, transition:'all 0.15s', display:'flex', alignItems:'center', gap:4 }}>
                          <Eye size={12} />
                        </button>
                      )}
                      <button className="status-btn" onClick={() => { setEditAppt(appt); setShowModal(true); }} style={{ background:'#f9fafb', color:'#374151', border:'1px solid #e5e7eb', borderRadius:7, padding:'5px 9px', cursor:'pointer', fontSize:11, transition:'all 0.15s', display:'flex', alignItems:'center', gap:4 }}>
                        <Pencil size={12} />
                      </button>
                      <button className="status-btn" onClick={() => handleDelete(appt.id)} style={{ background:'#fef2f2', color:'#dc2626', border:'1px solid #fecaca', borderRadius:7, padding:'5px 9px', cursor:'pointer', fontSize:11, transition:'all 0.15s', display:'flex', alignItems:'center', gap:4 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <AppointmentModal
          appt={editAppt}
          patients={patients}
          selectedDate={selectedDate}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditAppt(null); }}
        />
      )}
    </div>
  );
}

function AppointmentModal({ appt, patients, selectedDate, onSave, onClose }) {
  const [form, setForm] = useState({
    patientId: appt?.patientId || '', patientName: appt?.patientName || '',
    patientContact: appt?.patientContact || '', patientAge: appt?.patientAge || '',
    appointmentDate: appt?.appointmentDate || selectedDate,
    appointmentTime: appt?.appointmentTime || '', reason: appt?.reason || '',
    notes: appt?.notes || '', status: appt?.status || 'scheduled',
  });
  const [loading, setLoading] = useState(false);
  const [useExisting, setUseExisting] = useState(!!appt?.patientId);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handlePatientSelect = (e) => {
    const pid = e.target.value;
    if (!pid) { setForm({ ...form, patientId:'', patientName:'', patientContact:'', patientAge:'' }); return; }
    const p = patients.find(x => x.id === pid);
    if (p) setForm({ ...form, patientId:p.id, patientName:p.name, patientContact:p.contactNumber, patientAge:String(p.age) });
  };

  const handleSubmit = async () => {
    if (!form.patientName) { toast.error('Patient name is required'); return; }
    if (!form.appointmentTime) { toast.error('Please enter appointment time'); return; }
    if (!form.appointmentDate) { toast.error('Please select a date'); return; }
    setLoading(true);
    await onSave(form);
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', backdropFilter:'blur(6px)', zIndex:1000, display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'16px' }}>
      <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:20, width:'100%', maxWidth:580, boxShadow:'0 24px 60px rgba(0,0,0,0.15)', marginTop:16 }}>
        <style>{`
          .minp:focus { border-color:#00ACB1!important; box-shadow:0 0 0 3px rgba(13,148,136,0.1)!important; outline:none; }
          .minp::placeholder { color:#9ca3af; }
          .minp option { background:#fff; color:#111; }
        `}</style>

        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'18px 22px', borderBottom:'1px solid #e5e7eb' }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            {appt ? <Pencil size={16} color="#00ACB1" /> : <CalendarDays size={16} color="#00ACB1" />}
            <div style={{ color:'#111', fontWeight:800, fontSize:16 }}>{appt ? 'Edit Appointment' : 'Book Appointment'}</div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'#9ca3af', cursor:'pointer', display:'flex', alignItems:'center' }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ padding:'18px 22px', maxHeight:'72vh', overflowY:'auto' }}>
          {/* Toggle */}
          <div style={{ display:'flex', gap:9, marginBottom:16 }}>
            {[
              { val:true,  label:'Existing Patient', Icon: UserSearch },
              { val:false, label:'New / Walk-in',    Icon: UserPlus  },
            ].map(t => (
              <button key={String(t.val)} onClick={() => setUseExisting(t.val)}
                style={{ flex:1, padding:'9px 13px', background: useExisting===t.val ? '#f0fefe' : '#fafafa', border: useExisting===t.val ? '1.5px solid #00ACB1' : '1px solid #e5e7eb', borderRadius:9, color: useExisting===t.val ? '#00ACB1' : '#6b7280', cursor:'pointer', fontSize:12, fontWeight:600, display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
                <t.Icon size={14} /> {t.label}
              </button>
            ))}
          </div>

          {useExisting && (
            <div style={{ marginBottom:13 }}>
              <label style={lbl}>SELECT PATIENT</label>
              <select className="minp" value={form.patientId} onChange={handlePatientSelect} style={minp}>
                <option value="">-- Select a patient --</option>
                {patients.map(p => <option key={p.id} value={p.id}>{p.name} — {p.contactNumber}</option>)}
              </select>
            </div>
          )}

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:11 }}>
            <div><label style={lbl}>PATIENT NAME *</label><input className="minp" name="patientName" value={form.patientName} onChange={handleChange} placeholder="Full name" style={minp} readOnly={useExisting && !!form.patientId}/></div>
            <div><label style={lbl}>CONTACT</label><input className="minp" name="patientContact" value={form.patientContact} onChange={handleChange} placeholder="Phone number" style={minp} readOnly={useExisting && !!form.patientId}/></div>
            <div><label style={lbl}>AGE</label><input className="minp" name="patientAge" value={form.patientAge} onChange={handleChange} placeholder="Age" style={minp}/></div>
            <div>
              <label style={lbl}>STATUS</label>
              <select className="minp" name="status" value={form.status} onChange={handleChange} style={minp}>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(190px,1fr))', gap:11, marginTop:13 }}>
            <div><label style={lbl}>DATE *</label><input className="minp" type="date" name="appointmentDate" value={form.appointmentDate} onChange={handleChange} style={minp}/></div>
            <div><label style={lbl}>TIME * (e.g. 10:30 AM)</label><input className="minp" name="appointmentTime" value={form.appointmentTime} onChange={handleChange} placeholder="e.g. 10:30 AM" style={minp}/></div>
          </div>

          <div style={{ marginTop:13 }}>
            <label style={lbl}>REASON FOR VISIT</label>
            <input className="minp" name="reason" value={form.reason} onChange={handleChange} placeholder="e.g. Tooth pain, Checkup..." style={{ ...minp, marginBottom:11 }}/>
            <label style={lbl}>NOTES (optional)</label>
            <textarea className="minp" name="notes" value={form.notes} onChange={handleChange} placeholder="Any extra notes..." rows={2} style={{ ...minp, resize:'vertical' }}/>
          </div>
        </div>

        <div style={{ display:'flex', justifyContent:'flex-end', gap:9, padding:'14px 22px', borderTop:'1px solid #e5e7eb', flexWrap:'wrap' }}>
          <button onClick={onClose} style={{ padding:'11px 22px', background:'#f9fafb', color:'#6b7280', border:'1px solid #e5e7eb', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', display:'flex', alignItems:'center', gap:7 }}>
            <X size={14} /> Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading} style={{ padding:'11px 26px', background:'linear-gradient(135deg,#00ACB1,#015D67)', color:'#fff', border:'none', borderRadius:10, fontSize:14, fontWeight:700, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center', gap:7, boxShadow:'0 3px 10px rgba(13,148,136,0.3)' }}>
            {loading
              ? <><Loader2 size={14} style={{ animation:'spin 1s linear infinite' }} /> Saving...</>
              : <><Save size={14} /> Save Appointment</>
            }
          </button>
        </div>
      </div>
    </div>
  );
}

const lbl = { display:'block', color:'#374151', fontSize:10, fontWeight:700, letterSpacing:'1px', textTransform:'uppercase', marginBottom:5 };
const minp = { width:'100%', padding:'11px 13px', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:9, color:'#111', fontSize:13, outline:'none', transition:'all 0.2s', fontFamily:"'Segoe UI',sans-serif", boxSizing:'border-box' };
