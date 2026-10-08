import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
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

export default function VeraInteractiveLoginCard({ scrollProgress = 0, onScrollToSection }) {
  const navigate = useNavigate();
  const { login, loginWithGoogle, authNotice, clearAuthNotice } = useAuth();

  // Navigation mode: 'LOGIN' | 'GOOGLE_ACCOUNTS'
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
          const map = new Map();
          GOOGLE_ACCOUNTS_PRESETS.forEach((a) => map.set(a.email.toLowerCase(), a));
          parsed.forEach((a) => {
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
  const [, setSelectedGoogleAccount] = useState(null);

  // Input for adding user's actual Google account
  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newGoogleName, setNewGoogleName] = useState('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

  // Save real Google accounts to localStorage
  const saveAccountsToStorage = (accounts) => {
    setSavedGoogleAccounts(accounts);
    try {
      localStorage.setItem('vera_saved_google_accounts', JSON.stringify(accounts));
    } catch (err) {
      console.warn('Failed to save Google accounts to localStorage:', err);
    }
  };

  // Add an actual Google account and immediately log in
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
      accountType: 'Google Account',
      isScenic: false
    };

    // Prevent duplicates
    const filtered = savedGoogleAccounts.filter(a => a.email.toLowerCase() !== email);
    const updated = [newAcc, ...filtered];
    saveAccountsToStorage(updated);

    setNewGoogleEmail('');
    setNewGoogleName('');
    setShowAddAccountForm(false);
    setError(null);

    // Immediately select and log in directly
    handleSelectGoogleAccount(newAcc);
  };

  // Easing & scroll emergence
  const p = Math.max(0, Math.min(1, scrollProgress));
  let cardOpacity = 0;
  let cardTranslateY = 50;
  let cardScale = 0.94;

  if (mode !== 'LOGIN') {
    // When actively selecting an account, keep card 100% visible & interactive
    cardOpacity = 1;
    cardTranslateY = 0;
    cardScale = 1.0;
  } else if (p >= 0.50 && p < 0.68) {
    const normP = (p - 0.50) / 0.18;
    cardOpacity = normP;
    cardTranslateY = 40 * (1 - normP);
    cardScale = 0.94 + 0.06 * normP;
  } else if (p >= 0.68 && p <= 0.82) {
    cardOpacity = 1;
    cardTranslateY = 0;
    cardScale = 1.0;
  } else if (p > 0.82 && p < 0.92) {
    const fadeP = (p - 0.82) / 0.10;
    cardOpacity = Math.max(0, 1 - fadeP);
    cardTranslateY = -40 * fadeP;
    cardScale = 1.0 - 0.05 * fadeP;
  }

  // 1. Open Google Account Chooser
  const handleOpenGoogleAccounts = () => {
    setError(null);
    setSuccessNotice(null);
    setShowAddAccountForm(false);
    setMode('GOOGLE_ACCOUNTS');
  };

  // 2. User selects an account from suggestions -> Direct Login (NO 2-Step Verification)
  const handleSelectGoogleAccount = async (account) => {
    setSelectedGoogleAccount(account);
    setError(null);
    setLoading(true);

    try {
      await loginWithGoogle({
        email: account.email,
        name: account.name || account.email.split('@')[0]
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Google authentication failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // 3. Standard Credentials Submit -> Direct Login (NO 2-Step Verification)
  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    const email = formData.email.trim();
    if (!email || !formData.password) return;

    setLoading(true);
    try {
      await login(email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Invalid credentials. Please verify and try again.'));
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'LOGIN' && (p < 0.48 || cardOpacity <= 0.01)) {
    return null;
  }

  return (
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
        {/* VIEW 2: Google Account Chooser (Instant Sign In, No 2SV) */}
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

            {/* Google Accounts List matching screenshot */}
            {!showAddAccountForm && (
              <div className="space-y-0 divide-y divide-white/10 border-t border-b border-white/10 max-h-[300px] overflow-y-auto pr-0.5">
                {savedGoogleAccounts.map((acc) => (
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
                  </div>
                ))}

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
                  disabled={loading}
                  className="w-full py-2.5 rounded-xl bg-[#4285F4] hover:bg-[#3367D6] text-white text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
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
      </div>
    </div>
  );
}
