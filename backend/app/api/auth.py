from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import (
    Profile, InstitutionProfile, BankOfficerProfile, RegulatoryOfficerProfile,
    AccessRequest, AuditLog, Notification, Institution
)
from backend.app.schemas.schemas import (
    LoginRequest, TokenResponse, RegisterRequest, UserResponse, ProfileUpdate
)
from backend.app.security.auth import (
    verify_password, get_password_hash, create_access_token, get_current_user
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_response(user: Profile) -> UserResponse:
    inst_prof = None
    if user.institution_profile:
        inst_name = user.institution_profile.institution.institution_name if user.institution_profile.institution else None
        inst_code = user.institution_profile.institution.institution_code if user.institution_profile.institution else None
        inst_prof = {
            "institution_id": user.institution_profile.institution_id,
            "institution_name": inst_name,
            "institution_code": inst_code,
            "designation": user.institution_profile.designation,
            "verification_status": user.institution_profile.verification_status
        }

    bank_prof = None
    if user.bank_profile:
        bank_prof = {
            "bank_name": user.bank_profile.bank_name,
            "branch_or_office": user.bank_profile.branch_or_office,
            "designation": user.bank_profile.designation,
            "employee_id": user.bank_profile.employee_id,
            "verification_status": user.bank_profile.verification_status
        }

    reg_prof = None
    if user.regulatory_profile:
        reg_prof = {
            "designation": user.regulatory_profile.designation,
            "office_or_jurisdiction": user.regulatory_profile.office_or_jurisdiction,
            "employee_reference": user.regulatory_profile.employee_reference,
            "verification_status": user.regulatory_profile.verification_status
        }

    return UserResponse(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        mobile_number=user.mobile_number,
        role=user.role,
        account_status=user.account_status,
        created_at=user.created_at,
        institution_profile=inst_prof,
        bank_profile=bank_prof,
        regulatory_profile=reg_prof
    )

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(Profile).filter(Profile.email == request.email.lower().strip()).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid official email or password."
        )

    if user.account_status == "suspended":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your official account is currently suspended. Contact your system administrator."
        )

    # Note: Pending users CAN authenticate to receive their token and view the Pending Status page,
    # but privileged endpoints and dashboards will deny access until approved.
    token = create_access_token(data={"sub": str(user.id), "role": user.role, "status": user.account_status})

    # Record login audit
    audit = AuditLog(
        actor_user_id=user.id,
        actor_name=user.full_name,
        actor_role=user.role,
        action="USER_LOGIN",
        entity_type="USER",
        entity_id=str(user.id),
        details={"email": user.email, "status": user.account_status}
    )
    db.add(audit)
    db.commit()

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_response(user)
    )

@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    email_clean = request.email.lower().strip()
    existing = db.query(Profile).filter(Profile.email == email_clean).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account is already registered with this official email address."
        )

    # Prevent public self-assignment of system_admin
    if request.requested_role == "system_admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Public self-registration as System Administrator is strictly prohibited."
        )

    # Privileged roles default to pending_approval
    is_privileged = request.requested_role in ["bank_officer", "regulatory_officer"]
    initial_status = "pending_approval" if is_privileged else "approved"

    # Create base profile
    new_user = Profile(
        full_name=request.full_name.strip(),
        email=email_clean,
        mobile_number=request.mobile_number.strip(),
        hashed_password=get_password_hash(request.password),
        role=request.requested_role,
        account_status=initial_status
    )
    db.add(new_user)
    db.flush() # get new_user.id

    # Create role-specific profile
    if request.requested_role == "institution_user":
        if not request.institution_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Institution selection is required for Institution User registration."
            )
        inst_profile = InstitutionProfile(
            user_id=new_user.id,
            institution_id=request.institution_id,
            designation=request.designation.strip() if request.designation else "Registrar / Officer",
            verification_status="verified"
        )
        db.add(inst_profile)

    elif request.requested_role == "bank_officer":
        if not request.bank_name or not request.branch_or_office:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bank name and branch/office unit are required for Bank Officer registration."
            )
        bank_profile = BankOfficerProfile(
            user_id=new_user.id,
            bank_name=request.bank_name.strip(),
            branch_or_office=request.branch_or_office.strip(),
            designation=request.designation.strip() if request.designation else "Verification Officer",
            employee_id=request.employee_id.strip() if request.employee_id else None,
            verification_status="pending"
        )
        db.add(bank_profile)

    elif request.requested_role == "regulatory_officer":
        if not request.office_or_jurisdiction:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Regional office or bureau jurisdiction is required for Regulatory Officer registration."
            )
        reg_profile = RegulatoryOfficerProfile(
            user_id=new_user.id,
            designation=request.designation.strip() if request.designation else "Review Officer",
            office_or_jurisdiction=request.office_or_jurisdiction.strip(),
            employee_reference=request.employee_reference.strip() if request.employee_reference else None,
            verification_status="pending"
        )
        db.add(reg_profile)

    # For privileged roles, create access_request for admin dashboard
    if is_privileged:
        access_req = AccessRequest(
            user_id=new_user.id,
            requested_role=request.requested_role,
            status="pending",
            review_notes=f"Applicant: {request.full_name} ({email_clean}). Role: {request.requested_role}."
        )
        db.add(access_req)

    # Welcome notification
    notif = Notification(
        user_id=new_user.id,
        title="Registration Submitted",
        message="Your account registration has been successfully recorded." if not is_privileged else
                "Your privileged account request is submitted and pending administrative authorization.",
        type="SUCCESS" if not is_privileged else "WARNING"
    )
    db.add(notif)

    # Audit log
    audit = AuditLog(
        actor_user_id=new_user.id,
        actor_name=new_user.full_name,
        actor_role=new_user.role,
        action="USER_REGISTRATION",
        entity_type="USER",
        entity_id=str(new_user.id),
        details={"role": request.requested_role, "status": initial_status}
    )
    db.add(audit)
    db.commit()
    db.refresh(new_user)

    token = create_access_token(data={"sub": str(new_user.id), "role": new_user.role, "status": new_user.account_status})
    return TokenResponse(
        access_token=token,
        token_type="bearer",
        user=format_user_response(new_user)
    )

@router.get("/me", response_model=UserResponse)
def get_current_profile(current_user: Profile = Depends(get_current_user)):
    return format_user_response(current_user)

@router.patch("/me", response_model=UserResponse)
def update_current_profile(update: ProfileUpdate, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    if update.full_name:
        current_user.full_name = update.full_name.strip()
    if update.mobile_number:
        current_user.mobile_number = update.mobile_number.strip()
    current_user.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(current_user)
    return format_user_response(current_user)

@router.post("/logout")
def logout(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    audit = AuditLog(
        actor_user_id=current_user.id,
        actor_name=current_user.full_name,
        actor_role=current_user.role,
        action="USER_LOGOUT",
        entity_type="USER",
        entity_id=str(current_user.id),
        details={"status": "session_terminated"}
    )
    db.add(audit)
    db.commit()
    return {"message": "Successfully logged out."}
