import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Layers, X, LocateFixed, Plus, Minus, ArrowLeft, Activity } from 'lucide-react';
import { getCaseById } from '../services/firestore';

export default function MapView({ onBack, caseId }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [layersOpen, setLayersOpen] = useState(false);
  const [layers, setLayers] = useState({
    satellite: true, // Default to satellite hybrid view for forensic inspection
  });
  const [zoom, setZoom] = useState(1.5); // Zoom multiplier range: 0.5 to 3

  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    getCaseById(caseId)
      .then(data => {
        setCaseData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error loading case in MapView:", err);
        setLoading(false);
      });
  }, [caseId]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));

  const toggleLayer = (key) => setLayers(prev => ({ ...prev, [key]: !prev[key] }));

  const location = caseData?.location || "Brookhaven";
  
  // Calculate map zoom level (maps 0.5-3 zoom state to Google maps zoom levels 15-21)
  const mapZoomVal = Math.round(16 + zoom * 2);
  
  // Build Google Maps Embed iframe URL
  // t=m (Normal Map), t=k (Satellite), t=h (Satellite Hybrid)
  const mapType = layers.satellite ? 'h' : 'm';
  const mapUrl = `https://maps.google.com/maps?q=${encodeURIComponent(location)}&t=${mapType}&z=${mapZoomVal}&output=embed`;

  const vehicles = caseData?.aiAnalysis?.vehiclesDetected || ["Vehicle A", "Vehicle B"];
  const weather = caseData?.weather || "Clear";

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#090b14] text-white">
        <Activity className="w-8 h-8 text-[#a78bfa] animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-400">Initializing Map View...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 bg-[#090b14] overflow-hidden font-sans">
      
      {/* Header bar inside container */}
      <div className="absolute top-0 left-0 right-0 h-16 border-b border-white/5 bg-[#0a0d16]/95 flex items-center justify-between px-6 z-40">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack} 
              className="w-10 h-10 flex items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#c084fc] hover:bg-white/10 transition"
              title="Go Back to 3D Scene"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <span className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-widest block">Geospatial Forensic Map</span>
            <h2 className="text-md font-bold text-white font-mono leading-none mt-1">Satellite View</h2>
          </div>
        </div>
        <span className="font-mono text-xs bg-white/5 border border-white/10 px-3 py-1 rounded text-gray-300">
          Location: {location}
        </span>
      </div>

      {/* Main Map Frame */}
      <div className="absolute inset-0 pt-16 z-0 bg-[#090b14]">
        <div className="w-full h-full p-4 relative">
          <iframe 
            src={mapUrl} 
            className="w-full h-full border border-white/10 rounded-2xl opacity-90 shadow-2xl" 
            allowFullScreen="" 
            loading="lazy"
            title="Google Map View"
          />
          
          {/* Dark backdrop layer for high contrast visibility */}
          <div className="absolute inset-4 pointer-events-none bg-black/45 rounded-2xl border border-white/5" />
          
          {/* Glowing Vector Overlay on top of the live Map */}
          <svg className="absolute inset-4 pointer-events-none w-[calc(100%-32px)] h-[calc(100%-32px)]" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid">
            {/* Trajectory 1 (V1 Path) - Solid bright violet with thick black borders */}
            <path d="M 300,300 Q 420,420 500,500" fill="none" stroke="#000000" strokeWidth="12" strokeLinecap="round" className="opacity-100" />
            <path d="M 300,300 Q 420,420 500,500" fill="none" stroke="#8b5cf6" strokeWidth="7" strokeLinecap="round" className="opacity-100" />
            <circle cx="300" cy="300" r="19" fill="#7c3aed" stroke="#000" strokeWidth="2" className="drop-shadow-[0_0_15px_rgba(124,58,237,1)]" />
            <text x="300" y="304" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle" stroke="#000" strokeWidth="1.5" paintOrder="stroke">V1</text>
            
            {/* Trajectory 2 (V2 Path) - Solid bright red with thick black borders */}
            <path d="M 700,700 Q 580,580 500,500" fill="none" stroke="#000000" strokeWidth="12" strokeLinecap="round" className="opacity-100" />
            <path d="M 700,700 Q 580,580 500,500" fill="none" stroke="#ef4444" strokeWidth="7" strokeLinecap="round" className="opacity-100" />
            <circle cx="700" cy="700" r="19" fill="#e11d48" stroke="#000" strokeWidth="2" className="drop-shadow-[0_0_15px_rgba(225,29,72,1)]" />
            <text x="700" y="704" fill="white" fontSize="13" fontWeight="bold" fontFamily="monospace" textAnchor="middle" stroke="#000" strokeWidth="1.5" paintOrder="stroke">V2</text>
            
            {/* Vehicle 1 White Car Graphic Shape */}
            <g transform="translate(445, 455) rotate(-45)">
              <rect x="-15" y="-28" width="30" height="56" rx="4" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" className="drop-shadow-[0_4px_12px_rgba(255,255,255,0.45)]" />
              <rect x="-12" y="-18" width="24" height="12" fill="#0f172a" rx="1" /> {/* Windshield */}
              <rect x="-12" y="10" width="24" height="8" fill="#0f172a" rx="1" /> {/* Rear window */}
              <circle cx="-16" cy="-16" r="3.5" fill="#000" />
              <circle cx="16" cy="-16" r="3.5" fill="#000" />
              <circle cx="-16" cy="16" r="3.5" fill="#000" />
              <circle cx="16" cy="16" r="3.5" fill="#000" />
              <text x="0" y="3" fill="#0f172a" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">V1</text>
            </g>

            {/* Vehicle 2 Grey SUV Graphic Shape */}
            <g transform="translate(555, 545) rotate(135)">
              <rect x="-17" y="-31" width="34" height="62" rx="5" fill="#64748b" stroke="#0f172a" strokeWidth="2.5" className="drop-shadow-[0_4px_12px_rgba(100,116,139,0.45)]" />
              <rect x="-14" y="-20" width="28" height="14" fill="#0f172a" rx="1" /> {/* SUV Hood/Windshield */}
              <rect x="-14" y="12" width="28" height="10" fill="#0f172a" rx="1" />
              <circle cx="-18" cy="-18" r="3.5" fill="#000" />
              <circle cx="18" cy="-18" r="3.5" fill="#000" />
              <circle cx="-18" cy="18" r="3.5" fill="#000" />
              <circle cx="18" cy="18" r="3.5" fill="#000" />
              <text x="0" y="3" fill="#ffffff" fontSize="10" fontWeight="bold" fontFamily="sans-serif" textAnchor="middle">V2</text>
            </g>

            {/* 2 Shattered Car Pieces / Debris Fragments scattered at the center */}
            <polygon points="485,502 494,505 490,511" fill="#e2e8f0" stroke="#000" strokeWidth="1" className="drop-shadow-[0_0_4px_rgba(255,255,255,0.8)]" /> {/* Fragment V1 (white plastic) */}
            <polygon points="515,492 522,499 511,497" fill="#475569" stroke="#000" strokeWidth="1" className="drop-shadow-[0_0_4px_rgba(71,85,105,0.8)]" />  {/* Fragment V2 (grey bumper piece) */}

            {/* Impact Center Target */}
            <g transform="translate(500, 500)" className="animate-pulse">
              <circle cx="0" cy="0" r="16" fill="#ef4444" opacity="0.45" />
              <circle cx="0" cy="0" r="6" fill="#ef4444" />
              <line x1="-28" y1="0" x2="28" y2="0" stroke="#ef4444" strokeWidth="3" />
              <line x1="0" y1="-28" x2="0" y2="28" stroke="#ef4444" strokeWidth="3" />
            </g>
            <text x="500" y="540" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="monospace" textAnchor="middle" stroke="#000" strokeWidth="1.5" paintOrder="stroke" className="drop-shadow-[0_0_8px_#ef4444]">IMPACT POINT</text>
            
            {/* Forensic debris markers based on case evidenceList */}
            {caseData?.aiAnalysis?.scene3D?.evidenceList?.map((ev, idx) => {
              const angle = (idx * 120) * (Math.PI / 180);
              const x = 500 + Math.sin(angle) * 125;
              const y = 500 + Math.cos(angle) * 125;
              
              return (
                <g key={idx} transform={`translate(${x}, ${y})`}>
                  <circle cx="0" cy="0" r="10" fill="#eab308" className="drop-shadow-[0_0_8px_rgba(234,179,8,0.8)]" />
                  <text x="0" y="3" fill="black" fontSize="9" fontWeight="bold" fontFamily="monospace" textAnchor="middle">M{idx+1}</text>
                  <text x="0" y="-15" fill="#fef08a" fontSize="8.5" fontWeight="bold" fontFamily="monospace" textAnchor="middle" stroke="#000" strokeWidth="1.5" paintOrder="stroke" opacity="0.95">{ev.type.replace('_', ' ')}</text>
                </g>
              );
            })}
          </svg>
          {/* Transparent Vignette Layer */}
          <div className="absolute inset-4 pointer-events-none border border-white/5 rounded-2xl bg-gradient-to-t from-[#090b14]/50 via-transparent to-[#090b14]/20" />
        </div>
      </div>

      {/* Floating Action Buttons (Right) */}
      <div className="absolute top-24 right-6 flex flex-col gap-4 z-40">
        <div className="flex flex-col bg-[#121626]/90 border border-white/10 rounded-full backdrop-blur-md shadow-xl overflow-hidden">
          <button onClick={handleZoomIn} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition border-b border-white/10" title="Zoom In">
            <Plus className="w-5 h-5" />
          </button>
          <button onClick={handleZoomOut} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition border-b border-white/10" title="Zoom Out">
            <Minus className="w-5 h-5" />
          </button>
          <button onClick={() => setZoom(1.5)} className="w-12 h-12 flex items-center justify-center text-white hover:bg-white/10 transition" title="Recenter Zoom">
            <LocateFixed className="w-4 h-4" />
          </button>
        </div>
        <button 
          onClick={() => setLayersOpen(!layersOpen)}
          className={`w-12 h-12 rounded-full border border-white/10 flex items-center justify-center transition backdrop-blur-md shadow-xl ${layersOpen ? 'bg-[#7c3aed] text-white' : 'bg-[#121626]/90 text-white hover:bg-white/10'}`}
          title="Toggle Layers"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Map Layers Dropdown Panel */}
      <AnimatePresence>
        {layersOpen && (
          <motion.div 
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            className="absolute top-24 right-24 w-64 bg-[#0d111d]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-5 shadow-2xl z-40"
          >
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-white text-sm font-semibold">Map Layers</h3>
              <button onClick={() => setLayersOpen(false)} className="text-gray-400 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {[
                { id: 'satellite', label: 'Satellite Hybrid View', icon: <Map className="w-4 h-4" /> }
              ].map(layer => (
                <div key={layer.id} className="flex justify-between items-center cursor-pointer" onClick={() => toggleLayer(layer.id)}>
                  <div className="flex items-center gap-3 text-gray-300">
                    {layer.icon}
                    <span className="text-xs font-medium">{layer.label}</span>
                  </div>
                  {/* Toggle Switch */}
                  <div className={`w-9 h-5 rounded-full p-0.5 transition-colors ${layers[layer.id] ? 'bg-[#7c3aed]' : 'bg-[#1e2436]'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${layers[layer.id] ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Card - Case Overview */}
      <div className="absolute bottom-10 left-10 w-[300px] bg-[#0d111d]/95 backdrop-blur-xl border border-white/10 rounded-[20px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7c3aed]" />
          <h3 className="text-white text-sm font-semibold">Scene Overview</h3>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#7c3aed] flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_10px_rgba(124,58,237,0.5)]">
                1
              </div>
              <span className="text-gray-200 text-xs font-medium truncate max-w-[120px]" title={vehicles[0]}>
                {vehicles[0]}
              </span>
            </div>
            <span className="text-gray-400 text-[11px]">V1</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#f97316] flex items-center justify-center text-white text-[10px] font-bold shadow-[0_0_10px_rgba(249,115,22,0.5)]">
                2
              </div>
              <span className="text-gray-200 text-xs font-medium truncate max-w-[120px]" title={vehicles[1]}>
                {vehicles[1]}
              </span>
            </div>
            <span className="text-gray-400 text-[11px]">V2</span>
          </div>

          <div className="flex justify-between items-center border-t border-white/5 pt-3">
            <span className="text-gray-400 text-[11px]">Weather:</span>
            <span className="text-white text-xs font-bold font-mono">{weather}</span>
          </div>
        </div>
      </div>

    </div>
  );
}
