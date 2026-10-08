import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Laptop,
  GraduationCap,
  TrendingUp,
  Lightbulb,
  User,
  LayoutGrid,
  ArrowRight
} from 'lucide-react';

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState(['Products & purchases']);

  const options = [
    { id: 'products', title: 'Products & purchases', icon: Laptop },
    { id: 'career', title: 'Career & education', icon: GraduationCap },
    { id: 'investments', title: 'Investments & finance', icon: TrendingUp },
    { id: 'business', title: 'Business ideas', icon: Lightbulb },
    { id: 'personal', title: 'Personal choices', icon: User },
    { id: 'other', title: 'Other', icon: LayoutGrid },
  ];

  const toggleInterest = (title) => {
    if (selectedInterests.includes(title)) {
      setSelectedInterests(selectedInterests.filter((item) => item !== title));
    } else {
      setSelectedInterests([...selectedInterests, title]);
    }
  };

  const handleContinue = () => {
    localStorage.setItem('vera_user_interests', JSON.stringify(selectedInterests));
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-[#EEF2FB] text-[#17213D] font-sans antialiased select-none relative overflow-hidden">
      {/* Background Soft Radiant Glowing Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#C8D2FF]/40 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#DCC5FF]/40 rounded-full blur-3xl pointer-events-none" />

      {/* Main Centered Floating Card */}
      <div className="w-full max-w-[540px] bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-[#E2E6F5] relative z-10 space-y-8">
        {/* Brand Logo & Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2.5 mb-1">
            <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E6F5] p-0.5 flex items-center justify-center shadow-xs overflow-hidden">
              <img src="/vera-logo-icon.png" alt="VERA" className="w-full h-full object-contain rounded-lg" />
            </div>
            <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-[#17213D] via-[#4338CA] to-[#7B61FF] bg-clip-text text-transparent">VERA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">What brings you here?</h1>
          <p className="text-xs sm:text-sm text-[#5E6882]">Choose what you're most interested in. You can change this later.</p>
        </div>

        {/* 6 Category Selection Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = selectedInterests.includes(opt.title);

            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => toggleInterest(opt.title)}
                className={`flex flex-col items-center justify-center p-5 rounded-2xl border text-center transition-all ${
                  isSelected
                    ? 'border-[#7B61FF] bg-[#EEF0FD] shadow-sm ring-1 ring-[#7B61FF]'
                    : 'border-[#E2E6F5] bg-[#F8F9FE] hover:bg-white hover:border-[#D5DAEA]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2.5 transition-colors ${
                  isSelected ? 'bg-[#7B61FF] text-white shadow-sm' : 'bg-white text-[#5E6882] shadow-sm'
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold text-[#17213D] leading-snug">
                  {opt.title}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Actions: Skip & Continue */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="text-xs font-semibold text-[#7C849A] hover:text-[#17213D] transition-colors px-2 py-1"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={handleContinue}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:from-[#6D52F7] hover:to-[#5558E6] text-white font-semibold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            <span>Continue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
