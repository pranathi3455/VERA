import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import {
  HelpCircle,
  Sliders,
  Layers,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import PageContainer from '../components/common/PageContainer';
import SectionHeader from '../components/common/SectionHeader';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import { useAuth } from '../context/AuthContext';
import { decisionService } from '../services/decisionService';
import { formatUserErrorMessage } from '../utils/errorHandler';

export default function CreateDecisionPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Step 1: Question State
  const [questionData, setQuestionData] = useState({
    title: '',
    question: '',
    description: ''
  });

  // Step 2: Criteria State
  const [criteria, setCriteria] = useState([
    { id: 1, name: 'Cost / Value', weight: 40, direction: 'LOWER_IS_BETTER', description: 'Total cost of ownership' },
    { id: 2, name: 'Quality & Reliability', weight: 35, direction: 'HIGHER_IS_BETTER', description: 'Defect rate and uptime' },
    { id: 3, name: 'Delivery Speed', weight: 25, direction: 'LOWER_IS_BETTER', description: 'Lead time in days' }
  ]);

  // Step 3: Alternatives State
  const [alternatives, setAlternatives] = useState([
    { id: 1, name: 'Option Alpha', description: 'Primary market leader option' },
    { id: 2, name: 'Option Beta', description: 'Cost-optimized challenger option' }
  ]);

  // Pre-fill state if navigated from Chat or URL parameters
  useEffect(() => {
    const passedTitle = location.state?.title || searchParams.get('title');
    const passedQuestion = location.state?.question || searchParams.get('question');
    const passedDesc = location.state?.description;
    const passedCriteria = location.state?.criteria;
    const passedAlternatives = location.state?.alternatives;

    if (passedTitle || passedQuestion) {
      setQuestionData((prev) => ({
        ...prev,
        title: passedTitle || prev.title,
        question: passedQuestion || passedTitle || prev.question,
        description: passedDesc || prev.description
      }));
    }

    if (Array.isArray(passedCriteria) && passedCriteria.length > 0) {
      setCriteria(
        passedCriteria.map((c, i) => ({
          id: Date.now() + i,
          name: c.name || '',
          weight: c.weight || 25,
          direction: c.direction || 'HIGHER_IS_BETTER',
          description: c.description || ''
        }))
      );
    }

    if (Array.isArray(passedAlternatives) && passedAlternatives.length > 0) {
      setAlternatives(
        passedAlternatives.map((a, i) => ({
          id: Date.now() + i + 10,
          name: a.name || '',
          description: a.description || ''
        }))
      );
    }
  }, [location.state, searchParams]);


  const steps = [
    { number: 1, label: '01', title: 'Question', icon: HelpCircle },
    { number: 2, label: '02', title: 'Criteria', icon: Sliders },
    { number: 3, label: '03', title: 'Alternatives', icon: Layers },
    { number: 4, label: '04', title: 'Review', icon: CheckCircle2 }
  ];

  // Helper calculations
  const totalWeight = criteria.reduce((sum, c) => sum + (parseFloat(c.weight) || 0), 0);
  const isWeightValid = Math.abs(totalWeight - 100) < 0.01;

  // Validation checks
  const isStep1Valid = questionData.title.trim().length >= 3 && questionData.question.trim().length >= 5;
  const isStep2Valid = isWeightValid && criteria.length >= 1 && criteria.every((c) => c.name.trim().length > 0 && parseFloat(c.weight) > 0);
  const isStep3Valid = alternatives.length >= 2 && alternatives.every((a) => a.name.trim().length > 0);
  const isFormValid = isStep1Valid && isStep2Valid && isStep3Valid;

  // Criteria handlers
  const addCriterion = () => {
    setCriteria([
      ...criteria,
      { id: Date.now(), name: '', weight: 0, direction: 'HIGHER_IS_BETTER', description: '' }
    ]);
  };

  const removeCriterion = (id) => {
    if (criteria.length > 1) {
      setCriteria(criteria.filter((c) => c.id !== id));
    }
  };

  const updateCriterion = (id, field, value) => {
    setCriteria(
      criteria.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  // Alternative handlers
  const addAlternative = () => {
    setAlternatives([
      ...alternatives,
      { id: Date.now(), name: '', description: '' }
    ]);
  };

  const removeAlternative = (id) => {
    if (alternatives.length > 2) {
      setAlternatives(alternatives.filter((a) => a.id !== id));
    }
  };

  const updateAlternative = (id, field, value) => {
    setAlternatives(
      alternatives.map((a) => (a.id === id ? { ...a, [field]: value } : a))
    );
  };

  const handleNext = () => {
    setSubmitError(null);
    if (currentStep < 4) setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    setSubmitError(null);
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    if (!isFormValid) {
      setSubmitError('Please complete all required fields and ensure total criteria weight equals 100%.');
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const payload = {
        title: questionData.title.trim(),
        question: questionData.question.trim(),
        description: questionData.description.trim() || undefined,
        criteria: criteria.map((c) => ({
          name: c.name.trim(),
          weight: parseFloat(c.weight),
          direction: c.direction,
          description: c.description?.trim() || undefined
        })),
        alternatives: alternatives.map((a) => ({
          name: a.name.trim(),
          description: a.description?.trim() || undefined
        }))
      };

      const result = await decisionService.createDecision(payload, token);
      navigate(`/decision/${result.id}`);
    } catch (err) {
      setSubmitError(formatUserErrorMessage(err, 'Failed to create decision framework. Please check your inputs.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer maxWidth="max-w-4xl">
      {/* Top Header */}
      <div className="mb-6 pb-4 border-b border-vera-border">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-vera-muted block mb-1">
          Research Workflow
        </span>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <h1 className="text-xl sm:text-2xl font-semibold text-vera-primary">CREATE NEW DECISION</h1>
          <Badge variant="accent" size="sm">Step {currentStep} of 4</Badge>
        </div>
        <p className="text-xs sm:text-sm text-vera-secondary mt-1">
          Formulate your query, configure normalized criteria weights, and declare candidate alternatives.
        </p>
      </div>

      {/* Stepper Indicator: completed = sage, current = lavender, upcoming = soft grey */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
        {steps.map((s) => {
          const isCompleted = currentStep > s.number;
          const isCurrent = currentStep === s.number;

          let stepStyles = 'border-vera-border bg-surface text-vera-muted';
          let indicatorStyles = 'bg-secondary-bg text-vera-muted';

          if (isCompleted) {
            stepStyles = 'border-[#C8DEC0] bg-[#E4EEE7]/40 text-[#557662] shadow-vera-sm';
            indicatorStyles = 'bg-[#E4EEE7] text-[#557662] font-semibold';
          } else if (isCurrent) {
            stepStyles = 'border-[#CAD2EE] bg-vera-accent-soft/50 text-vera-primary font-semibold shadow-vera-sm';
            indicatorStyles = 'bg-vera-accent text-white font-semibold';
          }

          return (
            <button
              key={s.number}
              type="button"
              onClick={() => setCurrentStep(s.number)}
              className={`flex items-center gap-2.5 p-3 rounded-2xl border text-left transition-all ${stepStyles}`}
            >
              <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 ${indicatorStyles}`}>
                {isCompleted ? '✓' : s.label}
              </div>
              <div className="min-w-0">
                <div className="text-xs truncate">{s.title}</div>
                <div className="text-[10px] text-vera-muted">
                  {isCompleted ? 'Completed' : isCurrent ? 'In progress' : 'Upcoming'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Error alert */}
      {submitError && (
        <div className="mb-6 p-4 rounded-2xl bg-vera-danger-bg border border-[#DFC5C5] flex items-start gap-3 text-xs text-[#905B5B]">
          <AlertCircle className="w-4 h-4 text-vera-danger shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold text-vera-primary block">Submission Error</strong>
            <span>{submitError}</span>
          </div>
        </div>
      )}

      {/* Step Form Card */}
      <Card className="p-6 sm:p-8 mb-6 bg-surface-elevated border-vera-border shadow-vera-sm">
        {/* STEP 1: QUESTION */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-vera-primary mb-1">01. Formulate Decision Problem</h2>
              <p className="text-xs text-vera-secondary">
                State your decision title and the core question you need to resolve with empirical evidence.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-vera-secondary mb-1.5">
                  Decision Title <span className="text-vera-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={questionData.title}
                  onChange={(e) => setQuestionData({ ...questionData, title: e.target.value })}
                  placeholder="e.g. Primary Semiconductor Supplier Selection"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-vera-border text-vera-primary placeholder-vera-muted focus:outline-none focus:border-vera-accent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-vera-secondary mb-1.5">
                  Decision Question (Core Research Query) <span className="text-vera-accent">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={questionData.question}
                  onChange={(e) => setQuestionData({ ...questionData, question: e.target.value })}
                  placeholder="e.g. Which supplier provides the best long-term resilience and quality?"
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-vera-border text-vera-primary placeholder-vera-muted focus:outline-none focus:border-vera-accent text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-vera-secondary mb-1.5">
                  Context & Constraints (Optional)
                </label>
                <textarea
                  rows={4}
                  value={questionData.description}
                  onChange={(e) => setQuestionData({ ...questionData, description: e.target.value })}
                  placeholder="Describe operational deadlines, risk tolerances, or strategic scope..."
                  className="w-full px-4 py-2.5 rounded-xl bg-surface border border-vera-border text-vera-primary placeholder-vera-muted focus:outline-none focus:border-vera-accent text-sm"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CRITERIA */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-vera-border-subtle">
              <div>
                <h2 className="text-base font-semibold text-vera-primary mb-1">02. Decision Criteria & Weights</h2>
                <p className="text-xs text-vera-secondary">
                  Total criteria weight must equal exactly 100% for deterministic mathematical normalization.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-vera-secondary">Total Weight:</span>
                <Badge variant={isWeightValid ? 'success' : 'danger'} size="md">
                  {totalWeight}% / 100%
                </Badge>
              </div>
            </div>

            <div className="space-y-3">
              {criteria.map((c, index) => (
                <div
                  key={c.id}
                  className="flex flex-col sm:flex-row items-center gap-3 p-3.5 rounded-xl bg-surface border border-vera-border"
                >
                  <div className="w-7 h-7 rounded-lg bg-secondary-bg flex items-center justify-center text-xs font-semibold text-vera-secondary shrink-0">
                    {index + 1}
                  </div>

                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="text"
                      required
                      value={c.name}
                      onChange={(e) => updateCriterion(c.id, 'name', e.target.value)}
                      placeholder="Criterion Name (e.g. Unit Cost)"
                      className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-36">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={c.weight}
                      onChange={(e) => updateCriterion(c.id, 'weight', e.target.value)}
                      className="w-20 px-3 py-2 rounded-lg bg-surface-elevated border border-vera-border text-xs text-vera-primary text-right focus:outline-none focus:border-vera-accent font-mono"
                    />
                    <span className="text-xs text-vera-secondary font-semibold">%</span>
                  </div>

                  <div className="w-full sm:w-52">
                    <select
                      value={c.direction}
                      onChange={(e) => updateCriterion(c.id, 'direction', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent"
                    >
                      <option value="HIGHER_IS_BETTER">Higher is Better (Maximize)</option>
                      <option value="LOWER_IS_BETTER">Lower is Better (Minimize)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCriterion(c.id)}
                    disabled={criteria.length <= 1}
                    className="p-1.5 text-vera-muted hover:text-vera-danger disabled:opacity-30 transition-colors"
                    title="Remove Criterion"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={addCriterion}>
              <Plus className="w-4 h-4 mr-1" /> Add Criterion
            </Button>
          </div>
        )}

        {/* STEP 3: ALTERNATIVES */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-vera-primary mb-1">03. Candidate Alternatives</h2>
              <p className="text-xs text-vera-secondary">
                Define the competing options to be evaluated by the deterministic engine (minimum 2).
              </p>
            </div>

            <div className="space-y-3">
              {alternatives.map((alt, index) => (
                <div
                  key={alt.id}
                  className="p-4 rounded-xl bg-surface border border-vera-border space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-secondary-bg text-vera-secondary text-xs flex items-center justify-center font-bold">
                        {index + 1}
                      </span>
                      <span className="text-xs font-semibold text-vera-secondary uppercase tracking-wider">
                        Alternative Option
                      </span>
                    </div>
                    {alternatives.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeAlternative(alt.id)}
                        className="text-vera-muted hover:text-vera-danger text-xs flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>

                  <input
                    type="text"
                    required
                    value={alt.name}
                    onChange={(e) => updateAlternative(alt.id, 'name', e.target.value)}
                    placeholder="Alternative Name (e.g. Supplier Apex)"
                    className="w-full px-3 py-2 rounded-lg bg-surface-elevated border border-vera-border text-xs text-vera-primary focus:outline-none focus:border-vera-accent font-medium"
                  />

                  <input
                    type="text"
                    value={alt.description}
                    onChange={(e) => updateAlternative(alt.id, 'description', e.target.value)}
                    placeholder="Operational overview, provenance, or baseline notes..."
                    className="w-full px-3 py-1.5 rounded-lg bg-surface-elevated border border-vera-border text-xs text-vera-secondary focus:outline-none focus:border-vera-accent"
                  />
                </div>
              ))}
            </div>

            <Button variant="secondary" size="sm" onClick={addAlternative}>
              <Plus className="w-4 h-4 mr-1" /> Add Alternative
            </Button>
          </div>
        )}

        {/* STEP 4: REVIEW & LAUNCH */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-vera-primary mb-1">04. Framework Pre-Launch Review</h2>
              <p className="text-xs text-vera-secondary">
                Confirm your configuration before persisting and running deterministic scoring.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-surface border border-vera-border">
                <span className="text-[10px] uppercase font-semibold text-vera-muted tracking-wider">
                  Title & Research Question
                </span>
                <h3 className="text-sm font-semibold text-vera-primary mt-1">
                  {questionData.title || '(Untitled Framework)'}
                </h3>
                <p className="text-xs text-vera-secondary mt-0.5 italic">
                  &ldquo;{questionData.question || '(No Question Specified)'}&rdquo;
                </p>
                {questionData.description && (
                  <p className="text-xs text-vera-muted mt-2 pt-2 border-t border-vera-border-subtle">
                    {questionData.description}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-surface border border-vera-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] uppercase font-semibold text-vera-muted tracking-wider">
                      Criteria Breakdown
                    </span>
                    <Badge variant={isWeightValid ? 'success' : 'danger'} size="sm">
                      {totalWeight}% Total
                    </Badge>
                  </div>
                  <ul className="space-y-1.5 text-xs">
                    {criteria.map((c) => (
                      <li key={c.id} className="flex justify-between text-vera-secondary">
                        <span>{c.name || 'Unnamed'}</span>
                        <span className="font-mono font-medium text-vera-primary">{c.weight}%</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-surface border border-vera-border">
                  <span className="text-[10px] uppercase font-semibold text-vera-muted tracking-wider block mb-2">
                    Candidate Alternatives ({alternatives.length})
                  </span>
                  <ul className="space-y-1.5 text-xs">
                    {alternatives.map((a) => (
                      <li key={a.id} className="text-vera-secondary font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-vera-accent" />
                        {a.name || 'Unnamed'}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {!isFormValid && (
                <div className="p-4 rounded-xl bg-vera-warning-bg border border-[#DFD5BD] text-xs text-[#86754E] flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 text-vera-warning shrink-0" />
                  <div>
                    <strong className="font-semibold block">Validation Requirements:</strong>
                    <ul className="list-disc list-inside mt-1 space-y-0.5 text-vera-secondary">
                      {!isStep1Valid && <li>Title (min 3 chars) and Question (min 5 chars) are required.</li>}
                      {!isWeightValid && <li>Total criteria weight must equal exactly 100% (currently {totalWeight}%).</li>}
                      {!isStep3Valid && <li>Minimum of 2 named alternatives is required.</li>}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* Stepper Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          size="md"
          onClick={handleBack}
          disabled={currentStep === 1 || loading}
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
        </Button>

        {currentStep < 4 ? (
          <Button variant="primary" size="md" onClick={handleNext}>
            Next Step <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        ) : (
          <Button
            variant="primary"
            size="md"
            loading={loading}
            disabled={!isFormValid || loading}
            onClick={handleSubmit}
          >
            Create Decision Framework <Sparkles className="w-4 h-4 ml-1.5" />
          </Button>
        )}
      </div>
    </PageContainer>
  );
}
