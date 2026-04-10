import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, User, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[2000] lg:hidden bg-background-panel/80 backdrop-blur-xl border-t border-white/5 py-2 px-6 flex justify-between items-center safe-area-bottom shadow-[0_-10px_30px_rgba(0,0,0,0.5)]"
    >
      <TabItem to="/" icon={<Home size={22} />} label="Home" />
      <TabItem to="/map" icon={<Map size={22} />} label="Map" />
      <TabItem to="/dashboard" icon={<ShieldCheck size={22} />} label="Owner" />
      <TabItem to="/admin" icon={<User size={22} />} label="Admin" />
    </motion.nav>
  );
};

const TabItem = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center gap-1 transition-all duration-300 ${
          isActive ? 'text-electric-green scale-110' : 'text-text-muted opacity-60'
        }`
      }
    >
      <div className="relative">
        {icon}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
    </NavLink>
  );
};

export default BottomNav;
