import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function RegistrationPending() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const creds = localStorage.getItem('pendingOwnerCredentials');
      if (!creds) {
        setChecking(false);
        return;
      }

      const { email, password } = JSON.parse(creds);

      try {
        const response = await api.post('/owner/login', { email, password });
        // If we get here, it means it's APPROVED (200 OK)
        localStorage.setItem('owner', JSON.stringify({
          email: email,
          id: response.data.saloon_id,
          token: response.data.access_token
        }));
        localStorage.removeItem('pendingOwnerCredentials');
        setStatus('approved');
        setTimeout(() => navigate('/owner/dashboard'), 2000);
      } catch (err) {
        if (err.response?.status === 403) {
          if (err.response.data.detail === "Registration Rejected") {
            setStatus('rejected');
          } else {
            setStatus('pending');
          }
        } else {
          console.error("Status check failed", err);
        }
      } finally {
        setChecking(false);
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10000); // Poll every 10 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const handleTryAgain = () => {
    localStorage.removeItem('pendingOwnerCredentials');
    navigate('/owner/register');
  };

  if (status === 'rejected') {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-panel animate-fade-in" style={{ padding: '3rem', borderTop: '4px solid var(--danger)' }}>
          <div style={{ display: 'inline-flex', background: 'rgba(231, 76, 60, 0.1)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem' }}>
            <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
          </div>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Application Rejected</h1>
          <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6' }}>
            We're sorry, but your salon registration was not approved at this time. This is usually due to unclear storefront photos or mismatched location data.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="btn btn-secondary" onClick={handleTryAgain}>Try Again / Re-register</button>
            <button className="btn btn-primary" onClick={() => window.location.href = 'mailto:support@smartsaloon.com'}>Contact Support</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', position: 'relative', overflow: 'hidden' }}>
        
        {/* Animated Background Pulse */}
        <div style={{
          position: 'absolute', top: '-50%', left: '-50%', width: '200%', height: '200%',
          background: status === 'approved' 
            ? 'radial-gradient(circle, rgba(46, 204, 113, 0.1) 0%, transparent 60%)'
            : 'radial-gradient(circle, rgba(129, 140, 248, 0.1) 0%, transparent 60%)',
          animation: 'pulse 4s infinite'
        }}></div>

        <div style={{ display: 'inline-flex', background: 'var(--panel-border)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
          {status === 'approved' ? (
            <CheckCircle2 size={48} style={{ color: 'var(--success)' }} className="animate-bounce" />
          ) : (
            <Clock size={48} className="text-gradient animate-spin-slow" />
          )}
        </div>

        <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', position: 'relative', zIndex: 1 }}>
          {status === 'approved' ? 'Application Approved!' : 'Application Under Review'}
        </h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2.5rem', lineHeight: '1.6', position: 'relative', zIndex: 1 }}>
          {status === 'approved' 
            ? "Your salon is now live on Smart Saloon! Redirecting you to your dashboard..."
            : "Thank you for registering your salon with Smart Saloon! Our Admin team is currently verifying your storefront photo and details to ensure community safety."
          }
        </p>

        {/* Progress Bar UI */}
        <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2.5rem', textAlign: 'left', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem', fontSize: '0.9rem', fontWeight: 'bold' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)' }}>
              <CheckCircle2 size={16} /> Submitted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: status === 'approved' ? 'var(--success)' : 'var(--primary)' }}>
              <Clock size={16} /> Under Review
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: status === 'approved' ? 'var(--success)' : 'var(--text-muted)' }}>
              <ShieldCheck size={16} /> Approved
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--panel-border)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
            <div style={{ 
              width: status === 'approved' ? '100%' : '50%', 
              transition: 'width 1s ease-in-out',
              height: '100%', 
              background: status === 'approved' 
                ? 'var(--success)' 
                : 'linear-gradient(90deg, var(--success), var(--primary))', 
              borderRadius: '10px', 
              position: 'relative' 
            }}>
                {status !== 'approved' && (
                  <div style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, background: 'rgba(255,255,255,0.2)', animation: 'slideRight 2s infinite linear' }}></div>
                )}
            </div>
          </div>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '1rem', margin: 0 }}>
            {status === 'approved' ? 'Your store is now active.' : 'This process usually takes 2-4 hours.'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', position: 'relative', zIndex: 1, alignItems: 'center' }}>
          {status !== 'approved' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--primary)', marginRight: '1rem' }}>
              <RefreshCw size={16} className="animate-spin" /> Auto-checking...
            </div>
          )}
          <button 
            className="btn btn-secondary" 
            onClick={() => window.location.href = 'mailto:support@smartsaloon.com'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          >
            <Mail size={18} /> Contact Support
          </button>
          <button 
            className="btn btn-primary" 
            onClick={() => navigate('/map')}
          >
            Go to Map Dashboard
          </button>
        </div>

      </div>
    </div>
  );
}
