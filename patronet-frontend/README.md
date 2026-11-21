# PATRONET Frontend

Modern e-commerce storefront for PATRONET, built with React, TypeScript, Vite, and Tailwind CSS.

> **Live Demo Reference:** [https://zealhackbriven.vercel.app](https://zealhackbriven.vercel.app)

---

## Features

- **Storefront**: High-performance catalogue browsing across 6 curated categories and 48 verified hardware products.
- **Intelligent Search**: OpenSearch autocomplete dropdown with debouncing, category/brand suggestions, and typo-tolerant search.
- **USP 1 — Comparor**: Side-by-side technical specification matrix comparing up to 4 products with automated Best Value calculation, pros/cons breakdown, and difference highlighting.
- **USP 2 — Negotiator**: Interactive price bargaining studio modal with multi-round counteroffers and cart checkout at negotiated rates.
- **USP 3 — Shopping Buddy**: Conversational assistant (`/ai-shopping`) parsing natural language workloads, budgets, and hardware needs with rich in-chat recommendation cards.
- **Customer Account & Security**: Full JWT authentication, profile restoration, persistent database-backed cart, and customer wishlist.

---

## Environment Configuration

Configuration is managed via Vite environment variables. Copy `.env.example` to `.env`:

```powershell
Copy-Item .env.example .env
```

| Variable | Description | Default |
|---|---|---|
| `VITE_API_BASE_URL` | Backend API base URL ending with `/api/v1` | `http://localhost:8000/api/v1` (in dev) |
| `VITE_USE_MOCK_API` | Set `true` to use mock offline adapters; `false` for live FastAPI backend | `false` |

> **Note on Production:** In production builds (`import.meta.env.PROD`), the client requires `VITE_API_BASE_URL` (or `VITE_API_URL`) to be set in your deployment environment (e.g. Vercel dashboard). It will not fall back to `localhost:8000` in production.

---

## Local Setup & Scripts

```powershell
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Run type check and production build
npm run build

# Preview production build locally
npm run preview
```
