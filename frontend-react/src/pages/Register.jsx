import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, UserPlus, Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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

// Helper component to recenter map when location is found
function ChangeView({ center, zoom }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    salon_name: '',
    latitude: null,
    longitude: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);

  // Verification Step Variables
  const [step, setStep] = useState(1);
  const [registeredSalonId, setRegisteredSalonId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // 🔄 RECOVERY LOGIC: Check if user was previously in Step 2
  useEffect(() => {
    const savedStep = localStorage.getItem('pendingStep');
    const savedSalonId = localStorage.getItem('pendingSalonId');
    if (savedStep && savedSalonId) {
        setStep(parseInt(savedStep));
        setRegisteredSalonId(parseInt(savedSalonId));
    }
  }, []);

  const getGPSLocation = () => {
    setLocating(true);
    setError('');
    
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationSuccess(true);
          setLocating(false);
        },
        (error) => {
          setLocating(false);
          // Auto-scroll to map
          setTimeout(() => {
              document.getElementById('map-picker')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        },
        (error) => {
          setError('Failed to get location automatically. Please use the map below to set it manually.');
          setLocating(false);
          // Set a default center (e.g. Kolkata) so they can drag from somewhere
          setFormData({
            ...formData,
            latitude: 22.5726,
            longitude: 88.3639
          });
          setLocationSuccess(true); 
          setTimeout(() => {
              document.getElementById('map-picker')?.scrollIntoView({ behavior: 'smooth' });
          }, 300);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };

  // Draggable Marker component logic
  const MarkerEvents = () => {
    useMapEvents({
      click(e) {
        setFormData({ ...formData, latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    
    return formData.latitude ? (
      <Marker
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const marker = e.target;
            const position = marker.getLatLng();
            setFormData({ ...formData, latitude: position.lat, longitude: position.lng });
          },
        }}
        position={[formData.latitude, formData.longitude]}
      />
    ) : null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      setError('Please set your shop location first.');
      return;
    }

    setLoading(true);
    setError('');

    // 🧹 Clean slate: remove any old owner login data to avoid conflicts
    localStorage.removeItem('owner');
    localStorage.removeItem('pendingOwnerCredentials');
    localStorage.removeItem('pendingStep');
    localStorage.removeItem('pendingSalonId');

    try {
      const res = await api.post('/owner/register', formData);
      const newSalonId = res.data.salon_id;
      setRegisteredSalonId(newSalonId);
      
      // Store credentials for status polling/persistence
      localStorage.setItem('pendingOwnerCredentials', JSON.stringify({
        email: formData.email,
        password: formData.password
      }));

      // 🔄 Store progress for recovery
      localStorage.setItem('pendingStep', '2');
      localStorage.setItem('pendingSalonId', newSalonId);

      // Store token so step 2 can authenticate
      if (res.data.access_token) {
        localStorage.setItem('tempRegistrationToken', res.data.access_token);
      }
      
      setStep(2); // Move to the photo verification step
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) {
      setError('Please take a photo of your storefront first.');
      return;
    }
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', photoFile);

    try {
      // Get the token we just saved during step 1
      const token = localStorage.getItem('tempRegistrationToken');

      await api.post(`/owner/${registeredSalonId}/upload-photo`, formData, {
        headers: { 
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      // Clean up temp tokens and progress
      localStorage.removeItem('tempRegistrationToken');
      localStorage.removeItem('pendingStep');
      localStorage.removeItem('pendingSalonId');
      
      navigate('/registration-pending');
    } catch (err) {
      setError(err.response?.data?.detail || 'Photo upload failed. You may need to retry later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div className="text-center mb-4">
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <span className="text-gradient">{t('register_title')}</span>
        </h2>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>{t('register_subtitle')}</p>
      </div>

      <div className="glass-panel">
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <UserPlus size={32} style={{ color: 'var(--success)' }} />
          </div>
          {step === 2 && <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Step 2: Storefront Verification</h3>}
        </div>

        {error && <div className="mb-3" style={{ color: 'var(--danger)', textAlign: 'center', background: 'rgba(231, 76, 60, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}

        {step === 1 ? (

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label>{t('owner_name')}</label>
            <input 
              type="text" 
              className="input-field" 
              required
              value={formData.owner_name}
              onChange={e => setFormData({...formData, owner_name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="input-group">
            <label>{t('email_address')}</label>
            <input 
              type="email" 
              className="input-field" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="admin@salon.com"
            />
          </div>

          <div className="input-group">
            <label>{t('password')}</label>
            <input 
              type="password" 
              className="input-field" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <div className="input-group">
            <label>{t('phone_number')}</label>
            <input 
              type="tel" 
              className="input-field" 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="input-group">
            <label>{t('salon_name')}</label>
            <input 
              type="text" 
              className="input-field" 
              required
              value={formData.salon_name}
              onChange={e => setFormData({...formData, salon_name: e.target.value})}
              placeholder="e.g. Kolaghat Premium Cuts"
            />
          </div>

          <div className="form-group mt-4 mb-4">
            <button 
              type="button"
              className="btn btn-secondary w-full" 
              onClick={getGPSLocation}
              disabled={locating || locationSuccess}
              style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', borderColor: locationSuccess ? 'var(--success)' : 'var(--panel-border)' }}
            >
              <MapPin size={20} style={{ color: locationSuccess ? 'var(--success)' : 'inherit' }} />
              {locating ? t('acquiring_gps') : (locationSuccess ? t('location_success') : t('set_location'))}
            </button>
            
            {locationSuccess && (
                <div id="map-picker" style={{ marginTop: '1rem', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '2px solid var(--panel-border)' }}>
                    <p className="text-muted" style={{ fontSize: '0.85rem', margin: '0.5rem 0', textAlign: 'center' }}>
                        Is the GPS slightly off? <strong>Drag the pin</strong> to point strictly to your salon's roof.
                    </p>
                    <MapContainer 
                        center={[formData.latitude, formData.longitude]} 
                        zoom={16} 
                        style={{ height: 'calc(100% - 30px)', width: '100%' }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                        <ChangeView center={[formData.latitude, formData.longitude]} zoom={16} />
                        <MarkerEvents />
                    </MapContainer>
                </div>
            )}
            
            {!locationSuccess && <p className="text-muted mt-1 text-center" style={{ fontSize: '0.8rem' }}>Required: We use GPS to show you to nearby customers.</p>}
          </div>

          <button type="submit" className="btn w-full mt-2" disabled={loading}>
            {loading ? '...' : t('register_btn')}
          </button>
        </form>
        ) : (
          <div className="text-center">
            <p className="text-muted mb-4">
              To prevent fake salon registrations and ensure quality for our customers, please take a live photo of your salon's storefront or signboard.
            </p>

            <div style={{ marginBottom: '1.5rem' }}>
              {!photoPreview ? (
                <div style={{ border: '2px dashed var(--panel-border)', padding: '2rem', borderRadius: '12px' }}>
                  <input 
                    type="file" 
                    accept="image/*" 
                    capture="environment" 
                    onChange={handlePhotoCapture} 
                    id="camera-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="camera-upload" className="btn btn-primary" style={{ cursor: 'pointer', display: 'inline-block' }}>
                    Capture Storefront Photo
                  </label>
                </div>
              ) : (
                <div>
                  <img src={photoPreview} alt="Storefront Preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--panel-border)', marginBottom: '1rem' }} />
                  <br />
                  <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="btn btn-secondary mr-2" style={{ marginRight: '1rem' }}>Retake</button>
                  <button onClick={handlePhotoUpload} className="btn btn-emerald" disabled={loading}>
                    {loading ? 'Uploading...' : 'Submit Verification'}
                  </button>
                </div>
              )}
            </div>

            <p className="text-muted" style={{ fontSize: '0.85rem' }}>Your store will only be activated on the live map after admin review of this photo.</p>
          </div>
        )}

        <div className="text-center mt-4">
          <p className="text-muted">
            {t('already_have_account')} <Link to="/owner/login" style={{ color: 'var(--primary)' }}>{t('nav_owner_login')}</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
