import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { Scissors, Sun, Moon } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import MapView from './pages/MapView';
import OwnerLogin from './pages/OwnerLogin';
import Dashboard from './pages/Dashboard';
import Register from './pages/Register';
import CustomerLogin from './pages/CustomerLogin';
import SalonDetail from './pages/SalonDetail';
import AdminPortal from './pages/AdminPortal';
import RegistrationPending from './pages/RegistrationPending';
import BottomNav from './components/BottomNav';

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
    <div className="bg-background min-h-screen font-sans">
      {/* 🚀 NAV HEADER: Modern Glassmorphism (Hidden on Mobile for cleaner View) */}
      <header className="hidden lg:flex items-center justify-between px-12 py-6 bg-background-panel/60 backdrop-blur-3xl border-b border-panel-border sticky top-0 z-[1000]">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="p-2 bg-electric-green/20 rounded-xl group-hover:bg-electric-green transition-all duration-300">
            <Scissors size={24} className="text-electric-green group-hover:text-white transition-colors" />
          </div>
          <span className="text-xl font-black tracking-tighter text-text-main uppercase">{t('app_name')}</span>
        </Link>
        
        <nav className="flex items-center gap-8 font-bold text-xs tracking-widest uppercase">
          <Link to="/map" className={`hover:text-electric-green transition-colors ${location.pathname === '/map' ? 'text-electric-green' : 'text-text-muted'}`}>{t('nav_find')}</Link>
          <Link to="/customer/login" className={`hover:text-electric-green transition-colors ${location.pathname === '/customer/login' ? 'text-electric-green' : 'text-text-muted'}`}>{t('nav_customer_login')}</Link>
          <Link to="/register" className={`hover:text-electric-green transition-colors ${location.pathname === '/register' ? 'text-electric-green' : 'text-text-muted'}`}>{t('nav_register')}</Link>
          
          <div className="flex items-center gap-4 pl-4 border-l border-white/10">
            <button onClick={toggleTheme} className="text-text-muted hover:text-electric-cyan transition-colors flex items-center justify-center w-8 h-8">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
                </motion.div>
              </AnimatePresence>
            </button>
            <button 
              onClick={toggleLanguage} 
              className="bg-white/5 border border-white/10 text-white px-3 py-1 rounded-lg hover:bg-white/10 transition-all text-[10px]"
            >
              {i18n.language.startsWith('bn') ? 'EN' : 'বাং'}
            </button>
            <Link to="/owner/login" className="bg-electric-green text-white px-5 py-2 rounded-xl hover:bg-electric-neon transition-all shadow-sm">
              {t('nav_owner_login')}
            </Link>
          </div>
        </nav>
      </header>

      {/* 📱 MOBILE HEADER: Simplified (Only Logo) */}
      <header className="lg:hidden flex justify-center py-4 bg-background-panel/40 backdrop-blur-md border-b border-panel-border">
        <Link to="/" className="flex items-center gap-2">
          <Scissors size={20} className="text-electric-green" />
          <span className="text-sm font-black text-text-main uppercase tracking-wider">{t('app_name')}</span>
        </Link>
      </header>

      <main className="pb-24 lg:pb-0">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/salons/:id" element={<SalonDetail />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer/login" element={<CustomerLogin />} />
          <Route path="/owner/login" element={<OwnerLogin />} />
          <Route path="/owner/dashboard" element={<Dashboard />} />
          <Route path="/admin-portal" element={<AdminPortal />} />
          <Route path="/registration-pending" element={<RegistrationPending />} />
        </Routes>
      </main>

      {/* 📱 MOBILE BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}

export default App;
