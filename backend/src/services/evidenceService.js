/**
 * Evidence Service
 * Handles persistence and ownership validation for empirical evidence records.
 */
import supabase from './supabaseClient.js';
import { AppError } from '../utils/appError.js';

export const attachEvidence = async (decisionId, evidenceData, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User identity required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // 1. Verify that the parent decision exists and belongs to the authenticated user
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .select('id, user_id')
    .eq('id', decisionId)
    .maybeSingle();

  if (decError) {
    throw new AppError(`Database lookup failed: ${decError.message}`, 500, 'DB_ERROR');
  }

  if (!decision) {
    throw new AppError('Decision not found', 404, 'NOT_FOUND');
  }

  if (decision.user_id !== userId) {
    throw new AppError('Forbidden: You do not have permission to attach evidence to this decision', 403, 'FORBIDDEN');
  }

  // 2. Insert Evidence record
  const { data: newEvidence, error: insertError } = await supabase
    .from('evidence')
    .insert({
      decision_id: decisionId,
      title: evidenceData.title.trim(),
      source: evidenceData.source.trim(),
      source_type: evidenceData.sourceType,
      evidence_text: evidenceData.evidenceText.trim(),
      relevance_score: evidenceData.relevanceScore !== undefined ? Number(evidenceData.relevanceScore) : null,
      reliability_score: evidenceData.reliabilityScore !== undefined ? Number(evidenceData.reliabilityScore) : null,
      supporting_alternative: evidenceData.supportingAlternative.trim(),
      evidence_direction: evidenceData.evidenceDirection
    })
    .select()
    .single();

  if (insertError) {
    throw new AppError(`Failed to save evidence: ${insertError.message}`, 500, 'DB_ERROR');
  }

  return newEvidence;
};

export const listEvidenceByDecision = async (decisionId, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User identity required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // 1. Verify ownership of the decision
  const { data: decision, error: decError } = await supabase
    .from('decisions')
    .select('id, user_id')
    .eq('id', decisionId)
    .maybeSingle();

  if (decError) {
    throw new AppError(`Database lookup failed: ${decError.message}`, 500, 'DB_ERROR');
  }

  if (!decision) {
    throw new AppError('Decision not found', 404, 'NOT_FOUND');
  }

  if (decision.user_id !== userId) {
    throw new AppError('Forbidden: You do not have permission to view evidence for this decision', 403, 'FORBIDDEN');
  }

  // 2. Fetch evidence list
  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('decision_id', decisionId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`Failed to fetch evidence list: ${error.message}`, 500, 'DB_ERROR');
  }

  return data || [];
};

export const deleteEvidence = async (evidenceId, userId) => {
  if (!userId) {
    throw new AppError('Unauthorized: User identity required', 401, 'UNAUTHORIZED');
  }

  if (!supabase) {
    throw new AppError('Database connection unavailable', 500, 'DB_UNAVAILABLE');
  }

  // 1. Query evidence with parent decision to verify user ownership
  const { data: evidence, error: findError } = await supabase
    .from('evidence')
    .select('id, decision_id, decisions(user_id)')
    .eq('id', evidenceId)
    .maybeSingle();

  if (findError) {
    throw new AppError(`Database lookup failed: ${findError.message}`, 500, 'DB_ERROR');
  }

  if (!evidence) {
    throw new AppError('Evidence item not found', 404, 'NOT_FOUND');
  }

  const parentOwnerId = evidence.decisions?.user_id;
  if (parentOwnerId !== userId) {
    throw new AppError('Forbidden: You do not have permission to delete this evidence', 403, 'FORBIDDEN');
  }

  // 2. Delete Evidence
  const { error: deleteError } = await supabase
    .from('evidence')
    .delete()
    .eq('id', evidenceId);

  if (deleteError) {
    throw new AppError(`Failed to delete evidence: ${deleteError.message}`, 500, 'DB_ERROR');
  }

  return { message: 'Evidence deleted successfully', id: evidenceId };
};
