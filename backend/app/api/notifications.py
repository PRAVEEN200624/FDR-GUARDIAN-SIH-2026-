from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import Notification, Profile
from backend.app.schemas.schemas import NotificationResponse
from backend.app.security.auth import get_current_user

router = APIRouter(prefix="", tags=["Notifications"])

@router.get("/notifications", response_model=List[NotificationResponse])
def get_user_notifications(current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Notification).filter(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).all()

@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: UUID, current_user: Profile = Depends(get_current_user), db: Session = Depends(get_db)):
    notif = db.query(Notification).filter(Notification.id == notif_id, Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    notif.is_read = True
    db.commit()
    return {"message": "Notification marked as read."}
