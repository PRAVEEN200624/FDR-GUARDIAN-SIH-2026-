from typing import List, Optional
from uuid import UUID
import urllib.request
import json
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from backend.app.db.session import get_db
from backend.app.models.models import State, District, Institution, InstitutionAdditionRequest, Profile
from backend.app.schemas.schemas import (
    StateResponse, DistrictResponse, InstitutionResponse,
    InstitutionAdditionRequestCreate, InstitutionAdditionRequestResponse
)
from backend.app.security.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["Locations & Institutions"])

STATE_SLUG_MAP = {
    "andaman and nicobar islands": "andaman-and-nicobar-islands",
    "andhra pradesh": "andhra-pradesh",
    "arunachal pradesh": "arunachal-pradesh",
    "assam": "assam",
    "bihar": "bihar",
    "chandigarh": "chandigarh",
    "chhattisgarh": "chhattisgarh",
    "dadra and nagar haveli": "dadra-and-nagar-haveli",
    "daman and diu": "daman-and-diu",
    "delhi": "delhi",
    "goa": "goa",
    "gujarat": "gujarat",
    "haryana": "haryana",
    "himachal pradesh": "himachal-pradesh",
    "jammu and kashmir": "jammu-and-kashmir",
    "jharkhand": "jharkhand",
    "karnataka": "karnataka",
    "kerala": "kerala",
    "madhya pradesh": "madhya-pradesh",
    "maharashtra": "maharashtra",
    "manipur": "manipur",
    "meghalaya": "meghalaya",
    "mizoram": "mizoram",
    "nagaland": "nagaland",
    "odisha": "odisha",
    "orissa": "odisha",
    "puducherry": "puducherry",
    "punjab": "punjab",
    "rajasthan": "rajasthan",
    "sikkim": "sikkim",
    "tamil nadu": "tamil-nadu",
    "telangana": "telangana",
    "tripura": "tripura",
    "uttar pradesh": "uttar-pradesh",
    "uttarakhand": "uttarakhand",
    "west bengal": "west-bengal"
}

def auto_load_state_colleges(db: Session, state_id: int):
    try:
        state = db.query(State).filter(State.id == state_id).first()
        if not state:
            return
        
        norm_name = state.name.strip().lower()
        slug = STATE_SLUG_MAP.get(norm_name)
        if not slug:
            for k, v in STATE_SLUG_MAP.items():
                if k in norm_name or norm_name in k:
                    slug = v
                    break
        if not slug:
            return

        url = f"https://raw.githubusercontent.com/anburocky3/indian-colleges-data/main/data/states/{slug}.json"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (FDR-Guardian/1.0)"})
        with urllib.request.urlopen(req, timeout=5) as response:
            items = json.loads(response.read().decode("utf-8"))

        districts = db.query(District).filter(District.state_id == state_id).all()
        dist_lookup = {d.name.strip().lower().replace(" ", "").replace("-", ""): d.id for d in districts}
        default_dist_id = districts[0].id if districts else None

        existing_codes = set(
            row[0] for row in db.query(Institution.institution_code)
            .filter(Institution.state_id == state_id)
            .all()
            if row[0]
        )

        new_insts = []
        for item in items:
            code = (item.get("aicte_id") or "").strip()
            name = (item.get("institute_name") or "").strip()
            if not code or not name or code in existing_codes:
                continue

            raw_dist = (item.get("district") or "").strip().lower().replace(" ", "").replace("-", "")
            d_id = dist_lookup.get(raw_dist)
            if not d_id:
                for d_clean, dist_id in dist_lookup.items():
                    if d_clean in raw_dist or raw_dist in d_clean:
                        d_id = dist_id
                        break
            if not d_id:
                d_id = default_dist_id

            addr = (item.get("address") or "").strip()
            itype = (item.get("institution_type") or "ENGINEERING").strip().upper()
            if "UNIVERSITY" in itype:
                itype = "UNIVERSITY"
            elif "POLYTECHNIC" in itype:
                itype = "POLYTECHNIC"
            elif "MANAGEMENT" in itype:
                itype = "MANAGEMENT"
            else:
                itype = "ENGINEERING"

            new_insts.append(
                Institution(
                    institution_name=name,
                    institution_code=code,
                    institution_type=itype,
                    state_id=state_id,
                    district_id=d_id,
                    address=addr[:250] if addr else None,
                    is_active=True
                )
            )
            existing_codes.add(code)
            if len(new_insts) >= 300:
                break

        if new_insts:
            db.bulk_save_objects(new_insts)
            db.commit()
    except Exception as e:
        logger.warning(f"Could not load state colleges for state {state_id}: {e}")

@router.get("/locations/states", response_model=List[StateResponse])
def get_states(db: Session = Depends(get_db)):
    states = db.query(State).order_by(State.name.asc()).all()
    return states

@router.get("/locations/districts", response_model=List[DistrictResponse])
def get_districts(
    state_id: int = Query(..., description="State ID to filter districts"),
    db: Session = Depends(get_db)
):
    districts = db.query(District).filter(District.state_id == state_id).order_by(District.name.asc()).all()
    return districts

@router.get("/institutions", response_model=List[InstitutionResponse])
def get_institutions(
    district_id: Optional[int] = Query(None, description="Optional District ID filter"),
    state_id: Optional[int] = Query(None, description="Optional State ID filter"),
    search: Optional[str] = Query(None, description="Optional search term"),
    db: Session = Depends(get_db)
):
    target_state_id = state_id
    if district_id and not target_state_id:
        dist = db.query(District).filter(District.id == district_id).first()
        if dist:
            target_state_id = dist.state_id

    if target_state_id:
        count = db.query(Institution).filter(Institution.state_id == target_state_id).count()
        if count < 5:
            auto_load_state_colleges(db, target_state_id)

    query = db.query(Institution).filter(Institution.is_active == True)
    if district_id:
        dist_insts = query.filter(Institution.district_id == district_id)
        if search:
            dist_insts = dist_insts.filter(Institution.institution_name.ilike(f"%{search.strip()}%"))
        results = dist_insts.order_by(Institution.institution_name.asc()).all()
        if results:
            return results
        if target_state_id:
            query = query.filter(Institution.state_id == target_state_id)
    elif target_state_id:
        query = query.filter(Institution.state_id == target_state_id)

    if search:
        query = query.filter(Institution.institution_name.ilike(f"%{search.strip()}%"))

    return query.order_by(Institution.institution_name.asc()).limit(300).all()

@router.get("/institutions/{institution_id}", response_model=InstitutionResponse)
def get_institution(institution_id: UUID, db: Session = Depends(get_db)):
    inst = db.query(Institution).filter(Institution.id == institution_id).first()
    if not inst:
        raise HTTPException(status_code=404, detail="Institution not found")
    return inst

@router.post("/institutions/requests", response_model=InstitutionAdditionRequestResponse)
def request_institution_addition(
    request: InstitutionAdditionRequestCreate,
    current_user: Optional[Profile] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    state = db.query(State).filter(State.id == request.state_id).first()
    if not state:
        raise HTTPException(status_code=400, detail="Invalid State ID")

    district = db.query(District).filter(District.id == request.district_id, District.state_id == request.state_id).first()
    if not district:
        raise HTTPException(status_code=400, detail="Invalid District for the selected State")

    req = InstitutionAdditionRequest(
        institution_name=request.institution_name.strip(),
        state_id=request.state_id,
        district_id=request.district_id,
        requested_by=current_user.id if current_user else None,
        status="pending"
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return req
