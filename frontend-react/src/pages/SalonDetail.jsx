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
  Info
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
    <div style={{ background: 'var(--zomato-bg)', minHeight: '100vh', color: '#333', paddingBottom: '3rem' }}>
      
      {/* 1. Header Area (Location Bar) */}
      <div className="zomato-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          <div style={{ background: 'white', padding: '0.5rem', borderRadius: '50%', display: 'flex' }}>
            <MapPin size={18} color="var(--zomato-orange)" />
          </div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              Gandhi Nagar Col... <span style={{ fontSize: '0.7rem' }}>▼</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#555' }}>Haldia, West Bengal</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ width: '40px', height: '20px', background: '#ddd', borderRadius: '20px', position: 'relative' }}>
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '50%', position: 'absolute', right: '2px', top: '2px' }}></div>
            </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: '480px', paddingTop: '1.5rem' }}>
        
        {/* Back Link */}
        <div onClick={() => navigate('/map')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem', color: '#666', fontWeight: '500' }}>
            <ArrowLeft size={18} /> My Salons
        </div>

        {/* 2. Queue Info Card (The Blue Card) */}
        <div className="zomato-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
               <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '800' }}>Queue Status</h2>
               <p style={{ margin: '0.3rem 0 0', opacity: 0.9 }}>
                 {salon.is_active ? "Your spot is being monitored..." : "Salon is currently offline"}
               </p>
               <div style={{ marginTop: '1rem', fontSize: '0.8rem', opacity: 0.8 }}>
                 {salon.name.toUpperCase()} • {formatLocalTime(salon.updated_at.split(' (IST)')[0], 'en')}
               </div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '0.8rem', borderRadius: '12px' }}>
                <Scissors size={28} />
            </div>
          </div>
          
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button 
              onClick={fetchSalon}
              style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', cursor: 'pointer' }}
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </div>

        {/* 3. Live Tracking Map Section */}
        <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1rem' }}>
               <Timer size={18} /> Live Tracking
            </h3>
            
            <div style={{ height: '350px', borderRadius: '20px', border: '1px solid #ddd', overflow: 'hidden', position: 'relative' }}>
                {userCoords && salon.latitude && (
                    <MapContainer 
                        center={[userCoords.lat, userCoords.lon]} 
                        zoom={15} 
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ChangeView center={[userCoords.lat, userCoords.lon]} />
                        
                        <Marker position={[userCoords.lat, userCoords.lon]} icon={userIcon} />
                        <Marker position={[salon.latitude, salon.longitude]} icon={salonIcon} />
                        
                        <Polyline 
                            positions={[
                                [userCoords.lat, userCoords.lon],
                                [salon.latitude, salon.longitude]
                            ]} 
                            color="#ff7e33" 
                            dashArray="10, 10" 
                            weight={3}
                        />

                        <div className="map-distance-badge">
                            <Navigation size={14} color="var(--zomato-orange)" />
                            {distance ? `${distance} km away` : 'Calculating...'}
                        </div>
                    </MapContainer>
                )}
            </div>
        </div>

        {/* 4. Queue Progress Timeline */}
        <div>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '1rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>
               <Users size={18} /> Wait Progress
            </h3>

            <div className="timeline">
                <div className={`timeline-item ${salon.is_active ? 'active' : ''}`}>
                    <div className="timeline-dot">
                        <CheckCircle2 size={18} />
                    </div>
                    <div className="timeline-content">
                        <h4>Salon Opened</h4>
                        <p>The shop is currently accepting customers.</p>
                    </div>
                </div>

                <div className={`timeline-item ${salon.current_count > 0 ? 'active' : ''}`}>
                    <div className="timeline-dot">
                        <Users size={18} />
                    </div>
                    <div className="timeline-content">
                        <h4>In Queue</h4>
                        <p>{salon.current_count} people currently waiting in line.</p>
                    </div>
                </div>

                <div className={`timeline-item ${salon.wait_time < 10 && salon.is_active ? 'active' : ''}`}>
                    <div className="timeline-dot">
                        <Timer size={18} />
                    </div>
                    <div className="timeline-content">
                        <h4>Almost Ready</h4>
                        <p>Estimated wait time is now {salon.wait_time} minutes.</p>
                    </div>
                </div>

                <div className="timeline-item">
                    <div className="timeline-dot">
                        <Scissors size={18} />
                    </div>
                    <div className="timeline-content">
                        <h4>Service Started</h4>
                        <p>Arrive soon to skip the rush!</p>
                    </div>
                </div>
            </div>
        </div>

        {/* Staff Section */}
        {salon.barbers && salon.barbers.length > 0 && (
            <div style={{ marginTop: '2.5rem', background: 'white', padding: '1.5rem', borderRadius: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Available Barbers</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {salon.barbers.map(b => (
                        <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '0.8rem' }}>
                            <div>
                                <div style={{ fontWeight: '600' }}>{b.name}</div>
                                <div style={{ fontSize: '0.8rem', color: '#666' }}>{b.specialty}</div>
                            </div>
                            <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                LIVE
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        <button 
           onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${salon.latitude},${salon.longitude}`)}
           className="btn btn-primary w-full mt-4" 
           style={{ background: '#2d67b2', padding: '1.2rem', fontSize: '1rem', borderRadius: '15px' }}
        >
            Navigate To Salon <ChevronRight size={20} />
        </button>

      </div>
    </div>
  );
}

