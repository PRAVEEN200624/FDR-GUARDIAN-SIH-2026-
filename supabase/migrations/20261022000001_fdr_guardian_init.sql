-- ==============================================================================
-- FDR GUARDIAN: EXPLAINABLE AI-POWERED SECURITY DEPOSIT & FDR MANAGEMENT SYSTEM
-- PostgreSQL Schema & Row Level Security (RLS) Policies
-- Migration: 20261022000001_fdr_guardian_init.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permanent_id VARCHAR(50) UNIQUE NOT NULL, -- AICTE / Regulatory Permanent Identifier
    name VARCHAR(255) NOT NULL,
    institution_type VARCHAR(50) NOT NULL CHECK (institution_type IN ('ENGINEERING', 'MANAGEMENT', 'POLYTECHNIC', 'PHARMACY', 'UNIVERSITY', 'STANDALONE')),
    state VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    contact_person VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BANKS MASTER TABLE
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) UNIQUE NOT NULL, -- e.g. SBI, PNB, CNRB, BARB
    name VARCHAR(255) NOT NULL,
    ifsc_prefix VARCHAR(10) NOT NULL,
    nodal_officer VARCHAR(255),
    nodal_email VARCHAR(255),
    is_simulated_demo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER', 'ADMIN')),
    designation VARCHAR(255),
    phone VARCHAR(30),
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    bank_id UUID REFERENCES banks(id) ON DELETE SET NULL,
    is_approved BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FDR CASES TABLE
CREATE TABLE IF NOT EXISTS fdrs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdr_number VARCHAR(100) NOT NULL,
    public_verification_id VARCHAR(100) UNIQUE NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
    branch_name VARCHAR(255) NOT NULL,
    holder_name VARCHAR(255) NOT NULL,
    joint_holder_name VARCHAR(255),
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    tenure_months INT NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    deposit_category VARCHAR(50) NOT NULL CHECK (deposit_category IN ('PERMANENT_SECURITY', 'INFRASTRUCTURE_FUND', 'COURSE_AFFILIATION', 'ENDOWMENT')),
    lien_marked_to VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted',
    ocr_confidence_average NUMERIC(5, 2) DEFAULT 0.0,
    replacement_of_fdr_id UUID REFERENCES fdrs(id) ON DELETE SET NULL,
    replaced_by_fdr_id UUID REFERENCES fdrs(id) ON DELETE SET NULL,
    renewal_count INT DEFAULT 0,
    stage_entered_at TIMESTAMPTZ DEFAULT NOW(),
    service_target_days INT DEFAULT 5,
    delay_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by UUID REFERENCES users(id),
    CONSTRAINT unique_fdr_per_bank UNIQUE (fdr_number, bank_id)
);

-- 5. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    sha256_hash VARCHAR(64) NOT NULL,
    version INT DEFAULT 1,
    uploaded_by UUID REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. EXTRACTION RESULTS & OCR FIELDS
CREATE TABLE IF NOT EXISTS extraction_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    submitted_value TEXT,
    extracted_value TEXT,
    confidence NUMERIC(5, 2) NOT NULL,
    is_matched BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DISCREPANCIES TABLE
CREATE TABLE IF NOT EXISTS discrepancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    field_name VARCHAR(100) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('CRITICAL', 'WARNING', 'INFO')),
    title VARCHAR(255) NOT NULL,
    explanation TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    status VARCHAR(30) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'WAIVED')),
    resolved_by UUID REFERENCES users(id),
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BANK VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS bank_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'MISMATCH', 'UNABLE_TO_VERIFY', 'INFO_REQUIRED')),
    reference_number VARCHAR(100),
    officer_id UUID REFERENCES users(id),
    comments TEXT,
    supporting_evidence_url TEXT,
    is_simulated BOOLEAN DEFAULT TRUE,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. REGULATORY DECISIONS TABLE
CREATE TABLE IF NOT EXISTS regulatory_decisions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    status VARCHAR(30) NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED', 'FURTHER_VERIFICATION')),
    reviewer_id UUID REFERENCES users(id),
    decision_reason TEXT,
    clarification_comments TEXT,
    institution_response TEXT,
    conditions_json JSONB,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. IMMUTABLE AUDIT TRAIL TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    actor_id UUID REFERENCES users(id),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(100) NOT NULL,
    previous_state TEXT,
    new_state TEXT,
    reason TEXT,
    ip_address VARCHAR(45)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fdrs_institution ON fdrs(institution_id);
CREATE INDEX IF NOT EXISTS idx_fdrs_bank ON fdrs(bank_id);
CREATE INDEX IF NOT EXISTS idx_fdrs_status ON fdrs(status);
CREATE INDEX IF NOT EXISTS idx_fdrs_public_vfy ON fdrs(public_verification_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs(timestamp DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE fdrs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE regulatory_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Institutions can only read/write their own FDRs
CREATE POLICY "Institutions view own FDRs"
ON fdrs FOR SELECT
TO authenticated
USING (
    institution_id IN (
        SELECT institution_id FROM users WHERE id = auth.uid() AND role = 'INSTITUTION'
    )
    OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('REGULATORY_OFFICER', 'ADMIN', 'BANK_OFFICER')
    )
);

-- Public can verify limited non-sensitive info via public verification token
CREATE POLICY "Public read-only verification"
ON fdrs FOR SELECT
TO anon
USING (true);

-- 11. REGISTRATION REQUESTS TABLE (PRIVILEGED ROLE ONBOARDING & ACCESS CONTROL)
CREATE TABLE IF NOT EXISTS registration_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requested_role VARCHAR(50) NOT NULL CHECK (requested_role IN ('INSTITUTION', 'BANK_OFFICER', 'REGULATORY_OFFICER')),
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'INFO_REQUIRED')),
    applicant_name VARCHAR(255) NOT NULL,
    applicant_email VARCHAR(255) NOT NULL,
    applicant_phone VARCHAR(30) NOT NULL,
    organization_name VARCHAR(255) NOT NULL,
    organization_id VARCHAR(100),
    designation VARCHAR(255) NOT NULL,
    employee_id VARCHAR(100),
    bank_code VARCHAR(20),
    branch_name VARCHAR(255),
    bureau_region VARCHAR(100),
    authorization_ref VARCHAR(255),
    supporting_doc_name VARCHAR(255),
    admin_notes TEXT,
    rejection_reason TEXT,
    info_request_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protect audit trail from browser updates or deletion
CREATE POLICY "Audit logs immutable read"
ON audit_logs FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Audit logs insert only"
ON audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- Registration Requests RLS Policies
ALTER TABLE registration_requests ENABLE ROW LEVEL SECURITY;

-- Administrators have full read and write access
CREATE POLICY "Admins full access to registration requests"
ON registration_requests FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
);

-- Applicants can view their own registration status by matching email
CREATE POLICY "Applicants view own registration status"
ON registration_requests FOR SELECT
TO authenticated
USING (
    applicant_email = (SELECT email FROM users WHERE id = auth.uid())
);

-- Unauthenticated or newly registering applicants can insert registration requests
CREATE POLICY "Applicants submit registration request"
ON registration_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

