
import re

from scheme_fetcher import load_schemes


# --------------------------------------------------
# 1. HOW THE STATUS IS DECIDED
# --------------------------------------------------
# For every rule of a scheme we check the user's profile:
#   - passed  : the user meets the rule
#   - failed  : the user clearly does not meet the rule
#   - missing : we don't know the detail yet (e.g. no age given)
#
# Status:
#   any rule failed                          -> "Not eligible"
#   a detail is missing, or no rule checked  -> "Needs confirmation"
#   all passed, but rule_notes exist         -> "Likely eligible"
#   all passed, no notes                     -> "Eligible"

STATUS_ORDER = ["Eligible", "Likely eligible", "Needs confirmation", "Not eligible"]


def rupees(amount):
    return f"Rs {amount:,}"


# --------------------------------------------------
# 2. CHECK ONE SCHEME
# --------------------------------------------------

def check_scheme(profile, scheme):
    passed, failed, missing = [], [], []

    # 2a. Age
    min_age, max_age = scheme.get("min_age"), scheme.get("max_age")

    if min_age is not None or max_age is not None:
        age = profile.get("age")
        if max_age is None:
            limit = f"at least {min_age} years"
        elif min_age is None:
            limit = f"up to {max_age} years"
        else:
            limit = f"{min_age} to {max_age} years"

        if age is None:
            missing.append(f"your age (allowed: {limit})")
        elif (min_age is not None and age < min_age) or (max_age is not None and age > max_age):
            failed.append(f"Age must be {limit}; you are {age}.")
        else:
            passed.append(f"Your age ({age}) fits the limit ({limit}).")

    # 2b. Income
    max_income = scheme.get("max_annual_income")

    if max_income is not None:
        income = profile.get("annual_income")

        if income is None:
            missing.append(f"your family income (limit: {rupees(max_income)} a year)")
        elif income > max_income:
            failed.append(f"Family income must be at most {rupees(max_income)}; yours is {rupees(income)}.")
        else:
            passed.append(f"Your family income ({rupees(income)}) is within the {rupees(max_income)} limit.")

    # 2c. State
    states = scheme.get("states", ["All"])

    if "All" not in states:
        state = profile.get("state")

        if state is None:
            missing.append(f"your state (only for: {', '.join(states)})")
        elif state.lower() not in [s.lower() for s in states]:
            failed.append(f"Only for residents of {', '.join(states)}.")
        else:
            passed.append(f"You live in {state}.")

    # 2d. Gender
    gender = scheme.get("gender", "any")

    if gender != "any":
        user_gender = profile.get("gender")

        if user_gender is None:
            missing.append(f"your gender (only for {gender} applicants)")
        elif user_gender != gender:
            failed.append(f"Only for {gender} applicants.")
        else:
            passed.append(f"The scheme is for {gender} applicants.")

    # 2e. Social category (SC / ST / OBC ...)
    categories = scheme.get("social_categories", ["any"])

    if "any" not in categories:
        category = profile.get("social_category")

        if category is None:
            missing.append(f"your social category (only for {', '.join(categories)})")
        elif category not in categories:
            failed.append(f"Only for {', '.join(categories)} applicants.")
        else:
            passed.append(f"You belong to the {category} category.")

    # 2f. Occupation
    occupations = scheme.get("occupations", ["any"])

    if "any" not in occupations:
        occupation = profile.get("occupation")

        if occupation is None:
            missing.append(f"your occupation (for: {', '.join(occupations)})")
        elif occupation not in occupations:
            failed.append(f"Meant for: {', '.join(occupations)}.")
        else:
            passed.append(f"The scheme is meant for a {occupation}.")

    # 2g. Disability
    if scheme.get("needs_disability"):
        disability = profile.get("disability")

        if disability is None:
            missing.append("whether you have a disability")
        elif not disability:
            failed.append("Only for persons with disability.")
        else:
            passed.append("The scheme is for persons with disability.")

    # 2h. Decide the status
    if failed:
        status = "Not eligible"
    elif missing or not passed:
        status = "Needs confirmation"
    elif scheme.get("rule_notes"):
        status = "Likely eligible"
    else:
        status = "Eligible"

    return {
        "scheme_id": scheme["scheme_id"],
        "name": scheme["name"],
        "ministry": scheme["ministry"],
        "category": scheme["category"],
        "url": scheme["url"],
        "rules_verified": scheme.get("verified", False),
        "status": status,
        "why": passed,
        "failed": failed,
        "missing": missing,
        "rule_notes": scheme.get("rule_notes", ""),
    }


# --------------------------------------------------
# 3. CHECK ALL SCHEMES
# --------------------------------------------------

def find_matching_schemes(profile, include_not_eligible=False):
    """Check every scheme and return the matches, best first."""

    results = [check_scheme(profile, scheme) for scheme in load_schemes()]

    if not include_not_eligible:
        results = [r for r in results if r["status"] != "Not eligible"]

    # Best status first; inside the same status, more matched rules first.
    results.sort(key=lambda r: (STATUS_ORDER.index(r["status"]), -len(r["why"])))

    return results


# --------------------------------------------------
# 4. FIND SCHEMES THE USER NAMES IN THE MESSAGE
# --------------------------------------------------
# "How do I apply for APY?" -> ["apy"]
# Each scheme can be named by its id, its short name in brackets
# (e.g. "PM-KISAN"), its full name, or one of its aliases.

def scheme_names(scheme):
    names = [scheme["scheme_id"], scheme["name"].split("(")[0]]
    names += re.findall(r"\(([^)]+)\)", scheme["name"])   # text inside brackets
    names += scheme.get("aliases", [])
    return [n.strip() for n in names if n.strip()]


def name_to_pattern(name):
    # "PM-KISAN" matches "PM-KISAN", "pm kisan" and "pmkisan".
    words = re.split(r"[\s-]+", name)
    return r"\b" + r"[\s-]?".join(re.escape(w) for w in words) + r"\b"


def find_named_schemes(message):
    found = []

    for scheme in load_schemes():
        for name in scheme_names(scheme):
            if re.search(name_to_pattern(name), message, re.IGNORECASE):
                found.append(scheme["scheme_id"])
                break

    return found


# --------------------------------------------------
# 5. TEST (no LLM needed)
# --------------------------------------------------

if __name__ == "__main__":
    profile = {
        "age": 20,
        "state": "Haryana",
        "annual_income": 300000,
        "occupation": "student",
        "gender": None,
    }

    for result in find_matching_schemes(profile, include_not_eligible=True):
        print(f"{result['status']:<20} {result['scheme_id']:<18} why={result['why']} failed={result['failed']} missing={result['missing']}")

    for message in ["How do I apply for APY?", "tell me about pm kisan and mudra loans", "I am happy"]:
        print(f"\n{message!r} -> {find_named_schemes(message)}")
