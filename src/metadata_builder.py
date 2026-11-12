from datetime import datetime, timezone


def build_metadata(record, source):
    """
    Attach source information and ingestion timestamp to a record.
    """

    return {
        "source_id": source["source_id"],
        "organization": source["organization"],
        "source_type": source["source_type"],
        "source_url": record["source_url"],
        "content_type": record["content_type"],
        "section": record["section"],
        "fetched_at": datetime.now(timezone.utc).isoformat(),
    }

def prepare_records(records, source):
    """
    Prepare extracted records with content and metadata.
    """

    prepared_records = []

    for record in records:
        content = record.get("content")

        if not content:
            continue

        prepared_records.append({
            "content": content,
            "metadata": build_metadata(record, source),
        })

    return prepared_records