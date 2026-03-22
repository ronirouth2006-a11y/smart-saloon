import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, UserPlus, Scissors } from 'lucide-react';
import api from '../api';

export default function Register() {
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
          setError('Failed to get location. Please allow location access.');
          setLocating(false);
        }
      );
    } else {
      setError('Geolocation is not supported by your browser.');
      setLocating(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      setError('Please set your shop location first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.post('/owner/register', formData);
      navigate('/owner/login', { state: { message: 'Registration successful! Please login.' } });
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '500px', margin: '4rem auto' }}>
      <div className="text-center mb-4">
        <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
          <span className="text-gradient">New Saloon Registration</span>
        </h2>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>Power your business with AI.</p>
      </div>

      <div className="glass-panel">
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <UserPlus size={32} style={{ color: 'var(--success)' }} />
          </div>
        </div>

        {error && <div className="mb-3" style={{ color: 'var(--danger)', textAlign: 'center', background: 'rgba(231, 76, 60, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleRegister}>
          <div className="form-group">
            <label className="form-label">Owner Name</label>
            <input 
              type="text" 
              className="form-control" 
              required
              value={formData.owner_name}
              onChange={e => setFormData({...formData, owner_name: e.target.value})}
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input 
              type="email" 
              className="form-control" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="admin@salon.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input 
              type="password" 
              className="form-control" 
              required
              value={formData.password}
              onChange={e => setFormData({...formData, password: e.target.value})}
              placeholder="Secure password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Phone Number</label>
            <input 
              type="tel" 
              className="form-control" 
              required
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
              placeholder="+91 9876543210"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Salon Name</label>
            <input 
              type="text" 
              className="form-control" 
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
              {locating ? 'Acquiring GPS...' : (locationSuccess ? 'Location Saved Successfully!' : 'Set My Shop Location')}
            </button>
            {!locationSuccess && <p className="text-muted mt-1 text-center" style={{ fontSize: '0.8rem' }}>Required: We use GPS to show you to nearby customers.</p>}
          </div>

          <button type="submit" className="btn w-full mt-2" disabled={loading}>
            {loading ? 'Registering...' : 'Complete Registration'}
          </button>
        </form>

        <div className="text-center mt-4">
          <p className="text-muted">
            Already have an account? <Link to="/owner/login" style={{ color: 'var(--primary)' }}>Owner Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
