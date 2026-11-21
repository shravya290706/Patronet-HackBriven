# PATRONET — Intelligent E-Commerce Platform

> **Live Demo (Stable Deployment):** [https://zealhackbriven.vercel.app](https://zealhackbriven.vercel.app)  
> **Backend API Service:** [https://patronet-backend.onrender.com](https://patronet-backend.onrender.com)  
> **Interactive API Docs (Swagger):** [https://patronet-backend.onrender.com/docs](https://patronet-backend.onrender.com/docs)

---

## 📌 Repository Provenance & Submission Note

- **Submission Repository:** This codebase contains the finalized, audited, and enhanced implementation of PATRONET with completed backend and frontend integrations, database migrations, real shopping cart & wishlist persistence, OpenSearch typo-tolerant search with autocomplete, and all **3 Core USPs** (Comparor, Negotiator, Shopping Buddy).
- **Live Demo Reference:** The hosted demo linked above ([zealhackbriven.vercel.app](https://zealhackbriven.vercel.app)) represents the stable live demonstration deployment. To preserve availability and stability during evaluation, the live cloud deployment has been maintained independently and has not been altered or redeployed during this submission audit.

---

## 🚀 Overview & Key Highlights

PATRONET is a high-performance modern e-commerce platform built for hardware discovery, transparent multi-tier B2B/B2C transactions, and automated conversational commerce. It combines a curated catalogue with enterprise cloud infrastructure (Aiven PostgreSQL, Apache Kafka, and OpenSearch) and three core AI-driven USPs.

---

## 🌟 The 3 Core USPs (Unique Selling Propositions)

### 1. ⚖️ COMPAROR (Intelligent Product Comparison)
- **Multi-Product Matrix**: Compare up to 4 hardware products side by side across technical specifications, pricing, brand, and stock status.
- **Automated "Best Value Pick"**: Algorithmic scoring evaluating price competitiveness against specification depth to recommend the optimal purchase.
- **Dynamic Pros & Cons**: Automatic identification of product advantages (e.g. lowest price point, high RAM capacity, in-stock readiness) and considerations (higher price tier, limited stock) using real catalogue attributes.
- **Difference Highlighting**: Interactive toggle to isolate and highlight attributes that differ across the compared hardware.
- **Executive Comparison Summary**: Generates a clear verdict summarizing price spread and technical trade-offs.

### 2. 🤝 NEGOTIATOR (Smart Price Bargaining Engine)
- **Interactive Bargain Studio**: Customers can negotiate prices directly from product detail pages or the dedicated showcase.
- **3-Round Bargaining Engine**: Evaluates offers in real time against distributor wholesale margins:
  - **Instant Acceptance ($\ge 90\%$)**: Automatically approves offers meeting wholesale discount thresholds.
  - **Reasoned Counteroffers ($70\% - 90\%$)**: Generates automated counteroffers with pricing explanations.
  - **Low-Offer Rejection ($< 70\%$)**: Protects minimum advertised price (MAP) with guidance on viable offers.
- **Server-Side Price Validation**: Agreed prices are cryptographically and database-locked in negotiation sessions. When added to the cart, the backend validates session legitimacy and enforces the negotiated price.

### 3. 🛍️ SHOPPING BUDDY (AI Shopping Assistant)
- **Conversational Hardware Search**: Natural language assistant understanding user intents, budget constraints, and technical requirements.
- **Intent & Budget Parsing**: Extracts budgets (e.g., *"under ₹3,000"*, *"below 50k"*), technical workloads (*"programming"*, *"gaming"*, *"Docker"*), and category synonyms.
- **Rich In-Chat Product Recommendations**: Renders visual product cards directly in the conversation with prices, specifications, matching rationale badges, and direct *"Add to Cart"* actions.
- **Self-Contained Local Pipeline**: Fully operational on the verified 48-item catalogue without mandatory external paid LLM dependencies, ensuring reliable uptime and zero-latency recommendations.

---

## 🏗️ Architecture & Technology Stack

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                           PATRONET PLATFORM                             │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
           ┌─────────────────────────┴─────────────────────────┐
           ▼                                                   ▼
┌───────────────────────┐                           ┌─────────────────────┐
│   patronet-frontend   │                           │  patronet-backend   │
│ (React + Vite + TS)   │                           │      (FastAPI)      │
└───────────────────────┘                           └─────────────────────┘
           │                                                   │
           │  RESTful API Client                               ├── /api/v1/auth
           │  (Centralized Base URL)                           ├── /api/v1/products
           │                                                   ├── /api/v1/categories
           └──────────────────────────────────────────────────►├── /api/v1/cart
                                                               ├── /api/v1/wishlist
                                                               ├── /api/v1/search
                                                               ├── /api/v1/negotiations
                                                               └── /api/v1/assistant
                                                                       │
           ┌───────────────────────────────────────────────────────────┴───────────────────────────────┐
           ▼                                                           ▼                               ▼
┌─────────────────────────────┐                         ┌─────────────────────────────┐ ┌─────────────────────────────┐
│      Aiven PostgreSQL       │                         │       Aiven OpenSearch      │ │        Aiven Kafka          │
│  - Relational Database      │                         │  - Typo-Tolerant Search     │ │  - Event-Driven Streaming   │
│  - Products & Categories    │                         │  - Search Autocomplete      │ │  - Order Events Topic       │
│  - Cart & Wishlist Storage  │                         │  - Multi-tier Field Boosts  │ │  - Async Message Outbox     │
│  - Negotiation Sessions     │                         │  - Graceful PG Fallback     │ │  - Decoupled Notification   │
└─────────────────────────────┘                         └─────────────────────────────┘ └─────────────────────────────┘
```

### Frontend Stack
- **Framework**: React 18 with TypeScript and Vite
- **Styling**: Tailwind CSS with custom design tokens
- **Routing**: React Router v6
- **State & Contexts**: CartContext, WishlistContext, ComparisonContext, AuthContext
- **UI Icons & Notifications**: Lucide React, Sonner toasts

### Backend Stack
- **Framework**: FastAPI (Python 3.11+)
- **ORM**: SQLAlchemy with Psycopg 3
- **Data Validation**: Pydantic v2
- **Authentication**: JWT Bearer tokens with passlib / bcrypt

### Cloud Data Infrastructure (Aiven)
- **Aiven PostgreSQL**: Primary transactional datastore for the 48 active products, 6 categories, user accounts, persistent customer carts, wishlist items, and price negotiation sessions.
- **Aiven OpenSearch**: Real-time product search engine with multi-tier field boosting (`name^6`, `brand^4`, `description^2`), prefix autocomplete (`/api/v1/search/suggest`), and typo tolerance (`fuzziness="AUTO"`).
- **Aiven Apache Kafka**: Event-driven architecture connecting order and cart events via SASL_SSL topics (`patronet.order.events`).

---

## 📁 Repository Structure

```text
patronet/
├── patronet-backend/              # FastAPI Application
│   ├── app/
│   │   ├── api/                   # API routers and endpoints
│   │   │   ├── routes/            # auth, cart, products, categories, search, wishlist, negotiation, assistant
│   │   │   └── router.py          # Central API v1 router mount
│   │   ├── core/                  # config.py, database.py, security.py
│   │   ├── models/                # SQLAlchemy database models
│   │   ├── repositories/          # Database query abstractions
│   │   ├── schemas/               # Pydantic request and response schemas
│   │   └── services/              # Business logic (cart, negotiation, search, assistant)
│   ├── requirements.txt           # Python dependencies
│   ├── .env.example               # Backend environment template
│   └── main.py                    # Server runner
│
├── patronet-frontend/             # React + TypeScript + Vite Application
│   ├── src/
│   │   ├── components/            # UI, layout, products, search, negotiation
│   │   ├── context/               # AuthContext, CartContext, WishlistContext, ComparisonContext
│   │   ├── pages/                 # Storefront pages, ComparePage, AIShoppingPage, ProcurementPage
│   │   ├── services/              # API client and service adapters
│   │   └── types/                 # TypeScript interfaces
│   ├── package.json               # Node.js dependencies & scripts
│   ├── .env.example               # Frontend environment template
│   └── vite.config.ts             # Vite configuration
│
├── .env.example                   # Monorepo configuration template
├── README.md                      # Platform documentation
└── LICENSE                        # MIT License
```

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js (v18+) & npm
- Python (v3.11+) & pip
- (Optional) Running local PostgreSQL / OpenSearch or connection to Aiven Cloud instances

---

### Backend Setup

1. **Navigate to the backend directory:**
   ```powershell
   cd patronet-backend
   ```

2. **Create and activate a virtual environment:**
   ```powershell
   # Windows PowerShell:
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```

3. **Install dependencies:**
   ```powershell
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   ```powershell
   Copy-Item .env.example .env
   # Edit .env to set your database and service credentials
   ```

5. **Start the FastAPI server:**
   ```powershell
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```
   The backend API will be available at `http://localhost:8000`.  
   Interactive Swagger docs: `http://localhost:8000/docs`.

---

### Frontend Setup

1. **Navigate to the frontend directory:**
   ```powershell
   cd patronet-frontend
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Configure environment variables:**
   ```powershell
   Copy-Item .env.example .env
   # In development, VITE_API_BASE_URL defaults to http://localhost:8000/api/v1
   ```

4. **Start the Vite development server:**
   ```powershell
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

5. **Run production build verification:**
   ```powershell
   npm run build
   ```

---

## 🧪 Verified Integration Points

- **Authentication**: JWT token issuance, session restoration (`/auth/me`), password hashing.
- **Shopping Cart**: Real database-backed persistence per customer; stock decrement verification; negotiated price inclusion.
- **Wishlist**: Real database-backed persistence; instant toggle and counter updates.
- **Search & Autocomplete**: OpenSearch integration with fuzzy matching and debounced autocomplete dropdown (`/search/suggest`).
- **Comparor**: Side-by-side multi-attribute matrix, Best Value determination, pros/cons generation, difference highlighting.
- **Negotiator**: Multi-round stateful bargaining, counteroffer math, server-side validated cart additions.
- **Shopping Buddy**: Budget parsing, natural language hardware intent extraction, rich in-chat recommendation cards.

---

## 📄 License
This project is licensed under the MIT License.
