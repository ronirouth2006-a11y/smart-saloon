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
    <div className="bg-background-main min-h-screen text-text-main overflow-x-hidden selection:bg-primary/20">
      
      {/* 🚀 HERO SECTION: Flagship Startup Identity */}
      <section className="relative px-6 pt-32 pb-20 lg:pt-48 lg:pb-32 max-w-[1400px] mx-auto text-center">
        {/* Subtle Ambient Glows (Reduced Intensity) */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-primary/5 blur-[150px] rounded-full -z-10" />
        
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-10"
        >
          <motion.div variants={itemVariants} className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-border-subtle text-accent text-[10px] font-black tracking-[0.2em] uppercase mb-4 backdrop-blur-md">
             <div className="w-2 h-2 rounded-full bg-primary pulse-primary" /> 
             Live Network • West Bengal
          </motion.div>

          <motion.h1 
            variants={textVariants}
            className="text-6xl lg:text-9xl font-heading font-black tracking-tight leading-[0.85] m-0"
          >
            THE FUTURE<br/>
            OF <span className="text-primary italic">FLOW.</span>
          </motion.h1>
          
          <motion.p 
            variants={itemVariants}
            className="text-lg lg:text-2xl text-text-muted max-w-3xl mx-auto leading-relaxed font-medium"
          >
            Eliminate the wait. Discover premium salons, monitor live crowd telemetry, and arrive exactly when your chair is ready.
          </motion.p>

          <motion.div 
            variants={itemVariants}
            className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-10"
          >
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link to="/map" className="group relative bg-primary text-background-main px-12 py-6 rounded-3xl font-black text-xl no-underline transition-smooth shadow-premium flex items-center gap-3">
                <MapPin size={24} /> Locate Salon
              </Link>
            </motion.div>
            <Link to="/map" className="group flex items-center gap-3 bg-white/5 border border-border-subtle text-text-main px-12 py-6 rounded-3xl font-black text-xl no-underline hover:bg-white/10 transition-smooth">
              Open Intelligence <ChevronRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>

          {deferredPrompt && (
            <motion.div variants={itemVariants} className="pt-6">
              <button 
                onClick={handleInstallClick}
                className="inline-flex items-center gap-2 text-text-dim hover:text-primary transition-smooth text-xs font-bold uppercase tracking-widest bg-transparent border-none cursor-pointer"
              >
                <Download size={18} /> Install Application
              </button>
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* 🔮 THE AI PIPELINE: Industrial Visual Story */}
      <section className="bg-background-card border-y border-border-subtle py-16 mb-24">
        <div className="max-w-[1200px] mx-auto px-10 flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-0">
          <ProcessStep icon={<Camera size={32} />} label="Vision Capture" delay={0} />
          <Connector />
          <ProcessStep icon={<BrainCircuit size={32} />} label="AI Analysis" delay={0.5} color="text-primary" />
          <Connector />
          <ProcessStep icon={<Smartphone size={32} />} label="Real-time Feed" delay={1} />
        </div>
      </section>

      {/* 💎 CORE ENGINE: Modern Product Grid */}
      <section className="max-w-[1400px] mx-auto px-10 pb-32">
        <div className="mb-20 text-center space-y-4">
           <h2 className="text-4xl lg:text-6xl font-heading font-black tracking-tight uppercase">Operational <span className="text-primary italic">Edge.</span></h2>
           <p className="text-text-muted text-lg font-medium">Precision tools for the modern salon ecosystem.</p>
        </div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="grid grid-cols-1 md:grid-cols-3 gap-10"
        >
          <FeatureCard 
            variants={itemVariants}
            icon={<MapPin size={32} className="text-accent" />}
            title="Discovery Intelligence"
            desc="Hyper-local salon discovery backed by actual wait-time metrics, not just distance."
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Activity size={32} className="text-primary" />}
            title="Queue Telemetry"
            desc="Live headcount tracking using distributed AI vision to guarantee queue accuracy."
          />
          <FeatureCard 
            variants={itemVariants}
            icon={<Sparkles size={32} className="text-accent" />}
            title="Smart Forecasting"
            desc="Predictive wait-times that learn from daily footfall patterns and staff availability."
          />
        </motion.div>
      </section>

      {/* FOOTER: Minimalist Branded */}
      <footer className="py-20 border-t border-border-subtle bg-background-card/50">
        <div className="max-w-[1400px] mx-auto px-10 flex flex-col md:flex-row justify-between items-center gap-10">
           <div className="flex items-center gap-3">
             <Scissors size={24} className="text-primary" />
             <span className="text-xl font-heading font-black tracking-tighter uppercase text-white">Smart Saloon</span>
           </div>
           
           <div className="flex gap-10 text-[10px] font-black uppercase tracking-[0.25em] text-text-dim">
              <Link to="/map" className="hover:text-primary transition-smooth">Network</Link>
              <Link to="/register" className="hover:text-primary transition-smooth">Onboard</Link>
              <Link to="/owner/login" className="hover:text-primary transition-smooth">HQ Access</Link>
           </div>

           <p className="text-text-dim text-[10px] font-bold tracking-[0.2em] uppercase">© 2026 Smart Saloon • Built for the Future</p>
        </div>
      </footer>
    </div>
  );
}

const ProcessStep = ({ icon, label, delay, color = "text-text-muted" }) => (
  <div className="flex flex-col items-center gap-5 group">
    <motion.div 
      animate={{ y: [0, -12, 0] }} 
      transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }} 
      className="p-6 bg-background-main rounded-3xl border border-border-subtle group-hover:border-primary/40 transition-smooth shadow-premium"
    >
      <div className={`${color} group-hover:text-primary transition-colors`}>{icon}</div>
    </motion.div>
    <span className="text-[11px] uppercase font-black tracking-[0.2em] text-text-muted group-hover:text-text-main transition-colors">{label}</span>
  </div>
);

const Connector = () => (
  <div className="hidden lg:block h-[1px] flex-1 bg-gradient-to-r from-transparent via-border-subtle to-transparent mx-12" />
);

const FeatureCard = ({ icon, title, desc, variants }) => (
  <motion.div 
    variants={variants}
    className="group p-12 bg-background-card border border-border-subtle rounded-[48px] hover:border-primary/20 transition-smooth shadow-premium hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
  >
    <div className="mb-8 p-5 bg-background-main inline-block rounded-2xl group-hover:scale-110 transition-smooth border border-border-subtle group-hover:border-primary/30">
      {icon}
    </div>
    <h3 className="text-3xl font-heading font-black mb-5 tracking-tight">{title}</h3>
    <p className="text-text-muted text-base leading-relaxed font-medium group-hover:text-text-main transition-colors">{desc}</p>
  </motion.div>
);
