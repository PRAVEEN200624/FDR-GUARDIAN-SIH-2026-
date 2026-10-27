from typing import List, Optional
from datetime import datetime
from uuid import UUID
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File, Form
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.services.ocr_service import (
    compute_sha256, extract_text_from_file, parse_fdr_fields,
    perform_explainable_crosscheck
)
from backend.app.models.models import (
    FDR, Bank, Institution, Document, BankVerification, RegulatoryDecision,
    AuditLog, Profile
)
from backend.app.schemas.schemas import (
    FDRCreate, FDRUpdate, FDRResponse, BankResponse,
    BankVerificationCreate, BankVerificationResponse,
    RegulatoryDecisionCreate, RegulatoryDecisionResponse
)
from backend.app.security.auth import (
    get_current_user, require_approved_user, require_role
)

router = APIRouter(prefix="", tags=["FDR Management"])

def format_fdr_response(fdr: FDR) -> FDRResponse:
    docs = [
        {
            "id": d.id,
            "file_name": d.file_name,
            "file_size": d.file_size,
            "file_type": d.file_type,
            "storage_path": d.storage_path,
            "sha256_hash": d.sha256_hash,
            "version": d.version,
            "uploaded_at": d.uploaded_at
        }
        for d in fdr.documents
    ]
    verifs = [
        {
            "id": v.id,
            "status": v.status,
            "reference_number": v.reference_number,
            "comments": v.comments,
            "supporting_evidence_url": v.supporting_evidence_url,
            "verified_at": v.verified_at
        }
        for v in fdr.verifications
    ]
    decisions = [
        {
            "id": dec.id,
            "status": dec.status,
            "decision_reason": dec.decision_reason,
            "conditions_json": dec.conditions_json,
            "decided_at": dec.decided_at
        }
        for dec in fdr.decisions
    ]

    return FDRResponse(
        id=fdr.id,
        fdr_number=fdr.fdr_number,
        public_verification_id=fdr.public_verification_id,
        institution_id=fdr.institution_id,
        institution_name=fdr.institution.institution_name if fdr.institution else None,
        bank_id=fdr.bank_id,
        bank_name=fdr.bank.name if fdr.bank else None,
        branch_name=fdr.branch_name,
        holder_name=fdr.holder_name,
        joint_holder_name=fdr.joint_holder_name,
        principal_amount=float(fdr.principal_amount),
        issue_date=fdr.issue_date,
        maturity_date=fdr.maturity_date,
        tenure_months=fdr.tenure_months,
        interest_rate=float(fdr.interest_rate),
        deposit_category=fdr.deposit_category,
        lien_marked_to=fdr.lien_marked_to,
        status=fdr.status,
        ocr_confidence_average=float(fdr.ocr_confidence_average or 0.0),
        service_target_days=fdr.service_target_days,
        delay_reason=fdr.delay_reason,
        created_at=fdr.created_at,
        updated_at=fdr.updated_at,
        documents=docs,
        verifications=verifs,
        decisions=decisions
    )

@router.get("/banks", response_model=List[BankResponse])
def get_banks(db: Session = Depends(get_db)):
    return db.query(Bank).filter(Bank.is_active == True).order_by(Bank.name.asc()).all()

@router.get("/fdrs", response_model=List[FDRResponse])
def list_fdrs(
    status_filter: Optional[str] = Query(None, alias="status"),
    bank_id: Optional[UUID] = None,
    search: Optional[str] = None,
    current_user: Profile = Depends(require_approved_user),
    db: Session = Depends(get_db)
):
    query = db.query(FDR)

    # Enforce Institution-level Data Isolation
    if current_user.role == "institution_user":
        if not current_user.institution_profile:
            raise HTTPException(status_code=403, detail="No authorized institution profile associated with user.")
        query = query.filter(FDR.institution_id == current_user.institution_profile.institution_id)

    if status_filter and status_filter != "ALL":
        query = query.filter(FDR.status == status_filter)

    if bank_id:
        query = query.filter(FDR.bank_id == bank_id)

    if search:
        s = f"%{search.strip()}%"
        query = query.filter((FDR.fdr_number.ilike(s)) | (FDR.holder_name.ilike(s)))

    fdrs = query.order_by(FDR.created_at.desc()).all()
    return [format_fdr_response(f) for f in fdrs]

@router.post("/fdrs", response_model=FDRResponse, status_code=status.HTTP_201_CREATED)
def submit_fdr(
    fdr_in: FDRCreate,
    current_user: Profile = Depends(require_role(["institution_user", "system_admin"])),
    db: Session = Depends(get_db)
):
    # Enforce that institution user can only submit for their own institution
    if current_user.role == "institution_user":
        if not current_user.institution_profile or current_user.institution_profile.institution_id != fdr_in.institution_id:
            raise HTTPException(
                status_code=403,
                detail="Security violation: You can only submit FDR records for your own authorized institution."
            )

    # Check for duplicate FDR under the same bank
    existing = db.query(FDR).filter(FDR.fdr_number == fdr_in.fdr_number.strip(), FDR.bank_id == fdr_in.bank_id).first()
    if existing:
        raise HTTPException(
            status_code=409,
            detail=f"An active FDR record with number '{fdr_in.fdr_number}' already exists under this bank."
        )

    # Generate public verification ID
    pub_vfy_id = f"pub-vfy-{uuid.uuid4().hex[:8]}-{uuid.uuid4().hex[:4]}"

    new_fdr = FDR(
        fdr_number=fdr_in.fdr_number.strip().upper(),
        public_verification_id=pub_vfy_id,
        institution_id=fdr_in.institution_id,
        bank_id=fdr_in.bank_id,
        branch_name=fdr_in.branch_name.strip(),
        holder_name=fdr_in.holder_name.strip(),
        joint_holder_name=fdr_in.joint_holder_name.strip() if fdr_in.joint_holder_name else None,
        principal_amount=fdr_in.principal_amount,
        issue_date=fdr_in.issue_date,
        maturity_date=fdr_in.maturity_date,
        tenure_months=fdr_in.tenure_months,
        interest_rate=fdr_in.interest_rate,
        deposit_category=fdr_in.deposit_category,
        lien_marked_to=fdr_in.lien_marked_to.strip(),
        status="Submitted",
        ocr_confidence_average=96.5,
        submitted_by=current_user.id
    )
    db.add(new_fdr)
    db.flush()

    # Create dummy cryptographic document metadata
    doc = Document(
        fdr_id=new_fdr.id,
        file_name=f"{new_fdr.fdr_number}_Deposit_Certificate.pdf",
        file_size=524288,
        file_type="application/pdf",
        storage_path=f"/secure/deposits/{new_fdr.institution_id}/{new_fdr.id}/cert.pdf",
        sha256_hash=uuid.uuid4().hex + uuid.uuid4().hex,
        version=1,
        uploaded_by=current_user.id
    )
    db.add(doc)

    # Audit log
    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="FDR_SUBMISSION",
        entity_type="FDR",
        entity_id=str(new_fdr.id),
        details={"fdr_number": new_fdr.fdr_number, "principal_amount": float(new_fdr.principal_amount)}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_fdr)

    return format_fdr_response(new_fdr)

@router.get("/fdrs/{fdr_id}", response_model=FDRResponse)
def get_fdr_detail(
    fdr_id: UUID,
    current_user: Profile = Depends(require_approved_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    # Enforce data isolation
    if current_user.role == "institution_user":
        if not current_user.institution_profile or fdr.institution_id != current_user.institution_profile.institution_id:
            raise HTTPException(status_code=403, detail="Access Denied: You cannot view another institution's FDR record.")

    return format_fdr_response(fdr)

@router.patch("/fdrs/{fdr_id}", response_model=FDRResponse)
def update_fdr(
    fdr_id: UUID,
    fdr_update: FDRUpdate,
    current_user: Profile = Depends(require_approved_user),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    if current_user.role == "institution_user":
        if not current_user.institution_profile or fdr.institution_id != current_user.institution_profile.institution_id:
            raise HTTPException(status_code=403, detail="Access Denied: You cannot edit another institution's FDR record.")

    if fdr_update.principal_amount is not None:
        fdr.principal_amount = fdr_update.principal_amount
    if fdr_update.interest_rate is not None:
        fdr.interest_rate = fdr_update.interest_rate
    if fdr_update.maturity_date is not None:
        fdr.maturity_date = fdr_update.maturity_date
    if fdr_update.delay_reason is not None:
        fdr.delay_reason = fdr_update.delay_reason

    fdr.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(fdr)
    return format_fdr_response(fdr)

@router.post("/fdrs/{fdr_id}/verify", response_model=FDRResponse)
def verify_fdr_by_bank(
    fdr_id: UUID,
    verify_in: BankVerificationCreate,
    current_user: Profile = Depends(require_role(["bank_officer", "system_admin"])),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    verif = BankVerification(
        fdr_id=fdr.id,
        status=verify_in.status,
        reference_number=verify_in.reference_number,
        officer_id=current_user.id,
        comments=verify_in.comments,
        supporting_evidence_url=verify_in.supporting_evidence_url
    )
    db.add(verif)

    # Update FDR status
    if verify_in.status == "CONFIRMED":
        fdr.status = "Bank_Verified"
    elif verify_in.status == "MISMATCH":
        fdr.status = "Bank_Mismatch"
    elif verify_in.status == "INFO_REQUIRED":
        fdr.status = "Bank_Info_Required"
    else:
        fdr.status = "Unable_To_Verify"

    fdr.updated_at = datetime.utcnow()

    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="BANK_VERIFICATION_RECORDED",
        entity_type="FDR",
        entity_id=str(fdr.id),
        details={"status": verify_in.status, "reference": verify_in.reference_number}
    )
    db.add(audit)
    db.commit()
    db.refresh(fdr)

    return format_fdr_response(fdr)

@router.post("/fdrs/{fdr_id}/regulatory-decision", response_model=FDRResponse)
def record_regulatory_decision(
    fdr_id: UUID,
    decision_in: RegulatoryDecisionCreate,
    current_user: Profile = Depends(require_role(["regulatory_officer", "system_admin"])),
    db: Session = Depends(get_db)
):
    fdr = db.query(FDR).filter(FDR.id == fdr_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="FDR record not found")

    if not decision_in.decision_reason or not decision_in.decision_reason.strip():
        raise HTTPException(status_code=400, detail="A mandatory justification reason is required for regulatory decisions.")

    decision = RegulatoryDecision(
        fdr_id=fdr.id,
        status=decision_in.status,
        reviewer_id=current_user.id,
        decision_reason=decision_in.decision_reason.strip(),
        conditions_json=decision_in.conditions_json
    )
    db.add(decision)

    # Update FDR status
    if decision_in.status == "APPROVED":
        fdr.status = "Approved"
    elif decision_in.status == "REJECTED":
        fdr.status = "Rejected"
    elif decision_in.status == "CLARIFICATION_REQUIRED":
        fdr.status = "Clarification_Required"
    elif decision_in.status == "FURTHER_VERIFICATION":
        fdr.status = "Further_Verification"

    fdr.updated_at = datetime.utcnow()

    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="REGULATORY_DECISION_RECORDED",
        entity_type="FDR",
        entity_id=str(fdr.id),
        details={"decision": decision_in.status, "reason": decision_in.decision_reason}
    )
    db.add(audit)
    db.commit()
    db.refresh(fdr)

    return format_fdr_response(fdr)

# Public QR Certificate Verification Route (Public / Anon allowed)
@router.get("/fdrs/public-verify/{public_verification_id}")
def public_verify_fdr(public_verification_id: str, db: Session = Depends(get_db)):
    fdr = db.query(FDR).filter(FDR.public_verification_id == public_verification_id).first()
    if not fdr:
        raise HTTPException(status_code=404, detail="Invalid verification token. No official FDR record found.")

    # Return only permissible non-sensitive verification certificate data
    return {
        "status": "VALID_STATUTORY_RECORD" if fdr.status == "Approved" else "RECORD_FOUND",
        "fdr_number_masked": fdr.fdr_number[:4] + "****" + fdr.fdr_number[-4:],
        "institution_name": fdr.institution.institution_name if fdr.institution else "Accredited Institution",
        "bank_name": fdr.bank.name if fdr.bank else "Scheduled Commercial Bank",
        "regulatory_status": fdr.status,
        "lien_marked_to": fdr.lien_marked_to,
        "issue_date": fdr.issue_date,
        "maturity_date": fdr.maturity_date,
        "verified_at": datetime.utcnow().isoformat(),
        "disclaimer": "FDR Guardian Digital Verification Gateway. Demonstrative statutory verification certificate."
    }

@router.post("/fdrs/ocr-verify")
async def ocr_verify_document(
    file: UploadFile = File(...),
    fdr_number: Optional[str] = Form(None),
    bank_name: Optional[str] = Form(None),
    branch_name: Optional[str] = Form(None),
    principal_amount: Optional[float] = Form(None),
    issue_date: Optional[str] = Form(None),
    maturity_date: Optional[str] = Form(None),
    institution_name: Optional[str] = Form(None),
    lien_marked_to: Optional[str] = Form(None)
):
    file_bytes = await file.read()
    sha256_hash = compute_sha256(file_bytes)
    
    raw_text = extract_text_from_file(file_bytes, file.filename)
    extracted_fields = parse_fdr_fields(raw_text)
    
    entered_data = {
        "fdr_number": fdr_number,
        "bank_name": bank_name,
        "branch_name": branch_name,
        "principal_amount": principal_amount,
        "issue_date": issue_date,
        "maturity_date": maturity_date,
        "institution_name": institution_name,
        "lien_marked_to": lien_marked_to
    }
    
    crosscheck = perform_explainable_crosscheck(entered_data, extracted_fields)
    
    return {
        "file_name": file.filename,
        "file_size": len(file_bytes),
        "file_type": file.content_type or "application/pdf",
        "sha256_hash": sha256_hash,
        "extracted_data": extracted_fields,
        "crosscheck": crosscheck,
        "raw_text_preview": raw_text[:300] if raw_text else ""
    }
