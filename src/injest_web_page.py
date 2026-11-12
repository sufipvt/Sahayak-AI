
from source_registry import get_enabled_sources
from test_parser import fetch_page
from content_extractor import extract_all_content
from metadata_builder import prepare_records
from chunk_content import chunk_records
from embeddings import generate_record_embeddings
from web_vector_store import refresh_web_page


TARGET_URL = (
    "https://www.startupindia.gov.in/content/sih/en/"
    "credit-guarantee-scheme-for-startups.html"
)


def ingest_web_page(url, source):
    print(f"\nFetching: {url}")

    # 1. Fetch the webpage.
    html = fetch_page(url)

    # 2. Extract scheme sections and FAQs.
    extracted_records = extract_all_content(html, url)
    print(f"Extracted records: {len(extracted_records)}")

    # 3. Attach source metadata.
    prepared_records = prepare_records(extracted_records, source)

    # 4. Split content into chunks.
    chunked_records = chunk_records(prepared_records)
    print(f"Created chunks: {len(chunked_records)}")

    # 5. Generate embeddings.
    embedded_records = generate_record_embeddings(chunked_records)
    print(f"Generated embeddings: {len(embedded_records)}")

    # 6. Store records in ChromaDB.
    refresh_web_page(url, embedded_records)

    print("Website ingestion completed successfully.")


if __name__ == "__main__":
    sources = get_enabled_sources()

    source = next(
        (
            item for item in sources
            if item["source_id"] == "startup_india_schemes"
        ),
        None,
    )

    if source is None:
        raise ValueError(
            "Startup India source is missing or disabled in source_registry.py"
        )

    ingest_web_page(TARGET_URL, source)
