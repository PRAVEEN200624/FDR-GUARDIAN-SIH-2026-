from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from backend.app.db.session import get_db

router = APIRouter(prefix="", tags=["Health"])

@router.get("/health")
def health_check(db: Session = Depends(get_db)):
    try:
        db.execute(text("SELECT 1;"))
        db_status = "connected"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
        raise HTTPException(status_code=503, detail={"status": "degraded", "database": db_status})

    return {
        "status": "healthy",
        "database": db_status,
        "engine": "PostgreSQL 17 (Supabase Pooler)",
        "service": "FDR Guardian Backend API",
        "version": "1.0.0"
    }
