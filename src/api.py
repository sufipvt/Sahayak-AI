
import time
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

# rag_pipeline loads the models and ChromaDB once, when the server starts.
from rag_pipeline import ask_sahayak, DISCLAIMER
from profile_extractor import (
    UserProfile, extract_profile, merge_profiles,
    get_follow_up_questions, has_personal_details,
)
from eligibility import find_matching_schemes
from scheme_fetcher import load_schemes, load_scheme_text
from database import get_db
import auth
import user_routes
import admin_routes


app = FastAPI(title="Sahayak API")

# Login, the user's own data, and admin endpoints live in their own files.
app.include_router(auth.router)
app.include_router(user_routes.router)
app.include_router(admin_routes.router)


# --------------------------------------------------
# 1. REQUEST FORMATS
# --------------------------------------------------
# FastAPI checks every request against these. A wrong type
# (e.g. age = "abc") is rejected with a clear error message.

class ExtractRequest(BaseModel):
    text: str
    profile: Optional[UserProfile] = None


class MatchRequest(BaseModel):
    profile: UserProfile
    include_not_eligible: bool = False


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    message: str
    profile: Optional[UserProfile] = None     # the frontend sends back the last profile
    history: List[ChatMessage] = []           # the last few messages (we use the last 4)
    scheme_id: Optional[str] = None           # set this to ask about one scheme only
    conversation_id: Optional[int] = None     # logged-in users: continue this conversation


# --------------------------------------------------
# 2. HELPERS
# --------------------------------------------------

def find_scheme(scheme_id):
    for scheme in load_schemes():
        if scheme["scheme_id"] == scheme_id:
            return scheme

    raise HTTPException(status_code=404, detail=f"Scheme '{scheme_id}' not found")


def to_dict(profile):
    return profile.model_dump() if profile else {}


def with_verified_flag(scheme):
    # "rules_verified": false lets the frontend show "rules not yet verified".
    return {**scheme, "rules_verified": scheme.get("verified", False)}


# --------------------------------------------------
# 3. ENDPOINTS
# --------------------------------------------------

@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/schemes")
def list_schemes():
    """All schemes with their rules (from data/schemes.json)."""
    return [with_verified_flag(scheme) for scheme in load_schemes()]


@app.get("/api/schemes/{scheme_id}")
def scheme_detail(scheme_id: str):
    """One scheme: its rules plus the saved text of its official page."""

    scheme = find_scheme(scheme_id)
    saved = load_scheme_text(scheme_id) or {}

    return {
        **with_verified_flag(scheme),
        "sections": saved.get("sections", {}),
        "last_updated": saved.get("fetched_at"),
        "disclaimer": DISCLAIMER,
    }


@app.post("/api/profile/extract")
def profile_extract(request: ExtractRequest):
    """Plain text -> structured profile, merged with the profile we already have."""

    new_profile = extract_profile(request.text)
    profile = merge_profiles(to_dict(request.profile), new_profile)

    return {
        "profile": profile,
        "follow_up_questions": get_follow_up_questions(profile),
    }


@app.post("/api/schemes/match")
def schemes_match(request: MatchRequest):
    """Check the profile against every scheme's rules (no LLM needed)."""

    profile = to_dict(request.profile)

    return {
        "matches": find_matching_schemes(profile, request.include_not_eligible),
        "follow_up_questions": get_follow_up_questions(profile),
    }


@app.post("/api/chat")
def chat(
    request: ChatRequest,
    user=Depends(auth.get_optional_user),   # None for guests
    db: Session = Depends(get_db),
):
    """
    The main endpoint:
      1. read any personal details from the message and update the profile
      2. check eligibility and answer with RAG and citations
      3. logged-in users: save the conversation (and the profile, if they agreed)
      4. send the updated profile back (the frontend stores it and
         sends it with the next message - this is the "memory")
    Guests can chat too; nothing is saved for them.
    """

    start = time.perf_counter()

    # Step 1: Update the profile from the message.
    # Skip the LLM call when the message has no personal details.
    profile = merge_profiles(to_dict(request.profile), {})

    if has_personal_details(request.message):
        try:
            profile = merge_profiles(profile, extract_profile(request.message))
        except Exception as error:
            # If the LLM is down, keep the profile we have and continue.
            print(f"Profile extraction failed: {error}")

    extract_seconds = time.perf_counter() - start

    # Step 2: Answer. If the user is on a scheme page, search only that scheme.
    scheme_ids = None

    if request.scheme_id:
        find_scheme(request.scheme_id)
        scheme_ids = [request.scheme_id]

    history = [message.model_dump() for message in request.history[-4:]]
    result = ask_sahayak(request.message, profile, scheme_ids, history)

    # Step 3: Logged-in users: save the question and answer.
    conversation_id, message_id = None, None

    if user is not None:
        conversation_id, message_id = user_routes.save_chat_turn(
            db, user, request.conversation_id, request.message, result
        )
        user_routes.update_profile_if_consented(db, user, profile)

    total_seconds = time.perf_counter() - start
    print(f"Chat: profile {extract_seconds:.1f}s, total {total_seconds:.1f}s")

    # Step 4: Send everything back, including the updated profile.
    return {
        **result,
        "profile": profile,
        "follow_up_questions": get_follow_up_questions(profile),
        "conversation_id": conversation_id,
        "message_id": message_id,     # used to rate this answer
        "seconds": round(total_seconds, 1),
    }


# --------------------------------------------------
# 4. RUN
# --------------------------------------------------
# cd src
# uvicorn api:app --reload --port 8000
# Then open http://localhost:8000/docs to try every endpoint.
