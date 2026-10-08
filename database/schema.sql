-- ==============================================================================
-- VERA: Verified Evidence and Research Assistant
-- Database Schema for Supabase PostgreSQL
-- ==============================================================================

-- Enable UUID extension if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. USERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ==============================================================================
-- 2. DECISIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    question TEXT NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'ACTIVE', 'COMPLETED', 'ARCHIVED')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_decisions_user_id ON decisions(user_id);
CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);

-- ==============================================================================
-- 3. CRITERIA TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    weight NUMERIC(5, 2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
    direction VARCHAR(30) NOT NULL CHECK (direction IN ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_criteria_decision_id ON criteria(decision_id);

-- ==============================================================================
-- 4. ALTERNATIVES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS alternatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_alternatives_decision_id ON alternatives(decision_id);

-- ==============================================================================
-- 5. ALTERNATIVE SCORES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS alternative_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alternative_id UUID NOT NULL REFERENCES alternatives(id) ON DELETE CASCADE,
    criterion_id UUID NOT NULL REFERENCES criteria(id) ON DELETE CASCADE,
    raw_value NUMERIC NOT NULL,
    normalized_score NUMERIC(7, 4),
    weighted_score NUMERIC(7, 4),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_alt_crit UNIQUE (alternative_id, criterion_id)
);

CREATE INDEX IF NOT EXISTS idx_alt_scores_alt_id ON alternative_scores(alternative_id);
CREATE INDEX IF NOT EXISTS idx_alt_scores_crit_id ON alternative_scores(criterion_id);

-- ==============================================================================
-- 6. EVIDENCE TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    source VARCHAR(255) NOT NULL,
    source_type VARCHAR(100) NOT NULL,
    evidence_text TEXT NOT NULL,
    relevance_score NUMERIC(5, 2),
    reliability_score NUMERIC(5, 2),
    supporting_alternative VARCHAR(255),
    evidence_direction VARCHAR(30) NOT NULL CHECK (evidence_direction IN ('SUPPORTING', 'CONFLICTING', 'NEUTRAL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evidence_decision_id ON evidence(decision_id);
CREATE INDEX IF NOT EXISTS idx_evidence_direction ON evidence(evidence_direction);

-- ==============================================================================
-- 7. DECISION RESULTS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS decision_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES decisions(id) ON DELETE CASCADE,
    recommended_alternative_id UUID REFERENCES alternatives(id) ON DELETE SET NULL,
    overall_score NUMERIC(7, 4),
    risk_score NUMERIC(7, 4),
    risk_level VARCHAR(30) CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    confidence NUMERIC(5, 2) CHECK (confidence >= 0 AND confidence <= 100),
    ranking_json JSONB,
    calculation_json JSONB,
    ai_interpretation_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_results_decision_id ON decision_results(decision_id);
CREATE INDEX IF NOT EXISTS idx_results_recommended_alt ON decision_results(recommended_alternative_id);

-- ==============================================================================
-- AUTOMATIC TIMESTAMP UPDATE TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_decisions_updated_at
BEFORE UPDATE ON decisions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
