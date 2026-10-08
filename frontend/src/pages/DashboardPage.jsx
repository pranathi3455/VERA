import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw, Plus, Paperclip, Globe, Mic, Send } from 'lucide-react';

import HeroMotionStage from '../components/dashboard/HeroMotionStage';
import DecisionChatStream from '../components/dashboard/DecisionChatStream';
import { useChat } from '../context/ChatContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    messages,
    loading,
    activeDecisionData,
    promptQuery,
    setPromptQuery,
    sendMessage,
    startTopic,
    clearChat,
    isChatting,
    isWebSearchActive,
    toggleWebSearch
  } = useChat();

  const [attachFeedback, setAttachFeedback] = useState('');
  const textareaRef = useRef(null);
  const handledQueryRef = useRef(null);

  // Check URL query parameter 'q' (from search bar or external links)
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam && queryParam.trim() && handledQueryRef.current !== queryParam.trim()) {
      handledQueryRef.current = queryParam.trim();
      startTopic(queryParam.trim());
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, startTopic, setSearchParams]);

  const handleSendMessage = (text) => {
    sendMessage(text);
  };

  const handleConvertToMatrix = (data) => {
    const target = data || activeDecisionData || {};
    navigate('/create-decision', {
      state: {
        title: target.title || 'Structured Decision',
        question: target.question || promptQuery || 'How should we evaluate candidate alternatives?',
        criteria: target.criteria || [],
        alternatives: target.alternatives || []
      }
    });
  };

  // Render Prompt Input Card (Identical sleek compact styling in both states)
  const renderPromptCard = () => (
    <div className="w-full max-w-3xl mx-auto">
      <div className={`bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-3.5 shadow-md border transition-all space-y-2 ${
        isWebSearchActive ? 'border-[#7B61FF] ring-2 ring-[#7B61FF]/10' : 'border-[#D5DAEA] hover:border-[#7B61FF]/40'
      }`}>
        <textarea
          ref={textareaRef}
          rows={1}
          value={promptQuery}
          onChange={(e) => setPromptQuery(e.target.value)}
          placeholder={
            isWebSearchActive
              ? "🌐 Research external websites & benchmark data for any decision..."
              : isChatting
              ? "Reply to VERA, add constraints, or ask follow-up questions..."
              : "Ask VERA about a decision... (e.g. college, career, laptop, strategy)"
          }
          className="w-full text-sm text-[#17213D] placeholder-[#8C95AA] focus:outline-none resize-none bg-transparent min-h-[36px] max-h-24 py-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
        />

        {/* Action Bar inside prompt card */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F0F2FA]">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => {
                setPromptQuery((prev) => (prev ? `${prev} + option: ` : 'Compare option A vs option B'));
                textareaRef.current?.focus();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F6FD] hover:bg-[#EEF0FD] text-xs font-semibold text-[#5E6882] hover:text-[#7B61FF] border border-[#E2E6F5] transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-[#7B61FF]" />
              <span>Add options</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAttachFeedback('Context notes attached');
                setTimeout(() => setAttachFeedback(''), 2500);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F4F6FD] hover:bg-[#EEF0FD] text-xs font-semibold text-[#5E6882] hover:text-[#7B61FF] border border-[#E2E6F5] transition-colors"
              title="Attach background notes"
            >
              <Paperclip className="w-3.5 h-3.5 text-[#5E6882]" />
              <span>{attachFeedback || 'Attach'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (promptQuery.trim()) {
                  sendMessage(promptQuery.trim(), null, { searchWeb: true });
                } else {
                  toggleWebSearch();
                  textareaRef.current?.focus();
                }
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                isWebSearchActive
                  ? 'bg-[#7B61FF] text-white shadow-xs border border-[#6D52F7]'
                  : 'bg-[#F4F6FD] hover:bg-[#EEF0FD] text-[#5E6882] hover:text-[#7B61FF] border border-[#E2E6F5]'
              }`}
              title={isWebSearchActive ? 'Live web research active — click to toggle off' : 'Click to research external websites & benchmarks'}
            >
              <Globe className={`w-3.5 h-3.5 ${isWebSearchActive ? 'text-white' : 'text-[#5E6882]'}`} />
              <span>{isWebSearchActive ? 'Search web ON' : 'Search web'}</span>
              {isWebSearchActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              )}
            </button>

            {isChatting && (
              <button
                type="button"
                onClick={clearChat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FFF1F2] hover:bg-[#FFE4E6] text-xs font-semibold text-[#E11D48] border border-[#FECDD3] transition-colors"
                title="Start a new decision conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>New Decision</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                setPromptQuery('Which option provides the highest return with lowest risk?');
                textareaRef.current?.focus();
              }}
              className="p-1.5 rounded-full text-[#7C849A] hover:text-[#17213D] hover:bg-[#F4F6FD] transition-colors"
              title="Quick voice or query suggestion"
            >
              <Mic className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={loading || !promptQuery.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                promptQuery.trim() && !loading
                  ? 'bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:from-[#6D52F7] hover:to-[#5558E6] text-white shadow-md shadow-indigo-500/20 hover:scale-105'
                  : 'bg-[#E2E6F5] text-[#8C95AA] cursor-not-allowed'
              }`}
              title="Send decision prompt"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full w-full max-w-5xl mx-auto flex flex-col overflow-hidden select-none px-4 sm:px-6">
      {/* ============================================================== */}
      {/* STATE 1: INITIAL HERO STATE (NO SCROLLING)                     */}
      {/* ============================================================== */}
      {!isChatting ? (
        <div className="flex-1 flex flex-col justify-between py-4 overflow-hidden">
          <div className="w-full">
            <HeroMotionStage />
          </div>
          <div className="w-full pb-4 shrink-0">
            {renderPromptCard()}
          </div>
        </div>
      ) : (
        /* ============================================================== */
        /* STATE 2: ACTIVE CHAT STATE (ONLY MESSAGES SCROLL, PROMPT DOCKED)*/
        /* ============================================================== */
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden py-3">
          {/* Scrollable Conversation Stream */}
          <div className="flex-1 min-h-0 overflow-y-auto px-1 sm:px-2 py-2 space-y-4">
            <DecisionChatStream
              messages={messages}
              loading={loading}
              isWebSearchActive={isWebSearchActive}
              onSelectSuggestion={(suggestionText) => {
                if (suggestionText.includes('Quantitative Decision Matrix')) {
                  handleConvertToMatrix();
                } else {
                  handleSendMessage(suggestionText);
                }
              }}
              onConvertToMatrix={handleConvertToMatrix}
            />
          </div>

          {/* Permanently Docked Bottom Prompt Card */}
          <div className="shrink-0 w-full pt-2 pb-2">
            {renderPromptCard()}
          </div>
        </div>
      )}
    </div>
  );
}
