# CivicLens Backend - FastAPI Foundation, Analysis Engine, Agentic AI Investigation, RAG & Citizen Budget Assistant

Intelligent Government Budget Transparency Platform backend API built with Python, FastAPI, SQLAlchemy, PostgreSQL, RAG Vector Search, and Citizen Budget Assistant Router.

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI Application Entrypoint
│   ├── config.py            # Pydantic BaseSettings Configuration
│   ├── database.py          # SQLAlchemy Connection & Session Management
│   ├── models/
│   │   └── budget.py        # SQLAlchemy ORM Model for budget_records
│   ├── schemas/
│   │   ├── budget.py        # Budget record & summary response schemas
│   │   ├── analysis.py      # Trend, comparison, and anomaly schemas
│   │   ├── investigation.py # Agentic AI investigation schemas
│   │   ├── rag.py           # RAG search & document chunk schemas
│   │   └── assistant.py     # Citizen Budget Assistant response schemas
│   ├── routers/
│   │   ├── budgets.py       # Core budget query endpoints
│   │   ├── analysis.py      # Analysis & Anomaly Detection endpoints
│   │   ├── investigations.py # Agentic AI Investigation endpoints
│   │   ├── rag.py           # RAG Document Search & Retrieval endpoints
│   │   └── assistant.py     # Citizen Budget Assistant endpoints
│   └── services/
│       ├── budget_service.py # Data access layer for raw budget records
│       ├── analysis_service.py # Deterministic YoY analysis & anomaly engine
│       ├── investigation_service.py # Goal-driven investigation agent workflow
│       ├── rag_service.py   # PDF text extraction, chunking, and vector index
│       └── assistant_service.py # Natural language intent router & orchestrator
├── data/
│   ├── raw/                 # Official Indian Union Budget PDF documents (2020-2025)
│   ├── documents/           # Target directory for additional official PDFs
│   ├── processed/
│   │   └── master_budget.csv# Cleaned 26,585 record master dataset
│   └── vector_store/
│       └── vector_index.json# Persistent RAG document vector store
├── scripts/
│   ├── inspect_csv.py       # CSV inspection utility
│   ├── prepare_budget_data.py # Data normalization script
│   ├── validate_master_data.py # Master dataset validation report
│   ├── import_to_postgres.py# Database loading helper
│   └── ingest_documents.py  # PDF text extraction & RAG vector indexer
├── sql/
│   └── create_budget_table.sql # PostgreSQL DDL Schema Script
├── .env.example             # Template environment variables
├── requirements.txt         # Required Python packages
└── DATA_PIPELINE.md         # Comprehensive data pipeline documentation
```

## Quick Start Guide

### 1. Install Dependencies
```bash
pip install -r backend/requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp backend/.env.example backend/.env
```

### 3. Ingest Official PDF Documents (Phase 5 RAG)
Place official Indian Government Union Budget PDFs in `backend/data/raw/` or `backend/data/documents/` and run:
```bash
python backend/scripts/ingest_documents.py
```

### 4. Start FastAPI Server
```bash
uvicorn app.main:app --reload --port 8000
```
Or from the root directory:
```bash
python -m uvicorn app.main:app --reload --port 8000
```

### 5. Interactive API Documentation
Open your browser to:
- Swagger Docs: http://localhost:8000/docs
- ReDoc Docs: http://localhost:8000/redoc

## API Endpoints Overview

### Health & Exploration (Phase 2)
- `GET /health`: Server & Database connection status
- `GET /api/budgets`: Query budget records with search, filter, and pagination
- `GET /api/budgets/summary`: Aggregate statistics and financial totals
- `GET /api/budgets/filters`: Distinct dropdown choices for frontend filters
- `GET /api/budgets/{record_id}`: Single record detail by ID

### Analysis & Anomaly Detection (Phase 3)
- `GET /api/analysis/trends/{budget_item_key}`: Year-over-year trend for a specific budget item
- `GET /api/analysis/compare`: Side-by-side comparison between two financial years
- `GET /api/anomalies`: Detect spending spikes and drops across all budget items (default threshold: 20%)
- `GET /api/anomalies/{budget_item_key}`: Anomaly history & trend for a single budget item

### Agentic AI Investigation (Phase 4)
- `POST /api/investigations`: Trigger a goal-driven agent investigation for a budget item anomaly
- `GET /api/investigations/{budget_item_key}`: Get step-by-step investigation logs, grounded explanation, and source references
- `POST /api/investigations/{budget_item_key}/auto`: Auto-trigger investigation for a detected anomaly

### RAG Document Retrieval (Phase 5)
- `GET /api/rag/search`: Search official government budget documents semantically
- `POST /api/rag/search`: POST search payload for RAG document retrieval
- `POST /api/rag/ingest`: Trigger document ingestion and vector index update

### RAG-Based Citizen Budget Assistant (Phase 6)
- `POST /api/assistant/ask`: Ask natural language questions; routes intent to DB, Analysis, Anomalies, Investigation, or RAG
- `GET /api/assistant/health`: Health status of Assistant dependencies (Database, Vector Store, LLM provider)
