import React, { useState, useEffect } from 'react';
import { ArrowLeft, Maximize, AlertCircle, HelpCircle, X, Columns, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getCaseById } from '../services/firestore';

export default function AlternativeScenarios({ onBack, caseId = 'INV-2025-0715' }) {
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [compareOpen, setCompareOpen] = useState(false);

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
        console.error("Error loading case in AlternativeScenarios:", err);
        setLoading(false);
      });
  }, [caseId]);

  // Dynamic fallback generator using real case details (like Honda Civic, Toyota Fortuner, weather etc.)
  const getFallbackScenarios = () => {
    const v1 = caseData?.aiAnalysis?.vehiclesDetected?.[0] || "Vehicle 1";
    const v2 = caseData?.aiAnalysis?.vehiclesDetected?.[1] || "Vehicle 2";
    
    return [
      {
        title: "Scenario A",
        probability: 78,
        isMostLikely: true,
        description: `The driver of the ${v1} ran the active traffic control signal at the intersection and collided head-on with the ${v2}.`,
        parameters: ["Red Light Violation", "Speeding", "Impact"]
      },
      {
        title: "Scenario B",
        probability: 15,
        isMostLikely: false,
        description: `The driver of the ${v2} attempted a late swerve to avoid the oncoming ${v1}, resulting in a slightly angled offset collision.`,
        parameters: ["Late Swerve", "Distraction", "Reaction Stage"]
      },
      {
        title: "Scenario C",
        probability: 7,
        isMostLikely: false,
        description: `A mechanical failure or brake line rupture in the ${v1} prevented it from stopping at the signal line.`,
        parameters: ["Mechanical Failure", "Brake Loss", "No Skid Marks"]
      }
    ];
  };

  const scenarios = caseData?.aiAnalysis?.alternativeScenarios || getFallbackScenarios();

  // Color mapping based on probability
  const getScenarioColor = (probability) => {
    if (probability >= 60) return '#22c55e'; // Green
    if (probability >= 15) return '#eab308'; // Yellow
    return '#ef4444'; // Red
  };

  const getScenarioColorText = (probability) => {
    if (probability >= 60) return 'text-[#4ade80]';
    if (probability >= 15) return 'text-[#facc15]';
    return 'text-[#ef4444]';
  };

  // Thumbnail SVG with dynamic vehicle labels
  const ThumbnailPlaceholder = ({ color, type }) => {
    const v1 = caseData?.aiAnalysis?.vehiclesDetected?.[0] || "Honda Civic";
    const v2 = caseData?.aiAnalysis?.vehiclesDetected?.[1] || "Toyota Fortuner";
    
    return (
      <div className="w-full h-[180px] relative rounded-xl overflow-hidden bg-[#06080d] ring-1 ring-inset ring-white/5 group-hover:ring-white/20 transition-all duration-500">
        <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80" viewBox="250 150 500 500" preserveAspectRatio="xMidYMid slice">
          <defs>
            <pattern id="thumb-asphalt" width="100" height="100" patternUnits="userSpaceOnUse">
              <rect width="100" height="100" fill="#0a0e17" />
              <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.03)" />
            </pattern>
            <pattern id="thumb-sidewalk" width="40" height="40" patternUnits="userSpaceOnUse">
              <rect width="40" height="40" fill="#111827" />
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            </pattern>
            <radialGradient id="thumb-tree" cx="30%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#065f46" />
              <stop offset="100%" stopColor="#022c22" />
            </radialGradient>
          </defs>
          
          <rect width="1000" height="800" fill="url(#thumb-asphalt)" />
          <rect x="-50" y="-50" width="450" height="350" fill="url(#thumb-sidewalk)" rx="12" stroke="#374151" strokeWidth="2" />
          <rect x="600" y="-50" width="450" height="350" fill="url(#thumb-sidewalk)" rx="12" stroke="#374151" strokeWidth="2" />
          <rect x="-50" y="500" width="450" height="350" fill="url(#thumb-sidewalk)" rx="12" stroke="#374151" strokeWidth="2" />
          <rect x="600" y="500" width="450" height="350" fill="url(#thumb-sidewalk)" rx="12" stroke="#374151" strokeWidth="2" />
          
          <g fill="#9ca3af" opacity="0.4">
            {Array.from({length: 10}).map((_, i) => <rect key={`t-${i}`} x={418 + i*18} y="320" width="10" height="45" />)}
            {Array.from({length: 10}).map((_, i) => <rect key={`b-${i}`} x={418 + i*18} y="435" width="10" height="45" />)}
            {Array.from({length: 10}).map((_, i) => <rect key={`l-${i}`} x="320" y={418 + i*18 - 100} width="45" height="10" />)}
            {Array.from({length: 10}).map((_, i) => <rect key={`r-${i}`} x="635" y={418 + i*18 - 100} width="45" height="10" />)}
          </g>
          <line x1="500" y1="0" x2="500" y2="800" stroke="#f59e0b" strokeWidth="4" opacity="0.8" />
          
          {type === 'A' && (
            <g>
              <path d="M 750 420 L 515 400" stroke={color} strokeWidth="6" strokeDasharray="16,16" fill="none" opacity="0.8" />
              <rect x="412" y="365" width="36" height="70" rx="6" fill="#f8fafc" stroke="#000" strokeWidth="2"/>
              <rect x="492" y="385" width="36" height="70" rx="6" fill="#475569" stroke="#000" strokeWidth="2"/>
            </g>
          )}
          {type === 'B' && (
            <g>
              <path d="M 650 440 L 515 400" stroke={color} strokeWidth="6" strokeDasharray="16,16" fill="none" opacity="0.8" />
              <rect x="462" y="345" width="36" height="70" rx="6" fill="#f8fafc" stroke="#000" strokeWidth="2"/>
              <rect x="512" y="355" width="36" height="70" rx="6" fill="#475569" stroke="#000" strokeWidth="2"/>
            </g>
          )}
          {type === 'C' && (
            <g>
              <path d="M 850 400 L 515 400" stroke={color} strokeWidth="6" strokeDasharray="16,16" fill="none" opacity="0.8" />
              <rect x="402" y="360" width="36" height="70" rx="6" fill="#f8fafc" stroke="#000" strokeWidth="2"/>
              <rect x="462" y="295" width="36" height="70" rx="6" fill="#475569" stroke="#000" strokeWidth="2"/>
            </g>
          )}
        </svg>
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080c] via-transparent to-[#06080c]/50 ring-1 ring-inset ring-white/10 rounded-xl" />
        {/* Dynamic labels */}
        <div className="absolute bottom-2 left-2 flex flex-col gap-0.5 text-[8px] font-mono text-gray-400 bg-black/60 px-1.5 py-0.5 rounded">
          <span>V1 (White): {v1.substring(0, 15)}</span>
          <span>V2 (Grey): {v2.substring(0, 15)}</span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-[#06080d] text-white">
        <Activity className="w-8 h-8 text-[#a78bfa] animate-spin mb-3" />
        <p className="text-xs font-mono text-gray-400">Loading Case Scenarios...</p>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30 bg-[#06080d] flex flex-col overflow-hidden text-left">
      {/* Header inside container */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0d16]/95">
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
            <span className="text-[10px] font-mono font-bold text-[#00E5FF] uppercase tracking-widest block">AI Simulation Branching</span>
            <h2 className="text-md font-bold text-white font-mono leading-none mt-1">Alternative Scenarios</h2>
          </div>
        </div>
        <span className="font-mono text-xs bg-white/5 border border-white/10 px-3 py-1 rounded text-gray-300">{caseData?.caseId || caseId}</span>
      </div>

      {/* Scenarios Grid */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ scrollbarWidth: 'thin' }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {scenarios.map((sc, idx) => {
            const colorHex = getScenarioColor(sc.probability);
            const labelType = idx === 0 ? 'A' : idx === 1 ? 'B' : 'C';
            
            return (
              <div 
                key={idx}
                className="group bg-[#0f1424]/60 backdrop-blur-xl border border-white/5 hover:border-white/15 rounded-2xl p-4 flex flex-col gap-4 transition duration-300 hover:-translate-y-1 shadow-lg"
              >
                <ThumbnailPlaceholder color={colorHex} type={labelType} />

                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-center">
                    <h3 className="text-white font-bold text-md font-mono flex items-center gap-2">
                      {sc.title} 
                      <span className="text-gray-600 text-xs font-normal">|</span>
                      <span className={getScenarioColorText(sc.probability)}>{sc.probability}%</span>
                    </h3>
                    {sc.isMostLikely && (
                      <span className="bg-[#22c55e]/15 border border-[#22c55e]/30 text-[#4ade80] text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full">
                        Most Likely
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-xs leading-relaxed min-h-[50px] font-sans">
                    {sc.description}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-auto pt-3 border-t border-white/5">
                  {sc.parameters.map((param, pIdx) => (
                    <span 
                      key={pIdx} 
                      className="bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[9px] text-gray-300 font-mono"
                    >
                      {param}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compare button */}
        <div className="flex justify-center pt-4">
          <button 
            onClick={() => setCompareOpen(true)}
            className="px-8 py-3 bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-mono text-xs uppercase tracking-wider font-bold rounded-xl shadow-glowPurple border border-[#7c3aed]/50 transition"
          >
            Compare Scenarios Side-By-Side
          </button>
        </div>
      </div>

      {/* Comparison Modal Overlay */}
      <AnimatePresence>
        {compareOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.97 }} 
              animate={{ scale: 1 }} 
              exit={{ scale: 0.97 }}
              className="w-full max-w-5xl bg-[#06080d] border border-white/10 rounded-2xl flex flex-col max-h-[90vh] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-[#0a0d16]">
                <div className="flex items-center gap-2">
                  <Columns className="w-5 h-5 text-[#a78bfa]" />
                  <h3 className="font-bold text-white text-md font-mono">Forensic Scenario Comparison</h3>
                </div>
                <button onClick={() => setCompareOpen(false)} className="text-gray-400 hover:text-white transition">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="p-6 overflow-x-auto flex-1 flex gap-6" style={{ scrollbarWidth: 'thin' }}>
                {scenarios.map((sc, idx) => (
                  <div key={idx} className="flex-1 min-w-[280px] bg-[#0c101a] border border-white/5 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-3">
                      <h4 className="font-bold text-white font-mono text-md">{sc.title}</h4>
                      <span className={`font-mono text-sm font-bold ${getScenarioColorText(sc.probability)}`}>{sc.probability}%</span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Hypothesis Narrative</span>
                      <p className="text-xs text-gray-300 leading-relaxed font-sans min-h-[90px]">
                        {sc.description}
                      </p>
                    </div>

                    <div className="space-y-2 mt-auto">
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest block">Primary Parameters</span>
                      <div className="flex flex-col gap-1.5">
                        {sc.parameters.map((param, pIdx) => (
                          <div key={pIdx} className="bg-white/5 border border-white/10 rounded px-3 py-1.5 text-[10px] font-mono text-slate-300 flex items-center justify-between">
                            <span>{param}</span>
                            <span className="text-[#00E5FF]">✔ Active</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
