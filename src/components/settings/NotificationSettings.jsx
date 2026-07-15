import React, { useState } from 'react';
import SettingsShell from '../SettingsShell';
import { motion } from 'framer-motion';

const toggles = [
  'Push Notifications',
  'Email Alerts',
  'SMS Alerts',
  'Critical Incident Alerts',
  'Evidence Upload Notifications',
  'Case Assignment Notifications',
  'Report Ready Alerts',
  'Daily Summary',
  'Dark Mode Notifications',
];

export default function NotificationSettings({ onBack }) {
  const [settings, setSettings] = useState(
    toggles.reduce((acc, setting) => ({ ...acc, [setting]: true }), {})
  );

  const toggle = (key) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <SettingsShell
      title="Notification Settings"
      subtitle="Control how CrimeScene GPT alerts you across devices and investigation channels."
      onBack={onBack}
    >
      <div className="grid gap-5">
        {toggles.map((setting) => (
          <motion.button
            key={setting}
            onClick={() => toggle(setting)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: (toggles?.indexOf(setting) ?? 0) * 0.04 }}
            className="flex items-center justify-between rounded-3xl border border-white/10 bg-[#111827]/80 px-5 py-4 text-left shadow-sm transition hover:border-[#7c3aed]/50 hover:bg-[#14203a]"
          >
            <div>
              <p className="text-sm font-semibold text-white">{setting}</p>
              <p className="text-xs text-[#94a3b8] mt-1">{settings[setting] ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div className={`relative inline-flex h-8 w-14 items-center rounded-full transition ${settings[setting] ? 'bg-[#7c3aed]' : 'bg-[#3f4456]'}`}>
              <span className={`absolute left-1 h-6 w-6 rounded-full bg-white shadow transition ${settings[setting] ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </motion.button>
        ))}
      </div>
    </SettingsShell>
  );
}
