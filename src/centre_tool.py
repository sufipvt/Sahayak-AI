
import re

from langchain_core.tools import tool

from llm import llm
from centre_finder import find_centres_near_place, CSC_LOCATOR_URL


# --------------------------------------------------
# 1. THE TOOL
# --------------------------------------------------
# A "tool" is a function the LLM is allowed to ask us to run.
# The docstring tells the LLM what the tool does and when to use it.

@tool
def find_centres(location: str) -> str:
    """Find the nearest places where the user can apply for a government
    scheme (banks, post offices, Common Services Centres). Use it when the
    user asks where to apply, or for a nearby centre or office.
    location: the city, town or 6-digit PIN code the user mentioned,
    or an empty string if they did not mention a place."""
    return location   # we run the real search ourselves (step 3 below)


# bind_tools tells the LLM that this tool exists.
llm_with_tools = llm.bind_tools([find_centres])


# --------------------------------------------------
# 2. ASK THE LLM ONLY WHEN IT MIGHT BE A "WHERE" QUESTION
# --------------------------------------------------
# Every LLM call costs about a second, so we first do a quick word check.

CENTRE_WORDS = re.compile(
    r"\b(where|near(est|by)?|centre|center|csc|office|bank|post office|apply in|apply at|location)\b",
    re.IGNORECASE,
)

ROUTER_PROMPT = """You help Indian citizens with government schemes.
If the user asks WHERE to apply, or for the nearest centre, office, bank or CSC,
call the find_centres tool with the place they mention (or "" if none).
For any other question, do not call a tool.

User: {message}"""


def route_centre_question(message):
    """
    Returns:
      None -> not a "where to apply" question: use the normal RAG answer
      ""   -> a "where" question, but no place was given
      "Rohtak" (etc.) -> search centres near this place
    """

    if not CENTRE_WORDS.search(message):
        return None

    try:
        response = llm_with_tools.invoke(ROUTER_PROMPT.format(message=message))
    except Exception as error:
        print(f"Tool routing failed: {error}")
        return None   # fall back to the normal answer

    # The LLM chose not to use the tool: fall back to the normal answer.
    if not response.tool_calls:
        return None

    return (response.tool_calls[0]["args"].get("location") or "").strip()


# --------------------------------------------------
# 3. RUN THE SEARCH AND WRITE A SHORT ANSWER
# --------------------------------------------------

def answer_centre_question(location_text):
    """Returns a dict in the same shape as ask_sahayak(), plus the centres."""

    base = {"sources": [], "matches": [], "llm_available": True, "centres": [], "centre_location": None}

    if not location_text:
        return {
            **base,
            "answer": (
                "I can show you the nearest banks, post offices and service centres. "
                "Please tell me your **city or PIN code** (for example: *nearest centre in Rohtak*), "
                "or use the **Find nearby centres** button to use your location."
            ),
        }

    location, centres = find_centres_near_place(location_text)

    if location is None:
        return {**base, "answer": f"I could not find **{location_text}** on the map. Please check the spelling or try a PIN code."}

    lines = [f"Here are the nearest places to **{location['label']}** where you can ask about or apply for schemes:"]
    for centre in centres[:5]:
        lines.append(f"- **{centre['name']}** ({centre['type']}, {centre['distance_km']} km), {centre['address']}")
    lines.append(
        f"\nFor Common Services Centres (CSCs), you can also use the official "
        f"[CSC locator]({CSC_LOCATOR_URL}). Please call ahead: opening hours and services can change."
    )

    return {**base, "answer": "\n".join(lines), "centres": centres, "centre_location": location}


# --------------------------------------------------
# 4. TEST
# --------------------------------------------------

if __name__ == "__main__":
    for message in [
        "Where can I apply for PM-KISAN in Rohtak?",
        "nearest CSC to 110001",
        "where do I apply?",
        "What documents do I need for APY?",
        "Which bank gives Mudra loans?",
    ]:
        print(f"{message!r:50} -> {route_centre_question(message)!r}")
