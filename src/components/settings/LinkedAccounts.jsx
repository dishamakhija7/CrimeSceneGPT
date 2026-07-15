import React, { useState } from 'react';
import SettingsShell from '../SettingsShell';
import { motion } from 'framer-motion';

const accounts = [
  { name: 'Google', status: 'Connected', used: '23GB', sync: '2h ago', color: '#4285F4' },
  { name: 'Microsoft', status: 'Connected', used: '14GB', sync: '1d ago', color: '#0078D4' },
  { name: 'Dropbox', status: 'Not Connected', used: '0GB', sync: 'Never', color: '#0061FF' },
  { name: 'Google Drive', status: 'Connected', used: '12GB', sync: '4h ago', color: '#0F9D58' },
  { name: 'OneDrive', status: 'Connected', used: '6GB', sync: '7h ago', color: '#094AB2' },
  { name: 'AWS S3', status: 'Not Connected', used: '0GB', sync: 'Never', color: '#FF9900' },
  { name: 'Azure Storage', status: 'Connected', used: '5GB', sync: '8h ago', color: '#0078D4' },
];

export default function LinkedAccounts({ onBack }) {
  const [items, setItems] = useState(accounts);

  const handleToggle = (name) => {
    setItems((prev) => prev.map((item) => item.name === name ? {
      ...item,
      status: item.status === 'Connected' ? 'Not Connected' : 'Connected',
      sync: item.status === 'Connected' ? 'Never' : 'Just now',
      used: item.status === 'Connected' ? '0GB' : item.used || '0GB',
    } : item));
  };

  return (
    <SettingsShell
      title="Linked Accounts"
      subtitle="Manage your external integrations used for evidence sync and case files."
      onBack={onBack}
    >
      <div className="grid gap-5">
        {items.map((item, idx) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="grid h-12 w-12 place-items-center rounded-3xl" style={{ backgroundColor: `${item.color}18` }}>
                  <span className="text-lg font-semibold" style={{ color: item.color }}>{item.name[0]}</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{item.name}</p>
                  <p className="text-xs text-[#94a3b8]">{item.status === 'Connected' ? 'Connected account' : 'Not connected'}</p>
                </div>
              </div>
              <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase ${item.status === 'Connected' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-gray-300'}`}>
                {item.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#94a3b8]">Last Sync</p>
                <p className="mt-2 text-sm text-white">{item.sync}</p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-4">
                <p className="text-[11px] uppercase tracking-[0.28em] text-[#94a3b8]">Storage Used</p>
                <p className="mt-2 text-sm text-white">{item.used}</p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <button className="rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#cbd5e1] transition hover:bg-white/10">
                Sync Now
              </button>
              <button
                onClick={() => handleToggle(item.name)}
                className="rounded-3xl border border-[#7c3aed]/40 bg-[#7c3aed]/10 px-4 py-3 text-sm text-[#ede9fe] transition hover:bg-[#7c3aed]/25"
              >
                {item.status === 'Connected' ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </SettingsShell>
  );
}
