import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  Plus,
  BarChart3,
  Layers,
  ChevronRight,
  Clock,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { decisionService } from '../services/decisionService';

export default function DetailedAnalysisPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    if (token) {
      decisionService.getDecisions(token)
        .then((data) => {
          if (isMounted) setDecisions(data || []);
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      setLoading(false);
    }
    return () => { isMounted = false; };
  }, [token]);

  const analyzedDecisions = decisions.filter(
    (d) => d.decision_results && d.decision_results.length > 0
  );

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 select-none">
      {/* Header Matching Screen 8 */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          Detailed Analysis
        </h1>
        <p className="text-xs sm:text-sm text-[#5E6882]">
          In-depth research and evaluation
        </p>
      </div>

      {analyzedDecisions.length === 0 ? (
        /* Empty State Matching Screen 8 Exactly */
        <div className="min-h-[420px] bg-white/80 rounded-3xl border border-[#E2E6F5] flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
          {/* Trending Line Chart Icon */}
          <div className="w-20 h-20 rounded-2xl bg-[#EEF0FD] border border-[#DDD6FE] flex items-center justify-center text-[#7B61FF] shadow-sm">
            <TrendingUp className="w-10 h-10" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-bold text-[#17213D] tracking-tight">
              No analysis yet
            </h2>
            <p className="text-xs text-[#5E6882] leading-relaxed">
              Create a decision first to see detailed analysis, comparisons, risks, what-if scenarios and more.
            </p>
          </div>

          <button
            type="button"
            onClick={() => navigate('/create-decision')}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:from-[#6D52F7] hover:to-[#5558E6] text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Start a new decision</span>
          </button>
        </div>
      ) : (
        /* List of Completed Analyses to Inspect */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#5E6882]">
              Select a verified evaluation to view full deterministic breakdown:
            </span>
            <button
              onClick={() => navigate('/create-decision')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#EEF0FD] text-[#7B61FF] text-xs font-semibold hover:bg-[#E0E7FF] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> New Analysis
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {analyzedDecisions.map((dec) => {
              const res = dec.decision_results[0];
              const score = res.overall_score ? Math.round(res.overall_score * 100) / 100 : 'N/A';

              return (
                <div
                  key={dec.id}
                  onClick={() => navigate(`/decision/${dec.id}`)}
                  className="bg-white rounded-2xl p-5 border border-[#E2E6F5] hover:border-[#7B61FF] shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-[#17213D] group-hover:text-[#7B61FF] transition-colors line-clamp-1">
                      {dec.title}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E4EEE7] text-[#789884] text-xs font-bold shrink-0">
                      Score: {score}
                    </span>
                  </div>

                  <p className="text-xs text-[#5E6882] line-clamp-2 leading-relaxed">
                    {dec.description || 'Full deterministic ranking, weight matrix, and risk mitigation roadmap.'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-[#7C849A] pt-2 border-t border-[#F0F2FA]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(dec.created_at).toLocaleDateString()}</span>
                    </div>
                    <span className="font-semibold text-[#7B61FF] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                      Open Report <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
