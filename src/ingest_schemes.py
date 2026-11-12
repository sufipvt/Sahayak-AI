
from datetime import datetime

import chromadb

from load_document import PROJECT_ROOT, DATA_DIR, text_splitter, load_pdf_pages
from embeddings import generate_record_embeddings
from scheme_fetcher import load_schemes, load_scheme_text


# --------------------------------------------------
# 1. CONNECT TO CHROMADB
# --------------------------------------------------

CHROMA_DIR = PROJECT_ROOT / "chroma_db"
COLLECTION_NAME = "sahayak_schemes"

client = chromadb.PersistentClient(path=str(CHROMA_DIR))


def get_collection():
    return client.get_or_create_collection(name=COLLECTION_NAME)


# --------------------------------------------------
# 2. BUILD THE METADATA FOR ONE CHUNK
# --------------------------------------------------
# Every chunk remembers which scheme it belongs to. The eligibility
# filter (step 2) uses "scheme_id" to search only matching schemes.

# Different websites name their sections differently.
# "section_type" gives every section one standard name.
SECTION_TYPES = {
    "Eligibility": "eligibility",
    "Exclusions": "exclusions",
    "Benefits": "benefits",
    "Documents Required": "documents",
    "Application Process": "how_to_apply",
    "Online Application": "how_to_apply",
    "Offline Application": "how_to_apply",
    "Registration Process": "how_to_apply",
    "Description": "description",
    "Overview": "description",
    "Frequently Asked Questions": "faq",
}


def get_section_type(section, chunk):
    if section.startswith("Page "):
        return "guide"   # a page of the startup playbook PDF

    section_type = SECTION_TYPES.get(section, "other")

    # Some descriptions end with "how to raise a grievance". Mark those
    # chunks so they are not used to answer normal questions.
    if section_type == "description" and "grievance" in chunk.lower():
        return "grievance"

    return section_type


def build_chunk_metadata(scheme, section, chunk_index, last_updated, chunk, page_number=0):
    return {
        "scheme_id": scheme["scheme_id"],
        "scheme_name": scheme["name"],
        "category": scheme["category"],
        "section": section,
        "section_type": get_section_type(section, chunk),
        "source_url": scheme["url"],
        "last_updated": last_updated,
        "chunk_index": chunk_index,
        "page_number": page_number,
    }


# --------------------------------------------------
# 3. SPLIT A SCHEME INTO CHUNKS
# --------------------------------------------------

def chunk_web_scheme(scheme):
    """Chunk a scheme whose text was saved in data/schemes_text/."""

    saved = load_scheme_text(scheme["scheme_id"])

    if saved is None:
        print(f"  No saved text for {scheme['scheme_id']}. Run scheme_fetcher.py first.")
        return []

    records = []

    for section, text in saved["sections"].items():
        for chunk_index, chunk in enumerate(text_splitter.split_text(text)):
            records.append({
                # The scheme name and section go on every chunk, so a chunk
                # still makes sense when it is read on its own.
                "content": f"Scheme: {scheme['name']}\nSection: {section}\n\n{chunk}",
                "metadata": build_chunk_metadata(
                    scheme, section, chunk_index, saved["fetched_at"], chunk
                ),
            })

    return records


def chunk_pdf_scheme(scheme):
    """Chunk a local PDF (the Startup India playbook), page by page."""

    pdf_path = DATA_DIR / scheme["url"]

    # For a PDF, "last updated" is the date the file was last changed.
    last_updated = datetime.fromtimestamp(pdf_path.stat().st_mtime).isoformat()

    records = []

    for page in load_pdf_pages(pdf_path):
        section = f"Page {page['page_number']}"

        for chunk_index, chunk in enumerate(text_splitter.split_text(page["text"])):
            records.append({
                "content": f"Document: {scheme['name']}\nPage: {page['page_number']}\n\n{chunk}",
                "metadata": build_chunk_metadata(
                    scheme, section, chunk_index, last_updated, chunk, page["page_number"]
                ),
            })

    return records


def chunk_scheme(scheme):
    if scheme["source"] == "pdf":
        return chunk_pdf_scheme(scheme)
    return chunk_web_scheme(scheme)


# --------------------------------------------------
# 4. STORE THE CHUNKS OF ONE SCHEME
# --------------------------------------------------

def make_chunk_id(record):
    metadata = record["metadata"]
    return f"{metadata['scheme_id']}__{metadata['section']}__{metadata['chunk_index']}"


def index_scheme(scheme, collection=None):
    """
    Replace all chunks of one scheme in ChromaDB.
    The weekly refresh job (step 6) will reuse this for changed schemes.
    """

    collection = collection or get_collection()

    # 4a. Chunk and embed first. If this fails, the old chunks are untouched.
    records = chunk_scheme(scheme)

    if not records:
        return 0

    embedded_records = generate_record_embeddings(records)

    # 4b. Remove the old chunks of this scheme.
    collection.delete(where={"scheme_id": scheme["scheme_id"]})

    # 4c. Add the new chunks.
    collection.add(
        ids=[make_chunk_id(r) for r in embedded_records],
        documents=[r["content"] for r in embedded_records],
        embeddings=[r["embedding"] for r in embedded_records],
        metadatas=[r["metadata"] for r in embedded_records],
    )

    return len(embedded_records)


# --------------------------------------------------
# 5. REBUILD THE WHOLE KNOWLEDGE BASE
# --------------------------------------------------

def ingest_all_schemes():
    """Delete the collection and index every scheme in schemes.json again."""

    try:
        client.delete_collection(name=COLLECTION_NAME)
    except Exception:
        pass

    collection = get_collection()

    for scheme in load_schemes():
        count = index_scheme(scheme, collection)
        print(f"{scheme['scheme_id']:<18} {count:>4} chunks")

    print(f"\nTotal chunks in ChromaDB: {collection.count()}")


# --------------------------------------------------
# 6. A QUICK TEST SEARCH
# --------------------------------------------------

def test_search(question, scheme_ids=None):
    """Semantic search, optionally only inside some schemes (by scheme_id)."""

    from embeddings import embedding_model

    where = {"scheme_id": {"$in": scheme_ids}} if scheme_ids else None

    results = get_collection().query(
        query_embeddings=[embedding_model.embed_query(question)],
        n_results=3,
        where=where,
    )

    print(f"\nQuestion: {question}")
    print(f"Only these schemes: {scheme_ids or 'all'}")

    for text, metadata in zip(results["documents"][0], results["metadatas"][0]):
        print(f"  - {metadata['scheme_id']} | {metadata['section']} | {text[:90]!r}")


# --------------------------------------------------
# 7. RUN FROM THE COMMAND LINE
# --------------------------------------------------
# This reads only the saved files in data/schemes_text/ and data/*.pdf,
# so it works offline (no internet needed during the demo).

if __name__ == "__main__":
    ingest_all_schemes()

    test_search("financial help for farmers")
    test_search("pension after 60", scheme_ids=["apy", "pm-sym"])
