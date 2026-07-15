import React, { useState } from 'react';
import { Shield, Sparkles, MapPin, Eye, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ConfidenceHeatmap() {
  const [selectedPoint, setSelectedPoint] = useState({
    id: 1,
    name: 'Primary Collision Zone',
    x: 320,
    y: 160,
    confidence: 88,
    level: 'High',
    color: 'text-green-400 bg-green-500/10 border-green-500/30',
    description: 'Calculated impact spot based on skid marks alignment & vehicle deformation vectors.'
  });

  const hotspots = [
    {
      id: 1,
      name: 'Primary Collision Zone',
      x: '50%',
      y: '50%',
      confidence: 88,
      level: 'High',
      color: 'bg-green-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]',
      descColor: 'text-green-400 bg-green-500/10 border-green-500/30',
      description: 'Calculated impact spot based on skid marks alignment & vehicle deformation vectors.'
    },
    {
      id: 2,
      name: 'Initial Brake Action Point',
      x: '35%',
      y: '48%',
      confidence: 65,
      level: 'Medium',
      color: 'bg-yellow-500 shadow-[0_0_20px_rgba(245,158,11,0.8)]',
      descColor: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
      description: 'Tire skid inception spot. Confidence limited by wet road surface condition.'
    },
    {
      id: 3,
      name: 'Post-Impact Car A Rest Spot',
      x: '62%',
      y: '60%',
      confidence: 94,
      level: 'High',
      color: 'bg-green-500 shadow-[0_0_20px_rgba(16,185,129,0.8)]',
      descColor: 'text-green-400 bg-green-500/10 border-green-500/30',
      description: 'Final location where Car A came to rest, matching GPS metadata precisely.'
    },
    {
      id: 4,
      name: 'Car B Secondary Impact',
      x: '58%',
      y: '30%',
      confidence: 38,
      level: 'Low',
      color: 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.8)]',
      descColor: 'text-red-400 bg-red-500/10 border-red-500/30',
      description: 'Potential barrier side-swipe. Poor lighting conditions limit CCTV clarity here.'
    }
  ];

  const handlePointClick = (point) => {
    setSelectedPoint({
      id: point.id,
      name: point.name,
      x: point.x,
      y: point.y,
      confidence: point.confidence,
      level: point.level,
      color: point.descColor,
      description: point.description
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      {/* Outer grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Heatmap Visualization Overlay */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-[#121222]/90 border border-gray-800 rounded-xl overflow-hidden shadow-xl relative">
            {/* Header tab selectors */}
            <div className="flex border-b border-gray-800 p-2 justify-between bg-[#0b0b14]/50">
              <div className="flex gap-2">
                <button className="px-3 py-1 text-xs font-mono rounded bg-accentPurple text-white">
                  Heatmap Overlay
                </button>
                <button className="px-3 py-1 text-xs font-mono rounded text-gray-400 hover:text-white">
                  Confidence List
                </button>
              </div>
              <span className="text-[10px] font-mono text-gray-500 self-center pr-2">TAP DOTS FOR DETAIL ANALYSIS</span>
            </div>

            {/* Heatmap Area */}
            <div className="relative bg-[#0b0b14] w-full aspect-video md:h-[320px] cyber-grid overflow-hidden flex items-center justify-center">
              
              {/* Custom glowing spatial background simulation */}
              <div className="absolute inset-0 bg-[#09090e] opacity-90" />
              
              {/* Drawing background road layout for context */}
              <svg className="absolute inset-0 w-full h-full opacity-20 pointer-events-none" viewBox="0 0 600 320">
                <path d="M 0,160 L 600,160" stroke="#5D33F8" strokeWidth="60" fill="none" />
                <path d="M 300,0 L 300,320" stroke="#5D33F8" strokeWidth="60" fill="none" />
              </svg>

              {/* Glowing gradients representing confidence zones */}
              {/* Zone A (Green/High) */}
              <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-500/10 rounded-full blur-2xl pointer-events-none" />
              {/* Zone B (Yellow/Medium) */}
              <div className="absolute top-[48%] left-[35%] -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl pointer-events-none" />
              {/* Zone C (Red/Low) */}
              <div className="absolute top-[30%] left-[58%] -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

              {/* Hotspots */}
              {hotspots.map((point) => (
                <button
                  key={point.id}
                  onClick={() => handlePointClick(point)}
                  style={{ top: point.y, left: point.x }}
                  className={`absolute w-4.5 h-4.5 rounded-full border border-white/60 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition hover:scale-125 z-20 cursor-pointer ${point.color}`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                </button>
              ))}

              {/* HUD Target Reticle around selected point */}
              {selectedPoint && (
                <motion.div
                  key={selectedPoint.id}
                  style={{ top: selectedPoint.y, left: selectedPoint.x }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10"
                  initial={{ scale: 2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-12 h-12 border border-accentTeal/80 border-dashed rounded-full animate-[spin_10s_linear_infinite]" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-accentTeal rounded-full" />
                </motion.div>
              )}

              {/* Grid instructions */}
              <div className="absolute bottom-2 left-2 text-[8px] font-mono text-gray-600 bg-black/60 px-2 py-1 rounded border border-gray-900 pointer-events-none">
                GRID_SYSTEM: WGS84 | ACCURACY: &lt;0.05m
              </div>

              {/* Scanline */}
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-accentPurple/2 to-transparent w-full h-2 scanline" />
            </div>
          </div>
        </div>

        {/* Right Col: Criteria List & Spot Details */}
        <div className="space-y-4">
          <div className="bg-[#121222]/90 border border-gray-800 rounded-xl p-5 shadow-xl space-y-4">
            
            {/* Criteria Key */}
            <div>
              <h4 className="text-xs font-mono font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-accentTeal" /> Confidence Criteria
              </h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                  <span className="text-gray-300 font-medium">High (70-100%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]" />
                  <span className="text-gray-300 font-medium">Medium (40-70%)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                  <span className="text-gray-300 font-medium">Low (0-40%)</span>
                </div>
              </div>
            </div>

            <hr className="border-gray-850" />

            {/* Active Details Box */}
            <div className="bg-[#0b0b14]/75 border border-gray-850 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-mono text-gray-500 block uppercase">Selected Hotspot</span>
                  <h4 className="text-xs font-bold text-white mt-0.5">{selectedPoint.name}</h4>
                </div>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded-full ${selectedPoint.color}`}>
                  {selectedPoint.confidence}% {selectedPoint.level}
                </span>
              </div>

              <div className="text-[10px] text-gray-400 leading-relaxed font-sans">
                {selectedPoint.description}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[9px] font-mono border-t border-gray-850/50 pt-2.5 text-gray-500">
                <div>COORD_X: {selectedPoint.x}</div>
                <div>COORD_Y: {selectedPoint.y}</div>
                <div className="col-span-2">VERIFICATION: AI_VECTOR_FIT</div>
              </div>
            </div>

            <p className="text-[9px] font-mono text-gray-600 text-center">
              Click on different hotspot dots on the left map overlay to view specific telemetry reconstruction criteria.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
