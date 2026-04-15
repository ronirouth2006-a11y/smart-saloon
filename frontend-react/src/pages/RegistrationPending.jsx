import React, { useEffect, useState } from 'react';
import { Clock, ShieldCheck, Mail, CheckCircle2, AlertCircle, RefreshCw, ChevronRight, ExternalLink } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function RegistrationPending() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      const creds = localStorage.getItem('pendingOwnerCredentials');
      if (!creds) {
        setStatus('pending');
        setChecking(false);
        return;
      }

      const { email, password } = JSON.parse(creds);

      try {
        const response = await api.post('/owner/login', { email, password });
        localStorage.setItem('owner', JSON.stringify({
          email: email,
          id: response.data.saloon_id,
          token: response.data.access_token
        }));
        localStorage.removeItem('pendingOwnerCredentials');
        setStatus('approved');
        setTimeout(() => navigate('/owner/dashboard'), 2500);
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
    const interval = setInterval(checkStatus, 10000);
    return () => clearInterval(interval);
  }, [navigate]);

  const handleTryAgain = () => {
    localStorage.removeItem('pendingOwnerCredentials');
    localStorage.removeItem('tempRegistrationToken');
    localStorage.removeItem('pendingStep');
    localStorage.removeItem('pendingSalonId');
    navigate('/register');
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }
  };

  if (status === 'rejected') {
    return (
      <div className="bg-background-main min-h-screen text-text-main font-sans flex items-center justify-center p-8 selection:bg-primary/20">
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[600px] w-full bg-background-card border border-danger/20 rounded-[56px] p-12 lg:p-16 shadow-premium relative overflow-hidden backdrop-blur-3xl text-center">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-danger opacity-50" />
          <div className="inline-flex p-6 bg-danger/10 rounded-full mb-8 border border-danger/20">
            <AlertCircle size={56} className="text-danger" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-heading font-black tracking-tighter uppercase leading-none mb-6">Activation <span className="text-danger italic">Failed.</span></h1>
          <p className="text-text-muted text-lg font-medium leading-relaxed mb-10 max-w-md mx-auto">
            Your salon registration was not approved. This usually signifies insufficient storefront clarity or metadata inconsistencies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button className="flex-1 bg-white/5 border border-border-subtle hover:bg-white/10 text-text-main py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] transition-smooth" onClick={handleTryAgain}>Restart Sequence</button>
            <button className="flex-1 bg-danger text-white py-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.2em] transition-smooth shadow-premium" onClick={() => window.location.href = 'mailto:support@smartsaloon.com'}>Appeal Decision</button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans flex items-center justify-center p-8 selection:bg-primary/20 overflow-hidden">
      <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-[600px] w-full bg-background-card border border-border-subtle rounded-[56px] p-12 lg:p-16 shadow-premium relative overflow-hidden backdrop-blur-3xl text-center">
        
        {/* Animated Background Ambience */}
        <div className={`absolute -top-1/2 -left-1/2 w-[200%] h-[200%] transition-colors duration-1000 -z-10 ${status === 'approved' ? 'bg-[radial-gradient(circle,rgba(16,185,129,0.08)_0%,transparent_60%)]' : 'bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_60%)]'} animate-pulse`} />

        <div className="inline-flex p-6 bg-white/5 rounded-full mb-8 border border-border-subtle relative z-10">
          <AnimatePresence mode="wait">
            {status === 'approved' ? (
              <motion.div key="success" initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-primary">
                 <CheckCircle2 size={56} />
              </motion.div>
            ) : (
              <motion.div key="pending" animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }} className="text-accent">
                 <Clock size={56} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <h1 className="text-4xl lg:text-5xl font-heading font-black tracking-tighter uppercase leading-none mb-6 relative z-10">
          {status === 'approved' ? <>Link <span className="text-primary italic">Established.</span></> : <>Audit in <span className="text-accent italic">Progress.</span></>}
        </h1>
        <p className="text-text-muted text-lg font-medium leading-relaxed mb-12 max-w-md mx-auto relative z-10">
          {status === 'approved' 
            ? "Identity verified. Neural connection optimized. Entering Management HQ..."
            : "Your credentials are being audited for brand authenticity and location telemetry. This protocol usually completes within 120 minutes."
          }
        </p>

        {/* Dynamic Status Progress */}
        <div className="bg-background-main/50 rounded-[32px] p-8 mb-12 border border-border-subtle relative z-10 text-left">
          <div className="flex justify-between mb-4 text-[10px] font-black uppercase tracking-widest">
            <span className="flex items-center gap-2 text-primary"><CheckCircle2 size={14} /> Submitted</span>
            <span className={`flex items-center gap-2 ${status === 'approved' ? 'text-primary' : 'text-accent'}`}><Clock size={14} /> Analysis</span>
            <span className={`flex items-center gap-2 ${status === 'approved' ? 'text-primary' : 'text-text-dim'}`}><ShieldCheck size={14} /> Finalized</span>
          </div>
          
          <div className="h-2 bg-white/5 rounded-full overflow-hidden relative">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: status === 'approved' ? '100%' : '66.6%' }}
              className={`h-full rounded-full relative transition-all duration-1000 ${status === 'approved' ? 'bg-primary' : 'bg-gradient-to-r from-primary to-accent'}`}
            >
               {status !== 'approved' && <div className="absolute inset-0 bg-white/20 animate-loading-slide" />}
            </motion.div>
          </div>
          
          <p className="text-center text-[9px] font-bold text-text-dim uppercase tracking-[0.3em] mt-5">
            {status === 'approved' ? 'Authorization Sequence Completed.' : 'Awaiting Administrative Digital Signature.'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10">
          {status !== 'approved' && (
            <div className="flex items-center justify-center gap-3 text-[10px] font-black text-accent uppercase tracking-widest bg-accent/5 px-6 py-4 rounded-2xl border border-accent/10 sm:flex-1">
              <RefreshCw size={14} className="animate-spin" /> High-Freq Polling
            </div>
          )}
          <button onClick={() => navigate('/map')} className="flex-1 bg-white/5 border border-border-subtle hover:bg-white/10 text-text-main py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-smooth flex items-center justify-center gap-2">
             Explorer Map <ChevronRight size={14} />
          </button>
        </div>

      </motion.div>
    </div>
  );
}
