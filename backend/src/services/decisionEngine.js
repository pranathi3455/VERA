/**
 * VERA Deterministic Decision Intelligence Engine
 * 
 * Computes objective rankings, normalized trade-offs, and structured risk assessments.
 * This engine runs strictly in backend deterministic logic without AI/LLM intervention.
 */

/**
 * Normalizes a raw criterion value on a 0-100 scale.
 * 
 * Formula:
 * - HIGHER_IS_BETTER: ((value - min) / (max - min)) * 100
 * - LOWER_IS_BETTER:  ((max - value) / (max - min)) * 100
 * - Zero division protection: When min === max, returns 100 for all alternatives.
 */
export const normalizeValue = ({ value, min, max, direction }) => {
  const numValue = Number(value);
  const numMin = Number(min);
  const numMax = Number(max);

  if (isNaN(numValue) || isNaN(numMin) || isNaN(numMax)) {
    throw new Error('Normalization requires valid numerical values.');
  }

  // Safe zero-division handling
  if (numMax === numMin) {
    return 100.0;
  }

  let normalized;
  if (direction === 'HIGHER_IS_BETTER') {
    normalized = ((numValue - numMin) / (numMax - numMin)) * 100;
  } else if (direction === 'LOWER_IS_BETTER') {
    normalized = ((numMax - numValue) / (numMax - numMin)) * 100;
  } else {
    throw new Error(`Invalid optimization direction: ${direction}. Expected HIGHER_IS_BETTER or LOWER_IS_BETTER.`);
  }

  // Safeguard bounds between 0 and 100 against floating-point inaccuracies
  const clamped = Math.max(0, Math.min(100, normalized));
  return Math.round(clamped * 10000) / 10000; // 4 decimal places internal precision
};

/**
 * Calculates weighted score from normalized score and criterion weight.
 */
export const calculateWeightedScore = (normalizedScore, weight) => {
  const norm = Number(normalizedScore);
  const wt = Number(weight);
  if (isNaN(norm) || isNaN(wt)) {
    throw new Error('Normalized score and weight must be numerical values.');
  }
  const weighted = (norm * wt) / 100;
  return Math.round(weighted * 10000) / 10000;
};

/**
 * Evaluates VERA Risk Assessment.
 * 
 * Calculation Logic:
 * 1. Performance Volatility (Weight: 40%): Standard deviation of normalized scores across criteria.
 *    High variance indicates extreme vulnerability in at least one area.
 * 2. Downside Criteria Deficit (Weight: 35%): Measures worst single criterion score.
 *    If an alternative fails critically on any weighted criterion, downside exposure increases.
 * 3. Evidence Conflict Ratio (Weight: 25%): Proportion of attached conflicting evidence relative to total evidence.
 * 
 * Total Risk Score ranges from 0 (minimal risk) to 100 (severe risk).
 * Categorization:
 * - 0 to 33:   LOW
 * - 34 to 66:  MEDIUM
 * - 67 to 100: HIGH
 */
export const calculateRiskAssessment = ({ alternative, criterionScores, evidence = [] }) => {
  const scores = criterionScores.map((cs) => cs.normalizedScore);

  // 1. Calculate Volatility (Standard Deviation)
  let volatility = 0;
  if (scores.length > 1) {
    const mean = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    volatility = Math.min(100, Math.sqrt(variance) * 2); // Scale std dev to 0-100
  }

  // 2. Downside Penalty (Worst criterion score deficit from 100)
  const minScore = scores.length > 0 ? Math.min(...scores) : 100;
  const downsideDeficit = 100 - minScore;

  // 3. Evidence Conflict Penalty
  const altName = alternative.name?.toLowerCase().trim();
  const altId = String(alternative.id || '').toLowerCase().trim();

  const relevantEvidence = evidence.filter((ev) => {
    const target = String(ev.supporting_alternative || ev.supportingAlternative || '').toLowerCase().trim();
    return target === altName || target === altId;
  });

  let evidenceConflictRate = 0;
  if (relevantEvidence.length > 0) {
    const conflicting = relevantEvidence.filter((ev) => {
      const dir = ev.evidence_direction || ev.evidenceDirection;
      return dir === 'CONFLICTING';
    }).length;
    evidenceConflictRate = (conflicting / relevantEvidence.length) * 100;
  }

  // Weighted composite risk formula
  const compositeRisk = (volatility * 0.40) + (downsideDeficit * 0.35) + (evidenceConflictRate * 0.25);
  const roundedRiskScore = Math.round(Math.max(0, Math.min(100, compositeRisk)) * 10) / 10;

  let riskLevel = 'LOW';
  if (roundedRiskScore >= 67) {
    riskLevel = 'HIGH';
  } else if (roundedRiskScore >= 34) {
    riskLevel = 'MEDIUM';
  }

  return {
    riskScore: roundedRiskScore,
    riskLevel,
    metrics: {
      volatilityScore: Math.round(volatility * 10) / 10,
      downsideDeficitScore: Math.round(downsideDeficit * 10) / 10,
      evidenceConflictRate: Math.round(evidenceConflictRate * 10) / 10,
      conflictingEvidenceCount: relevantEvidence.filter(e => (e.evidence_direction || e.evidenceDirection) === 'CONFLICTING').length,
      totalEvidenceCount: relevantEvidence.length
    },
    disclaimer: 'VERA Risk Assessment is a structured heuristic model computed deterministically from criterion score variance, downside exposure, and attached conflicting evidence. It is not an actuarial guarantee.'
  };
};

/**
 * Calculates overall confidence score (0-100) based on mathematical separation and data completeness.
 */
export const calculateConfidence = ({ rankings, criteria, evidence = [] }) => {
  if (rankings.length === 0) return 0;
  if (rankings.length === 1) return 100;

  // 1. Victory Margin between Rank #1 and Rank #2 (Max 50 pts)
  const topScore = rankings[0].overallScore;
  const runnerUpScore = rankings[1].overallScore;
  const spread = Math.max(0, topScore - runnerUpScore);
  const marginPoints = Math.min(50, spread * 2.5);

  // 2. Criteria Coverage & Evidence Support (Max 50 pts)
  const criteriaPoints = Math.min(30, criteria.length * 6);
  const evidencePoints = Math.min(20, evidence.length * 4);

  const totalConfidence = Math.round(marginPoints + criteriaPoints + evidencePoints);
  return Math.max(10, Math.min(99, totalConfidence));
};

/**
 * Core Decision Engine Execution
 * 
 * Coordinates:
 * - Input validation
 * - Objective normalization per criterion
 * - Weighted score compilation
 * - Deterministic descending ranking
 * - VERA Risk Assessment
 * - Explainable summary compilation
 */
export const executeDecisionEngine = ({
  decision = {},
  criteria = [],
  alternatives = [],
  rawScores = {},
  evidence = []
}) => {
  // 1. Validation
  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new Error('Decision engine requires at least 1 criterion.');
  }

  if (!Array.isArray(alternatives) || alternatives.length < 2) {
    throw new Error('Decision engine requires at least 2 alternatives to rank.');
  }

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);
  if (Math.abs(totalWeight - 100) > 0.05) {
    throw new Error(`Total criteria weight must equal 100%. Current sum: ${totalWeight}%.`);
  }

  // 2. Criteria Analysis & Normalization across all alternatives
  const criterionAnalysis = [];
  const normalizedMatrix = {}; // { [altId]: { [critId]: { raw, normalized, weighted } } }

  alternatives.forEach((alt) => {
    const altKey = String(alt.id || alt.name);
    normalizedMatrix[altKey] = {};
  });

  criteria.forEach((criterion) => {
    const critKey = String(criterion.id || criterion.name);
    const weight = Number(criterion.weight);
    const direction = criterion.direction;

    // Collect raw values for this criterion across all alternatives
    const values = alternatives.map((alt) => {
      const altKey = String(alt.id || alt.name);
      const altScores = rawScores[altKey] || rawScores[alt.name] || rawScores[alt.id] || {};
      const val = altScores[critKey] ?? altScores[criterion.name] ?? altScores[criterion.id] ?? 0;
      return Number(val);
    });

    const min = Math.min(...values);
    const max = Math.max(...values);

    const alternativePerformance = [];

    alternatives.forEach((alt, idx) => {
      const altKey = String(alt.id || alt.name);
      const raw = values[idx];
      const norm = normalizeValue({ value: raw, min, max, direction });
      const weighted = calculateWeightedScore(norm, weight);

      normalizedMatrix[altKey][critKey] = {
        criterionId: criterion.id,
        criterionName: criterion.name,
        rawValue: raw,
        normalizedScore: norm,
        weightedScore: weighted,
        weight,
        direction
      };

      alternativePerformance.push({
        alternativeId: alt.id,
        alternativeName: alt.name,
        rawValue: raw,
        normalizedScore: norm,
        weightedScore: weighted
      });
    });

    criterionAnalysis.push({
      criterionId: criterion.id,
      criterionName: criterion.name,
      weight,
      direction,
      range: { min, max },
      equalMinMax: min === max,
      alternativePerformance
    });
  });

  // 3. Compile Overall Scores and Rankings
  const rankings = alternatives.map((alt) => {
    const altKey = String(alt.id || alt.name);
    const criterionScores = Object.values(normalizedMatrix[altKey]);
    const overallScore = Math.round(
      criterionScores.reduce((sum, cs) => sum + cs.weightedScore, 0) * 100
    ) / 100;

    const riskAssessment = calculateRiskAssessment({
      alternative: alt,
      criterionScores,
      evidence
    });

    return {
      alternative: {
        id: alt.id,
        name: alt.name,
        description: alt.description || null
      },
      overallScore,
      criterionScores,
      riskAssessment
    };
  });

  // Sort descending by overall score
  rankings.sort((a, b) => b.overallScore - a.overallScore);

  // Assign ranks (with tie-handling support)
  let currentRank = 1;
  rankings.forEach((entry, idx) => {
    if (idx > 0 && entry.overallScore < rankings[idx - 1].overallScore) {
      currentRank = idx + 1;
    }
    entry.rank = currentRank;
    entry.isWinner = idx === 0;
  });

  const recommendedAlternative = rankings[0] || null;
  const confidence = calculateConfidence({ rankings, criteria, evidence });

  return {
    decision: {
      id: decision.id,
      title: decision.title,
      question: decision.question
    },
    recommendedAlternative: {
      rank: 1,
      alternative: recommendedAlternative.alternative,
      overallScore: recommendedAlternative.overallScore,
      riskLevel: recommendedAlternative.riskAssessment.riskLevel,
      riskScore: recommendedAlternative.riskAssessment.riskScore
    },
    rankings,
    criterionAnalysis,
    riskAssessment: {
      winnerRisk: recommendedAlternative.riskAssessment,
      overallSystemRisk: recommendedAlternative.riskAssessment.riskLevel,
      methodology: 'VERA Risk Assessment (Variance + Downside Deficit + Conflicting Evidence Ratio)'
    },
    calculationSummary: {
      alternativesEvaluated: alternatives.length,
      criteriaCount: criteria.length,
      evidenceRecordsConsidered: evidence.length,
      topWinnerSpread: rankings.length > 1 ? Math.round((rankings[0].overallScore - rankings[1].overallScore) * 100) / 100 : 0,
      deterministicEngineVersion: '1.0.0-deterministic'
    },
    confidence
  };
};
