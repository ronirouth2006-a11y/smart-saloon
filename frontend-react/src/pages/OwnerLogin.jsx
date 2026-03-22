import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import api from '../api';

export default function OwnerLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/owner/login', {
        email,
        password
      });
      // Simple mock state, since the backend doesn't seem to return a JWT in your base repo.
      // We will store the owner details in localStorage.
      localStorage.setItem('owner', JSON.stringify({
        email: email,
        id: response.data.saloon_id || 1, // Fallback if backend doesn't send
      }));
      navigate('/owner/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="glass-panel text-center">
        <div style={{ background: 'rgba(88, 166, 255, 0.1)', width: '64px', height: '64px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
          <LogIn size={32} style={{ color: 'var(--primary)' }} />
        </div>
        <h2 className="mb-1">Owner Portal</h2>
        <p className="text-muted mb-3">Manage your salon status</p>

        {error && <div className="mb-3" style={{ color: 'var(--danger)', background: 'rgba(218,54,51,0.1)', padding: '0.5rem', borderRadius: '8px' }}>{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Email Address</label>
            <input 
              type="email" 
              className="input-field" 
              placeholder="owner@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="input-group" style={{ textAlign: 'left' }}>
            <label>Password</label>
            <input 
              type="password" 
              className="input-field" 
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button type="submit" className="btn" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <div className="loader"></div> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
