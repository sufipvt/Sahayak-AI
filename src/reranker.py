
import os

from sentence_transformers import CrossEncoder
from hybrid_retriever import retrieve_hybrid


# Load the reranker model.
# MiniLM-L6 is a small cross-encoder: about 0.8 s for 15 chunks on a laptop
# CPU, while "BAAI/bge-reranker-base" took 6-13 s. To switch back, set
# RERANKER_MODEL=BAAI/bge-reranker-base in the .env file.
RERANKER_MODEL = os.getenv("RERANKER_MODEL", "cross-encoder/ms-marco-MiniLM-L6-v2")

reranker_model = CrossEncoder(
    RERANKER_MODEL
)


def rerank_documents(question, documents, top_k=3):
    """
    Rerank retrieved documents according to their
    relevance to the user's question.
    """

    if not documents:
        return []

    # Create question-document pairs
    pairs = [
        (question, document.page_content)
        for document in documents
    ]

    # Calculate relevance scores
    scores = reranker_model.predict(pairs)

    # Sort documents by score, highest first
    ranked_documents = sorted(
        zip(documents, scores),
        key=lambda item: float(item[1]),
        reverse=True
    )

    # Return the top-ranked documents with their scores
    return [
        {
            "document": document,
            "score": float(score)
        }
        for document, score in ranked_documents[:top_k]
    ]


if __name__ == "__main__":

    question = "What are the eligibility criteria for SISFS?"

    # Step 1: Retrieve candidate documents
    documents = retrieve_hybrid(
        question,
        top_k=15
    )

    # Step 2: Rerank the retrieved documents
    results = rerank_documents(
        question,
        documents,
        top_k=3
    )

    # Step 3: Display the results
    for i, result in enumerate(results, start=1):
        document = result["document"]

        print(f"\nResult {i}")
        print(f"Relevance score: {result['score']:.4f}")
        print(document.page_content[:300])
