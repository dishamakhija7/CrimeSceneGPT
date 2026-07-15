import React, { useState, useEffect } from 'react';
import { ChevronRight, ArrowLeft, FolderHeart, Clock, CheckCircle2, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCases } from '../services/firestore';

export default function CaseList({ onBack, onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchCases = async () => {
      try {
        setLoading(true);
        const data = await getCases();
        if (mounted && data) {
          setCases(data);
        }
      } catch (err) {
        console.error("Error loading cases:", err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchCases();

    return () => {
      mounted = false;
    };
  }, []);

  const activeWorkflows = cases.filter(c => c.status !== 'Completed').length;

  if (loading) {
    return (
      <div className="w-full max-w-5xl mx-auto p-4 md:p-6 h-[60vh] flex flex-col items-center justify-center">
        <Loader className="w-10 h-10 text-accentTeal animate-spin mb-4" />
        <p className="text-gray-400 font-mono text-sm">Loading Case Archive...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-[#111827]/80 text-white transition hover:border-[#00E5FF]"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-left">
          <p className="text-xs uppercase tracking-[0.3em] text-[#a78bfa]/80">Cases</p>
          <h1 className="text-3xl font-bold text-white">My Cases</h1>
          <p className="mt-2 text-sm text-gray-400">Browse active investigations, review status updates, and open the case workspace.</p>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2">
        <motion.div className="rounded-3xl border border-white/10 bg-[#121222]/80 p-5 shadow-sm text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-[0.28em]">Total Cases</p>
              <p className="mt-3 text-3xl font-semibold text-white">{cases.length}</p>
            </div>
            <FolderHeart className="w-10 h-10 rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-2 text-accentTeal" />
          </div>
        </motion.div>
        <motion.div className="rounded-3xl border border-white/10 bg-[#121222]/80 p-5 shadow-sm text-left">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-400 uppercase tracking-[0.28em]">Active Workflows</p>
              <p className="mt-3 text-3xl font-semibold text-white">{activeWorkflows}</p>
            </div>
            <Clock className="w-10 h-10 rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-2 text-yellow-400" />
          </div>
        </motion.div>
      </div>

      <div className="space-y-4">
        {cases.length > 0 ? (
          cases.map((item, idx) => {
            const hasAnalysis = !!item.aiAnalysis;
            const stage = hasAnalysis ? 'Reconstruction complete' : 'Evidence intake in progress';
            const formattedDate = new Date(item.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
            
            return (
              <motion.button
                key={item.id}
                onClick={() => onSelectCase(item.id)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="w-full rounded-[30px] border border-white/10 bg-[#111827]/90 p-5 text-left shadow-sm transition hover:border-[#00E5FF]/50 hover:bg-[#16213f]"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-[#94a3b8] uppercase tracking-[0.26em]">{item.id}</p>
                    <h2 className="mt-2 text-xl font-semibold text-white">{item.caseTitle || item.title || 'Untitled Case'}</h2>
                    <p className="mt-2 text-sm text-gray-400">{stage} • Registered {formattedDate}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-3xl border border-white/10 bg-white/5 px-3 py-1 text-[11px] text-gray-300 uppercase tracking-[0.24em]">{item.status || 'In Progress'}</span>
                    <span className="rounded-3xl bg-accentPurple/10 px-3 py-1 text-[11px] text-[#00E5FF] uppercase tracking-[0.24em]">{item.priority || 'High'}</span>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
                  <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-accentTeal" /> Open case workspace</span>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </motion.button>
            );
          })
        ) : (
          <div className="py-12 text-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-2xl bg-[#121222]/30">
            No cases archived. Click "New Case" on the dashboard to register one!
          </div>
        )}
      </div>
    </div>
  );
}
