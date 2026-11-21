# PATRONET Backend

Modular, scalable FastAPI backend foundation for PATRONET — an e-commerce platform transitioning traditional retail into modern online retail operations.

## Architecture & Directory Structure

```text
patronet-backend/
├── app/
│   ├── __init__.py           # Application package marker
│   ├── main.py               # FastAPI application factory and setup
│   ├── core/
│   │   ├── __init__.py       # Core package exports
│   │   └── config.py         # Centralized configuration (env-based, defaults)
│   ├── api/
│   │   ├── __init__.py       # API router exports
│   │   ├── router.py         # Top-level API router and /api/v1 prefix mount
│   │   └── routes/
│   │       ├── __init__.py   # Route definitions package marker
│   │       └── health.py     # GET /api/health endpoint
│   ├── models/
│   │   └── __init__.py       # Database models (PostgreSQL / ORM - Phase 2+)
│   ├── schemas/
│   │   ├── __init__.py       # Pydantic schemas exports
│   │   └── health.py         # Response schema for health check
│   ├── services/
│   │   └── __init__.py       # Business logic layer (Phase 2+)
│   ├── repositories/
│   │   └── __init__.py       # Data access layer (Phase 2+)
│   └── utils/
│       └── __init__.py       # Shared helper utilities
├── main.py                   # Root entrypoint for uvicorn or direct python run
├── requirements.txt          # Python project dependencies
├── .env.example              # Environment variables template
└── README.md                 # Backend documentation
```

## Environment Configuration

Configuration is managed via environment variables and loaded automatically from a `.env` file if present, falling back to sensible local defaults defined in `app/core/config.py`.

To configure local overrides, copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Key configuration options:
- `HOST`: Server bind address (default: `0.0.0.0`)
- `PORT`: Server port (default: `8000`)
- `DEBUG`: Enable debug mode and auto-reload (default: `true`)
- `CORS_ORIGINS`: Comma-separated allowed CORS origins (default: `http://localhost:5173,http://127.0.0.1:5173`)
- `DATABASE_URL`: PostgreSQL connection string (prepared for future phases)
- `KAFKA_BOOTSTRAP_SERVERS`: Apache Kafka connection (prepared for future phases)
- `OPENSEARCH_URL`: OpenSearch endpoint (prepared for future phases)

## Setup & Running the Server

### 1. Activate the Virtual Environment (Windows PowerShell)

From the `patronet-backend` directory:

```powershell
.\venv\Scripts\Activate.ps1
```

*(If script execution is restricted on Windows, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` before activating).*

### 2. Install Dependencies (if not already installed)

```powershell
pip install -r requirements.txt
```

### 3. Run the Server

From the `patronet-backend` directory, choose any of the following commands:

**Standard Uvicorn command:**
```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Alternative module invocation:**
```powershell
python -m uvicorn app.main:app --reload
```

**Direct Python runner:**
```powershell
python main.py
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Root endpoint displaying basic API status and links |
| `GET` | `/api/health` | Service health status check |
| `GET` | `/docs` | Interactive Swagger API documentation |
| `GET` | `/redoc` | Interactive ReDoc API documentation |
| `GET` | `/openapi.json` | OpenAPI 3.0 JSON schema |

## Swagger Documentation URL

Once the server is running, access Swagger UI in your browser at:
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
