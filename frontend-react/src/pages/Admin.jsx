import { useState, useEffect, useMemo } from 'react';
import { Shield, CheckCircle, XCircle, Clock, ExternalLink, Image as ImageIcon, Search, Trash2, MapPin } from 'lucide-react';
import api from '../api';

export default function Admin() {
  const [salons, setSalons] = useState([]);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending' or 'manage'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [locationSearch, setLocationSearch] = useState('');

  const fetchData = async (tab) => {
    setLoading(true);
    try {
      const endpoint = tab === 'pending' ? '/admin/salons/pending' : '/admin/salons/approved';
      const res = await api.get(endpoint);
      setSalons(res.data);
    } catch (err) {
      setError(`Failed to load ${tab} salons`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(activeTab);
  }, [activeTab]);

  const handleApprove = async (id) => {
    try {
      setError('');
      setSuccessMsg('');
      await api.put(`/admin/salons/${id}/approve`);
      setSuccessMsg(`Salon approved successfully!`);
      setSalons(salons.filter(s => s.id !== id));
    } catch (err) {
      setError('Approval failed');
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to REJECT this listing? It will no longer appear in your pending queue.")) return;
    try {
      setError('');
      setSuccessMsg('');
      await api.delete(`/admin/salons/${id}/reject`);
      setSuccessMsg(`Registration rejected.`);
      setSalons(salons.filter(s => s.id !== id));
    } catch (err) {
      setError('Reject failed');
    }
  };

  const handlePermanentDelete = async (id, name) => {
    if (!window.confirm(`⚠️ DANGER: Are you sure you want to PERMANENTLY DELETE "${name}"? This will remove all analytics, live status, and user data. This cannot be undone!`)) return;
    try {
      setError('');
      setSuccessMsg('');
      await api.delete(`/admin/salons/${id}/permanent`);
      setSuccessMsg(`Salon "${name}" deleted permanently.`);
      setSalons(salons.filter(s => s.id !== id));
    } catch (err) {
      setError('Deletion failed');
    }
  };

  const filteredSalons = useMemo(() => {
    if (!locationSearch) return salons;
    return salons.filter(s => 
      s.location.toLowerCase().includes(locationSearch.toLowerCase()) ||
      s.name.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [salons, locationSearch]);

  if (loading && salons.length === 0) {
    return <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}><div className="loader"></div></div>;
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto', padding: '0 1rem' }}>
      {/* 🛡️ ADMIN HEADER */}
      <div className="glass-panel mb-4" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(129, 140, 248, 0.1)' }}>
        <Shield size={40} color="var(--primary)" />
        <div>
          <h1 style={{ margin: 0 }}>Admin Control Center</h1>
          <p className="text-muted" style={{ margin: 0 }}>Oversee registrations and manage active salon listings.</p>
        </div>
      </div>

      {/* 📑 TAB NAVIGATION */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--panel-border)', paddingBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab('pending')}
          className={`btn ${activeTab === 'pending' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '50px', padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
        >
          <Clock size={16} /> Pending Approvals ({activeTab === 'pending' ? salons.length : '?'})
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          className={`btn ${activeTab === 'manage' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ borderRadius: '50px', padding: '0.6rem 1.5rem', fontSize: '0.9rem' }}
        >
          <CheckCircle size={16} /> Manage All Shops
        </button>
      </div>

      {/* 🔍 SEARCH (Only for Manage Tab) */}
      {activeTab === 'manage' && (
        <div className="glass-panel mb-4" style={{ padding: '1rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              className="input-field" 
              placeholder="Search by shop name or location..." 
              value={locationSearch}
              onChange={(e) => setLocationSearch(e.target.value)}
              style={{ paddingLeft: '2.8rem' }}
            />
          </div>
        </div>
      )}

      {error && <div className="glass-panel mb-4" style={{ color: 'var(--danger)', background: 'rgba(239, 68, 68, 0.1)', borderColor: 'var(--danger)' }}>{error}</div>}
      {successMsg && <div className="glass-panel mb-4" style={{ color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', borderColor: 'var(--success)' }}>{successMsg}</div>}

      {/* 📋 SALON LIST */}
      {filteredSalons.length === 0 ? (
        <div className="glass-panel text-center" style={{ padding: '4rem' }}>
          <CheckCircle size={48} color="var(--success)" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <h3>No salons found</h3>
          <p className="text-muted">There are no salons matching this criteria currently.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {filteredSalons.map(salon => (
            <div key={salon.id} className="glass-panel" style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 2fr', gap: '1.5rem', alignItems: 'start' }}>
              {/* Left Column: Media & Meta */}
              <div>
                <div style={{ width: '100%', height: '160px', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--panel-border)' }}>
                  {salon.storefront_photo_url ? (
                    <img src={`${api.defaults.baseURL}${salon.storefront_photo_url}`} alt="Store" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><ImageIcon size={40} opacity={0.3} /></div>
                  )}
                </div>
              </div>

              {/* Right Column: Content & Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{salon.name}</h2>
                    <div className="text-muted" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.9rem' }}>
                      <MapPin size={14} /> {salon.location}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.1)', padding: '0.2rem 0.6rem', borderRadius: '4px', color: 'var(--text-muted)' }}>
                    ID: #{salon.id}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                   {activeTab === 'pending' ? (
                     <>
                       <button onClick={() => handleApprove(salon.id)} className="btn" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                         <CheckCircle size={16} /> Approve
                       </button>
                       <button onClick={() => handleReject(salon.id)} className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}>
                         <XCircle size={16} /> Reject
                       </button>
                     </>
                   ) : (
                     <>
                        <a 
                          href={`https://www.google.com/maps?q=${salon.latitude},${salon.longitude}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="btn btn-secondary"
                          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                        >
                          <ExternalLink size={16} /> View map
                        </a>
                        <button 
                          onClick={() => handlePermanentDelete(salon.id, salon.name)} 
                          className="btn btn-secondary" 
                          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                        >
                          <Trash2 size={16} /> Delete Shop
                        </button>
                     </>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
