import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Scale,
  Cpu,
  Sparkles,
  Layers,
  FileText,
  ChevronRight,
  Database,
  Sliders,
  TrendingUp
} from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Badge from '../components/common/Badge';

export default function LandingPage() {
  const steps = [
    {
      num: "01",
      name: "Define",
      title: "Formulate the Decision Framework",
      desc: "Specify your core decision question, target alternatives, and weighted evaluation criteria with clear optimization directions."
    },
    {
      num: "02",
      name: "Gather Evidence",
      title: "Attach Verifiable Evidence",
      desc: "Link empirical studies, audit reports, ERP logs, or user-submitted citations. Tag records as supporting, conflicting, or neutral."
    },
    {
      num: "03",
      name: "Analyze",
      title: "Deterministic Engine Execution",
      desc: "Backend algorithms normalize raw inputs and compute mathematical weighted rankings with zero black-box bias."
    },
    {
      num: "04",
      name: "Decide",
      title: "Explainable Synthesis & Action",
      desc: "Receive clear audit-ready rankings paired with Gemini AI interpretation highlighting trade-offs and sensitivity factors."
    }
  ];

  const valueProps = [
    {
      title: "Evidence-backed",
      desc: "Every recommendation is grounded in linked empirical sources, distinguishing user assertions from verified documents.",
      icon: Layers,
      color: "#789884"
    },
    {
      title: "Explainable",
      desc: "Clear audit trail separates mathematical calculations from AI commentary so stakeholders can trace every score.",
      icon: Scale,
      color: "#6877B8"
    },
    {
      title: "Risk-aware",
      desc: "Automated uncertainty bounds and downside risk assessments illuminate single points of failure before commitment.",
      icon: ShieldCheck,
      color: "#A9966B"
    },
    {
      title: "Data-driven",
      desc: "Deterministic criteria weighting and mathematical normalization eliminate subjective bias and recency fallacies.",
      icon: Cpu,
      color: "#7587AD"
    }
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 lg:py-24 border-b border-vera-border bg-gradient-to-b from-surface-elevated via-surface to-page">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-vera-border bg-vera-accent-soft text-vera-primary text-xs font-semibold tracking-wide mb-6 shadow-vera-sm">
            <span className="w-2 h-2 rounded-full bg-vera-accent animate-pulse" />
            Verified Evidence & Research Assistant
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-vera-primary mb-6 leading-tight">
            Make decisions with <span className="text-vera-accent underline decoration-vera-accent-soft decoration-4 underline-offset-4">evidence</span>, not guesswork.
          </h1>

          {/* Supporting Text */}
          <p className="text-base sm:text-lg text-vera-secondary max-w-2xl mx-auto mb-8 leading-relaxed font-normal">
            VERA organizes empirical evidence, compares alternatives, evaluates downside risk, and turns structured information into explainable recommendations.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/create-decision">
              <Button size="lg" variant="primary" className="w-full sm:w-auto shadow-vera-md">
                Start a Decision <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Explore Dashboard
              </Button>
            </Link>
          </div>

          {/* Abstract Pipeline Diagram */}
          <div className="mt-12 max-w-3xl mx-auto p-4 rounded-3xl bg-surface-elevated border border-vera-border shadow-vera-lg">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
              <div className="p-3 rounded-2xl bg-surface border border-vera-border">
                <span className="text-[10px] font-mono font-bold text-vera-accent">01 QUESTION</span>
                <p className="text-xs font-semibold text-vera-primary mt-1 truncate">Objective Framing</p>
                <p className="text-[10px] text-vera-muted mt-0.5">Define core dilemma</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-vera-border">
                <span className="text-[10px] font-mono font-bold text-[#557662]">02 EVIDENCE</span>
                <p className="text-xs font-semibold text-vera-primary mt-1 truncate">Verified Citations</p>
                <p className="text-[10px] text-vera-muted mt-0.5">Empirical research</p>
              </div>
              <div className="p-3 rounded-2xl bg-surface border border-vera-border">
                <span className="text-[10px] font-mono font-bold text-[#53658C]">03 ENGINE</span>
                <p className="text-xs font-semibold text-vera-primary mt-1 truncate">Deterministic Score</p>
                <p className="text-[10px] text-vera-muted mt-0.5">Mathematical rank</p>
              </div>
              <div className="p-3 rounded-2xl bg-vera-accent-soft/40 border border-vera-accent/30">
                <span className="text-[10px] font-mono font-bold text-vera-accent">04 DECISION</span>
                <p className="text-xs font-semibold text-vera-primary mt-1 truncate">Explainable Action</p>
                <p className="text-[10px] text-vera-secondary mt-0.5">Gemini audit narrative</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Propositions */}
      <section className="py-16 bg-surface-elevated/60 border-b border-vera-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-vera-muted block mb-1">
              Guiding Principles
            </span>
            <h2 className="text-2xl font-semibold text-vera-primary">
              Built for High-Stakes Decisions
            </h2>
            <p className="text-xs sm:text-sm text-vera-secondary max-w-xl mx-auto mt-1">
              Deterministic transparency separated from AI qualitative commentary.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {valueProps.map((item) => {
              const Icon = item.icon;
              return (
                <Card key={item.title} className="p-5 bg-surface-elevated border-vera-border hover:border-vera-accent/40 transition-colors">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 shadow-vera-sm"
                    style={{ backgroundColor: `${item.color}15`, color: item.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-sm font-semibold text-vera-primary mb-1">{item.title}</h3>
                  <p className="text-xs text-vera-secondary leading-relaxed">{item.desc}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4 Steps Section */}
      <section id="how-it-works" className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-vera-muted block mb-1">
              Methodology
            </span>
            <h2 className="text-2xl font-semibold text-vera-primary">
              The Decision Intelligence Workflow
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {steps.map((step) => (
              <Card key={step.num} className="p-5 bg-surface-elevated border-vera-border space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-vera-accent">{step.num}</span>
                  <Badge variant="neutral" size="sm">{step.name}</Badge>
                </div>
                <h3 className="text-sm font-semibold text-vera-primary">{step.title}</h3>
                <p className="text-xs text-vera-secondary leading-relaxed">{step.desc}</p>
              </Card>
            ))}
          </div>

          {/* Bottom CTA */}
          <div className="mt-12 text-center">
            <Link to="/register">
              <Button size="lg" variant="primary">
                Create Free Workspace <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
