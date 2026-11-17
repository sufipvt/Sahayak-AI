
from typing import List, Literal

import pymupdf
from pydantic import BaseModel, Field

from llm import llm
from profile_extractor import UserProfile


# --------------------------------------------------
# 1. LIMITS
# --------------------------------------------------
# The uploaded file is read in memory and never saved to disk.

MAX_FILE_MB = 10
MAX_PAGES = 10
MAX_CHARACTERS = 12000   # about 3,000 words is enough for a certificate or notice


class DocumentError(Exception):
    """A problem with the file that the user should be told about."""


# --------------------------------------------------
# 2. PDF -> TEXT (PyMuPDF)
# --------------------------------------------------

def read_pdf_text(file_bytes):
    if len(file_bytes) > MAX_FILE_MB * 1024 * 1024:
        raise DocumentError(f"The file is larger than {MAX_FILE_MB} MB.")

    try:
        document = pymupdf.open(stream=file_bytes, filetype="pdf")
    except Exception:
        raise DocumentError("This file could not be opened as a PDF.")

    with document:
        if document.is_encrypted:
            raise DocumentError("This PDF is password-protected. Please upload an unlocked copy.")

        pages = [page.get_text() for page in list(document)[:MAX_PAGES]]

    text = "\n".join(pages).strip()

    # A scanned PDF is only pictures, with no text inside.
    if len(text) < 30:
        raise DocumentError(
            "No text was found in this PDF. It is probably a scanned image; "
            "reading scanned documents (OCR) is not supported yet."
        )

    return text[:MAX_CHARACTERS], len(pages)


# --------------------------------------------------
# 3. TEXT -> EXPLANATION + PROFILE DETAILS (LLM, FIXED FORMAT)
# --------------------------------------------------

class DocumentAnalysis(BaseModel):
    document_type: Literal[
        "income certificate", "caste certificate", "marksheet", "disability certificate",
        "identity document", "scheme notification", "application form", "other",
    ]
    summary: str = Field(description="What this document is and what it says, in simple words, at most 80 words")
    key_points: List[str] = Field(description="Up to 5 short points: amounts, dates, deadlines, conditions")
    profile: UserProfile = Field(description="Details about the PERSON the document belongs to. Leave empty if not clearly printed.")


# json_schema mode makes Groq return exactly this format, even for long
# documents (with the default tool-call mode, the model sometimes
# answered in plain text instead).
analysis_llm = llm.with_structured_output(DocumentAnalysis, method="json_schema")

ANALYSIS_PROMPT = """
You help Indian citizens understand official documents.
Read the document text below and:
1. Say what kind of document it is.
2. Explain it in simple words (no jargon), at most 80 words.
3. List up to 5 key points (amounts, dates, deadlines, conditions).
4. Fill the profile ONLY with details about the person that are clearly printed
   (for example the annual family income on an income certificate, the category
   on a caste certificate). Never guess. For a scheme notification or form,
   leave the profile empty.

DOCUMENT TEXT:
{text}
"""


def analyse_document(file_bytes):
    text, pages = read_pdf_text(file_bytes)

    analysis = analysis_llm.invoke(ANALYSIS_PROMPT.format(text=text))

    # Only the details that were actually found.
    found = {k: v for k, v in analysis.profile.model_dump().items() if v is not None}

    return {
        "document_type": analysis.document_type,
        "summary": analysis.summary,
        "key_points": analysis.key_points,
        "profile_found": found,
        "pages_read": pages,
    }


# --------------------------------------------------
# 4. TEST
# --------------------------------------------------
# python document_reader.py some_file.pdf

if __name__ == "__main__":
    import sys

    with open(sys.argv[1], "rb") as file:
        print(analyse_document(file.read()))
