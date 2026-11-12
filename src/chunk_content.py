from langchain_text_splitters import RecursiveCharacterTextSplitter


text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)



def chunk_records(records):
    """Split content into chunks while preserving metadata and FAQ context."""

    chunked_records = []

    for record in records:
        content = record["content"]
        metadata = record["metadata"]

        if metadata["content_type"] == "faq" and len(content) > 1000:
            question = metadata.get("question")

            # Extract the question from the FAQ content if needed.
            if not question and content.startswith("Question: "):
                question = content.split("\nAnswer:", 1)[0]
                question = question.removeprefix("Question: ").strip()

            if question:
                answer = content.split("\nAnswer:", 1)[-1].strip()

                answer_prefix = f"Question: {question}\nAnswer: "
                answer_chunks = text_splitter.split_text(answer)

                for chunk_index, answer_chunk in enumerate(answer_chunks):
                    if chunk_index > 0:
                        chunk_content = (
                            f"Question: {question}\n"
                            f"Answer (continued): {answer_chunk}"
                        )
                    else:
                        chunk_content = answer_prefix + answer_chunk

                    chunked_records.append({
                        "content": chunk_content,
                        "metadata": {
                            **metadata,
                            "chunk_index": chunk_index
                        }
                    })

                continue

        # Keep short FAQs together; split other long content normally.
        if metadata["content_type"] == "faq" and len(content) <= 1000:
            chunks = [content]
        else:
            chunks = text_splitter.split_text(content)

        for chunk_index, chunk in enumerate(chunks):
            chunked_records.append({
                "content": chunk,
                "metadata": {
                    **metadata,
                    "chunk_index": chunk_index
                }
            })

    return chunked_records
