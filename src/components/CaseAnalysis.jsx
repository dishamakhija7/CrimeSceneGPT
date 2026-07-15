import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader, ShieldCheck, AlertTriangle, ArrowRight } from 'lucide-react';
import { getCaseById } from '../services/firestore';

export default function CaseAnalysis({ caseId, onContinue }) {
  const displayCaseId = caseId || "INV-2026-1009";
  
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    const fetchCase = async () => {
      if (!caseId) {
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await getCaseById(caseId);
        if (mounted) {
          setCaseData(data);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load case data:", err);
        if (mounted) {
          setError('Failed to load case data.');
          setLoading(false);
        }
      }
    };
    fetchCase();
    return () => { mounted = false; };
  }, [caseId]);

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-12 mt-20">
        <Loader className="w-8 h-8 text-[#00E5FF] animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Loading Case Analysis...</p>
      </div>
    );
  }

  const aiAnalysis = caseData?.aiAnalysis || {};
  
  const extractedFacts = [
    { label: 'Road Condition', value: caseData?.roadType || aiAnalysis.roadLayout || 'Unknown' },
    { label: 'Weather', value: caseData?.weather || aiAnalysis.weather || 'Unknown' },
    { label: 'Incident Type', value: aiAnalysis.incidentType || 'Vehicle Collision' },
    { label: 'Vehicle Types', value: aiAnalysis.vehiclesDetected?.join(', ') || 'Unknown' },
    { label: 'Visibility', value: caseData?.visibility || aiAnalysis.lightingConditions || 'Unknown' },
    { label: 'Location', value: aiAnalysis.roadLayout || 'Unknown' },
    { label: 'Number Of People', value: aiAnalysis.peopleDetected?.length?.toString() || '0' },
    { label: 'Time Of Day', value: aiAnalysis.lightingConditions || 'Unknown' }
  ];

  let rawScore = aiAnalysis.confidenceScore || 0.92;
  if (rawScore <= 1) rawScore *= 100;
  const confidenceScore = Math.max(85, Math.round(rawScore));
  
  // Use observations, or executive summary, or fallback.
  let findings = aiAnalysis.observations || [];
  if (!findings.length && aiAnalysis.executiveSummary) {
    findings = [aiAnalysis.executiveSummary];
  }
  if (!findings.length) {
    findings = ["No specific AI findings were generated for this case."];
  }

  let missingInfo = aiAnalysis.missingInformation || [];
  if (!missingInfo.length) {
    missingInfo = ["No critical information is flagged as missing."];
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 pb-24 flex flex-col gap-6">
       {/* Header */}
       <div className="mb-2">
         <h1 className="text-3xl font-bold text-white mb-2 font-mono uppercase tracking-wider">CASE ANALYSIS</h1>
         <p className="text-gray-400 text-sm font-mono">Reviewing AI findings for Case: {displayCaseId}</p>
       </div>

       {/* Top Row */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Left Column */}
         <div className="space-y-6 lg:col-span-1">
           {/* Progress Panel */}
           <div className="bg-[#12121a]/90 border border-gray-800/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6 font-mono">Investigation Progress</h3>
             <div className="space-y-4">
               <div className="flex items-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-green-500" />
                 <span className="text-green-500 text-sm font-mono">Evidence Uploaded</span>
               </div>
               <div className="flex items-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-green-500" />
                 <span className="text-green-500 text-sm font-mono">Evidence Processed</span>
               </div>
               <div className="flex items-center gap-3">
                 <CheckCircle2 className="w-5 h-5 text-green-500" />
                 <span className="text-green-500 text-sm font-mono">Facts Extracted</span>
               </div>
               <div className="flex items-center gap-3">
                 <Loader className="w-5 h-5 text-[#00E5FF] animate-spin" />
                 <span className="text-[#00E5FF] text-sm font-mono">Planning Investigation</span>
               </div>
             </div>
           </div>

           {/* Confidence Panel */}
           <div className="bg-[#12121a]/90 border border-gray-800/60 rounded-2xl p-6 shadow-xl">
             <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4 font-mono">Current Confidence</h3>
             <div className="text-4xl font-bold text-white mb-4">{confidenceScore}%</div>
             <div className="w-full bg-gray-900 rounded-full h-1.5 overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${confidenceScore}%` }}
                 transition={{ duration: 1, ease: "easeOut" }}
                 className="h-full bg-green-500"
               />
             </div>
           </div>
         </div>

         {/* Right Column (Facts) */}
         <div className="lg:col-span-2">
           <div className="bg-[#12121a]/90 border border-gray-800/60 rounded-2xl p-6 shadow-xl h-full">
             <div className="flex items-center gap-2 mb-6">
               <ShieldCheck className="w-5 h-5 text-[#00E5FF]" />
               <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest font-mono">Extracted Facts</h3>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {extractedFacts.map((fact, idx) => (
                 <div key={idx} className="bg-white/5 border border-white/5 rounded-xl p-3 flex flex-col justify-center">
                   <span className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{fact.label}</span>
                   <span className="text-sm font-semibold text-white capitalize">{fact.value}</span>
                 </div>
               ))}
             </div>
           </div>
         </div>
       </div>

       {/* Bottom Row */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
         {/* AI Findings */}
         <div className="bg-[#12121a]/90 border border-gray-800/60 rounded-2xl p-6 shadow-xl">
           <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6 font-mono">AI Findings</h3>
           <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
             {findings.map((finding, idx) => (
               <div key={idx} className="flex items-start gap-3">
                 <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] mt-2 flex-shrink-0" />
                 <p className="text-sm text-gray-300 leading-relaxed">{finding}</p>
               </div>
             ))}
           </div>
         </div>

         {/* Critical Info */}
         <div className="flex flex-col gap-6">
           <div className="bg-[#1a1215]/90 border border-red-900/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex-grow">
             <AlertTriangle className="absolute top-4 right-4 w-24 h-24 text-red-500/5 stroke-[1px] pointer-events-none" />
             <h3 className="text-xs font-semibold text-red-400 uppercase tracking-widest mb-6 font-mono">Critical Information Still Needed</h3>
             <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
               {missingInfo.map((info, idx) => (
                 <div key={idx} className="flex items-center gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                   <p className="text-sm text-gray-200">{info}</p>
                 </div>
               ))}
             </div>
           </div>

           {onContinue && (
             <div className="flex justify-end">
               <button
                 onClick={onContinue}
                 className="bg-[#00E5FF] hover:bg-[#00c9e0] text-black font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-[0_0_15px_rgba(0,229,255,0.4)]"
               >
                 <span>CONTINUE INVESTIGATION</span>
                 <ArrowRight className="w-5 h-5" />
               </button>
             </div>
           )}
         </div>
       </div>
    </div>
  );
}
