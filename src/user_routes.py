
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from auth import get_current_user
from database import Conversation, Message, Profile, SavedScheme, User, get_db, now
from profile_extractor import UserProfile
from scheme_fetcher import load_schemes


# Every endpoint here needs a logged-in user (Depends(get_current_user)),
# and only ever reads or changes that user's own data.
router = APIRouter(prefix="/api/me")


# --------------------------------------------------
# 1. SAVED PROFILE (ONLY WITH CONSENT)
# --------------------------------------------------

class ProfileRequest(BaseModel):
    profile: UserProfile
    consent: bool


@router.get("/profile")
def get_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    saved = db.query(Profile).filter(Profile.user_id == user.id).first()

    if saved is None:
        return {"profile": None, "consent": False}

    return {"profile": saved.data, "consent": saved.consent, "updated_at": saved.updated_at}


@router.put("/profile")
def save_profile(request: ProfileRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not request.consent:
        raise HTTPException(status_code=400, detail="Please tick the consent box to save your profile.")

    saved = db.query(Profile).filter(Profile.user_id == user.id).first()

    if saved is None:
        saved = Profile(user_id=user.id)
        db.add(saved)

    saved.data = request.profile.model_dump()
    saved.consent = True
    db.commit()

    return {"profile": saved.data, "consent": True}


@router.delete("/profile")
def delete_profile(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(Profile).filter(Profile.user_id == user.id).delete()
    db.commit()
    return {"deleted": True}


def update_profile_if_consented(db, user, profile):
    """Called after each chat: keep the saved profile up to date, but only if
    the user has agreed to save it."""

    saved = db.query(Profile).filter(Profile.user_id == user.id).first()

    if saved is not None and saved.consent:
        saved.data = profile
        db.commit()


# --------------------------------------------------
# 2. CHAT HISTORY
# --------------------------------------------------

def find_own_conversation(db, user, conversation_id):
    conversation = db.get(Conversation, conversation_id)

    # Someone else's conversation looks the same as a missing one.
    if conversation is None or conversation.user_id != user.id:
        raise HTTPException(status_code=404, detail="Conversation not found.")

    return conversation


def save_chat_turn(db, user, conversation_id, question, result):
    """Store the question and the answer. Returns (conversation_id, answer_message_id)."""

    if conversation_id:
        conversation = find_own_conversation(db, user, conversation_id)
    else:
        title = question if len(question) <= 80 else question[:77] + "..."
        conversation = Conversation(user_id=user.id, title=title)
        db.add(conversation)
        db.flush()   # gives the new conversation its id

    db.add(Message(conversation_id=conversation.id, role="user", content=question))

    answer = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=result["answer"],
        sources=result["sources"],
    )
    db.add(answer)
    conversation.updated_at = now()   # newest conversations first in History
    db.commit()

    return conversation.id, answer.id


@router.get("/conversations")
def list_conversations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversations = (
        db.query(Conversation)
        .filter(Conversation.user_id == user.id)
        .order_by(Conversation.updated_at.desc())
        .all()
    )

    return [
        {"id": c.id, "title": c.title, "updated_at": c.updated_at, "messages": len(c.messages)}
        for c in conversations
    ]


@router.get("/conversations/{conversation_id}")
def get_conversation(conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversation = find_own_conversation(db, user, conversation_id)

    return {
        "id": conversation.id,
        "title": conversation.title,
        "messages": [
            {"id": m.id, "role": m.role, "content": m.content, "sources": m.sources, "rating": m.rating}
            for m in conversation.messages
        ],
    }


@router.delete("/conversations/{conversation_id}")
def delete_conversation(conversation_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    conversation = find_own_conversation(db, user, conversation_id)
    db.delete(conversation)   # its messages are deleted too (cascade)
    db.commit()
    return {"deleted": True}


# --------------------------------------------------
# 3. RATE AN ANSWER
# --------------------------------------------------

class RatingRequest(BaseModel):
    rating: Literal[1, -1]   # 1 = helpful, -1 = not helpful


@router.post("/messages/{message_id}/rating")
def rate_answer(message_id: int, request: RatingRequest, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    message = db.get(Message, message_id)

    if message is None or message.role != "assistant":
        raise HTTPException(status_code=404, detail="Answer not found.")

    find_own_conversation(db, user, message.conversation_id)   # must be the user's own

    message.rating = request.rating
    db.commit()
    return {"rating": message.rating}


# --------------------------------------------------
# 4. SAVED SCHEMES
# --------------------------------------------------

def schemes_by_id():
    return {scheme["scheme_id"]: scheme for scheme in load_schemes()}


@router.get("/saved")
def list_saved(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    schemes = schemes_by_id()
    rows = db.query(SavedScheme).filter(SavedScheme.user_id == user.id).order_by(SavedScheme.created_at.desc())

    return [
        {
            "scheme_id": row.scheme_id,
            "name": schemes[row.scheme_id]["name"],
            "category": schemes[row.scheme_id]["category"],
            "saved_at": row.created_at,
        }
        for row in rows
        if row.scheme_id in schemes   # skip schemes that were removed
    ]


@router.post("/saved/{scheme_id}")
def save_scheme(scheme_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if scheme_id not in schemes_by_id():
        raise HTTPException(status_code=404, detail="Scheme not found.")

    exists = db.query(SavedScheme).filter_by(user_id=user.id, scheme_id=scheme_id).first()
    if not exists:
        db.add(SavedScheme(user_id=user.id, scheme_id=scheme_id))
        db.commit()

    return {"saved": True}


@router.delete("/saved/{scheme_id}")
def unsave_scheme(scheme_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.query(SavedScheme).filter_by(user_id=user.id, scheme_id=scheme_id).delete()
    db.commit()
    return {"saved": False}
