import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SettingsShell from '../SettingsShell';

const initialForm = {
  photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  name: 'Inspector Arjun',
  badge: 'CS-98014-ARJ',
  department: 'Forensic Intelligence Division',
  rank: 'Lead Analyst',
  email: 'arjun@crimescene.com',
  phone: '+91 98765 43210',
  address: 'Cybercrime Unit, Mumbai Police HQ, Mumbai, IN',
  joined: '04 Jan 2022',
};

export default function PersonalInfo({ onBack }) {
  const [form, setForm] = useState(initialForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    await new Promise((resolve) => setTimeout(resolve, 700));
    setSaving(false);
    setMessage('Profile changes saved successfully.');
  };

  return (
    <SettingsShell
      title="Personal Information"
      subtitle="Update your officer profile, contact details, and assignment credentials."
      onBack={onBack}
      actionNode={(
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center rounded-3xl border border-purple-500/30 bg-[#7c3aed]/15 px-4 py-2 text-sm font-semibold text-[#ede9fe] transition hover:bg-[#7c3aed]/25"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      )}
    >
      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-[0_20px_40px_rgba(124,58,237,0.14)]"
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-5 text-center">
            <img src={form.photo} alt="Profile" className="mx-auto h-32 w-32 rounded-full object-cover border border-white/10 shadow-xl" />
            <div className="mt-5 space-y-3">
              <p className="text-sm uppercase tracking-[0.32em] text-[#c4b5fd]/75">Profile Photo</p>
              <button className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e5e7eb] transition hover:bg-white/10">
                Change Profile Photo
              </button>
              <button className="w-full rounded-2xl border border-purple-500/30 bg-[#7c3aed]/10 px-4 py-3 text-sm text-[#ede9fe] transition hover:bg-[#7c3aed]/20">
                Edit Profile
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="space-y-6"
        >
          {[
            { label: 'Officer Name', field: 'name', type: 'text' },
            { label: 'Badge Number', field: 'badge', type: 'text' },
            { label: 'Department', field: 'department', type: 'text' },
            { label: 'Rank', field: 'rank', type: 'text' },
            { label: 'Email', field: 'email', type: 'email' },
            { label: 'Phone', field: 'phone', type: 'tel' },
            { label: 'Office Address', field: 'address', type: 'text' },
            { label: 'Joined Date', field: 'joined', type: 'text', disabled: true },
          ].map(({ label, field, type, disabled }) => (
            <div key={field} className="rounded-3xl border border-white/10 bg-[#111827]/70 px-4 py-4 shadow-sm">
              <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-[#94a3b8]">
                {label}
              </label>
              <input
                value={form[field]}
                onChange={handleChange(field)}
                disabled={disabled}
                type={type}
                className="mt-3 w-full rounded-2xl border border-white/10 bg-[#0b0f1f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7c3aed]"
              />
            </div>
          ))}
        </motion.div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200"
        >
          {message}
        </motion.div>
      )}
    </SettingsShell>
  );
}
