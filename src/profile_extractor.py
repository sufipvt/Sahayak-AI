
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

structured_llm = llm.with_structured_output(UserProfile)

EXTRACTION_PROMPT = """
Extract the user's details from the text below.
Only fill a field if the user clearly states it. Never guess.
If the user gives an upper limit for income, like "under 3 lakh", use that number (300000).
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

    text = (
        "I am a 20-year-old engineering student from Haryana "
        "and my family income is under 3 lakh"
    )

    profile = extract_profile(text)
    print("Extracted profile:", profile)

    profile = merge_profiles({"gender": "female"}, profile)
    print("Merged profile:  ", profile)

    print("Follow-up questions:", get_follow_up_questions(profile))
