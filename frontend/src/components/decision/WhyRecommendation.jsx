import React from 'react';
import {
  HelpCircle,
  TrendingUp,
  Scale,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sliders,
  Sparkles,
  Info,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import Card from '../common/Card';
import Badge from '../common/Badge';

/**
 * WhyRecommendation Component
 * 
 * Provides an explainable, evidence-backed breakdown answering:
 * "Why did VERA recommend this option?"
 */
export default function WhyRecommendation({
  decision,
  analysis,
  recommended,
  rankings = [],
  criteria = [],
  evidenceList = [],
  aiInterpretation
}) {
  if (!recommended) return null;

  const winner = recommended.alternative || {};
  const winnerName = winner.name || 'Recommended Alternative';
  const runnerUp = rankings.length > 1 ? rankings[1] : null;

  // 1. Top contributing criteria sorted by weighted score descending
  const sortedContributions = [...(recommended.criterionScores || [])].sort(
    (a, b) => (b.weightedScore || 0) - (a.weightedScore || 0)
  );

  // 2. Score difference
  const scoreDiff = runnerUp
    ? Math.round(((recommended.overallScore || 0) - (runnerUp.overallScore || 0)) * 100) / 100
    : null;

  // 3. Stored Supporting & Conflicting Evidence for winner
  const supportingEvidence = evidenceList.filter((ev) => {
    const dir = (ev.evidence_direction || ev.evidenceDirection || '').toUpperCase();
    const evAlt = (ev.supporting_alternative || ev.supportingAlternative || '').trim().toLowerCase();
    const wName = winnerName.trim().toLowerCase();
    return dir === 'SUPPORTING' && (evAlt === wName || !evAlt || evAlt === 'all');
  });

  const conflictingEvidence = evidenceList.filter((ev) => {
    const dir = (ev.evidence_direction || ev.evidenceDirection || '').toUpperCase();
    const evAlt = (ev.supporting_alternative || ev.supportingAlternative || '').trim().toLowerCase();
    const wName = winnerName.trim().toLowerCase();
    return dir === 'CONFLICTING' && (evAlt === wName || !evAlt || evAlt === 'all');
  });

  // 6. Trade-offs: where the winner conceded points to runner-up
  const concessions = [];
  if (runnerUp && runnerUp.criterionScores) {
    recommended.criterionScores?.forEach((winnerCs) => {
      const runnerCs = runnerUp.criterionScores?.find(
        (rcs) => rcs.criterionName === winnerCs.criterionName
      );
      if (runnerCs && runnerCs.weightedScore > winnerCs.weightedScore) {
        const gap = Math.round((runnerCs.weightedScore - winnerCs.weightedScore) * 10) / 10;
        concessions.push({
          criterion: winnerCs.criterionName,
          gap,
          winnerRaw: winnerCs.rawValue,
          runnerRaw: runnerCs.rawValue,
          weight: winnerCs.weight
        });
      }
    });
  }

  // Helper to trace stored evidence to a specific criterion without inventing statements
  const getEvidenceForCriterion = (critName) => {
    const cLower = critName.toLowerCase();
    return evidenceList.filter((ev) => {
      const text = ((ev.title || '') + ' ' + (ev.evidence_text || ev.evidenceText || '')).toLowerCase();
      const evAlt = (ev.supporting_alternative || ev.supportingAlternative || '').toLowerCase();
      const wLower = winnerName.toLowerCase();
      return text.includes(cLower) || (evAlt.includes(wLower) && text.includes(cLower));
    });
  };

  return (
    <Card className="p-6 mb-8 border-vera-border bg-surface-elevated shadow-vera-sm">
      {/* SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-6 border-b border-vera-border gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-vera-accent-soft border border-vera-accent/20 text-vera-accent">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-vera-primary">Why this recommendation?</h3>
              <Badge variant="accent" size="sm">Explainability Trace</Badge>
            </div>
            <p className="text-xs text-vera-secondary mt-0.5">
              Empirical trace linking deterministic rankings, score spreads, and stored citations to &ldquo;{winnerName}&rdquo;
            </p>
          </div>
        </div>

        {/* 2. SCORE DIFFERENCE CHIP */}
        {runnerUp && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface border border-vera-border self-start sm:self-auto text-xs">
            <TrendingUp className="w-3.5 h-3.5 text-vera-accent" />
            <span className="text-vera-secondary">Lead Margin:</span>
            <span className="font-mono font-semibold text-vera-primary">
              +{scoreDiff} pts
            </span>
            <span className="text-vera-muted">
              over {runnerUp.alternative?.name}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. TOP CONTRIBUTING CRITERIA & EVIDENCE TRACE */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-vera-secondary flex items-center gap-2">
              <Sliders className="w-3.5 h-3.5 text-vera-accent" />
              1. Top Contributing Criteria & Evidence Trace
            </h4>
            <span className="text-[11px] text-vera-muted">
              Ranked by weighted contribution
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {sortedContributions.map((cs, idx) => {
              const matchedEvidence = getEvidenceForCriterion(cs.criterionName);
              const isTopDriver = idx === 0;

              return (
                <div
                  key={cs.criterionId || cs.criterionName}
                  className={`p-3.5 rounded-2xl border transition-colors ${
                    isTopDriver
                      ? 'bg-vera-accent-soft/30 border-vera-accent/30 shadow-vera-sm'
                      : 'bg-surface border-vera-border'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-semibold text-vera-primary truncate mr-2" title={cs.criterionName}>
                      {cs.criterionName}
                    </span>
                    <Badge variant={isTopDriver ? 'accent' : 'neutral'} size="sm">
                      +{cs.weightedScore?.toFixed(1)} pts
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-[11px] text-[#557662] font-medium mb-2.5">
                    <span>↑</span>
                    <span>
                      {cs.weightedScore >= 25
                        ? 'Strong positive contribution'
                        : cs.weightedScore >= 15
                        ? 'Moderate positive contribution'
                        : 'Supporting contribution'}
                    </span>
                    <span className="text-vera-muted font-normal">({cs.weight}% weight)</span>
                  </div>

                  {/* EVIDENCE TRACE BLOCK */}
                  <div className="pt-2 border-t border-vera-border-subtle">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-vera-muted block mb-1">
                      Evidence Trace:
                    </span>
                    {matchedEvidence.length > 0 ? (
                      <div className="space-y-1.5">
                        {matchedEvidence.slice(0, 1).map((ev) => (
                          <div
                            key={ev.id}
                            className="p-2 rounded-xl bg-surface-elevated border border-vera-border text-[11px] space-y-0.5"
                          >
                            <span className="text-vera-primary font-medium block truncate" title={ev.title}>
                              {ev.title}
                            </span>
                            <span className="text-[10px] text-vera-muted block truncate">
                              Source: {ev.source}
                            </span>
                            <p className="text-[10px] text-vera-secondary italic line-clamp-2">
                              &ldquo;{ev.evidence_text || ev.evidenceText}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[10px] text-vera-muted italic">
                        No stored empirical citations linked to this specific criterion.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2 & 7: SCORE SPREAD & CONFIDENCE SUMMARY BAR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SCORE DIFFERENCE SUMMARY */}
          <div className="p-4 rounded-2xl bg-surface border border-vera-border space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-vera-secondary flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-vera-accent" />
              2. Score Margin & Relative Lead
            </h4>
            {runnerUp ? (
              <div className="space-y-1.5 text-xs text-vera-secondary">
                <p>
                  <strong className="text-vera-primary">{winnerName}</strong> achieved an overall score of{' '}
                  <span className="font-mono text-vera-primary font-semibold">{recommended.overallScore}</span>, leading runner-up{' '}
                  <strong className="text-vera-primary">{runnerUp.alternative?.name}</strong> ({runnerUp.overallScore}) by a margin of{' '}
                  <span className="font-mono text-vera-accent font-semibold">+{scoreDiff} points</span>.
                </p>
                <div className="w-full bg-secondary-bg rounded-full h-2 overflow-hidden mt-2">
                  <div
                    className="bg-vera-accent h-2 rounded-full"
                    style={{ width: `${Math.min(100, Math.max(10, (scoreDiff / (recommended.overallScore || 1)) * 100))}%` }}
                  />
                </div>
                <span className="text-[10px] text-vera-muted block">
                  Relative competitive spread over second-place alternative.
                </span>
              </div>
            ) : (
              <p className="text-xs text-vera-muted italic">Single alternative evaluated.</p>
            )}
          </div>

          {/* CONFIDENCE BREAKDOWN */}
          <div className="p-4 rounded-2xl bg-surface border border-vera-border space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-vera-secondary flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#557662]" />
                3. System Confidence & Certainty
              </h4>
              <Badge variant="success" size="sm">{analysis?.confidence || 80}%</Badge>
            </div>
            <div className="space-y-1.5 text-xs text-vera-secondary">
              <p>
                Decision engine confidence is calculated mathematically from lead margin separation, evidence volume, and criteria variance.
              </p>
              <div className="w-full bg-secondary-bg rounded-full h-2 overflow-hidden mt-2">
                <div
                  className="bg-[#789884] h-2 rounded-full"
                  style={{ width: `${analysis?.confidence || 80}%` }}
                />
              </div>
              <span className="text-[10px] text-vera-muted block">
                Derived from deterministic variance models and verified empirical records.
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
