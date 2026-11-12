
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import require_admin
from database import Conversation, Message, User, get_db


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
