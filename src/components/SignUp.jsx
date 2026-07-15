import React, { useState } from 'react';
import { Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfile } from '../services/firestore';

export default function SignUp({ onSignUp, onGoToSignIn }) {
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('example@email.com');
  const [password, setPassword] = useState('********');
  const [agree, setAgree] = useState(true);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!agree) return;
    setError(null);
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName) {
        await updateProfile(userCredential.user, { displayName: fullName });
      }
      await createUserProfile(userCredential.user.uid, fullName, email);
      onSignUp();
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center gap-6 bg-[#09090E] p-6 cyber-grid overflow-y-auto pt-12 md:pt-6">
      {/* Radial glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accentPurple/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#0B0F19]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative z-10"
      >
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-2xl" />

        {/* Branding Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#7b61ff] rounded-full blur-[20px] opacity-60" />
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#7b61ff] filter drop-shadow-[0_0_10px_rgba(123,97,255,0.5)]">
              <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="rgba(16,12,42,0.85)" stroke="currentColor" strokeWidth="4" />
            </svg>
            <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full text-[#b6a6ff]" style={{ transform: 'scale(0.86)' }}>
              <polygon points="50 3, 93 25, 93 75, 50 97, 7 75, 7 25" fill="none" stroke="currentColor" strokeWidth="2" />
            </svg>
            <div className="relative z-10 text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="3.5" />
                <circle cx="11" cy="11" r="1.5" fill="currentColor" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-bold tracking-wider text-white uppercase flex items-center justify-center gap-1.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
            <span>CRIMESCENE</span>
            <span className="text-[#a692ff] font-extrabold drop-shadow-[0_0_10px_rgba(166,146,255,0.7)]">GPT</span>
          </h2>
        </div>

        <div className="text-center mb-6">
          <h3 className="text-lg font-mono font-bold tracking-[0.1em] text-white">NEW REGISTRATION</h3>
          <p className="text-gray-400 text-xs mt-2 font-mono">Initialize investigator profile</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Full Name field */}
          <div className="relative">
            <input 
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="peer w-full bg-[#0b0b14] border border-gray-800 focus:border-accentPurple text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-transparent"
              id="fullname_input"
              placeholder="Full Name"
              required
            />
            <label 
              htmlFor="fullname_input"
              className="absolute left-4 top-3 text-xs text-gray-500 font-mono transition-all pointer-events-none
                peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5
                peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-accentPurple
                peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-gray-400"
            >
              Full Name
            </label>
          </div>

          {/* Email field */}
          <div className="relative">
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full bg-[#0b0b14] border border-gray-800 focus:border-accentPurple text-white px-4 py-3 rounded-lg text-sm outline-none transition-all placeholder-transparent"
              id="email_signup"
              placeholder="Email"
              required
            />
            <label 
              htmlFor="email_signup"
              className="absolute left-4 top-3 text-xs text-gray-500 font-mono transition-all pointer-events-none
                peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5
                peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-accentPurple
                peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-gray-400"
            >
              Email
            </label>
          </div>

          {/* Password field */}
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full bg-[#0b0b14] border border-gray-800 focus:border-accentPurple text-white px-4 py-3 pr-10 rounded-lg text-sm outline-none transition-all placeholder-transparent"
              id="password_signup"
              placeholder="Password"
              required
            />
            <label 
              htmlFor="password_signup"
              className="absolute left-4 top-3 text-xs text-gray-500 font-mono transition-all pointer-events-none
                peer-placeholder-shown:text-sm peer-placeholder-shown:top-3.5
                peer-focus:top-1 peer-focus:text-[10px] peer-focus:text-accentPurple
                peer-[:not(:placeholder-shown)]:top-1 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-gray-400"
            >
              Password
            </label>
            <button 
              type="button" 
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-500 hover:text-gray-300"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 accent-accentPurple border-gray-800 rounded bg-[#0b0b14]"
            />
            <span className="text-[11px] text-gray-400 font-mono leading-tight">
              I agree to the <a href="http://localhost:5173/terms" className="text-accentTeal hover:underline">Terms & Conditions</a> and <a href="http://localhost:5173/privacy" className="text-accentTeal hover:underline">Privacy Policy</a>
            </span>
          </label>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-red-500 text-xs font-bold mb-1">Registration Error</h4>
                <p className="text-red-200 text-[10px] leading-relaxed break-words">{error}</p>
              </div>
            </div>
          )}

          <div className="p-4 rounded-xl bg-accentPurple/5 border border-accentPurple/20 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accentPurple/20 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4 text-accentPurple" />
            </div>
            <div>
              <h4 className="text-white text-xs font-bold mb-1">Security First</h4>
              <p className="text-gray-400 text-[10px] leading-relaxed">
                We use secure token based authentication to ensure your account remains safe.
              </p>
            </div>
          </div>

          {/* Create Account Button */}
          <button 
            type="submit" 
            disabled={!agree || loading}
            className={`w-full py-3 text-white rounded-lg font-mono text-sm tracking-wider font-bold transition duration-300 border border-accentPurple/40 ${
              (agree && !loading) ? 'bg-accentPurple hover:bg-accentPurple/90 shadow-glowPurple' : 'bg-gray-800 cursor-not-allowed opacity-50'
            }`}
          >
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        {/* Navigation bottom */}
        <div className="text-center mt-6">
          <p className="text-xs text-gray-500 font-mono">
            Already have an account?{' '}
            <button 
              type="button" 
              onClick={onGoToSignIn}
              className="text-accentPurple hover:underline font-bold"
            >
              Sign In
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
