
# --------------------------------------------------
# HOW TO RUN
# --------------------------------------------------
#   python evaluate.py --check              check the test set only (no AI calls)
#   python evaluate.py --reranker minilm    full evaluation with the MiniLM re-ranker
#   python evaluate.py --reranker bge       full evaluation with the BGE re-ranker
# Results are saved in eval/results.json, and a table is printed.

import argparse
import json
import os
import sys
import time
from typing import List

RERANKERS = {
    "minilm": "cross-encoder/ms-marco-MiniLM-L6-v2",
    "bge": "BAAI/bge-reranker-base",
}

# The judge is from a DIFFERENT model family (Qwen) than the model that
# writes the answers (gpt-oss-120b), so the model does not grade itself.
JUDGE_MODEL = "qwen/qwen3.8-27b"

# Targets from the synopsis (section 6.2.4).
TARGETS = {"recall_at_5": 0.80, "eligibility_accuracy": 0.85, "faithfulness": 0.85}

args = argparse.ArgumentParser()
args.add_argument("--reranker", choices=RERANKERS, default="minilm")
args.add_argument("--check", action="store_true")
args = args.parse_args()

# Choose the re-ranker BEFORE the RAG modules are loaded.
os.environ["RERANKER_MODEL"] = RERANKERS[args.reranker]

from pydantic import BaseModel
from langchain_groq import ChatGroq

from load_document import PROJECT_ROOT
from scheme_fetcher import load_schemes, load_scheme_text
from eligibility import find_matching_schemes, find_named_schemes

EVAL_DIR = PROJECT_ROOT / "eval"
EVAL_SET = json.load(open(EVAL_DIR / "eval_set.json", encoding="utf-8"))
RESULTS_FILE = EVAL_DIR / "results.json"

IN_SCOPE = [q for q in EVAL_SET["questions"] if not q.get("out_of_scope")]
OUT_OF_SCOPE = [q for q in EVAL_SET["questions"] if q.get("out_of_scope")]
NOT_SCORED = {"startup-playbook"}   # a guide, not a scheme


def average(values):
    values = list(values)
    return round(sum(values) / len(values), 3) if values else None


# --------------------------------------------------
# 1. CHECK THE TEST SET (ids and sections must exist)
# --------------------------------------------------

def check_eval_set():
    from ingest_schemes import SECTION_TYPES

    scheme_ids = {s["scheme_id"] for s in load_schemes()}
    problems = []

    for q in IN_SCOPE:
        for scheme_id in q["expected_scheme_ids"]:
            if scheme_id not in scheme_ids:
                problems.append(f"{q['id']}: unknown scheme {scheme_id}")
                continue
            types = {SECTION_TYPES.get(name, "other") for name in load_scheme_text(scheme_id)["sections"]}
            if not types & set(q["expected_sections"]):
                problems.append(f"{q['id']}: {scheme_id} has none of {q['expected_sections']}")

    for p in EVAL_SET["profiles"]:
        for scheme_id in p["expected_likely_eligible"] + p["expected_needs_confirmation"]:
            if scheme_id not in scheme_ids:
                problems.append(f"{p['id']}: unknown scheme {scheme_id}")

    print(f"{len(IN_SCOPE)} questions + {len(OUT_OF_SCOPE)} out-of-scope, {len(EVAL_SET['profiles'])} profiles")
    print("\n".join(problems) if problems else "Test set OK: every scheme and section exists.")
    return not problems


# --------------------------------------------------
# 2. RETRY WHEN GROQ IS BUSY (free plan rate limits)
# --------------------------------------------------

def with_retry(function, *arguments):
    for attempt in range(6):
        try:
            return function(*arguments)
        except Exception as error:
            if attempt == 5:
                raise
            # Rate limit (429): wait a full minute for the limit to reset.
            wait = 60 if "429" in str(error) else 10
            print(f"   (busy, retrying in {wait} s: {str(error)[:70]})")
            time.sleep(wait)


# --------------------------------------------------
# 3. RETRIEVAL: RECALL@5 AND MRR
# --------------------------------------------------
# Recall@5: in how many questions is a correct chunk among the 5 retrieved?
# MRR (Mean Reciprocal Rank): 1/position of the first correct chunk
#   (1st -> 1.0, 2nd -> 0.5, 3rd -> 0.33 ... not found -> 0), averaged.
# A chunk is correct if its scheme AND its section match.

def is_hit(document, question):
    metadata = document.metadata
    return (
        metadata.get("scheme_id") in question["expected_scheme_ids"]
        and metadata.get("section_type") in question["expected_sections"]
    )


def evaluate_retrieval(retrieve_documents):
    rows = []

    for q in IN_SCOPE:
        start = time.perf_counter()
        documents, _ = retrieve_documents(q["question"])
        seconds = time.perf_counter() - start

        ranks = [i for i, d in enumerate(documents, start=1) if is_hit(d, q)]
        first = ranks[0] if ranks else None

        rows.append({
            "id": q["id"],
            "names_scheme": bool(find_named_schemes(q["question"])),
            "rank": first,
            "reciprocal_rank": round(1 / first, 3) if first else 0.0,
            "scheme_found": any(d.metadata.get("scheme_id") in q["expected_scheme_ids"] for d in documents),
            "retrieved": [f"{d.metadata.get('scheme_id')}/{d.metadata.get('section_type')}" for d in documents],
            "seconds": round(seconds, 2),
            "documents": documents,   # removed before saving
        })
        print(f"   {q['id']} rank={first}")

    named = [r for r in rows if r["names_scheme"]]
    unnamed = [r for r in rows if not r["names_scheme"]]

    summary = {
        "recall_at_5": average(r["rank"] is not None for r in rows),
        "recall_at_5_named": average(r["rank"] is not None for r in named),
        "recall_at_5_not_named": average(r["rank"] is not None for r in unnamed),
        "scheme_recall_at_5": average(r["scheme_found"] for r in rows),
        "mrr": average(r["reciprocal_rank"] for r in rows),
        "avg_retrieval_seconds": average(r["seconds"] for r in rows),
    }
    return summary, rows


# --------------------------------------------------
# 4. ELIGIBILITY ACCURACY
# --------------------------------------------------
# Every (profile, scheme) pair is scored:
#   expected eligible     -> correct if we say "Likely eligible" or "Needs confirmation"
#   expected not eligible -> correct only if we say "Not eligible"
# Strict accuracy: our status must be exactly the expected one.
# Precision / recall treat "eligible" (likely or needs confirmation) as positive.

def simple_status(status):
    if status in ("Eligible", "Likely eligible"):
        return "likely"
    if status == "Needs confirmation":
        return "confirm"
    return "not"


def evaluate_eligibility(extract_profile):
    scored_ids = [s["scheme_id"] for s in load_schemes() if s["scheme_id"] not in NOT_SCORED]
    rows = []
    correct = strict_correct = total = 0
    true_pos = false_pos = false_neg = 0

    for p in EVAL_SET["profiles"]:
        profile = with_retry(extract_profile, p["description"])
        system = {r["scheme_id"]: simple_status(r["status"]) for r in find_matching_schemes(profile, include_not_eligible=True)}
        mistakes = []

        for scheme_id in scored_ids:
            if scheme_id in p["expected_likely_eligible"]:
                expected = "likely"
            elif scheme_id in p["expected_needs_confirmation"]:
                expected = "confirm"
            else:
                expected = "not"
            got = system[scheme_id]

            expected_positive = expected != "not"
            got_positive = got != "not"

            total += 1
            correct += expected_positive == got_positive
            strict_correct += expected == got
            true_pos += expected_positive and got_positive
            false_pos += got_positive and not expected_positive
            false_neg += expected_positive and not got_positive

            if expected != got:
                mistakes.append(f"{scheme_id}: expected {expected}, got {got}")

        rows.append({
            "id": p["id"],
            "extracted_profile": {k: v for k, v in profile.items() if v is not None},
            "differences": mistakes,
        })
        print(f"   {p['id']} {len(mistakes)} difference(s)")

    summary = {
        "eligibility_accuracy": round(correct / total, 3),
        "eligibility_strict_accuracy": round(strict_correct / total, 3),
        "eligibility_precision": round(true_pos / (true_pos + false_pos), 3) if true_pos + false_pos else None,
        "eligibility_recall": round(true_pos / (true_pos + false_neg), 3) if true_pos + false_neg else None,
    }
    return summary, rows


# --------------------------------------------------
# 5. FAITHFULNESS (LLM-AS-JUDGE, LIKE RAGAS)
# --------------------------------------------------
# The judge splits each answer into statements and checks each one against
# the retrieved passages. Faithfulness = supported statements / all statements.

class Statement(BaseModel):
    statement: str
    supported: bool


class Judgement(BaseModel):
    statements: List[Statement]


JUDGE_PROMPT = """You check whether an answer is supported by its source passages.
Split the ANSWER into its individual factual statements (facts about schemes:
amounts, ages, rules, documents, steps), at most 12, each under 15 words.
Ignore headings, greetings, citation markers like [Source 1], and general
advice such as "check the official page".
For each statement, say whether it is directly supported by the CONTEXT.

CONTEXT:
{context}

ANSWER:
{answer}"""


def make_judge(schema):
    # reasoning_effort="none": no hidden "thinking" (saves output tokens; the
    # free plan allows 1000 output tokens per minute for this model).
    # max_tokens=900 keeps every request under that limit.
    judge = ChatGroq(model=JUDGE_MODEL, temperature=0, reasoning_effort="none", max_tokens=900)
    return judge.with_structured_output(schema, method="json_schema")


def evaluate_faithfulness(retrieval_rows, generate_answer, build_context):
    judge = make_judge(Judgement)
    rows = []

    for q, retrieved in zip(IN_SCOPE, retrieval_rows):
        documents = retrieved["documents"]

        start = time.perf_counter()
        answer, _ = with_retry(generate_answer, q["question"], documents)
        answer_seconds = time.perf_counter() - start

        judgement = with_retry(judge.invoke, JUDGE_PROMPT.format(context=build_context(documents), answer=answer))
        statements = judgement.statements
        supported = sum(s.supported for s in statements)
        # An answer with no factual statements has nothing unsupported.
        score = supported / len(statements) if statements else 1.0

        rows.append({
            "id": q["id"],
            "faithfulness": round(score, 3),
            "statements": len(statements),
            "unsupported": [s.statement for s in statements if not s.supported],
            "answer_words": len(answer.split()),
            "answer_seconds": round(answer_seconds, 2),
            "answer": answer,
        })
        print(f"   {q['id']} faithfulness={score:.2f} ({supported}/{len(statements)})")
        time.sleep(12)   # stay under the judge's 1000 output tokens per minute

    summary = {
        "faithfulness": average(r["faithfulness"] for r in rows),
        "avg_answer_seconds": average(r["answer_seconds"] for r in rows),
        "avg_answer_words": round(average(r["answer_words"] for r in rows)),
    }
    return summary, rows


# --------------------------------------------------
# 6. OUT-OF-SCOPE QUESTIONS: CORRECT REFUSAL RATE
# --------------------------------------------------
# For a question we have no data for, a correct answer says the information
# was not found AND does not invent details.

class Refusal(BaseModel):
    says_not_found: bool
    invents_details: bool


REFUSAL_PROMPT = """A government-scheme assistant may only answer from its own official data,
and that data does NOT cover this question.

QUESTION: {question}
ANSWER: {answer}

says_not_found: does the answer clearly say it does not have (or could not find) this information?
invents_details: does the answer give any specific facts about the asked topic (amounts, rules,
steps, names, results) that it could not have from its data?"""


def evaluate_refusals(retrieve_documents, generate_answer):
    judge = make_judge(Refusal)
    rows = []

    for q in OUT_OF_SCOPE:
        documents, _ = retrieve_documents(q["question"])
        answer, _ = with_retry(generate_answer, q["question"], documents)
        verdict = with_retry(judge.invoke, REFUSAL_PROMPT.format(question=q["question"], answer=answer))
        ok = verdict.says_not_found and not verdict.invents_details

        rows.append({"id": q["id"], "correct_refusal": ok, **verdict.model_dump(), "answer": answer})
        print(f"   {q['id']} correct refusal={ok}")
        time.sleep(12)

    return {"correct_refusal_rate": average(r["correct_refusal"] for r in rows)}, rows


# --------------------------------------------------
# 7. SAVE AND PRINT A TABLE FOR THE REPORT
# --------------------------------------------------

def save(run_name, summary, details):
    results = json.load(open(RESULTS_FILE, encoding="utf-8")) if RESULTS_FILE.exists() else {"runs": {}}
    results["runs"][run_name] = {"summary": summary, "details": details}
    json.dump(results, open(RESULTS_FILE, "w", encoding="utf-8"), indent=2, ensure_ascii=False, default=str)
    return results


def print_table(results):
    runs = results["runs"]
    names = list(runs)
    rows = [
        ("Recall@5 (scheme + section)", "recall_at_5", TARGETS["recall_at_5"]),
        ("  - questions naming a scheme", "recall_at_5_named", None),
        ("  - questions not naming a scheme", "recall_at_5_not_named", None),
        ("MRR", "mrr", None),
        ("Eligibility accuracy", "eligibility_accuracy", TARGETS["eligibility_accuracy"]),
        ("Eligibility strict accuracy", "eligibility_strict_accuracy", None),
        ("Eligibility precision", "eligibility_precision", None),
        ("Eligibility recall", "eligibility_recall", None),
        ("Faithfulness", "faithfulness", TARGETS["faithfulness"]),
        ("Correct refusal rate (out of scope)", "correct_refusal_rate", None),
        ("Avg retrieval + rerank time (s)", "avg_retrieval_seconds", None),
        ("Avg answer time (s)", "avg_answer_seconds", None),
    ]

    print("\n| Metric | " + " | ".join(names) + " | Target |")
    print("|---|" + "---|" * len(names) + "---|")
    for label, key, target in rows:
        values = [str(runs[n]["summary"].get(key, "")) for n in names]
        print(f"| {label} | " + " | ".join(values) + f" | {'>= ' + str(target) if target else ''} |")


# --------------------------------------------------
# 8. RUN
# --------------------------------------------------

if __name__ == "__main__":
    if not check_eval_set() or args.check:
        sys.exit(0)

    from rag_pipeline import retrieve_documents, generate_answer, build_context
    from profile_extractor import extract_profile

    print(f"\nRe-ranker: {RERANKERS[args.reranker]}   Judge: {JUDGE_MODEL}")

    print("\n1. Retrieval")
    retrieval, retrieval_rows = evaluate_retrieval(retrieve_documents)

    print("\n2. Eligibility")
    eligibility, eligibility_rows = evaluate_eligibility(extract_profile)

    print("\n3. Faithfulness")
    faithfulness, faithfulness_rows = evaluate_faithfulness(retrieval_rows, generate_answer, build_context)

    print("\n4. Out-of-scope questions")
    refusals, refusal_rows = evaluate_refusals(retrieve_documents, generate_answer)

    for row in retrieval_rows:
        row.pop("documents")

    summary = {
        "reranker": RERANKERS[args.reranker], "judge": JUDGE_MODEL,
        **retrieval, **eligibility, **faithfulness, **refusals,
    }
    results = save(args.reranker, summary, {
        "retrieval": retrieval_rows, "eligibility": eligibility_rows,
        "faithfulness": faithfulness_rows, "out_of_scope": refusal_rows,
    })
    print_table(results)
