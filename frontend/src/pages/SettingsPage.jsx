import React, { useState } from 'react';
import {
  Sliders,
  Palette,
  Bell,
  Shield,
  Globe,
  Sun,
  Moon,
  Monitor,
  Check
} from 'lucide-react';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('General');
  const [theme, setTheme] = useState('Light');
  const [accentColor, setAccentColor] = useState('#7B61FF');

  const [toggles, setToggles] = useState({
    webSearch: true,
    autoSave: true,
    detailedExplanations: true,
    researchUpdates: false,
  });

  const sideTabs = [
    { name: 'General', icon: Sliders },
    { name: 'Appearance', icon: Palette },
    { name: 'Notifications', icon: Bell },
    { name: 'Data & Privacy', icon: Shield },
    { name: 'Language', icon: Globe },
  ];

  const colors = [
    { name: 'Purple', hex: '#7B61FF' },
    { name: 'Indigo', hex: '#6366F1' },
    { name: 'Blue', hex: '#3B82F6' },
    { name: 'Teal', hex: '#14B8A6' },
    { name: 'Green', hex: '#10B981' },
  ];

  const handleToggle = (key) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6882]">
          Customize your experience with VERA.
        </p>
      </div>

      {/* Main Settings Container (2-Column Grid matching Screen 10) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        {/* Left Side Navigation Tabs */}
        <div className="bg-white/80 rounded-2xl p-2 border border-[#E2E6F5] space-y-1">
          {sideTabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.name;

            return (
              <button
                key={tab.name}
                type="button"
                onClick={() => setActiveTab(tab.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-left transition-all ${
                  active
                    ? 'bg-[#EEF0FD] text-[#7B61FF]'
                    : 'text-[#5E6882] hover:text-[#17213D] hover:bg-[#F8F9FE]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-[#7B61FF]' : 'text-[#7C849A]'}`} />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Panel */}
        <div className="md:col-span-3 bg-white rounded-3xl p-6 sm:p-8 border border-[#E2E6F5] shadow-sm space-y-8">
          {/* Section 1: Theme */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C849A]">
              Theme
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setTheme('Light')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                  theme === 'Light'
                    ? 'border-[#7B61FF] bg-[#EEF0FD] ring-1 ring-[#7B61FF]'
                    : 'border-[#E2E6F5] bg-[#F8F9FE] hover:bg-white'
                }`}
              >
                <Sun className={`w-5 h-5 mb-2 ${theme === 'Light' ? 'text-[#7B61FF]' : 'text-[#7C849A]'}`} />
                <span className="text-xs font-bold text-[#17213D]">Light</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('Dark')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                  theme === 'Dark'
                    ? 'border-[#7B61FF] bg-[#EEF0FD] ring-1 ring-[#7B61FF]'
                    : 'border-[#E2E6F5] bg-[#F8F9FE] hover:bg-white'
                }`}
              >
                <Moon className={`w-5 h-5 mb-2 ${theme === 'Dark' ? 'text-[#7B61FF]' : 'text-[#7C849A]'}`} />
                <span className="text-xs font-bold text-[#17213D]">Dark</span>
              </button>

              <button
                type="button"
                onClick={() => setTheme('System')}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border text-center transition-all ${
                  theme === 'System'
                    ? 'border-[#7B61FF] bg-[#EEF0FD] ring-1 ring-[#7B61FF]'
                    : 'border-[#E2E6F5] bg-[#F8F9FE] hover:bg-white'
                }`}
              >
                <Monitor className={`w-5 h-5 mb-2 ${theme === 'System' ? 'text-[#7B61FF]' : 'text-[#7C849A]'}`} />
                <span className="text-xs font-bold text-[#17213D]">System</span>
              </button>
            </div>
          </div>

          {/* Section 2: Accent Color */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#7C849A]">
              Accent Color
            </h3>
            <div className="flex items-center gap-3">
              {colors.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setAccentColor(c.hex)}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm"
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                >
                  {accentColor === c.hex && (
                    <Check className="w-4 h-4 text-white stroke-[3]" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Section 3: Feature Toggles */}
          <div className="space-y-4 pt-4 border-t border-[#F0F2FA]">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#17213D]">Enable web search</p>
                <p className="text-[11px] text-[#7C849A]">Include external live citations for market and technical evidence</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('webSearch')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  toggles.webSearch ? 'bg-[#7B61FF]' : 'bg-[#D5DAEA]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    toggles.webSearch ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#17213D]">Auto-save decisions</p>
                <p className="text-[11px] text-[#7C849A]">Automatically checkpoint weights and alternatives as you edit</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('autoSave')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  toggles.autoSave ? 'bg-[#7B61FF]' : 'bg-[#D5DAEA]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    toggles.autoSave ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 3 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#17213D]">Show detailed explanations</p>
                <p className="text-[11px] text-[#7C849A]">Display why-recommendation rationales alongside deterministic rankings</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('detailedExplanations')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  toggles.detailedExplanations ? 'bg-[#7B61FF]' : 'bg-[#D5DAEA]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    toggles.detailedExplanations ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Toggle 4 */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#17213D]">Receive research updates</p>
                <p className="text-[11px] text-[#7C849A]">Notify when new benchmarks or evidence contradict active assumptions</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle('researchUpdates')}
                className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                  toggles.researchUpdates ? 'bg-[#7B61FF]' : 'bg-[#D5DAEA]'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                    toggles.researchUpdates ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
