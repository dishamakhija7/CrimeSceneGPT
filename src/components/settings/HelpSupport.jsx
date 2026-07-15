import React, { useState } from 'react';
import { motion } from 'framer-motion';
import SettingsShell from '../SettingsShell';

const faqs = [
  { question: 'How do I create a case?', answer: 'Open the dashboard and select New Investigation. Fill in the incident details, evidence collection notes, and AI analysis parameters to create a new case.' },
  { question: 'How do I upload evidence?', answer: 'Navigate to Evidence Upload and drag files or connect a linked account. The system automatically classifies evidence types for reconstruction.' },
  { question: 'How does AI reconstruction work?', answer: 'The AI analyzes sensor data, witness statements, and physical evidence to build a trajectory-based 3D reconstruction model.' },
  { question: 'How do I export reports?', answer: 'Open the report viewer, choose Export PDF, and select the case sections you want in the final document.' },
  { question: 'How do I recover deleted cases?', answer: 'Contact support through the Raise Ticket form. Deleted cases are encrypted and can only be restored by the system admin.' },
];

const articles = [
  'Getting Started',
  'Evidence Collection',
  'AI Analysis',
  'Reconstruction',
  'Reports',
  'Privacy',
];

export default function HelpSupport({ onBack }) {
  const [openFaq, setOpenFaq] = useState(null);
  const [report, setReport] = useState({ title: '', description: '', screenshot: null });
  const [sent, setSent] = useState(false);

  const toggleFaq = (index) => setOpenFaq(openFaq === index ? null : index);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSent(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
  };

  return (
    <SettingsShell
      title="Help & Support"
      subtitle="Access expert guidance, submit tickets, and get live assistance for critical investigations."
      onBack={onBack}
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Frequently Asked Questions</h2>
            <div className="mt-4 space-y-3">
              {faqs.map((faq, idx) => (
                <button
                  key={faq.question}
                  type="button"
                  onClick={() => toggleFaq(idx)}
                  className="w-full rounded-3xl border border-white/10 bg-[#0b0f1f]/80 p-4 text-left transition hover:border-[#7c3aed]/50"
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-white">{faq.question}</p>
                    <span className="text-xs text-[#94a3b8]">{openFaq === idx ? 'Hide' : 'Show'}</span>
                  </div>
                  {openFaq === idx && <p className="mt-3 text-sm text-[#cbd5e1]">{faq.answer}</p>}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Contact Support</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {['Live Chat', 'Email Support', 'Call Support', 'Raise Ticket'].map((label) => (
                <button key={label} className="rounded-3xl border border-white/10 bg-[#0b0f1f]/80 px-4 py-5 text-left text-sm text-white transition hover:border-[#7c3aed]/50">
                  <p className="font-semibold">{label}</p>
                  <p className="mt-2 text-xs text-[#94a3b8]">Fast response for mission-critical issues.</p>
                </button>
              ))}
            </div>
          </section>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }} className="space-y-6">
          <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-white">Report a Bug</h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <input
                value={report.title}
                onChange={(e) => setReport((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Bug title"
                className="w-full rounded-3xl border border-white/10 bg-[#0b0f1f]/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[#7c3aed]"
              />
              <textarea
                value={report.description}
                onChange={(e) => setReport((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the issue with steps to reproduce"
                rows={5}
                className="w-full rounded-3xl border border-white/10 bg-[#0b0f1f]/80 px-4 py-3 text-sm text-white outline-none transition focus:border-[#7c3aed]"
              />
              <div className="rounded-3xl border border-dashed border-white/10 bg-[#0b0f1f]/80 p-4 text-sm text-[#94a3b8]">
                Screenshot Upload (mock)
              </div>
              <button className="w-full rounded-3xl bg-[#7c3aed] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#8b5cf6]">
                Submit
              </button>
              {sent && <p className="text-sm text-emerald-300">Bug report submitted successfully.</p>}
            </form>
          </section>

          <section className="rounded-3xl border border-white/10 bg-[#111827]/80 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-white">User Guide</h2>
            <div className="mt-4 grid gap-3">
              {articles.map((article) => (
                <button key={article} className="w-full rounded-3xl border border-white/10 bg-[#0b0f1f]/80 px-4 py-4 text-left text-sm text-white transition hover:border-[#7c3aed]/50">
                  <p className="font-semibold">{article}</p>
                  <p className="mt-2 text-xs text-[#94a3b8]">Open the detailed article for best practices and workflows.</p>
                </button>
              ))}
            </div>
          </section>
        </motion.div>
      </div>
    </SettingsShell>
  );
}
