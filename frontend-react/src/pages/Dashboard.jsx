import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Power, LogOut, Activity, TrendingUp, BarChart as BarChartIcon, Download, Users as UsersIcon, Settings as SettingsIcon, Plus, Trash2, MapPin } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import * as htmlToImage from 'html-to-image';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../api';

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview'); // overview, staff, settings
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const [isApproved, setIsApproved] = useState(true);
  const [currentCount, setCurrentCount] = useState(0);
  const [cameraCount, setCameraCount] = useState(0);
  const [manualOffset, setManualOffset] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [timeAgo, setTimeAgo] = useState('');
  const [isPulseWeak, setIsPulseWeak] = useState(false);
  
  // Staff State
  const [barbers, setBarbers] = useState([]);
  const [newBarberName, setNewBarberName] = useState('');
  const [newBarberSpecs, setNewBarberSpecs] = useState('');

  // Settings State
  const [salonName, setSalonName] = useState('');
  const [maxLimit, setMaxLimit] = useState(8);
  const [phone, setPhone] = useState('');
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');
  
  const navigate = useNavigate();

  // The active salon ID from the owner session
  const activeSalonId = localStorage.getItem('owner') ? JSON.parse(localStorage.getItem('owner')).id || "" : "";

  useEffect(() => {
    const ownerStr = localStorage.getItem('owner');
    if (!ownerStr) {
      navigate('/owner/login');
      return;
    }
    const owner = JSON.parse(ownerStr);
    const salonId = owner.id || "";
    
    // Fetch analytics data
      api.get(`/owner/analytics/${salonId}/weekly`)
      .then(res => {
          console.log("Analytics Data [v" + res.data.version + "]:", res.data);
          setHourlyData(res.data.hourly);
          setDailyData(res.data.daily);
      })
      .catch(err => console.error("Error fetching analytics", err));

    // Fetch Barbers
    api.get('/owner/barbers')
      .then(res => setBarbers(res.data))
      .catch(err => console.error("Error fetching barbers", err));

    // Fetch Salon Details for Settings
      api.get(`/public/salons/${salonId}`)
      .then(res => {
        setSalonName(res.data.name);
        setPhone(res.data.assistant_phone || '');
        setMaxLimit(res.data.max_limit || 8);
        setLat(res.data.latitude || '');
        setLon(res.data.longitude || '');
        // Note: is_active and is_approved might not be exposed in /public/ if not approved,
        // but for owners we will assume they get their own data or it's returned here.
        if (res.data.hasOwnProperty('is_approved')) {
            setIsApproved(res.data.is_approved);
        }
        setIsActive(res.data.is_active || false);
        setCurrentCount(res.data.current_count || 0);
        setCameraCount(res.data.camera_count || 0);
        setManualOffset(res.data.manual_offset || 0);
        setLastUpdated(res.data.last_updated_at);
      })
      .catch(err => console.error("Error fetching settings", err));

    // BACKGROUND POLLING (10s)
    const interval = setInterval(() => {
      api.get(`/public/salons/${salonId}`)
        .then(res => {
          setIsActive(res.data.is_active || false);
          setCameraCount(res.data.camera_count || 0);
          setManualOffset(res.data.manual_offset || 0);
          setLastUpdated(res.data.last_updated_at);
          setCurrentCount(res.data.current_count || 0);
        })
        .catch(err => console.error("Dashboard poll error", err));
    }, 10000);

    return () => clearInterval(interval);
  }, [navigate]);
  
  // Update "time ago" every second
  useEffect(() => {
    if (!lastUpdated) return;
    
    const updateTimer = () => {
      const now = new Date();
      const last = new Date(lastUpdated);
      const diffInSeconds = Math.floor((now - last) / 1000);
      
      if (diffInSeconds < 60) {
        setTimeAgo(`${diffInSeconds}s ago`);
      } else {
        const mins = Math.floor(diffInSeconds / 60);
        const secs = diffInSeconds % 60;
        setTimeAgo(`${mins}m ${secs}s ago`);
      }
      
      // Weak pulse if > 3 mins (180s)
      setIsPulseWeak(diffInSeconds > 180);
    };
    
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  const addBarber = async () => {
    if (!newBarberName || !newBarberSpecs) return;
    try {
      const res = await api.post('/owner/barbers', { name: newBarberName, specialty: newBarberSpecs });
      setBarbers([...barbers, res.data]);
      setNewBarberName('');
      setNewBarberSpecs('');
    } catch (err) { alert('Failed to add staff'); }
  };

  const removeBarber = async (id) => {
    try {
      await api.delete(`/owner/barbers/${id}`);
      setBarbers(barbers.filter(b => b.id !== id));
    } catch (err) { alert('Failed to remove staff'); }
  };

  const updateSettings = async () => {
    try {
      await api.patch('/owner/salon', {
        name: salonName,
        max_limit: maxLimit,
        assistant_phone: phone,
        latitude: parseFloat(lat),
        longitude: parseFloat(lon)
      });
      alert('Settings Updated successfully!');
    } catch (err) { alert('Failed to update settings'); }
  };

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const ownerStr = localStorage.getItem('owner');
      if(ownerStr) {
        await api.put(`/owner/toggle-status`, { is_active: !isActive });
        setIsActive(!isActive);
      }
    } catch (err) {
        console.error(err);
        alert('Failed to update status');
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('owner');
    navigate('/owner/login');
  };

  const updateOffset = async (newOffset) => {
    if (newOffset < 0) return;
    try {
        const ownerStr = localStorage.getItem('owner');
        if (ownerStr) {
            // Optimistic update
            setManualOffset(newOffset);
            setCurrentCount(cameraCount + newOffset);
            await api.patch(`/owner/salon`, { manual_offset: newOffset });
        }
    } catch (err) {
        console.error(err);
        alert('Failed to update manual offset');
        // Revert on failure
        setManualOffset(manualOffset);
        setCurrentCount(cameraCount + manualOffset);
    }
  };

  const downloadQRCode = () => {
    const node = document.getElementById('qr-scan-container');
    if (!node) return;
    
    htmlToImage.toPng(node)
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `smart-saloon-qr-${activeSalonId}.png`;
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error('QR Download Failed', err));
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <div className="glass-panel text-center">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>{t('salon_dashboard')}</h2>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
            <LogOut size={16} /> {t('logout')}
          </button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid var(--panel-border)' }}>
          <button 
            onClick={() => setActiveTab('overview')} 
            className={`btn ${activeTab === 'overview' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : 'none', borderRadius: '8px 8px 0 0' }}
          >
            Overview
          </button>
          <button 
            onClick={() => setActiveTab('staff')} 
            className={`btn ${activeTab === 'staff' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: activeTab === 'staff' ? '2px solid var(--primary)' : 'none', borderRadius: '8px 8px 0 0' }}
          >
            Staff Management
          </button>
          <button 
            onClick={() => setActiveTab('settings')} 
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderBottom: activeTab === 'settings' ? '2px solid var(--primary)' : 'none', borderRadius: '8px 8px 0 0' }}
          >
            Salon Settings
          </button>
        </div>

        {activeTab === 'overview' && (
          <>
            {/* Marketing Kit Section */}
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              padding: '2rem', 
              borderRadius: '12px',
              border: '1px solid var(--panel-border)',
              marginBottom: '2rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <h3 className="mb-2 text-gradient">Marketing Kit: QR Engine</h3>
              <p className="text-muted mb-4 text-center">Print this code and place it on your window. Customers scan it with their phone to join the waitlist instantly without an app.</p>
              
              <div 
                id="qr-scan-container" 
                style={{ 
                  background: '#ffffff', 
                  padding: '2rem', 
                  borderRadius: '16px', 
                  display: 'inline-flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                  marginBottom: '1.5rem'
                }}
              >
                <QRCodeSVG 
                  value={`https://smart-saloon.vercel.app/salons/${activeSalonId}`} 
                  size={220}
                  fgColor="#2ecc71"
                  level="H"
                />
                <h4 style={{ color: '#121212', marginTop: '1.2rem', marginBottom: 0, fontWeight: 800, fontSize: '1.3rem' }}>
                  Scan to Skip the Wait!
                </h4>
              </div>

              <button onClick={downloadQRCode} className="btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', borderColor: '#3b82f6' }}>
                <Download size={20} /> Download High-Res PNG
              </button>
            </div>

            {/* Status Toggle Section */}
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              padding: '2rem', 
              borderRadius: '12px',
              border: '1px solid var(--panel-border)',
              marginBottom: '2rem'
            }}>
              {!isApproved && (
                  <div style={{ marginBottom: '1.5rem', background: 'rgba(241, 196, 15, 0.15)', color: '#f1c40f', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(241, 196, 15, 0.3)', textAlign: 'left' }}>
                      <strong>⏳ Pending Admin Verification</strong>
                      <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem' }}>Your store will not be visible on the public map until our admin team verifies your submission.</p>
                  </div>
              )}

              <Activity size={48} className="mb-2" style={{ color: isActive ? 'var(--success)' : 'var(--danger)' }} />
              <h3 className="mb-1">{t('store_status')}</h3>
              <p className="text-muted mb-3">{t('store_status_desc')}</p>
              
              <button 
                onClick={toggleStatus} 
                className={`btn ${isActive ? 'btn-primary' : 'btn-success'}`}
                style={{ padding: '1rem 2rem', fontSize: '1.2rem', width: '100%', maxWidth: '400px', backgroundColor: isActive ? 'var(--danger)' : 'var(--success)', opacity: !isApproved ? 0.5 : 1 }}
                disabled={loading || !isApproved}
                title={!isApproved ? "Wait for admin approval to open store" : ""}
              >
                <Power size={20} />
                {loading ? 'Processing...' : (isActive ? t('close_store') : t('open_store'))}
              </button>

              {isActive && lastUpdated && (
                <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: isPulseWeak ? 'var(--danger)' : 'var(--text-muted)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isPulseWeak ? 'var(--danger)' : 'var(--success)', animation: isPulseWeak ? 'none' : 'pulse 2s infinite' }}></div>
                    Last camera pulse: <strong style={{ color: isPulseWeak ? 'var(--danger)' : 'inherit' }}>{timeAgo}</strong>
                  </span>
                  {isPulseWeak && <p style={{ fontSize: '0.75rem', marginTop: '0.2rem', color: 'var(--danger)' }}>Connection weak. Check your camera feed.</p>}
                </div>
              )}
            </div>

            {/* Manual Crowd Control Section */}
            <div style={{ 
              background: 'rgba(0,0,0,0.2)', 
              padding: '2rem', 
              borderRadius: '12px',
              border: '1px solid var(--panel-border)',
              marginBottom: '2rem'
            }}>
              <UsersIcon size={48} className="mb-2" style={{ color: 'var(--primary)' }} />
              <h3 className="mb-1">Manual Crowd Offset</h3>
              <p className="text-muted mb-3">Add hidden customers (like people in private cutting rooms) to the total count. This combines with your AI Camera feed!</p>
              
              <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-around', alignItems: 'center', background: 'rgba(0,0,0,0.3)', padding: '1.5rem', borderRadius: '12px', gap: '1rem' }}>
                  <div style={{ textAlign: 'center' }}>
                      <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>AI CAMERA</div>
                      <motion.div key={cameraCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-main)', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '8px', display: 'inline-block' }}>{cameraCount}</motion.div>
                  </div>
                  
                  <div style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }}>+</div>
                  
                  <div style={{ textAlign: 'center' }}>
                      <div className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>MANUAL OFFSET</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', background: 'rgba(129, 140, 248, 0.1)', padding: '0.5rem', borderRadius: '12px' }}>
                          <button onClick={() => updateOffset(manualOffset - 1)} className="btn btn-secondary" style={{ padding: '0.4rem', minWidth: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }} disabled={manualOffset <= 0}>-</button>
                          <motion.span key={manualOffset} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} style={{ fontSize: '2rem', fontWeight: 700, minWidth: '40px', color: 'var(--primary)', textAlign: 'center', display: 'inline-block' }}>{manualOffset}</motion.span>
                          <button onClick={() => updateOffset(manualOffset + 1)} className="btn btn-primary" style={{ padding: '0.4rem', minWidth: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>+</button>
                      </div>
                  </div>
                  
                  <div style={{ fontSize: '1.8rem', color: 'var(--text-muted)' }}>=</div>
                  
                  <div style={{ textAlign: 'center' }}>
                      <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', letterSpacing: '0.5px' }}>TOTAL SHOWN</div>
                      <motion.div key={currentCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }} style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', textShadow: '0 0 15px rgba(16, 185, 129, 0.4)', display: 'inline-block' }}>{currentCount}</motion.div>
                  </div>
              </div>
            </div>

            {/* Analytics Section - Dual Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                
                {/* Left Chart: Hourly Trends (Emerald Green) */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                        <TrendingUp size={24} style={{ color: '#2ecc71' }} />
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Live Hourly Trend</h3>
                    </div>
                    <div style={{ height: '250px', width: '100%' }}>
                        {hourlyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={hourlyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="hour" stroke="var(--text-muted)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--panel-border)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#2ecc71', fontWeight: 'bold' }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="count" 
                                name="Customers"
                                stroke="#2ecc71" 
                                strokeWidth={4}
                                dot={{ fill: 'var(--bg-dark)', stroke: '#2ecc71', strokeWidth: 2, r: 4 }}
                                activeDot={{ fill: '#2ecc71', stroke: '#fff', strokeWidth: 2, r: 6 }}
                                animationDuration={1500}
                            />
                            </LineChart>
                        </ResponsiveContainer>
                        ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><div className="loader"></div></div>
                        )}
                    </div>
                </div>

                {/* Right Chart: 7-Day Footfall (Sun Flower Yellow) */}
                <div style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem', borderRadius: '12px', border: '1px solid var(--panel-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem', justifyContent: 'center' }}>
                        <BarChartIcon size={24} style={{ color: '#f1c40f' }} />
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>7-Day Footfall History</h3>
                    </div>
                    <div style={{ height: '250px', width: '100%' }}>
                        {dailyData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={dailyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                            <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickMargin={10} axisLine={false} tickLine={false} />
                            <YAxis stroke="var(--text-muted)" fontSize={11} allowDecimals={false} axisLine={false} tickLine={false} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.95)', border: '1px solid var(--panel-border)', borderRadius: '12px', color: '#fff' }}
                                itemStyle={{ color: '#f1c40f', fontWeight: 'bold' }}
                                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                            />
                            <Bar 
                                dataKey="footfall" 
                                name="Total Footfall" 
                                fill="#f1c40f" 
                                radius={[6, 6, 0, 0]} 
                                animationDuration={1500}
                            />
                            </BarChart>
                        </ResponsiveContainer>
                        ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><div className="loader"></div></div>
                        )}
                    </div>
                </div>
            </div>
          </>
        )}

        {activeTab === 'staff' && (
          <div className="glass-panel" style={{ textAlign: 'left', padding: '2rem' }}>
            <h3 className="mb-4"><UsersIcon size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Staff Management</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '1rem', marginBottom: '2rem' }}>
              <input 
                className="input-field" 
                placeholder="Barber Name" 
                value={newBarberName} 
                onChange={e => setNewBarberName(e.target.value)} 
              />
              <input 
                className="input-field" 
                placeholder="Specialty (e.g. Haircut)" 
                value={newBarberSpecs} 
                onChange={e => setNewBarberSpecs(e.target.value)} 
              />
              <button className="btn btn-emerald" onClick={addBarber}><Plus size={20} /> Add Staff</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {barbers.map(b => (
                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                  <div>
                    <h4 style={{ margin: 0 }}>{b.name}</h4>
                    <small className="text-muted">{b.specialty}</small>
                  </div>
                  <button onClick={() => removeBarber(b.id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
              {barbers.length === 0 && <p className="text-muted">No staff members added yet.</p>}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass-panel" style={{ textAlign: 'left', padding: '2rem' }}>
            <h3 className="mb-4"><SettingsIcon size={24} style={{ verticalAlign: 'middle', marginRight: '0.5rem' }} /> Salon Settings</h3>
            
            <div style={{ display: 'grid', gap: '1.5rem' }}>
              <div className="input-group">
                <label>Salon Name</label>
                <input className="input-field" value={salonName} onChange={e => setSalonName(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Max Crowd Limit (AI Threshold)</label>
                <input type="number" className="input-field" value={maxLimit} onChange={e => setMaxLimit(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Assistant Phone</label>
                <input className="input-field" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="input-group">
                  <label>Latitude</label>
                  <input className="input-field" value={lat} onChange={e => setLat(e.target.value)} />
                </div>
                <div className="input-group">
                  <label>Longitude</label>
                  <input className="input-field" value={lon} onChange={e => setLon(e.target.value)} />
                </div>
              </div>
              <button className="btn btn-emerald" style={{ marginTop: '1rem' }} onClick={updateSettings}>Save All Changes</button>
            </div>
          </div>
        )}
        
        <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '2rem' }}>
          {t('camera_data_desc')}
        </p>
      </div>
    </div>
  );
}
