# Sahayak: AI assistant for government schemes (RAG)

Final-year minor project (B.Tech CSE AI & ML, GD Goenka University). Built by Sufiyan Rizvi, alone.
Users describe themselves in plain words. Sahayak extracts a profile, checks eligibility with plain
rules, and answers with citations to official scheme pages.
Repo: https://github.com/sufipvt/Sahayak-AI (branch `main`).

## How I want you to work
- Keep code SIMPLE and beginner-readable: small files, numbered comments, a test block
  (`if __name__ == "__main__":`) at the bottom of each module.
- Work in steps. After each step: stop, explain in simple words how it works and connects to
  earlier steps, give PowerShell test commands, update the Status section of this file,
  commit and push, then wait for my OK.
- Never invent scheme facts. Scheme text comes only from official pages saved in `data/schemes_text/`.
- Never commit `.env`, `sahayak.db`, `chroma_db/`, `.venv/`, `node_modules/` (all in `.gitignore`).
- I'm on Windows (PowerShell).
- Internal evaluation is on 19 Nov 2026: no new features unless I ask, only the steps listed below and fixes.

## Stack
- Backend: Python 3.13, FastAPI, LangChain, ChromaDB, BGE-small embeddings, BM25 + vector search
  combined with RRF, MiniLM cross-encoder re-ranker (BGE optional via `RERANKER_MODEL`),
  SQLite + SQLAlchemy, JWT (PyJWT) + bcrypt, Playwright for fetching pages.
- LLM: `openai/gpt-oss-120b` on Groq (Llama chat models aren't available on my account), set in
  `src/llm.py` (`LLM_MODEL` env var). JSON-schema mode for structured outputs (profile, PDF
  analysis). The evaluation judge is `qwen/qwen3.8-27b`.
- Frontend: React + Vite + Tailwind, axios, react-markdown, Leaflet + OpenStreetMap,
  browser speech (mic + Listen).
- `.env` keys (see `.env.example`): GROQ_API_KEY, LLM_MODEL, JWT_SECRET, RERANKER_MODEL.

## Structure
- `src/` (run everything from here):
  - Data: `scheme_fetcher.py` (Playwright, 5 s between requests, saves text + hash),
    `ingest_schemes.py` (chunks, section_type, embeds, ChromaDB), `load_document.py`
    (paths, text splitter, PDF reader), `embeddings.py`, `content_extractor.py` (Startup India HTML)
  - RAG: `profile_extractor.py`, `eligibility.py` (rules + scheme-name detection),
    `hybrid_retriever.py`, `reranker.py`, `rag_pipeline.py` (`retrieve_documents`,
    `generate_answer`, `ask_sahayak`), `llm.py`
  - App: `api.py` (all routes + chat), `database.py`, `auth.py`, `user_routes.py`,
    `admin_routes.py`, `create_admin.py`, `document_reader.py`, `centre_finder.py`, `centre_tool.py`,
    `refresh_job.py` (weekly refresh: APScheduler, Sunday 03:00 local time, hash compare,
    re-index changed schemes only, `refresh_log` table)
  - Evaluation: `evaluate.py`
  - Early-prototype files, not used by the app: `injest_web_page.py`, `retriever.py`,
    `vector_store.py`, `web_vector_store.py`, `chunk_content.py`, `metadata_builder.py`,
    `source_registry.py`, `test_*.py`
- `data/schemes.json`: 15 schemes + the startup playbook PDF entry. Fields: scheme_id, name,
  aliases, ministry, category, source (myscheme / startup_india / pdf), url, states, min_age,
  max_age, max_annual_income, gender, social_categories, occupations, needs_disability,
  rule_notes, verified
- `data/schemes_text/<scheme_id>.json`: saved official text: source_url, fetched_at,
  content_hash (SHA-256), sections
- `eval/eval_set.json` (30 questions + 3 out-of-scope + 10 profiles), `eval/results.json` (per re-ranker run)
- `frontend/src/`: `api.js` (all backend calls), `store.js` (localStorage), `auth.jsx` (login
  context), `voice.js`, `pages/`, `components/` (Answer, ChatPanel, ProfileCard, CentreMap, Layout, ui,
  `admin/` RefreshPanel, SchemesPanel, CentresPanel)

## Run (PowerShell)
```
cd src
$env:PYTHONIOENCODING="utf-8"; $env:HF_HUB_OFFLINE="1"
..\.venv\Scripts\python.exe ingest_schemes.py            # rebuild index from saved files (offline)
..\.venv\Scripts\python.exe scheme_fetcher.py [ids...]   # re-fetch official pages (online)
..\.venv\Scripts\python.exe refresh_job.py [ids...]      # refresh once: re-index only changed schemes (online)
..\.venv\Scripts\python.exe refresh_job.py --simulate-change apy   # viva demo: fake old hash -> apy re-indexed, real hash restored
..\.venv\Scripts\python.exe create_admin.py              # make an admin account
..\.venv\Scripts\python.exe -m uvicorn api:app --host 127.0.0.1 --port 8000   # API docs: /docs
cd ..\frontend; npm run dev                               # http://localhost:5173
```
Evaluation (from `src`, about 10 minutes per run because of Groq free-tier limits):
```
..\.venv\Scripts\python.exe evaluate.py --check              # validate eval_set.json, no AI calls
..\.venv\Scripts\python.exe evaluate.py --reranker minilm    # or --reranker bge
```
Each run is saved under `runs.<reranker>` in `eval/results.json`, and a table of all saved runs is printed.

## Key decisions (don't change without asking)
- Eligibility is plain Python rules, no AI. Statuses: Eligible / Likely eligible / Needs confirmation /
  Not eligible (with `rule_notes`, nothing reaches "Eligible"). Never treat an unknown detail as
  "Not eligible" (keep eligibility recall at 1.0).
- Retrieval searches Likely eligible + Needs confirmation schemes. A named scheme (id, short name or
  alias) is searched alone. faq / grievance / contact / references sections are excluded; eligibility,
  exclusions, benefits, documents and how_to_apply get +1 re-ranker bonus; at most 2 chunks per scheme.
- Guest chat allowed (nothing saved). Login is needed for profile (saved only with consent), history,
  saved schemes and ratings. Admins are created only via `create_admin.py`.
- PDF upload: text PDFs only (no OCR), max 10 MB / 10 pages, never saved, profile fields added only
  after the user confirms.
- Centre finder: Nominatim (1 request/second, cached 1 h, User-Agent "SahayakAI/1.0 ...") for banks and
  post offices + admin-added CSCs (`service_centres` table) + a link to the official CSC locator.
  OSM attribution is shown on maps. Overpass is not used (unreachable from my network).
- Tool calling: one tool (`find_centres`) via `bind_tools`, with a fallback to the RAG answer and a
  "Find nearby centres" button.
- Answers under 150 words, at most 3 schemes, cite [Source n], no tables, nothing beyond the sources
  (prompt rule 11), never assume facts about the user.

## Gotchas
- Avast Web Shield intercepts HTTPS, so `truststore` is used (certificates are still verified).
- Use 127.0.0.1, not localhost (Windows adds ~2 s). The Vite proxy sends /api to 127.0.0.1:8000.
- Set `PYTHONIOENCODING=utf-8` before printing scheme text in PowerShell.
- Groq free tier: occasional 10-20 s spikes; the qwen judge allows 1000 output tokens/minute, so
  `evaluate.py` uses `reasoning_effort="none"`, `max_tokens=900`, pauses and retries.
- Scheme rules are marked `verified: false` until I check them; the UI shows "Rules not yet verified".

## Evaluation results (step 6a, MiniLM re-ranker)
Recall@5 1.00, MRR 0.98, faithfulness 0.99 (about 0.84 on a partial run before the prompt rule 11 fix),
refusal rate 1.00 (3 out-of-scope), eligibility accuracy 0.79 (strict 0.79, precision 0.48,
recall 1.00), retrieval 0.98 s, answer 1.17 s. BGE re-ranker: Recall@5 0.97, MRR 0.90, retrieval 5.51 s.
Test set: 30 + 3 questions, 10 profiles × 15 schemes. Most eligibility errors: PMAY-G (no rules),
IGNDPS (disability unknown) and PMUY (gender unknown) give "Needs confirmation" instead of "Not eligible".

## Status
- Done: Steps 1–5 (knowledge base, profile/eligibility/RAG/API, frontend, database + login,
  PDF upload + centre finder + tool calling), requirements.txt / .env.example / README,
  Step 6a evaluation, Step 6b weekly refresh job (`refresh_job.py`; admin API
  `POST /api/admin/refresh` starts it in the background, 409 if already running;
  `GET /api/admin/refresh/log` gives running, next_run and the last 20 runs). Unchanged pages
  are not re-saved; on a failed re-index the old file and chunks are restored; a block (403/429)
  stops the run. Tested 17 Nov 2026: all 15 pages unchanged.
  Additions: a changed scheme gets `"verified": false` in schemes.json and the log message says
  "Rules may need re-check: <ids>". `--simulate-change <id>` (CLI only, checks only that scheme,
  logged as triggered_by "simulation") plants a fake old hash; the fresh fetch saves the real hash,
  and if the run fails the original file is put back. The verified flag is not restored (false is the safe side).
  Step 6c admin page (`pages/Admin.jsx` + `components/admin/`): stats, Run refresh now (polls
  every 5 s while running), refresh log, service centres (list/add/delete), schemes table
  (`GET /api/admin/schemes`: fetched_at, hash, sections, verified; amber row + "rules may need
  re-check" when a refresh changed the scheme and it is still unverified). Evaluation placeholder removed.
  Fix (18 Nov): new details in a chat message now always replace the old age / state / occupation.
  Cause: when the LLM profile extraction failed (Groq error), `api.py` silently kept the old profile.
  Now `extract_new_details` (profile_extractor.py) uses simple rules for age, state and occupation
  as a backup (the LLM wins where it found a value), and Results.jsx re-checks eligibility when the
  profile changed but the answer had no scheme cards (e.g. a centre-finder answer).
- Next:
  1. Eligibility fix (if time before 19 Nov): add real rules from official criteria (education level
     for NMMSS/PM-Vidyalaxmi, income-tax payer for APY, SC/ST-or-woman for Stand-Up India, basic
     PMAY-G); UI shows "Needs confirmation" schemes in a separate "May also apply" section; re-run
     the eligibility evaluation and show before/after.
  2. After 19 Nov: Step 7 Docker + full README (README file table still lacks step 5/6 files).
