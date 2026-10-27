-- ==============================================================================
-- FDR GUARDIAN: SUPABASE POSTGRESQL SCHEMA MIGRATION
-- File: database/migrations/001_initial_schema.sql
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE (Supabase Auth linked or direct administrative identity)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    mobile_number TEXT,
    hashed_password TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('institution_user', 'bank_officer', 'regulatory_officer', 'system_admin')),
    account_status TEXT NOT NULL DEFAULT 'approved' CHECK (account_status IN ('approved', 'pending_approval', 'rejected', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. STATES TABLE
CREATE TABLE IF NOT EXISTS states (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code TEXT NOT NULL UNIQUE,
    country_code TEXT NOT NULL DEFAULT 'IN'
);

-- 3. DISTRICTS TABLE
CREATE TABLE IF NOT EXISTS districts (
    id SERIAL PRIMARY KEY,
    state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT,
    CONSTRAINT unique_state_district UNIQUE (state_id, name)
);

-- 4. INSTITUTIONS TABLE
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    institution_code TEXT UNIQUE, -- AICTE / Permanent Regulatory ID
    institution_type TEXT DEFAULT 'ENGINEERING',
    state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE RESTRICT,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE RESTRICT,
    address TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INSTITUTION PROFILES
CREATE TABLE IF NOT EXISTS institution_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    designation TEXT NOT NULL,
    verification_status TEXT DEFAULT 'verified'
);

-- 6. BANK PROFILES
CREATE TABLE IF NOT EXISTS bank_officer_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    branch_or_office TEXT NOT NULL,
    designation TEXT NOT NULL,
    employee_id TEXT,
    verification_status TEXT DEFAULT 'pending'
);

-- 7. REGULATORY OFFICER PROFILES
CREATE TABLE IF NOT EXISTS regulatory_officer_profiles (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    designation TEXT NOT NULL,
    office_or_jurisdiction TEXT NOT NULL,
    employee_reference TEXT,
    verification_status TEXT DEFAULT 'pending'
);

-- 8. ACCESS REQUESTS TABLE
CREATE TABLE IF NOT EXISTS access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    requested_role TEXT NOT NULL CHECK (requested_role IN ('institution_user', 'bank_officer', 'regulatory_officer')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'info_required')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INSTITUTION ADDITION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS institution_addition_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    state_id INTEGER NOT NULL REFERENCES states(id) ON DELETE CASCADE,
    district_id INTEGER NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
    requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. BANKS MASTER TABLE
CREATE TABLE IF NOT EXISTS banks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    ifsc_prefix TEXT NOT NULL,
    nodal_officer TEXT,
    nodal_email TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. FDRs TABLE
CREATE TABLE IF NOT EXISTS fdrs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdr_number TEXT NOT NULL,
    public_verification_id TEXT UNIQUE NOT NULL,
    institution_id UUID NOT NULL REFERENCES institutions(id) ON DELETE RESTRICT,
    bank_id UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
    branch_name TEXT NOT NULL,
    holder_name TEXT NOT NULL,
    joint_holder_name TEXT,
    principal_amount NUMERIC(15, 2) NOT NULL CHECK (principal_amount > 0),
    issue_date DATE NOT NULL,
    maturity_date DATE NOT NULL,
    tenure_months INTEGER NOT NULL,
    interest_rate NUMERIC(5, 2) NOT NULL,
    deposit_category TEXT NOT NULL CHECK (deposit_category IN ('PERMANENT_SECURITY', 'INFRASTRUCTURE_FUND', 'COURSE_AFFILIATION', 'ENDOWMENT')),
    lien_marked_to TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'Submitted',
    ocr_confidence_average NUMERIC(5, 2) DEFAULT 95.0,
    service_target_days INTEGER DEFAULT 5,
    delay_reason TEXT,
    submitted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_fdr_per_bank UNIQUE (fdr_number, bank_id)
);

-- 12. DOCUMENTS TABLE
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    sha256_hash TEXT NOT NULL,
    version INTEGER DEFAULT 1,
    uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. BANK VERIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS bank_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'CONFIRMED', 'MISMATCH', 'UNABLE_TO_VERIFY', 'INFO_REQUIRED')),
    reference_number TEXT,
    officer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    comments TEXT,
    supporting_evidence_url TEXT,
    verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. REGULATORY DECISIONS TABLE
CREATE TABLE IF NOT EXISTS regulatory_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fdr_id UUID NOT NULL REFERENCES fdrs(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED', 'FURTHER_VERIFICATION')),
    reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    decision_reason TEXT,
    conditions_json JSONB,
    decided_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type TEXT,
    entity_id TEXT,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'INFO',
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_districts_state ON districts(state_id);
CREATE INDEX IF NOT EXISTS idx_institutions_district ON institutions(district_id);
CREATE INDEX IF NOT EXISTS idx_fdrs_institution ON fdrs(institution_id);
CREATE INDEX IF NOT EXISTS idx_fdrs_bank ON fdrs(bank_id);
CREATE INDEX IF NOT EXISTS idx_fdrs_status ON fdrs(status);
CREATE INDEX IF NOT EXISTS idx_fdrs_public_vfy ON fdrs(public_verification_id);
CREATE INDEX IF NOT EXISTS idx_access_requests_user ON access_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
