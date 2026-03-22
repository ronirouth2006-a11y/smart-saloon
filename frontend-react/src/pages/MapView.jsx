import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Clock, Navigation, Heart } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api';

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
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState({ lat: 22.5726, lon: 88.3639 }); // Default Kolkata
  const [notified, setNotified] = useState(new Set());
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorite_salons');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchSalons = useCallback((lat, lon) => {
    setLoading(true);
    const token = localStorage.getItem('customer_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    api.get(`/public/salons/nearby?user_lat=${lat}&user_lon=${lon}`, { headers })
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
  }, [favorites]);

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
          setLocationError('Please enable location services to find nearby salons.');
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
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', paddingBottom: '2rem' }}>
      <div className="header" style={{ borderBottom: 'none', marginBottom: '1rem', padding: 0 }}>
        <h2>Nearby Salons</h2>
        <button className="btn btn-secondary" onClick={locateAndFetch} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'loader' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh Location
        </button>
      </div>

      {locationError && <p className="mb-3" style={{ color: 'var(--warning)' }}>{locationError}</p>}

      {loading && !salons.length ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p className="mt-2 text-muted">Finding nearby salons via GPS...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', alignItems: 'start' }}>
          
          {/* LEFT PANEL: INTERACTIVE MAP */}
          <div className="glass-panel" style={{ padding: 0, height: '650px', overflow: 'hidden', position: 'sticky', top: '2rem' }}>
            <MapContainer 
              center={[coords.lat, coords.lon]} 
              zoom={13} 
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxHeight: '700px', overflowY: 'auto', paddingRight: '0.5rem' }}>
            {sortedSalons.map(salon => {
              const isFavorite = favorites.includes(salon.id);
              return (
                <div key={salon.id} className="glass-panel" style={{ position: 'relative', overflow: 'hidden' }}>
                  <div style={{ 
                    position: 'absolute', top: 0, left: 0, height: '4px', width: '100%', 
                    background: salon.status === 'AVAILABLE' ? 'var(--success)' : (salon.current_count > 5 ? 'var(--danger)' : 'var(--warning)') 
                  }}></div>
                  
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
                    <span className={`status-badge ${salon.status === 'AVAILABLE' ? 'status-active' : 'status-inactive'}`}>
                      <div className="status-dot"></div>
                      {salon.status}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                    <Navigation size={16} />
                    <span>{salon.distance} km away</span>
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <Users size={24} style={{ color: 'var(--primary)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{salon.current_count}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Occupancy</div>
                    </div>
                    
                    <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                      <Clock size={24} style={{ color: 'var(--accent)', margin: '0 auto 0.5rem' }} />
                      <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{salon.wait_time}m</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Wait</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '1rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Live Camera Update: <span style={{ color: 'var(--text-main)', fontWeight: 'bold' }}>{salon.updated_at || 'Just now'}</span>
                  </div>
                </div>
              );
            })}

            {salons.length === 0 && !loading && (
              <div className="glass-panel text-center">
                <p className="text-muted">No active salons found near you.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
