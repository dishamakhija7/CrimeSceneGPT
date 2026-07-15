import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

export default function Splash({ onNext }) {
  const [progressStep, setProgressStep] = useState(0);

  const steps = [
    "Analyzing Evidence...",
    "Building Timeline...",
    "Generating Reconstruction...",
    "Ready."
  ];

  useEffect(() => {
    // The splash screen stays visible for 4.8 seconds total, then moves to the app workspace
    const timer = setTimeout(() => {
      if (onNext) onNext();
    }, 4800);

    const interval = setInterval(() => {
      setProgressStep((prev) => {
        if (prev < steps.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 1200);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [onNext]);

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-between overflow-hidden bg-[#0a0a12] text-white font-sans selection:bg-transparent">

      {/* 1. THE BACKGROUND */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
        style={{
          backgroundImage: `url('/bg-street.png')`,
          filter: 'brightness(0.75) contrast(1.15) saturate(1.2)',
        }}
      />

      {/* Cybernetic Radial Highlight */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(10,10,20,0.15)_0%,rgba(6,6,13,0.5)_50%,rgba(6,6,13,0.85)_100%)] pointer-events-none" />



      <div className="w-full h-4" />

      {/* 2. CENTER BRANDING */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 max-w-xl mx-auto my-auto">

        {/* Glowing Shield Magnifier Badge */}
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative w-32 h-32 mb-6 flex items-center justify-center"
        >
          {/* Neon Purple core aura */}
          <div className="absolute inset-0 bg-[#7b61ff] rounded-full blur-[40px] opacity-60" />

          {/* Hexagon Outer Frame Asset */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#7b61ff] filter drop-shadow-[0_0_15px_rgba(123,97,255,0.5)]">
            <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="rgba(16,12,42,0.85)" stroke="currentColor" strokeWidth="4" />
          </svg>

          {/* Hexagon Highlight Path */}
          <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#b6a6ff]" style={{ transform: 'scale(0.86)' }}>
            <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="none" stroke="currentColor" strokeWidth="2" />
          </svg>

          {/* Core Radar Magnifying Ring */}
          <div className="relative z-10 text-white filter drop-shadow-[0_0_10px_rgba(255,255,255,0.9)]">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="6" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3.5" />
              <circle cx="11" cy="11" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </motion.div>

        {/* Header Strings */}
        <h1 className="text-3xl md:text-4xl font-bold tracking-wider text-white uppercase flex items-center justify-center gap-2 mb-1 filter drop-shadow-[0_3px_8px_rgba(0,0,0,0.9)]">
          <span>CRIMESCENE</span>
          <span className="text-[#a692ff] font-extrabold drop-shadow-[0_0_15px_rgba(166,146,255,0.7)]">GPT</span>
        </h1>

        <div className="w-24 h-[1px] bg-gradient-to-r from-transparent via-[#a692ff]/80 to-transparent relative mb-3">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-[#a692ff] rounded-full" />
        </div>

        <p className="text-[11px] font-semibold tracking-[0.2em] text-gray-200 uppercase max-w-xs leading-relaxed filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          AI-Powered Incident<br />Reconstruction & Investigation
        </p>

      </div>

      {/* 3. RUNTIME TRACK LOADER METRICS */}
      <div className="relative z-10 w-full flex flex-col items-center max-w-lg px-8 pb-10">

        {/* Animated Progress List with Dotted Line */}
        <div className="flex flex-col gap-4 mb-10 mx-auto w-fit relative">
          {/* Vertical dashed line */}
          <div className="absolute left-[5px] top-[14px] bottom-[14px] w-[1px] border-l border-dashed border-gray-600"></div>
          
          {steps.map((step, index) => {
            const isActive = index === progressStep;
            const isLast = index === steps.length - 1;
            
            return (
              <div key={step} className="relative flex items-center pl-6">
                <div className="absolute left-[1px] top-1/2 -translate-y-1/2 flex items-center justify-center bg-[#0a0a12] w-3 h-3 z-10">
                  {isActive ? (
                    <div className="w-3 h-3 rounded-full border-[1.5px] border-[#7b61ff] flex items-center justify-center shadow-[0_0_12px_rgba(123,97,255,0.8)] animate-pulse bg-[#0a0a12]">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#7b61ff]" />
                    </div>
                  ) : isLast ? (
                    <div className="w-3 h-3 rounded-full border-[1.5px] border-[#7b61ff] bg-[#0a0a12]" />
                  ) : (
                    <div className="w-3 h-3 rounded-[2px] border-[1.5px] border-[#1c1c1f] bg-[#0a0a12] flex items-center justify-center shadow-lg">
                      <div className="w-1.5 h-1.5 bg-gray-500 rounded-[1px]" />
                    </div>
                  )}
                </div>
                
                <p className={`text-[13px] font-medium transition-colors duration-500 ${
                  isActive ? 'text-[#7b61ff] drop-shadow-[0_0_8px_rgba(123,97,255,0.4)]' : 'text-gray-400'
                }`}>
                  {step}
                </p>
              </div>
            );
          })}
        </div>

        {/* Horizontal Loader timeline track */}
        <div className="w-full h-[3px] bg-white/20 rounded-full overflow-hidden mb-5 relative">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 4.5, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-[#7b61ff] via-[#a692ff] to-white rounded-full shadow-[0_0_15px_rgba(166,146,255,0.8)]"
          />
        </div>

        <div className="text-center">
          <p className="text-[10px] tracking-[0.25em] text-[#a692ff] font-bold uppercase drop-shadow-[0_0_5px_rgba(166,146,255,0.3)]">
            POWERED BY AGENTIC INTELLIGENCE
          </p>

          <div className="flex gap-1.5 justify-center mt-3 opacity-80">
            <div className="w-1.5 h-1.5 rounded-full border border-[#a692ff] bg-[#a692ff]" />
          </div>
        </div>

      </div>

    </div>
  );
}