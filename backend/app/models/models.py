import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Text, Boolean, Integer, Numeric, Date, DateTime, ForeignKey, JSON
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from backend.app.db.session import Base

class Profile(Base):
    __tablename__ = "profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False, index=True)
    mobile_number = Column(Text, nullable=True)
    hashed_password = Column(Text, nullable=False)
    role = Column(Text, nullable=False) # institution_user, bank_officer, regulatory_officer, system_admin
    account_status = Column(Text, nullable=False, default="approved") # approved, pending_approval, rejected, suspended
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    institution_profile = relationship("InstitutionProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    bank_profile = relationship("BankOfficerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    regulatory_profile = relationship("RegulatoryOfficerProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    access_requests = relationship("AccessRequest", foreign_keys="[AccessRequest.user_id]", back_populates="user")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")

class State(Base):
    __tablename__ = "states"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(Text, nullable=False, unique=True)
    code = Column(Text, nullable=False, unique=True)
    country_code = Column(Text, nullable=False, default="IN")

    districts = relationship("District", back_populates="state", cascade="all, delete-orphan")
    institutions = relationship("Institution", back_populates="state")

class District(Base):
    __tablename__ = "districts"

    id = Column(Integer, primary_key=True, index=True)
    state_id = Column(Integer, ForeignKey("states.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(Text, nullable=False)
    code = Column(Text, nullable=True)

    state = relationship("State", back_populates="districts")
    institutions = relationship("Institution", back_populates="district")

class Institution(Base):
    __tablename__ = "institutions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_name = Column(Text, nullable=False)
    institution_code = Column(Text, unique=True, nullable=True)
    institution_type = Column(Text, default="ENGINEERING")
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False, index=True)
    address = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    state = relationship("State", back_populates="institutions")
    district = relationship("District", back_populates="institutions")
    fdrs = relationship("FDR", back_populates="institution")

class InstitutionProfile(Base):
    __tablename__ = "institution_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=False)
    designation = Column(Text, nullable=False)
    verification_status = Column(Text, default="verified")

    user = relationship("Profile", back_populates="institution_profile")
    institution = relationship("Institution")

class BankOfficerProfile(Base):
    __tablename__ = "bank_officer_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    bank_name = Column(Text, nullable=False)
    branch_or_office = Column(Text, nullable=False)
    designation = Column(Text, nullable=False)
    employee_id = Column(Text, nullable=True)
    verification_status = Column(Text, default="pending")

    user = relationship("Profile", back_populates="bank_profile")

class RegulatoryOfficerProfile(Base):
    __tablename__ = "regulatory_officer_profiles"

    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), primary_key=True)
    designation = Column(Text, nullable=False)
    office_or_jurisdiction = Column(Text, nullable=False)
    employee_reference = Column(Text, nullable=True)
    verification_status = Column(Text, default="pending")

    user = relationship("Profile", back_populates="regulatory_profile")

class AccessRequest(Base):
    __tablename__ = "access_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_role = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="pending") # pending, approved, rejected, info_required
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    review_notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("Profile", foreign_keys=[user_id], back_populates="access_requests")
    reviewer = relationship("Profile", foreign_keys=[reviewed_by])

class InstitutionAdditionRequest(Base):
    __tablename__ = "institution_addition_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    institution_name = Column(Text, nullable=False)
    state_id = Column(Integer, ForeignKey("states.id"), nullable=False)
    district_id = Column(Integer, ForeignKey("districts.id"), nullable=False)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    status = Column(Text, nullable=False, default="pending")
    reviewed_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class Bank(Base):
    __tablename__ = "banks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    code = Column(Text, unique=True, nullable=False)
    name = Column(Text, nullable=False)
    ifsc_prefix = Column(Text, nullable=False)
    nodal_officer = Column(Text, nullable=True)
    nodal_email = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

class FDR(Base):
    __tablename__ = "fdrs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fdr_number = Column(Text, nullable=False)
    public_verification_id = Column(Text, unique=True, nullable=False, index=True)
    institution_id = Column(UUID(as_uuid=True), ForeignKey("institutions.id"), nullable=False, index=True)
    bank_id = Column(UUID(as_uuid=True), ForeignKey("banks.id"), nullable=False, index=True)
    branch_name = Column(Text, nullable=False)
    holder_name = Column(Text, nullable=False)
    joint_holder_name = Column(Text, nullable=True)
    principal_amount = Column(Numeric(15, 2), nullable=False)
    issue_date = Column(Date, nullable=False)
    maturity_date = Column(Date, nullable=False)
    tenure_months = Column(Integer, nullable=False)
    interest_rate = Column(Numeric(5, 2), nullable=False)
    deposit_category = Column(Text, nullable=False)
    lien_marked_to = Column(Text, nullable=False)
    status = Column(Text, nullable=False, default="Submitted", index=True)
    ocr_confidence_average = Column(Numeric(5, 2), default=95.0)
    service_target_days = Column(Integer, default=5)
    delay_reason = Column(Text, nullable=True)
    submitted_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)

    institution = relationship("Institution", back_populates="fdrs")
    bank = relationship("Bank")
    documents = relationship("Document", back_populates="fdr", cascade="all, delete-orphan")
    verifications = relationship("BankVerification", back_populates="fdr", cascade="all, delete-orphan")
    decisions = relationship("RegulatoryDecision", back_populates="fdr", cascade="all, delete-orphan")

class Document(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fdr_id = Column(UUID(as_uuid=True), ForeignKey("fdrs.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=False)
    file_size = Column(Integer, nullable=False)
    file_type = Column(Text, nullable=False)
    storage_path = Column(Text, nullable=False)
    sha256_hash = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    uploaded_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    fdr = relationship("FDR", back_populates="documents")

class BankVerification(Base):
    __tablename__ = "bank_verifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fdr_id = Column(UUID(as_uuid=True), ForeignKey("fdrs.id", ondelete="CASCADE"), nullable=False)
    status = Column(Text, nullable=False) # PENDING, CONFIRMED, MISMATCH, UNABLE_TO_VERIFY, INFO_REQUIRED
    reference_number = Column(Text, nullable=True)
    officer_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    comments = Column(Text, nullable=True)
    supporting_evidence_url = Column(Text, nullable=True)
    verified_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    fdr = relationship("FDR", back_populates="verifications")
    officer = relationship("Profile")

class RegulatoryDecision(Base):
    __tablename__ = "regulatory_decisions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fdr_id = Column(UUID(as_uuid=True), ForeignKey("fdrs.id", ondelete="CASCADE"), nullable=False)
    status = Column(Text, nullable=False) # PENDING, APPROVED, REJECTED, CLARIFICATION_REQUIRED, FURTHER_VERIFICATION
    reviewer_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    decision_reason = Column(Text, nullable=True)
    conditions_json = Column(JSON, nullable=True)
    decided_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    fdr = relationship("FDR", back_populates="decisions")
    reviewer = relationship("Profile")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    actor_user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id"), nullable=True)
    actor_name = Column(Text, nullable=False)
    actor_role = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    target_user_id = Column(UUID(as_uuid=True), nullable=True)
    entity_type = Column(Text, nullable=True)
    entity_id = Column(Text, nullable=True)
    details = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow, index=True)

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("profiles.id", ondelete="CASCADE"), nullable=False)
    title = Column(Text, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(Text, default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)

    user = relationship("Profile", back_populates="notifications")
