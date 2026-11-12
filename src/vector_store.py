import chromadb
from pathlib import Path
from load_document import PROJECT_ROOT, DATA_DIR, text_splitter, load_pdf_pages
from embeddings import generate_embeddings

CHROMA_DIR = PROJECT_ROOT / "chroma_db"

client = chromadb.PersistentClient(
    path=str(CHROMA_DIR)
)
def rebuild_collection():
    global collection

    try:
        client.delete_collection(name="sahayak_schemes")
    except Exception:
        pass

    collection = client.get_or_create_collection(
        name="sahayak_schemes"
    )



if __name__ == "__main__":
    rebuild_collection()
    pdf_files = list(DATA_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found in the data directory.")
    else:
        for pdf_path in pdf_files:
            pages = load_pdf_pages(pdf_path)
            for page in pages:
                page_number = page["page_number"]
                page_text = page["text"]

                chunks = text_splitter.split_text(page_text)
                if not chunks:
                    continue
                embeddings = generate_embeddings(chunks)

                ids = [
                f"{pdf_path.stem}_page_{page_number}_chunk_{i}"
                for i in range(len(chunks))
                ]
            

                metadatas = [
                    {
                        "source": pdf_path.name,
                        "page_number": page_number,
                        "chunk_index": i

                    }
                    for i in range(len(chunks))
                ]

                collection.upsert(
                    ids=ids,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    documents=chunks
                )

                print(
                    f"Processed page {page_number}: "
                    f"{len(chunks)} chunks stored"
                )
        print(f"\nTotal chunks stored: {collection.count()}")
        print("Vector store rebuilt successfully.")

                