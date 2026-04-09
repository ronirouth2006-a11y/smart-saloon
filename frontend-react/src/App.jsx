import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import Home from './pages/Home';
import MapView from './pages/MapView';
import OwnerLogin from './pages/OwnerLogin';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CustomerLogin from './pages/CustomerLogin';
import SalonDetail from './pages/SalonDetail';
import Admin from './pages/Admin';
import RegistrationPending from './pages/RegistrationPending';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  
  // Theme Engine
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language.startsWith('bn') ? 'en' : 'bn');
  };

  return (
    <div className="container">
      <header className="header">
        <Link to="/" className="header-logo">
          <Scissors size={28} />
          <span>{t('app_name')}</span>
        </Link>
        <nav className="nav-links">
          <Link to="/map" style={{ color: location.pathname === '/map' ? 'var(--primary)' : 'var(--text-muted)' }}>{t('nav_find')}</Link>
          <Link to="/customer/login" style={{ color: location.pathname === '/customer/login' ? 'var(--primary)' : 'var(--text-muted)' }}>{t('nav_customer_login')}</Link>
          <Link to="/register" style={{ color: location.pathname === '/register' ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.9rem' }}>{t('nav_register')}</Link>
          
          <button 
            onClick={toggleTheme} 
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--text-main)', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0.4rem'
            }}
            title={theme === 'dark' ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <button 
            onClick={toggleLanguage} 
            style={{ 
              background: 'var(--panel-bg)', 
              border: '1px solid var(--panel-border)', 
              color: 'var(--text-main)', 
              padding: '0.4rem 0.8rem', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: 'bold',
            }}
          >
            {i18n.language.startsWith('bn') ? 'EN' : 'বাং'}
          </button>

          <Link to="/owner/login" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.9rem', borderColor: location.pathname.includes('/owner') ? 'var(--primary)' : 'var(--panel-border)' }}>
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
          <Route path="/admin" element={<Admin />} />
          <Route path="/registration-pending" element={<RegistrationPending />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
