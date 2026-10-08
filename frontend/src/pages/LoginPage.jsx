import React, { useState, useEffect } from 'react';
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
import { useAuth } from '../context/AuthContext';
import { formatUserErrorMessage } from '../utils/errorHandler';
import VeraParticleEngine from '../components/intro/VeraParticleEngine';

// Scenic Eiffel Tower Avatar matching user's Google profile photo
function ScenicAvatar() {
  return (
    <div
      className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-white/20 shadow-sm relative bg-[#74b9ff] flex items-center justify-center"
      style={{ width: '32px', height: '32px', minWidth: '32px', minHeight: '32px' }}
    >
      <svg viewBox="0 0 40 40" style={{ width: '32px', height: '32px' }}>
        <defs>
          <linearGradient id="eiffelSky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6bb5ff" />
            <stop offset="65%" stopColor="#c5e3ff" />
            <stop offset="100%" stopColor="#4a934a" />
          </linearGradient>
        </defs>
        <rect width="40" height="40" fill="url(#eiffelSky)" />
        <ellipse cx="20" cy="40" rx="22" ry="5" fill="#2d6a4f" />
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
    color: '#0B57D0',
    isScenic: false
  },
  {
    name: 'Pranathi Gudepu',
    email: 'pranathigudepu60@gmail.com',
    avatarLetter: 'P',
    color: '#0F5223',
    isScenic: false
  },
  {
    name: 'pranathi Gudepu',
    email: 'pranathi252106@gmail.com',
    avatarLetter: 'p',
    color: '#7B1FA2',
    isScenic: false
  },
  {
    name: 'Vasista Sri Kalyan',
    email: 'vskvasista@gmail.com',
    avatarLetter: 'V',
    color: '#4285F4',
    isScenic: true
  },
  {
    name: '',
    email: 'preethi252106@gmail.com',
    avatarLetter: 'p',
    color: '#4A148C',
    isScenic: false
  },
  {
    name: 'preethi',
    email: 'preethii1505@gmail.com',
    avatarLetter: 'p',
    color: '#A0410D',
    isScenic: false
  }
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginWithGoogle, isAuthenticated, authNotice, clearAuthNotice } = useAuth();

  // Navigation mode: 'LOGIN' | 'GOOGLE_ACCOUNTS'
  const [mode, setMode] = useState('LOGIN');

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successNotice, setSuccessNotice] = useState(null);

  // Real Google Accounts list
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
              map.set(a.email.toLowerCase(), { ...map.get(a.email.toLowerCase()), ...a });
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

  const [newGoogleEmail, setNewGoogleEmail] = useState('');
  const [newGoogleName, setNewGoogleName] = useState('');
  const [showAddAccountForm, setShowAddAccountForm] = useState(false);

  // Background dark aesthetic enforcement
  useEffect(() => {
    const origBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = '#0E0B20';
    return () => {
      document.body.style.backgroundColor = origBg;
    };
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  // Open Google accounts chooser
  const handleOpenGoogleAccounts = () => {
    setError(null);
    setSuccessNotice(null);
    setShowAddAccountForm(false);
    setMode('GOOGLE_ACCOUNTS');
  };

  // Direct login with selected Google account (NO 2-step verification)
  const handleSelectGoogleAccount = async (account) => {
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

  // Add custom Google account and login immediately (NO 2-step verification)
  const handleAddRealGoogleAccount = (e) => {
    e?.preventDefault();
    const email = newGoogleEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Please enter a valid Google Account email.');
      return;
    }

    const defaultName = newGoogleName.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
    const colors = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#7B61FF', '#9B6DFF'];
    const assignedColor = colors[Math.abs(email.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];

    const newAcc = {
      email,
      name: defaultName,
      avatarLetter: defaultName[0].toUpperCase(),
      color: assignedColor,
      isScenic: false
    };

    const filtered = savedGoogleAccounts.filter((a) => a.email.toLowerCase() !== email);
    const updated = [newAcc, ...filtered];
    setSavedGoogleAccounts(updated);
    try {
      localStorage.setItem('vera_saved_google_accounts', JSON.stringify(updated));
    } catch (err) {
      console.warn('Failed to store account:', err);
    }

    setNewGoogleEmail('');
    setNewGoogleName('');
    setShowAddAccountForm(false);
    setError(null);

    // Immediately log in
    handleSelectGoogleAccount(newAcc);
  };

  // Standard Email & Password Submit (NO 2-step verification)
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
      setError(formatUserErrorMessage(err, 'Invalid email or password. Please verify and try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#0E0B20] text-white flex items-center justify-center p-4 sm:p-6 relative overflow-x-hidden">
      {/* Living Celestial Canvas in Background (Normal condition: non-intrusive) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <VeraParticleEngine scrollProgress={0} />
      </div>

      {/* Atmospheric Ambient Glow Orbs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#7B61FF]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-[#FFD166]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Authentication Card */}
      <div className="relative z-10 w-full max-w-[420px] my-auto" style={{ maxWidth: '420px' }}>
        <div className="rounded-3xl p-7 sm:p-8 backdrop-blur-2xl bg-[#130E2E]/95 border border-[#9B6DFF]/30 shadow-[0_20px_50px_rgba(0,0,0,0.7),_0_0_30px_rgba(155,109,255,0.25),_inset_0_1px_1px_rgba(255,255,255,0.2)] text-white relative overflow-hidden">
          {/* Subtle Top Golden Accent Rim */}
          <div className="absolute top-0 left-1/4 right-1/4 h-[1px] bg-gradient-to-r from-transparent via-[#FFD166] to-transparent opacity-80" />

          {/* VERA Brand Identity Header */}
          <div className="text-center space-y-2 mb-6">
            <div className="inline-flex items-center justify-center gap-2.5 mb-1">
              <div
                className="w-10 h-10 rounded-2xl bg-white/10 border border-[#9B6DFF]/40 p-1 flex items-center justify-center shadow-[0_0_20px_rgba(155,109,255,0.4)] overflow-hidden shrink-0"
                style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
              >
                <img
                  src="/vera-logo-icon.png"
                  alt="VERA"
                  className="object-contain"
                  style={{ width: '32px', height: '32px', maxWidth: '32px', maxHeight: '32px' }}
                />
              </div>
              <span className="text-2xl font-black tracking-wider bg-gradient-to-r from-white via-[#DEB0C8] to-[#FFD166] bg-clip-text text-transparent">
                VERA
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Welcome back</h1>
            <p className="text-xs text-gray-300">Start making smarter decisions today.</p>
          </div>

          {/* Global / Session Notices */}
          {authNotice && (
            <div className="p-3 mb-4 rounded-xl bg-[#9B6DFF]/15 border border-[#9B6DFF]/40 text-xs text-[#DEB0C8] flex items-center justify-between">
              <span>{authNotice}</span>
              <button onClick={clearAuthNotice} className="font-bold ml-2 text-white hover:text-[#FFD166]">✕</button>
            </div>
          )}

          {/* Success / Status Notices */}
          {successNotice && (
            <div className="p-3 mb-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs text-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="p-3 mb-4 rounded-xl bg-red-950/60 border border-red-500/40 text-xs text-red-200 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 1: Standard Login Form                              */}
          {/* ======================================================== */}
          {mode === 'LOGIN' && (
            <div className="space-y-4">
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleOpenGoogleAccounts}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 hover:border-[#FFD166]/40 text-white text-xs font-semibold shadow-sm transition-all duration-200 active:scale-[0.99]"
                style={{ minHeight: '42px' }}
              >
                <svg
                  style={{ width: '18px', height: '18px', minWidth: '18px', minHeight: '18px' }}
                  viewBox="0 0 24 24"
                >
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div className="relative my-3 flex items-center justify-center">
                <div className="w-full border-t border-white/10" />
                <span className="absolute px-3 bg-[#130E2E] text-[11px] text-gray-400 font-medium">
                  or with email
                </span>
              </div>

              {/* Email & Password Form */}
              <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ width: '16px', height: '16px' }} />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl bg-white/5 border border-white/15 focus:border-[#9B6DFF] focus:bg-white/10 text-xs text-white placeholder-gray-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-300">
                      Password
                    </label>
                    <span className="text-[11px] text-[#DEB0C8] hover:text-[#FFD166] cursor-pointer">
                      Forgot password?
                    </span>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" style={{ width: '16px', height: '16px' }} />
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
                      {showPassword ? <EyeOff className="w-4 h-4" style={{ width: '16px', height: '16px' }} /> : <Eye className="w-4 h-4" style={{ width: '16px', height: '16px' }} />}
                    </button>
                  </div>
                </div>

                {/* Remember Me Option */}
                <div className="flex items-center gap-2 pt-0.5">
                  <input
                    id="remember-me-checkbox"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-white/10 border-white/20 text-[#7B61FF] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="remember-me-checkbox" className="text-xs text-gray-400 cursor-pointer">
                    Remember me on this device
                  </label>
                </div>

                {/* Sign In Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7B61FF] via-[#9B6DFF] to-[#6366F1] hover:brightness-110 active:scale-[0.99] text-white font-semibold text-xs shadow-[0_0_20px_rgba(155,109,255,0.4)] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ minHeight: '44px' }}
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" style={{ width: '16px', height: '16px' }} />
                </button>
              </form>

              {/* Footer Links: Create Account */}
              <div className="text-center pt-3 text-xs text-gray-400 border-t border-white/10 mt-4">
                Don&apos;t have an account?{' '}
                <Link to="/register" className="text-[#FFD166] hover:text-white font-semibold hover:underline transition-colors ml-1">
                  Create account
                </Link>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* VIEW 2: Google Account Chooser (Instant Sign In, No 2SV) */}
          {/* ======================================================== */}
          {mode === 'GOOGLE_ACCOUNTS' && (
            <div className="space-y-4 pt-1">
              {/* Google Brand Header */}
              <div className="text-center space-y-1.5">
                <div
                  className="w-7 h-7 rounded-full bg-white p-1 mx-auto flex items-center justify-center shadow-sm"
                  style={{ width: '28px', height: '28px' }}
                >
                  <svg
                    style={{ width: '20px', height: '20px', minWidth: '20px' }}
                    viewBox="0 0 24 24"
                  >
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

              {/* Google Accounts Suggestions List */}
              {!showAddAccountForm && (
                <div className="space-y-0 divide-y divide-white/10 border-t border-b border-white/10 max-h-[290px] overflow-y-auto pr-0.5">
                  {savedGoogleAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onClick={() => handleSelectGoogleAccount(acc)}
                      className="w-full py-2.5 px-2 flex items-center justify-between text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {acc.isScenic ? (
                          <ScenicAvatar />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold text-white shadow-sm shrink-0"
                            style={{ backgroundColor: acc.color, width: '32px', height: '32px', minWidth: '32px' }}
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

                  {/* Use another account option */}
                  <div
                    onClick={() => setShowAddAccountForm(true)}
                    className="w-full py-2.5 px-2 flex items-center gap-3.5 text-left hover:bg-white/10 rounded-lg transition-colors cursor-pointer group"
                  >
                    <div
                      className="w-8 h-8 rounded-full border border-white/25 flex items-center justify-center text-gray-300 shrink-0 group-hover:border-white"
                      style={{ width: '32px', height: '32px', minWidth: '32px' }}
                    >
                      <User className="w-4 h-4 text-gray-300" style={{ width: '16px', height: '16px' }} />
                    </div>
                    <div className="text-[13px] font-medium text-white group-hover:text-[#FFD166] transition-colors">
                      Use another account
                    </div>
                  </div>
                </div>
              )}

              {/* Add / Enter Real Google Account Form */}
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
                    style={{ minHeight: '40px' }}
                  >
                    <span>{loading ? 'Signing in...' : 'Continue with Google'}</span>
                    <ArrowRight className="w-3.5 h-3.5" style={{ width: '14px', height: '14px' }} />
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

              {/* Terms & Privacy Notice */}
              <p className="text-[10px] text-gray-400 text-center leading-relaxed pt-1">
                To continue, Google will securely verify your account with VERA.
              </p>

              {/* Back to VERA Login */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={() => setMode('LOGIN')}
                  className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-1 mx-auto transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" style={{ width: '14px', height: '14px' }} /> Back to email sign in
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
