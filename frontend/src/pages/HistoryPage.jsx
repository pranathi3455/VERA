import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ArrowRight,
  PlusCircle,
  Calendar,
  ShieldCheck,
  AlertTriangle,
  Trophy,
  ArrowUpDown,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  RotateCcw,
  Sparkles,
  ChevronRight
} from 'lucide-react';
import PageContainer from '../components/common/PageContainer';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import EmptyState from '../components/common/EmptyState';
import LoadingState from '../components/common/LoadingState';
import { useAuth } from '../context/AuthContext';
import { decisionService } from '../services/decisionService';
import { formatUserErrorMessage } from '../utils/errorHandler';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();

  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search, Filter, Sort state
  const initialQuery = searchParams.get('q') || '';
  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'COMPLETED', 'IN_PROGRESS', 'HIGH_RISK'
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'score_desc', 'confidence_desc', 'title_asc'

  // Delete modal state
  const [decisionToDelete, setDecisionToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState(null);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await decisionService.getDecisions(token);
      setDecisions(data || []);
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Failed to retrieve decision history.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchDecisions();
    }
  }, [token]);

  // Extract recommendation info
  const getRecommendationInfo = (d) => {
    const result = d.decision_results?.[0];
    if (!result) {
      return {
        name: 'Pending Analysis',
        score: null,
        riskLevel: 'LOW',
        riskScore: null,
        confidence: null,
        hasResult: false
      };
    }

    let recName = result.ranking_json?.[0]?.alternative?.name;
    if (!recName && result.recommended_alternative_id && d.alternatives) {
      const found = d.alternatives.find((a) => a.id === result.recommended_alternative_id);
      recName = found?.name;
    }
    if (!recName && d.alternatives?.[0]) {
      recName = d.alternatives[0].name;
    }

    return {
      name: recName || 'Recommended Alternative',
      score: result.overall_score !== null && result.overall_score !== undefined ? Number(result.overall_score) : null,
      riskLevel: result.risk_level || 'LOW',
      riskScore: result.risk_score !== null && result.risk_score !== undefined ? Number(result.risk_score) : null,
      confidence: result.confidence !== null && result.confidence !== undefined ? Number(result.confidence) : null,
      hasResult: true
    };
  };

  const handleDeleteConfirm = async () => {
    if (!decisionToDelete) return;
    try {
      setDeleting(true);
      setDeleteError(null);
      await decisionService.deleteDecision(decisionToDelete.id, token);
      setDecisionToDelete(null);
      await fetchDecisions();
    } catch (err) {
      setDeleteError(formatUserErrorMessage(err, 'Failed to delete decision framework.'));
    } finally {
      setDeleting(false);
    }
  };

  const filteredDecisions = decisions.filter((d) => {
    const recInfo = getRecommendationInfo(d);
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      d.title?.toLowerCase().includes(searchLower) ||
      d.question?.toLowerCase().includes(searchLower) ||
      recInfo.name?.toLowerCase().includes(searchLower);

    let matchesFilter = true;
    if (filterType === 'COMPLETED') {
      matchesFilter = d.status === 'COMPLETED' || recInfo.hasResult;
    } else if (filterType === 'IN_PROGRESS') {
      matchesFilter = d.status === 'DRAFT' || (!recInfo.hasResult && d.status !== 'COMPLETED');
    } else if (filterType === 'HIGH_RISK') {
      matchesFilter = recInfo.riskLevel === 'HIGH';
    }

    return matchesSearch && matchesFilter;
  });

  const sortedDecisions = [...filteredDecisions].sort((a, b) => {
    const aInfo = getRecommendationInfo(a);
    const bInfo = getRecommendationInfo(b);

    switch (sortBy) {
      case 'newest':
        return new Date(b.created_at) - new Date(a.created_at);
      case 'oldest':
        return new Date(a.created_at) - new Date(b.created_at);
      case 'score_desc':
        return (bInfo.score || 0) - (aInfo.score || 0);
      case 'confidence_desc':
        return (bInfo.confidence || 0) - (aInfo.confidence || 0);
      case 'title_asc':
        return (a.title || '').localeCompare(b.title || '');
      default:
        return 0;
    }
  });

  const getRiskBadge = (level, score) => {
    if (!level) return <Badge variant="neutral" size="sm">—</Badge>;
    switch (level.toUpperCase()) {
      case 'LOW':
        return <Badge variant="success" size="sm" dot>Low Risk {score !== null && `(${score})`}</Badge>;
      case 'MEDIUM':
        return <Badge variant="warning" size="sm" dot>Med Risk {score !== null && `(${score})`}</Badge>;
      case 'HIGH':
        return <Badge variant="danger" size="sm" dot>High Risk {score !== null && `(${score})`}</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{level}</Badge>;
    }
  };

  const getStatusBadge = (status, hasResult) => {
    const s = (status || 'ACTIVE').toUpperCase();
    if (s === 'COMPLETED' || hasResult) {
      return <Badge variant="success" size="sm">Completed</Badge>;
    }
    if (s === 'DRAFT') {
      return <Badge variant="neutral" size="sm">Draft</Badge>;
    }
    return <Badge variant="info" size="sm">In Progress</Badge>;
  };

  // Group decisions by relative timeline: Today, Yesterday, Earlier
  const groupTimeline = (items) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterday = today - 86400000;

    const groups = { Today: [], Yesterday: [], Earlier: [] };
    items.forEach((item) => {
      const itemDate = new Date(item.created_at).getTime();
      if (itemDate >= today) {
        groups.Today.push(item);
      } else if (itemDate >= yesterday) {
        groups.Yesterday.push(item);
      } else {
        groups.Earlier.push(item);
      }
    });
    return groups;
  };

  const timelineGroups = groupTimeline(sortedDecisions);

  if (loading && decisions.length === 0) {
    return (
      <PageContainer>
        <div className="py-24">
          <LoadingState message="Loading your decision history & audit trail..." />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* SECTION HEADER MATCHING SCREEN 9 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
            History
          </h1>
          <p className="text-xs sm:text-sm text-[#5E6882]">
            View all your past research and decisions.
          </p>
        </div>
        {decisions.length > 0 && (
          <Link to="/create-decision">
            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] text-white text-xs font-semibold shadow-sm hover:scale-105 transition-all">
              + New Decision
            </button>
          </Link>
        )}
      </div>

      {error && (
        <div className="p-3.5 mb-6 rounded-2xl bg-[#FEECEB] border border-[#F8D2D0] text-xs text-[#903028] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#D32F2F] shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="outline" size="sm" onClick={fetchDecisions}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* EMPTY STATE MATCHING SCREEN 9 */}
      {!loading && decisions.length === 0 ? (
        <div className="min-h-[420px] bg-white/80 rounded-3xl border border-[#E2E6F5] flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-[#EEF0FD] border border-[#DDD6FE] flex items-center justify-center text-[#7B61FF] shadow-sm">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-1.5 max-w-md">
            <h2 className="text-xl font-bold text-[#17213D] tracking-tight">
              No history yet
            </h2>
            <p className="text-xs text-[#5E6882] leading-relaxed">
              Your past research and decisions will appear here after you start using VERA.
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* SEARCH, FILTER, SORT BAR */}
          <Card className="p-4 mb-6 bg-surface-elevated border-vera-border shadow-vera-sm">
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-vera-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search decisions by title, question, or recommendation..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary placeholder-vera-muted focus:outline-none focus:border-vera-accent transition-colors"
                />
              </div>

              {/* Filter pills & Sort selector */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Filter Selector */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary-bg/60 border border-vera-border text-xs">
                  {['ALL', 'COMPLETED', 'IN_PROGRESS', 'HIGH_RISK'].map((filterKey) => (
                    <button
                      key={filterKey}
                      type="button"
                      onClick={() => setFilterType(filterKey)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        filterType === filterKey
                          ? 'bg-surface-elevated text-vera-primary font-semibold shadow-vera-sm'
                          : 'text-vera-secondary hover:text-vera-primary'
                      }`}
                    >
                      {filterKey === 'ALL'
                        ? 'All'
                        : filterKey === 'HIGH_RISK'
                        ? 'High Risk'
                        : filterKey === 'IN_PROGRESS'
                        ? 'In Progress'
                        : 'Completed'}
                    </button>
                  ))}
                </div>

                {/* Sort selector */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface border border-vera-border text-xs text-vera-secondary">
                  <ArrowUpDown className="w-3.5 h-3.5 text-vera-muted" />
                  <span className="text-vera-muted">Sort:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-vera-primary font-medium focus:outline-none cursor-pointer text-xs"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="score_desc">Highest Score</option>
                    <option value="confidence_desc">Highest Confidence</option>
                    <option value="title_asc">Title (A-Z)</option>
                  </select>
                </div>
              </div>
            </div>
          </Card>

          {/* TIMELINE / LIST VIEW */}
          {sortedDecisions.length > 0 ? (
            <div className="space-y-6">
              {['Today', 'Yesterday', 'Earlier'].map((groupTitle) => {
                const groupItems = timelineGroups[groupTitle] || [];
                if (groupItems.length === 0) return null;

                return (
                  <div key={groupTitle} className="space-y-2.5">
                    <div className="text-[11px] uppercase font-semibold tracking-wider text-vera-muted px-1 flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-vera-muted" />
                      <span>{groupTitle}</span>
                      <span className="w-full h-[1px] bg-vera-border-subtle ml-2" />
                    </div>

                    <div className="divide-y divide-vera-border-subtle rounded-2xl border border-vera-border bg-surface-elevated overflow-hidden shadow-vera-sm">
                      {groupItems.map((d) => {
                        const recInfo = getRecommendationInfo(d);
                        const formattedDate = d.created_at
                          ? new Date(d.created_at).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })
                          : '—';

                        return (
                          <div
                            key={d.id}
                            onClick={() => navigate(`/decision/${d.id}`)}
                            className="p-4 hover:bg-surface transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs group"
                          >
                            {/* Title & Question */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-semibold text-vera-primary text-sm group-hover:text-vera-accent transition-colors">
                                  {d.title}
                                </span>
                                {getStatusBadge(d.status, recInfo.hasResult)}
                              </div>
                              <p className="text-xs text-vera-secondary italic truncate" title={d.question}>
                                &ldquo;{d.question}&rdquo;
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-vera-muted font-mono pt-0.5">
                                <span>{d.alternatives?.length || 0} Alternatives</span>
                                <span>•</span>
                                <span>{d.criteria?.length || 0} Criteria</span>
                                <span>•</span>
                                <span>{formattedDate}</span>
                              </div>
                            </div>

                            {/* Recommendation & Scores */}
                            <div className="flex items-center gap-3 shrink-0 flex-wrap">
                              {recInfo.hasResult ? (
                                <div className="text-right">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <Trophy className="w-3.5 h-3.5 text-vera-accent" />
                                    <span className="font-semibold text-vera-primary text-xs">{recInfo.name}</span>
                                  </div>
                                  <div className="text-[11px] text-vera-muted font-mono">
                                    Score: <strong className="text-vera-accent">{recInfo.score}</strong> • Conf: {recInfo.confidence}%
                                  </div>
                                </div>
                              ) : (
                                <span className="text-xs text-vera-muted italic">Pending Analysis</span>
                              )}

                              <div>
                                {getRiskBadge(recInfo.riskLevel, recInfo.riskScore)}
                              </div>

                              <div className="flex items-center gap-1.5">
                                <Link to={`/decision/${d.id}`} onClick={(e) => e.stopPropagation()}>
                                  <Button variant="outline" size="sm">
                                    Audit <ArrowRight className="w-3 h-3 ml-1" />
                                  </Button>
                                </Link>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDecisionToDelete(d);
                                  }}
                                  title="Delete decision"
                                  className="p-1.5 rounded-lg text-vera-muted hover:text-vera-danger hover:bg-vera-danger-bg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              icon={Filter}
              title="No decisions match your search criteria."
              description={`No decisions matching "${searchTerm}" with filter "${filterType}". Adjust your query or clear filters to view your records.`}
              actionLabel="Clear Filters"
              onAction={() => {
                setSearchTerm('');
                setFilterType('ALL');
              }}
            />
          )}
        </>
      )}

      {/* CONFIRM DELETE MODAL */}
      {decisionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vera-primary/30 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-md p-6 bg-surface-elevated border-vera-border shadow-vera-lg space-y-4">
            <div className="flex items-center gap-3 text-vera-danger">
              <div className="p-2 rounded-xl bg-vera-danger-bg border border-[#DFC5C5]">
                <AlertTriangle className="w-5 h-5 text-vera-danger" />
              </div>
              <h3 className="text-sm font-semibold text-vera-primary">Delete Decision Framework</h3>
            </div>

            <p className="text-xs text-vera-secondary leading-relaxed">
              Are you sure you want to delete <strong className="text-vera-primary">&ldquo;{decisionToDelete.title}&rdquo;</strong>?
              This will permanently remove the decision, criteria weights, alternatives, empirical citations, and calculated results.
            </p>

            <div className="p-3 rounded-xl bg-vera-danger-bg border border-[#DFC5C5] text-[11px] text-[#905B5B]">
              * This action is irreversible and restricted strictly to you as the framework owner.
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-xl bg-vera-danger-bg text-[#905B5B] text-xs">
                {deleteError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-vera-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDecisionToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteConfirm}
                loading={deleting}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Confirm Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </PageContainer>
  );
}
