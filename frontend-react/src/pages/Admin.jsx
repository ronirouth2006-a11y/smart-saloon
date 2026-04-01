import { useState, useEffect } from 'react';
import { Shield, CheckCircle, XCircle, Clock, ExternalLink, Image as ImageIcon } from 'lucide-react';
import api from '../api';

export default function Admin() {
  const [pendingSalons, setPendingSalons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchPending = async () => {
    try {
      const res = await api.get('/admin/salons/pending');
      setPendingSalons(res.data);
    } catch (err) {
      setError('Failed to load pending salons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccessMsg('');
      await api.put(`/admin/salons/${id}/approve`);
      setSuccessMsg(`Salon approved successfully!`);
      // Update local state
      setPendingSalons(pendingSalons.filter(s => s.id !== id));
    } catch (err) {
      setError('Approval failed');
    }
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto' }}>
      <div className="glass-panel mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(129, 140, 248, 0.1)' }}>
        <Shield size={40} color="var(--primary)" />
        <div>
          <h1 style={{ margin: 0 }}>Admin Approval Portal</h1>
          <p className="text-muted" style={{ margin: 0 }}>Review and approve new salon registrations to maintain quality.</p>
        </div>
      </div>

      {error && <div className="glass-panel mb-4" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)' }}>{error}</div>}
      {successMsg && <div className="glass-panel mb-4" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success)' }}>{successMsg}</div>}

      {pendingSalons.length === 0 ? (
        <div className="glass-panel text-center">
          <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>All caught up!</h3>
          <p className="text-muted">No pending salons found for approval.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {pendingSalons.map(salon => (
            <div key={salon.id} className="glass-panel" style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem', alignItems: 'start' }}>
              {/* Left Column: Photo & Location */}
              <div>
                <div style={{ 
                  width: '100%', 
                  height: '200px', 
                  background: 'rgba(0,0,0,0.2)', 
                  borderRadius: '12px', 
                  overflow: 'hidden', 
                  position: 'relative',
                  border: '1px solid var(--panel-border)'
                }}>
                  {salon.storefront_photo_url ? (
                    <img 
                      src={`http://localhost:8000${salon.storefront_photo_url}`} 
                      alt="Storefront" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = 'https://via.placeholder.com/300x200?text=Photo+Error'; }}
                    />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                      <ImageIcon size={48} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                      <span>No Photo Uploaded</span>
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                     <Clock size={16} /> Added {new Date(salon.created_at || Date.now()).toLocaleDateString()}
                   </div>
                   <a 
                    href={`https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`} 
                    target="_blank" 
                    rel="noreferrer"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}
                   >
                     <ExternalLink size={16} /> View Coordinates on Map
                   </a>
                </div>
              </div>

              {/* Right Column: Details & Actions */}
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ marginBottom: '0.5rem' }}>{salon.name}</h2>
                  <div className="text-muted mb-3" style={{ fontSize: '1.1rem' }}>{salon.location}</div>
                  
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Owner ID</label>
                      <div style={{ fontWeight: 'bold' }}>#{salon.owner_id}</div>
                    </div>
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Capacity</label>
                      <div style={{ fontWeight: 'bold' }}>{salon.max_limit} Persons</div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button 
                    className="btn" 
                    style={{ flex: 1, padding: '1rem' }}
                    onClick={() => handleApprove(salon.id)}
                  >
                    <CheckCircle size={20} /> Approve Registration
                  </button>
                  <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                    <XCircle size={20} /> Reject / Spam
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
