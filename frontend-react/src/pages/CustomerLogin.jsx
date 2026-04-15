import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogIn, Repeat, Mail, Lock, UserPlus, ArrowRight, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function CustomerLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const syncFavorites = async (token) => {
    setSyncing(true);
    try {
      const localFavs = JSON.parse(localStorage.getItem('favorite_salons') || '[]');
      const res = await api.post('/customer/favorites/sync', 
        { salon_ids: localFavs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      localStorage.setItem('favorite_salons', JSON.stringify(res.data.favorites));
    } catch (err) {
      console.error("Cloud sync failed.", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/customer/login', {
          email: formData.email,
          password: formData.password
        });
        const token = res.data.access_token;
        localStorage.setItem('customer_token', token);
        await syncFavorites(token);
        navigate('/map');
      } else {
        await api.post('/customer/register', formData);
        setIsLogin(true);
        setError('');
        setFormData({ ...formData, password: '' }); // Clear password for login
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please verify credentials.');
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
           <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/5 border border-primary/20 text-primary text-[10px] font-black tracking-[0.2em] uppercase mb-2">
              Discovery Engine
           </div>
           <h1 className="text-4xl lg:text-5xl font-heading font-black tracking-tight uppercase leading-[0.9]">
             {isLogin ? 'Welcome' : 'Join the'} <span className="text-primary italic">{isLogin ? 'In.' : 'Elite.'}</span>
           </h1>
           <p className="text-text-muted text-sm font-medium">{isLogin ? 'Access your dashboard and favorite salons.' : 'Create an account to track queues live.'}</p>
        </div>

        <div className="bg-background-card border border-border-subtle rounded-[48px] p-10 lg:p-14 shadow-premium backdrop-blur-3xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
           
           <AnimatePresence mode="wait">
             {error && (
               <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-6 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger text-xs font-bold">
                  <ShieldCheck size={18} className="rotate-180" /> {error}
               </motion.div>
             )}
           </AnimatePresence>

           <form onSubmit={handleSubmit} className="space-y-8">
             <div className="space-y-6">
               {!isLogin && (
                 <FormInput 
                   label="FULL NAME" 
                   value={formData.name} 
                   onChange={v => setFormData({...formData, name: v})} 
                   placeholder="John Shepard" 
                   icon={<User size={18}/>} 
                 />
               )}
               <FormInput 
                 label="EMAIL ADDRESS" 
                 type="email" 
                 value={formData.email} 
                 onChange={v => setFormData({...formData, email: v})} 
                 placeholder="pilot@normandy.com" 
                 icon={<Mail size={18}/>} 
               />
               <FormInput 
                 label="SECURE PASSWORD" 
                 type="password" 
                 value={formData.password} 
                 onChange={v => setFormData({...formData, password: v})} 
                 placeholder="••••••••" 
                 icon={<Lock size={18}/>} 
               />
             </div>

             <button 
               type="submit" 
               disabled={loading || syncing} 
               className="w-full bg-primary text-background-main py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth flex items-center justify-center gap-3"
             >
               {syncing ? <Repeat size={20} className="animate-spin" /> : (isLogin ? <LogIn size={20} /> : <UserPlus size={20} />)}
               {syncing ? 'SYNCING CLOUD...' : (loading ? 'INITIALIZING...' : (isLogin ? 'START SESSION' : 'AUTHORIZE ACCOUNT'))}
             </button>
           </form>

           <div className="text-center mt-10">
              <button 
                type="button" 
                onClick={() => { setIsLogin(!isLogin); setError(''); }}
                className="text-[10px] font-black uppercase tracking-widest text-text-dim hover:text-primary transition-colors flex items-center justify-center gap-2 mx-auto"
              >
                {isLogin ? "Don't have an identity yet?" : "Already a member?"} <ArrowRight size={14} className={isLogin ? '' : 'rotate-180'} />
              </button>
           </div>
        </div>

        {!isLogin && (
          <div className="text-center mt-10 p-6 bg-white/5 border border-border-subtle rounded-3xl">
             <p className="text-[11px] text-text-muted font-medium uppercase tracking-widest leading-relaxed">By joining, you agree to our <span className="text-primary cursor-pointer hover:underline">Neural Terms</span> and <span className="text-primary cursor-pointer hover:underline">Data Protocols</span>.</p>
          </div>
        )}
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
         className="w-full bg-background-main/50 border border-border-subtle rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-primary/50 transition-smooth text-text-main" 
         placeholder={placeholder}
       />
    </div>
  </div>
);

