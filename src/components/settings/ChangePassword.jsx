import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import SettingsShell from '../SettingsShell';

const strengthLabels = [
  { score: 0, label: 'Weak', color: 'bg-red-500' },
  { score: 1, label: 'Fair', color: 'bg-orange-400' },
  { score: 2, label: 'Good', color: 'bg-yellow-400' },
  { score: 3, label: 'Strong', color: 'bg-cyan-400' },
  { score: 4, label: 'Excellent', color: 'bg-violet-400' },
];

export default function ChangePassword({ onBack }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [password, setPassword] = useState({ current: '', new: '', confirm: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const { current, new: newPwd, confirm } = password;
    if (!current || !newPwd || !confirm) return 'All fields are required.';
    if (newPwd.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(newPwd)) return 'Include at least one uppercase letter.';
    if (!/[a-z]/.test(newPwd)) return 'Include at least one lowercase letter.';
    if (!/[0-9]/.test(newPwd)) return 'Include at least one number.';
    if (!/[^A-Za-z0-9]/.test(newPwd)) return 'Include at least one special character.';
    if (newPwd !== confirm) return 'New password and confirmation must match.';
    return '';
  };

  const score = () => {
    const { new: newPwd } = password;
    return [/[A-Z]/, /[a-z]/, /[0-9]/, /[^A-Za-z0-9]/].reduce((count, regex) => (regex.test(newPwd) ? count + 1 : count), 0);
  };

  const handleUpdate = async () => {
    const validation = validate();
    if (validation) {
      setError(validation);
      return;
    }

    setError('');
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 800));
    setLoading(false);
    setSuccess('Password updated successfully.');
    setPassword({ current: '', new: '', confirm: '' });
  };

  return (
    <SettingsShell
      title="Change Password"
      subtitle="Secure your account with a strong password and instant strength feedback."
      onBack={onBack}
      actionNode={(
        <button
          type="button"
          onClick={() => setPassword({ current: '', new: '', confirm: '' })}
          className="inline-flex items-center rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-[#cbd5e1] transition hover:bg-white/10"
        >
          Cancel
        </button>
      )}
    >
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="rounded-3xl border border-white/10 bg-[#111827]/70 p-6 shadow-[0_20px_40px_rgba(124,58,237,0.14)]"
        >
          <div className="grid gap-5">
            {[
              { label: 'Current Password', field: 'current', visible: showCurrent, toggle: () => setShowCurrent((v) => !v) },
              { label: 'New Password', field: 'new', visible: showNew, toggle: () => setShowNew((v) => !v) },
              { label: 'Confirm Password', field: 'confirm', visible: showConfirm, toggle: () => setShowConfirm((v) => !v) },
            ].map(({ label, field, visible, toggle }) => (
              <div key={field} className="space-y-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-[#94a3b8]">
                  <label>{label}</label>
                  <button type="button" onClick={toggle} className="text-[#cbd5e1] hover:text-white text-sm transition">
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <input
                  type={visible ? 'text' : 'password'}
                  value={password[field]}
                  onChange={(e) => setPassword((prev) => ({ ...prev, [field]: e.target.value }))}
                  className="w-full rounded-3xl border border-white/10 bg-[#0b0f1f] px-4 py-3 text-sm text-white outline-none transition focus:border-[#7c3aed]"
                />
              </div>
            ))}
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-4">
            <div className="flex items-center justify-between gap-4 text-sm text-[#cbd5e1]">
              <span>Password strength</span>
              <span className="font-semibold text-white">{strengthLabels[score()].label}</span>
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              {strengthLabels.map((item, idx) => (
                <div key={idx} className={`h-2 rounded-full ${idx <= score() - 1 ? item.color : 'bg-[#2d333f]'}`} />
              ))}
            </div>
            <div className="mt-4 grid gap-2 text-xs text-[#94a3b8]">
              <p>- Minimum 8 characters</p>
              <p>- Uppercase letter</p>
              <p>- Lowercase letter</p>
              <p>- Number</p>
              <p>- Special character</p>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-300">{success}</p>}

          <button
            type="button"
            onClick={handleUpdate}
            disabled={loading}
            className="mt-5 inline-flex w-full items-center justify-center rounded-3xl bg-[#7c3aed] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#8b5cf6] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </motion.div>
      </div>
    </SettingsShell>
  );
}
