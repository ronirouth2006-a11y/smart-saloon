import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, Mail, Lock, Key, ArrowLeft, RefreshCw, Scissors, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function OwnerLogin() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');
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
      const response = await api.post('/owner/login', { email, password });
      localStorage.setItem('owner', JSON.stringify({
        email: email,
        id: response.data.saloon_id,
        token: response.data.access_token
      }));
      navigate('/owner/dashboard');
    } catch (err) {
      if (err.response?.status === 403) {
        localStorage.setItem('pendingOwnerCredentials', JSON.stringify({ email, password }));
        navigate('/registration-pending');
      } else {
        setError(err.response?.data?.detail || 'Authentication failed. Check credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) { setError('Email required for recovery.'); return; }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await api.post('/auth/forgot-password', { email });
      setMsg('Recovery pulse sent. Check logs for token.');
      setResetCodeSent(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Recovery link failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetToken || !newPassword) { setError('Provide all required protocols.'); return; }
    setLoading(true);
    setError('');
    setMsg('');
    try {
      await api.post('/auth/reset-password', { token: resetToken, new_password: newPassword });
      setMsg('Access keys rotated. Please authenticate.');
      setIsForgotPassword(false);
      setResetCodeSent(false);
      setPassword('');
      setResetToken('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid rotation token.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans selection:bg-primary/20 flex flex-col items-center justify-center px-8">
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-[480px]"
      >
        <div className="text-center mb-10 space-y-4">
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-border-subtle text-accent text-[10px] font-black tracking-[0.2em] uppercase mb-2">
              Management Portal
           </div>
           <h1 className="text-4xl lg:text-5xl font-heading font-black tracking-tight uppercase leading-[0.9]">
             HQ <span className="text-primary italic">Access.</span>
           </h1>
        </div>

        <div className="bg-background-card border border-border-subtle rounded-[48px] p-10 lg:p-14 shadow-premium backdrop-blur-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
           
           <AnimatePresence mode="wait">
             {error && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger text-xs font-bold">
                  <ShieldAlert size={18} /> {error}
               </motion.div>
             )}
             {msg && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center gap-3 text-primary text-xs font-bold">
                  <CheckCircle2 size={18} /> {msg}
               </motion.div>
             )}
           </AnimatePresence>

           {!isForgotPassword ? (
             <form onSubmit={handleLogin} className="space-y-8">
               <div className="space-y-6">
                 <FormInput label="OWNER EMAIL" value={email} onChange={setEmail} placeholder="admin@enterprise.ai" icon={<Mail size={18}/>} />
                 <div className="space-y-2">
                    <div className="flex justify-between px-2">
                       <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">OWNER PASSWORD</label>
                       <button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-black uppercase text-primary hover:text-accent transition-colors">LOST KEY?</button>
                    </div>
                    <div className="relative group">
                       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-smooth"><Lock size={18}/></div>
                       <input 
                         type="password" value={password} onChange={e => setPassword(e.target.value)} required
                         className="w-full bg-background-main border border-border-subtle rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-primary/50 focus:bg-background-card transition-smooth text-text-main placeholder:text-text-muted" 
                         placeholder="••••••••"
                       />
                    </div>
                 </div>
               </div>

               <button type="submit" disabled={loading} className="w-full bg-primary text-background-main py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth">
                 {loading ? 'AUTHENTICATING...' : 'SECURE SIGN IN'}
               </button>
             </form>
           ) : !resetCodeSent ? (
             <form onSubmit={handleForgotPassword} className="space-y-8">
                <FormInput label="REGISTERED EMAIL" value={email} onChange={setEmail} placeholder="admin@enterprise.ai" icon={<Mail size={18}/>} />
                <button type="submit" disabled={loading} className="w-full bg-accent text-background-main py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-premium transition-smooth">
                  {loading ? 'SENDING...' : 'DISPATCH RECOVERY PULSE'}
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-text-main transition-colors flex items-center justify-center gap-2">
                   <ArrowLeft size={14} /> Back to Vault
                </button>
             </form>
           ) : (
             <form onSubmit={handleResetPassword} className="space-y-8">
                <div className="space-y-6">
                   <FormInput label="ROTATION TOKEN" value={resetToken} onChange={setResetToken} placeholder="Paste verification key" icon={<Key size={18}/>} />
                   <FormInput label="NEW SECURE PASSWORD" type="password" value={newPassword} onChange={setNewPassword} placeholder="••••••••" icon={<Lock size={18}/>} />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary text-background-main py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-premium transition-smooth">
                  {loading ? 'ROTATING...' : 'AUTHORIZE NEW KEY'}
                </button>
                <button type="button" onClick={() => setIsForgotPassword(false)} className="w-full text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-text-main transition-colors flex items-center justify-center gap-2">
                   <ArrowLeft size={14} /> Back to Vault
                </button>
             </form>
           )}
        </div>

        <div className="text-center mt-12">
          <p className="text-text-dim font-black text-[10px] uppercase tracking-[0.25em]">
             New operation? <Link to="/register" className="text-primary hover:text-accent transition-colors ml-2 underline underline-offset-4">Register your node</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

const FormInput = ({ icon, label, type="text", value, onChange, placeholder }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim ml-2">{label}</label>
    <div className="relative group">
       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-smooth">{icon}</div>
       <input 
         type={type} required value={value}
         onChange={e => onChange(e.target.value)}
         className="w-full bg-background-main border border-border-subtle rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-primary/50 focus:bg-background-card transition-smooth text-text-main placeholder:text-text-muted" 
         placeholder={placeholder}
       />
    </div>
  </div>
);

