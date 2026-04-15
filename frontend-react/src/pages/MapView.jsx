import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Users, Clock, Navigation, Heart, Search, Filter, MapPin, ChevronRight, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { formatLocalNum, formatLocalTime } from '../utils/locale';
import SkeletonCard from '../components/SkeletonCard';

// Custom hook for debouncing search input
function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

// Fix for default Leaflet markers in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

// Dynamic map center updater component
function ChangeView({ center }) {
  const map = useMap();
  map.setView(center, map.getZoom());
  return null;
}

// 🟢 Custom Pulsing Marker Component
const PulsingMarker = ({ salon, isHovered, onClick }) => {
  const { t } = useTranslation();
  
  // Logic for pulse color
  let pulseClass = '';
  if (salon.status !== 'OFFLINE' && salon.status !== 'NO LIVE FEED') {
    if (salon.current_count <= 2) pulseClass = 'pulse-green';
    else if (salon.current_count <= 4) pulseClass = 'pulse-orange';
    else pulseClass = 'pulse-red';
  }

  const customIcon = L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="marker-pulse-container">
        ${pulseClass ? `<div class="marker-pulse ${pulseClass}"></div>` : ''}
        <img src="${markerIcon}" style="width: 25px; height: 41px; position: relative; z-index: 2;" />
      </div>
    `,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  return (
    <Marker 
      position={[salon.latitude, salon.longitude]} 
      icon={customIcon}
      zIndexOffset={isHovered ? 1000 : 0}
      eventHandlers={{ click: onClick }}
    >
      <Popup>
        <div style={{ padding: '0.4rem', minWidth: '120px' }}>
          <strong style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.9rem' }}>{salon.name}</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ 
              color: (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? 'var(--text-muted)' : 'var(--primary)', 
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}>
              { (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') 
                ? t('wait_time_na') 
                : `${salon.wait_time}m Wait` 
              }
            </span>
            {salon.status !== 'OFFLINE' && salon.status !== 'NO LIVE FEED' && (
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: salon.current_count >= 5 ? 'var(--danger)' : 'var(--success)' 
              }}></div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default function MapView() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState({ lat: 22.5726, lon: 88.3639 }); // Default Kolkata
  const [searchTerm, setSearchTerm] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [hoveredSalonId, setHoveredSalonId] = useState(null);
  
  // Advanced Filter States
  const [radiusFilter, setRadiusFilter] = useState(false);
  const [openNowFilter, setOpenNowFilter] = useState(false);
  const [sortBy, setSortBy] = useState('distance'); // 'distance' or 'wait'
  
  const debouncedSearch = useDebounce(searchTerm, 400);
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorite_salons');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchSalons = useCallback((lat, lon, searchVal) => {
    setLoading(true);
    const token = localStorage.getItem('customer_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    api.get(`/public/salons/nearby?user_lat=${lat}&user_lon=${lon}${searchVal ? `&search=${searchVal}` : ''}`, { headers })
      .then(res => {
        setSalons(res.data);
        const cloudFavorites = res.data.filter(s => s.is_favorited).map(s => s.id);
        if (token && cloudFavorites.length > 0) {
            const merged = Array.from(new Set([...favorites, ...cloudFavorites]));
            if (merged.length !== favorites.length) {
                setFavorites(merged);
                localStorage.setItem('favorite_salons', JSON.stringify(merged));
            }
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [favorites]);

  const locateAndFetch = useCallback(() => {
    setLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCoords({ lat, lon });
          fetchSalons(lat, lon, debouncedSearch);
        },
        () => fetchSalons(coords.lat, coords.lon, debouncedSearch),
        { timeout: 5000 }
      );
    } else {
      fetchSalons(coords.lat, coords.lon, debouncedSearch);
    }
  }, [fetchSalons, coords.lat, coords.lon, debouncedSearch]);

  useEffect(() => {
    locateAndFetch();
  }, [debouncedSearch]);

  // BACKGROUND GLOBAL POLLING SERVICE (Every 10s)
  useEffect(() => {
    if (!coords.lat || !coords.lon) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('customer_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      api.get(`/public/salons/nearby?user_lat=${coords.lat}&user_lon=${coords.lon}${debouncedSearch ? '&search='+debouncedSearch : ''}`, { headers })
        .then(res => {
          const newData = res.data;
          setSalons(prev => {
            // Smart Re-validation: Only update if the data actually changed
            if (JSON.stringify(prev) === JSON.stringify(newData)) {
              return prev; 
            }
            return newData;
          });
        })
        .catch(err => console.error("Poll error", err));
    }, 10000); // 10s polling

    return () => clearInterval(interval);
  }, [coords.lat, coords.lon, debouncedSearch]);

  const toggleFavorite = (id) => {
    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      localStorage.setItem('favorite_salons', JSON.stringify(newFavs));
      const token = localStorage.getItem('customer_token');
      if (token) {
        api.post('/customer/favorites/sync', { salon_ids: newFavs }, { headers: { Authorization: `Bearer ${token}` } });
      }
      return newFavs;
    });
  };

  const processedSalons = useMemo(() => {
    let result = [...salons];
    
    // Apply Radius Filter
    if (radiusFilter) {
      result = result.filter(s => s.distance <= 10 || favorites.includes(s.id));
    }
    
    // Apply Open Now Filter
    if (openNowFilter) {
      result = result.filter(s => s.status !== 'OFFLINE' && s.status !== 'NO LIVE FEED');
    }

    // Apply Sorting
    result.sort((a, b) => {
      const aFav = favorites.includes(a.id);
      const bFav = favorites.includes(b.id);
      if (aFav && !bFav) return -1;
      if (!aFav && bFav) return 1;
      
      if (sortBy === 'wait') return a.wait_time - b.wait_time;
      return a.distance - b.distance;
    });

    return result;
  }, [salons, radiusFilter, sortBy, favorites]);

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans selection:bg-primary/20">
      <div className="max-w-[1700px] mx-auto lg:px-10">
        
        {/* 🗺️ MAP ENGINE: Hybrid Layout */}
        <div className="relative flex flex-col lg:flex-row gap-8 h-[calc(100vh-20px)] lg:h-[calc(100vh-160px)] overflow-hidden lg:rounded-4xl border border-border-subtle lg:shadow-premium lg:mt-6">
          
          {/* FLOATING ACTION OVERLAY (Search & Controls) */}
          <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[1000] w-[92%] lg:w-[480px] lg:left-10 lg:translate-x-0 flex gap-3">
            <div className="relative flex-1 group">
               <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-smooth" />
               <input 
                 className="w-full bg-background-card/90 backdrop-blur-2xl border border-border-bright rounded-[20px] py-4 pl-14 pr-6 shadow-premium focus:outline-none focus:border-primary/50 transition-smooth text-sm font-medium" 
                 placeholder="Search salons or locations..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
               <button 
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-smooth ${isFilterOpen ? 'text-primary bg-primary/10' : 'text-text-dim hover:text-text-main'}`}
               >
                  <Filter size={18} />
               </button>
            </div>
            <button 
               onClick={locateAndFetch}
               className="p-4 bg-primary shadow-premium rounded-[20px] text-background-main hover:scale-105 active:scale-95 transition-smooth"
            >
               <RefreshCw size={22} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* LEFT AREA: FULL SCREEN MAP */}
          <div className="w-full h-full relative order-1 lg:order-none overflow-hidden">
            <MapContainer 
              center={[coords.lat, coords.lon]} 
              zoom={15} 
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
              <ChangeView center={[coords.lat, coords.lon]} />
              {processedSalons.map(salon => (
                <PulsingMarker 
                  key={salon.id} 
                  salon={salon} 
                  isHovered={hoveredSalonId === salon.id} 
                />
              ))}
            </MapContainer>
          </div>

          {/* RIGHT AREA: THE DISCOVERY SIDEPANEL */}
          <aside className={`
            absolute lg:relative bottom-0 left-0 right-0 z-[1100] lg:z-0
            lg:w-[480px] lg:h-full lg:flex-col lg:flex
            bg-background-card lg:bg-background-panel/40 backdrop-blur-3xl lg:backdrop-blur-none
            rounded-t-4xl lg:rounded-none border-t lg:border-t-0 lg:border-l border-border-subtle
            transition-all duration-500 ease-[0.16, 1, 0.3, 1]
            ${processedSalons.length > 0 ? 'h-[50vh] lg:h-full' : 'h-[100px] lg:h-full'}
            overflow-hidden
          `}>
             {/* Mobile Grab Handle */}
             <div className="w-16 h-1.5 bg-border-subtle rounded-full mx-auto my-5 lg:hidden opacity-50"></div>

             {/* Header Info (Desktop) */}
             <div className="hidden lg:flex px-8 pt-8 pb-4 flex-col gap-1">
                <h2 className="text-2xl font-heading font-black tracking-tight">{t('nearby_salons')}</h2>
                <p className="text-xs font-bold text-text-dim uppercase tracking-widest">{processedSalons.length} Nodes Identified</p>
             </div>

             {/* Dynamic Filter Row */}
             <div className="flex items-center gap-3 px-8 mb-6 overflow-x-auto no-scrollbar">
                <FilterChip active={radiusFilter} onClick={() => setRadiusFilter(!radiusFilter)} label="WITHIN 10KM" />
                <FilterChip active={sortBy === 'wait'} onClick={() => setSortBy(sortBy === 'wait' ? 'distance' : 'wait')} label="SHORTEST QUEUE" />
             </div>

            {/* Results Grid */}
            <div className="flex-1 overflow-y-auto px-8 pb-32 lg:pb-12 space-y-5 custom-scrollbar">
               <AnimatePresence mode="popLayout">
                 {loading ? (
                   [1,2,3,4].map(i => <div key={i} className="h-40 bg-white/5 animate-pulse rounded-3xl" />)
                 ) : processedSalons.map((salon, index) => {
                   const isFavorite = favorites.includes(salon.id);
                   const isHovered = hoveredSalonId === salon.id;
                   
                   return (
                     <motion.div
                       key={salon.id}
                       initial={{ opacity: 0, x: 20 }}
                       animate={{ opacity: 1, x: 0 }}
                       transition={{ delay: index * 0.04, duration: 0.5, ease: 'easeOut' }}
                       onClick={() => navigate(`/salons/${salon.id}`)}
                       onMouseEnter={() => setHoveredSalonId(salon.id)}
                       onMouseLeave={() => setHoveredSalonId(null)}
                       className={`
                         group p-6 rounded-[32px] cursor-pointer transition-smooth border relative overflow-hidden
                         ${isHovered ? 'bg-white/5 border-primary/40 shadow-premium' : 'bg-background-panel/40 border-border-subtle'}
                       `}
                     >
                       <div className="flex justify-between items-start gap-4 mb-6">
                         <div className="flex-1 min-w-0">
                           <div className="flex items-center gap-2 mb-1.5">
                              <h3 className="font-heading font-black text-xl truncate group-hover:text-primary transition-colors">{salon.name}</h3>
                              {isFavorite && <Star size={16} fill="var(--warning)" color="var(--warning)" />}
                           </div>
                           <p className="text-xs text-text-muted font-medium flex items-center gap-1.5">
                             <MapPin size={14} className="text-accent" /> {salon.location || 'Haldia, WB'}
                           </p>
                         </div>
                         <div className={`
                           px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border transition-smooth
                           ${salon.status === 'AVAILABLE' ? 'bg-primary/10 text-primary border-primary/20' : 'bg-danger/10 text-danger border-danger/20'}
                         `}>
                           <div className={`w-1.5 h-1.5 rounded-full ${salon.status === 'AVAILABLE' ? 'bg-primary pulse-primary' : 'bg-danger'}`} />
                           {salon.status}
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                         <StatBadge 
                           label="EST. WAIT" 
                           value={(salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? '--' : salon.wait_time} 
                           unit="MIN" 
                           color="text-primary"
                         />
                         <StatBadge 
                           label="DISTANCE" 
                           value={salon.distance !== undefined ? salon.distance.toFixed(1) : '0.0'} 
                           unit="KM" 
                           color="text-accent"
                         />
                       </div>

                       <div className="flex gap-2 mt-6 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-smooth duration-300">
                          <button 
                            className="flex-1 bg-white/5 hover:bg-white/10 text-text-main font-bold text-[10px] py-4 rounded-2xl transition-smooth flex justify-center items-center gap-2"
                            onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`); }}
                          >
                            DIRECTIONS
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(salon.id); }}
                            className="w-14 h-14 bg-white/5 hover:bg-danger/10 text-text-muted hover:text-danger rounded-2xl border border-border-subtle transition-smooth flex items-center justify-center shrink-0"
                          >
                             <Heart size={20} fill={isFavorite ? "var(--danger)" : "transparent"} color={isFavorite ? "var(--danger)" : "currentColor"} />
                          </button>
                       </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

const FilterChip = ({ active, label, onClick }) => (
  <button 
    onClick={onClick}
    className={`px-6 py-2.5 rounded-full text-[10px] font-black tracking-[0.15em] transition-smooth border whitespace-nowrap ${active ? 'bg-primary border-primary text-background-main shadow-premium' : 'bg-background-panel border-border-subtle text-text-dim hover:border-text-muted hover:text-text-main'}`}
  >
    {label}
  </button>
);

const StatBadge = ({ label, value, unit, color }) => (
  <div className="bg-background-main/50 p-4 rounded-2xl border border-border-subtle flex flex-col justify-center transition-smooth group-hover:bg-background-main">
     <span className="text-[10px] font-bold text-text-dim uppercase tracking-[0.1em] mb-1">{label}</span>
     <div className="flex items-baseline gap-1.5">
        <span className={`text-2xl font-black ${color}`}>{value}</span>
        <span className="text-[10px] font-black text-text-muted">{unit}</span>
     </div>
  </div>
);
