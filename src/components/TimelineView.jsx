import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, AlertTriangle, ShieldAlert, CheckCircle2, ChevronRight, Eye, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCaseById } from '../services/firestore';

export default function TimelineView({ caseId, onGoToReport, onGoToReconstruction }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    if (!caseId) {
      setError('No active case selected.');
      setLoading(false);
      return;
    }

    const loadCase = async () => {
      try {
        setLoading(true);
        setError('');
        const data = await getCaseById(caseId);
        if (mounted) {
          setCaseData(data);
        }
      } catch (err) {
        console.error("Error loading case:", err);
        if (mounted) {
          setError('Failed to load case data.');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadCase();

    return () => {
      mounted = false;
    };
  }, [caseId]);

  if (loading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-accentTeal animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Loading Chronological Timeline...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 font-mono text-sm mb-4">{error || 'Case details not found.'}</p>
        <button 
          onClick={onGoToReconstruction}
          className="px-4 py-2 bg-[#0b0b14] border border-gray-800 text-gray-300 font-mono text-xs uppercase hover:text-white rounded transition"
        >
          Go Back
        </button>
      </div>
    );
  }

  const analysis = caseData.aiAnalysis;

  if (!analysis) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center text-center">
        <Clock className="w-12 h-12 text-accentPurple mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-2 font-mono">No Timeline Data Found</h3>
        <p className="text-gray-400 font-sans text-sm max-w-md mb-6">
          AI analysis has not been generated for this case yet. Please complete the evidence intake process first.
        </p>
        <button 
          onClick={onGoToReconstruction}
          className="px-4 py-2 bg-accentPurple hover:bg-accentPurple/90 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition"
        >
          Go to Intake Agent
        </button>
      </div>
    );
  }

  const rawClues = analysis.timelineClues || analysis.knownFacts || [];
  
  // Format dynamic timeline events from AI clues
  const timelineEvents = rawClues.map((clue, idx) => {
    let severity = 'info';
    let nodeColor = 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]';
    let textColor = 'text-blue-400';
    let timeLabel = `T + ${(idx * 1.5).toFixed(1)}s`;

    const lowerClue = clue.toLowerCase();
    if (lowerClue.includes('collision') || lowerClue.includes('impact') || lowerClue.includes('hit') || lowerClue.includes('crash')) {
      severity = 'critical';
      nodeColor = 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)] animate-pulse';
      textColor = 'text-red-400';
      timeLabel = 'T = 0.0s (Impact)';
    } else if (lowerClue.includes('signal') || lowerClue.includes('red') || lowerClue.includes('light') || lowerClue.includes('brake') || lowerClue.includes('stop')) {
      severity = 'warning';
      nodeColor = 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]';
      textColor = 'text-orange-400';
      timeLabel = `T - ${(3.0 - idx * 0.8).toFixed(1)}s`;
    } else if (idx === 0) {
      severity = 'medium';
      nodeColor = 'bg-yellow-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]';
      textColor = 'text-yellow-400';
      timeLabel = 'T - 4.5s';
    } else {
      timeLabel = `T + ${(idx * 1.2).toFixed(1)}s`;
    }

    // Pick a representation photo based on description
    let thumbnail = 'https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=60&h=45&q=80';
    if (lowerClue.includes('pedestrian') || lowerClue.includes('person') || lowerClue.includes('crossing')) {
      thumbnail = 'https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&w=60&h=45&q=80';
    } else if (lowerClue.includes('light') || lowerClue.includes('signal') || lowerClue.includes('green') || lowerClue.includes('yellow')) {
      thumbnail = 'https://images.unsplash.com/photo-1617469167446-8027ff207515?auto=format&fit=crop&w=60&h=45&q=80';
    } else if (severity === 'critical') {
      thumbnail = 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=60&h=45&q=80';
    }

    return {
      time: timeLabel,
      log: clue,
      severity,
      nodeColor,
      textColor,
      thumbnail,
      telemetry: `Telemetry Event Ref: #CLUE-00${idx + 1}`
    };
  });

  const caseIdDisplay = caseData.caseId || caseId;

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Timeline view container */}
      <div className="bg-[#121222]/90 border border-gray-800 rounded-2xl p-6 shadow-2xl relative">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-850 pb-4 mb-6 gap-3">
          <div className="text-left">
            <span className="text-[10px] font-mono text-accentTeal uppercase tracking-widest block font-bold">Accident Telemetry Chronology</span>
            <h2 className="text-xl font-bold text-white font-mono mt-0.5">{caseIdDisplay}</h2>
          </div>
          <div className="flex bg-[#0b0b14] border border-gray-850 p-1 rounded-lg">
            <button 
              onClick={onGoToReconstruction}
              className="px-3 py-1 text-xs font-mono rounded text-gray-400 hover:text-white transition"
            >
              3D View
            </button>
            <button 
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-1 text-xs font-mono rounded transition ${activeTab === 'timeline' ? 'bg-accentPurple text-white' : 'text-gray-400'}`}
            >
              Timeline
            </button>
            <button 
              onClick={onGoToReport}
              className="px-3 py-1 text-xs font-mono rounded text-gray-400 hover:text-white transition"
            >
              Report View
            </button>
          </div>
        </div>

        {/* Timeline Log Flow */}
        {timelineEvents.length > 0 ? (
          <div className="relative border-l-2 border-gray-850 pl-6 ml-4 space-y-8 py-2">
            {timelineEvents.map((evt, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative group text-left"
              >
                {/* Timeline dot node */}
                <div className={`absolute -left-[30px] top-1.5 w-4 h-4 rounded-full border border-[#121222] ${evt.nodeColor}`} />

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-[#0b0b14]/30 border border-gray-850/60 hover:border-gray-800 rounded-xl p-4 transition duration-300">
                  {/* Time & Severity col */}
                  <div className="md:col-span-1">
                    <span className={`text-[11px] font-mono font-bold block ${evt.textColor}`}>{evt.time}</span>
                    <span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest block mt-0.5">{evt.telemetry}</span>
                  </div>

                  {/* Log Description */}
                  <div className="md:col-span-2 text-xs md:text-sm text-gray-300 leading-relaxed font-sans pr-2 self-center">
                    {evt.log}
                  </div>

                  {/* Micro-map/image Thumbnail */}
                  <div className="md:col-span-1 flex items-center justify-end">
                    <div className="w-16 h-12 rounded border border-gray-800 overflow-hidden bg-gray-900 relative group-hover:border-accentTeal transition">
                      <img src={evt.thumbnail} alt="" className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition" />
                      <div className="absolute inset-0 bg-accentPurple/10 opacity-30 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-gray-400 font-mono text-sm">
            No chronology clues detected in the analysis.
          </div>
        )}

        {/* Bottom Timeline Playback Controller */}
        <div className="flex justify-center border-t border-gray-850 pt-5 mt-6">
          <button 
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-3 bg-accentPurple hover:bg-accentPurple/90 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg shadow-glowPurple border border-accentPurple/50 transition flex items-center gap-2"
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" /> Pause Timeline
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white pl-0.5" /> Play Timeline
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
