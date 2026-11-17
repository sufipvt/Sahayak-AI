# Sahayak – AI assistant for government schemes

Sahayak helps citizens find the Indian government schemes they may be eligible for.
You describe yourself in plain words ("I am a 45 year old farmer from Punjab"), and Sahayak:

1. reads your details (age, state, income, occupation…) with an LLM,
2. checks them against each scheme's rules,
3. searches the official scheme pages (hybrid search + re-ranking), and
4. answers in simple words, citing the official page for every statement.

It is a RAG (Retrieval-Augmented Generation) system: the AI answers only from
official text that we fetched and stored, not from memory.

> Sahayak gives information only. The final decision on any application rests
> with the concerned government department.

## Project structure

```
data/schemes.json        the schemes, their official URLs and eligibility rules
data/schemes_text/       text fetched from the official pages (works offline)
src/                     Python backend (FastAPI)
frontend/                React website (Vite + Tailwind)
```

## Setup (Windows, PowerShell)

Needs Python 3.11+ and Node.js 20+.

```powershell
# 1. Python packages
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m playwright install chromium

# 2. Settings: copy the example and fill in your Groq key and a JWT secret
copy .env.example .env

# 3. Build the search index from the saved scheme text (no internet needed)
cd src
..\.venv\Scripts\python ingest_schemes.py

# 4. Create an admin account (asks for name, email, password)
..\.venv\Scripts\python create_admin.py

# 5. Frontend packages
cd ..\frontend
npm install
```

## Run

Two terminals:

```powershell
# Terminal 1 - backend
cd src
..\.venv\Scripts\python -m uvicorn api:app --host 127.0.0.1 --port 8000

# Terminal 2 - frontend
cd frontend
npm run dev
```

Open http://localhost:5173. The API test page is at http://127.0.0.1:8000/docs.

## Updating scheme data

```powershell
cd src
..\.venv\Scripts\python scheme_fetcher.py           # fetch all official pages (polite: 5 s apart)
..\.venv\Scripts\python scheme_fetcher.py pm-kisan  # or only some schemes
..\.venv\Scripts\python ingest_schemes.py           # rebuild the search index
```

Every scheme in `data/schemes.json` has `"verified": false` until its rules
(age, income, …) have been checked against the official page.

## Main backend files

| File | What it does |
|---|---|
| `scheme_fetcher.py` | Fetches official scheme pages with Playwright and saves their sections |
| `ingest_schemes.py` | Splits the text into chunks, embeds them (BGE) and stores them in ChromaDB |
| `profile_extractor.py` | Turns plain text into a profile (age, state, income…) with the LLM |
| `eligibility.py` | Checks a profile against each scheme's rules, with reasons |
| `hybrid_retriever.py` | Semantic + keyword (BM25) search, combined with reciprocal rank fusion |
| `rag_pipeline.py` | Re-ranks, builds the prompt and writes the cited answer |
| `api.py` | The FastAPI endpoints |
| `database.py`, `auth.py`, `user_routes.py` | Users, login (bcrypt + JWT), profiles, history |
| `admin_routes.py`, `create_admin.py` | Admin statistics and creating admin accounts |

## Tech

FastAPI · LangChain · ChromaDB · BM25 · BGE embeddings · MiniLM cross-encoder ·
Groq (gpt-oss-120b) · SQLite + SQLAlchemy · React + Vite + Tailwind · Playwright
