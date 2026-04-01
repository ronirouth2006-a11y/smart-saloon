import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Activity, Download, Camera, BrainCircuit, Smartphone, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    // Listen for the PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  return (
    <div className="home-container bg-map-pattern">
      
      {/* SECTION 1: HERO (Text + Buttons) */}
      <section className="hero-section animate-scale-up" style={{ maxWidth: '900px', margin: '0 auto', padding: '6rem 2rem 2rem 2rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem', lineHeight: '1.1', fontWeight: 800 }}>
          {t('future_queueing')} <span className="text-gradient">{t('salon_queueing')}</span>
        </h1>
        
        <p className="subtitle animate-slide-up delay-100" style={{ fontSize: '1.3rem', color: 'var(--text-muted)', marginBottom: '3rem', maxWidth: '700px', margin: '0 auto 3rem auto', lineHeight: '1.6' }}>
          {t('hero_desc')}
        </p>

        <div className="animate-slide-up delay-200" style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/map" className="btn btn-emerald" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', padding: '1rem 2.5rem', borderRadius: '50px' }}>
            <MapPin size={24} /> {t('find_salon_btn')}
          </Link>
          <Link to="/map" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.2rem', padding: '1rem 2.5rem', borderRadius: '50px' }}>
            {t('open_map_btn')} <ChevronRight size={20} />
          </Link>
        </div>

        {deferredPrompt && (
          <div className="animate-fade-in delay-300" style={{ marginTop: '2rem' }}>
            <button onClick={handleInstallClick} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#3b82f6', borderColor: '#3b82f6', padding: '0.8rem 1.5rem', fontSize: '1rem', borderRadius: '50px' }}>
              <Download size={20} /> {t('install_app')}
            </button>
          </div>
        )}
      </section>

      {/* TRUST BAR: The AI Loop */}
      <div className="trust-bar animate-fade-in delay-200 shimmer-effect">
        <span><Camera size={22} className="text-muted" /> Camera Tracks</span>
        <ChevronRight size={18} className="trust-arrow" />
        <span><BrainCircuit size={22} className="text-muted" /> AI Processes</span>
        <ChevronRight size={18} className="trust-arrow" />
        <span><Smartphone size={22} className="text-accent" /> You See Live</span>
      </div>

      {/* SECTION 2: FEATURES (Horizontal Grid) */}
      <section className="features-section" style={{ padding: '2rem 1rem 6rem 1rem' }}>
        <div className="grid-3" style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Link to="/map" className="glass-panel text-center animate-slide-up delay-100" style={{ display: 'block', textDecoration: 'none', color: 'var(--text-main)', padding: '2.5rem 2rem' }}>
            <MapPin size={48} className="mb-3 text-gradient" style={{ margin: '0 auto' }} />
            <h3 className="mb-2" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{t('location_based')}</h3>
            <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>{t('location_desc')}</p>
          </Link>
          
          <Link to="/map" className="glass-panel text-center animate-slide-up delay-200" style={{ display: 'block', textDecoration: 'none', color: 'var(--text-main)', padding: '2.5rem 2rem' }}>
            <Activity size={48} className="mb-3 text-gradient hover:animate-float" style={{ margin: '0 auto' }} />
            <h3 className="mb-2" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{t('realtime_tracking')}</h3>
            <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>{t('realtime_desc')}</p>
          </Link>

          <Link to="/customer/login" className="glass-panel text-center animate-slide-up delay-300" style={{ display: 'block', textDecoration: 'none', color: 'var(--text-main)', padding: '2.5rem 2rem' }}>
            <Sparkles size={48} className="mb-3 text-gradient hover:animate-float" style={{ margin: '0 auto' }} />
            <h3 className="mb-2" style={{ fontSize: '1.4rem', fontWeight: 700 }}>{t('smart_predictions')}</h3>
            <p className="text-muted" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>{t('smart_desc')}</p>
          </Link>
        </div>
      </section>
      
    </div>
  );
}
