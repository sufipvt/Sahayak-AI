
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from auth import require_admin
from database import Conversation, Message, RefreshLog, ServiceCentre, User, get_db
import refresh_job


# Every endpoint here needs an admin account (Depends(require_admin)).
# Step 6 adds the refresh report, scheme management and evaluation here.
router = APIRouter(prefix="/api/admin")


@router.get("/stats")
def stats(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    answers = db.query(Message).filter(Message.role == "assistant")

    return {
        "users": db.query(User).count(),
        "conversations": db.query(Conversation).count(),
        "questions": db.query(Message).filter(Message.role == "user").count(),
        "helpful_answers": answers.filter(Message.rating == 1).count(),
        "unhelpful_answers": answers.filter(Message.rating == -1).count(),
    }


# --------------------------------------------------
# SERVICE CENTRES (CSCs and offices added by hand)
# --------------------------------------------------

class CentreRequest(BaseModel):
    name: str
    centre_type: str = "Common Services Centre"
    address: Optional[str] = None
    phone: Optional[str] = None
    latitude: float = Field(ge=6, le=38)     # roughly India
    longitude: float = Field(ge=68, le=98)


def centre_info(c):
    return {
        "id": c.id, "name": c.name, "centre_type": c.centre_type, "address": c.address,
        "phone": c.phone, "latitude": c.latitude, "longitude": c.longitude,
    }


@router.get("/centres")
def list_centres(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    return [centre_info(c) for c in db.query(ServiceCentre).order_by(ServiceCentre.name)]


@router.post("/centres")
def add_centre(request: CentreRequest, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    centre = ServiceCentre(**request.model_dump())
    db.add(centre)
    db.commit()
    return centre_info(centre)


@router.delete("/centres/{centre_id}")
def delete_centre(centre_id: int, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    centre = db.get(ServiceCentre, centre_id)
    if centre is None:
        raise HTTPException(status_code=404, detail="Centre not found.")
    db.delete(centre)
    db.commit()
    return {"deleted": True}


# --------------------------------------------------
# WEEKLY REFRESH OF THE OFFICIAL PAGES (refresh_job.py)
# --------------------------------------------------

@router.post("/refresh", status_code=202)
def run_refresh_now(admin: User = Depends(require_admin)):
    """Start a refresh in the background. Check /refresh/log for the result."""
    if not refresh_job.start_refresh_now():
        raise HTTPException(status_code=409, detail="A refresh is already running.")
    return {"started": True}


@router.get("/refresh/log")
def refresh_log(admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    runs = db.query(RefreshLog).order_by(RefreshLog.id.desc()).limit(20)
    return {
        "running": refresh_job.is_running(),
        "next_run": refresh_job.next_run_time(),
        "runs": [refresh_job.log_info(log) for log in runs],
    }
