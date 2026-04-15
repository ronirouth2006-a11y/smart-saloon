import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Map, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const BottomNav = () => {
  return (
    <motion.nav 
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-[2000] lg:hidden bg-background-main/90 backdrop-blur-2xl border-t border-border-subtle pt-3 pb-safe px-8 flex justify-between items-center shadow-premium"
    >
      <TabItem to="/" icon={<Home size={22} />} label="Discover" />
      <TabItem to="/map" icon={<Map size={22} />} label="Near Me" />
      <TabItem to="/owner/dashboard" icon={<LayoutDashboard size={22} />} label="HQ" />
      <TabItem to="/admin-portal" icon={<ShieldCheck size={22} />} label="Admin" />
    </motion.nav>
  );
};

const TabItem = ({ to, icon, label }) => {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => 
        `flex flex-col items-center gap-1.5 transition-smooth ${
          isActive ? 'text-primary' : 'text-text-dim hover:text-text-muted'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <div className="relative">
            {icon}
            {isActive && (
              <motion.div 
                layoutId="navTab"
                className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full border-2 border-background-main"
              />
            )}
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
        </>
      )}
    </NavLink>
  );
};

export default BottomNav;
