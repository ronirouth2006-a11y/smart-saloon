import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  MapPin, UserPlus, Scissors, Mail, Lock, Phone, User, Store, 
  Activity, ChevronRight, Camera, CheckCircle2, Upload, Navigation, 
  Layout, ArrowLeft, RefreshCw, Star, Heart, ArrowRight, Plus
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion, AnimatePresence } from 'framer-motion';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api';

// Fix for default Leaflet markers in React
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});
L.Marker.prototype.options.icon = DefaultIcon;

function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    owner_name: '',
    email: '',
    password: '',
    phone: '',
    salon_name: '',
    location: '', // Address String
    latitude: null,
    longitude: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);
  const [locationSuccess, setLocationSuccess] = useState(false);
  const [step, setStep] = useState(1);
  const [registeredSalonId, setRegisteredSalonId] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  useEffect(() => {
    const savedStep = localStorage.getItem('pendingStep');
    const savedSalonId = localStorage.getItem('pendingSalonId');
    if (savedStep && savedSalonId) {
        setStep(parseInt(savedStep));
        setRegisteredSalonId(savedSalonId);
    }
  }, []);

  const getGPSLocation = () => {
    setLocating(true);
    setError('');
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          setLocationSuccess(true);
          setLocating(false);
        },
        (error) => {
          setError('Failed to get location automatically. Manually pick on map.');
          setLocating(false);
          setFormData({ ...formData, latitude: 22.5726, longitude: 88.3639 });
          setLocationSuccess(true);
        }
      );
    } else {
      setError('Geolocation not supported.');
      setLocating(false);
    }
  };

  const MarkerEvents = () => {
    useMapEvents({
      click(e) {
        setFormData({ ...formData, latitude: e.latlng.lat, longitude: e.latlng.lng });
      },
    });
    return formData.latitude ? (
      <Marker
        draggable={true}
        eventHandlers={{
          dragend: (e) => {
            const position = e.target.getLatLng();
            setFormData({ ...formData, latitude: position.lat, longitude: position.lng });
          },
        }}
        position={[formData.latitude, formData.longitude]}
      />
    ) : null;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (formData.latitude === null || formData.longitude === null) {
      setError('Required: Set shop location on map.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/owner/register', formData);
      const newSalonId = res.data.salon_id; // Backend currently returns 'salon_id'
      setRegisteredSalonId(newSalonId);
      localStorage.setItem('pendingStep', '2');
      localStorage.setItem('pendingSalonId', newSalonId);
      localStorage.setItem('pendingOwnerCredentials', JSON.stringify({
        email: formData.email,
        password: formData.password
      }));
      if (res.data.access_token) localStorage.setItem('tempRegistrationToken', res.data.access_token);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.detail || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile) { setError('Missing storefront photo.'); return; }
    setLoading(true);
    setError('');
    const fd = new FormData();
    fd.append('file', photoFile);
    try {
      const token = localStorage.getItem('tempRegistrationToken');
      await api.post(`/owner/${registeredSalonId}/upload-photo`, fd, {
        headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` }
      });
      localStorage.removeItem('tempRegistrationToken');
      localStorage.removeItem('pendingStep');
      localStorage.removeItem('pendingSalonId');
      navigate('/registration-pending');
    } catch (err) { setError('Upload failed.'); }
    finally { setLoading(false); }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.5 } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  return (
    <div className="bg-background-main min-h-screen text-text-main font-sans selection:bg-primary/20 pb-32">
      <div className="max-w-[1400px] mx-auto px-10 pt-20">
        
        {/* 🚀 HEADER AREA */}
        <div className="text-center mb-16 space-y-4">
           <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block p-4 bg-primary/10 rounded-3xl mb-4 border border-primary/20">
              <UserPlus size={40} className="text-primary" />
           </motion.div>
           <h1 className="text-5xl lg:text-7xl font-heading font-black tracking-tighter uppercase italic leading-[0.9]">
              Partner <span className="text-primary italic">Activation.</span>
           </h1>
           <p className="text-text-muted text-lg font-medium max-w-xl mx-auto">Digitize your salon operations and join the future of discovery.</p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start"
        >
          {/* LEFT: GUIDELINES & PROGRESS TRACKER */}
          <div className="hidden lg:flex flex-col gap-10">
             <div className="space-y-6">
                <StepIndicator active={step >= 1} number="01" title="Node Configuration" desc="Define your secure access and brand credentials." />
                <StepIndicator active={step >= 2} number="02" title="Visual Verification" desc="Upload physical storefront telemetry for audit." />
             </div>
             
             <div className="p-10 bg-background-card border border-border-subtle rounded-[48px] shadow-premium relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-3xl -z-10" />
                <div className="flex items-center gap-3 mb-6 text-accent">
                   <Activity size={24} />
                   <span className="font-black text-[10px] uppercase tracking-[0.2em]">Operational Logic</span>
                </div>
                <p className="text-text-muted leading-relaxed font-medium">Join the network to gain precision telemetry, reduce queue abandonment, and optimize staff footfall via our AI discovery engine.</p>
             </div>
          </div>

          {/* RIGHT: ONBOARDING ENGINE */}
          <div className="bg-background-card border border-border-subtle rounded-[48px] p-10 lg:p-14 shadow-premium backdrop-blur-2xl">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.form 
                  key="step1" 
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  onSubmit={handleRegister} className="space-y-8"
                >
                  <div className="space-y-6">
                    <FormInput icon={<User size={18}/>} label="OWNER NAME" value={formData.owner_name} onChange={v => setFormData({...formData, owner_name: v})} placeholder="Alex Thorne" />
                    <FormInput icon={<Mail size={18}/>} label="EMAIL ADDRESS" type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="alex@saloon.ai" />
                    <FormInput icon={<Lock size={18}/>} label="SECURE PASSWORD" type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} placeholder="••••••••" />
                    <FormInput icon={<Phone size={18}/>} label="PHONE NUMBER" value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+91 9876543210" />

                    <div className="h-[1px] bg-border-subtle my-10" />
                    
                    <FormInput icon={<Store size={18}/>} label="SALON BRAND" value={formData.salon_name} onChange={v => setFormData({...formData, salon_name: v})} placeholder="Emerald Cuts HQ" />
                    <FormInput icon={<MapPin size={18}/>} label="GEO-LOCATION" value={formData.location} onChange={v => setFormData({...formData, location: v})} placeholder="Haldia, WB" />
                  </div>

                  <div className="pt-4">
                     <button 
                       type="button" onClick={getGPSLocation}
                       className={`w-full py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-smooth border ${locationSuccess ? 'bg-primary/10 border-primary text-primary' : 'bg-background-main border-border-subtle text-text-muted hover:border-text-main'}`}
                     >
                       <MapPin size={18} /> {locating ? 'GPS LOCKING...' : (locationSuccess ? 'GPS LOCK SECURED' : 'INITIALIZE GPS TAG')}
                     </button>
                  </div>

                  {locationSuccess && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="rounded-[32px] overflow-hidden border border-border-subtle shadow-premium h-[350px]">
                       <MapContainer center={[formData.latitude, formData.longitude]} zoom={16} style={{ height: '100%', width: '100%' }}>
                          <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                          <ChangeView center={[formData.latitude, formData.longitude]} zoom={16} />
                          <MarkerEvents />
                       </MapContainer>
                    </motion.div>
                  )}

                  {error && <p className="text-danger text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}

                  <button type="submit" disabled={loading} className="w-full bg-primary text-background-main py-6 rounded-[28px] font-black text-xs uppercase tracking-[0.2em] shadow-premium hover:shadow-[0_0_20px_var(--primary-glow)] transition-smooth">
                    {loading ? 'INITIALIZING...' : 'ACTIVATE PARTNERSHIP'}
                  </button>
                </motion.form>
              ) : (
                <motion.div 
                  key="step2" 
                  variants={stepVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="text-center space-y-10"
                >
                   <div className="p-6 bg-background-main rounded-3xl border border-border-subtle">
                      <h3 className="text-2xl font-heading font-black uppercase tracking-tight mb-2">Physical Audit</h3>
                      <p className="text-text-muted text-sm font-medium">Capture a direct storefront visual to verify brand authenticity.</p>
                   </div>
  
                   <div className="relative group cursor-pointer">
                      <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} id="camera-upload" className="hidden" />
                      <label htmlFor="camera-upload" className="block">
                         {!photoPreview ? (
                           <div className="aspect-video bg-background-main border-2 border-dashed border-border-subtle rounded-[40px] flex flex-col items-center justify-center gap-6 hover:border-primary/40 transition-smooth group shadow-premium">
                              <Camera size={56} className="text-text-dim group-hover:text-primary transition-colors" />
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim">Engage Optical Sensor</span>
                           </div>
                         ) : (
                           <img src={photoPreview} alt="Preview" className="w-full h-auto rounded-[40px] border border-border-subtle shadow-premium" />
                         )}
                      </label>
                   </div>
  
                   {photoPreview && (
                     <div className="flex gap-4">
                        <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="flex-1 bg-white/5 border border-border-subtle text-text-main py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/10 transition-smooth">Reset Scan</button>
                        <button onClick={handlePhotoUpload} disabled={loading} className="flex-[2] bg-primary text-background-main py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-premium">
                           {loading ? 'SYNCING...' : 'COMPLETE ONBOARDING'}
                        </button>
                     </div>
                   )}
                   {error && <p className="text-danger text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        <div className="text-center mt-20">
          <p className="text-text-dim font-black text-[10px] uppercase tracking-[0.25em]">
             Already an active node? <Link to="/owner/login" className="text-primary hover:text-accent transition-colors ml-2 underline underline-offset-4">Authenticate HQ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const StepIndicator = ({ number, title, desc, active }) => (
  <div className={`flex items-center gap-8 p-10 rounded-[48px] border transition-smooth ${active ? 'bg-background-card border-border-bright shadow-premium' : 'bg-transparent border-transparent opacity-30 shadow-none'}`}>
     <span className={`text-4xl font-heading font-black italic tracking-tighter ${active ? 'text-primary' : 'text-text-dim'}`}>{number}</span>
     <div>
        <h4 className="text-sm font-black uppercase tracking-[0.2em] m-0">{title}</h4>
        <p className="text-[10px] text-text-dim font-bold uppercase tracking-[0.1em] m-0 mt-2">{desc}</p>
     </div>
  </div>
);

const FormInput = ({ icon, label, type="text", ...props }) => (
  <div className="space-y-3">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-dim ml-2">{label}</label>
    <div className="relative group">
       <div className="absolute left-6 top-1/2 -translate-y-1/2 text-text-dim group-focus-within:text-primary transition-smooth">{icon}</div>
       <input 
         {...props} type={type} required
         onChange={e => props.onChange(e.target.value)}
         className="w-full bg-background-main border border-border-subtle rounded-[24px] py-5 pl-16 pr-8 text-sm font-bold focus:outline-none focus:border-primary/50 focus:bg-background-card transition-smooth text-text-main shadow-inner" 
       />
    </div>
  </div>
);
