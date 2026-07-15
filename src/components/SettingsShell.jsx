import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SettingsShell({ title, subtitle, onBack, children, actionNode }) {
  return (
    <div className="min-h-screen bg-[#080a13] text-white px-4 py-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-[36px] border border-white/10 bg-[#0b0f1f]/80 shadow-[0_40px_120px_rgba(31,25,54,0.35)] backdrop-blur-xl overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4 border-b border-white/10 bg-[#0c1224]/90 px-4 py-4">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex h-12 w-12 items-center justify-center rounded-3xl border border-white/10 bg-white/5 text-[#c084fc] transition hover:bg-white/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex-1 text-left">
              <p className="text-[10px] uppercase tracking-[0.35em] text-[#a78bfa]/80">Settings</p>
              <h1 className="text-xl font-semibold text-white mt-2 leading-none">{title}</h1>
              <p className="text-sm text-[#cbd5e1]/80 mt-2 max-w-2xl">{subtitle}</p>
            </div>
            {actionNode}
          </div>
          <div className="p-6 space-y-6 overflow-hidden">{children}</div>
        </motion.div>
      </div>
    </div>
  );
}
