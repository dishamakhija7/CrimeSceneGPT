import React, { useState, useEffect } from 'react';
import { Plus, ChevronRight, Activity, CheckCircle2, Clock, Award, ShieldAlert, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { getCases, deleteCase, updateCase } from '../services/firestore';
import { auth } from '../firebase';

export default function Dashboard({ onNewInvestigation, onSelectCase, onOpenCases, onNewCase }) {
  const [stats, setStats] = useState([
    { label: 'Total Cases', value: '0', change: 'Registered', icon: <Activity className="w-5 h-5 text-accentTeal" /> },
    { label: 'In Progress', value: '0', change: 'Processing', icon: <Clock className="w-5 h-5 text-yellow-500" /> },
    { label: 'Completed', value: '0', change: 'Closed', icon: <CheckCircle2 className="w-5 h-5 text-accentPurple" /> },
    { label: 'Accuracy', value: 'N/A', change: 'No analysis yet', icon: <Award className="w-5 h-5 text-green-500" /> },
  ]);

  const [recentCases, setRecentCases] = useState([]);
  const [officerName, setOfficerName] = useState('Officer');

  useEffect(() => {
    if (auth.currentUser) {
      setOfficerName(auth.currentUser.displayName || auth.currentUser.email.split('@')[0] || 'Officer');
    }
  }, []);

  const fetchRecentCases = async () => {
    try {
      const casesData = await getCases();
      if (casesData) {
        const total = casesData.length;
        const inProgress = casesData.filter(c => c.status !== 'Completed').length;
        const completed = casesData.filter(c => c.status === 'Completed').length;
        
        // Calculate average accuracy from cases with AI analysis confidence scores
        const accuracyScores = casesData
          .filter(c => c.aiAnalysis && c.aiAnalysis.confidenceScore)
          .map(c => {
            const val = c.aiAnalysis.confidenceScore;
            // If model returned a fraction (e.g. 0.85) instead of percentage (e.g. 85), normalize to percentage
            return val <= 1 ? val * 100 : val;
          });
        const avgAccuracy = accuracyScores.length > 0
          ? Math.round(accuracyScores.reduce((a, b) => a + b, 0) / accuracyScores.length)
          : 0;

        setStats([
          { label: 'Total Cases', value: total.toString(), change: 'Registered', icon: <Activity className="w-5 h-5 text-accentTeal" /> },
          { label: 'In Progress', value: inProgress.toString(), change: 'Processing', icon: <Clock className="w-5 h-5 text-yellow-500" /> },
          { label: 'Completed', value: completed.toString(), change: 'Closed', icon: <CheckCircle2 className="w-5 h-5 text-accentPurple" /> },
          { label: 'Accuracy', value: avgAccuracy > 0 ? `${avgAccuracy}%` : 'N/A', change: avgAccuracy > 0 ? 'AI Confidence' : 'No analysis yet', icon: <Award className="w-5 h-5 text-green-500" /> },
        ]);

        if (casesData.length > 0) {
          const formatted = casesData.slice(0, 4).map(c => ({
            id: c.id,
            title: c.caseTitle || c.title || 'Untitled Case',
            time: new Date(c.createdAt).toLocaleDateString() + ' ' + new Date(c.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: c.status || 'In Progress',
            statusColor: c.status === 'Completed' ? 'bg-[#7c3aed]/20 border-[#7c3aed]/50 text-accentTeal' : 'bg-green-500/10 border-green-500/30 text-green-400'
          }));
          setRecentCases(formatted);
        } else {
          setRecentCases([]);
        }
      }
    } catch (err) {
      console.error("Error fetching cases for dashboard:", err);
    }
  };

  useEffect(() => {
    fetchRecentCases();
  }, []);

  const handleCompleteCase = async (caseId, e) => {
    e.stopPropagation(); // Prevent opening case view
    const confirm = window.confirm(`Are you sure you want to mark case ${caseId} as Completed/Closed?`);
    if (!confirm) return;

    try {
      await updateCase(caseId, { status: 'Completed' });
      alert(`Case ${caseId} marked as Completed!`);
      await fetchRecentCases(); // Refresh dashboard data instantly
    } catch (err) {
      console.error("Error completing case from dashboard:", err);
      alert("Failed to complete case.");
    }
  };

  const handleDeleteCase = async (caseId, e) => {
    e.stopPropagation(); // Prevent opening case view
    const confirm = window.confirm(`WARNING: Are you sure you want to permanently DELETE case ${caseId}? All data will be lost forever.`);
    if (!confirm) return;

    try {
      await deleteCase(caseId);
      alert(`Case ${caseId} deleted successfully!`);
      await fetchRecentCases(); // Refresh dashboard data instantly
    } catch (err) {
      console.error("Error deleting case from dashboard:", err);
      alert("Failed to delete case.");
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 md:p-6 space-y-6 text-left">
      {/* Dashboard Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            Hello, {officerName} <span className="animate-wiggle">👋</span>
          </h2>
          <p className="text-gray-400 text-sm mt-1">Let's uncover the truth today.</p>
        </div>
        
        {/* CTA */}
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewCase}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#00E5FF] hover:bg-[#00E5FF]/90 text-black font-mono text-xs tracking-wider uppercase font-bold rounded-lg shadow-glowTeal border border-[#00E5FF]/50 transition"
          >
            <Plus className="w-4 h-4" /> New Case
          </motion.button>
          
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onNewInvestigation}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-[#7c3aed] hover:bg-[#7c3aed]/90 text-white font-mono text-xs tracking-wider uppercase font-bold rounded-lg shadow-glowPurple border border-[#7c3aed]/50 transition"
          >
            <Plus className="w-4 h-4" /> New Investigation
          </motion.button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-[#121222]/80 border border-gray-800 rounded-xl p-4 flex items-start justify-between glass-card-hover"
          >
            <div>
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">{stat.label}</span>
              <div className="text-2xl font-extrabold text-white mt-1 font-mono">{stat.value}</div>
              <span className="text-[9px] font-mono text-gray-400 block mt-1">{stat.change}</span>
            </div>
            <div className="p-2 bg-[#0b0b14] border border-gray-800 rounded-lg">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Case List Header */}
      <div className="flex justify-between items-center mt-8">
        <h3 className="text-sm font-mono text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-accentTeal" /> Recent Investigations
        </h3>
        <button onClick={onOpenCases} className="text-xs text-[#00E5FF] hover:underline font-mono">See All</button>
      </div>

      {/* Recent Cases */}
      <div className="space-y-3">
        {recentCases.length > 0 ? (
          recentCases.map((c, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              whileHover={{ x: 4 }}
              onClick={() => onSelectCase(c.id)}
              className="w-full text-left bg-[#121222]/60 hover:bg-[#121222]/90 border border-gray-800 hover:border-gray-700 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition duration-300"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1 w-2 h-2 rounded-full bg-accentTeal shadow-glowTeal" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono font-bold text-white tracking-wide">{c.id}</span>
                    <span className="text-gray-600 text-xs">•</span>
                    <span className="text-xs text-gray-300 font-medium">{c.title}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 font-mono mt-1">{c.time}</div>
                </div>
              </div>
              
              <div className="flex items-center justify-between sm:justify-end gap-3" onClick={e => e.stopPropagation()}>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${c.statusColor}`}>
                  {c.status}
                </span>

                {c.status !== 'Completed' && (
                  <button
                    onClick={(e) => handleCompleteCase(c.id, e)}
                    className="p-1.5 rounded-lg border border-green-500/20 bg-green-500/5 text-green-400 hover:bg-green-500/20 hover:border-green-500/40 transition"
                    title="Mark as Completed"
                  >
                    <CheckCircle2 className="w-4.5 h-4.5" />
                  </button>
                )}

                <button
                  onClick={(e) => handleDeleteCase(c.id, e)}
                  className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition"
                  title="Delete Case"
                >
                  <Trash2 className="w-4.5 h-4.5" />
                </button>

                <ChevronRight className="w-4 h-4 text-gray-600" />
              </div>
            </motion.div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 font-mono text-sm border border-dashed border-gray-800 rounded-xl bg-[#121222]/30">
            No investigations found. Click "New Case" to get started!
          </div>
        )}
      </div>
    </div>
  );
}
