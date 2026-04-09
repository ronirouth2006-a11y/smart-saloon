import { useState, useEffect, useCallback, useMemo } from 'react';
import { RefreshCw, Users, Clock, Navigation, Heart, Search, Filter, MapPin, ChevronRight, Star } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { formatLocalNum, formatLocalTime } from '../utils/locale';

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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '0 1rem' }}>
      <div className="header animate-fade-in" style={{ borderBottom: 'none', marginBottom: '0.5rem', padding: '1rem 2rem' }}>
        <h2 style={{ margin: 0 }}>{t('nearby_salons')}</h2>
      </div>

      <div className="split-dashboard animate-fade-in">
        
        {/* LEFT PANEL: SMART MAP */}
        <div className="split-map-container">
          <MapContainer 
            center={[coords.lat, coords.lon]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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

        {/* RIGHT PANEL: RESULTS SIDEBAR */}
        <div className="split-list-container">
          
          {/* SEARCH & FILTERS SECTION */}
          <div className="glass-panel" style={{ padding: '1rem', position: 'sticky', top: 0, zIndex: 10, borderRadius: '15px' }}>
            <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
               <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    className="input-field" 
                    placeholder="Search for saloons..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.8rem', height: '42px', fontSize: '0.95rem' }}
                  />
               </div>
               <button 
                 className={`btn ${isFilterOpen ? 'btn-primary' : 'btn-secondary'}`}
                 onClick={() => setIsFilterOpen(!isFilterOpen)}
                 style={{ height: '42px', minWidth: '42px', padding: 0 }}
               >
                 <Filter size={20} />
               </button>
               
               {/* 🔄 MODERN REFRESH BUTTON (Upper Area) */}
               <button 
                 className="btn btn-secondary" 
                 onClick={locateAndFetch} 
                 disabled={loading}
                 style={{ height: '42px', minWidth: '42px', padding: 0, borderRadius: '12px' }}
                 title={t('refresh')}
               >
                 <RefreshCw size={18} className={loading ? 'spin' : ''} />
               </button>
            </div>

            {/* Trending Quick Chips (Zomato Style) */}
            <div style={{ display: 'flex', gap: '0.6rem', overflowX: 'auto', paddingTop: '0.8rem', paddingBottom: '0.2rem', scrollbarWidth: 'none' }}>
               <button 
                 className={`btn ${radiusFilter ? 'btn-primary' : 'btn-secondary'}`} 
                 style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '50px', whiteSpace: 'nowrap' }} 
                 onClick={() => setRadiusFilter(!radiusFilter)}
               >
                 📍 Near Me
               </button>
               <button 
                 className={`btn ${sortBy === 'wait' ? 'btn-primary' : 'btn-secondary'}`} 
                 style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '50px', whiteSpace: 'nowrap' }} 
                 onClick={() => setSortBy(sortBy === 'wait' ? 'distance' : 'wait')}
               >
                 ⏳ Fastest Wait
               </button>
                <button 
                  className={`btn ${searchTerm.toLowerCase() === 'haircut' ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '50px', whiteSpace: 'nowrap' }}
                  onClick={() => setSearchTerm(searchTerm.toLowerCase() === 'haircut' ? '' : 'Haircut')}
                >
                  💇‍♂️ Haircut
                </button>
                <button 
                  className={`btn ${openNowFilter ? 'btn-primary' : 'btn-secondary'}`} 
                  style={{ fontSize: '0.75rem', padding: '0.35rem 0.8rem', borderRadius: '50px', whiteSpace: 'nowrap' }}
                  onClick={() => setOpenNowFilter(!openNowFilter)}
                >
                  🟢 Open Now
                </button>
            </div>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', paddingTop: '1rem' }}>
                     <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '50px' }}>
                       ⭐ 4+ Rating
                     </button>
                     <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '50px' }}>
                       Men
                     </button>
                     <button className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', borderRadius: '50px' }}>
                       Women
                     </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LIST OF SALONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', paddingBottom: '2rem' }}>
            <AnimatePresence>
              {processedSalons.map((salon, index) => {
                const isFavorite = favorites.includes(salon.id);
                const isHovered = hoveredSalonId === salon.id;
                
                return (
                  <motion.div
                    key={salon.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.04 }}
                    onMouseEnter={() => setHoveredSalonId(salon.id)}
                    onMouseLeave={() => setHoveredSalonId(null)}
                    className={`glass-panel ${salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED' ? 'offline-card' : ''}`}
                    style={{ 
                      padding: '1rem', 
                      cursor: 'pointer',
                      border: isHovered ? '1px solid var(--primary)' : '1px solid var(--panel-border)',
                      boxShadow: isHovered ? '0 8px 24px rgba(129, 140, 248, 0.2)' : 'none',
                      borderRadius: '15px',
                      opacity: (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? 0.7 : 1,
                      transition: 'all 0.3s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <h3 style={{ margin: 0, fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{salon.name}</h3>
                          {isFavorite && <Heart size={14} fill="var(--danger)" color="var(--danger)" className="animate-pulse" />}
                        </div>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{salon.location}</p>
                      </div>
                      <div className={`status-badge ${salon.status === 'AVAILABLE' ? 'status-active' : 'status-inactive'}`} style={{ 
                        height: 'fit-content',
                        backgroundColor: (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? 'rgba(0,0,0,0.3)' : '',
                        borderColor: (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') ? 'var(--panel-border)' : ''
                      }}>
                         <div className="status-dot"></div>
                         {salon.status}
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem', marginTop: '0.8rem' }}>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Clock size={16} color="var(--accent)" />
                        <div style={{ width: '100%' }}>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <motion.span
                              key={salon.wait_time}
                              initial={{ scale: 1.3, color: 'var(--primary)' }}
                              animate={{ scale: 1, color: 'inherit' }}
                              transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
                              style={{ display: 'inline-block' }}
                            >
                              { (salon.status === 'OFFLINE' || salon.status === 'NO LIVE FEED') 
                                ? t('wait_time_na') 
                                : i18n.language.startsWith('bn') 
                                  ? `${formatLocalNum(salon.wait_time, 'bn')} মিনিট অপেক্ষা` 
                                  : `${salon.wait_time}m Wait` 
                              }
                            </motion.span>
                            {/* Live Count Badge */}
                            {salon.status !== 'OFFLINE' && salon.status !== 'NO LIVE FEED' && (
                              <motion.span 
                                key={salon.current_count}
                                initial={{ scale: 1.4 }}
                                animate={{ scale: 1 }}
                                transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 15 }}
                                style={{ 
                                  fontSize: '0.65rem', 
                                  padding: '0.1rem 0.4rem', 
                                  borderRadius: '50px', 
                                  background: salon.current_count >= 5 ? 'var(--danger)' : 'var(--success)', 
                                  color: '#fff',
                                  marginLeft: '0.4rem',
                                  whiteSpace: 'nowrap',
                                  display: 'inline-block'
                                }}>
                                {t('live_count', { count: formatLocalNum(salon.current_count, i18n.language) })}
                              </motion.span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {i18n.language.startsWith('bn') ? 'আনুমানিক সময়' : 'Estimated wait time'}
                          </div>
                        </div>
                      </div>
                      <div style={{ background: 'rgba(0,0,0,0.2)', padding: '0.6rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} color="var(--primary)" />
                        <div>
                          <div style={{ fontSize: '0.85rem', fontWeight: '800' }}>{formatLocalNum(salon.distance.toFixed(1), i18n.language)} km</div>
                          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                            {i18n.language.startsWith('bn') ? 'আপনার থেকে দুরে' : 'Away from you'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <a 
                        href={`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary"
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem', borderRadius: '10px' }}
                      >
                       <Navigation size={14} /> Directions
                      </a>
                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(salon.id); }}
                        className="btn btn-secondary"
                        style={{ width: '38px', height: '38px', padding: 0, borderRadius: '10px' }}
                      >
                         <Heart size={16} fill={isFavorite ? 'var(--danger)' : 'transparent'} color={isFavorite ? 'var(--danger)' : 'currentColor'} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {processedSalons.length === 0 && !loading && (
              <div className="text-center" style={{ padding: '3rem' }}>
                 <Search size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                 <p className="text-muted">No results found for your search.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
