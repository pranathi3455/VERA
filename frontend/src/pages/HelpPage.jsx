import React, { useState } from 'react';
import {
  Search,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Shield,
  FileText,
  Crown,
  Mail,
  ExternalLink,
  MessageSquare,
  FileSearch,
  Scale,
  Lightbulb
} from 'lucide-react';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openItem, setOpenItem] = useState(null);

  const helpTopics = [
    {
      id: 'getting-started',
      title: 'Getting started with VERA',
      summary: 'Learn how to frame decisions, add multiple alternatives, define quantitative criteria, and assign weights.'
    },
    {
      id: 'how-it-analyzes',
      title: 'How VERA analyzes decisions',
      summary: 'VERA uses a 100% deterministic weighted normalization algorithm to rank alternatives, coupled with Gemini AI for qualitative trade-off synthesis.'
    },
    {
      id: 'files-and-docs',
      title: 'Using files and documents',
      summary: 'Upload PDF reports, benchmarks, and data sheets into your workspace to automatically ground decision evidence with citations.'
    },
    {
      id: 'privacy-security',
      title: 'Privacy and security',
      summary: 'Row-level security ensures your decisions, criteria, and evidence remain private. VERA never trains public models on your proprietary data.'
    },
    {
      id: 'upgrade-pro',
      title: 'Upgrade to VERA Pro',
      summary: 'Unlock higher usage quotas, unlimited file uploads, Monte Carlo risk simulations, and collaborative multi-stakeholder consensus voting.'
    },
    {
      id: 'contact-support',
      title: 'Contact support',
      summary: 'Have questions or feedback? Reach out directly to our engineering team at support@vera-intelligence.com.'
    }
  ];

  const filteredTopics = helpTopics.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleItem = (id) => {
    setOpenItem(openItem === id ? null : id);
  };

  return (
    <div className="p-6 sm:p-8 max-w-4xl mx-auto space-y-6 select-none">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          Help
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6882]">
          Get support and learn how to use VERA.
        </p>
      </div>

      {/* How VERA works Section (4 Core Steps) */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-[#E2E6F5] space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#7B61FF]" />
          <h3 className="text-sm font-bold text-[#17213D]">How VERA works</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F5]/70">
            <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#7B61FF] shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#17213D] leading-tight">
                Tell me your decision in simple words
              </p>
              <p className="text-[11px] text-[#7C849A] mt-1 leading-normal">
                Frame your question, objectives, and constraints in natural language.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F5]/70">
            <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#7B61FF] shrink-0 mt-0.5">
              <FileSearch className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#17213D] leading-tight">
                I research and analyze relevant information
              </p>
              <p className="text-[11px] text-[#7C849A] mt-1 leading-normal">
                Automatically gather benchmarks, research papers, and verified evidence.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F5]/70">
            <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#7B61FF] shrink-0 mt-0.5">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#17213D] leading-tight">
                We compare options, risks and trade-offs
              </p>
              <p className="text-[11px] text-[#7C849A] mt-1 leading-normal">
                Deterministic mathematical scoring with explainable risk assessment.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#F8F9FE] border border-[#E2E6F5]/70">
            <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#7B61FF] shrink-0 mt-0.5">
              <Lightbulb className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-[#17213D] leading-tight">
                You get clear insights to decide with confidence
              </p>
              <p className="text-[11px] text-[#7C849A] mt-1 leading-normal">
                Transparent rankings, what-if sensitivity simulations, and audit trails.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#7C849A]">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search help topics..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-[#D5DAEA] focus:border-[#7B61FF] rounded-2xl text-xs sm:text-sm text-[#17213D] placeholder-[#7C849A] focus:outline-none transition-all shadow-sm"
        />
      </div>

      {/* List of Accordion Help Topics (Matching Screen 12) */}
      <div className="bg-white rounded-3xl border border-[#E2E6F5] divide-y divide-[#F0F2FA] shadow-sm overflow-hidden">
        {filteredTopics.map((topic) => {
          const isOpen = openItem === topic.id;

          return (
            <div key={topic.id} className="transition-colors">
              <button
                type="button"
                onClick={() => toggleItem(topic.id)}
                className="w-full p-5 text-left flex items-center justify-between hover:bg-[#F8F9FE] transition-colors"
              >
                <span className="text-xs sm:text-sm font-bold text-[#17213D]">
                  {topic.title}
                </span>
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-[#7B61FF] shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-[#7C849A] shrink-0" />
                )}
              </button>

              {isOpen && (
                <div className="px-5 pb-5 text-xs text-[#5E6882] leading-relaxed animate-fade-in bg-[#F8F9FE]/50">
                  {topic.summary}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
