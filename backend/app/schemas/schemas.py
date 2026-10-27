from typing import Optional, List, Any, Dict
from datetime import datetime, date
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field

# ----------------- Auth & Profile Schemas -----------------
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    full_name: str
    email: EmailStr
    mobile_number: str
    password: str
    requested_role: str # institution_user, bank_officer, regulatory_officer
    
    # Dependent location fields
    country: str = "IN"
    state_id: Optional[int] = None
    district_id: Optional[int] = None
    
    # Institution user specific
    institution_id: Optional[UUID] = None
    institution_name: Optional[str] = None # When requesting missing institution
    designation: Optional[str] = None
    
    # Bank officer specific
    bank_name: Optional[str] = None
    branch_or_office: Optional[str] = None
    employee_id: Optional[str] = None
    
    # Regulatory officer specific
    office_or_jurisdiction: Optional[str] = None
    employee_reference: Optional[str] = None

class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    mobile_number: Optional[str] = None

class InstitutionProfileResponse(BaseModel):
    institution_id: UUID
    institution_name: Optional[str] = None
    institution_code: Optional[str] = None
    designation: str
    verification_status: str

    class Config:
        from_attributes = True

class BankOfficerProfileResponse(BaseModel):
    bank_name: str
    branch_or_office: str
    designation: str
    employee_id: Optional[str] = None
    verification_status: str

    class Config:
        from_attributes = True

class RegulatoryOfficerProfileResponse(BaseModel):
    designation: str
    office_or_jurisdiction: str
    employee_reference: Optional[str] = None
    verification_status: str

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: UUID
    full_name: str
    email: str
    mobile_number: Optional[str] = None
    role: str
    account_status: str
    created_at: datetime
    institution_profile: Optional[InstitutionProfileResponse] = None
    bank_profile: Optional[BankOfficerProfileResponse] = None
    regulatory_profile: Optional[RegulatoryOfficerProfileResponse] = None

    class Config:
        from_attributes = True

TokenResponse.update_forward_refs()

# ----------------- Locations & Institutions -----------------
class StateResponse(BaseModel):
    id: int
    name: str
    code: str
    country_code: str

    class Config:
        from_attributes = True

class DistrictResponse(BaseModel):
    id: int
    state_id: int
    name: str
    code: Optional[str] = None

    class Config:
        from_attributes = True

class InstitutionResponse(BaseModel):
    id: UUID
    institution_name: str
    institution_code: Optional[str] = None
    institution_type: Optional[str] = "ENGINEERING"
    state_id: int
    district_id: int
    address: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

class InstitutionAdditionRequestCreate(BaseModel):
    institution_name: str
    state_id: int
    district_id: int

class InstitutionAdditionRequestResponse(BaseModel):
    id: UUID
    institution_name: str
    state_id: int
    district_id: int
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ----------------- Access Requests (Admin) -----------------
class AccessRequestResponse(BaseModel):
    id: UUID
    user_id: UUID
    applicant_name: str
    applicant_email: str
    applicant_mobile: Optional[str] = None
    requested_role: str
    organization_details: Dict[str, Any]
    status: str
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[datetime] = None
    review_notes: Optional[str] = None
    created_at: datetime

class AccessRequestDecision(BaseModel):
    reason: Optional[str] = None

# ----------------- Bank Master -----------------
class BankResponse(BaseModel):
    id: UUID
    code: str
    name: str
    ifsc_prefix: str
    nodal_officer: Optional[str] = None
    nodal_email: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True

# ----------------- FDR Management -----------------
class FDRCreate(BaseModel):
    fdr_number: str
    institution_id: UUID
    bank_id: UUID
    branch_name: str
    holder_name: str
    joint_holder_name: Optional[str] = None
    principal_amount: float
    issue_date: date
    maturity_date: date
    tenure_months: int
    interest_rate: float
    deposit_category: str # PERMANENT_SECURITY, INFRASTRUCTURE_FUND, COURSE_AFFILIATION, ENDOWMENT
    lien_marked_to: str

class FDRUpdate(BaseModel):
    principal_amount: Optional[float] = None
    interest_rate: Optional[float] = None
    maturity_date: Optional[date] = None
    delay_reason: Optional[str] = None

class DocumentResponse(BaseModel):
    id: UUID
    file_name: str
    file_size: int
    file_type: str
    storage_path: str
    sha256_hash: str
    version: int
    uploaded_at: datetime

    class Config:
        from_attributes = True

class BankVerificationCreate(BaseModel):
    status: str # CONFIRMED, MISMATCH, UNABLE_TO_VERIFY, INFO_REQUIRED
    reference_number: Optional[str] = None
    comments: Optional[str] = None
    supporting_evidence_url: Optional[str] = None

class BankVerificationResponse(BaseModel):
    id: UUID
    status: str
    reference_number: Optional[str] = None
    comments: Optional[str] = None
    supporting_evidence_url: Optional[str] = None
    verified_at: datetime

    class Config:
        from_attributes = True

class RegulatoryDecisionCreate(BaseModel):
    status: str # APPROVED, REJECTED, CLARIFICATION_REQUIRED, FURTHER_VERIFICATION
    decision_reason: str
    conditions_json: Optional[Dict[str, Any]] = None

class RegulatoryDecisionResponse(BaseModel):
    id: UUID
    status: str
    decision_reason: Optional[str] = None
    conditions_json: Optional[Dict[str, Any]] = None
    decided_at: datetime

    class Config:
        from_attributes = True

class FDRResponse(BaseModel):
    id: UUID
    fdr_number: str
    public_verification_id: str
    institution_id: UUID
    institution_name: Optional[str] = None
    bank_id: UUID
    bank_name: Optional[str] = None
    branch_name: str
    holder_name: str
    joint_holder_name: Optional[str] = None
    principal_amount: float
    issue_date: date
    maturity_date: date
    tenure_months: int
    interest_rate: float
    deposit_category: str
    lien_marked_to: str
    status: str
    ocr_confidence_average: float
    service_target_days: int
    delay_reason: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    documents: List[DocumentResponse] = []
    verifications: List[BankVerificationResponse] = []
    decisions: List[RegulatoryDecisionResponse] = []

    class Config:
        from_attributes = True

# ----------------- Audit Logs & Notifications -----------------
class AuditLogResponse(BaseModel):
    id: UUID
    actor_name: str
    actor_role: str
    action: str
    entity_type: Optional[str] = None
    entity_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: UUID
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
