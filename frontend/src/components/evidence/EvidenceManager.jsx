import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  HelpCircle,
  X,
  Search,
  Filter
} from 'lucide-react';
import Card from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { evidenceService } from '../../services/evidenceService';
import { formatUserErrorMessage } from '../../utils/errorHandler';

const SOURCE_TYPES = [
  'Research Paper',
  'Official Website',
  'Government Source',
  'Report',
  'Dataset',
  'User Provided',
  'Other'
];

export default function EvidenceManager({
  decisionId,
  alternatives = [],
  evidenceList = [],
  token,
  onEvidenceChange
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDirection, setFilterDirection] = useState('ALL'); // ALL, SUPPORTING, CONFLICTING, NEUTRAL

  const defaultAlternative = alternatives[0]?.name || '';

  const [form, setForm] = useState({
    title: '',
    source: '',
    sourceType: 'User Provided',
    evidenceDirection: 'SUPPORTING',
    supportingAlternative: defaultAlternative,
    relevanceScore: 85,
    reliabilityScore: 80,
    evidenceText: ''
  });

  const handleOpenModal = () => {
    setForm({
      title: '',
      source: '',
      sourceType: 'User Provided',
      evidenceDirection: 'SUPPORTING',
      supportingAlternative: alternatives[0]?.name || '',
      relevanceScore: 85,
      reliabilityScore: 80,
      evidenceText: ''
    });
    setError(null);
    setShowAddModal(true);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.source.trim() || !form.evidenceText.trim()) {
      setError('Title, source origin, and evidence text are required.');
      return;
    }

    if (!form.supportingAlternative) {
      setError('Please select a target alternative.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        title: form.title.trim(),
        source: form.source.trim(),
        sourceType: form.sourceType,
        evidenceDirection: form.evidenceDirection,
        supportingAlternative: form.supportingAlternative,
        relevanceScore: Number(form.relevanceScore),
        reliabilityScore: Number(form.reliabilityScore),
        evidenceText: form.evidenceText.trim()
      };

      const newEvidence = await evidenceService.addEvidence(decisionId, payload, token);
      setShowAddModal(false);
      if (onEvidenceChange) {
        onEvidenceChange([newEvidence, ...evidenceList]);
      }
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Failed to save evidence citation.'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (evidenceId) => {
    try {
      await evidenceService.deleteEvidence(decisionId, evidenceId, token);
      if (onEvidenceChange) {
        onEvidenceChange(evidenceList.filter((e) => e.id !== evidenceId));
      }
    } catch (err) {
      setError(formatUserErrorMessage(err, 'Failed to remove evidence record.'));
    }
  };

  // Filter evidence
  const filteredEvidence = evidenceList.filter((ev) => {
    const dir = (ev.evidence_direction || ev.evidenceDirection || 'NEUTRAL').toUpperCase();
    if (filterDirection !== 'ALL' && dir !== filterDirection) return false;
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const title = (ev.title || '').toLowerCase();
    const source = (ev.source || '').toLowerCase();
    const text = (ev.evidence_text || ev.evidenceText || '').toLowerCase();
    const alt = (ev.supporting_alternative || ev.supportingAlternative || '').toLowerCase();
    return title.includes(term) || source.includes(term) || text.includes(term) || alt.includes(term);
  });

  const getDirectionBadge = (dir) => {
    const d = (dir || 'NEUTRAL').toUpperCase();
    switch (d) {
      case 'SUPPORTING':
        return <Badge variant="success" size="sm" dot>Supporting</Badge>;
      case 'CONFLICTING':
        return <Badge variant="danger" size="sm" dot>Conflicting</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Neutral</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Evidence Research Library Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-vera-border">
        <div>
          <h4 className="text-sm font-semibold text-vera-primary">Evidence Research Library</h4>
          <p className="text-xs text-vera-secondary">
            Verified empirical citations, audit reports, and domain benchmark logs
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={handleOpenModal}>
          <Plus className="w-4 h-4 mr-1.5" /> Attach Evidence
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-vera-danger-bg border border-[#DFC5C5] text-xs text-[#905B5B] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-vera-danger shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-vera-muted hover:text-vera-primary text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 text-vera-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search evidence titles, sources, or text..."
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary placeholder-vera-muted focus:outline-none focus:border-vera-accent"
          />
        </div>

        {/* Direction Filter Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-secondary-bg/60 border border-vera-border text-xs self-start sm:self-auto">
          {['ALL', 'SUPPORTING', 'CONFLICTING', 'NEUTRAL'].map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setFilterDirection(filterKey)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                filterDirection === filterKey
                  ? 'bg-surface-elevated text-vera-primary font-semibold shadow-vera-sm'
                  : 'text-vera-secondary hover:text-vera-primary'
              }`}
            >
              {filterKey === 'ALL' ? 'All' : filterKey.charAt(0) + filterKey.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Clean Evidence List Rows */}
      {filteredEvidence.length === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-surface border border-dashed border-vera-border">
          <FileText className="w-6 h-6 text-vera-muted mx-auto mb-2" />
          <p className="text-xs text-vera-secondary">
            {searchTerm || filterDirection !== 'ALL'
              ? 'No evidence records match the search/filter criteria.'
              : 'No empirical evidence attached to this decision yet.'}
          </p>
        </div>
      ) : (
        <div className="divide-y divide-vera-border-subtle rounded-2xl border border-vera-border bg-surface-elevated overflow-hidden shadow-vera-sm">
          {filteredEvidence.map((ev) => {
            const dir = ev.evidence_direction || ev.evidenceDirection;
            const targetAlt = ev.supporting_alternative || ev.supportingAlternative;
            const text = ev.evidence_text || ev.evidenceText;
            const relevance = ev.relevance_score || ev.relevanceScore;
            const reliability = ev.reliability_score || ev.reliabilityScore;

            return (
              <div
                key={ev.id}
                className="p-3.5 hover:bg-surface transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-vera-primary">{ev.title}</span>
                    {getDirectionBadge(dir)}
                    {targetAlt && (
                      <span className="px-2 py-0.5 rounded-md bg-surface border border-vera-border text-[10px] text-vera-secondary">
                        Alternative: <strong className="text-vera-primary">{targetAlt}</strong>
                      </span>
                    )}
                  </div>

                  {text && (
                    <p className="text-vera-secondary text-xs italic leading-relaxed line-clamp-2">
                      &ldquo;{text}&rdquo;
                    </p>
                  )}

                  <div className="flex items-center gap-3 text-[11px] text-vera-muted pt-0.5">
                    <span>Source: <strong className="text-vera-secondary font-medium">{ev.source}</strong></span>
                    <span>•</span>
                    <span>Type: {ev.source_type || ev.sourceType || 'Citation'}</span>
                    {relevance !== undefined && (
                      <>
                        <span>•</span>
                        <span>Relevance: {relevance}%</span>
                      </>
                    )}
                    {reliability !== undefined && (
                      <>
                        <span>•</span>
                        <span>Reliability: {reliability}%</span>
                      </>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(ev.id)}
                  className="p-1.5 text-vera-muted hover:text-vera-danger rounded-lg hover:bg-vera-danger-bg transition-colors shrink-0 self-end sm:self-center"
                  title="Remove Evidence"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Evidence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-vera-primary/25 backdrop-blur-sm animate-fade-in">
          <div className="bg-surface-elevated border border-vera-border rounded-2xl shadow-vera-lg w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-vera-border flex items-center justify-between bg-surface">
              <div>
                <h3 className="text-sm font-semibold text-vera-primary">Attach Empirical Evidence</h3>
                <p className="text-xs text-vera-secondary">Add citations to verify alternative claims</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 text-vera-muted hover:text-vera-primary rounded-lg hover:bg-secondary-bg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-5 space-y-3.5 overflow-y-auto flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-vera-danger-bg border border-[#DFC5C5] text-xs text-[#905B5B]">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-vera-secondary mb-1">
                  Evidence Title <span className="text-vera-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Q3 Reliability Benchmark Report"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-vera-secondary mb-1">
                    Source Citation / URL <span className="text-vera-accent">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="e.g. ISO 9001 Audit / https://..."
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-vera-secondary mb-1">Source Type</label>
                  <select
                    value={form.sourceType}
                    onChange={(e) => setForm({ ...form, sourceType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                  >
                    {SOURCE_TYPES.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-vera-secondary mb-1">Target Alternative</label>
                  <select
                    value={form.supportingAlternative}
                    onChange={(e) => setForm({ ...form, supportingAlternative: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                  >
                    {alternatives.map((a) => (
                      <option key={a.id || a.name} value={a.name}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-vera-secondary mb-1">Evidence Direction</label>
                  <select
                    value={form.evidenceDirection}
                    onChange={(e) => setForm({ ...form, evidenceDirection: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                  >
                    <option value="SUPPORTING">Supporting (+)</option>
                    <option value="CONFLICTING">Conflicting (-)</option>
                    <option value="NEUTRAL">Neutral (~)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-vera-secondary mb-1">
                  Evidence Text / Findings <span className="text-vera-accent">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.evidenceText}
                  onChange={(e) => setForm({ ...form, evidenceText: e.target.value })}
                  placeholder="Summarize the verified empirical findings, statistics, or audit conclusion..."
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-vera-border">
                <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={loading}>
                  Save Citation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
