from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import AuditLog, Profile
from backend.app.schemas.schemas import AuditLogResponse
from backend.app.security.auth import require_approved_user

router = APIRouter(prefix="", tags=["Audit Logs"])

@router.get("/audit-logs", response_model=List[AuditLogResponse])
def get_audit_logs(
    limit: int = Query(50, le=200),
    current_user: Profile = Depends(require_approved_user),
    db: Session = Depends(get_db)
):
    query = db.query(AuditLog)
    if current_user.role == "institution_user":
        # Filter audit logs involving this user
        query = query.filter(AuditLog.actor_user_id == current_user.id)
    return query.order_by(AuditLog.created_at.desc()).limit(limit).all()
