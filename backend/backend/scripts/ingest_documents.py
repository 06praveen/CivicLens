"""
CivicLens Phase 5 — RAG PDF Document Ingestion Script

Extracts text page-by-page from official budget PDF documents, splits text into
structured chunks with page & financial year metadata, and persists the vector index.
"""

import sys
from pathlib import Path

# Add backend root to sys.path
backend_root = Path(__file__).resolve().parent.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.services.rag_service import RAGService

def main():
    print("=" * 60)
    print("CIVICLENS RAG DOCUMENT INGESTION PIPELINE")
    print("=" * 60)
    
    doc_dirs = RAGService.get_document_dirs()
    print("Document Search Directories:")
    for d in doc_dirs:
        print(f"  - {d}")
    print()

    print("Starting document extraction & indexing...")
    summary = RAGService.ingest_documents(max_pages_per_doc=100)
    
    print("-" * 60)
    print(f"Documents Processed: {summary['documents_processed']}")
    print(f"Pages Processed:     {summary['pages_processed']}")
    print(f"Chunks Created:      {summary['chunks_created']}")
    print(f"Total Chunks In Store: {summary['total_chunks_in_store']}")
    print(f"Documents Skipped:   {summary['documents_skipped']}")
    if summary['errors']:
        print(f"Errors ({len(summary['errors'])}):")
        for err in summary['errors']:
            print(f"  - {err}")
    print(f"Vector Store Index:  {summary['vector_store_path']}")
    print("=" * 60)

if __name__ == "__main__":
    main()
