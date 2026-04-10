import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { MapPin, UserPlus, Scissors, Mail, Lock, Phone, User, Store, Activity, ChevronRight, Camera, CheckCircle } from 'lucide-react';
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
    if (!formData.latitude || !formData.longitude) {
      setError('Required: Set shop location on map.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/owner/register', formData);
      const newSalonId = res.data.id; // Corrected to use sanitized 'id'
      setRegisteredSalonId(newSalonId);
      localStorage.setItem('pendingStep', '2');
      localStorage.setItem('pendingSalonId', newSalonId);
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

  return (
    <div className="bg-background min-h-screen text-text-main pb-24 pt-12 px-6">
      <div className="max-w-[700px] mx-auto text-center mb-12">
         <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="inline-block p-4 bg-electric-green/10 rounded-[30px] mb-6">
            <UserPlus size={40} className="text-electric-green" />
         </motion.div>
         <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase italic m-0 line-height-[0.9]">
            {t('register_title')} <span className="text-electric-green">INITIATION</span>
         </h1>
         <p className="text-text-muted font-bold tracking-[0.2em] text-xs uppercase mt-4">{t('register_subtitle')}</p>
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-[1000px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
      >
        {/* LEFT COLUMN: GUIDELINES & PROGRESS */}
        <div className="hidden lg:flex flex-col gap-6 pt-8">
           <StepIndicator active={step >= 1} number="01" title="Credentials" desc="Set your enterprise name & access keys." />
           <StepIndicator active={step >= 2} number="02" title="Geocode" desc="Tag your exact location in West Bengal." />
           <StepIndicator active={step >= 3} number="03" title="Verification" desc="Upload live imagery for admin audit." />
           
           <div className="mt-8 p-8 bg-background-panel/50 border border-white/5 rounded-[40px] backdrop-blur-3xl">
              <div className="flex items-center gap-3 mb-4 text-electric-cyan">
                 <Activity size={24} />
                 <span className="font-black text-xs uppercase tracking-widest">Why Register?</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed font-medium">Join the largest real-time salon network in India. Reduce wait times, increase footfall, and manage your staff with AI-driven analytics.</p>
           </div>
        </div>

        {/* RIGHT COLUMN: FORM ENGINE */}
        <div className="bg-background-card/40 border border-white/5 rounded-[40px] p-8 lg:p-12 shadow-2xl backdrop-blur-2xl">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.form 
                key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                onSubmit={handleRegister} className="space-y-6"
              >
                <div className="space-y-4">
                  <InputWithIcon icon={<User size={18}/>} label={t('owner_name')} value={formData.owner_name} onChange={v => setFormData({...formData, owner_name: v})} placeholder="Full Legal Name" />
                  <InputWithIcon icon={<Mail size={18}/>} label={t('email_address')} type="email" value={formData.email} onChange={v => setFormData({...formData, email: v})} placeholder="admin@enterprise.com" />
                  <InputWithIcon icon={<Lock size={18}/>} label={t('password')} type="password" value={formData.password} onChange={v => setFormData({...formData, password: v})} placeholder="Security Protocol" />
                  <InputWithIcon icon={<Phone size={18}/>} label={t('phone_number')} value={formData.phone} onChange={v => setFormData({...formData, phone: v})} placeholder="+91 XXXX XXX XXX" />
                  
                  <div className="h-[1px] bg-white/5 my-8" />
                  
                  <InputWithIcon icon={<Store size={18}/>} label="Salon Identity" value={formData.salon_name} onChange={v => setFormData({...formData, salon_name: v})} placeholder="Public Display Name" />
                  <InputWithIcon icon={<MapPin size={18}/>} label="Physical Address" value={formData.location} onChange={v => setFormData({...formData, location: v})} placeholder="St, Area, City, Pin" />
                </div>

                <div className="pt-6">
                   <button 
                     type="button" onClick={getGPSLocation}
                     className={`w-full py-4 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all border ${locationSuccess ? 'bg-electric-green/10 border-electric-green text-electric-green' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                   >
                     <MapPin size={18} /> {locating ? 'GPS LOCKING...' : (locationSuccess ? 'VIRTUAL TAG READY' : 'TAG GPS COORDINATES')}
                   </button>
                </div>

                {locationSuccess && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl h-[300px]">
                     <MapContainer center={[formData.latitude, formData.longitude]} zoom={16} style={{ height: '100%', width: '100%' }}>
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
                        <ChangeView center={[formData.latitude, formData.longitude]} zoom={16} />
                        <MarkerEvents />
                     </MapContainer>
                  </motion.div>
                )}

                {error && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}

                <button type="submit" disabled={loading} className="w-full bg-electric-green text-black py-5 rounded-[24px] font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-electric-neon transition-all">
                  {loading ? 'MODULATING...' : 'INITIATE REGISTRATION'}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="text-center space-y-8"
              >
                 <div className="p-4 bg-white/5 rounded-2xl border border-white/10">
                    <h3 className="text-xl font-black m-0 mb-2 uppercase">Physical Audit</h3>
                    <p className="text-text-muted text-sm border-t border-white/5 pt-4">Capture your storefront to prevent spoofing and verify location accuracy.</p>
                 </div>

                 <div className="relative group cursor-pointer">
                    <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} id="camera-upload" className="hidden" />
                    <label htmlFor="camera-upload" className="block">
                       {!photoPreview ? (
                         <div className="aspect-video bg-charcoal-dark border-2 border-dashed border-white/10 rounded-[32px] flex flex-col items-center justify-center gap-4 hover:border-electric-cyan/40 transition-all">
                            <Camera size={48} className="text-text-muted group-hover:text-electric-cyan" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-text-muted">Engage Optical Sensor</span>
                         </div>
                       ) : (
                         <img src={photoPreview} alt="Preview" className="w-full h-auto rounded-[32px] border border-white/10 shadow-2xl" />
                       )}
                    </label>
                 </div>

                 {photoPreview && (
                   <div className="flex gap-4">
                      <button onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} className="flex-1 bg-white/5 border border-white/10 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">Retake</button>
                      <button onClick={handlePhotoUpload} disabled={loading} className="flex-[2] bg-electric-green text-black py-4 rounded-xl font-black text-[10px] uppercase tracking-widest">
                         {loading ? 'UPLOADING...' : 'COMPLETE PROTOCOL'}
                      </button>
                   </div>
                 )}
                 {error && <p className="text-red-400 text-[10px] font-black uppercase tracking-widest text-center">{error}</p>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div className="text-center mt-12">
        <p className="text-text-muted font-bold text-xs uppercase tracking-widest">
           {t('already_have_account')} <Link to="/owner/login" className="text-electric-cyan shadow-cyan">AUTHENTICATE HERE</Link>
        </p>
      </div>
    </div>
  );
}

const StepIndicator = ({ number, title, desc, active }) => (
  <div className={`flex items-center gap-6 p-6 rounded-[32px] border transition-all duration-500 ${active ? 'bg-white/5 border-white/10' : 'bg-transparent border-transparent opacity-20'}`}>
     <span className={`text-3xl font-black italic tracking-tighter ${active ? 'text-electric-green' : 'text-white/20'}`}>{number}</span>
     <div>
        <h4 className="text-sm font-black m-0 uppercase tracking-widest">{title}</h4>
        <p className="text-[10px] text-text-muted font-medium m-0 mt-1 uppercase tracking-widest">{desc}</p>
     </div>
  </div>
);

const InputWithIcon = ({ icon, label, type="text", ...props }) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted ml-1">{label}</label>
    <div className="relative group">
       <div className="absolute left-5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-electric-cyan transition-colors">{icon}</div>
       <input 
         {...props} type={type} required
         onChange={e => props.onChange(e.target.value)}
         className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold focus:outline-none focus:border-electric-cyan/50 transition-all text-white" 
       />
    </div>
  </div>
);
