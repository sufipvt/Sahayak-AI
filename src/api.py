
import time
from typing import List, Literal, Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
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
from document_reader import analyse_document, DocumentError
from centre_finder import find_centres, find_location, CSC_LOCATOR_URL
from centre_tool import route_centre_question, answer_centre_question
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

    # Step 2: "Where can I apply?" questions go to the centre finder
    # (LangChain tool calling). Everything else gets the normal RAG answer.
    location_text = None if request.scheme_id else route_centre_question(request.message)

    if location_text is not None:
        result = {**answer_centre_question(location_text), "disclaimer": DISCLAIMER}
    else:
        # If the user is on a scheme page, search only that scheme.
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


@app.post("/api/documents/analyse")
async def documents_analyse(file: UploadFile = File(...)):
    """
    Upload a PDF (income certificate, marksheet, scheme notice ...).
    Returns a simple explanation and any profile details found.
    The file is read in memory and NOT stored.
    """

    if not (file.filename or "").lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")

    file_bytes = await file.read()

    try:
        return analyse_document(file_bytes)
    except DocumentError as error:
        raise HTTPException(status_code=400, detail=str(error))
    except Exception as error:
        print(f"Document analysis failed: {error}")
        raise HTTPException(status_code=503, detail="The AI service could not read this document. Please try again.")


@app.get("/api/centres")
def centres(place: Optional[str] = None, lat: Optional[float] = None, lon: Optional[float] = None):
    """
    Nearest banks, post offices and service centres.
    Give either ?place=Rohtak (or a PIN code) or ?lat=..&lon=.. from the browser.
    The location is used for this search only and is not stored.
    """

    if place:
        location = find_location(place)
        if location is None:
            raise HTTPException(status_code=404, detail=f"Could not find '{place}' on the map.")
    elif lat is not None and lon is not None:
        location = {"lat": lat, "lon": lon, "label": "Your location"}
    else:
        raise HTTPException(status_code=400, detail="Give a city / PIN code, or your location.")

    return {
        "location": location,
        "centres": find_centres(location["lat"], location["lon"]),
        "csc_locator_url": CSC_LOCATOR_URL,
    }


# --------------------------------------------------
# 4. RUN
# --------------------------------------------------
# cd src
# uvicorn api:app --reload --port 8000
# Then open http://localhost:8000/docs to try every endpoint.
