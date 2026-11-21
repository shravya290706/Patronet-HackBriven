# PATRONET Backend

Modular, scalable FastAPI backend for PATRONET — an e-commerce platform transitioning traditional retail into modern online retail operations.

> **Live Demo Reference:** [https://patronet-backend.onrender.com](https://patronet-backend.onrender.com)  
> **Interactive Swagger Documentation:** [https://patronet-backend.onrender.com/docs](https://patronet-backend.onrender.com/docs)

---

## Architecture & Directory Structure

```text
patronet-backend/
├── app/
│   ├── __init__.py           # Application package marker
│   ├── main.py               # FastAPI application factory and setup
│   ├── core/
│   │   ├── __init__.py       # Core package exports
│   │   ├── config.py         # Centralized configuration (env-based, defaults)
│   │   ├── database.py       # SQLAlchemy engine and session factory
│   │   └── security.py       # Password hashing & JWT token issuance
│   ├── api/
│   │   ├── __init__.py       # API router exports
│   │   ├── router.py         # Central /api/v1 router mount
│   │   └── routes/           # Versioned endpoint routers
│   │       ├── health.py     # GET /api/health
│   │       ├── auth.py       # /api/v1/auth (register, login, me)
│   │       ├── products.py   # /api/v1/products (list, detail, pagination)
│   │       ├── categories.py # /api/v1/categories (list with counts)
│   │       ├── cart.py       # /api/v1/cart (persistent customer cart)
│   │       ├── wishlist.py   # /api/v1/wishlist (persistent customer wishlist)
│   │       ├── search.py     # /api/v1/search & /api/v1/search/suggest (OpenSearch)
│   │       ├── negotiation.py# /api/v1/negotiations (USP 2: Bargain engine)
│   │       └── assistant.py  # /api/v1/assistant (USP 3: Shopping Buddy)
│   ├── models/               # SQLAlchemy models (Customer, Cart, Wishlist, Product, Category, Negotiation)
│   ├── schemas/              # Pydantic schemas for requests and responses
│   ├── services/             # Core business logic (CartService, WishlistService, NegotiationService, AssistantService, SearchService)
│   └── repositories/         # Database access layer
├── main.py                   # Server runner script
├── requirements.txt          # Python project dependencies
├── .env.example              # Environment variables template
└── README.md                 # Backend documentation
```

---

## Environment Configuration

Configuration is managed via environment variables and loaded automatically from `.env`, falling back to sensible local defaults defined in `app/core/config.py`.

To configure local overrides, copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

Key configuration groups:
- **Server**: `HOST` (0.0.0.0), `PORT` (8000), `DEBUG` (true)
- **CORS**: `CORS_ORIGINS` (comma-separated origins including `https://zealhackbriven.vercel.app`)
- **Authentication**: `JWT_SECRET_KEY`, `JWT_ALGORITHM`, `ACCESS_TOKEN_EXPIRE_MINUTES`
- **Database (Aiven PostgreSQL)**: `DATABASE_URL`
- **Search (Aiven OpenSearch)**: `OPENSEARCH_HOST`, `OPENSEARCH_PORT`, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD`, `OPENSEARCH_USE_SSL`, `OPENSEARCH_INDEX_NAME`
- **Events (Aiven Kafka)**: `KAFKA_BOOTSTRAP_SERVERS`, `KAFKA_SECURITY_PROTOCOL`, `KAFKA_USERNAME`, `KAFKA_PASSWORD`, `KAFKA_ORDER_EVENTS_TOPIC`

---

## Setup & Running the Server

### 1. Activate the Virtual Environment (Windows PowerShell)

```powershell
.\venv\Scripts\Activate.ps1
```

### 2. Install Dependencies

```powershell
pip install -r requirements.txt
```

### 3. Run the Server

```powershell
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

---

## API Endpoints Reference

| Category | Method | Endpoint | Description |
|---|---|---|---|
| **System** | `GET` | `/` | Root API status |
| **System** | `GET` | `/api/health` | Health check endpoint |
| **Auth** | `POST` | `/api/v1/auth/register` | Customer account registration |
| **Auth** | `POST` | `/api/v1/auth/login` | Customer login & JWT issuance |
| **Auth** | `GET` | `/api/v1/auth/me` | Current authenticated customer profile |
| **Products** | `GET` | `/api/v1/products` | Paginated product listing & filters |
| **Products** | `GET` | `/api/v1/products/{id}` | Product detail with inventory |
| **Categories** | `GET` | `/api/v1/categories` | Categories with active product counts |
| **Cart** | `GET` | `/api/v1/cart` | Get customer shopping cart |
| **Cart** | `POST` | `/api/v1/cart/items` | Add item to cart (supports negotiated price) |
| **Cart** | `PATCH` | `/api/v1/cart/items/{id}` | Update item quantity |
| **Cart** | `DELETE` | `/api/v1/cart/items/{id}` | Remove item from cart |
| **Cart** | `DELETE` | `/api/v1/cart` | Clear cart |
| **Wishlist** | `GET` | `/api/v1/wishlist` | Get customer wishlist items |
| **Wishlist** | `POST` | `/api/v1/wishlist/items` | Add item to wishlist |
| **Wishlist** | `DELETE` | `/api/v1/wishlist/items/{id}` | Remove item from wishlist |
| **Search** | `GET` | `/api/v1/search` | OpenSearch typo-tolerant product search |
| **Search** | `GET` | `/api/v1/search/suggest` | Search autocomplete & spelling corrections |
| **USP 2** | `POST` | `/api/v1/negotiations/start` | Start price bargaining session |
| **USP 2** | `GET` | `/api/v1/negotiations/{id}` | Get bargaining session state |
| **USP 2** | `POST` | `/api/v1/negotiations/{id}/offer` | Submit proposed offer |
| **USP 2** | `POST` | `/api/v1/negotiations/{id}/accept-counter` | Accept seller counteroffer |
| **USP 3** | `POST` | `/api/v1/assistant/chat` | AI Shopping Buddy conversational discovery |
| **USP 3** | `GET` | `/api/v1/assistant/suggestions` | Suggested prompt queries |
