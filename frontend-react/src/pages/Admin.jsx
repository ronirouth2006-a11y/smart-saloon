import { useState, useEffect, useMemo } from 'react';
import { Shield, CheckCircle, XCircle, Clock, ExternalLink, Image as ImageIcon, Search, Trash2, MapPin, ListFilter, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

export default function Admin() {
  const [salons, setSalons] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'manage'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      const endpoint = tab === 'pending' ? '/admin/salons/pending' : '/admin/salons/approved';
      const res = await api.get(endpoint);
      setSalons(res.data);
    } catch (err) {
      setError(`Failed to load ${tab} salons`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccessMsg('');
      await api.put(`/admin/salons/${id}/approve`);
      setSuccessMsg(`Salon approved successfully!`);
      setSalons(salons.filter(s => s.id !== id));
    } catch (err) {
      setError('Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to REJECT this listing? It will no longer appear in your pending queue.")) return;
    try {
      setError('');
      setSuccessMsg('');
      await api.delete(`/admin/salons/${id}/reject`);
      setSuccessMsg(`Registration rejected.`);
      setSalons(salons.filter(s => s.id !== id));
    } catch (err) {
      setError('Reject failed');
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE "${name}"? This cannot be undone!`)) return;
    try {
      setError('');
      setSuccessMsg('');
      await api.delete(`/admin/salons/${id}/permanent`);
      setSuccessMsg(`Salon "${name}" deleted permanently.`);
      setSalons(salons.filter(s => s.id !== id));
    } catch (err) {
      setError('Deletion failed');
    }
  };

  const filteredSalons = useMemo(() => {
    if (!locationSearch) return salons;
    return salons.filter(s => 
      s.location.toLowerCase().includes(locationSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [salons, locationSearch]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="bg-background min-h-screen text-text-main pb-24 lg:pb-12">
      <div className="max-w-[1200px] mx-auto px-6 pt-12">
        
        {/* 🛡️ ADMIN HEADER */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-electric-cyan/10 ring-1 ring-electric-cyan/20 rounded-[30px] shadow-[0_0_40px_rgba(0,245,255,0.1)]">
              <Shield size={48} className="text-electric-cyan" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter m-0 uppercase italic">Control <span className="text-electric-cyan">Center</span></h1>
              <p className="text-text-muted font-bold tracking-widest text-[10px] uppercase mt-2">Oversee infrastructure & registration flow</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-background-panel p-2 rounded-[24px] border border-white/5 shadow-2xl">
            <TabButton 
              active={activeTab === 'pending'} 
              onClick={() => setActiveTab('pending')}
              icon={<Clock size={16} />}
              label="Pending"
              count={activeTab === 'pending' ? salons.length : null}
            />
            <TabButton 
              active={activeTab === 'manage'} 
              onClick={() => setActiveTab('manage')}
              icon={<ListFilter size={16} />}
              label="Inventory"
            />
          </div>
        </header>

        {/* 🔍 GLOBAL SEARCH (Glassmorphism) */}
        <div className="mb-10 relative group">
          <Search size={22} className="absolute left-6 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-electric-cyan transition-colors" />
          <input 
            className="w-full bg-background-panel/50 backdrop-blur-2xl border border-white/5 rounded-[24px] py-6 pl-16 pr-8 text-lg font-medium focus:outline-none focus:border-electric-cyan/40 focus:ring-4 focus:ring-electric-cyan/5 transition-all shadow-xl"
            placeholder={activeTab === 'pending' ? "Quick search pending..." : "Search salon inventory..."}
            value={locationSearch}
            onChange={(e) => setLocationSearch(e.target.value)}
          />
        </div>

        {/* NOTIFICATIONS */}
        <AnimatePresence>
          {error && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-500/10 border border-red-500/20 text-red-400 p-5 rounded-2xl mb-6 font-bold flex items-center gap-3">
              <XCircle size={20} /> {error}
            </motion.div>
          )}
          {successMsg && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-electric-green/10 border border-electric-green/20 text-electric-green p-5 rounded-2xl mb-6 font-bold flex items-center gap-3">
              <CheckCircle size={20} /> {successMsg}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📋 DATA GRID */}
        {loading && salons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
             <div className="w-12 h-12 border-4 border-electric-cyan/20 border-t-electric-cyan rounded-full animate-spin"></div>
             <p className="font-black text-[10px] uppercase tracking-[0.3em] text-text-muted">Analyzing Records...</p>
          </div>
        ) : filteredSalons.length === 0 ? (
          <div className="text-center py-32 bg-background-panel/30 border border-dashed border-white/5 rounded-[40px]">
             <Activity size={64} className="mx-auto text-text-muted/20 mb-6" />
             <h3 className="text-2xl font-black text-text-muted">Zero Records Found</h3>
             <p className="text-text-muted/60 text-sm max-w-xs mx-auto">No results matching your current filters or pending queue.</p>
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {filteredSalons.map(salon => (
              <motion.div 
                key={salon.id}
                variants={itemVariants}
                className="group p-6 bg-background-card/40 border border-white/5 rounded-[32px] hover:bg-white/5 hover:border-white/10 transition-all duration-300 relative overflow-hidden flex flex-col sm:flex-row gap-6"
              >
                {/* Visual Identity */}
                <div className="w-full sm:w-32 h-32 bg-charcoal-dark rounded-2xl overflow-hidden border border-white/5 shrink-0 flex items-center justify-center">
                   {salon.storefront_photo_url ? (
                     <img src={`${api.defaults.baseURL}${salon.storefront_photo_url}`} alt="Icon" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                   ) : (
                     <ImageIcon size={32} className="text-white/10" />
                   )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col justify-between py-1">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="text-xl font-black m-0 tracking-tight group-hover:text-electric-cyan transition-colors">{salon.name}</h3>
                       <span className="text-[10px] font-black font-mono text-text-muted/40 uppercase">ID_{salon.id.slice(-6)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-text-muted text-xs font-bold mb-4">
                       <MapPin size={12} className="text-electric-green" /> {salon.location || "Bengal, India"}
                    </div>
                  </div>

                  <div className="flex gap-2">
                     {activeTab === 'pending' ? (
                       <>
                         <button onClick={() => handleApprove(salon.id)} className="flex-1 bg-electric-green text-black font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-electric-neon transition-all flex items-center justify-center gap-2">
                           <CheckCircle size={14} /> Approve
                         </button>
                         <button onClick={() => handleReject(salon.id)} className="flex-1 bg-white/5 border border-white/10 text-red-400 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
                           <XCircle size={14} /> Reject
                         </button>
                       </>
                     ) : (
                       <>
                          <a 
                            href={`https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`} 
                            target="_blank" rel="noreferrer"
                            className="flex-1 bg-white/5 border border-white/10 text-electric-cyan font-black text-[10px] uppercase tracking-widest py-3 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                          >
                            <ExternalLink size={14} /> Map
                          </a>
                          <button 
                            onClick={() => handlePermanentDelete(salon.id, salon.name)} 
                            className="p-3 bg-white/2 hover:bg-red-500/10 text-red-500/40 hover:text-red-500 transition-all rounded-xl"
                          >
                            <Trash2 size={16} />
                          </button>
                       </>
                     )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label, count }) => (
  <button 
    onClick={onClick}
    className={`
      flex items-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] transition-all
      ${active ? 'bg-electric-cyan text-black shadow-[0_4px_20px_rgba(0,245,255,0.3)]' : 'text-text-muted hover:bg-white/5'}
    `}
  >
    {icon} {label} {count !== null && <span className="ml-1 opacity-50">[{count}]</span>}
  </button>
);
