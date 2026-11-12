
import hashlib

import chromadb
from load_document import PROJECT_ROOT


CHROMA_DIR = PROJECT_ROOT / "chroma_db"

client = chromadb.PersistentClient(
    path=str(CHROMA_DIR)
)

collection = client.get_or_create_collection(
    name="sahayak_schemes"
)



def generate_record_id(record):
    """Generate a deterministic ID for a website content chunk."""

    metadata = record["metadata"]

    unique_key = (

        f"{metadata['source_url']}|"
        f"{metadata['content_type']}|"
        f"{metadata['section']}|"
        f"{record['content']}|"
        f"{metadata['chunk_index']}"
    )

    return hashlib.sha256(
        unique_key.encode("utf-8")
    ).hexdigest()



def store_web_records(embedded_records):
    """Store website chunks, embeddings, and metadata in ChromaDB."""

    if not embedded_records:
        print("No website records to store.")
        return

    ids = [
        generate_record_id(record)
        for record in embedded_records
    ]

    documents = [
        record["content"]
        for record in embedded_records
    ]

    embeddings = [
        record["embedding"]
        for record in embedded_records
    ]

    metadatas = [
        record["metadata"]
        for record in embedded_records
    ]

    collection.upsert(
        ids=ids,
        documents=documents,
        embeddings=embeddings,
        metadatas=metadatas
    )

    print(f"Website records stored: {len(ids)}")
    print(f"Total records in collection: {collection.count()}")



def refresh_web_page(url, embedded_records):
    """Refresh one webpage while attempting to preserve old records on failure."""

    # 1. Validate incoming records before changing the database.
    for record in embedded_records:
        if not record.get("content"):
            raise ValueError("A record has empty content.")

        if not record.get("embedding"):
            raise ValueError("A record has no embedding.")

        if record.get("metadata", {}).get("source_url") != url:
            raise ValueError(
                "A record belongs to a different webpage."
            )

    # 2. Generate IDs and check for duplicates.
    new_ids = [
        generate_record_id(record)
        for record in embedded_records
    ]

    if len(new_ids) != len(set(new_ids)):
        raise ValueError("Duplicate IDs found in incoming records.")

    # 3. Back up the existing webpage records.
    existing = collection.get(
        where={"source_url": url},
        include=["documents", "metadatas", "embeddings"]
    )

    old_ids = existing["ids"]

    try:
        # 4. Remove only the old records for this URL.
        if old_ids:
            collection.delete(ids=old_ids)
            print(f"Removed {len(old_ids)} old chunks.")

        # 5. Store the new records.
        if embedded_records:
            store_web_records(embedded_records)
        else:
            raise ValueError(
                "No new records supplied; refusing to remove existing data."
            )

    except Exception:
        # 6. Attempt to restore the previous records.
        if old_ids:
            try:
                collection.upsert(
                    ids=old_ids,
                    documents=existing["documents"],
                    metadatas=existing["metadatas"],
                    embeddings=existing["embeddings"].tolist()
                )
                print("Previous webpage records restored.")
            except Exception as restore_error:
                print(
                    "WARNING: Automatic restoration failed:",
                    restore_error
                )

        raise

    print(f"Webpage refresh successful. Total records: {collection.count()}")


