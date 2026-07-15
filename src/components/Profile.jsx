import React, { useState, useEffect } from 'react';
import { ChevronRight, User, Key, Bell, Shield, HelpCircle, Info, LogOut, Award, CheckCircle, FileText, Activity, Loader2 } from 'lucide-react';
import { motion as m } from 'framer-motion';
import { getCasesByUser } from '../services/firestore';

export default function Profile({ onLogout, onNavigate, currentUser }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        const cases = await getCasesByUser(currentUser.uid);

        const total = cases.length;
        const completed = cases.filter(c => c.status === 'Completed').length;
        const inProgress = cases.filter(c => c.status !== 'Completed').length;

        // Average AI confidence score across all analysed cases (0.0 – 1.0 → displayed as %)
        const analysedCases = cases.filter(c => typeof c.aiAnalysis?.confidenceScore === 'number');
        const avgConfidence = analysedCases.length > 0
          ? Math.round((analysedCases.reduce((sum, c) => sum + c.aiAnalysis.confidenceScore, 0) / analysedCases.length) * 100)
          : null;

        setStats({ total, completed, inProgress, avgConfidence });
      } catch (err) {
        console.error('Failed to load profile stats:', err);
        setStats({ total: 0, completed: 0, inProgress: 0, avgConfidence: null });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [currentUser?.uid]);

  const settingsOptions = [
    { icon: <User className="w-5 h-5 text-accentTeal" />, label: 'Personal Information', action: 'personal' },
    { icon: <Key className="w-5 h-5 text-accentPurple" />, label: 'Change Password', action: 'password' },
    { icon: <Bell className="w-5 h-5 text-yellow-500" />, label: 'Notification Settings', action: 'notifications' },
    { icon: <Shield className="w-5 h-5 text-green-500" />, label: 'Linked Accounts', action: 'linked' },
    { icon: <HelpCircle className="w-5 h-5 text-blue-400" />, label: 'Help & Support', action: 'help' },
    { icon: <Info className="w-5 h-5 text-gray-400" />, label: 'About CrimeScene GPT', action: 'about' },
  ];

  const StatCard = ({ label, value, sub, subIcon, valueColor = 'text-white', subColor = 'text-accentTeal' }) => (
    <div className="bg-[#121222]/80 border border-gray-800 rounded-xl p-4 text-center">
      <div className="text-gray-500 text-xs font-mono uppercase tracking-wider">{label}</div>
      {loading ? (
        <div className="flex justify-center items-center mt-2 mb-1">
          <Loader2 className="w-6 h-6 text-gray-600 animate-spin" />
        </div>
      ) : (
        <div className={`text-3xl font-extrabold font-mono mt-1 ${valueColor}`}>{value}</div>
      )}
      <div className={`text-[10px] mt-1 flex items-center justify-center gap-1 ${subColor}`}>
        {subIcon}
        {sub}
      </div>
    </div>
  );

  const confidenceLabel =
    stats?.avgConfidence == null ? 'No AI Data'
    : stats.avgConfidence >= 85 ? 'High Confidence'
    : stats.avgConfidence >= 65 ? 'Medium Confidence'
    : 'Low Confidence';

  return (
    <div className="w-full max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      {/* Profile Header */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#121222]/80 border border-gray-800 rounded-xl p-6 flex flex-col sm:flex-row items-center gap-4 shadow-lg"
      >
        {/* Avatar */}
        <div className="relative w-20 h-20 rounded-full border-2 border-accentPurple overflow-hidden bg-gray-900 flex items-center justify-center">
          <img
            src={currentUser?.photoURL || ''}
            alt={currentUser?.displayName || 'User'}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.style.display = 'none'; }}
          />
          <User className="absolute w-10 h-10 text-gray-600" />
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-green-500 border-2 border-[#121222] flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          </div>
        </div>

        {/* Profile Info */}
        <div className="text-center sm:text-left flex-grow">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <h2 className="text-xl font-bold text-white">
              {currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Inspector'}
            </h2>
            <span className="bg-accentPurple/25 border border-accentPurple/50 text-accentTeal text-[9px] font-mono px-2 py-0.5 rounded-full">LEAD</span>
          </div>
          <p className="text-gray-400 text-xs mt-1 font-mono">{currentUser?.email || '—'}</p>
          <p className="text-gray-500 text-[10px] mt-1 font-mono">
            BADGE ID: {currentUser?.uid ? currentUser.uid.substring(0, 10).toUpperCase() : '—'}
          </p>
        </div>

        <button className="px-4 py-1.5 bg-[#0b0b14] border border-gray-800 hover:border-gray-700 text-xs font-mono rounded text-accentTeal transition">
          Edit Profile
        </button>
      </m.div>

      {/* Metrics Grid — all live from Firestore */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <StatCard
          label="Investigations"
          value={loading ? '—' : stats?.total ?? 0}
          sub={loading ? 'Loading…' : `Active: ${stats?.inProgress ?? 0}`}
          subIcon={<Activity className="w-3 h-3" />}
          subColor="text-accentTeal"
        />
        <StatCard
          label="Completed"
          value={loading ? '—' : stats?.completed ?? 0}
          sub="Closed Cases"
          subIcon={<CheckCircle className="w-3 h-3" />}
          subColor="text-green-500"
        />
        <StatCard
          label="In Progress"
          value={loading ? '—' : stats?.inProgress ?? 0}
          sub="Processing"
          subIcon={<FileText className="w-3 h-3" />}
          subColor="text-yellow-500"
        />
        <StatCard
          label="Accuracy"
          value={loading ? '—' : stats?.avgConfidence != null ? `${stats.avgConfidence}%` : 'N/A'}
          sub={loading ? 'Loading…' : confidenceLabel}
          subIcon={<Award className="w-3 h-3" />}
          valueColor={loading ? 'text-white' : 'text-accentTeal'}
          subColor="text-accentTeal"
        />
      </m.div>

      {/* Settings list */}
      <m.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#121222]/80 border border-gray-800 rounded-xl divide-y divide-gray-800 overflow-hidden"
      >
        {settingsOptions.map((opt, idx) => (
          <button
            key={idx}
            onClick={() => onNavigate && onNavigate(opt.action)}
            className="w-full flex items-center justify-between p-4 transition text-left group hover:bg-white/[0.02]"
          >
            <div className="flex items-center gap-3">
              {opt.icon}
              <span className="text-sm font-medium text-gray-300 group-hover:text-white transition">{opt.label}</span>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-accentTeal transition group-hover:translate-x-0.5" />
          </button>
        ))}

        {/* Logout */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-between p-4 hover:bg-red-500/5 transition text-left group text-red-500"
        >
          <div className="flex items-center gap-3">
            <LogOut className="w-5 h-5 text-red-500" />
            <span className="text-sm font-semibold">Logout</span>
          </div>
          <ChevronRight className="w-4 h-4 text-red-500/70 group-hover:translate-x-0.5 transition" />
        </button>
      </m.div>
    </div>
  );
}
