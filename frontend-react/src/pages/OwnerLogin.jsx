import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function OwnerLogin() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Forgot Password Flow States
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetCodeSent, setResetCodeSent] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/owner/login', {
        email,
        password
      });
      // Store both token and salon info
      localStorage.setItem('owner', JSON.stringify({
        email: email,
        id: response.data.saloon_id,
        token: response.data.access_token
      }));
      navigate('/owner/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        // Store credentials so RegistrationPending can poll
        localStorage.setItem('pendingOwnerCredentials', JSON.stringify({
          email,
          password
        }));
        navigate('/registration-pending');
      } else {
        setError(err.response?.data?.detail || 'Invalid credentials');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email first.');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMsg('Reset code generated! (Dev Note: Check server console for the token since email is bypassed)');
      setResetCodeSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) {
      setError('Please provide token and new password');
      return;
    }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await api.post('/auth/reset-password', { token: resetToken, new_password: newPassword });
      setMsg('Password successfully reset! Please login.');
      setIsForgotPassword(false);
      setResetCodeSent(false);
      setPassword('');
      setResetToken('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid token');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-panel text-center">
        <div style={{ background: 'rgba(88, 166, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <LogIn size={32} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="mb-1">{isForgotPassword ? 'Reset Password' : t('owner_portal')}</h2>
        <p className="text-muted mb-3">
          {isForgotPassword 
              ? (resetCodeSent ? "Enter the reset code and your new password." : "Enter your email to receive a password reset code.") 
              : t('manage_status')}
        </p>

        {error && <div className="mb-3" style={{ color: 'var(--danger)', background: 'rgba(218,54,51,0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}
        {msg && <div className="mb-3" style={{ color: 'var(--success)', background: 'rgba(46, 204, 113, 0.1)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.9rem' }}>{msg}</div>}

        {/* ================= NORMAL LOGIN FORM ================= */}
        {!isForgotPassword && (
            <form onSubmit={handleLogin}>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>{t('email_address')}</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="owner@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <label>{t('password')}</label>
                    <span 
                      style={{ fontSize: '0.85rem', color: 'var(--primary)', cursor: 'pointer' }}
                      onClick={() => { setIsForgotPassword(true); setError(''); setMsg(''); }}
                    >
                        Forgot Password?
                    </span>
                </div>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <button type="submit" className="btn w-full mt-4" disabled={loading}>
                {loading ? <div className="loader"></div> : t('sign_in')}
              </button>
            </form>
        )}


        {/* ================= FORGOT PASSWORD 1: SEND CODE ================= */}
        {isForgotPassword && !resetCodeSent && (
            <form onSubmit={handleForgotPassword}>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>{t('email_address')}</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="owner@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-warning w-full mt-4" disabled={loading}>
                {loading ? <div className="loader"></div> : 'Send Reset Code'}
              </button>
              <p className="mt-4 mb-0 text-muted" style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => setIsForgotPassword(false)}>
                  Back to Login
              </p>
            </form>
        )}

        {/* ================= FORGOT PASSWORD 2: RESET ================= */}
        {isForgotPassword && resetCodeSent && (
            <form onSubmit={handleResetPassword}>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>Reset Code (Token)</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Paste your token here"
                  value={resetToken}
                  onChange={e => setResetToken(e.target.value)}
                  required
                />
              </div>
              <div className="input-group" style={{ textAlign: 'left' }}>
                <label>New Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn btn-success w-full mt-4" disabled={loading}>
                {loading ? <div className="loader"></div> : 'Confirm New Password'}
              </button>
               <p className="mt-4 mb-0 text-muted" style={{ cursor: 'pointer', fontSize: '0.9rem' }} onClick={() => { setIsForgotPassword(false); setResetCodeSent(false); }}>
                  Cancel & Back to Login
              </p>
            </form>
        )}
      </div>
    </div>
  );
}
