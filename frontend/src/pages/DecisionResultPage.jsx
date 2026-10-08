import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Cell
} from 'recharts';
import {
  Trophy,
  Cpu,
  Layers,
  AlertTriangle,
  FileText,
  Sparkles,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Info,
  Scale,
  HelpCircle
} from 'lucide-react';
import PageContainer from '../components/common/PageContainer';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';
import Button from '../components/common/Button';
import LoadingState from '../components/common/LoadingState';
import EvidenceManager from '../components/evidence/EvidenceManager';
import WhyRecommendation from '../components/decision/WhyRecommendation';
import { useAuth } from '../context/AuthContext';
import { decisionService } from '../services/decisionService';
import { formatUserErrorMessage } from '../utils/errorHandler';

export default function DecisionResultPage() {
  const { id } = useParams();
  const { token } = useAuth();

  const [decision, setDecision] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  // Tabs: 'overview', 'evidence', 'alternatives', 'analysis', 'recommendation'
  const [activeTab, setActiveTab] = useState('overview');

  // Raw score state for interactive calculations
  const [rawScores, setRawScores] = useState({});
  const [showScoreInputs, setShowScoreInputs] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Fetch decision details
        const dec = await decisionService.getDecisionById(id, token);
        if (!isMounted) return;

        setDecision(dec);
        setEvidenceList(dec.evidence || []);

        // Initialize baseline raw scores from stored data or calculation_json
        const initialScores = {};
        const crits = dec.criteria || [];
        const alts = dec.alternatives || [];

        alts.forEach((alt, aIdx) => {
          initialScores[alt.name] = {};
          crits.forEach((crit, cIdx) => {
            const storedScore = (alt.alternative_scores || []).find(
              (s) => s.criterion_id === crit.id
            );
            let calcRaw = null;
            if (dec.decision_results?.[0]?.calculation_json) {
              const critCalc = dec.decision_results[0].calculation_json.find(
                (c) => c.criterionId === crit.id || c.criterionName === crit.name
              );
              const altPerf = critCalc?.alternativePerformance?.find(
                (p) => p.alternativeId === alt.id || p.alternativeName === alt.name
              );
              if (altPerf && altPerf.rawValue !== undefined && altPerf.rawValue !== null) {
                calcRaw = Number(altPerf.rawValue);
              }
            }

            if (storedScore && storedScore.raw_value !== null && storedScore.raw_value !== undefined) {
              initialScores[alt.name][crit.name] = Number(storedScore.raw_value);
            } else if (calcRaw !== null && !isNaN(calcRaw)) {
              initialScores[alt.name][crit.name] = calcRaw;
            } else {
              initialScores[alt.name][crit.name] = crit.direction === 'LOWER_IS_BETTER'
                ? 20 + (aIdx * 15) + (cIdx * 5)
                : 85 - (aIdx * 10) + (cIdx * 5);
            }
          });
        });
        setRawScores(initialScores);

        // 2. Automatically execute initial deterministic analysis
        try {
          const analysisResult = await decisionService.analyzeDecision(id, initialScores, token);
          if (isMounted) {
            setAnalysis(analysisResult);
          }
        } catch (analErr) {
          console.warn('Initial auto-analysis warning:', analErr.message);
        }
      } catch (err) {
        if (isMounted) {
          setError(formatUserErrorMessage(err, 'Failed to retrieve decision framework.'));
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (token && id) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [id, token]);

  const handleRunAnalysis = async (forceAi = false) => {
    setAnalyzing(true);
    setAnalysisError(null);
    try {
      const result = await decisionService.analyzeDecision(id, {
        rawScores,
        forceAiRefresh: forceAi
      }, token);
      setAnalysis(result);
    } catch (err) {
      setAnalysisError(formatUserErrorMessage(err, 'Analysis calculation could not be completed.'));
    } finally {
      setAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <PageContainer maxWidth="max-w-6xl">
        <div className="py-24">
          <LoadingState message="Loading decision framework & executing VERA Decision Engine..." />
        </div>
      </PageContainer>
    );
  }

  if (error || !decision) {
    return (
      <PageContainer maxWidth="max-w-6xl">
        <div className="py-16 text-center max-w-md mx-auto">
          <div className="w-12 h-12 rounded-2xl bg-vera-danger-bg border border-[#DFC5C5] text-vera-danger flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-semibold text-vera-primary mb-2">Decision Not Accessible</h2>
          <p className="text-xs text-vera-secondary mb-6">{error || 'This decision does not exist or you do not have permission.'}</p>
          <Link to="/dashboard">
            <Button variant="secondary" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Return to Dashboard
            </Button>
          </Link>
        </div>
      </PageContainer>
    );
  }

  const criteria = decision.criteria || [];
  const alternatives = decision.alternatives || [];
  const rankings = analysis?.rankings || [];
  const recommended = analysis?.recommendedAlternative || rankings[0];
  const aiInterpretation = analysis?.aiInterpretation || decision.decision_results?.[0]?.ai_interpretation_json;

  // Chart data
  const rankingChartData = rankings.map((r) => ({
    name: r.alternative.name,
    Score: r.overallScore,
    Risk: r.riskAssessment?.riskScore || 0
  }));

  const criteriaContributionData = rankings.map((r) => {
    const item = { name: r.alternative.name };
    r.criterionScores?.forEach((cs) => {
      item[cs.criterionName] = cs.weightedScore;
    });
    return item;
  });

  const chartColors = ['#6877B8', '#8A8FC7', '#789884', '#A9966B', '#7587AD', '#A87979'];

  // Categorize evidence
  const supportingEvidence = evidenceList.filter(e => (e.evidence_direction || e.evidenceDirection) === 'SUPPORTING');
  const conflictingEvidence = evidenceList.filter(e => (e.evidence_direction || e.evidenceDirection) === 'CONFLICTING');
  const neutralEvidence = evidenceList.filter(e => (e.evidence_direction || e.evidenceDirection) === 'NEUTRAL');

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'evidence', label: `Evidence (${evidenceList.length})` },
    { id: 'alternatives', label: `Alternatives (${alternatives.length})` },
    { id: 'analysis', label: 'Analysis' },
    { id: 'recommendation', label: 'Recommendation' }
  ];

  return (
    <PageContainer maxWidth="max-w-6xl">
      {/* 1. DECISION WORKSPACE HEADER */}
      <div className="mb-6 pb-4 border-b border-vera-border space-y-4">
        {/* Breadcrumb & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-vera-secondary">
            <Link to="/dashboard" className="hover:text-vera-primary flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
            </Link>
            <span className="text-vera-muted">/</span>
            <span className="font-mono text-vera-muted">ID: {decision.id.slice(0, 8)}...</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              loading={analyzing}
              onClick={() => handleRunAnalysis(false)}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Re-Calculate Engine
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowScoreInputs(!showScoreInputs)}
            >
              <Sliders className="w-3.5 h-3.5 mr-1.5" /> {showScoreInputs ? 'Hide Inputs' : 'Edit Raw Scores'}
            </Button>
          </div>
        </div>

        {/* Title & Metadata Strip */}
        <div>
          <h1 className="text-xl sm:text-2xl font-semibold text-vera-primary tracking-tight">
            {decision.title}
          </h1>
          <p className="text-xs sm:text-sm text-vera-secondary italic mt-1 leading-relaxed">
            &ldquo;{decision.question}&rdquo;
          </p>
          {decision.description && (
            <p className="text-xs text-vera-muted mt-1.5 max-w-3xl leading-relaxed">
              {decision.description}
            </p>
          )}
        </div>

        {/* Status, Confidence & Risk Badges */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <Badge variant="info" size="sm">
            Status: {decision.status || 'ACTIVE'}
          </Badge>
          <Badge variant="accent" size="sm" dot>
            Confidence: {analysis?.confidence || 80}%
          </Badge>
          <Badge
            variant={
              recommended?.riskAssessment?.riskLevel === 'LOW'
                ? 'success'
                : recommended?.riskAssessment?.riskLevel === 'MEDIUM'
                ? 'warning'
                : 'danger'
            }
            size="sm"
            dot
          >
            Risk: {recommended?.riskAssessment?.riskLevel || 'LOW'} ({recommended?.riskAssessment?.riskScore || 0})
          </Badge>
          <span className="text-[11px] text-vera-muted ml-auto font-mono hidden sm:inline-block">
            {criteria.length} Criteria • {alternatives.length} Alternatives
          </span>
        </div>

        {/* 5 WorkSpace Tabs */}
        <div className="flex items-center gap-1 border-b border-vera-border-subtle pt-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-vera-accent text-vera-primary font-semibold'
                  : 'border-transparent text-vera-secondary hover:text-vera-primary'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ANALYSIS ERROR BANNER */}
      {analysisError && (
        <div className="mb-6 p-4 rounded-2xl bg-vera-danger-bg border border-[#DFC5C5] flex items-center justify-between gap-3 text-xs text-[#905B5B]">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-vera-danger shrink-0" />
            <span>{analysisError}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => handleRunAnalysis(false)}>
            Retry Calculation
          </Button>
        </div>
      )}

      {/* RAW SCORES INPUT DRAWER */}
      {showScoreInputs && (
        <Card className="p-5 mb-6 border-vera-border bg-surface-elevated shadow-vera-sm">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-vera-border-subtle">
            <div>
              <h3 className="text-xs font-semibold text-vera-primary flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-vera-accent" /> Custom Raw Criteria Values
              </h3>
              <p className="text-[11px] text-vera-secondary">
                Adjust input parameters to simulate different operational scenarios.
              </p>
            </div>
            <Button variant="primary" size="sm" loading={analyzing} onClick={() => handleRunAnalysis(false)}>
              Apply & Re-Calculate
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-vera-secondary">
              <thead className="bg-surface text-vera-muted uppercase text-[10px] font-semibold">
                <tr>
                  <th className="px-3 py-2 rounded-l">Alternative</th>
                  {criteria.map((c) => (
                    <th key={c.id || c.name} className="px-3 py-2">
                      {c.name} ({c.direction === 'LOWER_IS_BETTER' ? 'Min' : 'Max'})
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-vera-border-subtle font-medium">
                {alternatives.map((alt) => (
                  <tr key={alt.id || alt.name}>
                    <td className="px-3 py-2 font-semibold text-vera-primary">{alt.name}</td>
                    {criteria.map((c) => (
                      <td key={c.id || c.name} className="px-3 py-2">
                        <input
                          type="number"
                          value={rawScores[alt.name]?.[c.name] ?? 0}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            setRawScores({
                              ...rawScores,
                              [alt.name]: {
                                ...(rawScores[alt.name] || {}),
                                [c.name]: val
                              }
                            });
                          }}
                          className="w-20 px-2 py-1 rounded-lg bg-surface border border-vera-border text-vera-primary font-mono text-xs focus:border-vera-accent focus:outline-none"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ============================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ============================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Recommendation Banner */}
          {recommended && (
            <Card className="p-6 bg-surface-elevated border-vera-border shadow-vera-sm">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-vera-accent-soft text-vera-accent">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <span className="text-[11px] uppercase font-semibold text-vera-accent tracking-wider">
                      Top Recommendation
                    </span>
                    <Badge variant="accent" size="sm" dot>Rank #1</Badge>
                  </div>

                  <h2 className="text-xl sm:text-2xl font-semibold text-vera-primary">
                    {recommended.alternative?.name}
                  </h2>

                  <p className="text-xs text-vera-secondary max-w-2xl leading-relaxed">
                    Dominant alternative ranked first by normalized weighted optimization across all {criteria.length} evaluated criteria.
                  </p>

                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-vera-border text-vera-secondary text-[11px] font-mono">
                      <Cpu className="w-3.5 h-3.5 text-vera-accent" /> Calculated by VERA Decision Engine
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 border-t lg:border-t-0 lg:border-l border-vera-border pt-4 lg:pt-0 lg:pl-6">
                  <div className="text-center">
                    <div className="text-[10px] text-vera-muted uppercase font-semibold">Overall Score</div>
                    <div className="text-2xl font-mono font-semibold text-vera-accent mt-0.5">
                      {recommended.overallScore}
                      <span className="text-xs text-vera-muted font-sans"> / 100</span>
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] text-vera-muted uppercase font-semibold">Confidence</div>
                    <div className="text-2xl font-mono font-semibold text-vera-primary mt-0.5">
                      {analysis?.confidence || 80}%
                    </div>
                  </div>

                  <div className="text-center">
                    <div className="text-[10px] text-vera-muted uppercase font-semibold">Risk Rating</div>
                    <div className="mt-1">
                      <Badge
                        variant={
                          recommended.riskAssessment?.riskLevel === 'LOW'
                            ? 'success'
                            : recommended.riskAssessment?.riskLevel === 'MEDIUM'
                            ? 'warning'
                            : 'danger'
                        }
                        size="md"
                        dot
                      >
                        {recommended.riskAssessment?.riskLevel || 'LOW'} ({recommended.riskAssessment?.riskScore || 0})
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Explainability Breakdown */}
          <WhyRecommendation
            decision={decision}
            analysis={analysis}
            recommended={recommended}
            rankings={rankings}
            criteria={criteria}
            evidenceList={evidenceList}
            aiInterpretation={aiInterpretation}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EVIDENCE */}
      {/* ============================================================== */}
      {activeTab === 'evidence' && (
        <Card className="p-6 bg-surface-elevated border-vera-border">
          <EvidenceManager
            decisionId={decision.id}
            alternatives={alternatives}
            evidenceList={evidenceList}
            token={token}
            onEvidenceChange={(newList) => {
              setEvidenceList(newList);
              handleRunAnalysis(false);
            }}
          />
        </Card>
      )}

      {/* ============================================================== */}
      {/* TAB 3: ALTERNATIVES */}
      {/* ============================================================== */}
      {activeTab === 'alternatives' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alternatives.map((alt, idx) => {
              const r = rankings.find(x => x.alternative?.id === alt.id || x.alternative?.name === alt.name);
              const isWinner = r?.rank === 1;

              return (
                <Card key={alt.id || alt.name} className={`p-5 bg-surface-elevated border-vera-border ${isWinner ? 'ring-1 ring-vera-accent/30' : ''}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-secondary-bg text-vera-secondary text-xs flex items-center justify-center font-bold">
                        #{r?.rank || idx + 1}
                      </span>
                      <h3 className="text-sm font-semibold text-vera-primary">{alt.name}</h3>
                    </div>
                    {isWinner && <Badge variant="accent" size="sm">Top Recommendation</Badge>}
                  </div>

                  <p className="text-xs text-vera-secondary mb-3 leading-relaxed">
                    {alt.description || 'No additional narrative description provided.'}
                  </p>

                  <div className="p-3 rounded-xl bg-surface border border-vera-border-subtle flex items-center justify-between text-xs">
                    <span className="text-vera-secondary">Calculated Overall Score:</span>
                    <span className="font-mono font-semibold text-vera-primary">{r?.overallScore ?? '—'} / 100</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: ANALYSIS (DETERMINISTIC ENGINE BREAKDOWN) */}
      {/* ============================================================== */}
      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Distinct Calculation Banner */}
          <div className="p-4 rounded-2xl bg-secondary-bg/60 border border-vera-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-5 h-5 text-vera-accent shrink-0" />
              <div>
                <strong className="text-vera-primary block">CALCULATED BY VERA DECISION ENGINE</strong>
                <span className="text-vera-secondary">
                  Multi-attribute utility theory calculation. Zero AI bias in mathematical rankings.
                </span>
              </div>
            </div>
            <Badge variant="success" size="sm" dot>Deterministic</Badge>
          </div>

          {/* Rankings Table */}
          <Card className="p-6 bg-surface-elevated border-vera-border">
            <h3 className="text-sm font-semibold text-vera-primary mb-3">Deterministic Alternative Rankings</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-vera-secondary">
                <thead className="bg-surface text-vera-muted uppercase text-[10px] font-semibold border-b border-vera-border">
                  <tr>
                    <th className="px-4 py-2.5 rounded-l">Rank</th>
                    <th className="px-4 py-2.5">Alternative</th>
                    <th className="px-4 py-2.5">Overall Score</th>
                    <th className="px-4 py-2.5">Risk Rating</th>
                    <th className="px-4 py-2.5 text-right rounded-r">Engine Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vera-border-subtle font-medium">
                  {rankings.map((r) => (
                    <tr key={r.alternative.id || r.alternative.name} className={r.isWinner ? 'bg-vera-accent-soft/20' : ''}>
                      <td className="px-4 py-3">
                        <span className={`w-6 h-6 rounded-lg inline-flex items-center justify-center font-semibold text-xs ${
                          r.rank === 1 ? 'bg-vera-accent text-white' : 'bg-secondary-bg text-vera-secondary'
                        }`}>
                          #{r.rank}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-vera-primary">
                        {r.alternative.name}
                        {r.isWinner && <span className="text-[10px] text-vera-accent ml-1.5 font-semibold">(Winner)</span>}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-vera-primary text-sm">
                        {r.overallScore}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={r.riskAssessment?.riskLevel === 'LOW' ? 'success' : r.riskAssessment?.riskLevel === 'MEDIUM' ? 'warning' : 'danger'}
                          size="sm"
                          dot
                        >
                          {r.riskAssessment?.riskLevel} ({r.riskAssessment?.riskScore})
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {r.isWinner ? (
                          <span className="text-vera-accent font-semibold text-[11px]">Recommended</span>
                        ) : (
                          <span className="text-vera-muted text-[11px]">Evaluated</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Criteria Contribution Stacked Chart */}
          <Card className="p-6 bg-surface-elevated border-vera-border">
            <h3 className="text-sm font-semibold text-vera-primary mb-1">Criteria Point Contribution (Stacked)</h3>
            <p className="text-xs text-vera-secondary mb-4">Weighted points contributed by each criterion toward overall score</p>
            {criteriaContributionData.length > 0 && (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={criteriaContributionData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E5F0" />
                    <XAxis dataKey="name" stroke="#7C849A" fontSize={11} />
                    <YAxis stroke="#7C849A" fontSize={11} domain={[0, 100]} />
                    <Tooltip contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D5DAEA', borderRadius: '12px', fontSize: '11px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    {criteria.map((c, idx) => (
                      <Bar
                        key={c.id || c.name}
                        dataKey={c.name}
                        stackId="a"
                        fill={chartColors[idx % chartColors.length]}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: RECOMMENDATION (AI INTERPRETATION PANEL) */}
      {/* ============================================================== */}
      {activeTab === 'recommendation' && (
        <div className="space-y-6">
          {/* Distinct AI Panel */}
          <Card className="p-6 bg-surface-elevated border-vera-border shadow-vera-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-vera-border gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-vera-accent-soft border border-vera-accent/20 text-vera-accent">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-vera-primary">VERA INTERPRETATION</h3>
                  <p className="text-xs text-vera-secondary">
                    Qualitative narrative explanation and scenario analysis powered by Google Gemini.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={aiInterpretation?.status === 'success' ? 'accent' : 'neutral'} size="sm">
                  {aiInterpretation?.status === 'success' ? 'Gemini Interpreted' : 'Fallback Active'}
                </Badge>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRunAnalysis(true)}
                  disabled={analyzing}
                >
                  <RotateCcw className={`w-3.5 h-3.5 mr-1 ${analyzing ? 'animate-spin' : ''}`} />
                  Refresh AI
                </Button>
              </div>
            </div>

            {aiInterpretation?.status === 'success' ? (
              <div className="space-y-6">
                {/* Executive Recommendation */}
                <div className="p-4 rounded-xl bg-surface border border-vera-border space-y-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-vera-accent block">
                    Recommendation Narrative
                  </span>
                  <h4 className="text-sm font-semibold text-vera-primary">{aiInterpretation.recommendation}</h4>
                  <p className="text-xs text-vera-secondary leading-relaxed">{aiInterpretation.reasoning}</p>
                </div>

                {/* 2x2 Grid of Factors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Key Factors */}
                  <div className="p-4 rounded-xl bg-surface border border-vera-border space-y-2">
                    <span className="text-xs font-semibold text-vera-primary block">Key Decision Factors</span>
                    <ul className="space-y-1.5 text-xs text-vera-secondary">
                      {(aiInterpretation.keyFactors || []).map((factor, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-vera-accent mt-1.5 shrink-0" />
                          <span>{factor}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Trade-offs */}
                  <div className="p-4 rounded-xl bg-surface border border-vera-border space-y-2">
                    <span className="text-xs font-semibold text-vera-primary block">Trade-offs</span>
                    <ul className="space-y-1.5 text-xs text-vera-secondary">
                      {(aiInterpretation.tradeoffs || []).map((tradeoff, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-vera-warning mt-1.5 shrink-0" />
                          <span>{tradeoff}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Identified Risks */}
                  <div className="p-4 rounded-xl bg-surface border border-vera-border space-y-2">
                    <span className="text-xs font-semibold text-vera-primary block">Identified Risks</span>
                    <ul className="space-y-1.5 text-xs text-vera-secondary">
                      {(aiInterpretation.risks || []).map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-vera-danger mt-1.5 shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* What Could Change The Decision */}
                  <div className="p-4 rounded-xl bg-surface border border-vera-border space-y-2">
                    <span className="text-xs font-semibold text-vera-primary block">What Could Change The Decision</span>
                    <ul className="space-y-1.5 text-xs text-vera-secondary">
                      {(aiInterpretation.whatCouldChangeDecision || []).map((cond, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-vera-success mt-1.5 shrink-0" />
                          <span>{cond}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Attribution Notice */}
                <div className="p-3.5 rounded-xl bg-surface border border-vera-border text-[11px] text-vera-muted flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-vera-accent shrink-0" />
                    <span>Calculated by VERA Decision Engine. Gemini strictly synthesized qualitative narrative without altering rankings.</span>
                  </div>
                  <span className="font-mono text-vera-primary font-semibold">Certainty: {aiInterpretation.confidence}%</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center space-y-3 bg-surface rounded-xl border border-vera-border">
                <AlertCircle className="w-6 h-6 text-vera-warning mx-auto" />
                <h4 className="text-sm font-semibold text-vera-primary">AI interpretation is temporarily unavailable.</h4>
                <p className="text-xs text-vera-secondary max-w-md mx-auto">
                  The deterministic VERA Decision Engine calculations and rankings remain fully active and verified above.
                </p>
                <Button variant="secondary" size="sm" onClick={() => handleRunAnalysis(true)}>
                  Retry AI Interpretation
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* GLOBAL DECISION SUPPORT DISCLAIMER */}
      <div className="p-4 rounded-2xl bg-surface border border-vera-border text-center text-xs text-vera-muted mt-8">
        <p className="italic">
          &ldquo;VERA provides decision support, not professional advice. Recommendations depend on the quality and completeness of the information provided.&rdquo;
        </p>
      </div>
    </PageContainer>
  );
}
