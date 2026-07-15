import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu, CheckCircle2, ShieldAlert, Loader } from 'lucide-react';
import { analyzeEvidence } from '../services/evidenceIntakeService';

export default function EvidenceIntakeAgent({ caseId, onAnalysisComplete }) {
  const [status, setStatus] = useState('analyzing'); // analyzing, success, error
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let mounted = true;

    const runAnalysis = async () => {
      try {
        await analyzeEvidence(caseId);
        if (mounted) {
          setStatus('success');
          setTimeout(() => {
            if (mounted) {
              onAnalysisComplete();
            }
          }, 1500);
        }
      } catch (err) {
        console.error(err);
        if (mounted) {
          setStatus('error');
          setErrorMsg(err.message || "An error occurred during AI analysis.");
        }
      }
    };

    runAnalysis();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [caseId, retryCount]);

  return (
    <div className="w-full max-w-xl mx-auto p-4 md:p-6 h-[80vh] flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#121222]/90 border border-gray-800 rounded-2xl p-8 shadow-2xl flex flex-col items-center text-center max-w-md w-full relative overflow-hidden"
      >
        <div className="absolute inset-0 cyber-grid opacity-20 pointer-events-none" />

        {status === 'analyzing' && (
          <>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
              className="mb-6 relative"
            >
              <div className="absolute inset-0 bg-accentTeal/20 blur-xl rounded-full" />
              <Cpu className="w-16 h-16 text-accentTeal relative z-10" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wider">
              Evidence Intake Agent
            </h2>
            <p className="text-gray-400 text-sm font-mono mb-4">
              Analyzing uploaded evidence...
            </p>
            <div className="w-full bg-gray-900 rounded-full h-1 mb-2 overflow-hidden relative">
              <motion.div 
                className="h-full bg-accentTeal"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 15, ease: "linear" }}
              />
            </div>
            <p className="text-xs text-gray-500 font-mono italic">
              Extracting entities, conditions, and clues.
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="mb-6 relative"
            >
              <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              <CheckCircle2 className="w-16 h-16 text-green-500 relative z-10" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wider">
              Analysis Complete
            </h2>
            <p className="text-gray-400 text-sm font-mono">
              Evidence analysis completed successfully. Waiting for the next AI agent.
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <motion.div className="mb-6 relative">
              <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
              <ShieldAlert className="w-16 h-16 text-red-500 relative z-10" />
            </motion.div>
            <h2 className="text-xl font-bold text-white mb-2 font-mono uppercase tracking-wider">
              Analysis Failed
            </h2>
            <p className="text-red-400 text-sm font-mono mb-4">
              {errorMsg}
            </p>
            <button
              onClick={() => {
                setStatus('analyzing');
                setErrorMsg('');
                setRetryCount(c => c + 1);
              }}
              className="px-4 py-2 bg-[#0b0b14] border border-gray-800 text-gray-300 font-mono text-xs uppercase hover:text-white rounded transition"
            >
              Retry
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
