import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Calendar, CreditCard, Bell, UserPlus, ClipboardList, UserCircle, LogOut, Menu, X } from 'lucide-react';

export function useMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return isMobile;
}

export default function Sidebar({ activePath }) {
  const navigate = useNavigate();
  const { doctor, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const isMobile = useMobile();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard',      path: '/' },
    { icon: ClipboardList,   label: 'All Patients',   path: '/patients' },
    { icon: CreditCard,      label: 'Payment Status', path: '/payment-status' },
    { icon: Bell,            label: 'Follow-ups',     path: '/followups' },
    { icon: Calendar,        label: 'Appointments',   path: '/appointments' },
    { icon: UserPlus,        label: 'Add Patient',    path: '/add-patient' },
  ];

  const go = (path) => { navigate(path); setOpen(false); };

  return (
    <>
      <style>{`
        .sb-item:hover { background:rgba(13,148,136,0.2)!important; color:#5eead4!important; padding-left:22px!important; }
        .sb-logout:hover { background:rgba(239,68,68,0.12)!important; color:#fca5a5!important; }
        .hamburger-btn:active { transform:scale(0.92); }
      `}</style>

      {/* Hamburger button — only on mobile */}
      {isMobile && (
        <button
          onClick={() => setOpen(o => !o)}
          className="hamburger-btn"
          style={{
            position: 'fixed', top: 12, left: 12, zIndex: 500,
            background: 'linear-gradient(135deg,#0d9488,#0f766e)',
            border: 'none', borderRadius: 10, width: 40, height: 40,
            cursor: 'pointer', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#fff',
            boxShadow: '0 4px 16px rgba(13,148,136,0.45)',
            transition: 'transform 0.15s',
          }}
          aria-label="Toggle menu"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      )}

      {/* Overlay */}
      {isMobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
            zIndex: 350, backdropFilter: 'blur(3px)',
          }}
        />
      )}

      {/* Sidebar Panel */}
      <div style={{
        width: 240,
        background: 'linear-gradient(180deg,#0a1628 0%,#0d2d2a 100%)',
        display: 'flex', flexDirection: 'column',
        position: 'fixed', top: 0, left: 0, height: '100vh',
        zIndex: 400,
        boxShadow: '4px 0 32px rgba(0,0,0,0.3)',
        transform: isMobile ? (open ? 'translateX(0)' : 'translateX(-260px)') : 'translateX(0)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding: isMobile ? '12px 12px 12px 58px' : '24px 20px 20px' }}>
          <div style={{ fontSize:20, background:'rgba(13,148,136,0.25)', borderRadius:10, width:34, height:34, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>🦷</div>
          <div>
            <div style={{ color:'#fff', fontWeight:800, fontSize:12 }}>Sharnya Smile Care</div>
            <div style={{ color:'#5eead4', fontSize:10, marginTop:1 }}>Dental Management</div>
          </div>
        </div>

        <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 16px 8px' }}/>

        {/* Nav */}
        <nav style={{ padding:'0 10px', flex:1 }}>
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
              <div
                key={item.path}
                className="sb-item"
                onClick={() => go(item.path)}
                style={{
                  display:'flex', alignItems:'center', gap:12,
                  padding:'11px 16px', borderRadius:12, marginBottom:4,
                  color: isActive ? '#5eead4' : 'rgba(255,255,255,0.6)',
                  background: isActive ? 'rgba(13,148,136,0.25)' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  cursor:'pointer', fontSize:14, position:'relative', transition:'all 0.2s',
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                <span style={{ flex:1 }}>{item.label}</span>
                {isActive && (
                  <div style={{ width:6, height:6, borderRadius:'50%', background:'#0d9488', flexShrink:0 }}/>
                )}
              </div>
            );
          })}
        </nav>

        <div style={{ height:1, background:'rgba(255,255,255,0.07)', margin:'0 16px 8px' }}/>

        {/* Doctor Card */}
        <div style={{ display:'flex', alignItems:'center', gap:10, margin:'4px 12px', background:'rgba(255,255,255,0.05)', borderRadius:12, padding:'12px 14px' }}>
          <div style={{ background:'rgba(13,148,136,0.25)', borderRadius:'50%', width:38, height:38, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <UserCircle size={22} color="#5eead4" />
          </div>
          <div>
            <div style={{ color:'#fff', fontSize:12, fontWeight:700 }}>{doctor?.doctorName}</div>
            <div style={{ color:'#5eead4', fontSize:11 }}>Dental Surgeon</div>
          </div>
        </div>

        {/* Logout */}
        <div
          className="sb-logout"
          onClick={() => { logout(); navigate('/login'); }}
          style={{ display:'flex', alignItems:'center', gap:10, padding:'14px 24px', color:'rgba(255,255,255,0.45)', cursor:'pointer', fontSize:13, borderRadius:12, margin:'4px 10px 16px', transition:'all 0.2s' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </div>
      </div>
    </>
  );
}