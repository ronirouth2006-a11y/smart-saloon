import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, LogIn, Repeat } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function CustomerLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  const syncFavorites = async (token) => {
    setSyncing(true);
    try {
      // Get current local favorites
      const localFavs = JSON.parse(localStorage.getItem('favorite_salons') || '[]');
      
      const res = await api.post('/customer/favorites/sync', 
        { salon_ids: localFavs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update local storage with the merged true database state
      localStorage.setItem('favorite_salons', JSON.stringify(res.data.favorites));
    } catch (err) {
      console.error("Failed to sync favorites to cloud.", err);
    } finally {
      setSyncing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        const res = await api.post('/customer/login', {
          email: formData.email,
          password: formData.password
        });
        
        const token = res.data.access_token;
        localStorage.setItem('customer_token', token);
        
        // Push local favorites to db, then fetch truth
        await syncFavorites(token);
        
        navigate('/map');
      } else {
        await api.post('/customer/register', formData);
        // Auto switch to login state after successful signup
        setIsLogin(true);
        setError('');
        alert('Welcome! Your account is created. Please Login.');
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '400px', margin: '4rem auto' }}>
      <div className="text-center mb-4">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
          <span className="text-gradient">{isLogin ? t('customer_login_title') : t('customer_join_title')}</span>
        </h2>
        <p className="text-muted" style={{ fontSize: '1.1rem' }}>
          {isLogin ? t('customer_login_sub') : t('customer_join_sub')}
        </p>
      </div>

      <div className="glass-panel">
        <div className="text-center mb-4">
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(46, 204, 113, 0.1)', borderRadius: '50%', marginBottom: '1rem' }}>
            <User size={32} style={{ color: 'var(--success)' }} />
          </div>
        </div>

        {error && <div className="mb-3" style={{ color: 'var(--danger)', textAlign: 'center', background: 'rgba(231, 76, 60, 0.1)', padding: '0.75rem', borderRadius: '4px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="input-group">
              <label>{t('full_name')}</label>
              <input 
                type="text" 
                className="input-field" 
                required
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                placeholder="John Doe"
              />
            </div>
          )}

          <div className="input-group">
            <label>{t('email_address')}</label>
            <input 
              type="email" 
              className="input-field" 
              required
              value={formData.email}
              onChange={e => setFormData({...formData, email: e.target.value})}
              placeholder="customer@email.com"
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

          <button type="submit" className="btn w-full mt-2" disabled={loading || syncing} style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', alignItems: 'center' }}>
            {syncing ? <Repeat size={20} className="spin" /> : <LogIn size={20} />}
            {syncing ? '...' : (loading ? '...' : (isLogin ? t('login_btn') : t('create_customer_btn')))}
          </button>
        </form>

        <div className="text-center mt-4">
          <button 
            type="button" 
            onClick={() => { setIsLogin(!isLogin); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontSize: '1rem' }}
          >
            {isLogin ? t('need_account') : t('have_account_login')}
          </button>
        </div>
      </div>
    </div>
  );
}
