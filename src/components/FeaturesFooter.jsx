import React from 'react';
import { Link as LinkIcon, Mail, Lock } from 'lucide-react';

export default function FeaturesFooter() {
  return (
    <div className="w-full mt-6 pt-6 border-t border-gray-800 flex flex-row flex-wrap justify-between gap-4">
      
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
  );
}
