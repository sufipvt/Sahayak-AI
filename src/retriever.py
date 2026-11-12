import chromadb
from pathlib import Path
from load_document import PROJECT_ROOT
from embeddings import embedding_model

CHROMA_DIR = PROJECT_ROOT / "chroma_db"

client = chromadb.PersistentClient(
    path=str(CHROMA_DIR)
)

collection = client.get_collection(
    name="sahayak_schemes"
)

def retrieve_documents(question, top_k=3):
    query_embedding = embedding_model.embed_query(question)

    #search in chromadb collection
    results = collection.query(
        query_embeddings = [query_embedding],
        n_results = top_k,
    )

    return results

if __name__ == "__main__":
    question = "Who can apply for startup schemes?"

    results = retrieve_documents(question)

    documents = results["documents"][0]
    metadatas = results["metadatas"][0]

    for i, (document, metadata) in enumerate(zip(documents, metadatas), start=1):
        print(f"\nResult {i}:")
        print(document)

        print(f"source: {metadata['source']}")
        print(f"chunk_index: {metadata['chunk_index']}")