import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  Layers,
  FolderOpen,
  Settings,
  HelpCircle,
  Sparkles,
  Crown,
  LogOut,
  User,
  ChevronsUpDown,
  Pin,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export default function Sidebar({ className = '', onOpenSettings, onCloseMobile }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const {
    historySessions,
    activeSessionId,
    togglePin,
    deleteHistoryItem,
    loadSession,
    clearChat
  } = useChat();

  const [profileOpen, setProfileOpen] = useState(false);

  const navLinks = [
    { name: 'Home', path: '/dashboard', icon: Home },
    { name: 'Explore', path: '/explore', icon: Compass },
    { name: 'Decisions', path: '/decisions', icon: Layers },
    { name: 'Workspace', path: '/workspace', icon: FolderOpen },
    { name: 'Settings', path: '/settings', icon: Settings },
    { name: 'Help', path: '/help', icon: HelpCircle },
  ];

  const isActive = (path) => {
    if (path === '/decisions') {
      return location.pathname === '/decisions' || location.pathname === '/create-decision' || location.pathname.startsWith('/decision/');
    }
    return location.pathname === path;
  };

  const handleLinkClick = () => {
    if (onCloseMobile) onCloseMobile();
  };

  const getUserInitials = () => {
    if (!user) return 'VS';
    if (user.name) {
      const parts = user.name.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return parts[0].slice(0, 2).toUpperCase();
    }
    return user.email ? user.email.slice(0, 2).toUpperCase() : 'VS';
  };

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/login');
  };

  const pinnedSessions = (historySessions || []).filter((s) => s.isPinned);
  const recentSessions = (historySessions || []).filter((s) => !s.isPinned);

  const renderHistoryItem = (item) => {
    const isCurrentActive = location.pathname === '/dashboard' && activeSessionId === item.id;

    return (
      <div
        key={item.id}
        onClick={() => {
          loadSession(item);
          navigate('/dashboard');
          if (onCloseMobile) onCloseMobile();
        }}
        className={`group relative flex items-center justify-between px-3 py-1.5 rounded-xl text-xs cursor-pointer transition-all ${
          isCurrentActive
            ? 'bg-[#EEF0FD] text-[#7B61FF] font-semibold'
            : 'text-[#475569] hover:text-[#17213D] hover:bg-[#F4F6FD]'
        }`}
      >
        <span className="truncate flex-1 pr-1.5 text-[12px] leading-tight">
          {item.title}
        </span>

        {/* Hover Action Buttons */}
        <div
          className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin / Unpin Button with Black Tooltip */}
          <div className="relative group/pin">
            <button
              type="button"
              onClick={() => togglePin(item.id)}
              className={`p-1 rounded-md transition-colors ${
                item.isPinned
                  ? 'text-[#7B61FF] hover:bg-[#DDD6FE]'
                  : 'text-[#8C95AA] hover:text-[#17213D] hover:bg-[#E2E8F0]'
              }`}
            >
              <Pin className={`w-3 h-3 ${item.isPinned ? 'fill-[#7B61FF]' : ''}`} />
            </button>
            <div className="absolute right-0 bottom-full mb-1 hidden group-hover/pin:flex items-center justify-center bg-[#0F172A] text-white text-[10px] font-medium py-1 px-2 rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none">
              {item.isPinned ? 'Unpin chat' : 'Pin chat'}
            </div>
          </div>

          {/* Delete Button with Black Tooltip */}
          <div className="relative group/del">
            <button
              type="button"
              onClick={() => deleteHistoryItem(item.id)}
              className="p-1 rounded-md text-[#8C95AA] hover:text-[#E11D48] hover:bg-[#FFE4E6] transition-colors"
            >
              <Trash2 className="w-3 h-3" />
            </button>
            <div className="absolute right-0 bottom-full mb-1 hidden group-hover/del:flex items-center justify-center bg-[#0F172A] text-white text-[10px] font-medium py-1 px-2 rounded-md whitespace-nowrap shadow-lg z-50 pointer-events-none">
              Delete chat
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <aside className={`w-[240px] bg-white/70 backdrop-blur-md border-r border-[#E2E6F5] flex flex-col justify-between shrink-0 select-none ${className}`}>
      {/* Brand Header with 24K HD Logo */}
      <div className="p-5 pb-3">
        <Link to="/dashboard" onClick={handleLinkClick} className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-white border border-[#E2E6F5] p-0.5 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform overflow-hidden shrink-0">
            <img src="/vera-logo-icon.png" alt="VERA Logo" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <div className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-[#17213D] via-[#4338CA] to-[#7B61FF] bg-clip-text text-transparent leading-none flex items-center gap-1.5">
              VERA
            </div>
            <div className="text-[10px] text-[#7C849A] font-medium tracking-wide mt-1">
              Understand. Analyze. Decide.
            </div>
          </div>
        </Link>
      </div>

      {/* Middle Scrollable Section: Nav Links + Chat History (Pinned & Recents) */}
      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-3 min-h-0 scrollbar-thin scrollbar-thumb-gray-200">
        {/* Navigation Links */}
        <div className="space-y-0.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.name}
                to={item.path}
                onClick={handleLinkClick}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[#EEF0FD] text-[#7B61FF] shadow-xs'
                    : 'text-[#5E6882] hover:text-[#17213D] hover:bg-[#F4F6FD]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${active ? 'text-[#7B61FF]' : 'text-[#7C849A]'}`} />
                  <span>{item.name}</span>
                </div>
                {active && <span className="w-1.5 h-1.5 rounded-full bg-[#7B61FF]" />}
              </Link>
            );
          })}
        </div>

        {/* Divider */}
        <div className="border-t border-[#F0F2FA] my-1" />

        {/* ============================================================== */}
        {/* CHAT HISTORY: PINNED & RECENTS                                 */}
        {/* ============================================================== */}
        <div className="space-y-3 pb-2">
          {/* Pinned Section */}
          {pinnedSessions.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 text-[11px] font-bold text-[#8C95AA] uppercase tracking-wider flex items-center justify-between">
                <span>Pinned</span>
              </div>
              <div className="space-y-0.5">
                {pinnedSessions.map((item) => renderHistoryItem(item))}
              </div>
            </div>
          )}

          {/* Recents Section */}
          <div className="space-y-1">
            <div className="px-3 text-[11px] font-bold text-[#8C95AA] uppercase tracking-wider flex items-center justify-between">
              <span>Recents</span>
              <button
                type="button"
                onClick={() => {
                  clearChat();
                  navigate('/dashboard');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="text-[#8C95AA] hover:text-[#7B61FF] p-0.5 rounded transition-colors"
                title="New decision chat"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="space-y-0.5">
              {recentSessions.length > 0 ? (
                recentSessions.map((item) => renderHistoryItem(item))
              ) : (
                <div className="px-3 py-1.5 text-[11px] text-[#A0ABBB] italic">
                  No recent chats
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Area (Left Side Down): VERA Pro + User Profile */}
      <div className="p-3 pt-2 space-y-2 border-t border-[#F0F2FA]">
        {/* VERA Pro Card */}
        <div className="p-3 rounded-2xl bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE] border border-[#DDD6FE] shadow-2xs relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-400/10 rounded-full blur-xl pointer-events-none" />
          <div className="flex items-center gap-2 mb-1">
            <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-[#7B61FF] to-[#6366F1] flex items-center justify-center text-white shadow-2xs">
              <Crown className="w-3 h-3" />
            </div>
            <span className="text-xs font-bold text-[#17213D]">VERA Pro</span>
          </div>
          <p className="text-[10px] text-[#5E6882] leading-relaxed">
            Unlock deeper analysis & features.
          </p>
        </div>

        {/* User Profile Bar (Left Side Down) */}
        <div className="relative">
          {profileOpen && (
            <div className="absolute bottom-full left-0 mb-2 w-56 bg-white rounded-2xl shadow-xl border border-[#E2E6F5] py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3.5 py-2 border-b border-[#F0F2FA]">
                <p className="font-bold text-[#17213D] truncate">{user?.name || 'Vasista Sri Kalyan'}</p>
                <p className="text-[11px] text-[#7C849A] truncate">{user?.email || 'analyst@vera.local'}</p>
              </div>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/profile');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full text-left px-3.5 py-2 text-[#5E6882] hover:text-[#17213D] hover:bg-[#F8F9FE] flex items-center gap-2 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-[#7B61FF]" /> My Profile
              </button>
              <button
                onClick={() => {
                  setProfileOpen(false);
                  if (onOpenSettings) onOpenSettings();
                  else navigate('/settings');
                  if (onCloseMobile) onCloseMobile();
                }}
                className="w-full text-left px-3.5 py-2 text-[#5E6882] hover:text-[#17213D] hover:bg-[#F8F9FE] flex items-center gap-2 transition-colors"
              >
                <Settings className="w-3.5 h-3.5 text-[#7B61FF]" /> Settings
              </button>
              <div className="border-t border-[#F0F2FA] my-1" />
              <button
                onClick={handleLogout}
                className="w-full text-left px-3.5 py-2 text-[#E11D48] hover:bg-[#FFF1F2] flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setProfileOpen(!profileOpen)}
            className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-[#F4F6FD] border border-transparent hover:border-[#E2E6F5] transition-all text-left group"
            title={user?.name || 'Vasista Sri Kalyan'}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#7B61FF] to-[#6366F1] text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0 group-hover:ring-2 group-hover:ring-[#7B61FF]/30 transition-all">
              {getUserInitials()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-[#17213D] truncate leading-tight">
                {user?.name || 'Vasista Sri Kalyan'}
              </div>
              <div className="text-[10px] text-[#7C849A] truncate mt-0.5">
                {user?.email || 'analyst@vera.local'}
              </div>
            </div>
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#8C95AA] group-hover:text-[#17213D] shrink-0" />
          </button>
        </div>
      </div>
    </aside>
  );
}
