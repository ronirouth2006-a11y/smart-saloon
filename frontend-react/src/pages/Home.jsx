import { Link } from 'react-router-dom';
import { Sparkles, MapPin, Activity, Download, Camera, BrainCircuit, Smartphone, ChevronRight, Scissors } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';

export default function Home() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
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
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
  };

  const textVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.8, ease: 'easeOut' } }
  };

  return (
    <div className="bg-background min-h-screen text-text-main overflow-x-hidden">
      
      {/* 🚀 HERO SECTION: High-Fidelity Professional Layout */}
      <section className="relative px-6 pt-24 pb-12 lg:pt-32 lg:pb-24 max-w-[1400px] mx-auto text-center">
        {/* Abstract Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-electric-green/5 blur-[120px] rounded-full -z-10" />
        <div className="absolute top-20 right-0 w-[300px] h-[300px] bg-electric-cyan/5 blur-[100px] rounded-full -z-10" />

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-background-panel/30 border border-panel-border text-electric-cyan text-xs font-black tracking-[0.2em] uppercase mb-4">
             <Activity size={14} className="animate-pulse" /> Live in West Bengal
          </motion.div>

          <motion.h1 
            variants={textVariants}
            className="text-5xl lg:text-8xl font-black tracking-tighter leading-[0.9] m-0"
          >
            {t('future_queueing')} <br/>
            <span className="text-electric-green inline-block mt-2">WAIT-LESSLY.</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg lg:text-xl text-text-muted max-w-2xl mx-auto leading-relaxed font-medium"
          >
            {t('hero_desc')}
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
          >
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/map" className="group relative bg-electric-green text-white px-10 py-5 rounded-2xl font-black text-lg no-underline transition-all shadow-sm flex items-center gap-3">
                <MapPin size={24} /> {t('find_salon_btn')}
              </Link>
            </motion.div>
            <Link to="/map" className="group flex items-center gap-3 bg-background-panel/50 border border-panel-border text-text-main px-10 py-5 rounded-2xl font-black text-lg no-underline hover:bg-background-panel/80 transition-all shadow-sm">
              {t('open_map_btn')} <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {deferredPrompt && (
            <motion.div variants={itemVariants} className="pt-4">
              <button 
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 text-text-muted hover:text-electric-cyan transition-colors text-sm font-bold bg-transparent border-none cursor-pointer"
              >
                <Download size={18} /> {t('install_app')}
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* 🔮 THE AI PROCESS: Animated Connectivity */}
      <section className="bg-background-panel/40 border-y border-panel-border py-12 mb-20">
        <div className="max-w-[1000px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-0">
          <div className="flex flex-col items-center gap-3 group">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="p-4 bg-background-panel/50 rounded-2xl border border-panel-border group-hover:border-electric-cyan transition-all">
              <Camera size={28} className="text-text-muted group-hover:text-electric-cyan" />
            </motion.div>
            <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">Camera Tracks</span>
          </div>
          <div className="hidden lg:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-panel-border to-transparent mx-8" />
          <div className="flex flex-col items-center gap-3 group">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, delay: 0.5, repeat: Infinity, ease: 'easeInOut' }} className="p-4 bg-background-panel/50 rounded-2xl border border-panel-border group-hover:border-electric-green transition-all">
              <BrainCircuit size={28} className="text-text-muted group-hover:text-electric-green" />
            </motion.div>
            <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">AI Processes</span>
          </div>
          <div className="hidden lg:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-panel-border to-transparent mx-8" />
          <div className="flex flex-col items-center gap-3 group">
            <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 3, delay: 1, repeat: Infinity, ease: 'easeInOut' }} className="p-4 bg-background-panel/50 rounded-2xl border border-panel-border group-hover:border-electric-cyan transition-all">
              <Smartphone size={28} className="text-text-muted group-hover:text-electric-cyan" />
            </motion.div>
            <span className="text-[10px] uppercase font-black tracking-widest text-text-muted">You See Live</span>
          </div>
        </div>
      </section>

      {/* 💎 FEATURES: Modern Grid with Glassmorphism */}
      <section className="max-w-[1400px] mx-auto px-6 pb-24">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          <FeatureCard 
            variants={itemVariants}
            icon={<MapPin size={40} className="text-electric-cyan" />}
            title={t('location_based')}
            desc={t('location_desc')}
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Activity size={40} className="text-electric-green" />}
            title={t('realtime_tracking')}
            desc={t('realtime_desc')}
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Sparkles size={40} className="text-electric-cyan" />}
            title={t('smart_predictions')}
            desc={t('smart_desc')}
          />
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 border-t border-white/5 text-center px-6">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Scissors size={20} className="text-electric-green" />
          <span className="font-black tracking-tighter uppercase text-white">{t('app_name')}</span>
        </div>
        <p className="text-text-muted text-xs font-bold tracking-widest uppercase">© 2026 Smart Saloon. Made with Precision.</p>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc, variants }) => (
  <motion.div 
    variants={variants}
    className="group p-10 bg-background-card/50 border border-panel-border rounded-[40px] hover:bg-background-panel/40 transition-all duration-500 backdrop-blur-3xl"
  >
    <div className="mb-6 p-4 bg-background-panel inline-block rounded-2xl group-hover:scale-110 transition-transform shadow-sm">
      {icon}
    </div>
    <h3 className="text-2xl font-black mb-4 flex items-center gap-2">{title}</h3>
    <p className="text-text-muted leading-relaxed font-medium">{desc}</p>
  </motion.div>
);
