/**
 * Demo Service for VERA
 * 
 * Provides a clean, realistic demo-data mechanism for demonstrating VERA:
 * - Real multi-criteria decision framework
 * - Realistic candidate alternatives and metric values
 * - Realistic demo evidence records (explicitly labeled as Demo Evidence)
 * - Deterministic engine calculation (no hardcoded winner)
 * - AI executive interpretation of calculated findings
 */
import supabase from './supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { executeDecisionEngine } from './decisionEngine.js';
import { generateDecisionInterpretation } from './geminiService.js';
import { getDecisionById } from './decisionService.js';

export const DEMO_CONFIG = {
  title: 'Supplier Selection for Sustainable Packaging',
  question: 'Which supplier should our organization choose for sustainable packaging?',
  description: 'Empirical multi-criteria evaluation of sustainable packaging suppliers balancing unit economics, ISO 14001 material quality, fulfillment speed, and supply chain continuity. [VERA Demo Dataset]',
  criteria: [
    {
      name: 'Cost',
      weight: 30,
      direction: 'LOWER_IS_BETTER',
      description: 'Unit cost per 1,000 packaging units in USD. Lower cost preserves operating margin.'
    },
    {
      name: 'Quality',
      weight: 25,
      direction: 'HIGHER_IS_BETTER',
      description: 'Tensile burst strength and ISO 14001 certified recycled material grade (0-100 scale).'
    },
    {
      name: 'Delivery Time',
      weight: 20,
      direction: 'LOWER_IS_BETTER',
      description: 'Order-to-delivery lead time in calendar days across nationwide distribution centers.'
    },
    {
      name: 'Reliability',
      weight: 15,
      direction: 'HIGHER_IS_BETTER',
      description: 'Contract fulfillment rate and verified on-time delivery track record (0-100%).'
    },
    {
      name: 'Risk',
      weight: 10,
      direction: 'LOWER_IS_BETTER',
      description: 'Supply chain disruption vulnerability and raw material feedstock exposure (0-100 scale, lower is safer).'
    }
  ],
  alternatives: [
    {
      name: 'Supplier A',
      description: 'Balanced post-consumer recycled corrugated packaging with dual domestic manufacturing facilities.'
    },
    {
      name: 'Supplier B',
      description: 'Premium bio-composite reinforced packaging offering rapid delivery and high structural strength at higher unit cost.'
    },
    {
      name: 'Supplier C',
      description: 'Low-cost recycled paperboard supplier with single regional manufacturing hub and longer transit times.'
    }
  ],
  rawScores: {
    'Supplier A': {
      Cost: 42,
      Quality: 88,
      'Delivery Time': 14,
      Reliability: 92,
      Risk: 20
    },
    'Supplier B': {
      Cost: 52,
      Quality: 94,
      'Delivery Time': 10,
      Reliability: 96,
      Risk: 28
    },
    'Supplier C': {
      Cost: 38,
      Quality: 72,
      'Delivery Time': 24,
      Reliability: 81,
      Risk: 45
    }
  },
  demoEvidence: [
    {
      title: '[Demo Evidence] Supplier A ISO 14001 Audit & Material Specification',
      source: 'Demo Evidence: Internal Procurement Mock Audit',
      source_type: 'Demo Evidence',
      supporting_alternative: 'Supplier A',
      evidence_direction: 'SUPPORTING',
      relevance_score: 90,
      reliability_score: 85,
      evidence_text: '[Demo Evidence] Simulated internal procurement review confirming Supplier A utilizes 100% post-consumer recycled fiber with FSC certification and dual domestic warehouse operations. (Simulated demo record, not an external verified audit.)'
    },
    {
      title: '[Demo Evidence] Supplier A Bulk Freight Lead Time Sample',
      source: 'Demo Evidence: Simulated Logistics Sampling',
      source_type: 'Demo Evidence',
      supporting_alternative: 'Supplier A',
      evidence_direction: 'SUPPORTING',
      relevance_score: 85,
      reliability_score: 80,
      evidence_text: '[Demo Evidence] Simulated test dispatch log demonstrating consistent 14-day delivery turnarounds with 92% on-time fulfillment across regional distribution hubs. (Simulated demo record.)'
    },
    {
      title: '[Demo Evidence] Supplier B Premium Resin Durability Benchmark',
      source: 'Demo Evidence: Internal Lab Test Simulation',
      source_type: 'Demo Evidence',
      supporting_alternative: 'Supplier B',
      evidence_direction: 'SUPPORTING',
      relevance_score: 88,
      reliability_score: 90,
      evidence_text: '[Demo Evidence] Simulated tensile strength laboratory evaluation demonstrating Supplier B proprietary bio-polymer coating provides superior burst resistance and 94% quality score. (Simulated demo record.)'
    },
    {
      title: '[Demo Evidence] Supplier B Premium Tier Unit Cost Analysis',
      source: 'Demo Evidence: Mock Cost Comparison Sheet',
      source_type: 'Demo Evidence',
      supporting_alternative: 'Supplier B',
      evidence_direction: 'CONFLICTING',
      relevance_score: 92,
      reliability_score: 85,
      evidence_text: '[Demo Evidence] Simulated financial analysis indicating Supplier B prices carry a 24% premium over market median ($52/unit) due to specialized bio-polymer fabrication. (Simulated demo record.)'
    },
    {
      title: '[Demo Evidence] Supplier C Single-Site Production Bottleneck Assessment',
      source: 'Demo Evidence: Mock Supply Chain Risk Profile',
      source_type: 'Demo Evidence',
      supporting_alternative: 'Supplier C',
      evidence_direction: 'CONFLICTING',
      relevance_score: 84,
      reliability_score: 75,
      evidence_text: '[Demo Evidence] Simulated operational review noting Supplier C operates out of a single regional facility, resulting in 24-day lead times and heightened supply vulnerability during peak seasonal surges. (Simulated demo record.)'
    }
  ]
};

/**
 * Creates or retrieves the complete demo decision for an authenticated user.
 * Calculates rankings deterministically without hardcoding a winner.
 */
export const getOrCreateDemoDecision = async (userId, options = {}) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  const { reset = false } = options;

  // 1. Check if user already has an active demo decision
  if (!reset) {
    const { data: existingDecisions } = await supabase
      .from('decisions')
      .select('id, title, status')
      .eq('user_id', userId)
      .eq('title', DEMO_CONFIG.title)
      .order('created_at', { ascending: false });

    if (existingDecisions && existingDecisions.length > 0) {
      try {
        const fullDecision = await getDecisionById(existingDecisions[0].id, userId);
        if (
          fullDecision &&
          fullDecision.criteria?.length >= 5 &&
          fullDecision.alternatives?.length >= 3 &&
          fullDecision.decision_results?.length > 0
        ) {
          return fullDecision;
        }
      } catch (err) {
        console.warn('Existing demo decision was incomplete or invalid, recreating...', err.message);
      }
    }
  } else {
    // If reset requested, clean up prior demo decision
    const { data: oldDemos } = await supabase
      .from('decisions')
      .select('id')
      .eq('user_id', userId)
      .eq('title', DEMO_CONFIG.title);

    if (oldDemos && oldDemos.length > 0) {
      for (const d of oldDemos) {
        try {
          await supabase.from('decisions').delete().eq('id', d.id);
        } catch (_) {}
      }
    }
  }

  // 2. Create the demo decision record
  const { data: newDecision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: DEMO_CONFIG.title,
      question: DEMO_CONFIG.question,
      description: DEMO_CONFIG.description,
      status: 'COMPLETED'
    })
    .select()
    .single();

  if (decError) {
    throw new AppError(`Failed to create demo decision: ${decError.message}`, 500, 'DB_ERROR');
  }

  const decisionId = newDecision.id;

  try {
    // 3. Insert Criteria
    const criteriaToInsert = DEMO_CONFIG.criteria.map((c) => ({
      decision_id: decisionId,
      name: c.name,
      weight: c.weight,
      direction: c.direction,
      description: c.description
    }));

    const { data: insertedCriteria, error: critError } = await supabase
      .from('criteria')
      .insert(criteriaToInsert)
      .select();

    if (critError) throw new AppError(`Criteria insert failed: ${critError.message}`, 500, 'DB_ERROR');

    // 4. Insert Alternatives
    const altsToInsert = DEMO_CONFIG.alternatives.map((a) => ({
      decision_id: decisionId,
      name: a.name,
      description: a.description
    }));

    const { data: insertedAlts, error: altsError } = await supabase
      .from('alternatives')
      .insert(altsToInsert)
      .select();

    if (altsError) throw new AppError(`Alternatives insert failed: ${altsError.message}`, 500, 'DB_ERROR');

    // 5. Insert Demo Evidence Records (explicitly labeled as Demo Evidence)
    const evidenceToInsert = DEMO_CONFIG.demoEvidence.map((ev) => ({
      decision_id: decisionId,
      title: ev.title,
      source: ev.source,
      source_type: ev.source_type,
      supporting_alternative: ev.supporting_alternative,
      evidence_direction: ev.evidence_direction,
      relevance_score: ev.relevance_score,
      reliability_score: ev.reliability_score,
      evidence_text: ev.evidence_text
    }));

    const { data: insertedEvidence, error: evError } = await supabase
      .from('evidence')
      .insert(evidenceToInsert)
      .select();

    if (evError) throw new AppError(`Evidence insert failed: ${evError.message}`, 500, 'DB_ERROR');

    // 6. Map Raw Values to alternative and criterion IDs
    // Format rawScores keyed by alternative name/id and criterion name/id
    const rawScoresForEngine = {};
    const scoresToPersist = [];

    insertedAlts.forEach((alt) => {
      rawScoresForEngine[alt.name] = {};
      const altRaw = DEMO_CONFIG.rawScores[alt.name] || {};

      insertedCriteria.forEach((crit) => {
        const val = altRaw[crit.name];
        rawScoresForEngine[alt.name][crit.name] = val;
        scoresToPersist.push({
          alternative_id: alt.id,
          criterion_id: crit.id,
          raw_value: val
        });
      });
    });

    // 7. Execute the Deterministic Decision Engine (NO hardcoded winner!)
    const engineResult = executeDecisionEngine({
      decision: newDecision,
      criteria: insertedCriteria,
      alternatives: insertedAlts,
      rawScores: rawScoresForEngine,
      evidence: insertedEvidence || []
    });

    // 8. Populate normalized and weighted scores in alternative_scores
    const enrichedScores = scoresToPersist.map((sp) => {
      const critAnalysis = engineResult.criterionAnalysis.find((ca) => ca.criterionId === sp.criterion_id);
      const altPerf = critAnalysis?.alternativePerformance.find((ap) => ap.alternativeId === sp.alternative_id);
      return {
        ...sp,
        normalized_score: altPerf?.normalizedScore ?? null,
        weighted_score: altPerf?.weightedScore ?? null
      };
    });

    const { error: scoreInsertError } = await supabase
      .from('alternative_scores')
      .insert(enrichedScores);

    if (scoreInsertError) {
      console.warn('Could not insert alternative_scores rows:', scoreInsertError.message);
    }

    // 9. Generate AI Executive Interpretation
    let aiInterpretation = null;
    try {
      aiInterpretation = await generateDecisionInterpretation({
        decision: newDecision,
        engineResult,
        evidence: insertedEvidence || []
      });
    } catch (aiErr) {
      console.warn('AI Interpretation fallback for demo:', aiErr.message);
      aiInterpretation = {
        status: 'unavailable',
        message: 'AI interpretation is temporarily unavailable.'
      };
    }

    // 10. Persist Decision Results
    const winnerAltId = engineResult.recommendedAlternative?.alternative?.id;
    const resultPayload = {
      decision_id: decisionId,
      recommended_alternative_id: winnerAltId,
      overall_score: engineResult.recommendedAlternative?.overallScore,
      risk_score: engineResult.recommendedAlternative?.riskScore,
      risk_level: engineResult.recommendedAlternative?.riskLevel,
      confidence: engineResult.confidence,
      ranking_json: engineResult.rankings,
      calculation_json: engineResult.criterionAnalysis,
      ai_interpretation_json: aiInterpretation
    };

    const { error: resError } = await supabase
      .from('decision_results')
      .insert(resultPayload);

    if (resError) {
      console.warn('Could not insert decision_results row:', resError.message);
    }

    // 11. Retrieve and return fully assembled decision framework
    return await getDecisionById(decisionId, userId);
  } catch (err) {
    // Cleanup partial decision on critical failure
    try {
      await supabase.from('decisions').delete().eq('id', decisionId);
    } catch (_) {}
    throw err;
  }
};
