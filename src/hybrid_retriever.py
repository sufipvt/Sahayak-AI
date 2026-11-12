
import chromadb

from langchain_community.retrievers import BM25Retriever
from langchain_chroma import Chroma
from langchain_core.documents import Document

from load_document import PROJECT_ROOT
from embeddings import embedding_model


# --------------------------------------------------
# 1. CONNECT TO THE EXISTING CHROMA DATABASE
# --------------------------------------------------

CHROMA_DIR = PROJECT_ROOT / "chroma_db"
COLLECTION_NAME = "sahayak_schemes"

client = chromadb.PersistentClient(
    path=str(CHROMA_DIR)
)

vector_store = Chroma(
    client=client,
    collection_name=COLLECTION_NAME,
    embedding_function=embedding_model
)


# --------------------------------------------------
# 2. LOAD ALL CHUNKS (FOR KEYWORD SEARCH)
# --------------------------------------------------
# BM25 needs the raw text of every chunk in memory.
# reload_index() is called again after the weekly refresh.

all_documents = []


def reload_index():
    global all_documents

    stored_data = client.get_collection(COLLECTION_NAME).get(
        include=["documents", "metadatas"]
    )

    if not stored_data["documents"]:
        raise ValueError(
            "No documents found in ChromaDB. Run ingest_schemes.py first."
        )

    all_documents = [
        Document(page_content=text, metadata=metadata or {})
        for text, metadata in zip(stored_data["documents"], stored_data["metadatas"])
        if text
    ]

    print(f"Loaded {len(all_documents)} chunks from ChromaDB.")


reload_index()


# --------------------------------------------------
# 3. SEMANTIC SEARCH (MEANING), ONLY IN ALLOWED SCHEMES
# --------------------------------------------------

# These sections stay in the saved files, but are never used to answer.
LOW_VALUE_SECTIONS = ["faq", "contact", "references", "grievance"]


def semantic_search(question, scheme_ids, k):
    where = {"section_type": {"$nin": LOW_VALUE_SECTIONS}}

    if scheme_ids:
        where = {"$and": [where, {"scheme_id": {"$in": scheme_ids}}]}

    return vector_store.similarity_search(question, k=k, filter=where)


# --------------------------------------------------
# 4. KEYWORD SEARCH (BM25), ONLY IN ALLOWED SCHEMES
# --------------------------------------------------
# Good for exact names like "PM-KISAN" that embeddings can miss.

def keyword_search(question, scheme_ids, k):
    documents = [
        d for d in all_documents
        if d.metadata.get("section_type") not in LOW_VALUE_SECTIONS
    ]

    if scheme_ids:
        documents = [d for d in documents if d.metadata.get("scheme_id") in scheme_ids]

    if not documents:
        return []

    bm25_retriever = BM25Retriever.from_documents(documents)
    bm25_retriever.k = k

    return bm25_retriever.invoke(question)


# --------------------------------------------------
# 5. COMBINE BOTH LISTS WITH RECIPROCAL RANK FUSION (RRF)
# --------------------------------------------------
# Each chunk gets 1 / (60 + rank) from every list it appears in.
# Chunks that rank high in BOTH lists end up on top.

def reciprocal_rank_fusion(result_lists, k=60):
    scores = {}
    documents = {}

    for results in result_lists:
        for rank, document in enumerate(results, start=1):
            key = document.page_content
            scores[key] = scores.get(key, 0) + 1 / (k + rank)
            documents[key] = document

    ranked_keys = sorted(scores, key=scores.get, reverse=True)

    return [documents[key] for key in ranked_keys]


# --------------------------------------------------
# 6. THE HYBRID RETRIEVAL FUNCTION
# --------------------------------------------------

def retrieve_hybrid(question, top_k=5, scheme_ids=None):
    """
    scheme_ids = None  -> search all schemes
    scheme_ids = [...] -> search only these schemes (the eligible ones)
    """

    if scheme_ids is not None and len(scheme_ids) == 0:
        return []

    question = question.strip()

    semantic_results = semantic_search(question, scheme_ids, k=top_k)
    keyword_results = keyword_search(question, scheme_ids, k=top_k)

    fused = reciprocal_rank_fusion([semantic_results, keyword_results])

    return fused[:top_k]


# --------------------------------------------------
# 7. TEST THE HYBRID RETRIEVER
# --------------------------------------------------

if __name__ == "__main__":
    question = "What documents do I need?"

    results = retrieve_hybrid(question, top_k=5, scheme_ids=["pm-kisan", "nmmss"])

    for i, document in enumerate(results, start=1):
        print(f"\nResult {i}: {document.metadata['scheme_id']} | {document.metadata['section']}")
        print(document.page_content[:200])
