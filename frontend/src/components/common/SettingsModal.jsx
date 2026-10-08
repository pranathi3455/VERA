import React, { useState } from 'react';
import { X, User, Shield, Sliders, Bell, Check, Cpu } from 'lucide-react';
import Button from './Button';
import Badge from './Badge';
import { useAuth } from '../../context/AuthContext';

export default function SettingsModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const navItems = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'account', label: 'Account', icon: Sliders },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Bell }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vera-primary/25 backdrop-blur-sm animate-fade-in">
      <div className="bg-surface-elevated border border-vera-border rounded-2xl shadow-vera-lg w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-vera-border flex items-center justify-between bg-surface">
          <div>
            <h2 className="text-base font-semibold text-vera-primary">Workspace Settings</h2>
            <p className="text-xs text-vera-secondary">Manage your preferences and engine parameters</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-vera-muted hover:text-vera-primary rounded-lg hover:bg-secondary-bg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Left Tab Nav & Right Content */}
        <div className="flex-1 flex flex-col sm:flex-row overflow-hidden">
          {/* Left Settings Nav */}
          <div className="sm:w-48 bg-secondary-bg/50 border-b sm:border-b-0 sm:border-r border-vera-border p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors text-left ${
                    active
                      ? 'bg-surface-elevated text-vera-primary shadow-vera-sm border border-vera-border/80'
                      : 'text-vera-secondary hover:text-vera-primary hover:bg-surface/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${active ? 'text-vera-accent' : 'text-vera-muted'}`} />
                  {item.label}
                </button>
              );
            })}
          </div>

          {/* Right Content */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            {activeTab === 'profile' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-vera-primary">Profile Details</h3>
                <div>
                  <label className="block text-xs font-medium text-vera-secondary mb-1">Full Name</label>
                  <input
                    type="text"
                    defaultValue={user?.name || 'Research Analyst'}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-vera-secondary mb-1">Email Address</label>
                  <input
                    type="email"
                    disabled
                    defaultValue={user?.email || 'analyst@organization.org'}
                    className="w-full px-3 py-2 rounded-xl bg-secondary-bg border border-vera-border text-xs text-vera-muted cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-vera-secondary mb-1">Role / Affiliation</label>
                  <input
                    type="text"
                    defaultValue="Strategic Decision Lead"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                  />
                </div>
              </div>
            )}

            {activeTab === 'account' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-vera-primary">Account Status</h3>
                <div className="p-3.5 rounded-xl bg-surface border border-vera-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vera-secondary">Workspace Tier</span>
                    <Badge variant="accent" size="sm">Enterprise Research</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vera-secondary">Deterministic Engine</span>
                    <Badge variant="success" size="sm" dot>Active</Badge>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-vera-secondary">Gemini Qualitative Agent</span>
                    <Badge variant="info" size="sm">Connected</Badge>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-vera-primary">Security & Access</h3>
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-vera-secondary">Session Encryption</label>
                  <p className="text-xs text-vera-muted leading-relaxed">
                    JWT authentication with 24-hour token expiry and Argon2/Bcrypt password isolation.
                  </p>
                  <Badge variant="success" size="sm" dot>TLS 1.3 Verified</Badge>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-vera-primary">Display & Analysis</h3>
                <div className="flex items-center justify-between py-2 border-b border-vera-border-subtle text-xs">
                  <div>
                    <div className="font-medium text-vera-primary">Automated AI Explanations</div>
                    <div className="text-vera-muted text-[11px]">Generate Gemini reasoning on decision runs</div>
                  </div>
                  <input type="checkbox" defaultChecked className="rounded border-vera-border text-vera-accent focus:ring-0" />
                </div>
                <div className="flex items-center justify-between py-2 border-b border-vera-border-subtle text-xs">
                  <div>
                    <div className="font-medium text-vera-primary">Strict Weight Validation (100%)</div>
                    <div className="text-vera-muted text-[11px]">Enforce mathematical normalization</div>
                  </div>
                  <input type="checkbox" defaultChecked disabled className="rounded border-vera-border text-vera-accent focus:ring-0" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-vera-border bg-surface flex items-center justify-between">
          <span className="text-xs text-vera-muted">
            {saved ? (
              <span className="text-[#557662] flex items-center gap-1 font-medium">
                <Check className="w-3.5 h-3.5" /> Preferences saved
              </span>
            ) : (
              'VERA v1.0 • Research Platform'
            )}
          </span>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
