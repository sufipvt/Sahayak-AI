
from llm import llm
from reranker import rerank_documents
from hybrid_retriever import retrieve_hybrid
from eligibility import find_matching_schemes, find_named_schemes, check_scheme
from scheme_fetcher import load_schemes


DISCLAIMER = (
    "Sahayak gives information only. The final decision on any application "
    "rests with the concerned government department."
)


# --------------------------------------------------
# 1. THE PROMPT
# --------------------------------------------------

PROMPT = """
You are Sahayak AI, an assistant that helps Indian citizens
understand government schemes.

RULES:
1. Answer using only the provided context.
2. Explain each scheme separately.
3. Never apply one scheme's eligibility criteria to another scheme.
4. Do not invent eligibility rules, benefits, deadlines, or procedures.
5. If information is missing, clearly say so.
6. Cite the supporting source after each statement, like [Source 1].
7. Only cite sources that support the relevant claim.
8. Use simple words. Avoid government jargon.
9. If the user describes themselves, use the ELIGIBILITY CHECK below to say
   which schemes they are likely eligible for and why, in simple words.
   Mention any detail that still needs to be confirmed.
10. Never assume facts about the user that are not in the USER PROFILE
   (for example, that they own land). Say "if you ..." instead.
11. Never give an amount, date or rule that is not in the CONTEXT, even if
   you know it. Leave it out instead.
12. Format: short headings and bullet lists. Do not use tables.
   Write citations exactly like [Source 1].
13. Keep the answer under 150 words, unless the user asks for more
   detail. Cover the 3 best schemes at most. List documents and
   application steps as short bullet points.

CONVERSATION SO FAR:
{history}

USER PROFILE:
{profile}

ELIGIBILITY CHECK (done by our rule checker):
{eligibility}

CONTEXT:
{context}

USER QUESTION:
{question}

ANSWER:
"""


# --------------------------------------------------
# 2. HELPERS THAT TURN DATA INTO PROMPT TEXT
# --------------------------------------------------

def describe_history(history):
    if not history:
        return "This is the first message."

    return "\n".join(
        f"{message['role']}: {message['content'][:500]}"
        for message in history
    )


def last_user_message(history):
    for message in reversed(history or []):
        if message["role"] == "user":
            return message["content"]
    return ""


def describe_profile(profile):
    known = {k: v for k, v in (profile or {}).items() if v is not None}
    return ", ".join(f"{k}: {v}" for k, v in known.items()) or "Not provided"


def describe_matches(matches):
    if not matches:
        return "Not done (no profile details)."

    lines = []
    for match in matches:
        reasons = " ".join(match["why"]) or "No specific rule checked."
        missing = f" Still need: {', '.join(match['missing'])}." if match["missing"] else ""
        lines.append(f"- {match['name']}: {match['status']}. {reasons}{missing}")

    return "\n".join(lines)


# These sections answer most questions, so they get a small bonus.
PREFERRED_SECTIONS = ["eligibility", "exclusions", "benefits", "documents", "how_to_apply"]
PREFERRED_BONUS = 1.0


def prefer_useful_sections(ranked):
    """Add a bonus to the re-ranker score of preferred sections, then sort again."""

    for result in ranked:
        if result["document"].metadata.get("section_type") in PREFERRED_SECTIONS:
            result["score"] += PREFERRED_BONUS

    return sorted(ranked, key=lambda r: r["score"], reverse=True)


def limit_per_scheme(documents, per_scheme, total):
    """Keep the documents in order, but at most `per_scheme` from each scheme."""

    kept, counts = [], {}

    for document in documents:
        scheme_id = document.metadata.get("scheme_id")

        if counts.get(scheme_id, 0) < per_scheme:
            kept.append(document)
            counts[scheme_id] = counts.get(scheme_id, 0) + 1

        if len(kept) == total:
            break

    return kept


def build_context(documents):
    parts = []

    for i, document in enumerate(documents, start=1):
        metadata = document.metadata
        parts.append(
            f"[Source {i}]\n"
            f"Scheme: {metadata.get('scheme_name')}\n"
            f"Section: {metadata.get('section')}\n"
            f"Official page: {metadata.get('source_url')}\n"
            f"Content:\n{document.page_content}"
        )

    return "\n\n".join(parts)


# --------------------------------------------------
# 3. ANSWER WHEN THE LLM IS NOT AVAILABLE
# --------------------------------------------------
# If Groq is down, still show the official passages we found.

def fallback_answer(documents):
    if not documents:
        return "The AI service is not available right now, and no matching information was found."

    lines = ["The AI service is not available right now. These official passages match your question:"]

    for i, document in enumerate(documents, start=1):
        lines.append(f"- {document.metadata.get('scheme_name')} ({document.metadata.get('section')}) [Source {i}]")

    return "\n".join(lines)


# --------------------------------------------------
# 4. RETRIEVE, RERANK, AND ANSWER
# --------------------------------------------------

def choose_schemes_to_search(question, profile, history):
    """
    Returns (scheme_ids, matches):
      - If the user names a scheme ("How do I apply for APY?"), search that
        scheme, whatever its eligibility status. If this message names none,
        look at the user's previous message ("what documents do I need?").
      - Otherwise, if we know the profile, search every scheme that is not
        "Not eligible" (Likely eligible + Needs confirmation).
      - Otherwise search everything (scheme_ids = None).
    """

    has_profile = any(v is not None for v in (profile or {}).values())
    matches = find_matching_schemes(profile) if has_profile else []

    named = find_named_schemes(question) or find_named_schemes(last_user_message(history))

    if named:
        # Also show the rule check for named schemes, even "Not eligible"
        # ones, so the answer can explain why.
        if has_profile:
            matched_ids = [m["scheme_id"] for m in matches]
            for scheme in load_schemes():
                if scheme["scheme_id"] in named and scheme["scheme_id"] not in matched_ids:
                    matches.append(check_scheme(profile, scheme))

        return named, matches

    if has_profile:
        return [m["scheme_id"] for m in matches], matches

    return None, matches


def ask_sahayak(question, profile=None, scheme_ids=None, history=None):
    """
    question   : the user's question
    profile    : the user's profile (age, state, income ...) or None
    scheme_ids : search only these schemes (used by the scheme detail page)
    history    : the last few messages [{"role": "user"/"assistant", "content": ...}]
    """

    # Step 1: Decide which schemes to search.
    if scheme_ids is None:
        scheme_ids, matches = choose_schemes_to_search(question, profile, history)
    else:
        matches = []

    # Step 2: Retrieve 15 candidates with hybrid search.
    # For a follow-up like "my income is 2 lakh", the earlier message
    # tells us what the user is looking for, so we search with both.
    search_text = f"{last_user_message(history)} {question}".strip()
    candidates = retrieve_hybrid(search_text, top_k=15, scheme_ids=scheme_ids)

    # Step 3: Rerank the 15 candidates, give a bonus to useful sections,
    # then keep the best 5 (at most 2 per scheme).
    ranked = rerank_documents(search_text, candidates, top_k=len(candidates))
    ranked = prefer_useful_sections(ranked)
    documents = limit_per_scheme([r["document"] for r in ranked], per_scheme=2, total=5)

    # Step 4: Generate the answer (or fall back if the LLM fails).
    prompt = PROMPT.format(
        history=describe_history(history),
        profile=describe_profile(profile),
        eligibility=describe_matches(matches),
        context=build_context(documents) or "No matching information found.",
        question=question,
    )

    try:
        answer = llm.invoke(prompt).content
        llm_available = True
    except Exception as error:
        print(f"LLM error: {error}")
        answer = fallback_answer(documents)
        llm_available = False

    # Step 5: Collect the sources so the UI can show them as citations.
    sources = []

    for i, document in enumerate(documents, start=1):
        metadata = document.metadata
        sources.append({
            "number": i,
            "scheme_id": metadata.get("scheme_id"),
            "scheme_name": metadata.get("scheme_name"),
            "section": metadata.get("section"),
            "url": metadata.get("source_url"),
            "last_updated": metadata.get("last_updated"),
            "excerpt": document.page_content[:400],
        })

    return {
        "answer": answer,
        "sources": sources,
        "matches": matches,
        "llm_available": llm_available,
        "disclaimer": DISCLAIMER,
    }


# --------------------------------------------------
# 5. TEST THE RAG PIPELINE
# --------------------------------------------------

if __name__ == "__main__":
    profile = {"age": 20, "state": "Haryana", "annual_income": 300000, "occupation": "student"}

    result = ask_sahayak("Which schemes can I apply for?", profile)

    print("\nSahayak AI Answer:\n")
    print(result["answer"])

    print("\nSources:\n")

    for source in result["sources"]:
        print(f"[{source['number']}] {source['scheme_name']} - {source['section']}")
        print(f"    {source['url']} (updated {source['last_updated'][:10]})")
