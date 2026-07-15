import React from 'react';
import { Shield, Link as LinkIcon, Mail, Lock } from 'lucide-react';

export default function SecurityFooter() {
  return (
    <div className="mt-8 w-full max-w-4xl mx-auto bg-[#0B0F19]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row gap-8 items-center md:items-start justify-between z-10">
      
      {/* Left side: Security First */}
      <div className="flex items-start gap-4 max-w-sm">
        <div className="w-12 h-12 shrink-0 rounded-xl bg-accentPurple/20 border border-accentPurple/40 flex items-center justify-center shadow-[0_0_15px_rgba(93,51,248,0.3)]">
          <Shield className="w-6 h-6 text-accentPurple" />
        </div>
        <div>
          <h3 className="text-white font-bold text-lg mb-1">Security First</h3>
          <p className="text-gray-400 text-xs leading-relaxed">
            We use secure token based authentication to ensure your account remains safe.
          </p>
        </div>
      </div>

      {/* Right side: 3 columns */}
      <div className="flex flex-row flex-wrap justify-center gap-6 md:gap-8">
        
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <LinkIcon className="w-4 h-4 text-accentPurple" />
          </div>
          <div>
            <h4 className="text-white text-[11px] font-bold">Secure Reset Link</h4>
            <p className="text-gray-500 text-[10px]">Time-limited link</p>
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-accentPurple" />
          </div>
          <div>
            <h4 className="text-white text-[11px] font-bold">Email Verification</h4>
            <p className="text-gray-500 text-[10px]">6-digit code</p>
          </div>
        </div>

        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Lock className="w-4 h-4 text-accentPurple" />
          </div>
          <div>
            <h4 className="text-white text-[11px] font-bold">Safe & Encrypted</h4>
            <p className="text-gray-500 text-[10px]">Your data is protected</p>
          </div>
        </div>

      </div>

    </div>
  );
}
