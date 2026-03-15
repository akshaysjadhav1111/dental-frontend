import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginApi } from '../services/api';
import toast from 'react-hot-toast';
import { User, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginApi({ username, password });
      login(res.data.token, {
        doctorName: res.data.doctorName,
        clinicName: res.data.clinicName,
        username: res.data.username,
      });
      toast.success('Welcome, ' + res.data.doctorName + '!');
      navigate('/');
    } catch (err) {
      toast.error('Invalid username or password!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      backgroundImage: "url('/dental-bg.jpg')",
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', sans-serif",
      padding: '20px',
      boxSizing: 'border-box',
    }}>

      {/* Dark overlay */}
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,30,40,0.45)',
        zIndex: 0,
      }} />

      {/* Glass Card */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderRadius: 28,
        padding: 'clamp(28px, 5vw, 52px) clamp(24px, 5vw, 48px)',
        width: '100%',
        maxWidth: 460,
        boxShadow: '0 32px 80px rgba(0,0,0,0.35)',
        boxSizing: 'border-box',
      }}>

        {/* Tooth Icon */}
        <div style={{ textAlign: 'center', marginBottom: 6 }}>
          <span style={{ fontSize: 56 }}>🦷</span>
        </div>

        {/* Clinic Name */}
        <h1 style={{
          textAlign: 'center',
          color: '#ffffff',
          fontSize: 'clamp(22px, 4vw, 30px)',
          fontWeight: 800,
          margin: '8px 0 4px',
          letterSpacing: '0.3px',
        }}>
          Sharnya Smile Care
        </h1>

        {/* Subtitle */}
        <p style={{
          textAlign: 'center',
          color: '#d4a843',
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          margin: '0 0 6px',
        }}>
          Dental Management Portal
        </p>

        {/* Gold divider */}
        <div style={{
          width: 50,
          height: 2,
          background: 'linear-gradient(90deg, #d4a843, #f0c96b)',
          margin: '0 auto 24px',
          borderRadius: 2,
        }} />

        {/* Welcome */}
        <h2 style={{
          textAlign: 'center',
          color: '#ffffff',
          fontSize: 'clamp(18px, 3vw, 22px)',
          fontWeight: 700,
          margin: '0 0 6px',
        }}>
          Welcome back, Doctor
        </h2>
        <p style={{
          textAlign: 'center',
          color: 'rgba(255,255,255,0.6)',
          fontSize: 14,
          margin: '0 0 28px',
        }}>
          Sign in to access your dashboard
        </p>

        {/* Form */}
        <form onSubmit={handleLogin}>

          {/* Username */}
          <label style={labelStyle}>USERNAME</label>
          <div style={inputWrap}>
            <span style={iconStyle}><User size={16} color="rgba(255,255,255,0.5)" /></span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
              style={inputStyle}
              onFocus={e => e.target.style.borderColor = 'rgba(0,200,180,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
          </div>

          {/* Password */}
          <label style={{ ...labelStyle, marginTop: 18 }}>PASSWORD</label>
          <div style={inputWrap}>
            <span style={iconStyle}><Lock size={16} color="rgba(255,255,255,0.5)" /></span>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              style={{ ...inputStyle, paddingRight: 44 }}
              onFocus={e => e.target.style.borderColor = 'rgba(0,200,180,0.6)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
            />
            <span
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 14, cursor: 'pointer', display:'flex', alignItems:'center' }}
            >
              {showPass ? <EyeOff size={16} color="rgba(255,255,255,0.5)" /> : <Eye size={16} color="rgba(255,255,255,0.5)" />}
            </span>
          </div>

          {/* Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              marginTop: 28,
              padding: '15px',
              background: loading
                ? 'rgba(0,180,160,0.5)'
                : 'linear-gradient(135deg, #00b8a0, #009e8a)',
              color: '#fff',
              border: 'none',
              borderRadius: 14,
              fontSize: 17,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              letterSpacing: '0.5px',
              boxShadow: '0 6px 24px rgba(0,180,160,0.4)',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={e => { if (!loading) e.target.style.background = 'linear-gradient(135deg, #00cdb0, #00b89a)'; }}
            onMouseLeave={e => { if (!loading) e.target.style.background = 'linear-gradient(135deg, #00b8a0, #009e8a)'; }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{animation:'spin 1s linear infinite'}}>
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                Signing in...
              </>
            ) : (
              <><LogIn size={18} /> Sign In</>
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:6, marginTop: 28 }}>
          <Lock size={12} color="rgba(255,255,255,0.35)" />
          <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, margin:0 }}>
            Secure &bull; HIPAA Compliant &bull; Encrypted
          </p>
        </div>

      </div>
      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        
        /* Fix browser autofill white background override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px rgba(13, 60, 55, 0.95) inset !important;
          -webkit-text-fill-color: #ffffff !important;
          caret-color: #ffffff;
          border-color: rgba(0,200,180,0.4) !important;
          transition: background-color 99999s ease-in-out 0s;
        }

        /* Placeholder color */
        input::placeholder {
          color: rgba(255,255,255,0.35) !important;
        }

        /* Remove default input appearance */
        input[type="text"],
        input[type="password"] {
          -webkit-appearance: none;
          appearance: none;
        }
      `}</style>
    </div>
  );
}

const labelStyle = {
  display: 'block',
  color: 'rgba(255,255,255,0.7)',
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '2px',
  marginBottom: 8,
};

const inputWrap = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const iconStyle = {
  position: 'absolute',
  left: 14,
  display: 'flex',
  alignItems: 'center',
  pointerEvents: 'none',
};

const inputStyle = {
  width: '100%',
  padding: '14px 14px 14px 42px',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 12,
  color: '#ffffff',
  WebkitTextFillColor: '#ffffff',
  fontSize: 15,
  outline: 'none',
  transition: 'border-color 0.2s',
  boxSizing: 'border-box',
  fontFamily: "'Segoe UI', sans-serif",
};