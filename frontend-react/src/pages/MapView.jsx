import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Clock, Navigation, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { formatLocalNum, formatLocalTime } from '../utils/locale';

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

export default function MapView() {
  const { t, i18n } = useTranslation();
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState({ lat: 22.5726, lon: 88.3639 }); // Default Kolkata
  const [searchTerm, setSearchTerm] = useState('');
  const [radiusFilter, setRadiusFilter] = useState(false); // false = All, true = 10km
  const [notified, setNotified] = useState(new Set());
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorite_salons');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchSalons = useCallback((lat, lon) => {
    setLoading(true);
    const token = localStorage.getItem('customer_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    api.get(`/public/salons/nearby?user_lat=${lat}&user_lon=${lon}${searchTerm ? `&search=${searchTerm}` : ''}`, { headers })
      .then(res => {
        setSalons(res.data);
        // Automatically ensure local storage has the cloud-synced favorites as truth
        const cloudFavorites = res.data.filter(s => s.is_favorited).map(s => s.id);
        if (token && cloudFavorites.length > 0) {
            // Unify local state with cloud truth to prevent desync
            const merged = Array.from(new Set([...favorites, ...cloudFavorites]));
            if (merged.length !== favorites.length) {
                setFavorites(merged);
                localStorage.setItem('favorite_salons', JSON.stringify(merged));
            }
        }
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [favorites, searchTerm]);

  const locateAndFetch = useCallback(() => {
    setLoading(true);
    setLocationError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          setCoords({ lat, lon });
          fetchSalons(lat, lon);
        },
        (error) => {
          // Log error but don't show the annoying Zomato prompt as requested
          console.log("Location error:", error);
          fetchSalons(coords.lat, coords.lon);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      fetchSalons(coords.lat, coords.lon);
    }
  }, [fetchSalons, coords.lat, coords.lon]);

  useEffect(() => {
    locateAndFetch();
  }, [locateAndFetch]);

  useEffect(() => {
    locateAndFetch();
  }, [searchTerm]);

  // SMART POLLING SERVICE
  useEffect(() => {
    if (favorites.length === 0) return;

    const interval = setInterval(() => {
      const token = localStorage.getItem('customer_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      api.get(`/public/salons/nearby?user_lat=${coords.lat}&user_lon=${coords.lon}`, { headers })
        .then(res => {
          const newData = res.data;
          setSalons(newData); 

          newData.forEach(salon => {
            if (favorites.includes(salon.id)) {
              if (salon.wait_time < 5) {
                if (!notified.has(salon.id) && Notification.permission === 'granted') {
                  new Notification('Smart Saloon Alert', {
                    body: `Hey! ${salon.name} is empty right now. Head over to skip the wait!`,
                    icon: '/vite.svg'
                  });
                  setNotified(prev => new Set([...prev, salon.id]));
                }
              } else if (salon.wait_time >= 5 && notified.has(salon.id)) {
                setNotified(prev => {
                  const next = new Set(prev);
                  next.delete(salon.id);
                  return next;
                });
              }
            }
          });
        })
        .catch(err => console.error("Poll error", err));
    }, 60000);

    return () => clearInterval(interval);
  }, [coords, favorites, notified]);

  const toggleFavorite = (id) => {
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      localStorage.setItem('favorite_salons', JSON.stringify(newFavs));
      
      const token = localStorage.getItem('customer_token');
      if (token) {
        // Fire and forget background cloud push
        api.post('/customer/favorites/sync', 
            { salon_ids: newFavs }, 
            { headers: { Authorization: `Bearer ${token}` } }
        ).catch(err => console.error("Cloud Sync Failed", err));
      }
      
      return newFavs;
    });
  };

  const sortedSalons = [...salons].sort((a, b) => {
    // Priority 1: Favorites
    if (a.is_favorited && !b.is_favorited) return -1;
    if (!a.is_favorited && b.is_favorited) return 1;
    // Priority 2: Distance
    return a.distance - b.distance;
  });

  const filteredSalons = radiusFilter 
    ? sortedSalons.filter(s => s.distance <= 10 || s.is_favorited)
    : sortedSalons;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="header animate-fade-in" style={{ borderBottom: 'none', marginBottom: '1rem', padding: 0 }}>
        <h2>{t('nearby_salons')}</h2>
        <button className="btn btn-secondary hover:animate-pulse" onClick={locateAndFetch} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'loader' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          {t('refresh')}
        </button>
      </div>

      {locationError && <p className="mb-3" style={{ color: 'var(--warning)' }}>{locationError}</p>}

      {loading && !salons.length ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p className="mt-2 text-muted">{t('finding_salons')}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT PANEL: INTERACTIVE MAP */}
          <div className="glass-panel animate-scale-up" style={{ padding: 0, height: '650px', overflow: 'hidden', position: 'sticky', top: '2rem' }}>
            <MapContainer 
              center={[coords.lat, coords.lon]} 
              zoom={15} 
              scrollWheelZoom={true} 
              style={{ height: '100%', width: '100%', borderRadius: '12px' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <ChangeView center={[coords.lat, coords.lon]} />
              
              {/* Plotting all Salons dynamically */}
              {salons.map(salon => (
                <Marker key={`marker-${salon.id}`} position={[salon.latitude, salon.longitude]}>
                  <Popup>
                    <strong style={{ fontSize: '1.1rem' }}>{salon.name}</strong><br/>
                    Status: {salon.status}<br/>
                    <strong>{salon.wait_time}m</strong> est. wait
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          {/* RIGHT PANEL: SCROLLING CARDS */}
          {/* Search Bar */}
          <div className="glass-panel" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                className="input-field" 
                placeholder="Search by salon name..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.8rem', height: '45px' }}
              />
            </div>
            <button 
              className={`btn ${radiusFilter ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setRadiusFilter(!radiusFilter)}
              style={{ height: '45px', minWidth: '45px', padding: 0 }}
              title={radiusFilter ? "Show All Salons" : "Filter: Within 10km"}
            >
              <Filter size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '700px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {filteredSalons.map((salon, index) => {
              const isFavorite = favorites.includes(salon.id);
              const isClosed = !salon.is_active;
              const delayClass = `delay-${((index % 4) + 1) * 100}`;
              
              return (
                <div key={salon.id} className={`glass-panel animate-slide-up ${delayClass}`} style={{ 
                    position: 'relative', 
                    overflow: 'hidden',
                    filter: isClosed ? 'grayscale(1) opacity(0.8)' : 'none',
                    transition: 'all 0.3s ease',
                    border: (index === 0 && !isClosed && !locationError) ? '1px solid var(--primary)' : '1px solid var(--panel-border)',
                    boxShadow: (index === 0 && !isClosed && !locationError) ? '0 0 20px rgba(129, 140, 248, 0.2)' : 'none'
                }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', 
                    background: isClosed ? 'var(--danger)' : (salon.status === 'AVAILABLE' ? 'var(--success)' : (salon.current_count > 5 ? 'var(--danger)' : 'var(--warning)')) 
                  }}></div>
                  
                  {isClosed && (
                      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', background: 'var(--danger)', color: '#fff', fontSize: '0.7rem', fontWeight: 'bold', padding: '0.2rem', textAlign: 'center', letterSpacing: '1px' }}>
                          CLOSED FOR TODAY
                      </div>
                  )}

                  {salon.is_favorited && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--accent)', fontSize: '0.75rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>
                      <Heart size={14} fill="var(--accent)" /> MY FAVORITE LIST
                    </div>
                  )}

                  {index === 0 && !isClosed && !locationError && !salon.is_favorited && (
                      <div className="shimmer-effect" style={{ background: 'var(--primary)', color: '#fff', display: 'inline-block', padding: '0.2rem 0.8rem', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '50px', marginBottom: '1rem', letterSpacing: '0.5px' }}>
                          NEAREST TO YOU
                      </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <h3 style={{ fontSize: '1.25rem', margin: 0 }}>{salon.name}</h3>
                      <button 
                        onClick={() => toggleFavorite(salon.id)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0', display: 'flex' }}
                        title={isFavorite ? "Remove from favorites" : "Add to favorites"}
                      >
                        <Heart 
                          size={22} 
                          fill={isFavorite ? 'var(--danger)' : 'transparent'} 
                          color={isFavorite ? 'var(--danger)' : 'var(--text-muted)'} 
                          style={{ transition: 'all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }} 
                          className={isFavorite ? 'animate-fade-in' : ''}
                        />
                      </button>
                    </div>
                    {isClosed ? (
                      <span className="status-badge status-inactive">
                        <div className="status-dot"></div>
                        OFFLINE
                      </span>
                    ) : (
                      <span className={`status-badge ${salon.status === 'AVAILABLE' ? 'status-active' : 'status-inactive'}`}>
                        <div className="status-dot"></div>
                        {salon.status}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <Navigation size={16} />
                      <span>{locationError ? 'Location unknown' : t('distance_km', { dist: formatLocalNum(salon.distance, i18n.language) })}</span>
                    </div>
                    <a 
                      href={`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem', borderRadius: '6px' }}
                    >
                      Get Directions
                    </a>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <Users size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{formatLocalNum(salon.current_count, i18n.language)}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('current_crowd')}</div>
                    </div>
                    
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <Clock size={24} style={{ color: 'var(--accent)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{t('wait_time', { time: formatLocalNum(salon.wait_time, i18n.language) })}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{t('predicted_wait')}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {t('last_updated', { time: formatLocalTime(salon.updated_at || 'Just now', i18n.language) })}
                  </div>
                </div>
              );
            })}

            {salons.length === 0 && !loading && (
              <div className="glass-panel text-center">
                <p className="text-muted">{t('no_active_salons')}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
