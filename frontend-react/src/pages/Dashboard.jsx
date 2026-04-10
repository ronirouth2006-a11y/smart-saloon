import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Power, LogOut, Activity, TrendingUp, BarChart as BarChartIcon, Download, Users as UsersIcon, Settings as SettingsIcon, Plus, Trash2, MapPin, QrCode, ShieldCheck, Zap } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import SkeletonCard from '../components/SkeletonCard';

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // overview, staff, settings
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
  
  // Staff State
  const [barbers, setBarbers] = useState([]);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecs, setNewBarberSpecs] = useState('');

  const navigate = useNavigate();

  // The active salon ID from the owner session
  const ownerStr = localStorage.getItem('owner');
  const activeSalonId = ownerStr ? JSON.parse(ownerStr).id || "" : "";

  useEffect(() => {
    if (!ownerStr) {
      navigate('/owner/login');
      return;
    }
    const owner = JSON.parse(ownerStr);
    const salonId = owner.id || "";
    
    // Fetch analytics data
    api.get(`/owner/analytics/${salonId}/weekly`)
      .then(res => {
          setHourlyData(res.data.hourly);
          setDailyData(res.data.daily);
      })
      .catch(err => console.error("Error fetching analytics", err));

    // Fetch Barbers
    api.get('/owner/barbers')
      .then(res => setBarbers(res.data))
      .catch(err => console.error("Error fetching barbers", err));

    // Fetch Salon Details
    api.get(`/public/salons/${salonId}`)
      .then(res => {
        setSalonName(res.data.name);
        setPhone(res.data.assistant_phone || '');
        setMaxLimit(res.data.max_limit || 8);
        setLat(res.data.latitude || '');
        setLon(res.data.longitude || '');
        if (res.data.hasOwnProperty('is_approved')) setIsApproved(res.data.is_approved);
        setIsActive(res.data.is_active || false);
        setCurrentCount(res.data.current_count || 0);
        setCameraCount(res.data.camera_count || 0);
        setManualOffset(res.data.manual_offset || 0);
        setLastUpdated(res.data.last_updated_at);
      })
      .catch(err => console.error("Error fetching settings", err));

    // 10s Poll
    const interval = setInterval(() => {
      api.get(`/public/salons/${salonId}`)
        .then(res => {
          setIsActive(res.data.is_active || false);
          setCameraCount(res.data.camera_count || 0);
          setManualOffset(res.data.manual_offset || 0);
          setLastUpdated(res.data.last_updated_at);
          setCurrentCount(res.data.current_count || 0);
        })
        .catch(err => console.error("Dashboard poll error", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate, ownerStr]);
  
  // Timer for "time ago"
  useEffect(() => {
    if (!lastUpdated) return;
    const updateTimer = () => {
      const now = new Date();
      const last = new Date(lastUpdated);
      const diffInSeconds = Math.floor((now - last) / 1000);
      if (diffInSeconds < 60) setTimeAgo(`${diffInSeconds}s ago`);
      else setTimeAgo(`${Math.floor(diffInSeconds / 60)}m ${diffInSeconds % 60}s ago`);
      setIsPulseWeak(diffInSeconds > 180);
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
    } catch (err) { alert('Failed to update status'); }
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
      alert('Failed to update offset');
      setManualOffset(manualOffset);
      setCurrentCount(cameraCount + manualOffset);
    }
  };

  const downloadQRCode = () => {
    const node = document.getElementById('qr-scan-container');
    if (!node) return;
    htmlToImage.toPng(node).then(dataUrl => {
        const link = document.createElement('a');
        link.download = `smart-saloon-qr-${activeSalonId}.png`;
        link.href = dataUrl;
        link.click();
    });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } }
  };

  return (
    <div className="bg-background min-h-screen text-text-main pb-20">
      <div className="max-w-[1200px] mx-auto px-6 pt-12">
        
        {/* 🚀 DASHBOARD HEADER */}
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-electric-green/10 ring-1 ring-electric-green/20 rounded-[30px] shadow-[0_0_40px_rgba(46,204,113,0.1)]">
              <ShieldCheck size={48} className="text-electric-green" />
            </div>
            <div>
              <h1 className="text-4xl font-black tracking-tighter m-0 uppercase italic">{salonName || "Salon"} <span className="text-electric-green">HQ</span></h1>
              <p className="text-text-muted font-bold tracking-widest text-[10px] uppercase mt-2">Owner Control Interface • ID_{activeSalonId.slice(-6)}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-background-panel p-2 rounded-[24px] border border-white/5 shadow-2xl">
              <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={<Activity size={16} />} label="Overview" />
              <TabButton active={activeTab === 'staff'} onClick={() => setActiveTab('staff')} icon={<UsersIcon size={16} />} label="Staff" />
              <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} icon={<SettingsIcon size={16} />} label="Settings" />
            </div>
            <button onClick={handleLogout} className="p-4 bg-white/5 hover:bg-red-500/10 text-text-muted hover:text-red-400 rounded-2xl transition-all border border-white/10 group">
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </header>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial="hidden" animate="visible" exit="hidden" variants={containerVariants}
              className="space-y-8"
            >
              {/* PRIMARY STATUS CARD */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Live Crowd Summary */}
                 <div className="lg:col-span-2 p-8 bg-background-panel/50 backdrop-blur-3xl border border-white/5 rounded-[40px] shadow-2xl flex flex-col justify-between overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-electric-green/5 blur-[100px] -z-10 rounded-full" />
                    
                    <div className="flex justify-between items-start">
                       <div>
                          <h3 className="text-3xl font-black m-0 mb-1">Live Population</h3>
                          <p className="text-text-muted font-bold text-xs uppercase tracking-widest">Aggregate Count (AI + Manual)</p>
                       </div>
                       <div className={`px-4 py-2 rounded-xl text-[10px] font-black tracking-widest border transition-all ${isActive ? 'bg-electric-green/10 text-electric-green border-electric-green/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                          {isActive ? 'STORE OPEN' : 'STORE CLOSED'}
                       </div>
                    </div>

                    <div className="flex items-center gap-12 py-8">
                       <div className="text-center">
                          <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">AI Vision</span>
                          <span className="text-6xl font-black text-white">{cameraCount}</span>
                       </div>
                       <div className="text-text-muted text-4xl font-light opacity-20">+</div>
                       <div className="text-center">
                          <span className="block text-[10px] font-black text-text-muted uppercase tracking-widest mb-3">Manual Offset</span>
                          <div className="flex items-center gap-4 bg-white/5 p-2 rounded-2xl border border-white/10">
                             <button onClick={() => updateOffset(manualOffset - 1)} className="p-2 text-text-muted hover:text-white transition-colors"><Plus size={18} className="rotate-45" /></button>
                             <span className="text-3xl font-black text-electric-cyan min-w-[30px]">{manualOffset}</span>
                             <button onClick={() => updateOffset(manualOffset + 1)} className="p-2 text-text-muted hover:text-white transition-colors"><Plus size={18} /></button>
                          </div>
                       </div>
                       <div className="text-text-muted text-4xl font-light opacity-20">=</div>
                       <div className="text-right flex-1">
                          <span className="block text-xs font-black text-electric-green uppercase tracking-[0.2em] mb-2">Total Capacity</span>
                          <span className="text-7xl font-black text-electric-green drop-shadow-[0_0_20px_rgba(46,204,113,0.4)] tracking-tighter">{currentCount}</span>
                       </div>
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-white/5 text-[10px] font-bold text-text-muted italic">
                       <Activity size={14} className={isActive && !isPulseWeak ? 'animate-pulse text-electric-green' : 'text-red-500'} />
                       {isActive ? `Heartbeat active: ${timeAgo}` : "No active signal"}
                    </div>
                 </div>

                 {/* Open/Close Toggle Action */}
                 <div className={`
                    p-8 rounded-[40px] flex flex-col items-center justify-center gap-6 transition-all duration-500 border overflow-hidden relative
                    ${isActive ? 'bg-red-500/5 border-red-500/10' : 'bg-electric-green/10 border-electric-green/20 shadow-[0_0_60px_rgba(46,204,113,0.1)]'}
                 `}>
                    <div className={`p-8 rounded-full border-4 transition-all ${isActive ? 'border-red-500/20 text-red-500' : 'border-electric-green animate-pulse text-electric-green'}`}>
                       <Power size={64} />
                    </div>
                    <div className="text-center">
                       <h4 className="text-xl font-black m-0 mb-1">{isActive ? 'Shutdown Store' : 'Initialize Store'}</h4>
                       <p className="text-xs text-text-muted font-medium">Toggle visibility on public map</p>
                    </div>
                    <button 
                      onClick={toggleStatus}
                      disabled={loading || !isApproved}
                      className={`w-full py-5 rounded-[24px] font-black text-xs tracking-widest uppercase transition-all shadow-2xl active:scale-95 ${isActive ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-electric-green text-black hover:bg-electric-neon'}`}
                    >
                       {loading ? 'MODULATING...' : (isActive ? 'CLOSE NOW' : 'GO LIVE NOW')}
                    </button>
                 </div>
              </motion.div>

              {/* ANALYTICS ENGINE */}
              <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[400px]">
                 <div className="bg-background-panel/30 border border-white/5 rounded-[40px] p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                       <Zap size={20} className="text-electric-cyan" />
                       <h4 className="text-lg font-black m-0 uppercase italic tracking-tighter">Live Velocity Pattern</h4>
                    </div>
                    <div className="flex-1">
                       <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={hourlyData}>
                             <defs>
                                <linearGradient id="colorWave" x1="0" y1="0" x2="0" y2="1">
                                   <stop offset="5%" stopColor="#00f5ff" stopOpacity={0.3}/>
                                   <stop offset="95%" stopColor="#00f5ff" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                             <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                             <Tooltip 
                                contentStyle={{backgroundColor: '#181818', border: '1px solid #333', borderRadius: '12px'}}
                                itemStyle={{color: '#00f5ff', fontWeight: 'bold'}}
                             />
                             <Area type="monotone" dataKey="count" stroke="#00f5ff" strokeWidth={3} fillOpacity={1} fill="url(#colorWave)" />
                          </AreaChart>
                       </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="bg-background-panel/30 border border-white/5 rounded-[40px] p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-8">
                       <TrendingUp size={20} className="text-electric-green" />
                       <h4 className="text-lg font-black m-0 uppercase italic tracking-tighter">7-Day Meta Analysis</h4>
                    </div>
                    <div className="flex-1">
                       <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                             <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                             <Tooltip 
                                contentStyle={{backgroundColor: '#181818', border: '1px solid #333', borderRadius: '12px'}}
                                itemStyle={{color: '#2ecc71', fontWeight: 'bold'}}
                             />
                             <Bar dataKey="footfall" fill="#2ecc71" radius={[8, 8, 0, 0]} barSize={20} />
                          </BarChart>
                       </ResponsiveContainer>
                    </div>
                 </div>
              </motion.div>

              {/* MARKETING KIT: QR ENGINE */}
              <motion.div variants={itemVariants} className="p-10 bg-background-panel/60 border border-white/5 rounded-[40px] flex flex-col md:flex-row items-center gap-12 group">
                 <div id="qr-scan-container" className="p-8 bg-white rounded-[32px] group-hover:scale-105 transition-transform duration-500 shadow-[0_0_50px_rgba(255,255,255,0.1)] shrink-0">
                    <QRCodeSVG value={`https://smart-saloon.onrender.app/salons/${activeSalonId}`} size={200} fgColor="#121212" level="H" />
                 </div>
                 <div className="text-left space-y-4">
                    <div className="flex items-center gap-3">
                       <QrCode size={32} className="text-electric-cyan" />
                       <h3 className="text-3xl font-black m-0 tracking-tighter">Marketing Architecture</h3>
                    </div>
                    <p className="text-text-muted font-medium text-lg leading-relaxed">Position this QR engine at your entry point. Customers scan to access telemetry data and live wait times without downloading an app.</p>
                    <button onClick={downloadQRCode} className="bg-white/5 border border-white/10 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 group">
                       <Download size={18} className="group-hover:translate-y-1 transition-transform" /> Export Ultra-Res PNG
                    </button>
                 </div>
              </motion.div>
            </motion.div>
          )}

          {activeTab === 'staff' && (
            <motion.div 
               key="staff" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}
               className="bg-background-panel/40 border border-white/5 rounded-[40px] p-10"
            >
              <div className="flex items-center gap-4 mb-10">
                 <UsersIcon size={32} className="text-electric-green" />
                 <h2 className="text-3xl font-black italic tracking-tighter m-0 uppercase">Team <span className="text-electric-green">Inventory</span></h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                 <div className="p-8 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex flex-col gap-5">
                    <div className="space-y-4">
                       <input className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-electric-green/40 transition-all" placeholder="Team Member Name" value={newBarberName} onChange={e => setNewBarberName(e.target.value)} />
                       <input className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm focus:outline-none focus:border-electric-green/40 transition-all" placeholder="Specialty (Top Talent)" value={newBarberSpecs} onChange={e => setNewBarberSpecs(e.target.value)} />
                    </div>
                    <button onClick={addBarber} className="bg-electric-green text-black w-full py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-electric-neon transition-all flex items-center justify-center gap-2">
                       <Plus size={16} /> Deploy Member
                    </button>
                 </div>

                 {barbers.map((b, i) => (
                    <motion.div key={b.id} variants={itemVariants} className="p-8 bg-background-card/50 border border-white/5 rounded-[32px] group relative overflow-hidden">
                       <div className="flex justify-between items-start">
                          <div>
                             <h4 className="text-xl font-black m-0 mb-1">{b.name}</h4>
                             <span className="text-[10px] text-electric-cyan font-black tracking-widest uppercase">{b.specialty}</span>
                          </div>
                          <button onClick={() => removeBarber(b.id)} className="p-3 bg-red-500/10 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                             <Trash2 size={16} />
                          </button>
                       </div>
                       <div className="mt-8 flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-electric-green" />
                          <span className="text-[10px] font-bold text-text-muted uppercase">Ready for Service</span>
                       </div>
                    </motion.div>
                 ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div 
               key="settings" initial="hidden" animate="visible" exit="hidden" variants={containerVariants}
               className="bg-background-panel/40 border border-white/5 rounded-[40px] p-10 max-w-3xl mx-auto"
            >
               <div className="flex items-center gap-4 mb-10">
                 <SettingsIcon size={32} className="text-electric-cyan" />
                 <h2 className="text-3xl font-black italic tracking-tighter m-0 uppercase">Core <span className="text-electric-cyan">Config</span></h2>
              </div>
              
              <div className="space-y-8">
                 <SettingsInput label="Enterprise Name" value={salonName} onChange={e => setSalonName(e.target.value)} />
                 <SettingsInput label="Capacity Threshold (AI Limit)" type="number" value={maxLimit} onChange={e => setMaxLimit(e.target.value)} />
                 <SettingsInput label="Direct Liaison Phone" value={phone} onChange={e => setPhone(e.target.value)} />
                 <div className="grid grid-cols-2 gap-6">
                    <SettingsInput label="Geocode Latitude" value={lat} onChange={e => setLat(e.target.value)} />
                    <SettingsInput label="Geocode Longitude" value={lon} onChange={e => setLon(e.target.value)} />
                 </div>
                 <button onClick={updateSettings} className="w-full bg-electric-cyan text-black py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-white transition-all mt-4">
                    Commit Protocol Changes
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

const TabButton = ({ active, onClick, icon, label }) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-3 rounded-[20px] text-[10px] font-black uppercase tracking-[0.15em] transition-all ${active ? 'bg-white text-black' : 'text-text-muted hover:text-white'}`}>
    {icon} {label}
  </button>
);

const SettingsInput = ({ label, ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">{label}</label>
    <input {...props} className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-sm font-bold focus:outline-none focus:border-electric-cyan/50 transition-all text-white" />
  </div>
);
