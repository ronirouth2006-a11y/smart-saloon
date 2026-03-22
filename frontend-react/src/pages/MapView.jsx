import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Users, Clock, Navigation, Heart } from 'lucide-react';
import api from '../api';

export default function MapView() {
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationError, setLocationError] = useState('');
  const [coords, setCoords] = useState(null);
  const [notified, setNotified] = useState(new Set()); // track notified shops to prevent spam
  
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorite_salons');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchSalons = useCallback((lat, lon) => {
    setLoading(true);
    api.get(`/public/salons/nearby?user_lat=${lat}&user_lon=${lon}`)
      .then(res => {
        setSalons(res.data);
      })
      .catch(err => {
        console.error(err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

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
          // Fallback to Kolkata coords
          const lat = 22.5726, lon = 88.3639;
          setCoords({ lat, lon });
          fetchSalons(lat, lon);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser.');
      const lat = 22.5726, lon = 88.3639;
      setCoords({ lat, lon });
      fetchSalons(lat, lon);
    }
  }, [fetchSalons]);

  useEffect(() => {
    locateAndFetch();
  }, [locateAndFetch]);

  // SMART POLLING SERVICE
  useEffect(() => {
    if (!coords || favorites.length === 0) return;

    const interval = setInterval(() => {
      api.get(`/public/salons/nearby?user_lat=${coords.lat}&user_lon=${coords.lon}`)
        .then(res => {
          const newData = res.data;
          setSalons(newData); // keeps UI completely fresh too!

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
                // If it gets busy again, allow future notifications
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
    }, 60000); // 60 seconds background poll

    return () => clearInterval(interval);
  }, [coords, favorites, notified]);

  const toggleFavorite = (id) => {
    // Step 1: Request Notification Permission Hook
    if ('Notification' in window && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    setFavorites(prev => {
      const newFavs = prev.includes(id) ? prev.filter(fId => fId !== id) : [...prev, id];
      localStorage.setItem('favorite_salons', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  // Sort salons: favorites first, then by distance (already sorted by API)
  const sortedSalons = [...salons].sort((a, b) => {
    const aFav = favorites.includes(a.id);
    const bFav = favorites.includes(b.id);
    if (aFav && !bFav) return -1;
    if (!aFav && bFav) return 1;
    return 0;
  });

  return (
    <div>
      <div className="header" style={{ borderBottom: 'none', marginBottom: '1rem', padding: 0 }}>
        <h2>Nearby Salons</h2>
        <button className="btn btn-secondary" onClick={locateAndFetch} disabled={loading}>
          <RefreshCw size={18} className={loading ? 'loader' : ''} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
          Refresh
        </button>
      </div>

      {locationError && <p className="mb-3" style={{ color: 'var(--warning)' }}>{locationError}</p>}

      {loading && !salons.length ? (
        <div style={{ padding: '4rem 0', textAlign: 'center' }}>
          <div className="loader" style={{ width: '40px', height: '40px', borderWidth: '4px' }}></div>
          <p className="mt-2 text-muted">Finding nearby salons...</p>
        </div>
      ) : (
        <div className="grid-2">
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
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Waiting</div>
                  </div>
                  
                  <div style={{ flex: 1, background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <Clock size={24} style={{ color: 'var(--accent)', margin: '0 auto 0.5rem' }} />
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{salon.wait_time}m</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated</div>
                  </div>
                </div>

                <div style={{ marginTop: '1rem', borderTop: '1px solid var(--panel-border)', paddingTop: '0.75rem', textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Live Camera Update: <span style={{ color: 'var(--text-main)' }}>{salon.updated_at || 'Just now'}</span>
                </div>
              </div>
            );
          })}

          {salons.length === 0 && !loading && (
            <div className="glass-panel text-center" style={{ gridColumn: '1 / -1' }}>
              <p className="text-muted">No active salons found near you.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
