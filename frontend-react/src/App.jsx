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
    <div className="bg-background-main min-h-screen font-sans selection:bg-primary/30">
      {/* 🚀 NAV HEADER: Premium Launch Quality */}
      <header className="hidden lg:flex items-center justify-between px-16 py-8 bg-background-main/80 backdrop-blur-3xl border-b border-border-subtle sticky top-0 z-[1000] transition-smooth">
        <Link to="/" className="flex items-center gap-3 no-underline group">
          <div className="p-2 bg-electric-green/20 rounded-xl group-hover:bg-electric-green transition-all duration-300">
            <Scissors size={24} className="text-electric-green group-hover:text-white transition-colors" />
          </div>
          <span className="text-xl font-black tracking-tighter text-text-main uppercase">{t('app_name')}</span>
        </Link>
        
        <nav className="flex items-center gap-10 font-semibold text-[11px] tracking-[0.1em] uppercase">
          <Link to="/map" className={`hover:text-primary transition-colors ${location.pathname === '/map' ? 'text-primary' : 'text-text-muted'}`}>{t('nav_find')}</Link>
          <Link to="/customer/login" className={`hover:text-primary transition-colors ${location.pathname === '/customer/login' ? 'text-primary' : 'text-text-muted'}`}>{t('nav_customer_login')}</Link>
          <Link to="/register" className={`hover:text-primary transition-colors ${location.pathname === '/register' ? 'text-primary' : 'text-text-muted'}`}>{t('nav_register')}</Link>
          
          <div className="flex items-center gap-6 pl-6 border-l border-border-subtle">
            <button onClick={toggleTheme} className="text-text-muted hover:text-accent transition-smooth flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/5">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={theme}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </motion.div>
              </AnimatePresence>
            </button>
            <button 
              onClick={toggleLanguage} 
              className="bg-white/5 border border-border-subtle text-text-main px-4 py-1.5 rounded-full hover:bg-white/10 transition-smooth text-[10px] font-bold"
            >
              {i18n.language.startsWith('bn') ? 'ENGLISH' : 'বাংলা'}
            </button>
            <Link to="/owner/login" className="bg-primary text-background-main px-6 py-2.5 rounded-full hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth font-bold">
              {t('nav_owner_login')}
            </Link>
          </div>
        </nav>
      </header>

      {/* 📱 MOBILE HEADER: Simplified (Only Logo) */}
      <header className="lg:hidden flex justify-center py-5 bg-background-main/80 backdrop-blur-md border-b border-border-subtle">
        <Link to="/" className="flex items-center gap-2">
          <Scissors size={20} className="text-primary" />
          <span className="text-xs font-black text-text-main uppercase tracking-[0.2em]">{t('app_name')}</span>
        </Link>
      </header>

      <main className="pb-24 lg:pb-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <Routes location={location}>
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
          </motion.div>
        </AnimatePresence>
      </main>

      {/* 📱 MOBILE BOTTOM NAV */}
      <BottomNav />
    </div>
  );
}

export default App;
