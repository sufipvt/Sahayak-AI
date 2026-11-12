
from langchain_huggingface import HuggingFaceEmbeddings
from load_document import DATA_DIR, text_splitter, load_pdf_pages


# Initialize the embedding model
embedding_model = HuggingFaceEmbeddings(
    model_name="BAAI/bge-small-en-v1.5"
)


def generate_embeddings(chunks):
    """Generate vector embeddings for a list of text chunks."""
    return embedding_model.embed_documents(chunks)

def generate_record_embeddings(chunked_records):
    """Generate embeddings for chunked records while preserving their metadata."""

    texts = [
        record["content"]
        for record in chunked_records
    ]

    embeddings = generate_embeddings(texts)

    return [
        {
            **record,
            "embedding": embedding
        }
        for record, embedding in zip(chunked_records, embeddings)
    ]


if __name__ == "__main__":
    pdf_files = list(DATA_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found in the data directory.")

    else:
        for pdf_path in pdf_files:
            pages = load_pdf_pages(pdf_path)
            all_chunks = []

            # Split each page into smaller chunks
            for page in pages:
                chunks = text_splitter.split_text(page["text"])
                all_chunks.extend(chunks)

            if not all_chunks:
                print(f"No text chunks found in {pdf_path.name}")
                continue

            # Generate embeddings for all chunks
            embeddings = generate_embeddings(all_chunks)

            embedding_dimension = len(embeddings[0])

            print(f"\nDocument: {pdf_path.name}")
            print(f"Pages with extracted text: {len(pages)}")
            print(f"Total chunks: {len(all_chunks)}")
            print(
                f"Embedding dimensions: "
                f"{len(embeddings)} x {embedding_dimension}"
            )
