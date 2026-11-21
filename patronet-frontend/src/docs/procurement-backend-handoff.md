# PATRONET — Bulk Procurement & AI Negotiation Backend Handoff

This document details the frontend architecture, interfaces, and proposed FastAPI endpoints for the **Bulk Procurement and Autonomous Sourcing** module.

---

## 1. Frontend Routes
- `/procurement`: Bulk request builder workspace (catalogue selection, quantity configuration, customer profile, and delivery requirements).
- `/procurement/:id/progress`: Real-time supplier sourcing and negotiation status monitor.
- `/procurement/:id/offers`: Multi-supplier competitive quotation comparison and offer selection.

---

## 2. Proposed FastAPI Endpoints

### A. Create Procurement Request
- **Method & Path:** `POST /api/v1/procurement/requests`
- **Status:** **PROPOSED — REQUIRES BACKEND CONFIRMATION**
- **Payload:**
```json
{
  "title": "Developer Fleet & Office Hardware",
  "customerType": "business",
  "organizationName": "Acme Technologies Pvt Ltd",
  "deliveryLocation": "Bandra Kurla Complex, Mumbai, Maharashtra - 400051",
  "preferredDeliveryDate": "2026-12-10",
  "targetBudgetPaise": 100000000,
  "notes": "Require GST tax invoice and delivery to Mumbai within 10 business days.",
  "items": [
    { "productId": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "quantity": 10 },
    { "productId": "a12bc34d-56ef-7890-abcd-ef1234567890", "quantity": 10 }
  ]
}
```
- **Response:** `201 Created` returning `ProcurementDetails` object with generated ID (e.g. `PN-BULK-2026-XXXX`).

### B. Get Procurement Request & Progress
- **Method & Path:** `GET /api/v1/procurement/requests/:id/progress` (or `/requests/:id`)
- **Status:** **PROPOSED — REQUIRES BACKEND CONFIRMATION**
- **Response:**
```json
{
  "id": "PN-BULK-2026-4108",
  "title": "Developer Fleet & Office Hardware",
  "status": "offers_received",
  "suppliers": [
    {
      "id": "sup-01",
      "name": "Apex Tech Distribution",
      "isVerified": true,
      "status": "offer_received",
      "lastActivity": "2026-11-21T14:04:00Z"
    }
  ],
  "items": [...],
  "catalogueSubtotalPaise": 108989000
}
```

### C. Get Supplier Offers
- **Method & Path:** `GET /api/v1/procurement/requests/:id/offers`
- **Status:** **PROPOSED — REQUIRES BACKEND CONFIRMATION**
- **Response:** Array of `SupplierOffer` objects detailing `offeredTotalPaise`, `subtotalPaise`, `shippingPaise`, `taxPaise`, `isPriceComplete`, `deliveryDaysEstimate`, and line item breakdowns.

### D. Select an Offer
- **Method & Path:** `POST /api/v1/procurement/requests/:id/offers/:offerId/select`
- **Status:** **PROPOSED — REQUIRES BACKEND CONFIRMATION**
- **Response:**
```json
{
  "success": true,
  "procurementId": "PN-BULK-2026-4108",
  "selectedOfferId": "off-apex-01",
  "message": "Selected offer from Apex Tech Distribution."
}
```

---

## 3. Pending Backend Workflow Responsibilities
1. **Supplier Relationship & Distributor Auth**: Managing registered suppliers, verifying authorized distributor tiers, and GST numbers in PostgreSQL.
2. **Kafka Event Topics**:
   - `procurement.requests.created`: Dispatched when customer submits an RFQ.
   - `procurement.negotiations.updated`: Emitted as supplier bots or human managers respond.
   - `procurement.offers.submitted`: Emitted when quotes arrive.
3. **Gemini Autonomous Negotiation**: Automating RFQ structuring, delivery milestone negotiation, and counteroffer resolution within customer budget parameters.
4. **Order Conversion**: Transitioning an approved supplier quotation into an official B2B Purchase Order / GST invoice during checkout.
