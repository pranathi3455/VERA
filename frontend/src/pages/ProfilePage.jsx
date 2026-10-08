import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  CreditCard,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Edit2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || 'Vasista Sri Kalyan');

  const email = user?.email || 'vasista.srikalyan@example.com';

  const getUserInitials = () => {
    if (!name) return 'VC';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          My Profile
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6882]">
          Manage your account and preferences.
        </p>
      </div>

      {/* Top User Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6F5] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Circle */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#7B61FF] to-[#6366F1] text-white font-bold text-xl flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            {getUserInitials()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#17213D]">{name}</h2>
            <p className="text-xs text-[#7C849A] mt-0.5">{email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing(!editing)}
          className="px-4 py-2 rounded-xl border border-[#D5DAEA] bg-white hover:bg-[#F8F9FE] text-xs font-semibold text-[#17213D] transition-colors flex items-center gap-2"
        >
          <Edit2 className="w-3.5 h-3.5 text-[#5E6882]" />
          <span>{editing ? 'Save Profile' : 'Edit Profile'}</span>
        </button>
      </div>

      {/* Account Information Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6F5] shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#17213D]">Account Information</h3>

        <div className="space-y-4 text-xs divide-y divide-[#F0F2FA]">
          <div className="flex items-center justify-between pt-2">
            <span className="text-[#5E6882]">Name</span>
            {editing ? (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3 py-1 rounded-lg border border-[#7B61FF] text-xs font-semibold text-[#17213D]"
              />
            ) : (
              <span className="font-semibold text-[#17213D]">{name}</span>
            )}
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-[#5E6882]">Email</span>
            <span className="font-semibold text-[#17213D]">{email}</span>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-[#5E6882]">Plan</span>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-[#17213D]">Free Plan</span>
              <button
                type="button"
                className="px-3.5 py-1 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#6366F1] text-white text-[11px] font-bold shadow-sm hover:scale-105 transition-all"
              >
                Upgrade
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-[#5E6882]">Member since</span>
            <span className="font-semibold text-[#17213D]">October 2026</span>
          </div>
        </div>
      </div>

      {/* Usage Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6F5] shadow-sm space-y-5">
        <h3 className="text-sm font-bold text-[#17213D]">Usage</h3>

        <div className="space-y-5">
          {/* Progress 1: Research credits */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#5E6882]">Research credits</span>
              <span className="text-[#17213D]">0 / 50</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EEF0FD] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7B61FF] to-[#6366F1] rounded-full" style={{ width: '0%' }} />
            </div>
          </div>

          {/* Progress 2: File uploads */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#5E6882]">File uploads</span>
              <span className="text-[#17213D]">0 / 10</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#EEF0FD] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#7B61FF] to-[#6366F1] rounded-full" style={{ width: '0%' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
