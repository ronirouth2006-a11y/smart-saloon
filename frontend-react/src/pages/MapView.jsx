import { useState, useEffect, useCallback, useMemo } from 'react';
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
    <div className="bg-background min-h-screen text-text-main font-sans">
      <div className="max-w-[1600px] mx-auto lg:px-6">
        {/* Desktop Header: Hidden on mobile since we'll use BottomNav and Floating Search */}
        <div className="hidden lg:flex items-center justify-between py-6 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-electric-green/10 rounded-2xl border border-electric-green/20">
              <Navigation size={28} className="text-electric-green" />
            </div>
            <div>
              <h2 className="text-2xl font-black tracking-tight m-0">{t('nearby_salons')}</h2>
              <p className="text-sm text-text-muted m-0">Discover live wait times at premium salons near you.</p>
            </div>
          </div>
        </div>

        {/* 🗺️ MAP ENGINE: 100% Height on Mobile, Fixed Sidebar on Desktop */}
        <div className="relative flex flex-col lg:flex-row gap-6 h-[calc(100vh-20px)] lg:h-[calc(100vh-140px)] overflow-hidden">
          
          {/* MOBILE SEARCH FAB (Floating Action Button) */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1500] w-[90%] lg:hidden flex gap-2">
            <div className="relative flex-1 group">
               <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-electric-cyan transition-colors" />
               <input 
                 className="w-full bg-background-panel/90 backdrop-blur-xl border border-white/10 rounded-2xl py-3 pl-12 pr-4 shadow-2xl focus:outline-none focus:border-electric-cyan/50 transition-all text-sm" 
                 placeholder="Search salons..." 
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
            <button 
               onClick={locateAndFetch}
               className="p-3 bg-electric-green shadow-2xl rounded-2xl text-white active:scale-95 transition-transform"
            >
               <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* LEFT AREA: MAP */}
          <div className="w-full h-full lg:flex-[1.5] relative rounded-3xl overflow-hidden shadow-2xl border border-white/5 order-1 lg:order-none">
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

          {/* RIGHT AREA: RESULTS SIDEBAR (Desktop) / BOTTOM SHEET (Mobile) */}
          <div className={`
            absolute lg:relative bottom-0 left-0 right-0 z-[1600] lg:z-0
            lg:w-[450px] lg:h-full lg:flex-col lg:gap-4 lg:flex
            bg-background-panel lg:bg-transparent backdrop-blur-3xl lg:backdrop-blur-none
            rounded-t-[40px] lg:rounded-none border-t border-white/10 lg:border-none
            transition-all duration-500 ease-in-out
            ${processedSalons.length > 0 ? 'h-[40vh]' : 'h-[100px]'}
            overflow-y-auto lg:overflow-y-visible
          `}>
             {/* Mobile Grab Handle */}
             <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto my-4 lg:hidden"></div>

            {/* Side Scrollable List */}
            <div className="flex flex-col gap-4 px-6 lg:px-0 lg:overflow-y-auto lg:pr-2 scrollbar-hide pb-24 lg:pb-0">
               {/* Desktop Filter Row */}
               <div className="hidden lg:flex items-center gap-2 mb-2">
                 <button 
                   onClick={() => setRadiusFilter(!radiusFilter)}
                   className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${radiusFilter ? 'bg-electric-green border-electric-green text-black' : 'bg-background-card border-white/10 text-text-muted hover:border-white/30'}`}
                 >
                   NEARBY (10KM)
                 </button>
                 <button 
                    onClick={() => setSortBy(sortBy === 'wait' ? 'distance' : 'wait')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${sortBy === 'wait' ? 'bg-electric-cyan border-electric-cyan text-black' : 'bg-background-card border-white/10 text-text-muted hover:border-white/30'}`}
                 >
                    LOWEST WAIT
                 </button>
               </div>

               <AnimatePresence mode="popLayout">
                 {loading ? (
                   [1,2,3].map(i => <SkeletonCard key={i} />)
                 ) : processedSalons.map((salon, index) => {
                   const isFavorite = favorites.includes(salon.id);
                   const isHovered = hoveredSalonId === salon.id;
                   
                   return (
                     <motion.div
                       key={salon.id}
                       initial={{ opacity: 0, y: 30 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                       layout
                       whileHover={{ scale: 1.02, boxShadow: '0px 10px 30px rgba(0,245,255,0.15)' }}
                       className={`
                         group p-5 rounded-[24px] cursor-pointer transition-all relative overflow-hidden
                         ${isHovered ? 'bg-white/5 border-electric-green/40 shadow-[0_0_30px_rgba(46,204,113,0.1)]' : 'bg-background-card/50 border-white/5'}
                         border backdrop-blur-md
                       `}
                       onMouseEnter={() => setHoveredSalonId(salon.id)}
                       onMouseLeave={() => setHoveredSalonId(null)}
                     >
                       <div className="flex justify-between items-start mb-4">
                         <div className="flex-1">
                           <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-black text-lg m-0 group-hover:text-electric-green transition-colors">{salon.name}</h3>
                              {isFavorite && <Heart size={14} fill="#ef4444" color="#ef4444" />}
                           </div>
                           <p className="text-xs text-text-muted flex items-center gap-1">
                             <MapPin size={12} className="text-electric-cyan" /> {salon.location}
                           </p>
                         </div>
                         <div className={`
                           px-3 py-1 rounded-full text-[10px] font-black tracking-widest flex items-center gap-1.5 border
                           ${salon.status === 'AVAILABLE' ? 'bg-electric-green/10 text-electric-green border-electric-green/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}
                         `}>
                           <div className={`w-1.5 h-1.5 rounded-full ${salon.status === 'AVAILABLE' ? 'bg-electric-green animate-pulse' : 'bg-red-500'}`} />
                           {salon.status}
                         </div>
                       </div>

                       <div className="grid grid-cols-2 gap-3">
                         <div className="bg-black/20 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">EST. WAIT</span>
                            <div className="flex items-baseline gap-1">
                               <span className="text-xl font-black text-electric-green">
                                  { (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? '--' : salon.wait_time }
                               </span>
                               <span className="text-xs font-bold text-text-muted">MIN</span>
                            </div>
                         </div>
                         <div className="bg-black/20 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
                            <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-0.5">DISTANCE</span>
                            <div className="flex items-baseline gap-1">
                               <span className="text-xl font-black text-electric-cyan">{salon.distance.toFixed(1)}</span>
                               <span className="text-xs font-bold text-text-muted">KM</span>
                            </div>
                         </div>
                       </div>

                       <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0 duration-300">
                          <a 
                            href={`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`}
                            target="_blank" rel="noreferrer"
                            className="bg-electric-cyan/20 hover:bg-electric-cyan text-electric-cyan hover:text-black font-black text-xs py-3 rounded-xl transition-all flex-[2] text-center"
                          >
                            GET DIRECTIONS
                          </a>
                          <button 
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(salon.id); }}
                            className="bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 p-3 rounded-xl border border-white/10 transition-all flex-[0.5] flex items-center justify-center"
                          >
                             <Heart size={18} fill={isFavorite ? "#ef4444" : "transparent"} color={isFavorite ? "#ef4444" : "currentColor"} />
                          </button>
                       </div>
                     </motion.div>
                   );
                 })}
               </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
