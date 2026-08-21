"""
CivicLens Phase 5 — RAG Document Extraction, Chunking, Vector Storage, & Retrieval Service
"""

import os
import re
import json
import hashlib
from pathlib import Path
from typing import Optional, List, Dict, Any

from app.config import settings

def find_project_root() -> Path:
    script_path = Path(__file__).resolve()
    current = script_path.parent
    while current != current.parent:
        if current.name == "CivicLens" or (current / "backend").exists():
            return current
        current = current.parent
    return script_path.parent.parent.parent

class RAGService:
    @staticmethod
    def get_document_dirs() -> List[Path]:
        root = find_project_root()
        dirs = [
            root / "backend" / "data" / "documents",
            root / "backend" / "data" / "raw",
            root / "data" / "documents",
            root / "data" / "raw",
        ]
        valid_dirs = []
        for d in dirs:
            if d.exists() and d.is_dir():
                valid_dirs.append(d)
        return valid_dirs

    @staticmethod
    def get_vector_store_path() -> Path:
        root = find_project_root()
        vector_dir = root / "backend" / "data" / "vector_store"
        vector_dir.mkdir(parents=True, exist_ok=True)
        return vector_dir / "vector_index.json"

    @staticmethod
    def extract_year_from_filename(filename: str) -> str:
        m = re.search(r'(\d{4})[-_](\d{4}|\d{2})', filename)
        if m:
            y1, y2 = m.group(1), m.group(2)
            if len(y2) == 2:
                y2 = '20' + y2
            return f"{y1}-{y2}"
        return "2024-2025"

    @staticmethod
    def clean_text(text: str) -> str:
        if not text:
            return ""
        # Remove non-printable or corrupt control characters
        text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
        # Collapse multiple spaces and newlines
        text = re.sub(r'\s+', ' ', text)
        return text.strip()

    @staticmethod
    def chunk_text(
        text: str,
        doc_name: str,
        source_file: str,
        financial_year: str,
        page_number: int,
        chunk_size: int = 600,
        overlap: int = 100
    ) -> List[Dict[str, Any]]:
        chunks = []
        text = RAGService.clean_text(text)
        if not text or len(text) < 20:
            return chunks

        words = text.split(" ")
        current_words = []
        current_len = 0
        chunk_seq = 1

        for word in words:
            current_words.append(word)
            current_len += len(word) + 1
            if current_len >= chunk_size:
                chunk_str = " ".join(current_words)
                doc_slug = re.sub(r'[^a-z0-9]', '_', doc_name.lower()).strip('_')
                chunk_id = f"chk_{doc_slug}_p{page_number}_c{chunk_seq}"
                
                chunks.append({
                    "chunk_id": chunk_id,
                    "text": chunk_str,
                    "document_name": doc_name,
                    "source_file": source_file,
                    "document_type": "Expenditure Profile / Union Budget",
                    "financial_year": financial_year,
                    "page_number": page_number
                })
                chunk_seq += 1
                
                # Maintain overlap
                overlap_words = []
                overlap_len = 0
                for w in reversed(current_words):
                    overlap_words.insert(0, w)
                    overlap_len += len(w) + 1
                    if overlap_len >= overlap:
                        break
                current_words = overlap_words
                current_len = overlap_len

        if current_words:
            chunk_str = " ".join(current_words)
            if len(chunk_str) >= 20:
                doc_slug = re.sub(r'[^a-z0-9]', '_', doc_name.lower()).strip('_')
                chunk_id = f"chk_{doc_slug}_p{page_number}_c{chunk_seq}"
                chunks.append({
                    "chunk_id": chunk_id,
                    "text": chunk_str,
                    "document_name": doc_name,
                    "source_file": source_file,
                    "document_type": "Expenditure Profile / Union Budget",
                    "financial_year": financial_year,
                    "page_number": page_number
                })

        return chunks

    @staticmethod
    def ingest_documents(max_pages_per_doc: int = 50) -> Dict[str, Any]:
        import pypdf
        doc_dirs = RAGService.get_document_dirs()
        index_file = RAGService.get_vector_store_path()

        processed_docs = 0
        total_pages = 0
        total_chunks = 0
        skipped_docs = 0
        errors = []

        all_chunks = []
        indexed_files = set()

        if index_file.exists():
            try:
                with open(index_file, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
                    all_chunks = existing_data.get("chunks", [])
                    indexed_files = set(existing_data.get("indexed_files", []))
            except Exception:
                all_chunks = []

        for d in doc_dirs:
            for pdf_file in sorted(d.glob("*.pdf")):
                if pdf_file.name in indexed_files:
                    skipped_docs += 1
                    continue

                try:
                    reader = pypdf.PdfReader(pdf_file)
                    num_pages = min(len(reader.pages), max_pages_per_doc)
                    fy = RAGService.extract_year_from_filename(pdf_file.name)
                    doc_chunks_count = 0

                    for p_idx in range(num_pages):
                        page = reader.pages[p_idx]
                        raw_text = page.extract_text()
                        page_num = p_idx + 1
                        
                        page_chunks = RAGService.chunk_text(
                            text=raw_text,
                            doc_name=pdf_file.name,
                            source_file=str(pdf_file),
                            financial_year=fy,
                            page_number=page_num
                        )
                        all_chunks.extend(page_chunks)
                        doc_chunks_count += len(page_chunks)
                        total_pages += 1

                    processed_docs += 1
                    total_chunks += doc_chunks_count
                    indexed_files.add(pdf_file.name)
                except Exception as e:
                    errors.append(f"Error processing {pdf_file.name}: {str(e)}")

        index_payload = {
            "total_documents": len(indexed_files),
            "total_chunks": len(all_chunks),
            "indexed_files": list(indexed_files),
            "chunks": all_chunks
        }

        with open(index_file, "w", encoding="utf-8") as f:
            json.dump(index_payload, f, ensure_ascii=False, indent=2)

        return {
            "documents_processed": processed_docs,
            "pages_processed": total_pages,
            "chunks_created": total_chunks,
            "total_chunks_in_store": len(all_chunks),
            "documents_skipped": skipped_docs,
            "errors": errors,
            "vector_store_path": str(index_file)
        }

    @staticmethod
    def search_documents(
        query: str,
        top_k: int = 5,
        financial_year: Optional[str] = None,
        document_type: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        index_file = RAGService.get_vector_store_path()
        if not index_file.exists():
            # Run lightweight ingestion on demand if index doesn't exist
            RAGService.ingest_documents(max_pages_per_doc=30)

        if not index_file.exists():
            return []

        try:
            with open(index_file, "r", encoding="utf-8") as f:
                data = json.load(f)
                chunks = data.get("chunks", [])
        except Exception:
            return []

        if not chunks:
            return []

        # Filter by financial_year or document_type if provided
        filtered_chunks = chunks
        if financial_year:
            filtered_chunks = [c for c in filtered_chunks if c.get("financial_year") == financial_year]
        if document_type:
            filtered_chunks = [c for c in filtered_chunks if document_type.lower() in c.get("document_type", "").lower()]

        if not filtered_chunks:
            filtered_chunks = chunks  # Fallback to all chunks if filter leaves 0

        # Term-based TF-IDF / Keyword Relevance Scoring
        query_words = set(re.findall(r'\w+', query.lower()))
        scored_chunks = []

        for chk in filtered_chunks:
            txt_lower = chk["text"].lower()
            chk_words = re.findall(r'\w+', txt_lower)
            matches = sum(1 for w in query_words if w in txt_lower)
            if matches == 0:
                continue
                
            score = round(matches / max(len(query_words), 1), 4)
            chk_copy = dict(chk)
            chk_copy["similarity_score"] = score
            scored_chunks.append(chk_copy)

        scored_chunks.sort(key=lambda x: x["similarity_score"], reverse=True)
        return scored_chunks[:top_k]
