import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Laptop,
  GraduationCap,
  TrendingUp,
  Briefcase,
  Lightbulb,
  Heart,
  ChevronRight,
  ArrowRight,
  Sparkles,
  Flame
} from 'lucide-react';

export default function ExplorePage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = [
    'All',
    'Products',
    'Career',
    'Education',
    'Finance',
    'Business',
    'Lifestyle'
  ];

  const trendingTopics = [
    '💻 MacBook Pro M3 vs Dell XPS 15',
    '📈 Index Funds vs Real Estate',
    '🎓 Master’s Degree vs Tech Bootcamp',
    '🚀 Staff IC vs Engineering Manager',
    '🏡 Buy vs Rent a Home'
  ];

  const exploreCards = [
    {
      id: 'tech',
      title: 'Technology',
      subtitle: 'Laptops, phones, gadgets...',
      category: 'Products',
      icon: Laptop,
      color: 'text-[#7B61FF]',
      bgColor: 'bg-[#EEF0FD]',
      exampleQuery: 'Best Developer Laptop: MacBook Pro M3 vs Dell XPS 15 vs ThinkPad X1',
      quickPrompts: ['MacBook Pro M3 vs Dell XPS', 'iPhone 16 Pro vs S24 Ultra']
    },
    {
      id: 'education',
      title: 'Education',
      subtitle: 'Colleges, courses, skills...',
      category: 'Education',
      icon: GraduationCap,
      color: 'text-[#6366F1]',
      bgColor: 'bg-[#E0E7FF]',
      exampleQuery: 'Master in Computer Science vs Professional Certification Bootcamp',
      quickPrompts: ['Master’s vs Tech Bootcamp', 'College Degree vs Self-Taught']
    },
    {
      id: 'finance',
      title: 'Finance',
      subtitle: 'Investments, saving, money...',
      category: 'Finance',
      icon: TrendingUp,
      color: 'text-[#10B981]',
      bgColor: 'bg-[#E4EEE7]',
      exampleQuery: 'Index Fund Investment Strategy vs High-Yield Fixed Deposit vs Real Estate',
      quickPrompts: ['Index Funds vs Real Estate', 'High-Yield Savings vs Stocks']
    },
    {
      id: 'career',
      title: 'Career',
      subtitle: 'Job roles, skill paths...',
      category: 'Career',
      icon: Briefcase,
      color: 'text-[#8B5CF6]',
      bgColor: 'bg-[#EDE9FE]',
      exampleQuery: 'Senior Staff Engineer IC Track vs Engineering Management Transition',
      quickPrompts: ['Staff IC vs Eng Manager', 'Startup Equity vs Big Tech Salary']
    },
    {
      id: 'business',
      title: 'Business ideas',
      subtitle: 'Startups, side incomes...',
      category: 'Business',
      icon: Lightbulb,
      color: 'text-[#F59E0B]',
      bgColor: 'bg-[#FEF3C7]',
      exampleQuery: 'B2B SaaS Product Launch vs Enterprise Consulting Firm',
      quickPrompts: ['B2B SaaS vs Boutique Consulting', 'Bootstrap vs Venture Capital']
    },
    {
      id: 'lifestyle',
      title: 'Lifestyle',
      subtitle: 'Travel, health, personal...',
      category: 'Lifestyle',
      icon: Heart,
      color: 'text-[#EC4899]',
      bgColor: 'bg-[#FCE7F3]',
      exampleQuery: 'Relocation Decision: Tier-1 Metropolitan Hub vs Low-Cost Remote Lifestyle',
      quickPrompts: ['Metro Hub vs Remote Living', 'Work-Life Balance vs Fast Pace']
    }
  ];

  const filteredCards = exploreCards.filter((card) => {
    const matchesFilter = activeCategory === 'All' || card.category === activeCategory;
    const matchesSearch =
      card.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Redirect to Home page and automatically trigger the decision conversation
  const handleStartConvo = (queryText) => {
    const text = (queryText || '').replace(/^[\p{Emoji}\s]+/u, '').trim() || (queryText || '').trim();
    if (!text) return;
    navigate(`/dashboard?q=${encodeURIComponent(text)}`);
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      handleStartConvo(searchQuery.trim());
    }
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          Explore
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6882]">
          Discover decision topics, compare options, and start an instant conversation with VERA.
        </p>
      </div>

      {/* Search Input Bar with Instant Convo Trigger */}
      <form onSubmit={handleSearchSubmit} className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7C849A]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search any topic, question or comparison (Press Enter to ask VERA)..."
          className="w-full pl-10 pr-28 py-3.5 bg-white border border-[#D5DAEA] focus:border-[#7B61FF] rounded-2xl text-xs sm:text-sm text-[#17213D] placeholder-[#7C849A] focus:outline-none transition-all shadow-sm"
        />
        <button
          type="submit"
          disabled={!searchQuery.trim()}
          className={`absolute right-2 top-2 bottom-2 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
            searchQuery.trim()
              ? 'bg-[#7B61FF] hover:bg-[#6D52F7] text-white shadow-sm'
              : 'bg-[#F0F2FA] text-[#8C95AA] cursor-not-allowed'
          }`}
        >
          <span>Ask VERA</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      {/* Trending Topics Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#5E6882]">
          <Flame className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span>Trending Decision Topics (Click to chat):</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {trendingTopics.map((topic, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleStartConvo(topic)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-[#EEF0FD] text-[#334155] hover:text-[#7B61FF] border border-[#E2E6F5] hover:border-[#DDD6FE] shadow-2xs hover:shadow-xs transition-all shrink-0 flex items-center gap-1"
            >
              <span>{topic}</span>
              <Sparkles className="w-3 h-3 text-[#7B61FF]" />
            </button>
          ))}
        </div>
      </div>

      {/* Filter Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold shrink-0 transition-all ${
                active
                  ? 'bg-[#EEF0FD] text-[#7B61FF] border border-[#DDD6FE]'
                  : 'bg-white text-[#5E6882] border border-[#E2E6F5] hover:bg-[#F8F9FE]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* 6 Category Cards Grid - Each redirects to Home in conversation */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map((card) => {
          const Icon = card.icon;

          return (
            <div
              key={card.id}
              onClick={() => handleStartConvo(card.exampleQuery)}
              className="bg-white rounded-2xl p-5 border border-[#E2E6F5] hover:border-[#7B61FF] shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between group space-y-3.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl ${card.bgColor} ${card.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#17213D] group-hover:text-[#7B61FF] transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-xs text-[#7C849A] mt-0.5">
                      {card.subtitle}
                    </p>
                  </div>
                </div>

                <div className="w-7 h-7 rounded-full bg-[#F4F6FD] group-hover:bg-[#EEF0FD] flex items-center justify-center transition-colors shrink-0">
                  <ChevronRight className="w-4 h-4 text-[#7C849A] group-hover:text-[#7B61FF] group-hover:translate-x-0.5 transition-all" />
                </div>
              </div>

              {/* Quick Prompts inside card */}
              <div className="space-y-1.5 pt-2 border-t border-[#F4F6FD]">
                <div className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  Quick Decision Prompts
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {card.quickPrompts.map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartConvo(prompt);
                      }}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-[#F8F9FE] hover:bg-[#EEF0FD] text-[#475569] hover:text-[#7B61FF] border border-[#E2E8F0] hover:border-[#DDD6FE] transition-colors text-left"
                    >
                      {prompt} →
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
