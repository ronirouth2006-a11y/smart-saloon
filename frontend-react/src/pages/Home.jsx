import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Activity, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          setDeferredPrompt(null);
        }
      });
    }
  };

  return (
    <div style={{ padding: '4rem 0' }}>
      <div className="text-center mb-4">
        <h1 style={{ fontSize: '3.5rem', marginBottom: '1rem', fontWeight: 800 }}>
          <span className="text-gradient">{t('skip_wait')}</span> {t('find_empty')}
        </h1>
        <p className="text-muted" style={{ fontSize: '1.2rem', maxWidth: '600px', margin: '0 auto' }}>
          {t('hero_desc')}
        </p>
      </div>

      <div className="text-center mb-4" style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/map" className="btn" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
          {t('find_salon_btn')}
        </Link>
        <Link to="/map" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.2rem' }}>
          {t('open_map_btn')}
        </Link>
        {deferredPrompt && (
          <button 
            className="btn btn-secondary" 
            onClick={handleInstallClick}
            style={{ padding: '1rem 2rem', fontSize: '1.2rem', display: 'flex', gap: '0.5rem', alignItems: 'center', justifyContent: 'center', borderColor: 'var(--success)', color: 'var(--success)' }}
          >
            <Download size={20} />
            {t('install_app')}
          </button>
        )}
      </div>

      <div className="grid-3 mt-4">
        <div className="glass-panel text-center">
          <MapPin size={40} className="mb-2 text-gradient" />
          <h3 className="mb-1">Location Based</h3>
          <p className="text-muted">Instantly find salons near you utilizing accurate Haversine geolocation.</p>
        </div>
        
        <div className="glass-panel text-center">
          <Activity size={40} className="mb-2 text-gradient" />
          <h3 className="mb-1">Real-time Tracking</h3>
          <p className="text-muted">Powerful AI cameras count the crowd live. No more guessing if it's busy.</p>
        </div>

        <div className="glass-panel text-center">
          <Sparkles size={40} className="mb-2 text-gradient" />
          <h3 className="mb-1">Smart Predictions</h3>
          <p className="text-muted">Our algorithm predicts your exact wait time based on the active crowd.</p>
        </div>
      </div>
    </div>
  );
}
