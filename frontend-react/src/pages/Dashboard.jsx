import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Power, LogOut, Activity, TrendingUp, BarChart as BarChartIcon } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../api';

export default function Dashboard() {
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hourlyData, setHourlyData] = useState([]);
  const [dailyData, setDailyData] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const ownerStr = localStorage.getItem('owner');
    if (!ownerStr) {
      navigate('/owner/login');
      return;
    }
    const owner = JSON.parse(ownerStr);
    const salonId = owner.id || 1;
    
    // Fetch analytics data
    api.get(`/owner/analytics/${salonId}/weekly`)
      .then(res => {
          setHourlyData(res.data.hourly);
          setDailyData(res.data.daily);
      })
      .catch(err => console.error("Error fetching analytics", err));
  }, [navigate]);

  const toggleStatus = async () => {
    setLoading(true);
    try {
      const ownerStr = localStorage.getItem('owner');
      if(ownerStr) {
        const owner = JSON.parse(ownerStr);
        const salonId = owner.id || 1; 
        
        // This toggles status based on existing schema
        await api.put(`/owner/toggle-status`, {
          is_active: !isActive
        });
        
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

  return (
    <div style={{ maxWidth: '1000px', margin: '2rem auto' }}>
      <div className="glass-panel text-center">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h2 style={{ margin: 0 }}>Salon Dashboard</h2>
          <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
            <LogOut size={16} /> Logout
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
          <Activity size={48} className="mb-2" style={{ color: isActive ? 'var(--success)' : 'var(--danger)' }} />
          <h3 className="mb-1">Store Status</h3>
          <p className="text-muted mb-3">Turn your store online so customers can see you on the map.</p>
          
          <button 
            onClick={toggleStatus} 
            className={`btn ${isActive ? 'btn-danger' : 'btn-success'}`}
            style={{ padding: '1rem 2rem', fontSize: '1.2rem', width: '100%', maxWidth: '400px' }}
            disabled={loading}
          >
            <Power size={20} />
            {loading ? 'Processing...' : (isActive ? 'Close Store' : 'Open Store')}
          </button>
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
        
        <p className="text-muted" style={{ fontSize: '0.9rem' }}>
          When active, the AI Camera data will be pushed automatically to customers looking for salons.
        </p>
      </div>
    </div>
  );
}
