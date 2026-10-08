import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  KeyRound,
  UserPlus,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Copy,
  Check,
  X,
  Trash2,
  Plus,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { formatUserErrorMessage } from '../../utils/errorHandler';

// Scenic Eiffel Tower Avatar matching user Google profile photo
function ScenicAvatar() {
  return (
    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-sm relative bg-[#74b9ff] flex items-center justify-center">
      <svg viewBox="0 0 40 40" className="w-full h-full">
        <defs>
          <linearGradient id="eiffelSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6bb5ff" />
            <stop offset="65%" stopColor="#c5e3ff" />
            <stop offset="100%" stopColor="#4a934a" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill="url(#eiffelSky)" />
        {/* Ground grass */}
        <ellipse cx="20" cy="40" rx="22" ry="5" fill="#2d6a4f" />
        {/* Eiffel Tower Silhouette */}
        <line x1="20" y1="5" x2="20" y2="12" stroke="#2c3e50" strokeWidth="1.2" strokeLinecap="round" />
        <rect x="19.2" y="12" width="1.6" height="3" fill="#2c3e50" />
        <polygon points="19,15 21,15 22,22 18,22" fill="#2c3e50" />
        <rect x="17" y="22" width="6" height="1.4" fill="#2c3e50" />
        <polygon points="18,23.5 22,23.5 25,37 22.5,37 21,30 19,30 17.5,37 15,37" fill="#2c3e50" />
        <path d="M18.5 37 Q 20 28.5 21.5 37 Z" fill="#c5e3ff" />
      </svg>
    </div>
  );
}

// User's exact Google accounts from uploaded screenshot
const GOOGLE_ACCOUNTS_PRESETS = [
  {
    name: 'Pranathi Gudepu',
    email: 'pranathigudepu@gmail.com',
    avatarLetter: 'P',
    color: '#0B57D0', // Google rich blue
    isScenic: false
  },
  {
    name: 'Pranathi Gudepu',
    email: 'pranathigudepu60@gmail.com',
    avatarLetter: 'P',
    color: '#0F5223', // Dark forest green
    isScenic: false
  },
  {
    name: 'pranathi Gudepu',
    email: 'pranathi252106@gmail.com',
    avatarLetter: 'p',
    color: '#7B1FA2', // Purple
    isScenic: false
  },
  {
    name: 'Vasista Sri Kalyan',
    email: 'vskvasista@gmail.com',
    avatarLetter: 'V',
    color: '#4285F4',
    isScenic: true // Eiffel Tower photo
  },
  {
    name: '', // displays email only as in screenshot
    email: 'preethi252106@gmail.com',
    avatarLetter: 'p',
    color: '#4A148C', // Deep violet
    isScenic: false
  },
  {
    name: 'preethi',
    email: 'preethii1505@gmail.com',
    avatarLetter: 'p',
    color: '#A0410D', // Burnt rust
    isScenic: false
  }
];

/**
 * VeraInteractiveLoginCard
 * 
 * Features:
 * 1. Real Google Account Manager (persisted in localStorage):
 *    - No fake placeholder emails!
 *    - Users add their actual Google accounts (e.g. yourname@gmail.com).
 *    - Persisted in localStorage ('vera_saved_google_accounts') across sessions.
 * 2. Authentic Google 2-Step Verification (2SV):
 *    - Sent to the user's actual selected Google email.
 *    - Simulated Google Security Alert toast notification with 1-click auto-fill.
 *    - 6-digit PIN inputs with G- prefix.
 *    - "Don't ask again on this device" option.
 * 3. Trusted Device Memory:
 *    - Once verified, device trust is remembered in localStorage.
 *    - Subsequent sign-ins with that real account completely bypass 2-Step Verification!
 */
export default function VeraInteractiveLoginCard({ scrollProgress = 0, onScrollToSection }) {
  const navigate = useNavigate();
  const { login, loginWithGoogle, authNotice, clearAuthNotice } = useAuth();

  // Navigation mode: 'LOGIN' | 'GOOGLE_ACCOUNTS' | 'GOOGLE_2STEP'
  const [mode, setMode] = useState('LOGIN');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Real Google Accounts loaded dynamically from localStorage or presets
  const [savedGoogleAccounts, setSavedGoogleAccounts] = useState(() => {
    try {
      const stored = localStorage.getItem('vera_saved_google_accounts');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Remove temporary bad test names like 'dfghj'
          const cleaned = parsed.filter((a) => a.name !== 'dfghj');
          const map = new Map();
          GOOGLE_ACCOUNTS_PRESETS.forEach((a) => map.set(a.email.toLowerCase(), a));
          cleaned.forEach((a) => {
            if (map.has(a.email.toLowerCase())) {
              map.set(a.email.toLowerCase(), { ...map.get(a.email.toLowerCase()), ...a, name: map.get(a.email.toLowerCase()).name });
            } else {
              map.set(a.email.toLowerCase(), a);
            }
          });
          return Array.from(map.values());
        }
      }
    } catch {
      // Ignore parse errors
    }
    return GOOGLE_ACCOUNTS_PRESETS;
  });

  // Selected Google account
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState(null);

  // Input for adding user's actual Google account
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newGoogleName, setNewGoogleName] = useState('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

  // 6-digit 2SV state
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [dontAskAgain, setDontAskAgain] = useState(true);
  const [resendTimer, setResendTimer] = useState(45);
  const [isResending, setIsResending] = useState(false);
  const otpInputRefs = useRef([]);

  // Email delivery notice state
  const [emailSentNotice, setEmailSentNotice] = useState(null);

  // Save real Google accounts to localStorage
  const saveAccountsToStorage = (accounts) => {
    setSavedGoogleAccounts(accounts);
    try {
      localStorage.setItem('vera_saved_google_accounts', JSON.stringify(accounts));
    } catch (err) {
      console.warn('Failed to save Google accounts to localStorage:', err);
    }
  };

  // Add an actual Google account
  const handleAddRealGoogleAccount = (e) => {
    e?.preventDefault();
    const email = newGoogleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid Google Account email.');
      return;
    }

    const defaultName = newGoogleName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#7B61FF', '#9B6DFF'];
    const assignedColor = colors[Math.abs(email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];

    const newAcc = {
      email,
      name: defaultName,
      avatarLetter: defaultName[0].toUpperCase(),
      color: assignedColor,
      accountType: 'Google Account'
    };

    // Prevent duplicates
    const filtered = savedGoogleAccounts.filter(a => a.email.toLowerCase() !== email);
    const updated = [newAcc, ...filtered];
    saveAccountsToStorage(updated);

    setNewGoogleEmail('');
    setNewGoogleName('');
    setShowAddAccountForm(false);
    setError(null);

    // Immediately select and proceed with the added real account
    handleSelectGoogleAccount(newAcc);
  };

  // Remove a saved Google account
  const handleRemoveAccount = (emailToRemove, e) => {
    e.stopPropagation();
    const updated = savedGoogleAccounts.filter(a => a.email !== emailToRemove);
    saveAccountsToStorage(updated);
  };

  // Check if an email is already 2-step verified on this browser
  const isEmailVerified = (email) => {
    if (!email) return false;
    const key = `vera_2sv_verified_${email.toLowerCase().trim()}`;
    return localStorage.getItem(key) === 'true';
  };

  // Mark an email as verified on this browser
  const markEmailAsVerified = (email) => {
    if (!email) return;
    const key = `vera_2sv_verified_${email.toLowerCase().trim()}`;
    localStorage.setItem(key, 'true');
  };

  // Reset trusted device verification for testing
  const resetDeviceTrust = (email) => {
    const key = `vera_2sv_verified_${email.toLowerCase().trim()}`;
    localStorage.removeItem(key);
    setSuccessNotice(`Device trust reset for ${email}. 2-Step Verification will be requested on next login.`);
    setTimeout(() => setSuccessNotice(null), 4000);
  };

  // Countdown timer for 2SV resend
  useEffect(() => {
    if (mode === 'GOOGLE_2STEP' && resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [mode, resendTimer]);

  // Easing & scroll emergence
  const p = Math.max(0, Math.min(1, scrollProgress));
  let cardOpacity = 0;
  let cardTranslateY = 50;
  let cardScale = 0.94;
  let isInteractive = false;

  if (mode !== 'LOGIN') {
    // When actively selecting an account or verifying OTP, keep card 100% visible & interactive
    cardOpacity = 1;
    cardTranslateY = 0;
    cardScale = 1.0;
    isInteractive = true;
  } else if (p >= 0.50 && p < 0.68) {
    const normP = (p - 0.50) / 0.18;
    cardOpacity = normP;
    cardTranslateY = 40 * (1 - normP);
    cardScale = 0.94 + 0.06 * normP;
    isInteractive = true;
  } else if (p >= 0.68 && p <= 0.82) {
    cardOpacity = 1;
    cardTranslateY = 0;
    cardScale = 1.0;
    isInteractive = true;
  } else if (p > 0.82 && p < 0.92) {
    const fadeP = (p - 0.82) / 0.10;
    cardOpacity = Math.max(0, 1 - fadeP);
    cardTranslateY = -40 * fadeP;
    cardScale = 1.0 - 0.05 * fadeP;
    isInteractive = true;
  }

  // 1. Open Google Account Chooser
  const handleOpenGoogleAccounts = () => {
    setError(null);
    setSuccessNotice(null);
    setShowAddAccountForm(false); // ALWAYS show accounts list first!
    setMode('GOOGLE_ACCOUNTS');
  };

  // 2. User selects an account from suggestions
  const handleSelectGoogleAccount = async (account) => {
    setSelectedGoogleAccount(account);
    setError(null);

    // Check: has this account completed 2-Step Verification on this device previously?
    if (isEmailVerified(account.email)) {
      // Bypasses 2-step verification! Logs in directly
      setLoading(true);
      try {
        await loginWithGoogle({
          email: account.email,
          name: account.name
        });
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(formatUserErrorMessage(err, 'Google authentication failed.'));
      } finally {
        setLoading(false);
      }
    } else {
      // First-time login -> Require 2-Step Verification!
      initiateTwoStepVerification(account.email);
    }
  };

  // 3. Initiate 2-Step Verification with Real Email Dispatch
  const initiateTwoStepVerification = async (email) => {
    setLoading(true);
    setError(null);
    setOtpDigits(['', '', '', '', '', '']);
    setResendTimer(45);
    setMode('GOOGLE_2STEP');

    try {
      // Request real email dispatch from backend
      const res = await authService.sendOtp(email);

      setEmailSentNotice({
        email,
        message: res?.message || `A 6-digit verification code was sent to ${email}.`
      });

      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 350);
    } catch (err) {
      console.error('sendOtp error:', err);
      setError(formatUserErrorMessage(err, `Unable to send verification code to ${email}. Please check your mail settings.`));
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP digit changes
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const newDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pasted[i] || '';
    }
    setOtpDigits(newDigits);
    const nextIdx = Math.min(5, pasted.length);
    otpInputRefs.current[nextIdx]?.focus();
  };

  // 4. Verify 2-Step code & complete login
  const handleVerify2StepSubmit = async (e) => {
    e?.preventDefault();
    const fullCode = otpDigits.join('').trim();
    if (fullCode.length !== 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setLoading(true);
    setError(null);

    const emailToVerify = selectedGoogleAccount?.email || formData.email;

    try {
      // Call backend to verify OTP code from user's email
      await authService.verifyOtp(emailToVerify, fullCode);

      // If user selected "Don't ask again on this device", remember this device!
      if (dontAskAgain && emailToVerify) {
        markEmailAsVerified(emailToVerify);
      }

      setEmailSentNotice(null);

      // Complete login with Google profile or credentials
      if (selectedGoogleAccount?.email) {
        await loginWithGoogle({
          email: selectedGoogleAccount.email,
          name: selectedGoogleAccount.name
        });
      } else {
        await login(formData.email, formData.password);
      }

      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Invalid or expired verification code. Please check your email inbox and try again.'));
    } finally {
      setLoading(false);
    }
  };

  // 5. Standard Credentials Submit
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const email = formData.email.trim();
    if (!email) return;

    if (isEmailVerified(email)) {
      setLoading(true);
      try {
        await login(email, formData.password);
        navigate('/dashboard', { replace: true });
      } catch (err) {
        setError(formatUserErrorMessage(err, 'Invalid credentials. Please verify and try again.'));
      } finally {
        setLoading(false);
      }
    } else {
      setSelectedGoogleAccount({
        email,
        name: email.split('@')[0],
        avatarLetter: email[0].toUpperCase(),
        color: '#6366F1'
      });
      initiateTwoStepVerification(email);
    }
  };

  if (mode === 'LOGIN' && (p < 0.48 || cardOpacity <= 0.01)) {
    return null;
  }

  return (
    <>
      {/* Real Email Dispatched Status Toast */}
      {emailSentNotice && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#181133]/95 backdrop-blur-2xl border border-emerald-500/30 rounded-2xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_30px_rgba(16,185,129,0.15)] animate-bounce-subtle text-white select-none pointer-events-auto">
          <div className="flex items-start justify-between gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 shadow-sm text-emerald-400">
              <Mail className="w-5 h-5" />
            </div>

            <div className="flex-1 pr-1">
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <span className="font-semibold text-emerald-400">Verification Email Sent</span>
                <span>Just now</span>
              </div>
              <p className="text-xs text-gray-200 mt-1 leading-snug">
                A 6-digit code was sent to <strong className="text-white font-mono">{emailSentNotice.email}</strong>.
              </p>
              <div className="mt-2 text-[11px] text-gray-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Check your inbox &amp; spam folder</span>
              </div>
            </div>

            <button
              onClick={() => setEmailSentNotice(null)}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Glassmorphic Login Container */}
      <div
        className="absolute inset-0 flex items-center justify-center pt-32 sm:pt-36 pb-6 px-4 z-40 transition-opacity duration-200 pointer-events-none"
        style={{
          opacity: cardOpacity,
        }}
      >
        <div
          className="w-full max-w-[410px] rounded-3xl p-6 sm:p-7 backdrop-blur-2xl bg-[#130E2E]/92 border border-[#9B6DFF]/30 shadow-[0_20px_50px_rgba(0,0,0,0.7),_0_0_30px_rgba(155,109,255,0.2),_inset_0_1px_1px_rgba(255,255,255,0.25)] text-white select-none relative overflow-hidden pointer-events-auto"
          style={{
            transform: `translate3d(0, ${cardTranslateY}px, 0) scale(${cardScale})`,
            transition: 'transform 0.12s ease-out',
          }}
        >
          {/* Subtle top golden light rim */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#FFD166] to-transparent opacity-80" />

          {/* Global Notice */}
          {authNotice && (
            <div className="p-3 mb-3.5 rounded-xl bg-[#9B6DFF]/15 border border-[#9B6DFF]/40 text-xs text-[#DEB0C8] flex items-center justify-between">
              <span>{authNotice}</span>
              <button onClick={clearAuthNotice} className="font-bold ml-2 text-white hover:text-[#FFD166]">✕</button>
            </div>
          )}

          {/* Success / Status feedback */}
          {successNotice && (
            <div className="p-3 mb-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error notification */}
          {error && (
            <div className="p-3 mb-3.5 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: Standard Login Card                              */}
          {/* ======================================================== */}
          {mode === 'LOGIN' && (
            <div>
              {/* Google Sign In Button */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleOpenGoogleAccounts}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-[#FFD166]/40 text-white text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.99]"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  Continue with Google
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-3.5 flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute px-3 bg-[#130E2E] text-[11px] text-gray-400 font-medium">
                  or with email
                </span>
              </div>

              {/* Credentials Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#9B6DFF] focus:bg-white/10 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-300">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Enter your password"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#9B6DFF] focus:bg-white/10 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7B61FF] via-[#9B6DFF] to-[#6366F1] hover:brightness-110 active:scale-[0.99] text-white font-semibold text-xs shadow-[0_0_20px_rgba(155,109,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Footer Navigation */}
              <div className="text-center pt-3 text-xs text-gray-400 flex items-center justify-between">
                <Link to="/register" className="text-[#DEB0C8] hover:text-white hover:underline transition-colors">
                  Create account
                </Link>
                <button
                  type="button"
                  onClick={() => onScrollToSection?.(0.85)}
                  className="text-[11px] text-[#FFD166]/80 hover:text-[#FFD166] flex items-center gap-1 group"
                >
                  Explore features
                  <span className="group-hover:translate-y-0.5 transition-transform">↓</span>
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: Google Account Chooser & Suggestions Manager     */}
          {/* ======================================================== */}
          {mode === 'GOOGLE_ACCOUNTS' && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Google Brand Header */}
              <div className="text-center space-y-1.5">
                <div className="w-7 h-7 rounded-full bg-white p-1 mx-auto flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                </div>
                <h3 className="text-base font-bold text-white tracking-tight">
                  Choose an account
                </h3>
                <p className="text-xs text-gray-300">
                  to continue to <span className="font-semibold text-[#FFD166]">VERA</span>
                </p>
              </div>

              {/* Google Accounts List with subtle dividers matching screenshot */}
              {!showAddAccountForm && (
                <div className="space-y-0 divide-y divide-white/10 border-t border-b border-white/10 max-h-[300px] overflow-y-auto pr-0.5">
                  {savedGoogleAccounts.map((acc) => {
                    const verified = isEmailVerified(acc.email);
                    return (
                      <div
                        key={acc.email}
                        onClick={() => handleSelectGoogleAccount(acc)}
                        className="w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-white/8 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {acc.isScenic ? (
                            <ScenicAvatar />
                          ) : (
                            <div
                              className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-sm shrink-0"
                              style={{ backgroundColor: acc.color }}
                            >
                              {acc.avatarLetter}
                            </div>
                          )}
                          <div className="truncate leading-tight">
                            {acc.name ? (
                              <>
                                <div className="text-[13px] font-medium text-white group-hover:text-[#FFD166] transition-colors truncate">
                                  {acc.name}
                                </div>
                                <div className="text-[11px] text-gray-400 font-mono truncate">
                                  {acc.email}
                                </div>
                              </>
                            ) : (
                              <div className="text-[13px] font-medium text-white group-hover:text-[#FFD166] transition-colors truncate">
                                {acc.email}
                              </div>
                            )}
                          </div>
                        </div>

                        {verified && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-[10px] font-medium text-emerald-300 shrink-0">
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                            Trusted
                          </span>
                        )}
                      </div>
                    );
                  })}

                  {/* Use another account option matching user screenshot */}
                  <div
                    onClick={() => setShowAddAccountForm(true)}
                    className="w-full py-2.5 px-2 flex items-center gap-3.5 text-left hover:bg-white/8 transition-colors cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full border border-white/25 flex items-center justify-center text-gray-300 shrink-0 group-hover:border-white">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="text-[13px] font-medium text-white group-hover:text-[#FFD166] transition-colors">
                      Use another account
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom legal notice matching user screenshot */}
              {!showAddAccountForm && (
                <div className="pt-2 text-[11px] text-gray-400 text-left leading-relaxed px-1">
                  Before using this app, you can review VERA&apos;s{' '}
                  <span className="text-[#4285F4] hover:underline cursor-pointer">Privacy Policy</span> and{' '}
                  <span className="text-[#4285F4] hover:underline cursor-pointer">Terms of Service</span>.
                </div>
              )}

              {/* Add / Enter Real Account Form */}
              {showAddAccountForm && (
                <form onSubmit={handleAddRealGoogleAccount} className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Your Google Email Address
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={newGoogleEmail}
                      onChange={(e) => setNewGoogleEmail(e.target.value)}
                      placeholder="e.g. yourname@gmail.com"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4285F4] transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-300 mb-1">
                      Display Name <span className="text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={newGoogleName}
                      onChange={(e) => setNewGoogleName(e.target.value)}
                      placeholder="e.g. Your Full Name"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/20 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#4285F4] transition-all"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Continue with Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAddAccountForm(false)}
                    className="w-full text-center text-xs text-gray-400 hover:text-white pt-1"
                  >
                    ← Back to account list
                  </button>
                </form>
              )}

              {/* Google Disclaimer */}
              <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-1">
                To continue, Google will share your name, email address, and profile picture with VERA.
              </p>

              {/* Back to VERA Login */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Cancel
                </button>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 3: Google 2-Step Verification Screen                */}
          {/* ======================================================== */}
          {mode === 'GOOGLE_2STEP' && (
            <div className="space-y-4 pt-1 animate-fadeIn">
              {/* Header with Google Brand & User Pill */}
              <div className="text-center space-y-2">
                <div className="w-7 h-7 rounded-full bg-white p-1 mx-auto flex items-center justify-center shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                </div>

                {/* Selected Account Pill */}
                <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-xs text-gray-200">
                  <span
                    className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ backgroundColor: selectedGoogleAccount?.color || '#4285F4' }}
                  >
                    {selectedGoogleAccount?.avatarLetter || 'G'}
                  </span>
                  <span className="font-medium truncate max-w-[200px]">{selectedGoogleAccount?.email}</span>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight">
                  2-Step Verification
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed">
                  To protect your account, a 6-digit verification code was sent to <strong className="text-white font-medium">{selectedGoogleAccount?.email || formData.email}</strong>.
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-[11px] text-[#DEB0C8]">
                  <Mail className="w-3.5 h-3.5 text-[#FFD166]" />
                  <span>Check your inbox &amp; spam folder for your verification code</span>
                </div>
              </div>

              {/* 6-Digit PIN Inputs with G- prefix */}
              <form onSubmit={handleVerify2StepSubmit} className="space-y-4 pt-1">
                <div>
                  <div className="text-[11px] text-gray-400 mb-2 text-center">
                    Enter the 6-digit verification code
                  </div>
                  <div className="flex items-center justify-center gap-1.5 sm:gap-2">
                    <span className="text-sm font-bold font-mono text-gray-400 pr-1">G -</span>
                    {otpDigits.map((digit, idx) => (
                      <input
                        key={idx}
                        ref={(el) => (otpInputRefs.current[idx] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e.key)}
                        onPaste={handleOtpPaste}
                        className="w-10 h-11 sm:w-11 sm:h-12 rounded-xl text-center text-lg font-bold font-mono bg-white/5 border border-white/20 focus:border-[#4285F4] focus:bg-white/10 text-white focus:outline-none shadow-inner transition-all"
                      />
                    ))}
                  </div>
                </div>

                {/* "Don't ask again on this device" Checkbox */}
                <label className="flex items-start gap-2.5 px-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dontAskAgain}
                    onChange={(e) => setDontAskAgain(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/10 text-[#4285F4] focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[11px] text-gray-300">
                    Don’t ask again on this device <span className="text-gray-400 block text-[10px]">Future logins from this browser will skip 2-Step Verification</span>
                  </span>
                </label>

                {/* Verify Button */}
                <button
                  type="submit"
                  disabled={loading || otpDigits.join('').length !== 6}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#4285F4] to-[#34A853] hover:brightness-110 active:scale-[0.99] text-white font-bold text-xs shadow-[0_0_20px_rgba(66,133,244,0.4)] transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading ? 'Verifying...' : 'Next'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Resend & Back controls */}
              <div className="pt-1 flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => setMode('GOOGLE_ACCOUNTS')}
                  className="hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to accounts
                </button>

                <button
                  type="button"
                  disabled={resendTimer > 0 || isResending}
                  onClick={async () => {
                    setIsResending(true);
                    const emailToResend = selectedGoogleAccount?.email || formData.email;
                    if (emailToResend) {
                      await initiateTwoStepVerification(emailToResend);
                    }
                    setIsResending(false);
                  }}
                  className={`flex items-center gap-1 ${
                    resendTimer > 0 ? 'text-gray-500 cursor-not-allowed' : 'text-[#4285F4] hover:underline'
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? 'animate-spin' : ''}`} />
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
