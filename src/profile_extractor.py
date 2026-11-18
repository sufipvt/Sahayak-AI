
import re
from typing import Literal, Optional

from pydantic import BaseModel, Field

from llm import llm


# --------------------------------------------------
# 1. THE PROFILE SCHEMA (FIXED OUTPUT FORMAT)
# --------------------------------------------------
# The LLM must fill exactly these fields. Pydantic checks the types,
# so we never get "twenty" where we expect the number 20.
# A field the user did not mention stays None (empty).

Occupation = Literal[
    "farmer", "student", "entrepreneur", "self-employed",
    "unorganised worker", "street vendor", "salaried",
    "unemployed", "homemaker", "retired",
]

SocialCategory = Literal["General", "OBC", "SC", "ST", "EWS"]


class UserProfile(BaseModel):
    age: Optional[int] = Field(None, description="Age in years")
    gender: Optional[Literal["male", "female", "other"]] = None
    state: Optional[str] = Field(None, description="Indian state of residence, full name, e.g. 'Haryana'")
    annual_income: Optional[int] = Field(
        None, description="Annual FAMILY income in rupees. '3 lakh' = 300000. Monthly income x 12."
    )
    social_category: Optional[SocialCategory] = None
    occupation: Optional[Occupation] = Field(None, description="Pick the closest one")
    education: Optional[str] = Field(None, description="e.g. 'Class 8', 'B.Tech'")
    disability: Optional[bool] = Field(None, description="True only if the user says they have a disability")


# --------------------------------------------------
# 2. EXTRACT A PROFILE FROM PLAIN TEXT
# --------------------------------------------------

# json_schema mode makes Groq return exactly the UserProfile format.
structured_llm = llm.with_structured_output(UserProfile, method="json_schema")

EXTRACTION_PROMPT = """
Extract the user's details from the text below.
Only fill a field if the user clearly states it. Never guess.
If the user gives an upper limit for income, like "under 3 lakh", use that number (300000).
Someone who runs, or wants to start, a business or startup is an "entrepreneur".
If the text is just a question with no personal details, leave every field empty.

TEXT:
{text}
"""


def extract_profile(text):
    """Turn a sentence like 'I am a 20 year old student' into a profile dict."""

    profile = structured_llm.invoke(EXTRACTION_PROMPT.format(text=text))

    return profile.model_dump()


# --------------------------------------------------
# 3. QUICK CHECK: DOES THE MESSAGE CONTAIN PERSONAL DETAILS?
# --------------------------------------------------
# Calling the LLM takes time. "How do I apply for APY?" has no personal
# details, so we skip the extraction. A message with a number (age,
# income) or words like "I am", "my", "farmer" goes to the LLM.

PERSONAL_WORDS = [
    "i am", "i'm", "im", "my", "mine", "years", "year old", "lakh", "income",
    "salary", "earn", "male", "female", "woman", "man", "girl", "boy", "widow",
    "farmer", "student", "studying", "business", "vendor", "worker", "unemployed",
    "retired", "homemaker", "housewife", "disabled", "disability", "sc", "st",
    "obc", "ews", "general category", "live in",
]

STATES = [
    "andhra", "arunachal", "assam", "bihar", "chhattisgarh", "goa", "gujarat",
    "haryana", "himachal", "jharkhand", "karnataka", "kerala", "madhya pradesh",
    "maharashtra", "manipur", "meghalaya", "mizoram", "nagaland", "odisha",
    "punjab", "rajasthan", "sikkim", "tamil nadu", "telangana", "tripura",
    "uttar pradesh", "uttarakhand", "west bengal", "delhi", "jammu", "kashmir",
    "ladakh", "puducherry", "chandigarh",
]


def has_personal_details(message):
    text = message.lower()

    # Any number (age, income, class) counts as a personal detail.
    if re.search(r"\d", text):
        return True

    # \b means "whole word", so "man" does not match "woman" or "manual".
    for word in PERSONAL_WORDS + STATES:
        if re.search(r"\b" + re.escape(word) + r"\b", text):
            return True

    return False


# --------------------------------------------------
# 3b. BACKUP: FIND AGE, STATE AND OCCUPATION WITH SIMPLE RULES
# --------------------------------------------------
# If the LLM call fails (Groq rate limit, timeout) or leaves a field
# empty, these rules still catch the clear cases, so "I am a 45 year
# old farmer from Punjab" always replaces an old age, state and job.

STATE_NAMES = {
    "andhra pradesh": "Andhra Pradesh", "arunachal pradesh": "Arunachal Pradesh",
    "assam": "Assam", "bihar": "Bihar", "chhattisgarh": "Chhattisgarh", "goa": "Goa",
    "gujarat": "Gujarat", "haryana": "Haryana", "himachal pradesh": "Himachal Pradesh",
    "jharkhand": "Jharkhand", "karnataka": "Karnataka", "kerala": "Kerala",
    "madhya pradesh": "Madhya Pradesh", "maharashtra": "Maharashtra", "manipur": "Manipur",
    "meghalaya": "Meghalaya", "mizoram": "Mizoram", "nagaland": "Nagaland", "odisha": "Odisha",
    "punjab": "Punjab", "rajasthan": "Rajasthan", "sikkim": "Sikkim", "tamil nadu": "Tamil Nadu",
    "telangana": "Telangana", "tripura": "Tripura", "uttar pradesh": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand", "west bengal": "West Bengal", "delhi": "Delhi",
    "jammu and kashmir": "Jammu and Kashmir", "ladakh": "Ladakh",
    "puducherry": "Puducherry", "chandigarh": "Chandigarh",
}

# word in the message -> occupation (must be one of the Occupation values)
OCCUPATION_WORDS = {
    "farmer": "farmer", "kisan": "farmer", "student": "student",
    "entrepreneur": "entrepreneur", "street vendor": "street vendor",
    "unemployed": "unemployed", "homemaker": "homemaker", "housewife": "homemaker",
    "retired": "retired", "salaried": "salaried",
}


def find_details_with_rules(message):
    """Return only the details the rules are sure about, e.g. {"age": 45, "state": "Punjab"}."""

    text = message.lower()
    found = {}

    # "45 year old", "45-year-old", "45 yrs old", "age 45", "aged 45", "I am 45", "I'm 45"
    # ("I studied for 3 years" is not an age, so "old" or "I am" is needed.)
    age = (
        re.search(r"\b(\d{1,3})[\s-]*(?:years?|yrs?)[\s-]*old\b", text)
        or re.search(r"\baged?\s*(?:is\s*)?(\d{1,3})\b", text)
        or re.search(r"\b(?:i am|i'm|im)\s+(\d{1,3})\b(?!\s*(?:lakh|rs|rupees|%))", text)
    )
    if age and 0 < int(age.group(1)) < 120:
        found["age"] = int(age.group(1))

    # Only one state named: if two are named we cannot tell which is home.
    states = [name for word, name in STATE_NAMES.items() if re.search(r"\b" + word + r"\b", text)]
    if len(states) == 1:
        found["state"] = states[0]

    # Only one occupation named, for the same reason.
    jobs = {job for word, job in OCCUPATION_WORDS.items() if re.search(r"\b" + word + r"s?\b", text)}
    if len(jobs) == 1:
        found["occupation"] = jobs.pop()

    return found


def extract_new_details(message):
    """
    The details to update from one chat message:
      1. the rules above (always work, no AI)
      2. the LLM (understands everything else); where it found a value, it wins
    If the LLM fails, the rule details are still returned.
    """

    details = find_details_with_rules(message)

    try:
        llm_details = extract_profile(message)
        details.update({field: value for field, value in llm_details.items() if value is not None})
    except Exception as error:
        print(f"Profile extraction (LLM) failed, using rules only: {error}")

    return details


# --------------------------------------------------
# 4. MERGE WITH THE SAVED PROFILE
# --------------------------------------------------

def merge_profiles(saved_profile, new_profile):
    """New details win; details the user did not repeat are kept."""

    merged = dict(saved_profile or {})

    for field, value in (new_profile or {}).items():
        if value is not None:
            merged[field] = value

    # Make sure every field exists (None if unknown).
    return UserProfile(**merged).model_dump()


# --------------------------------------------------
# 5. FOLLOW-UP QUESTIONS FOR MISSING DETAILS
# --------------------------------------------------
# These details change which schemes match, so we ask for them.

FOLLOW_UP_QUESTIONS = {
    "age": "How old are you?",
    "state": "Which state do you live in?",
    "annual_income": "What is your family's yearly income (approximately)?",
    "occupation": "What do you do? (for example: student, farmer, business owner)",
}


def get_follow_up_questions(profile):
    return [
        question
        for field, question in FOLLOW_UP_QUESTIONS.items()
        if profile.get(field) is None
    ]


# --------------------------------------------------
# 6. TEST
# --------------------------------------------------

if __name__ == "__main__":
    for message in ["How do I apply for APY?", "my income is 2 lakh", "I am a woman from Bihar"]:
        print(f"{message!r}: personal details = {has_personal_details(message)}")

    # New details must replace the old ones (age, state, occupation).
    old = {"age": 20, "state": "Haryana", "occupation": "student"}
    message = "I am a 45 year old farmer from Punjab"
    print("Rules only:", find_details_with_rules(message))
    print("Merged:", merge_profiles(old, extract_new_details(message)))

    text = (
        "I am a 20-year-old engineering student from Haryana "
        "and my family income is under 3 lakh"
    )

    profile = extract_profile(text)
    print("Extracted profile:", profile)

    profile = merge_profiles({"gender": "female"}, profile)
    print("Merged profile:  ", profile)

    print("Follow-up questions:", get_follow_up_questions(profile))
