import React, { useEffect, useRef } from 'react';
import {
  Sparkles,
  User,
  Sliders,
  Layers,
  ArrowRight,
  Globe,
  TrendingUp,
  Lightbulb,
  ExternalLink
} from 'lucide-react';

/**
 * Lightweight, cozy renderer for AI Markdown formatting
 */
function MarkdownBlock({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let currentList = [];

  const flushList = () => {
    if (currentList.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-2 space-y-1 pl-4 list-disc marker:text-[#7B61FF]">
          {currentList.map((item, idx) => (
            <li key={idx} className="text-xs sm:text-sm text-[#384360] leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
            </li>
          ))}
        </ul>
      );
      currentList = [];
    }
  };

  const formatInline = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-[#17213D]">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic text-[#4A5568]">$1</em>')
      .replace(/`(.*?)`/g, '<code class="px-1.5 py-0.5 rounded bg-[#EEF0FD] text-[#6366F1] font-mono text-xs">$1</code>');
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Callout box for key factors or tips (starts with 💡)
    if (line.startsWith('💡')) {
      flushList();
      elements.push(
        <div key={idx} className="my-2.5 p-3 rounded-xl bg-[#F5F3FF] border border-[#DDD6FE] text-xs text-[#5B21B6] leading-relaxed flex items-start gap-2.5 font-medium">
          <span className="shrink-0 text-sm">💡</span>
          <div dangerouslySetInnerHTML={{ __html: formatInline(line.replace(/^💡\s*/, '')) }} />
        </div>
      );
      return;
    }

    if (line.startsWith('### ')) {
      flushList();
      elements.push(
        <h3 key={idx} className="text-xs sm:text-sm font-bold text-[#17213D] mt-3 mb-1.5 flex items-center gap-2">
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace('### ', '')) }} />
        </h3>
      );
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(
        <h2 key={idx} className="text-sm sm:text-base font-bold text-[#17213D] mt-3 mb-1.5">
          <span dangerouslySetInnerHTML={{ __html: formatInline(line.replace('## ', '')) }} />
        </h2>
      );
    } else if (line.startsWith('---')) {
      flushList();
      elements.push(<hr key={idx} className="my-3 border-[#F0F2FA]" />);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      currentList.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      flushList();
      const numMatch = line.match(/^(\d+)\.\s(.*)/);
      if (numMatch) {
        elements.push(
          <div key={idx} className="flex items-start gap-2 my-1.5">
            <span className="shrink-0 w-4 h-4 rounded-full bg-[#EEF0FD] text-[#7B61FF] font-bold text-[11px] flex items-center justify-center mt-0.5">
              {numMatch[1]}
            </span>
            <p className="text-xs sm:text-sm text-[#384360] leading-relaxed">
              <span dangerouslySetInnerHTML={{ __html: formatInline(numMatch[2]) }} />
            </p>
          </div>
        );
      }
    } else {
      flushList();
      elements.push(
        <p key={idx} className="text-xs sm:text-sm text-[#384360] leading-relaxed my-1.5">
          <span dangerouslySetInnerHTML={{ __html: formatInline(line) }} />
        </p>
      );
    }
  });

  flushList();

  return <div className="space-y-0.5">{elements}</div>;
}

export default function DecisionChatStream({
  messages,
  loading,
  isWebSearchActive = false,
  onSelectSuggestion,
  onConvertToMatrix,
  onDeepResearch
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  return (
    <div className="space-y-4 pb-2">
      {messages.map((msg, index) => {
        const isUser = msg.role === 'user';

        if (isUser) {
          return (
            <div key={msg.id || index} className="flex justify-end items-start gap-2.5">
              <div className="max-w-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] text-white rounded-2xl rounded-tr-none px-4 py-2.5 shadow-sm text-xs sm:text-sm leading-relaxed">
                {msg.content}
              </div>
              <div className="w-7 h-7 rounded-full bg-[#17213D] text-white flex items-center justify-center shrink-0 shadow-xs text-xs font-bold">
                <User className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        }

        const data = msg.decisionData || {};
        const hasAlternatives = Array.isArray(data.alternatives) && data.alternatives.length > 0;
        const hasCriteria = Array.isArray(data.criteria) && data.criteria.length > 0;
        const hasPrompts = Array.isArray(data.followUpPrompts) && data.followUpPrompts.length > 0;

        return (
          <div key={msg.id || index} className="flex items-start gap-3">
            {/* VERA 24K HD Logo Avatar */}
            <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E6F5] p-0.5 flex items-center justify-center shrink-0 shadow-xs mt-0.5 overflow-hidden">
              <img src="/vera-logo-icon.png" alt="VERA" className="w-full h-full object-contain rounded-lg" />
            </div>

            <div className="flex-1 max-w-3xl space-y-3">
              {/* Main Response Box */}
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-[#E2E6F5] space-y-3.5">
                {/* Header tag */}
                <div className="flex items-center justify-between pb-2.5 border-b border-[#F0F2FA]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#7B61FF] flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" />
                      VERA Decision Intelligence
                    </span>
                    {data.title && (
                      <span className="text-[11px] text-[#8C95AA] hidden sm:inline">• {data.title}</span>
                    )}
                    {data.webSearchUsed && (
                      <span className="text-[10px] font-semibold text-[#059669] bg-[#ECFDF5] px-2 py-0.5 rounded-full border border-[#A7F3D0] flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        Web Researched
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#A0A8BF]">Evidence-Guided</span>
                </div>

                {/* Short, cozy Markdown text */}
                <MarkdownBlock content={msg.content} />

                {/* Clean Candidate Alternatives Cards */}
                {hasAlternatives && (
                  <div className="pt-2.5 border-t border-[#F0F2FA] space-y-2">
                    <div className="text-[11px] font-bold text-[#17213D] uppercase tracking-wider flex items-center gap-1.5">
                      <Layers className="w-3 h-3 text-[#7B61FF]" />
                      Candidate Pathways ({data.alternatives.length})
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {data.alternatives.map((alt, altIdx) => (
                        <div
                          key={altIdx}
                          className="p-2.5 rounded-xl bg-[#F8F9FE] border border-[#E2E6F5] hover:border-[#7B61FF]/40 transition-colors"
                        >
                          <div className="text-xs font-bold text-[#17213D] truncate">
                            {alt.name}
                          </div>
                          {alt.description && (
                            <div className="text-[11px] text-[#5E6882] mt-0.5 line-clamp-2 leading-relaxed">
                              {alt.description}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verified Web Sources & Benchmark Cards */}
                {Array.isArray(data.sources) && data.sources.length > 0 && (
                  <div className="pt-2.5 border-t border-[#F0F2FA] space-y-2">
                    <div className="text-[11px] font-bold text-[#17213D] uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3 h-3 text-[#7B61FF]" />
                        <span>Verified Web Sources & Benchmarks ({data.sources.length})</span>
                      </div>
                      <span className="text-[10px] font-medium text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
                        Live Web Grounding
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {data.sources.map((src, srcIdx) => (
                        <a
                          key={srcIdx}
                          href={src.url || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-[#F8F9FE] border border-[#E2E6F5] hover:border-[#7B61FF] hover:bg-[#EEF0FD]/40 transition-all group block text-left"
                        >
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-[10px] font-bold text-[#7B61FF] truncate">
                              {src.domain || 'External Source'}
                            </span>
                            <ExternalLink className="w-2.5 h-2.5 text-[#8C95AA] group-hover:text-[#7B61FF] shrink-0 transition-colors" />
                          </div>
                          <div className="text-xs font-semibold text-[#17213D] line-clamp-1 group-hover:text-[#6366F1] transition-colors">
                            {src.title}
                          </div>
                          {src.snippet && (
                            <p className="text-[11px] text-[#5E6882] mt-1 line-clamp-2 leading-relaxed">
                              {src.snippet}
                            </p>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clean Criteria Chips */}
                {hasCriteria && (
                  <div className="pt-2.5 border-t border-[#F0F2FA] space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-bold text-[#17213D] uppercase tracking-wider flex items-center gap-1.5">
                        <Sliders className="w-3 h-3 text-[#7B61FF]" />
                        Key Factors & Weights
                      </div>
                      <span className="text-[10px] font-bold text-[#7B61FF] bg-[#EEF0FD] px-2 py-0.5 rounded-full">
                        100% Total
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.criteria.map((crit, critIdx) => (
                        <div
                          key={critIdx}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F4F6FD] border border-[#E2E6F5] text-xs"
                        >
                          <span className="font-semibold text-[#17213D]">{crit.name}</span>
                          <span className="px-1 py-0.2 rounded bg-white font-bold text-[#6366F1] text-[10px] shadow-2xs">
                            {crit.weight}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Direct Action Buttons */}
                <div className="pt-2.5 border-t border-[#F0F2FA] flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onConvertToMatrix && (
                      <button
                        type="button"
                        onClick={() => onConvertToMatrix(data)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7B61FF] hover:bg-[#6D52F7] text-white text-xs font-semibold shadow-2xs transition-all hover:scale-[1.01]"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Build Matrix</span>
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] text-[#8C95AA]">
                    Empirical Analysis Ready
                  </span>
                </div>
              </div>

              {/* Quick Suggestion Pills */}
              {hasPrompts && (
                <div className="space-y-1.5 pl-1">
                  <div className="text-[10px] font-bold text-[#7C849A] uppercase tracking-wider flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[#7B61FF]" />
                    Quick Answers
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {data.followUpPrompts.map((promptText, pIdx) => (
                      <button
                        key={pIdx}
                        type="button"
                        onClick={() => onSelectSuggestion && onSelectSuggestion(promptText)}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#F4F6FD] text-xs font-medium text-[#4A5568] hover:text-[#7B61FF] border border-[#D5DAEA] hover:border-[#7B61FF] shadow-2xs transition-all text-left"
                      >
                        <span>{promptText}</span>
                        <ArrowRight className="w-2.5 h-2.5 opacity-60" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Typing / Loading Indicator */}
      {loading && (
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-white border border-[#E2E6F5] p-0.5 flex items-center justify-center shrink-0 shadow-xs overflow-hidden animate-pulse">
            <img src="/vera-logo-icon.png" alt="VERA" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div className="bg-white rounded-2xl px-4 py-3 shadow-xs border border-[#E2E6F5] flex items-center gap-2.5">
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-1.5 h-1.5 rounded-full bg-[#7B61FF] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-xs font-medium text-[#5E6882]">
              {isWebSearchActive
                ? '🌐 VERA is researching external websites, benchmarks & live evidence...'
                : 'VERA is structuring your decision options & trade-offs...'}
            </span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
