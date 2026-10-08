/**
 * Decision Service
 * Implements CRUD for decisions, criteria, and alternatives with strict user ownership,
 * and executes the deterministic Decision Intelligence engine.
 */
import supabase from './supabaseClient.js';
import { AppError } from '../utils/appError.js';
import { executeDecisionEngine } from './decisionEngine.js';
import { generateDecisionInterpretation, chatDecision as geminiChatDecision } from './geminiService.js';

export const listDecisions = async (userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  const { data, error } = await supabase
    .from('decisions')
    .select('*, criteria(count), alternatives(*), evidence(count), decision_results(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch decisions: ${error.message}`, 500, 'DB_ERROR');
  }

  return data || [];
};

export const createDecision = async (decisionData, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // 1. Create Decision record
  const { data: newDecision, error: decError } = await supabase
    .from('decisions')
    .insert({
      user_id: userId,
      title: decisionData.title.trim(),
      question: decisionData.question.trim(),
      description: decisionData.description?.trim() || null,
      status: 'ACTIVE'
    })
    .select()
    .single();

  if (decError) {
    throw new AppError(`Failed to create decision: ${decError.message}`, 500, 'DB_ERROR');
  }

  try {
    // 2. Insert Criteria
    const criteriaToInsert = decisionData.criteria.map((c) => ({
      decision_id: newDecision.id,
      name: c.name.trim(),
      weight: Number(c.weight),
      direction: c.direction,
      description: c.description?.trim() || null
    }));

    const { data: insertedCriteria, error: critError } = await supabase
      .from('criteria')
      .insert(criteriaToInsert)
      .select();

    if (critError) {
      // Rollback decision on failure
      await supabase.from('decisions').delete().eq('id', newDecision.id);
      throw new AppError(`Failed to insert criteria: ${critError.message}`, 500, 'DB_ERROR');
    }

    // 3. Insert Alternatives
    const alternativesToInsert = decisionData.alternatives.map((a) => ({
      decision_id: newDecision.id,
      name: a.name.trim(),
      description: a.description?.trim() || null
    }));

    const { data: insertedAlts, error: altsError } = await supabase
      .from('alternatives')
      .insert(alternativesToInsert)
      .select();

    if (altsError) {
      // Rollback decision on failure
      await supabase.from('decisions').delete().eq('id', newDecision.id);
      throw new AppError(`Failed to insert alternatives: ${altsError.message}`, 500, 'DB_ERROR');
    }

    return {
      ...newDecision,
      criteria: insertedCriteria,
      alternatives: insertedAlts
    };
  } catch (err) {
    // Cleanup on unexpected exception
    await supabase.from('decisions').delete().eq('id', newDecision.id).catch(() => {});
    throw err;
  }
};

export const getDecisionById = async (id, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // Check if decision exists
  const { data: decision, error } = await supabase
    .from('decisions')
    .select('*, criteria(*), alternatives(*, alternative_scores(*)), evidence(*), decision_results(*)')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    throw new AppError(`Database lookup failed: ${error.message}`, 500, 'DB_ERROR');
  }

  if (!decision) {
    throw new AppError('Decision not found', 404, 'NOT_FOUND');
  }

  // Strict ownership check
  if (decision.user_id !== userId) {
    throw new AppError('Forbidden: You do not have permission to access this decision', 403, 'FORBIDDEN');
  }

  return decision;
};

export const deleteDecision = async (id, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // Verify ownership before deleting
  const { data: decision, error: findError } = await supabase
    .from('decisions')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    throw new AppError(`Database check failed: ${findError.message}`, 500, 'DB_ERROR');
  }

  if (!decision) {
    throw new AppError('Decision not found', 404, 'NOT_FOUND');
  }

  if (decision.user_id !== userId) {
    throw new AppError('Forbidden: You do not own this decision', 403, 'FORBIDDEN');
  }

  const { error: deleteError } = await supabase
    .from('decisions')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (deleteError) {
    throw new AppError(`Failed to delete decision: ${deleteError.message}`, 500, 'DB_ERROR');
  }

  return { message: 'Decision deleted successfully', id };
};

export const updateDecision = async (id, updateData = {}, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // Verify ownership before updating
  const { data: decision, error: findError } = await supabase
    .from('decisions')
    .select('id, user_id')
    .eq('id', id)
    .maybeSingle();

  if (findError) {
    throw new AppError(`Database check failed: ${findError.message}`, 500, 'DB_ERROR');
  }

  if (!decision) {
    throw new AppError('Decision not found', 404, 'NOT_FOUND');
  }

  if (decision.user_id !== userId) {
    throw new AppError('Forbidden: You do not own this decision', 403, 'FORBIDDEN');
  }

  const allowedFields = {};
  if (updateData.title !== undefined) allowedFields.title = String(updateData.title).trim();
  if (updateData.description !== undefined) allowedFields.description = String(updateData.description).trim();
  if (updateData.question !== undefined) allowedFields.question = String(updateData.question).trim();
  if (updateData.status !== undefined) allowedFields.status = updateData.status;
  allowedFields.updated_at = new Date().toISOString();

  const { data: updated, error: updateError } = await supabase
    .from('decisions')
    .update(allowedFields)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (updateError) {
    throw new AppError(`Failed to update decision: ${updateError.message}`, 500, 'DB_ERROR');
  }

  return updated;
};

export const analyzeDecision = async (id, analysisOptions = {}, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User ID is required', 401, 'UNAUTHORIZED');
  }

  // 1. Verify ownership and fetch decision with all child relations
  const decision = await getDecisionById(id, userId);

  // Reconstruct effective raw scores from stored alternative_scores if not supplied in payload
  let effectiveRawScores = analysisOptions.rawScores;
  if (!effectiveRawScores || Object.keys(effectiveRawScores).length === 0) {
    effectiveRawScores = {};
    (decision.alternatives || []).forEach((alt) => {
      effectiveRawScores[alt.name] = {};
      (alt.alternative_scores || []).forEach((sc) => {
        const crit = (decision.criteria || []).find((c) => c.id === sc.criterion_id);
        if (crit) {
          effectiveRawScores[alt.name][crit.name] = Number(sc.raw_value);
        }
      });
    });
  }

  // 2. Execute deterministic engine calculation (Gemini MUST NOT calculate rankings)
  const engineResult = executeDecisionEngine({
    decision,
    criteria: decision.criteria || [],
    alternatives: decision.alternatives || [],
    rawScores: effectiveRawScores,
    evidence: decision.evidence || []
  });

  // 3. AI Interpretation via Gemini (interprets deterministic results only)
  let aiInterpretation = null;
  const existingInterpretation = decision.decision_results?.[0]?.ai_interpretation_json;
  const isCachedValid = existingInterpretation &&
    existingInterpretation.status === 'success' &&
    !analysisOptions.forceAiRefresh;

  // Avoid unnecessary repeated Gemini calls if cached interpretation is valid and rawScores haven't changed
  if (isCachedValid && (!analysisOptions.rawScores || Object.keys(analysisOptions.rawScores).length === 0)) {
    aiInterpretation = existingInterpretation;
  } else if (analysisOptions.includeAiInterpretation !== false) {
    aiInterpretation = await generateDecisionInterpretation({
      decision,
      engineResult,
      evidence: decision.evidence || []
    });
  } else {
    aiInterpretation = existingInterpretation || {
      status: 'unavailable',
      message: 'AI interpretation is temporarily unavailable.'
    };
  }

  // 4. Persist calculation results & AI interpretation into decision_results table
  if (supabase && engineResult.recommendedAlternative?.alternative?.id) {
    const existingResultId = decision.decision_results?.[0]?.id;
    const resultPayload = {
      decision_id: id,
      recommended_alternative_id: engineResult.recommendedAlternative.alternative.id,
      overall_score: engineResult.recommendedAlternative.overallScore,
      risk_score: engineResult.recommendedAlternative.riskScore,
      risk_level: engineResult.recommendedAlternative.riskLevel,
      confidence: engineResult.confidence,
      ranking_json: engineResult.rankings,
      calculation_json: engineResult.criterionAnalysis,
      ai_interpretation_json: aiInterpretation
    };

    if (existingResultId) {
      const { error: updateError } = await supabase
        .from('decision_results')
        .update(resultPayload)
        .eq('id', existingResultId);

      if (updateError) {
        console.warn('Warning: Could not update decision_results row:', updateError.message);
      }
    } else {
      const { error: insertError } = await supabase
        .from('decision_results')
        .insert(resultPayload);

      if (insertError) {
        console.warn('Warning: Could not insert decision_results row:', insertError.message);
      }
    }
  }

  return {
    ...engineResult,
    aiInterpretation
  };
};

export const chatDecision = async ({ message, conversationHistory = [], searchWeb = false, userId }) => {
  return await geminiChatDecision({ message, conversationHistory, searchWeb });
};

