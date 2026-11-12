
import pymupdf
from pathlib import Path
from langchain_text_splitters import RecursiveCharacterTextSplitter


# Project paths
PROJECT_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = PROJECT_ROOT / "data"


# Text splitter configuration
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200
)


def load_pdf_pages(file_path):
    """Extract text from a PDF while preserving page numbers."""

    pages = []

    with pymupdf.open(file_path) as document:
        for page_number, page in enumerate(document, start=1):
            page_text = page.get_text().strip()

            if page_text:
                pages.append({
                    "page_number": page_number,
                    "text": page_text
                })

    return pages


if __name__ == "__main__":
    pdf_files = list(DATA_DIR.glob("*.pdf"))

    if not pdf_files:
        print("No PDF files found in the data directory.")

    else:
        for pdf_path in pdf_files:
            pages = load_pdf_pages(pdf_path)
            total_chunks = 0

            for page in pages:
                chunks = text_splitter.split_text(page["text"])
                total_chunks += len(chunks)

            print(f"\nDocument: {pdf_path.name}")
            print(f"Pages with extracted text: {len(pages)}")
            print(f"Total chunks: {total_chunks}")
