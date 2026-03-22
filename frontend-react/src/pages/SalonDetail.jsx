import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Camera, Users, Clock, Heart, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';
import { formatLocalNum, formatLocalTime } from '../utils/locale';

export default function SalonDetail() {
  const { id } = useParams();
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  useEffect(() => {
    const fetchSalon = async () => {
      try {
        const token = localStorage.getItem('customer_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await api.get(`/public/salons/${id}`, { headers });
        setSalon(res.data);
      } catch (err) {
        setError('Failed to locate salon. It might be closed or unregistered.');
      } finally {
        setLoading(false);
      }
    };
    fetchSalon();
  }, [id]);

  const toggleFavorite = async () => {
    if (!salon) return;
    
    const token = localStorage.getItem('customer_token');
    const currentFavs = JSON.parse(localStorage.getItem('favorite_salons') || '[]');
    const isFav = currentFavs.includes(salon.id);
    const newFavs = isFav ? currentFavs.filter(fid => fid !== salon.id) : [...currentFavs, salon.id];
    
    localStorage.setItem('favorite_salons', JSON.stringify(newFavs));
    setSalon({ ...salon, is_favorited: !isFav });

    if (token) {
      try {
        await api.post('/customer/favorites/sync', 
          { salon_ids: newFavs }, 
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } catch (err) {
        console.error("Cloud Sync Failed", err);
      }
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  if (error || !salon) {
    return (
      <div className="text-center" style={{ marginTop: '4rem' }}>
        <h2 style={{ color: 'var(--danger)' }}>{error}</h2>
        <Link to="/map" className="btn mt-4">{t('back_to_map')}</Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <Link to="/map" style={{ color: 'var(--primary)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', textDecoration: 'none' }}>
        <ArrowLeft size={20} /> {t('back_to_map')}
      </Link>

      <div className="glass-panel text-center" style={{ padding: '3rem 2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <div style={{ padding: '1.5rem', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '50%' }}>
            <Camera size={48} className="text-gradient" />
          </div>
        </div>
        
        <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{salon.name}</h1>
        <p className="text-muted mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
          <Clock size={16} /> {t('last_updated', { time: formatLocalTime(salon.updated_at.split(' (IST)')[0], i18n.language) })}
        </p>

        <div style={{ 
          background: 'rgba(0,0,0,0.3)', 
          padding: '2rem', 
          borderRadius: '12px',
          border: '1px solid var(--panel-border)',
          display: 'flex',
          justifyContent: 'space-around',
          alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <div>
            <h4 className="text-muted mb-1" style={{ fontSize: '1rem' }}>{t('current_crowd')}</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '2.5rem', fontWeight: 'bold' }}>
              <Users size={32} /> {formatLocalNum(salon.current_count, i18n.language)}
            </div>
          </div>
          
          <div style={{ width: '1px', background: 'var(--panel-border)', height: '60px' }}></div>
          
          <div>
            <h4 className="text-muted mb-1" style={{ fontSize: '1rem' }}>{t('predicted_wait')}</h4>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontSize: '2.5rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              <Clock size={32} /> {formatLocalNum(salon.wait_time, i18n.language)}<span style={{ fontSize: '1.2rem', color: 'var(--text-muted)' }}>m</span>
            </div>
          </div>
        </div>

        <button 
          className="btn" 
          onClick={toggleFavorite}
          style={{ 
            width: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '0.5rem', 
            fontSize: '1.2rem', 
            padding: '1rem',
            background: salon.is_favorited ? 'rgba(231, 76, 60, 0.1)' : 'var(--primary)',
            color: salon.is_favorited ? 'var(--danger)' : '#fff',
            borderColor: salon.is_favorited ? 'var(--danger)' : 'var(--primary)'
          }}
        >
          <Heart size={24} fill={salon.is_favorited ? 'var(--danger)' : 'none'} color={salon.is_favorited ? 'var(--danger)' : 'currentColor'} />
          {salon.is_favorited ? t('remove_watchlist') : t('add_watchlist')}
        </button>

      </div>
    </div>
  );
}
