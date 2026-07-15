import React from 'react';
import SettingsShell from '../SettingsShell';

export default function AboutApp({ onBack }) {
  return (
    <SettingsShell
      title="About CrimeScene GPT"
      subtitle="Learn about the app, privacy, versioning, and the command center that empowers modern investigations."
      onBack={onBack}
    >
      <div className="space-y-6">
        <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white">App Overview</h2>
          <p className="mt-4 text-sm leading-7 text-[#cbd5e1]">
            CrimeScene GPT is a forensic intelligence platform built for fast, data-driven investigations. It combines evidence analysis, 3D reconstruction, and automated reporting into one secure dashboard.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-white">Current Version</p>
              <p className="mt-2 text-sm text-[#94a3b8]">v2.4.1</p>
            </div>
            <button className="rounded-3xl bg-[#7c3aed] px-4 py-2 text-sm text-white transition hover:bg-[#8b5cf6]">
              Check for Updates
            </button>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Privacy & Security</h2>
          <p className="mt-4 text-sm leading-7 text-[#cbd5e1]">
            Your case data is encrypted in transit and at rest. Access controls, audit logs, and secure evidence storage help maintain chain of custody across investigations.
          </p>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-white">Legal</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-[#cbd5e1]">
            <li>Usage subject to internal policy and legal review.</li>
            <li>Evidence access is tracked and classified.</li>
            <li>AI outputs are advisory and require investigator validation.</li>
          </ul>
        </section>
      </div>
    </SettingsShell>
  );
}
