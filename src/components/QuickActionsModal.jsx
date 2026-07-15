import React from 'react';
import { Cpu, Upload, HelpCircle, FileJson, X, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickActionsModal({ isOpen, onClose, onSelectAction }) {
  if (!isOpen) return null;

  const actions = [
    {
      id: 'mcq',
      title: 'Start with AI Investigator',
      desc: 'Answer a few questions',
      icon: <Cpu className="w-5 h-5 text-accentTeal" />,
      color: 'border-accentTeal/20 hover:border-accentTeal/50'
    },
    {
      id: 'evidence',
      title: 'Upload Evidence First',
      desc: 'Let AI analyze the evidence',
      icon: <Upload className="w-5 h-5 text-accentPurple" />,
      color: 'border-accentPurple/20 hover:border-accentPurple/50'
    },
    {
      id: 'quick',
      title: 'Quick Input',
      desc: 'Describe the incident in your own words',
      icon: <Terminal className="w-5 h-5 text-yellow-500" />,
      color: 'border-yellow-500/20 hover:border-yellow-500/50'
    },
    {
      id: 'import',
      title: 'Import from Case File',
      desc: 'Use existing case data',
      icon: <FileJson className="w-5 h-5 text-gray-400" />,
      color: 'border-gray-800 hover:border-gray-700'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-filter backdrop-blur-md flex items-center justify-center p-4 z-50">
      
      {/* Modal Card */}
      <motion.div 
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-md bg-[#121222]/95 border border-gray-800 rounded-2xl p-6 relative shadow-2xl"
      >
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-6">
          <h3 className="text-lg font-bold text-white font-mono uppercase tracking-wider">New Investigation</h3>
          <p className="text-xs text-gray-400 mt-1">Choose a starting point</p>
        </div>

        {/* Option Grid */}
        <div className="space-y-3">
          {actions.map((act) => (
            <button
              key={act.id}
              onClick={() => onSelectAction(act.id)}
              className={`w-full flex items-center gap-4 p-4 bg-[#0b0b14]/65 hover:bg-[#0b0b14] border rounded-xl text-left transition duration-300 ${act.color} group`}
            >
              <div className="p-3 bg-[#121222] border border-gray-800 rounded-lg group-hover:scale-105 transition">
                {act.icon}
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white group-hover:text-accentTeal transition">{act.title}</h4>
                <p className="text-xs text-gray-400 mt-0.5">{act.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Cancel Button */}
        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 bg-[#0b0b14] hover:bg-gray-900 border border-gray-850 text-gray-400 hover:text-white text-xs font-mono font-bold uppercase tracking-wider rounded-lg transition"
        >
          Cancel
        </button>
      </motion.div>
    </div>
  );
}
