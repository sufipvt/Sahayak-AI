
import os

# Use the Windows certificate store for HTTPS. Without this, antivirus
# software that scans HTTPS (like Avast) makes every API call fail with
# "CERTIFICATE_VERIFY_FAILED". Certificates are still checked.
import truststore
truststore.inject_into_ssl()

from dotenv import load_dotenv
from langchain_groq import ChatGroq


# --------------------------------------------------
# ONE SHARED LLM FOR THE WHOLE PROJECT
# --------------------------------------------------
# The API key is read from the .env file (GROQ_API_KEY=...).
# Change the model name here and every module uses the new model.

load_dotenv()

LLM_MODEL = os.getenv("LLM_MODEL", "openai/gpt-oss-120b")

# gpt-oss "thinks" before answering. "low" thinking is much faster and is
# enough, because the answer comes from the given context. Other models
# (e.g. qwen) do not take this setting.
extra = {"reasoning_effort": "low"} if "gpt-oss" in LLM_MODEL else {}

llm = ChatGroq(
    api_key=os.getenv("GROQ_API_KEY"),
    model=LLM_MODEL,
    temperature=0.1,
    **extra
)
