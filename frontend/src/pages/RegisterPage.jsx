import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, Eye, EyeOff, Mail, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatUserErrorMessage } from '../utils/errorHandler';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register, loginWithGoogle, isAuthenticated } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      await register(formData.name, formData.email, formData.password);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Registration could not be completed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle({
        email: 'pranathigudepu@gmail.com',
        name: 'Pranathi Gudepu'
      });
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Direct Google authentication failed. Please try with email.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#EEF2FB] text-[#17213D] font-sans antialiased select-none relative overflow-hidden">
      {/* Background Soft Radiant Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C8D2FF]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#DCC5FF]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Floating Card */}
      <div className="w-full max-w-[420px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E2E6F5] relative z-10 space-y-6">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E6F5] p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
              <img src="/vera-logo-icon.png" alt="VERA" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#17213D] via-[#4338CA] to-[#7B61FF] bg-clip-text text-transparent">VERA</span>
          </div>
          <h1 className="text-2xl font-bold text-[#17213D] tracking-tight">Create your account</h1>
          <p className="text-xs text-[#5E6882]">Start making smarter decisions today.</p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-2xl bg-[#FEECEB] border border-[#F8D2D0] text-xs text-[#903028] flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-[#D32F2F] shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Social Authentication Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#D5DAEA] bg-white hover:bg-[#F8F9FE] text-[#17213D] text-xs font-semibold shadow-sm transition-all hover:border-[#7B61FF]/40"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.16z" />
              <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z" />
              <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z" />
              <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => document.getElementById('register-name-input')?.focus()}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-[#D5DAEA] bg-white hover:bg-[#F8F9FE] text-[#17213D] text-xs font-semibold shadow-sm transition-all"
          >
            <Mail className="w-4 h-4 text-[#5E6882]" />
            Continue with Email
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-[#17213D] mb-1">
              Full name
            </label>
            <input
              id="register-name-input"
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your name"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FE] border border-[#D5DAEA] focus:border-[#7B61FF] focus:bg-white text-xs text-[#17213D] placeholder-[#7C849A] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17213D] mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="you@example.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#F8F9FE] border border-[#D5DAEA] focus:border-[#7B61FF] focus:bg-white text-xs text-[#17213D] placeholder-[#7C849A] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#17213D] mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[#F8F9FE] border border-[#D5DAEA] focus:border-[#7B61FF] focus:bg-white text-xs text-[#17213D] placeholder-[#7C849A] focus:outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-[#7C849A] hover:text-[#17213D]"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:from-[#6D52F7] hover:to-[#5558E6] text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Legal Disclaimer */}
        <p className="text-[10px] text-center text-[#7C849A] leading-normal">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>

        {/* Footer Link */}
        <div className="text-center pt-1 text-xs text-[#5E6882]">
          Already have an account?{' '}
          <Link to="/login" className="text-[#7B61FF] hover:underline font-semibold">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
