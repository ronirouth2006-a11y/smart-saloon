import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  MapPin, 
  RefreshCw, 
  Clock, 
  Users, 
  CheckCircle2, 
  Timer,
  Scissors,
  ChevronRight,
  Info,
  Navigation
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { formatLocalNum, formatLocalTime } from '../utils/locale';

// Custom Marker Icons
const userIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="pulse-marker" style="background: #2d67b2; box-shadow: 0 0 0 rgba(45, 103, 178, 0.4);"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const salonIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div class="pulse-marker"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, 15);
  return null;
}

export default function SalonDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userCoords, setUserCoords] = useState(null);
  const [distance, setDistance] = useState(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          setUserCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        },
        () => {
          // Fallback to salon location if user denies GPS, for visual tracking demo
          console.warn("Geolocation denied, using default center.");
          setUserCoords({ lat: 22.5726, lon: 88.3639 }); 
        }
      );
    } else {
      setUserCoords({ lat: 22.5726, lon: 88.3639 });
    }
  }, []);

  const fetchSalon = async () => {
    try {
      const token = localStorage.getItem('customer_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await api.get(`/public/salons/${id}`, { headers });
      setSalon(res.data);
      
      if (userCoords && res.data.latitude) {
        const R = 6371;
        const dLat = (res.data.latitude - userCoords.lat) * Math.PI / 180;
        const dLon = (res.data.longitude - userCoords.lon) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(userCoords.lat * Math.PI / 180) * Math.cos(res.data.latitude * Math.PI / 180) * 
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        setDistance((R * c).toFixed(1));
      }
    } catch (err) {
      setError('Failed to locate salon.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalon();
    const interval = setInterval(fetchSalon, 5000); // 🚀 Optimized: Poll every 5s for real-time feel
    return () => clearInterval(interval);
  }, [id, userCoords]);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  if (error || !salon) {
    return (
      <div className="text-center" style={{ marginTop: '4rem', padding: '2rem' }}>
        <Info size={48} color="var(--danger)" style={{ marginBottom: '1rem' }} />
        <h2>{error || "Salon not found"}</h2>
        <button onClick={() => navigate('/map')} className="btn mt-4">Back to Search</button>
      </div>
    );
  }

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans selection:bg-primary/20 pb-32">
      
      {/* 🚀 PREMIUM HEADER BAR */}
      <header className="sticky top-0 z-[1000] bg-background-main/80 backdrop-blur-2xl border-b border-border-subtle py-6 px-8 flex items-center justify-between">
        <button 
          onClick={() => navigate('/map')} 
          className="p-3 bg-white/5 hover:bg-white/10 rounded-2xl border border-border-subtle transition-smooth group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-heading font-black uppercase tracking-widest">{salon.name}</h2>
          <p className="text-[10px] text-text-muted font-bold tracking-widest uppercase mt-0.5">{salon.location || 'Haldia Node'}</p>
        </div>
        <div className="w-12" /> {/* Spacer for symmetry */}
      </header>

      <div className="max-w-[800px] mx-auto px-8 pt-10 space-y-10">
        
        {/* 📊 LIVE STATUS OVERVIEW */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
           {/* Queue Card */}
           <div className="p-8 bg-background-card border border-border-subtle rounded-[40px] shadow-premium relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl -z-10" />
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-4 bg-primary/10 rounded-2xl text-primary">
                    <Users size={28} />
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Active Population</span>
                    <h3 className="text-4xl font-heading font-black">{salon.current_count} <span className="text-lg text-text-muted">WAITING</span></h3>
                 </div>
              </div>
              <div className="flex items-center justify-between pt-6 border-t border-border-subtle">
                 <div className="flex items-center gap-2 text-primary font-bold text-xs">
                    <div className="w-2 h-2 rounded-full bg-primary pulse-primary" />
                    LIVE TELEMETRY
                 </div>
                 <button onClick={fetchSalon} className="text-text-dim hover:text-text-main transition-colors"><RefreshCw size={16} /></button>
              </div>
           </div>

           {/* Wait Time Card */}
           <div className="p-8 bg-background-panel border border-border-subtle rounded-[40px] shadow-premium group">
              <div className="flex items-center gap-4 mb-8">
                 <div className="p-4 bg-accent/10 rounded-2xl text-accent">
                    <Timer size={28} />
                 </div>
                 <div>
                    <span className="text-[10px] font-black text-text-dim uppercase tracking-[0.2em]">Estimated Buffer</span>
                    <h3 className="text-4xl font-heading font-black">
                      {(salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? '--' : salon.wait_time} 
                      <span className="text-lg text-text-muted ml-2">MINUTES</span>
                    </h3>
                 </div>
              </div>
              <div className="text-[10px] font-bold text-text-dim uppercase tracking-widest pt-6 border-t border-border-subtle">
                 Last Sync: {formatLocalTime(salon.updated_at.split(' (IST)')[0], 'en')}
              </div>
           </div>
        </section>

        {/* 🗺️ LIVE TRACKING HUB */}
        <section>
            <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-heading font-black uppercase tracking-widest flex items-center gap-2">
                  <Navigation size={20} className="text-primary" /> Routing Intelligence
               </h3>
               {distance && <span className="text-xs font-black text-accent bg-accent/5 px-4 py-1.5 rounded-full border border-accent/20">{distance} KM AWAY</span>}
            </div>
            
            <div className="h-[400px] rounded-[48px] border border-border-subtle shadow-premium overflow-hidden relative group">
                <div className="absolute inset-0 bg-background-main/20 group-hover:bg-transparent transition-colors z-10 pointer-events-none" />
                {userCoords && salon.latitude && (
                    <MapContainer 
                        center={[userCoords.lat, userCoords.lon]} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <ChangeView center={[userCoords.lat, userCoords.lon]} />
                        <Marker position={[userCoords.lat, userCoords.lon]} icon={userIcon} />
                        <Marker position={[salon.latitude, salon.longitude]} icon={salonIcon} />
                        <Polyline positions={[[userCoords.lat, userCoords.lon], [salon.latitude, salon.longitude]]} color="var(--primary)" weight={3} dashArray="8, 8" opacity={0.6} />
                    </MapContainer>
                )}
            </div>
        </section>

        {/* 📋 SERVICE STATIONS: Barbers */}
        {salon.barbers && salon.barbers.length > 0 && (
            <section className="p-10 bg-background-card border border-border-subtle rounded-[48px] shadow-premium">
                <div className="flex items-center gap-3 mb-10">
                   <Scissors size={24} className="text-primary" />
                   <h3 className="text-2xl font-heading font-black uppercase tracking-tight">Active Stations</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {salon.barbers.map(b => (
                        <div key={b.id} className="p-6 bg-background-main rounded-3xl border border-border-subtle flex justify-between items-center group hover:border-primary/30 transition-smooth">
                            <div className="space-y-1">
                                <div className="font-heading font-black text-lg group-hover:text-primary transition-colors">{b.name}</div>
                                <div className="text-[10px] font-black text-text-dim uppercase tracking-widest">{b.specialty}</div>
                            </div>
                            <div className="bg-primary/5 text-primary px-4 py-2 rounded-xl text-[10px] font-black tracking-widest flex items-center gap-2 group-hover:bg-primary group-hover:text-background-main transition-smooth">
                                <div className="w-1.5 h-1.5 rounded-full bg-current" />
                                STANDBY
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        )}

        <div className="flex flex-col gap-4 pt-4">
           <button 
              onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`)}
              className="w-full bg-primary text-background-main py-6 rounded-[32px] font-black text-sm uppercase tracking-[0.2em] shadow-premium hover:shadow-[0_0_30px_var(--primary-glow)] transition-smooth flex items-center justify-center gap-3"
           >
              Initialize Navigation <ChevronRight size={20} />
           </button>
           <p className="text-center text-[11px] text-text-muted font-medium uppercase tracking-widest">Always verify in-person before commitment.</p>
        </div>

      </div>
    </div>
  );
}

