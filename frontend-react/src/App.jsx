import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import { Scissors } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Home from './pages/Home';
import MapView from './pages/MapView';
import OwnerLogin from './pages/OwnerLogin';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CustomerLogin from './pages/CustomerLogin';
import SalonDetail from './pages/SalonDetail';

function App() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('bn') ? 'en' : 'bn');
  };

  return (
    <div className="container">
      <header className="header" style={{ padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link to="/" className="header-logo" style={{ textDecoration: 'none' }}>
          <Scissors size={28} />
          <span>{t('app_name')}</span>
        </Link>
        <nav className="nav-links" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/map">{t('nav_find')}</Link>
          <Link to="/customer/login" style={{ color: 'var(--primary)' }}>{t('nav_customer_login')}</Link>
          <Link to="/register" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{t('nav_register')}</Link>
          
          <button 
            onClick={toggleLanguage} 
            style={{ 
              background: 'rgba(255,255,255,0.1)', 
              border: '1px solid rgba(255,255,255,0.2)', 
              color: '#fff', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
              backdropFilter: 'blur(12px)'
            }}
          >
            {i18n.language.startsWith('bn') ? 'EN' : 'বাং'}
          </button>

          <Link to="/owner/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem' }}>
            {t('nav_owner_login')}
          </Link>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/salons/:id" element={<SalonDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<Dashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
