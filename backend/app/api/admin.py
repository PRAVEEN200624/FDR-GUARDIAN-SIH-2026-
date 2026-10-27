from typing import List, Optional
from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import (
    AccessRequest, Profile, AuditLog, Notification,
    InstitutionAdditionRequest, Institution
)
from backend.app.schemas.schemas import (
    AccessRequestResponse, AccessRequestDecision, UserResponse,
    InstitutionAdditionRequestResponse
)
from backend.app.security.auth import require_admin
from backend.app.api.auth import format_user_response

router = APIRouter(prefix="/admin", tags=["System Administration"])

@router.get("/access-requests", response_model=List[AccessRequestResponse])
def get_access_requests(
    role: Optional[str] = Query(None, description="Filter by requested role"),
    status: Optional[str] = Query(None, description="Filter by status (pending, approved, rejected)"),
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    query = db.query(AccessRequest)
    if role and role != "ALL":
        query = query.filter(AccessRequest.requested_role == role)
    if status and status != "ALL":
        query = query.filter(AccessRequest.status == status)

    requests = query.order_by(AccessRequest.created_at.desc()).all()
    results = []

    for r in requests:
        user = db.query(Profile).filter(Profile.id == r.user_id).first()
        org_details = {}
        if user:
            if user.bank_profile:
                org_details = {
                    "organization_name": user.bank_profile.bank_name,
                    "branch": user.bank_profile.branch_or_office,
                    "designation": user.bank_profile.designation,
                    "employee_id": user.bank_profile.employee_id
                }
            elif user.regulatory_profile:
                org_details = {
                    "organization_name": "AICTE (All India Council for Technical Education)",
                    "bureau": user.regulatory_profile.office_or_jurisdiction,
                    "designation": user.regulatory_profile.designation,
                    "employee_ref": user.regulatory_profile.employee_reference
                }
            elif user.institution_profile and user.institution_profile.institution:
                org_details = {
                    "organization_name": user.institution_profile.institution.institution_name,
                    "code": user.institution_profile.institution.institution_code,
                    "designation": user.institution_profile.designation
                }

        results.append(AccessRequestResponse(
            id=r.id,
            user_id=r.user_id,
            applicant_name=user.full_name if user else "Unknown Applicant",
            applicant_email=user.email if user else "",
            applicant_mobile=user.mobile_number if user else None,
            requested_role=r.requested_role,
            organization_details=org_details,
            status=r.status,
            reviewed_by=r.reviewed_by,
            reviewed_at=r.reviewed_at,
            review_notes=r.review_notes,
            created_at=r.created_at
        ))

    return results

@router.post("/access-requests/{request_id}/approve")
def approve_access_request(
    request_id: UUID,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Access request not found")

    if req.status == "approved":
        return {"message": "Access request is already approved.", "status": "approved"}

    # Update access request
    req.status = "approved"
    req.reviewed_by = admin.id
    req.reviewed_at = datetime.utcnow()

    # Update associated user profile and role profiles
    user = db.query(Profile).filter(Profile.id == req.user_id).first()
    if user:
        user.account_status = "approved"
        user.role = req.requested_role
        user.updated_at = datetime.utcnow()

        if user.bank_profile:
            user.bank_profile.verification_status = "verified"
        if user.regulatory_profile:
            user.regulatory_profile.verification_status = "verified"

        # Notification to user
        notif = Notification(
            user_id=user.id,
            title="Access Request Approved",
            message=f"Administrator {admin.full_name} has authorized your official {req.requested_role} credentials.",
            type="SUCCESS"
        )
        db.add(notif)

    # Immutable Audit Log
    audit = AuditLog(
        actor_user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=admin.role,
        action="ACCESS_REQUEST_APPROVED",
        target_user_id=req.user_id,
        entity_type="ACCESS_REQUEST",
        entity_id=str(req.id),
        details={
            "role": req.requested_role,
            "applicant_email": user.email if user else "",
            "approved_by": admin.full_name
        }
    )
    db.add(audit)
    db.commit()

    return {"message": f"Successfully approved {req.requested_role} credentials for user.", "status": "approved"}

@router.post("/access-requests/{request_id}/reject")
def reject_access_request(
    request_id: UUID,
    decision: AccessRequestDecision,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if not decision.reason or not decision.reason.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A mandatory justification reason is required when rejecting a registration request."
        )

    req = db.query(AccessRequest).filter(AccessRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Access request not found")

    req.status = "rejected"
    req.reviewed_by = admin.id
    req.reviewed_at = datetime.utcnow()
    req.review_notes = decision.reason.strip()

    user = db.query(Profile).filter(Profile.id == req.user_id).first()
    if user:
        user.account_status = "rejected"
        user.updated_at = datetime.utcnow()

        notif = Notification(
            user_id=user.id,
            title="Access Request Rejected",
            message=f"Your {req.requested_role} registration request was rejected. Reason: {decision.reason}",
            type="ERROR"
        )
        db.add(notif)

    # Immutable Audit Log
    audit = AuditLog(
        actor_user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=admin.role,
        action="ACCESS_REQUEST_REJECTED",
        target_user_id=req.user_id,
        entity_type="ACCESS_REQUEST",
        entity_id=str(req.id),
        details={
            "reason": decision.reason,
            "rejected_by": admin.full_name
        }
    )
    db.add(audit)
    db.commit()

    return {"message": "Access request rejected.", "status": "rejected"}

@router.get("/users", response_model=List[UserResponse])
def get_all_users(admin: Profile = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(Profile).order_by(Profile.created_at.desc()).all()
    return [format_user_response(u) for u in users]

@router.post("/users/{user_id}/suspend")
def suspend_user(
    user_id: UUID,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin.id:
        raise HTTPException(status_code=400, detail="Cannot suspend your own administrator account.")

    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.account_status = "suspended"
    user.updated_at = datetime.utcnow()

    audit = AuditLog(
        actor_user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=admin.role,
        action="USER_SUSPENDED",
        target_user_id=user.id,
        entity_type="USER",
        entity_id=str(user.id),
        details={"reason": "Suspended by system administrator"}
    )
    db.add(audit)
    db.commit()

    return {"message": f"User {user.email} suspended successfully."}

@router.post("/users/{user_id}/reactivate")
def reactivate_user(
    user_id: UUID,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(Profile).filter(Profile.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.account_status = "approved"
    user.updated_at = datetime.utcnow()

    audit = AuditLog(
        actor_user_id=admin.id,
        actor_name=admin.full_name,
        actor_role=admin.role,
        action="USER_REACTIVATED",
        target_user_id=user.id,
        entity_type="USER",
        entity_id=str(user.id),
        details={"reason": "Reactivated by system administrator"}
    )
    db.add(audit)
    db.commit()

    return {"message": f"User {user.email} reactivated successfully."}

@router.get("/institution-requests", response_model=List[InstitutionAdditionRequestResponse])
def get_institution_requests(admin: Profile = Depends(require_admin), db: Session = Depends(get_db)):
    reqs = db.query(InstitutionAdditionRequest).order_by(InstitutionAdditionRequest.created_at.desc()).all()
    return reqs

@router.post("/institution-requests/{request_id}/approve")
def approve_institution_request(
    request_id: UUID,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(InstitutionAdditionRequest).filter(InstitutionAdditionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "approved"
    req.reviewed_by = admin.id
    req.reviewed_at = datetime.utcnow()

    # Create the institution in master table
    new_inst = Institution(
        institution_name=req.institution_name,
        state_id=req.state_id,
        district_id=req.district_id,
        is_active=True
    )
    db.add(new_inst)
    db.commit()

    return {"message": "Institution addition approved and registered."}

@router.post("/institution-requests/{request_id}/reject")
def reject_institution_request(
    request_id: UUID,
    admin: Profile = Depends(require_admin),
    db: Session = Depends(get_db)
):
    req = db.query(InstitutionAdditionRequest).filter(InstitutionAdditionRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "rejected"
    req.reviewed_by = admin.id
    req.reviewed_at = datetime.utcnow()
    db.commit()

    return {"message": "Institution addition request rejected."}
