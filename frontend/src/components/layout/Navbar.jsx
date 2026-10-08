import React from 'react';
import { Menu } from 'lucide-react';

export default function Navbar({ onToggleSidebar }) {
  return (
    <header className="lg:hidden h-14 bg-white/70 backdrop-blur-md border-b border-[#E2E6F5] px-4 flex items-center justify-between sticky top-0 z-30 select-none shrink-0">
      {/* Mobile Sidebar Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 rounded-xl text-[#5E6882] hover:text-[#17213D] hover:bg-[#EEF0FD] transition-colors"
          aria-label="Toggle Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
