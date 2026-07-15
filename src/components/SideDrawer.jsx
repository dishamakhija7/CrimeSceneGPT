import React from 'react';
import { 
  X, LayoutDashboard, FileText, Cpu, Settings, 
  HelpCircle, Info, LogOut, ShieldAlert, FolderHeart, Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SideDrawer({ isOpen, onClose, activeView, onNavigate, onLogout, onNewInvestigation }) {
  if (!isOpen) return null;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'new', label: 'New Investigation', icon: <Plus className="w-5 h-5" />, action: onNewInvestigation },
    { id: 'cases', label: 'My Cases', icon: <FolderHeart className="w-5 h-5" /> },
    { id: 'mcq', label: 'AI Investigator', icon: <Cpu className="w-5 h-5" /> },
    { id: 'report', label: 'Reports', icon: <FileText className="w-5 h-5" /> },
  ];

  const subItems = [
    { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
    { id: 'support', label: 'Help & Support', icon: <HelpCircle className="w-4 h-4" /> },
    { id: 'about', label: 'About Us', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-40 flex">
      {/* Backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.5 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Drawer Panel */}
      <motion.div 
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative w-72 bg-[#121222]/95 border-r border-gray-800 h-full flex flex-col justify-between z-50 shadow-2xl"
      >
        {/* Top Header */}
        <div>
          <div className="p-5 flex justify-between items-center border-b border-gray-850">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-accentTeal animate-pulse" />
              <span className="text-sm font-bold tracking-widest text-white font-mono">CRIMESCENE SYSTEM</span>
            </div>
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-white transition p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-5 bg-[#0b0b14]/50 border-b border-gray-850 flex items-center gap-3">
            <img 
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=80&h=80&q=80" 
              alt="Avatar" 
              className="w-10 h-10 rounded-full border border-accentPurple object-cover" 
            />
            <div>
              <h4 className="text-xs font-bold text-white">Inspector Arjun</h4>
              <p className="text-[9px] text-gray-500 font-mono">Lead Investigator</p>
            </div>
          </div>

          {/* Main Menu Links */}
          <nav className="p-4 space-y-1.5">
            {menuItems.map((item) => {
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.action) {
                      item.action();
                    } else {
                      onNavigate(item.id);
                    }
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-lg text-sm transition font-medium ${
                    isActive 
                      ? 'bg-accentPurple/25 text-white border-l-2 border-accentTeal shadow-sm' 
                      : 'text-gray-400 hover:text-white hover:bg-white/[0.02]'
                  }`}
                >
                  <span className={isActive ? 'text-accentTeal' : 'text-gray-500'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Menu Items */}
        <div className="p-4 border-t border-gray-850 bg-[#0b0b14]/30 space-y-3">
          <div className="space-y-1">
            {subItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 rounded text-xs text-gray-500 hover:text-gray-300 transition"
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          {/* Logout */}
          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/5 transition font-semibold"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
