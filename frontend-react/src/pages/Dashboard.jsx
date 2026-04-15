import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Power, LogOut, Activity, TrendingUp, 
  Download, Users as UsersIcon, Settings as SettingsIcon, Plus, 
  Trash2, MapPin, QrCode, ShieldCheck, Zap, ChevronRight, 
  ArrowUpRight, Clock, Box, Layers, Scissors, Camera,
  Store, Phone, Navigation, RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useSpring, useTransform, animate } from 'framer-motion';
import api from '../api';

function CountUp({ value, duration = 2 }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration,
      onUpdate(value) {
        setCount(Math.floor(value));
      },
    });
    return () => controls.stop();
  }, [value, duration]);

  return <>{count}</>;
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); 
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [isApproved, setIsApproved] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);
  const [cameraCount, setCameraCount] = useState(0);
  const [manualOffset, setManualOffset] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeAgo, setTimeAgo] = useState('');
  const [isPulseWeak, setIsPulseWeak] = useState(false);
  const [salonName, setSalonName] = useState('');
  const [maxLimit, setMaxLimit] = useState(8);
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  const [barbers, setBarbers] = useState([]);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecs, setNewBarberSpecs] = useState('');

  const navigate = useNavigate();
  const ownerStr = localStorage.getItem('owner');
  const activeSalonId = ownerStr ? JSON.parse(ownerStr).id || "" : "";

  useEffect(() => {
    if (!ownerStr) { navigate('/owner/login'); return; }
    const owner = JSON.parse(ownerStr);
    const salonId = owner.id || "";

    api.get('/owner/salon')
      .then(res => {
        setSalonName(res.data.name ?? '');
        setPhone(res.data.assistant_phone ?? '');
        setMaxLimit(res.data.max_limit ?? 8);
        setLat(res.data.latitude ?? '');
        setLon(res.data.longitude ?? '');
        setIsApproved(res.data.is_approved ?? true);
        setIsActive(res.data.is_active ?? false);
        setManualOffset(res.data.manual_offset ?? 0);
      })
      .catch(err => console.error("Owner salon fetch fail", err));
    
    api.get(`/owner/analytics/${salonId}/weekly`)
      .then(res => { setHourlyData(res.data.hourly); setDailyData(res.data.daily); })
      .catch(err => console.error("Analytics fetch fail", err));

    api.get('/owner/barbers')
      .then(res => setBarbers(res.data))
      .catch(err => console.error("Barber fetch fail", err));

    api.get(`/public/salons/${salonId}`)
      .then(res => {
        setSalonName(res.data.name ?? '');
        setIsActive(res.data.is_active ?? false);
        setCurrentCount(res.data.current_count ?? 0);
        setCameraCount(res.data.camera_count ?? 0);
        setManualOffset(res.data.manual_offset ?? 0);
        setLastUpdated(res.data.last_updated_at);
      })
      .catch(err => console.error("Initial load fail", err));

    const interval = setInterval(() => {
      api.get(`/public/salons/${salonId}`)
        .then(res => {
          setIsActive(res.data.is_active || false);
          setCameraCount(res.data.camera_count ?? 0);
          setManualOffset(res.data.manual_offset ?? 0);
          setLastUpdated(res.data.last_updated_at);
          setCurrentCount(res.data.current_count ?? 0);
        })
        .catch(err => console.error("Polling error", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate, ownerStr]);
  
  useEffect(() => {
    if (!lastUpdated) return;
    const updateTimer = () => {
      if (!lastUpdated) { setTimeAgo('Never'); return; }
      const now = new Date();
      const last = new Date(lastUpdated);
      const diffInSeconds = Math.floor((now - last) / 1000);
      
      if (diffInSeconds < 0) setTimeAgo('Just now');
      else if (diffInSeconds < 60) setTimeAgo(`${diffInSeconds}s ago`);
      else if (diffInSeconds < 3600) setTimeAgo(`${Math.floor(diffInSeconds / 60)}m ago`);
      else setTimeAgo(`${Math.floor(diffInSeconds / 3600)}h ago`);
      
      setIsPulseWeak(diffInSeconds > 300); // 5 minute threshold for premium UI
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      await api.put(`/owner/toggle-status`, { is_active: !isActive });
      setIsActive(!isActive);
    } catch (err) { console.error('Status toggle failed'); }
    finally { setLoading(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner');
    navigate('/owner/login');
  };

  const updateOffset = async (newOffset) => {
    if (newOffset < 0) return;
    try {
      setManualOffset(newOffset);
      setCurrentCount(cameraCount + newOffset);
      await api.patch(`/owner/salon`, { manual_offset: newOffset });
    } catch (err) {
      console.error('Offset update failed');
    }
  };

  const addBarber = async () => {
    if (!newBarberName || !newBarberSpecs) return;
    try {
       const res = await api.post('/owner/barbers', { name: newBarberName, specialty: newBarberSpecs });
       setBarbers([...barbers, res.data]);
       setNewBarberName('');
       setNewBarberSpecs('');
    } catch (err) { console.error('Barber deploy fail'); }
  };

  const removeBarber = async (id) => {
    try {
       await api.delete(`/owner/barbers/${id}`);
       setBarbers(barbers.filter(b => b.id !== id));
    } catch (err) { console.error('Barber removal fail'); }
  };

  const updateSettings = async () => {
    setLoading(true);
    try {
       await api.patch('/owner/salon', {
          name: salonName,
          assistant_phone: phone,
          max_limit: parseInt(maxLimit),
          latitude: parseFloat(lat),
          longitude: parseFloat(lon)
       });
       alert('Neural settings updated.');
    } catch (err) { alert('Protocol update failed.'); }
    finally { setLoading(false); }
  };

  const downloadQRCode = () => {
    const node = document.getElementById('qr-scan-container');
    if (!node) return;
    htmlToImage.toPng(node).then(dataUrl => {
        const link = document.createElement('a');
        link.download = `smart-saloon-access-${activeSalonId}.png`;
        link.href = dataUrl;
        link.click();
    });
  };

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans selection:bg-primary/20 pb-40">
      <div className="max-w-[1400px] mx-auto px-10 pt-20">
        
        {/* 🚀 DASHBOARD HEADER */}
        <header className="mb-16 flex flex-col xl:flex-row xl:items-end justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-primary/10 border border-primary/20 rounded-[40px] shadow-premium">
              <ShieldCheck size={56} className="text-primary" />
            </div>
            <div>
              <h1 className="text-5xl font-heading font-black tracking-tighter uppercase italic leading-none">{salonName || "HQ Node"} <span className="text-primary italic">OS</span></h1>
              <div className="flex items-center gap-4 mt-3">
                 <span className="text-text-muted font-bold tracking-[0.2em] text-[10px] uppercase">Control Layer Alpha • V.4.0</span>
                 <div className="w-1.5 h-1.5 rounded-full bg-border-subtle" />
                 <span className="text-primary font-black text-[10px] uppercase tracking-[0.2em]">IDENT: {activeSalonId.slice(-8).toUpperCase()}</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-background-panel p-2 rounded-[32px] border border-border-subtle shadow-premium">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={18} />} label="Telemetry" />
              <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<UsersIcon size={18} />} label="Personnel" />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={18} />} label="Neural Config" />
            </div>
            <button onClick={handleLogout} className="p-5 bg-white/5 hover:bg-danger/10 text-text-dim hover:text-danger rounded-3xl transition-smooth border border-border-subtle group">
              <LogOut size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
               key="telemetry" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
               className="space-y-10"
            >
              {/* 📊 TELEMETRY KPI GRID */}
              <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                 
                 {/* Live Population Hub */}
                 <div className="xl:col-span-3 p-10 bg-background-card border border-border-subtle rounded-[56px] shadow-premium relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] -z-10 rounded-full" />
                    
                    <div className="flex justify-between items-start mb-12">
                       <div>
                          <h3 className="text-3xl font-heading font-black m-0 mb-2 uppercase tracking-tight">Active Inhabitants</h3>
                          <p className="text-text-dim font-bold text-[10px] uppercase tracking-[0.3em]">Real-time Hybrid Aggregate</p>
                       </div>
                       <motion.div 
                         initial={false}
                         animate={{ backgroundColor: isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
                         className={`px-6 py-3 rounded-2xl text-[10px] font-black tracking-[0.2em] border uppercase transition-smooth ${isActive ? 'text-primary border-primary/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'text-danger border-danger/20'}`}
                       >
                          {isActive ? 'Neural Link Active' : 'Protocol Suspended'}
                       </motion.div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center gap-16 py-6">
                       <div className="text-center md:text-left flex-1">
                          <span className="block text-[10px] font-black text-text-dim uppercase tracking-[0.25em] mb-4">AI Vision Stream</span>
                          <span className="text-8xl font-heading font-black text-text-main tracking-tighter">
                             <CountUp value={cameraCount} />
                          </span>
                       </div>
                       <div className="text-border-subtle text-5xl font-light opacity-50">+</div>
                       <div className="text-center md:text-left">
                          <span className="block text-[10px] font-black text-text-dim uppercase tracking-[0.25em] mb-4">Manual Offset Override</span>
                          <div className="flex items-center gap-6 bg-background-main/50 p-3 rounded-[32px] border border-border-subtle">
                             <button onClick={() => updateOffset(manualOffset - 1)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-smooth text-text-dim hover:text-text-main"><Plus size={20} className="rotate-45" /></button>
                             <span className="text-5xl font-heading font-black text-accent min-w-[50px] text-center">{manualOffset}</span>
                             <button onClick={() => updateOffset(manualOffset + 1)} className="p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-smooth text-text-dim hover:text-text-main"><Plus size={20} /></button>
                          </div>
                       </div>
                       <div className="text-border-subtle text-5xl font-light opacity-50">=</div>
                       <div className="text-center md:text-right flex-1">
                          <span className="block text-xs font-black text-primary uppercase tracking-[0.3em] mb-3">Net Population</span>
                          <span className="text-9xl font-heading font-black text-primary drop-shadow-[0_0_40px_rgba(16,185,129,0.3)] tracking-tighter leading-none">
                             <CountUp value={currentCount} />
                          </span>
                       </div>
                    </div>

                    <div className="mt-12 flex items-center gap-3 text-[10px] font-black text-text-dim uppercase tracking-widest pt-8 border-t border-border-subtle group-hover:text-text-main transition-colors">
                       <RefreshCw size={14} className={isActive && !isPulseWeak ? 'animate-spin text-primary' : ''} />
                       Last Sync Sequence: {timeAgo} • Integrity: {isPulseWeak ? 'Unstable' : 'Optimal'}
                    </div>
                 </div>

                 {/* Operational Switch */}
                 <div className={`
                    p-10 rounded-[56px] flex flex-col items-center justify-center gap-8 transition-smooth border relative overflow-hidden group
                    ${isActive ? 'bg-danger/5 border-danger/10 hover:border-danger/20' : 'bg-primary/10 border-primary/20 shadow-premium hover:border-primary/40'}
                 `}>
                    <div className={`p-10 rounded-full border-4 transition-smooth border-white/5 ${isActive ? 'text-danger' : 'text-primary'}`}>
                       <Power size={72} strokeWidth={2.5} />
                    </div>
                    <div className="text-center space-y-2">
                       <h4 className="text-2xl font-heading font-black uppercase tracking-tight">{isActive ? 'Deactivate Node' : 'Initialize Node'}</h4>
                       <p className="text-[10px] text-text-dim font-bold uppercase tracking-widest">Visibility on Global Map</p>
                    </div>
                    <button 
                      onClick={toggleStatus}
                      disabled={loading || !isApproved}
                      className={`w-full py-6 rounded-[32px] font-black text-xs tracking-[0.2em] uppercase transition-smooth shadow-premium active:scale-95 ${isActive ? 'bg-danger text-white hover:bg-danger/80' : 'bg-primary text-background-main hover:bg-primary/90'}`}
                    >
                       {loading ? 'MODULATING...' : (isActive ? 'SHUTDOWN PROTOCOL' : 'AUTHORIZE GO-LIVE')}
                    </button>
                    {!isApproved && <p className="absolute bottom-6 text-[9px] font-black text-danger uppercase tracking-widest">Awaiting Admin Verification</p>}
                 </div>
              </div>

              {/* ⚡ ANALYTICS ENGINE */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                 <div className="p-10 bg-background-card border border-border-subtle rounded-[56px] shadow-premium flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-12">
                       <div className="flex items-center gap-3">
                          <Zap size={24} className="text-accent" />
                          <h4 className="text-xl font-heading font-black uppercase tracking-tight">Hourly Flow Dynamics</h4>
                       </div>
                       <div className="px-4 py-2 bg-accent/5 text-accent text-[9px] font-black uppercase tracking-widest rounded-xl border border-accent/10">TELEMETRY DATA</div>
                    </div>
                    <div className="flex-1">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyData}>
                             <defs>
                                <linearGradient id="primaryWave" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                   <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
                             <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 10, fontWeight: '800'}} />
                             <Tooltip 
                                cursor={{ stroke: 'var(--primary)', strokeWidth: 1 }}
                                contentStyle={{backgroundColor: 'var(--background-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', boxShadow: 'var(--shadow-premium)'}}
                                itemStyle={{color: 'var(--primary)', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px'}}
                             />
                             <Area type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={4} fillOpacity={1} fill="url(#primaryWave)" animationDuration={2000} />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="p-10 bg-background-card border border-border-subtle rounded-[56px] shadow-premium flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-12">
                       <div className="flex items-center gap-3">
                          <TrendingUp size={24} className="text-primary" />
                          <h4 className="text-xl font-heading font-black uppercase tracking-tight">Weekly Meta Distribution</h4>
                       </div>
                    </div>
                    <div className="flex-1">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyData}>
                             <CartesianGrid strokeDasharray="6 6" vertical={false} stroke="rgba(255,255,255,0.03)" />
                             <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: 'var(--text-dim)', fontSize: 10, fontWeight: '800'}} />
                             <Tooltip 
                                cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                                contentStyle={{backgroundColor: 'var(--background-card)', border: '1px solid var(--border-subtle)', borderRadius: '24px', boxShadow: 'var(--shadow-premium)'}}
                                itemStyle={{color: 'var(--accent)', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px'}}
                             />
                             <Bar dataKey="footfall" fill="var(--primary)" radius={[12, 12, 0, 0]} barSize={32} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </div>

              {/* 🔳 QR ACCESS PORTAL */}
              <div className="p-12 bg-background-panel border border-border-subtle rounded-[56px] flex flex-col lg:flex-row items-center gap-16 shadow-premium group">
                 <div id="qr-scan-container" className="p-10 bg-white rounded-[48px] group-hover:scale-105 transition-smooth shadow-[0_0_60px_rgba(255,255,255,0.05)] shrink-0">
                    <QRCodeSVG value={`https://smart-saloon.onrender.app/salons/${activeSalonId}`} size={240} fgColor="#0F172A" level="H" includeMargin={false} />
                 </div>
                 <div className="text-center lg:text-left space-y-6 flex-1">
                    <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                       <QrCode size={24} />
                       <h3 className="text-lg font-heading font-black uppercase tracking-widest">Portal Architecture</h3>
                    </div>
                    <h2 className="text-4xl font-heading font-black tracking-tighter uppercase leading-tight">Instant Discovery <br/> <span className="text-primary italic">Zero Latency.</span></h2>
                    <p className="text-text-dim font-medium text-lg leading-relaxed max-w-2xl">Deploy this visual gate key at your physical storefront. Customers gain instant transparency into your wait-times and staff availability without needing an interface installation.</p>
                    <button onClick={downloadQRCode} className="bg-background-main border border-border-subtle text-text-main px-10 py-5 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-background-main transition-smooth flex items-center justify-center lg:justify-start gap-4 mx-auto lg:mx-0 group shadow-premium">
                       <Download size={20} className="group-hover:translate-y-1 transition-transform" /> Export Master Asset (PNG)
                    </button>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.div 
               key="personnel" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
               className="p-14 bg-background-card border border-border-subtle rounded-[64px] shadow-premium"
            >
              <div className="flex items-center justify-between mb-16">
                 <div className="flex items-center gap-5">
                    <div className="p-4 bg-primary/10 rounded-3xl text-primary border border-primary/20">
                       <UsersIcon size={32} />
                    </div>
                    <div>
                       <h2 className="text-4xl font-heading font-black tracking-tight uppercase leading-none">Global Personnel</h2>
                       <p className="text-[10px] text-text-dim font-black uppercase tracking-[0.3em] mt-3">{barbers.length} Active High-Frequency Operators</p>
                    </div>
                 </div>
                 <button onClick={() => setActiveTab('overview')} className="hidden md:flex items-center gap-2 text-text-dim hover:text-primary transition-colors text-[10px] font-black uppercase tracking-widest"><Clock size={16}/> View Activity</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                 {/* Deployment Module */}
                 <div className="p-10 bg-background-panel rounded-[40px] border border-dashed border-border-subtle flex flex-col gap-6 group hover:border-primary/40 transition-smooth">
                    <div className="space-y-4">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-dim ml-2">MEMBER IDENTITY</label>
                          <input className="w-full bg-background-main/50 border border-border-subtle rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-primary/50 transition-smooth" placeholder="e.g. Victor Nova" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-dim ml-2">CORE CAPABILITY</label>
                          <input className="w-full bg-background-main/50 border border-border-subtle rounded-2xl py-4 px-6 text-sm font-bold focus:outline-none focus:border-primary/50 transition-smooth" placeholder="e.g. Precision Fade" value={newBarberSpecs} onChange={e => setNewBarberSpecs(e.target.value)} />
                       </div>
                    </div>
                    <button onClick={addBarber} className="bg-primary text-background-main w-full py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth flex items-center justify-center gap-3">
                       <Plus size={18} /> Deploy Personnel
                    </button>
                 </div>

                 {barbers.map((b) => (
                    <motion.div key={b.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-10 bg-background-main border border-border-subtle rounded-[40px] group relative overflow-hidden hover:border-primary/30 transition-smooth flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-2xl font-heading font-black tracking-tight leading-none mb-3">{b.name}</h4>
                             <div className="px-3 py-1.5 bg-accent/5 text-accent text-[9px] font-black tracking-widest uppercase rounded-lg border border-accent/10">{b.specialty}</div>
                          </div>
                          <button onClick={() => removeBarber(b.id)} className="p-4 bg-white/5 text-text-dim hover:text-danger rounded-2xl opacity-0 group-hover:opacity-100 transition-smooth shadow-premium">
                             <Trash2 size={18} />
                          </button>
                       </div>
                       <div className="mt-12 flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                          <div className="w-2 h-2 rounded-full bg-primary pulse-primary" />
                          <span className="text-[10px] font-black text-text-dim uppercase tracking-widest">Active On Station</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
               key="config" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
               className="p-14 bg-background-card border border-border-subtle rounded-[64px] shadow-premium max-w-4xl mx-auto"
            >
               <div className="flex items-center gap-5 mb-16">
                 <div className="p-4 bg-accent/10 rounded-3xl text-accent border border-accent/20">
                    <SettingsIcon size={32} />
                 </div>
                 <div>
                    <h2 className="text-4xl font-heading font-black tracking-tight uppercase leading-none">Node Configuration</h2>
                    <p className="text-[10px] text-text-dim font-black uppercase tracking-[0.3em] mt-3">Advanced Parameters & Locational Geocodes</p>
                 </div>
              </div>
              
              <div className="space-y-10">
                 <SettingsInput label="ENTRANCE BRAND IDENTITY" value={salonName} onChange={e => setSalonName(e.target.value)} icon={<Store size={18}/>} />
                 <SettingsInput label="OPERATIONAL CAPACITY LIMIT" type="number" value={maxLimit} onChange={e => setMaxLimit(e.target.value)} icon={<Box size={18}/>} />
                 <SettingsInput label="SECURE TELEMETRY PHONE" value={phone} onChange={e => setPhone(e.target.value)} icon={<Phone size={18}/>} />
                 <div className="grid grid-cols-2 gap-8">
                    <SettingsInput label="LONG-LAT SEQUENCE" value={lat} onChange={e => setLat(e.target.value)} icon={<Navigation size={18}/>} />
                    <SettingsInput label="GEO-LONGITUDE" value={lon} onChange={e => setLon(e.target.value)} icon={<Navigation size={18}/>} />
                 </div>
                 <div className="pt-8 flex flex-col gap-4">
                    <button onClick={updateSettings} className="w-full bg-primary text-background-main py-6 rounded-[32px] font-black text-xs uppercase tracking-[0.25em] shadow-premium hover:shadow-[0_0_30px_var(--primary-glow)] transition-smooth">
                       Commit Neural Update
                    </button>
                    <p className="text-center text-[10px] text-text-dim font-bold uppercase tracking-widest">Protocol modifications are audited by system administration.</p>
                 </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-3 px-8 py-4 rounded-[24px] text-[10px] font-black uppercase tracking-[0.2em] transition-smooth ${active ? 'bg-white text-background-main shadow-premium' : 'text-text-dim hover:text-text-main'}`}>
    {icon} {label}
  </button>
);

const SettingsInput = ({ label, icon, ...props }) => (
  <div className="space-y-4">
    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-text-dim ml-3">{label}</label>
    <div className="relative group">
       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-smooth">{icon}</div>
       <input {...props} className="w-full bg-background-main/50 border border-border-subtle rounded-[28px] py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-primary/50 transition-smooth text-text-main" />
    </div>
  </div>
);
