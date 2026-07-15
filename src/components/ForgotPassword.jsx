import React, { useState } from 'react';
import { ArrowLeft, Lock, Mail, Shield, Check, Eye, EyeOff, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FeaturesFooter from './FeaturesFooter';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';

export default function ForgotPassword({ onGoToSignIn }) {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async () => {
    setError(null);
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setStep(4);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  };
  
  const handleOtpChange = (index, value) => {
    if (value.length > 1) value = value.slice(0, 1);
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // Auto-focus next logic could be added here in a real app
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  return (
    <div className="relative w-full min-h-screen flex flex-col items-center justify-center gap-6 bg-[#09090E] p-6 cyber-grid overflow-y-auto pt-12 md:pt-6">
      {/* Radial glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#5D33F8]/10 rounded-full blur-[140px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#0B0F19]/80 backdrop-blur-3xl border border-white/10 rounded-2xl p-8 shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative z-10 min-h-[480px] flex flex-col"
      >
        {/* Decorative corner borders */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-white/20 rounded-tl-2xl" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-white/20 rounded-tr-2xl" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-white/20 rounded-bl-2xl" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-white/20 rounded-br-2xl" />

        {/* Back Button (except Step 4) */}
        {step < 4 && (
          <button 
            onClick={step === 1 ? onGoToSignIn : prevStep}
            className="absolute top-6 left-6 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: EMAIL */}
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col flex-1 mt-6"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full border border-[#5D33F8]/50 bg-[#5D33F8]/10 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-[#5D33F8]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Forgot Password?</h2>
                <p className="text-sm text-gray-400">
                  No worries! Enter your email address and we'll send you a link to reset your password.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">Email</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input 
                      type="email" 
                      placeholder="Enter your email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#0b0b14] border border-gray-800 focus:border-[#5D33F8] text-white pl-10 pr-4 py-3 rounded-lg text-sm outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#5D33F8]/5 border border-[#5D33F8]/20 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#5D33F8]/20 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-[#5D33F8]" />
                  </div>
                  <div>
                    <h4 className="text-white text-xs font-bold mb-1">Security First</h4>
                    <p className="text-gray-400 text-[10px] leading-relaxed">
                      We use secure token based authentication to ensure your account remains safe.
                    </p>
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center shrink-0">
                      <ShieldAlert className="w-4 h-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-red-500 text-xs font-bold mb-1">Reset Error</h4>
                      <p className="text-red-200 text-[10px] leading-relaxed break-words">{error}</p>
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleSendResetEmail}
                  disabled={loading}
                  className={`w-full py-3 bg-[#5D33F8] hover:bg-[#5D33F8]/90 text-white rounded-lg text-sm font-semibold transition duration-300 shadow-[0_0_15px_rgba(93,51,248,0.4)] border border-[#5D33F8]/40 ${
                    loading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>

              <div className="text-center mt-6">
                <p className="text-xs text-gray-400">
                  Remember your password?{' '}
                  <button onClick={onGoToSignIn} className="text-[#5D33F8] hover:underline font-semibold">
                    Sign In
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* STEP 2: OTP */}
          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col flex-1 mt-6"
            >
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-16 h-16 rounded-full border border-[#5D33F8]/50 bg-[#5D33F8]/10 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-[#5D33F8]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Verify Your Email</h2>
                <p className="text-sm text-gray-400">
                  We've sent a 6-digit code to <span className="text-[#5D33F8]">{email || 'your email'}</span>.<br/>Enter the code below to continue.
                </p>
              </div>

              <div className="space-y-6 flex-1">
                <div className="flex justify-between gap-2">
                  {otp.map((digit, i) => (
                    <input 
                      key={i}
                      type="text" 
                      maxLength="1"
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      className="w-12 h-14 text-center bg-[#0b0b14] border border-gray-800 focus:border-[#5D33F8] text-white rounded-lg text-lg outline-none transition-all"
                    />
                  ))}
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-400">
                    Didn't receive the code? <button className="text-[#5D33F8] hover:underline">Resend</button> in 00:45
                  </p>
                </div>

                <button 
                  onClick={nextStep}
                  className="w-full py-3 bg-[#5D33F8] hover:bg-[#5D33F8]/90 text-white rounded-lg text-sm font-semibold transition duration-300 shadow-[0_0_15px_rgba(93,51,248,0.4)] border border-[#5D33F8]/40"
                >
                  Verify Code
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: RESET */}
          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex flex-col flex-1 mt-6"
            >
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-16 h-16 rounded-full border border-[#5D33F8]/50 bg-[#5D33F8]/10 flex items-center justify-center mb-4">
                  <Lock className="w-7 h-7 text-[#5D33F8]" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Reset Password</h2>
                <p className="text-sm text-gray-400">Create a new password for your account.</p>
              </div>

              <div className="space-y-5 flex-1">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">New Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      className="w-full bg-[#0b0b14] border border-gray-800 focus:border-[#5D33F8] text-white pl-10 pr-10 py-3 rounded-lg text-sm outline-none transition-all"
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Checklist */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#5D33F8] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs text-gray-300">At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#5D33F8] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs text-gray-300">Include a number or symbol</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3.5 h-3.5 rounded-full bg-[#5D33F8] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                    <span className="text-xs text-gray-300">Include uppercase & lowercase</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input 
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm new password"
                      className="w-full bg-[#0b0b14] border border-gray-800 focus:border-[#5D33F8] text-white pl-10 pr-10 py-3 rounded-lg text-sm outline-none transition-all"
                    />
                    <button 
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button 
                  onClick={nextStep}
                  className="w-full py-3 bg-[#5D33F8] hover:bg-[#5D33F8]/90 text-white rounded-lg text-sm font-semibold transition duration-300 shadow-[0_0_15px_rgba(93,51,248,0.4)] border border-[#5D33F8]/40"
                >
                  Reset Password
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: SUCCESS */}
          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col flex-1 items-center justify-center mt-6 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-[#5D33F8]/20 flex items-center justify-center mb-6">
                <div className="w-14 h-14 rounded-full bg-[#5D33F8] flex items-center justify-center shadow-[0_0_15px_rgba(93,51,248,0.4)]">
                  <Check className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h2 className="text-xl font-bold text-white mb-3">Reset Email Sent!</h2>
              <p className="text-sm text-gray-400 mb-8 max-w-[280px]">
                A password reset email has been sent to your email. Please check your inbox.
              </p>

              <button 
                onClick={onGoToSignIn}
                className="w-full py-3 bg-[#5D33F8] hover:bg-[#5D33F8]/90 text-white rounded-lg text-sm font-semibold transition duration-300 shadow-[0_0_15px_rgba(93,51,248,0.4)] border border-[#5D33F8]/40"
              >
                Go to Sign In
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {step >= 2 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full overflow-hidden"
            >
              <FeaturesFooter />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
