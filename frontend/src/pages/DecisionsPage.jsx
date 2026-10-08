import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  HelpCircle,
  Clock,
  ChevronRight,
  Pencil,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Loader2,
  SlidersHorizontal
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { decisionService } from '../services/decisionService';

export default function DecisionsPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  // Edit Modal State
  const [editingDecision, setEditingDecision] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete Modal State
  const [deletingDecision, setDeletingDecision] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Toast / Feedback message
  const [feedbackMsg, setFeedbackMsg] = useState(null);

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

  const handleStartExample = async () => {
    try {
      setDemoLoading(true);
      const demoDec = await decisionService.getOrCreateDemoDecision(token);
      if (demoDec && demoDec.id) {
        navigate(`/decision/${demoDec.id}`);
      }
    } catch (err) {
      navigate('/create-decision');
    } finally {
      setDemoLoading(false);
    }
  };

  const openEditModal = (dec) => {
    setEditingDecision(dec);
    setEditTitle(dec.title || '');
    setEditDescription(dec.description || '');
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingDecision || !editTitle.trim() || savingEdit) return;

    try {
      setSavingEdit(true);
      await decisionService.updateDecision(
        editingDecision.id,
        {
          title: editTitle.trim(),
          description: editDescription.trim()
        },
        token
      );

      setDecisions((prev) =>
        prev.map((d) =>
          d.id === editingDecision.id
            ? { ...d, title: editTitle.trim(), description: editDescription.trim() }
            : d
        )
      );

      setEditingDecision(null);
      setFeedbackMsg({ type: 'success', text: 'Decision updated successfully.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error('[DecisionsPage] Failed to update decision:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to update decision.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingDecision || deleting) return;

    try {
      setDeleting(true);
      await decisionService.deleteDecision(deletingDecision.id, token);

      setDecisions((prev) => prev.filter((d) => d.id !== deletingDecision.id));
      setDeletingDecision(null);
      setFeedbackMsg({ type: 'success', text: 'Decision deleted successfully.' });
      setTimeout(() => setFeedbackMsg(null), 3000);
    } catch (err) {
      console.error('[DecisionsPage] Failed to delete decision:', err);
      setFeedbackMsg({ type: 'error', text: err.message || 'Failed to delete decision.' });
      setTimeout(() => setFeedbackMsg(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  const handleEditMatrix = (dec) => {
    navigate('/create-decision', {
      state: {
        id: dec.id,
        title: dec.title,
        question: dec.question || dec.description,
        criteria: dec.criteria || [],
        alternatives: dec.alternatives || []
      }
    });
  };

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto space-y-6 select-none relative">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-2 border transition-all animate-in fade-in slide-in-from-top-2 ${
            feedbackMsg.type === 'success'
              ? 'bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0]'
              : 'bg-[#FFF1F2] text-[#9F1239] border-[#FECDD3]'
          }`}
        >
          {feedbackMsg.type === 'success' ? (
            <Check className="w-4 h-4 text-[#10B981]" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-[#E11D48]" />
          )}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#17213D] tracking-tight">
          Decisions
        </h1>
        {decisions.length > 0 && (
          <button
            type="button"
            onClick={() => navigate('/create-decision')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] text-white text-xs font-semibold shadow-sm hover:scale-105 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Decision</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="min-h-[280px] flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-[#7B61FF]" />
        </div>
      ) : decisions.length === 0 ? (
        /* Empty State */
        <div className="space-y-6">
          <div className="min-h-[380px] bg-white/80 rounded-3xl border border-[#E2E6F5] flex flex-col items-center justify-center p-8 text-center space-y-4 shadow-sm">
            <div className="w-20 h-20 rounded-2xl bg-[#EEF0FD] border border-[#DDD6FE] flex items-center justify-center text-[#7B61FF] shadow-sm">
              <FolderOpen className="w-10 h-10" />
            </div>

            <div className="space-y-1.5 max-w-md">
              <h2 className="text-xl font-bold text-[#17213D] tracking-tight">
                No decisions yet
              </h2>
              <p className="text-xs text-[#5E6882] leading-relaxed">
                Start your first decision and let VERA help you compare options, analyze risks and find the best path.
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

          <div
            onClick={handleStartExample}
            className="bg-white rounded-2xl p-4 border border-[#E2E6F5] hover:border-[#7B61FF]/40 shadow-sm cursor-pointer transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[#EEF0FD] flex items-center justify-center text-[#7B61FF]">
                <HelpCircle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-[#17213D] group-hover:text-[#7B61FF] transition-colors">
                  Not sure where to start?
                </h4>
                <p className="text-[11px] text-[#7C849A]">
                  {demoLoading ? 'Loading demo framework...' : 'Try an example to see how VERA works.'}
                </p>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-[#7C849A] group-hover:text-[#7B61FF] group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>
      ) : (
        /* Decisions Grid with Edit and Delete */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decisions.map((dec) => {
            const topRec = dec.decision_results?.[0];
            const score = topRec?.overall_score ? Math.round(topRec.overall_score * 100) / 100 : null;

            return (
              <div
                key={dec.id}
                onClick={() => navigate(`/decision/${dec.id}`)}
                className="bg-white rounded-2xl p-5 border border-[#E2E6F5] hover:border-[#7B61FF] shadow-xs hover:shadow-md cursor-pointer transition-all space-y-3 group relative"
              >
                {/* Header row: Title + Actions */}
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-[#17213D] group-hover:text-[#7B61FF] transition-colors line-clamp-1 flex-1 pr-1">
                    {dec.title}
                  </h3>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {score !== null && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E4EEE7] text-[#789884] text-xs font-bold">
                        {score}
                      </span>
                    )}

                    {/* Edit Option Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(dec);
                      }}
                      className="p-1 rounded-lg text-[#7C849A] hover:text-[#7B61FF] hover:bg-[#EEF0FD] transition-colors"
                      title="Edit Decision"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Option Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingDecision(dec);
                      }}
                      className="p-1 rounded-lg text-[#7C849A] hover:text-[#E11D48] hover:bg-[#FFF1F2] transition-colors"
                      title="Delete Decision"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#5E6882] line-clamp-2 leading-relaxed">
                  {dec.description || 'Structured multi-criteria evaluation with verified evidence.'}
                </p>

                <div className="flex items-center justify-between text-xs text-[#7C849A] pt-2 border-t border-[#F0F2FA]">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{new Date(dec.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className="font-semibold text-[#7B61FF] group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
                    View Analysis <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================== */}
      {/* EDIT DECISION MODAL                                            */}
      {/* ============================================================== */}
      {editingDecision && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-[#D5DAEA] space-y-5 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0F2FA]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EEF0FD] text-[#7B61FF] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#17213D]">
                    Edit Decision
                  </h3>
                  <p className="text-xs text-[#7C849A]">
                    Update your decision details or adjust options & criteria.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingDecision(null)}
                className="p-1.5 rounded-lg text-[#7C849A] hover:text-[#17213D] hover:bg-[#F4F6FD] transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17213D]">
                  Decision Title
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="e.g. Which college or laptop should I choose?"
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5DAEA] focus:border-[#7B61FF] rounded-xl text-sm text-[#17213D] placeholder-[#94A3B8] focus:outline-none transition-all shadow-2xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#17213D]">
                  Description & Context
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  placeholder="Add background notes or specifics..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D5DAEA] focus:border-[#7B61FF] rounded-xl text-xs sm:text-sm text-[#17213D] placeholder-[#94A3B8] focus:outline-none resize-none transition-all shadow-2xs"
                />
              </div>

              {/* Edit Full Options & Matrix Link */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const target = editingDecision;
                    setEditingDecision(null);
                    handleEditMatrix(target);
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-[#F8F9FE] hover:bg-[#EEF0FD] border border-[#DDD6FE] text-[#7B61FF] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Edit Options & Criteria in Matrix Builder →</span>
                </button>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#F0F2FA]">
                <button
                  type="button"
                  onClick={() => setEditingDecision(null)}
                  disabled={savingEdit}
                  className="px-4 py-2 rounded-xl border border-[#D5DAEA] text-xs font-semibold text-[#5E6882] hover:bg-[#F8F9FE] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editTitle.trim()}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#7B61FF] to-[#6366F1] hover:from-[#6D52F7] hover:to-[#5558E6] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {savingEdit ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* DELETE DECISION CONFIRMATION MODAL                            */}
      {/* ============================================================== */}
      {deletingDecision && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-[#D5DAEA] space-y-4 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-2xl bg-[#FFF1F2] border border-[#FECDD3] text-[#E11D48] flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-base font-bold text-[#17213D]">
                Delete Decision?
              </h3>
              <p className="text-xs text-[#5E6882] leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-[#17213D]">"{deletingDecision.title}"</span>? This will permanently remove this decision, its options, and analysis.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingDecision(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-[#D5DAEA] text-xs font-semibold text-[#5E6882] hover:bg-[#F8F9FE] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-[#E11D48] hover:bg-[#BE123C] text-white text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <span>Delete</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
