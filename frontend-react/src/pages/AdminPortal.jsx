import React, { useState, useEffect, useMemo } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, ExternalLink, Activity, 
  MapPin, LogOut, LayoutDashboard, Radio, Eye, FileText, Lock,
  ChevronRight, ShieldAlert, Zap, Search, Bell, Filter, MoreHorizontal,
  ArrowUpRight, Building2, UserCheck, ShieldCheck, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function AdminPortal() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [pendingSalons, setPendingSalons] = useState([]);
  const [approvedSalons, setApprovedSalons] = useState([]);
  const [heartbeats, setHeartbeats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPending, setSelectedPending] = useState(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');
    try {
      const res = await api.post('/admin/api/v1/login', { email, password });
      const token = res.data.access_token;
      setAdminToken(token);
      localStorage.setItem('adminToken', token);
    } catch (err) {
      setLoginError('Invalid Administrator Credentials');
    } finally {
      setLoginLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setAdminToken('');
    setActiveTab('dashboard');
  };

  const config = { headers: { Authorization: `Bearer ${adminToken}` } };
  
  const fetchAllData = async () => {
    if (!adminToken) return;
    setLoading(true);
    setError('');
    try {
      const [pendingRes, approvedRes, pulsesRes] = await Promise.all([
        api.get('/admin/api/v1/salons/pending', config),
        api.get('/admin/api/v1/salons/approved', config),
        api.get('/admin/api/v1/heartbeats', config)
      ]);
      setPendingSalons(pendingRes.data);
      setApprovedSalons(approvedRes.data);
      setHeartbeats(pulsesRes.data);
    } catch (err) {
      if (err.response?.status === 401) logout();
      else setError('Failed to sync control center data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 60000);
      return () => clearInterval(interval);
    }
  }, [adminToken]);

  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/api/v1/salons/${id}/approve`, {}, config);
      setSelectedPending(null);
      fetchAllData();
    } catch (err) { setError('Approval Action Failed'); }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this registration entirely?")) return;
    try {
      await api.delete(`/admin/api/v1/salons/${id}/reject`, config);
      setSelectedPending(null);
      fetchAllData();
    } catch (err) { setError('Rejection Action Failed'); }
  };

  const getPulseStatus = (lastPulseStr) => {
    if (!lastPulseStr) return { label: 'DARK', color: 'text-danger', bg: 'bg-danger/5 border-danger/10' };
    const pulseDate = new Date(lastPulseStr);
    const diffMins = (new Date() - pulseDate) / 1000 / 60;
    if (diffMins > 30) return { label: 'DARK', color: 'text-danger', bg: 'bg-danger/5 border-danger/10' };
    if (diffMins > 10) return { label: 'DORMANT', color: 'text-accent', bg: 'bg-accent/5 border-accent/10' };
    return { label: 'SYNCED', color: 'text-primary', bg: 'bg-primary/5 border-primary/10' };
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen bg-background-main flex items-center justify-center p-10 selection:bg-primary/20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05)_0%,transparent_50%)]" />
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-[480px] relative z-10">
          <div className="bg-background-card border border-border-subtle rounded-[48px] p-12 shadow-premium backdrop-blur-3xl relative overflow-hidden">
             <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-primary via-accent to-primary animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
             <div className="text-center mb-12">
               <div className="inline-flex p-5 bg-primary/10 rounded-[32px] border border-primary/20 mb-6 group transition-smooth hover:scale-105">
                 <Shield size={48} className="text-primary group-hover:rotate-12 transition-transform" />
               </div>
               <h1 className="text-3xl font-heading font-black uppercase tracking-tighter leading-none mb-3">Institutional <span className="text-primary italic">Access</span></h1>
               <p className="text-[10px] text-text-dim font-black uppercase tracking-[0.3em]">Authorized High-Level Personnel Only</p>
             </div>
             {loginError && (
               <div className="mb-8 p-4 bg-danger/10 border border-danger/20 rounded-2xl flex items-center gap-3 text-danger text-[11px] font-black uppercase tracking-widest">
                  <ShieldAlert size={18} /> {loginError}
               </div>
             )}
             <form onSubmit={handleLogin} className="space-y-8">
               <div className="space-y-6">
                 <AuthInput label="IDENTITY KEY" type="email" value={email} onChange={setEmail} icon={<UserCheck size={18}/>} placeholder="root@smartsaloons.ai" />
                 <AuthInput label="SECURITY PHRASE" type="password" value={password} onChange={setPassword} icon={<Lock size={18}/>} placeholder="••••••••" />
               </div>
               <button disabled={loginLoading} type="submit" className="w-full bg-primary text-background-main font-black uppercase tracking-[0.25em] text-xs py-6 rounded-[32px] hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth active:scale-95 disabled:opacity-50">
                  {loginLoading ? 'VERIFYING...' : 'ESTABLISH LINK'}
               </button>
             </form>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="bg-background-main min-h-screen text-text-main flex flex-col xl:flex-row selection:bg-primary/20 font-sans">
       {/* Error Toast */}
       <AnimatePresence>
         {error && (
           <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-danger text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest shadow-premium border border-white/20 flex items-center gap-3">
             <ShieldAlert size={16} /> {error}
           </motion.div>
         )}
       </AnimatePresence>
       
       {/* High-Authority Sidebar */}
       <aside className="w-full xl:w-80 xl:fixed xl:h-screen bg-background-card/50 backdrop-blur-3xl border-r border-border-subtle flex flex-col p-10 z-[50]">
         <div className="flex flex-col items-center mb-16 pb-10 border-b border-border-subtle pt-6">
            <div className="w-20 h-20 bg-primary/10 border border-primary/20 rounded-[32px] flex items-center justify-center mb-5 shadow-premium group transition-smooth">
              <Shield className="text-primary group-hover:scale-110 transition-transform" size={40} />
            </div>
            <h1 className="font-heading font-black uppercase tracking-tighter text-2xl text-text-main leading-none">Root <span className="text-primary italic">X</span></h1>
            <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 bg-primary/5 rounded-full border border-primary/20">
               <div className="w-1.5 h-1.5 rounded-full bg-primary pulse-primary" />
               <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">High Authority Access</p>
            </div>
         </div>

         <nav className="flex-1 space-y-4">
            <SidebarLink icon={<LayoutDashboard size={18}/>} label="COMMAND HUB" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
            <SidebarLink icon={<Clock size={18}/>} label="PENDING NODES" badge={pendingSalons.length} active={activeTab==='pending'} onClick={async ()=>{ setActiveTab('pending'); setSelectedPending(null); await fetchAllData(); }} />
            <SidebarLink icon={<Radio size={18}/>} label="SIGNAL AUDIT" active={activeTab==='heartbeats'} onClick={()=>{ setActiveTab('heartbeats'); fetchAllData(); }} />
         </nav>

         <button onClick={logout} className="mt-12 flex items-center gap-4 w-full p-4 text-text-dim hover:text-danger hover:bg-danger/10 rounded-[28px] transition-smooth font-black text-[10px] uppercase tracking-[0.25em] border border-transparent hover:border-danger/20">
            <LogOut size={16} /> Secure Termination
         </button>
       </aside>

       {/* HUB CONTENT AREA */}
       <main className="flex-1 xl:ml-80 p-10 xl:p-20 relative min-h-screen">
          <header className="mb-16 flex flex-col md:flex-row md:items-end justify-between border-b border-border-subtle pb-10 gap-8">
             <div>
               <div className="inline-flex items-center gap-3 text-primary text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                  <Activity size={14} className="animate-pulse" /> Live Command Stream
               </div>
               <h2 className="text-5xl font-heading font-black text-text-main uppercase tracking-tighter leading-none">{activeTab.replace('-', ' ')} <span className="text-primary italic">.</span></h2>
             </div>
             <div className="flex items-center gap-4">
                <button onClick={fetchAllData} disabled={loading} className="p-4 bg-background-card border border-border-subtle rounded-2xl hover:bg-white/5 transition-smooth text-text-dim">
                   <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
                <div className="px-6 py-4 bg-background-card border border-border-subtle rounded-2xl flex items-center gap-4">
                   <div className="flex flex-col items-end">
                      <p className="text-[9px] font-black text-text-dim uppercase tracking-widest">Network Status</p>
                      <p className="text-[11px] font-black text-primary uppercase">OPTIMAL</p>
                   </div>
                   <div className="w-1.5 h-10 bg-primary/20 rounded-full" />
                </div>
             </div>
          </header>

          <div className="h-full">
            {activeTab === 'dashboard' && <AdminOverview approved={approvedSalons} pending={pendingSalons} pulses={heartbeats} />}
            {activeTab === 'pending' && <PendingWorkflow list={pendingSalons} selected={selectedPending} onSelect={setSelectedPending} onApprove={handleApprove} onReject={handleReject} />}
            {activeTab === 'heartbeats' && <PulseAudit list={heartbeats} getStatus={getPulseStatus} />}
          </div>
       </main>
    </div>
  );
}

const StatCard = ({ label, value, icon, trend, color }) => (
  <div className="p-10 bg-background-card border border-border-subtle rounded-[56px] shadow-premium relative overflow-hidden group hover:border-primary/30 transition-smooth">
    <div className={`absolute top-0 right-0 w-32 h-32 bg-${color}/5 blur-3xl -z-10`} />
    <div className="flex justify-between items-start mb-10">
      <div className={`p-4 bg-${color}/10 rounded-2xl text-${color} border border-${color}/20`}>
        {icon}
      </div>
      <div className={`px-4 py-1.5 bg-${color === 'primary' ? 'primary/10' : 'accent/10'} rounded-full text-[9px] font-black uppercase tracking-widest ${color === 'primary' ? 'text-primary' : 'text-accent'}`}>
        {trend}
      </div>
    </div>
    <div>
      <h4 className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em] mb-3">{label}</h4>
      <p className="text-5xl font-heading font-black text-text-main">{value}</p>
    </div>
  </div>
);

const AdminOverview = ({ approved, pending, pulses }) => (
  <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <StatCard label="VERIFIED NODES" value={approved.length} icon={<Building2 size={24} />} trend="+4.2%" color="primary" />
      <StatCard label="PENDING AUDITS" value={pending.length} icon={<Clock size={24} />} trend="CRITICAL" color="accent" />
      <StatCard label="ACTIVE PULSES" value={pulses.length} icon={<Radio size={24} />} trend="NOMINAL" color="primary" />
    </div>

    <div className="space-y-8 pt-8">
       <div className="flex items-center justify-between">
          <h3 className="text-sm font-black uppercase tracking-[0.3em] text-text-dim">Verification Ledger</h3>
          <button className="text-[10px] font-black text-primary uppercase tracking-[0.2em] hover:opacity-70">Expand Master File</button>
       </div>
       <div className="bg-background-card rounded-[48px] border border-border-subtle p-6 overflow-hidden shadow-premium">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border-subtle uppercase text-[10px] tracking-[0.3em] text-text-dim font-black">
                <th className="p-8">Entity Identifier</th>
                <th className="p-8">Clearance Authority</th>
                <th className="p-8 text-right">Commit Sequence</th>
              </tr>
            </thead>
            <tbody>
              {approved.slice(0, 8).map(s => (
                <tr key={s.id} className="border-b border-white/5 bg-white/[0.01] hover:bg-white/[0.05] transition-smooth group">
                  <td className="p-8">
                     <div className="flex flex-col">
                        <span className="font-heading font-black text-lg text-text-main group-hover:text-primary transition-colors">{s.name}</span>
                        <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest mt-1">ID_{s.id.slice(-8).toUpperCase()}</span>
                     </div>
                  </td>
                  <td className="p-8">
                     <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-background-main rounded-xl border border-border-subtle text-[10px] font-black text-accent uppercase tracking-widest">
                        <ShieldCheck size={12} /> {s.approved_by || 'LEGACY_IMPORT'}
                     </div>
                  </td>
                  <td className="p-8 text-right font-mono text-xs text-text-dim">
                     {s.approved_at ? new Date(s.approved_at).toLocaleString() : 'AUTH_REDACTED'}
                  </td>
                </tr>
              ))}
              {approved.length === 0 && (
                <tr><td colSpan="3" className="p-20 text-center text-text-dim font-black uppercase tracking-widest italic opacity-30">Ledger Empty • Waiting for Initial Sequence</td></tr>
              )}
            </tbody>
          </table>
       </div>
    </div>
  </div>
);

const PendingWorkflow = ({ list, selected, onSelect, onApprove, onReject }) => (
  <div className="flex flex-col lg:flex-row gap-10 h-full animate-in fade-in slide-in-from-bottom-6 duration-700">
    <div className={`flex-1 space-y-4 ${selected ? 'hidden lg:block' : 'block'}`}>
       <div className="grid grid-cols-1 gap-4">
         {list.map(s => (
           <motion.div 
             key={s.id} layout layoutId={s.id}
             onClick={() => onSelect(s)}
             className={`cursor-pointer p-8 bg-background-card border rounded-[40px] flex items-center justify-between group transition-smooth hover:shadow-premium ${selected?.id === s.id ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border-subtle hover:border-primary/30'}`}
           >
              <div className="flex items-center gap-8">
                 <div className="w-14 h-14 bg-background-panel rounded-2xl flex items-center justify-center border border-border-subtle text-text-dim group-hover:text-primary transition-colors">
                    <Building2 size={24} />
                 </div>
                 <div>
                    <h4 className="font-heading font-black text-xl text-text-main leading-none mb-2">{s.name}</h4>
                    <p className="text-[10px] font-black text-text-dim flex items-center gap-2 uppercase tracking-widest"><MapPin size={12}/> {s.location || 'COORD_UNKNOWN'}</p>
                 </div>
              </div>
              <div className="bg-accent/10 text-accent px-5 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] border border-accent/20 flex items-center gap-2">
                 <Bell size={12} className="animate-bounce" /> Awaiting Review
              </div>
           </motion.div>
         ))}
         {list.length === 0 && (
            <div className="flex flex-col items-center justify-center py-40 border-2 border-dashed border-border-subtle rounded-[56px] text-text-dim">
               <ShieldCheck size={64} className="mb-6 opacity-20" />
               <p className="font-black tracking-[0.3em] uppercase text-xs">Clearance Queue Empty</p>
            </div>
         )}
       </div>
    </div>

    <AnimatePresence>
      {selected && (
        <motion.div 
          initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 40 }}
          className="w-full lg:w-[480px] bg-background-card border border-primary/20 rounded-[56px] p-10 lg:sticky lg:top-20 h-fit shadow-premium relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] -z-10" />
          <div className="flex justify-between items-center mb-12">
            <h3 className="font-heading font-black uppercase tracking-tighter text-xl flex items-center gap-3"><Shield size={20} className="text-primary"/> Verification Hub</h3>
            <button onClick={() => onSelect(null)} className="p-3 bg-white/5 border border-border-subtle rounded-2xl text-text-dim hover:text-text-main transition-smooth"><XCircle size={20}/></button>
          </div>

          <div className="space-y-10">
            <div className="grid grid-cols-2 gap-8">
               <InfoItem label="NODE IDENTITY" value={selected.name} />
               <InfoItem label="GEOSPATIAL STRING" value={selected.location || 'N/A'} />
            </div>
            <div className="p-1.5 bg-background-main rounded-[28px] border border-border-subtle">
               <div className="p-8 border border-dashed border-border-subtle rounded-[24px] flex flex-col items-center justify-center bg-white/5 h-48 group">
                 <FileText className="text-primary mb-4 transition-smooth group-hover:scale-110" size={40} opacity={0.4} />
                 <span className="font-black text-[10px] tracking-[0.3em] text-text-dim uppercase">Credential.sys file</span>
                 <span className="text-[9px] text-text-dim/40 mt-3 font-mono tracking-widest uppercase">Encryption active • View Payload</span>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-6">
               <button onClick={() => onApprove(selected.id)} className="bg-primary text-background-main font-black uppercase text-[10px] tracking-[0.25em] py-5 rounded-[28px] hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth flex justify-center items-center gap-3">
                  <CheckCircle size={14} /> AUTHORIZE
               </button>
               <button onClick={() => onReject(selected.id)} className="bg-white/5 text-danger border border-danger/20 font-black uppercase text-[10px] tracking-[0.25em] py-5 rounded-[28px] hover:bg-danger hover:text-white transition-smooth flex justify-center items-center gap-3">
                  <XCircle size={14} /> TERMINATE
               </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const PulseAudit = ({ list, getStatus }) => (
  <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
       {list.map(hb => {
          const status = getStatus(hb.last_pulse);
          return (
            <div key={hb.salon_id} className={`p-10 rounded-[48px] border shadow-premium group transition-smooth hover:scale-[1.02] ${status.bg}`}>
               <div className="flex justify-between items-start mb-10">
                 <div className="flex flex-col gap-2">
                    <h4 className="font-heading font-black text-2xl text-text-main leading-tight uppercase tracking-tight group-hover:text-primary transition-colors">{hb.salon_name}</h4>
                    <span className="text-[9px] font-mono text-text-dim uppercase tracking-widest">S_HUB_{hb.salon_id.slice(-6).toUpperCase()}</span>
                 </div>
                 <div className={`p-4 rounded-3xl bg-background-main border border-border-subtle transition-smooth group-hover:rotate-12 ${status.color}`}>
                    <Radio size={28} />
                 </div>
               </div>
               <div className="space-y-3 mb-10">
                 <p className="text-[10px] font-black text-text-dim uppercase tracking-[0.3em]">Last Signal Sequence</p>
                 <div className="flex items-center gap-3">
                    <Clock size={16} className="text-text-dim" />
                    <p className={`font-mono text-lg font-black tracking-tight ${status.color}`}>
                      {hb.last_pulse ? new Date(hb.last_pulse).toLocaleTimeString() : 'SIGNAL_LOST'}
                    </p>
                 </div>
               </div>
               <div className={`inline-flex items-center gap-3 px-6 py-2 bg-background-main rounded-2xl text-[10px] font-black tracking-[0.25em] border border-border-subtle ${status.color}`}>
                 <div className={`w-2 h-2 rounded-full pulse-primary`} />
                 {status.label}
               </div>
            </div>
          );
       })}
       {list.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-40 border-2 border-dashed border-border-subtle rounded-[64px] text-text-dim">
             <ShieldAlert size={64} className="mb-6 opacity-10" />
             <p className="font-black tracking-[0.4em] uppercase text-xs">Zero Visual Streams Found</p>
          </div>
       )}
     </div>
  </div>
);

const InfoItem = ({ label, value }) => (
  <div className="space-y-2">
    <p className="text-[9px] font-black text-text-dim uppercase tracking-[0.3em]">{label}</p>
    <p className="text-text-main font-heading font-black text-sm uppercase tracking-tight leading-tight">{value}</p>
  </div>
);

const SidebarLink = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center justify-between p-5 rounded-[28px] font-black text-[10px] uppercase tracking-[0.25em] transition-smooth group relative overflow-hidden ${active ? 'bg-primary text-background-main shadow-premium border border-primary/20' : 'text-text-dim hover:bg-white/5 hover:text-text-main border border-transparent hover:border-border-subtle'}`}
  >
    <div className="flex items-center gap-4 relative z-10 transition-smooth group-hover:translate-x-1">
       {icon} {label}
    </div>
    {badge > 0 && (
       <span className={`relative z-10 px-3 py-1 rounded-full text-[9px] font-black shadow-inner ${active ? 'bg-background-main text-primary' : 'bg-primary text-background-main animate-pulse'}`}>
          {badge}
       </span>
    )}
  </button>
);

const AuthInput = ({ label, icon, onChange, ...props }) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim ml-3">{label}</label>
    <div className="relative group">
       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-smooth">{icon}</div>
       <input 
         {...props} 
         onChange={(e) => onChange(e.target.value)}
         className="w-full bg-background-main/50 border border-border-subtle rounded-[28px] py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-primary/50 transition-smooth text-text-main placeholder:text-text-dim/30" 
       />
    </div>
  </div>
);


