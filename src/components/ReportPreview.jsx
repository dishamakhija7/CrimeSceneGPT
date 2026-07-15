import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, FileText, CheckCircle2, AlertTriangle, Printer, Sparkles, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCaseById } from '../services/firestore';

export default function ReportPreview({ caseId, onTogglePDF, onGoToTimeline, onGoToEvidence, onGoBack }) {
  const [activeTab, setActiveTab] = useState('report'); // report, timeline, evidence
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
        <p className="text-gray-400 font-mono text-sm">Loading AI Analysis Report...</p>
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center text-center">
        <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-400 font-mono text-sm mb-4">{error || 'Case details not found.'}</p>
        {onGoBack && (
          <button 
            onClick={onGoBack}
            className="px-4 py-2 bg-[#0b0b14] border border-gray-800 text-gray-300 font-mono text-xs uppercase hover:text-white rounded transition"
          >
            Go Back
          </button>
        )}
      </div>
    );
  }

  const analysis = caseData.aiAnalysis;

  if (!analysis) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center text-center">
        <Sparkles className="w-12 h-12 text-accentPurple mb-4 animate-pulse" />
        <h3 className="text-lg font-bold text-white mb-2 font-mono">No AI Analysis Found</h3>
        <p className="text-gray-400 font-sans text-sm max-w-md mb-6">
          AI analysis has not been generated for this case yet. Please complete the evidence intake process first.
        </p>
        {onGoBack && (
          <button 
            onClick={onGoBack}
            className="px-4 py-2 bg-accentPurple hover:bg-accentPurple/90 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition"
          >
            Go to Intake Agent
          </button>
        )}
      </div>
    );
  }

  // Fallback metadata if not set
  const caseIdDisplay = caseData.caseId || caseId;
  const incidentType = caseData.incidentType || analysis.incidentType || 'Vehicle Collision';
  const location = caseData.location || 'City Road';
  const dateTime = caseData.date && caseData.time ? `${caseData.date} @ ${caseData.time}` : 'Recent';
  const weather = caseData.weather || analysis.weather || 'Clear';
  const officer = caseData.investigatingOfficer || 'Inspector Arjun';

  // Map known facts and uncertainty to list items
  const findings = [
    ...(analysis.knownFacts || []).map(f => ({ text: f, confidence: analysis.confidenceScore || 85, level: 'High', color: 'bg-green-500/10 border-green-500/30 text-green-400' })),
    ...(analysis.uncertainFacts || []).map(f => ({ text: f, confidence: Math.max(30, (analysis.confidenceScore || 85) - 30), level: 'Medium', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' })),
  ];

  return (
    <div className="w-full max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Container */}
      <div className="bg-[#121222]/90 border border-gray-800 rounded-2xl p-6 shadow-2xl space-y-6">
        
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-850 pb-4 gap-3">
          <div className="flex items-center gap-3">
            {onGoBack && (
              <button 
                onClick={onGoBack} 
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-800 bg-[#0b0b14] text-gray-400 hover:text-white hover:bg-gray-800 transition"
                title="Go Back to 3D Scene"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="text-left">
              <span className="text-[10px] font-mono text-accentTeal uppercase tracking-widest block font-bold">AI-Generated Analysis</span>
              <h2 className="text-xl font-bold text-white font-mono mt-0.5">{caseIdDisplay}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Tab links to match mockup header */}
            <div className="flex bg-[#0b0b14] border border-gray-850 p-1 rounded-lg">
              <button 
                onClick={() => setActiveTab('report')}
                className={`px-3 py-1 text-xs font-mono rounded transition ${activeTab === 'report' ? 'bg-accentPurple text-white' : 'text-gray-400'}`}
              >
                Report
              </button>
              <button 
                onClick={onGoToTimeline}
                className="px-3 py-1 text-xs font-mono rounded text-gray-400 hover:text-white transition"
              >
                Timeline
              </button>
              <button 
                onClick={onGoToEvidence}
                className="px-3 py-1 text-xs font-mono rounded text-gray-400 hover:text-white transition"
              >
                Evidence
              </button>
            </div>
          </div>
        </div>

        {/* Main Split-Pane Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Metadata Sidebar Panel */}
          <div className="md:col-span-1 bg-[#0b0b14]/50 border border-gray-850 rounded-xl p-4 space-y-4 h-fit text-left">
            <h4 className="text-xs font-mono font-bold text-accentTeal uppercase tracking-wider">Case Details</h4>
            
            <div className="space-y-3 font-mono text-[11px] text-gray-400">
              <div>
                <span className="text-gray-500 block">CASE ID:</span>
                <span className="text-white font-bold">{caseIdDisplay}</span>
              </div>
              <div>
                <span className="text-gray-500 block">INCIDENT TYPE:</span>
                <span className="text-white font-medium">{incidentType}</span>
              </div>
              <div>
                <span className="text-gray-500 block">LOCATION:</span>
                <span className="text-white font-medium">{location}</span>
              </div>
              <div>
                <span className="text-gray-500 block">DATE & TIME:</span>
                <span className="text-white font-medium">{dateTime}</span>
              </div>
              <div>
                <span className="text-gray-500 block">WEATHER:</span>
                <span className="text-white font-medium">{weather}</span>
              </div>
              {analysis.lightingConditions && (
                <div>
                  <span className="text-gray-500 block">LIGHTING:</span>
                  <span className="text-white font-medium">{analysis.lightingConditions}</span>
                </div>
              )}
              {analysis.roadLayout && (
                <div>
                  <span className="text-gray-500 block">ROAD LAYOUT:</span>
                  <span className="text-white font-medium">{analysis.roadLayout}</span>
                </div>
              )}
              <div>
                <span className="text-gray-500 block">INVESTIGATING OFFICER:</span>
                <span className="text-white font-medium">{officer}</span>
              </div>
            </div>
          </div>

          {/* Main Analysis Pane */}
          <div className="md:col-span-2 space-y-6 text-left">
            {/* Executive Summary */}
            <div className="space-y-2">
              <h3 className="text-sm font-mono font-bold text-gray-300 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-accentTeal" /> Executive Summary
              </h3>
              <div className="bg-[#0b0b14]/30 border border-gray-850 p-4 rounded-xl text-xs md:text-sm text-gray-300 leading-relaxed font-sans">
                {analysis.executiveSummary}
              </div>
            </div>

            {/* Key Findings */}
            {findings.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-mono font-bold text-gray-300 uppercase tracking-widest">Key Findings</h3>
                
                <div className="space-y-2.5">
                  {findings.map((finding, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-start justify-between p-3.5 bg-[#0b0b14]/50 border border-gray-850 hover:border-gray-800 rounded-xl transition duration-200"
                    >
                      <div className="flex gap-2.5 items-start">
                        <div className="w-1.5 h-1.5 rounded-full bg-accentTeal mt-1.5 flex-shrink-0" />
                        <span className="text-xs font-medium text-gray-200 leading-tight">{finding.text}</span>
                      </div>
                      
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 border rounded-full uppercase tracking-wider flex-shrink-0 ml-3 ${finding.color}`}>
                        {finding.confidence}% {finding.level}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Entities Detected */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {analysis.vehiclesDetected && analysis.vehiclesDetected.length > 0 && (
                <div className="bg-[#0b0b14]/30 border border-gray-850 p-3.5 rounded-xl">
                  <h4 className="text-xs font-mono font-bold text-accentTeal uppercase tracking-wider mb-2">Vehicles Detected</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.vehiclesDetected.map((v, i) => (
                      <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-1 rounded text-white">{v}</span>
                    ))}
                  </div>
                </div>
              )}
              {analysis.peopleDetected && analysis.peopleDetected.length > 0 && (
                <div className="bg-[#0b0b14]/30 border border-gray-850 p-3.5 rounded-xl">
                  <h4 className="text-xs font-mono font-bold text-accentTeal uppercase tracking-wider mb-2">People Detected</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {analysis.peopleDetected.map((p, i) => (
                      <span key={i} className="text-[10px] font-mono bg-white/5 border border-white/10 px-2 py-1 rounded text-white">{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons footer */}
        <div className="flex flex-col sm:flex-row gap-4 border-t border-gray-850 pt-5">
          <button 
            onClick={onTogglePDF}
            className="flex-1 py-3 bg-[#0b0b14] hover:bg-[#0f0f20] border border-gray-800 hover:border-accentPurple text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4 text-accentTeal" /> Download PDF
          </button>
          
          <button 
            className="flex-1 py-3 bg-accentPurple hover:bg-accentPurple/95 text-white font-mono text-xs uppercase tracking-wider font-bold rounded-lg transition shadow-glowPurple border border-accentPurple/50 flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share Report
          </button>
        </div>
      </div>
    </div>
  );
}
