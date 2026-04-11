import { useState, useEffect, useMemo } from 'react';
import { 
  Shield, CheckCircle, XCircle, Clock, ExternalLink, Activity, 
  MapPin, LogOut, LayoutDashboard, Radio, Eye, FileText, Lock 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function AdminPortal() {
  const [adminToken, setAdminToken] = useState(localStorage.getItem('adminToken') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Data State
  const [pendingSalons, setPendingSalons] = useState([]);
  const [approvedSalons, setApprovedSalons] = useState([]);
  const [heartbeats, setHeartbeats] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedPending, setSelectedPending] = useState(null);

  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // 🛡️ Login Handler
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

  // 📡 Data Fetchers
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
      if (err.response?.status === 401) {
        logout(); // Token expired
      } else {
        setError('Failed to sync control center data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchAllData();
      const interval = setInterval(fetchAllData, 60000); // refresh every minute for pulses
      return () => clearInterval(interval);
    }
  }, [adminToken]);

  // Actions
  const handleApprove = async (id) => {
    try {
      await api.put(`/admin/api/v1/salons/${id}/approve`, {}, config);
      setSelectedPending(null);
      fetchAllData();
    } catch (err) {
      setError('Approval Action Failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Reject this registration entirely?")) return;
    try {
      await api.delete(`/admin/api/v1/salons/${id}/reject`, config);
      setSelectedPending(null);
      fetchAllData();
    } catch (err) {
      setError('Rejection Action Failed');
    }
  };

  // 🎨 Derived State & Render Helpers
  const getPulseStatus = (lastPulseStr) => {
    if (!lastPulseStr) return { label: 'OFFLINE', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
    const pulseDate = new Date(lastPulseStr);
    const diffMins = (new Date() - pulseDate) / 1000 / 60;
    
    if (diffMins > 30) return { label: 'OFFLINE (>30m)', color: 'text-red-500', bg: 'bg-red-500/10 border-red-500/20' };
    if (diffMins > 10) return { label: 'WARNING (>10m)', color: 'text-yellow-500', bg: 'bg-yellow-500/10 border-yellow-500/20' };
    return { label: 'ONLINE', color: 'text-electric-green', bg: 'bg-electric-green/10 border-electric-green/20' };
  };

  // ------------------------------------------
  // RENDER: LOGIN SCREEN
  // ------------------------------------------
  if (!adminToken) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
        {/* Sub-system grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none"></div>
        
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <div className="bg-background-panel border border-white/10 rounded-3xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
             {/* Security strip */}
             <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-500 via-orange-500 to-electric-cyan"></div>
             
             <div className="flex flex-col items-center mb-8">
               <Shield size={48} className="text-electric-cyan mb-4 drop-shadow-[0_0_15px_rgba(0,245,255,0.5)]" />
               <h2 className="text-2xl font-black uppercase tracking-widest text-white m-0">Internal Portal</h2>
               <p className="text-xs text-text-muted mt-2 tracking-widest font-mono">AUTHORIZED PERSONNEL ONLY</p>
             </div>

             {loginError && <p className="text-red-400 text-xs text-center mb-4 font-mono uppercase bg-red-400/10 py-2 rounded border border-red-400/20">{loginError}</p>}

             <form onSubmit={handleLogin} className="space-y-4">
               <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Admin Key (Email)</label>
                  <input type="email" required value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric-cyan outline-none transition-colors" />
               </div>
               <div>
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2 block">Passphrase</label>
                  <input type="password" required value={password} onChange={(e)=>setPassword(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-electric-cyan outline-none transition-colors" />
               </div>
               <button disabled={loginLoading} type="submit" className="w-full bg-white text-black font-black uppercase tracking-widest py-4 rounded-xl mt-4 hover:bg-electric-cyan hover:shadow-[0_0_20px_rgba(0,245,255,0.4)] transition-all">
                  {loginLoading ? 'Authenticating...' : 'Establish Secure Link'}
               </button>
             </form>
          </div>
        </motion.div>
      </div>
    );
  }

  // ------------------------------------------
  // RENDER: DASHBOARD COMPONENTS
  // ------------------------------------------

  // SUB-RENDER: Dashboard Overview
  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-background-card border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-electric-green/30 transition-colors">
           <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity"><Activity size={120} /></div>
           <p className="text-xs font-black uppercase text-text-muted tracking-widest mb-2">Total Active Salons</p>
           <h3 className="text-5xl font-black text-white">{approvedSalons.length}</h3>
        </div>
        <div className="bg-background-card border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-electric-cyan/30 transition-colors">
           <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity"><Clock size={120} /></div>
           <p className="text-xs font-black uppercase text-text-muted tracking-widest mb-2">Pending Requests</p>
           <h3 className="text-5xl font-black text-white">{pendingSalons.length}</h3>
        </div>
        <div className="bg-background-card border border-white/5 p-6 rounded-3xl relative overflow-hidden group hover:border-white/20 transition-colors">
           <div className="absolute -right-6 -top-6 opacity-5 group-hover:opacity-10 transition-opacity"><Radio size={120} /></div>
           <p className="text-xs font-black uppercase text-text-muted tracking-widest mb-2">Monitored Cameras</p>
           <h3 className="text-5xl font-black text-white">{heartbeats.length}</h3>
        </div>
      </div>

      {/* Audit Log */}
      <h3 className="text-sm font-black uppercase tracking-widest text-text-muted border-b border-white/10 pb-2 mb-4">Approval Audit Log</h3>
      <div className="bg-background-panel rounded-2xl border border-white/5 p-2 overflow-x-auto">
         <table className="w-full text-left text-sm text-text-muted">
           <thead>
             <tr className="border-b border-white/5 uppercase text-[10px] tracking-widest">
               <th className="p-4">Salon Name</th>
               <th className="p-4">Approved By</th>
               <th className="p-4">Time</th>
             </tr>
           </thead>
           <tbody>
             {approvedSalons.slice(0, 5).map(s => (
               <tr key={s.id} className="border-b border-white/5 bg-white/[0.01] hover:bg-white/[0.05] transition-colors">
                 <td className="p-4 font-bold text-white">{s.name}</td>
                 <td className="p-4 font-mono text-electric-cyan">{s.approved_by || 'Unknown'}</td>
                 <td className="p-4">{s.approved_at ? new Date(s.approved_at).toLocaleString() : 'N/A'}</td>
               </tr>
             ))}
             {approvedSalons.length === 0 && (
               <tr><td colSpan="3" className="p-4 text-center">No audit records found.</td></tr>
             )}
           </tbody>
         </table>
      </div>
    </div>
  );

  // SUB-RENDER: Pending Requests (With Sidebar)
  const renderPending = () => (
    <div className="flex gap-6 relative animate-in fade-in slide-in-from-bottom-4 duration-500 h-full">
      {/* Left List */}
      <div className={`flex-1 transition-all duration-300 ${selectedPending ? 'hidden lg:block lg:w-2/3' : 'w-full'}`}>
         {pendingSalons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 border border-dashed border-white/10 rounded-[32px] text-text-muted">
               <CheckCircle size={48} className="mb-4 opacity-50" />
               <p className="font-bold tracking-widest uppercase">No pending requests</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-4">
              {pendingSalons.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setSelectedPending(s)}
                  className={`cursor-pointer p-5 bg-background-card border rounded-2xl flex items-center justify-between transition-all ${selectedPending?.id === s.id ? 'border-electric-cyan bg-electric-cyan/5' : 'border-white/5 hover:border-white/20'}`}
                >
                   <div>
                     <h4 className="font-black text-white text-lg">{s.name}</h4>
                     <p className="text-xs text-text-muted flex items-center gap-1 mt-1"><MapPin size={12}/> {s.location || 'Unknown'}</p>
                   </div>
                   <div className="bg-yellow-500/10 text-yellow-500 px-3 py-1 rounded text-xs font-bold uppercase tracking-widest">Needs Review</div>
                </div>
              ))}
            </div>
         )}
      </div>

      {/* Verification Sidebar (Right) */}
      <AnimatePresence>
        {selectedPending && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="w-full lg:w-1/3 bg-background-panel border border-white/10 rounded-[32px] p-6 lg:sticky lg:top-8 h-fit shadow-2xl flex flex-col gap-6"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="font-black uppercase tracking-widest text-sm flex items-center gap-2"><Shield size={16} className="text-electric-cyan"/> KYC Verification</h3>
              <button onClick={() => setSelectedPending(null)} className="text-text-muted hover:text-white"><XCircle size={20}/></button>
            </div>

            <div className="space-y-4">
              <div><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Salon Name</p><p className="text-white font-bold">{selectedPending.name}</p></div>
              <div><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Location String</p><p className="text-white text-sm">{selectedPending.location || 'N/A'}</p></div>
              <div><p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Database ID</p><p className="font-mono text-xs text-electric-cyan">{selectedPending.id}</p></div>
            </div>

            {/* Document Placeholder */}
            <div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Business Record</p>
              <div className="border border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center bg-white/5 h-40">
                <Lock className="text-electric-cyan mb-2" size={32} opacity={0.5} />
                <span className="font-bold text-xs tracking-widest text-text-muted">PENDING VERIFICATION</span>
                <span className="text-[10px] text-text-muted/50 mt-1">Document integration slot</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-white/5">
               <button onClick={() => handleApprove(selectedPending.id)} className="flex-1 bg-white text-black font-black uppercase text-xs tracking-widest py-3 rounded-xl hover:bg-electric-cyan transition-all flex justify-center items-center gap-2 shadow-[0_0_15px_rgba(0,245,255,0.2)]">
                  <CheckCircle size={14} /> Approve
               </button>
               <button onClick={() => handleReject(selectedPending.id)} className="flex-1 bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase text-xs tracking-widest py-3 rounded-xl hover:bg-red-500 hover:text-white transition-all flex justify-center items-center gap-2">
                  <XCircle size={14} /> Deny
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // SUB-RENDER: Heartbeats
  const renderHeartbeats = () => (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {heartbeats.map(hb => {
            const status = getPulseStatus(hb.last_pulse);
            return (
              <div key={hb.salon_id} className={`p-6 rounded-3xl border transition-all ${status.bg}`}>
                 <div className="flex justify-between items-start mb-4">
                   <h4 className="font-black text-white text-lg leading-tight w-2/3">{hb.salon_name}</h4>
                   <Radio size={24} className={status.color} />
                 </div>
                 <div className="space-y-1">
                   <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Last Pulse</p>
                   <p className={`font-mono text-sm ${status.color}`}>
                     {hb.last_pulse ? new Date(hb.last_pulse).toLocaleTimeString() : 'Never'}
                   </p>
                 </div>
                 <div className={`mt-4 inline-block px-3 py-1 bg-black/40 rounded text-[10px] font-black tracking-widest ${status.color}`}>
                   {status.label}
                 </div>
              </div>
            );
         })}
         {heartbeats.length === 0 && (
            <div className="col-span-full text-center py-24 text-text-muted font-bold tracking-widest border border-dashed border-white/10 rounded-3xl">NO ACTIVE CAMERAS FOUND</div>
         )}
       </div>
    </div>
  );

  // ------------------------------------------
  // MAIN LAYOUT
  // ------------------------------------------
  return (
    <div className="bg-[#050505] min-h-screen text-text-main flex flex-col md:flex-row">
       {/* Error Toast */}
       {error && <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-xl border border-red-400">{error}</div>}
       
       {/* Fixed Sidebar */}
       <aside className="w-full md:w-64 md:fixed md:h-screen bg-background-panel/80 backdrop-blur-3xl border-r border-white/5 flex flex-col p-6 z-40">
         <div className="flex flex-col items-center mb-10 pb-6 border-b border-white/5 pt-4">
            <div className="w-16 h-16 bg-gradient-to-tr from-electric-cyan to-blue-600 rounded-full flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(0,245,255,0.4)]">
              <Shield className="text-white" size={32} />
            </div>
            <h1 className="font-black uppercase tracking-widest text-sm text-white text-center">Root Access</h1>
            <p className="text-[10px] font-mono text-electric-cyan mt-1">SYS.ADMIN</p>
         </div>

         <nav className="flex-1 space-y-2">
            <SidebarBtn icon={<LayoutDashboard size={18}/>} label="Dashboard" active={activeTab==='dashboard'} onClick={()=>setActiveTab('dashboard')} />
            <SidebarBtn icon={<Clock size={18}/>} label="Pending Requests" active={activeTab==='pending'} onClick={async ()=>{ setActiveTab('pending'); setSelectedPending(null); await fetchAllData(); }} />
            <SidebarBtn icon={<Radio size={18}/>} label="Camera Pulses" active={activeTab==='heartbeats'} onClick={()=>{ setActiveTab('heartbeats'); fetchAllData(); }} />
         </nav>

         <button onClick={logout} className="mt-8 flex items-center gap-3 w-full p-3 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-bold text-xs uppercase tracking-widest">
            <LogOut size={16} /> Secure Logout
         </button>
       </aside>

       {/* Main Content Area */}
       <main className="flex-1 md:ml-64 p-6 lg:p-12 relative min-h-screen">
          {/* Header Title based on Tab */}
          <header className="mb-10 flex justify-between items-end border-b border-white/5 pb-4">
             <div>
               <h2 className="text-3xl font-black text-white capitalize tracking-tighter">{activeTab.replace('-', ' ')}</h2>
               <p className="text-xs font-bold text-text-muted uppercase tracking-widest mt-1 text-electric-cyan">Real-time Command Feed</p>
             </div>
             {loading && <div className="w-5 h-5 border-2 border-electric-cyan border-t-transparent rounded-full animate-spin"></div>}
          </header>

          {/* Render Active View */}
          <div className="h-full">
            {activeTab === 'dashboard' && renderOverview()}
            {activeTab === 'pending' && renderPending()}
            {activeTab === 'heartbeats' && renderHeartbeats()}
          </div>
       </main>
    </div>
  );
}

const SidebarBtn = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all ${active ? 'bg-electric-cyan/10 text-electric-cyan border border-electric-cyan/20' : 'text-text-muted hover:bg-white/5 hover:text-white border border-transparent'}`}
  >
    {icon} {label}
  </button>
);
